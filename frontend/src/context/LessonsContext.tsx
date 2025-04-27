import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { lessonsService, progressService } from '../services/api';
import { toast } from 'react-toastify';

// Define lesson types
interface Lesson {
  id: string;
  title: string;
  description: string;
  category: string;
  iconColor: string;
  difficulty: string;
  level?: string;
  estimatedTime: number;
  xpPoints: number;
  progress: number;
  score?: number;
  completedAt?: Date;
  skills?: string[];
  content?: string;
  imageUrl?: string;
}

// Define user progress type
interface UserProgress {
  lessonsCompleted: number;
  practiceMinutes: number;
  fluencyScore: number;
  weeklyGoal: {
    current: number;
    target: number;
  };
  streak: {
    current: number;
    longest: number;
    lastPracticeDate: Date;
  };
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  type: 'streak' | 'completion' | 'score' | 'practice';
  color: string;
}

// Create more granular loading states
interface LoadingState {
  data: boolean;
  lessonAction: boolean;
  progress: boolean;
}

interface LessonsContextType {
  recentLessons: Lesson[];
  recommendedLessons: Lesson[];
  allLessons: Lesson[];
  userProgress: UserProgress;
  isLoading: boolean;
  isLessonActionLoading: boolean;
  isProgressUpdating: boolean;
  startLesson: (lessonId: string) => Promise<void>;
  resumeLesson: (lessonId: string) => Promise<void>;
  completeLesson: (lessonId: string, score: number) => Promise<void>;
  updateWeeklyGoal: (newTarget: number) => Promise<void>;
  recordDailyPractice: (minutes: number) => Promise<void>;
}

// Create context
const LessonsContext = createContext<LessonsContextType | undefined>(undefined);

// Default user progress
const defaultUserProgress: UserProgress = {
  lessonsCompleted: 0,
  practiceMinutes: 0,
  fluencyScore: 0,
  weeklyGoal: {
    current: 0,
    target: 5,
  },
  streak: {
    current: 0,
    longest: 0,
    lastPracticeDate: new Date(),
  },
  achievements: [],
};

// Provider component
export const LessonsProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [loadingState, setLoadingState] = useState<LoadingState>({
    data: false,
    lessonAction: false,
    progress: false
  });
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>(defaultUserProgress);

  // Load lessons and user progress when authenticated
  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated) {
        setLoadingState(prev => ({ ...prev, data: true }));
        try {
          // Fetch lessons
          const lessonsResponse = await lessonsService.getAllLessons();
          if (lessonsResponse.success && lessonsResponse.data) {
            setLessons(lessonsResponse.data);
          }
          
          // Fetch user progress
          await loadUserProgress();
          
        } catch (error) {
          console.error('Error loading lessons data:', error);
          // Fall back to local storage data if available
          const storedProgress = localStorage.getItem('userProgress');
          if (storedProgress) {
            try {
              const parsedProgress = JSON.parse(storedProgress);
              setUserProgress(parsedProgress);
            } catch (e) {
              console.error('Failed to parse stored progress:', e);
            }
          }
        } finally {
          setLoadingState(prev => ({ ...prev, data: false }));
        }
      } else {
        // Clear lessons when not authenticated
        setLessons([]);
        
        // Try to load from localStorage if available
        const storedProgress = localStorage.getItem('userProgress');
        if (storedProgress) {
          try {
            const parsedProgress = JSON.parse(storedProgress);
            setUserProgress(parsedProgress);
          } catch (e) {
            // If parsing fails, use default progress
            setUserProgress(defaultUserProgress);
          }
        } else {
          setUserProgress(defaultUserProgress);
        }
      }
    };
    
    loadData();
  }, [isAuthenticated]);
  
  // Load user progress function
  const loadUserProgress = async () => {
    setLoadingState(prev => ({ ...prev, progress: true }));
    try {
      const progressResponse = await progressService.getUserProgress();
      console.log('User progress response from API:', progressResponse);
      
      if (progressResponse.success && progressResponse.data) {
        console.log('Setting user progress with weekly goal:', progressResponse.data.weeklyGoal);
        setUserProgress(progressResponse.data);
        
        // Store a copy in localStorage as backup
        localStorage.setItem('userProgress', JSON.stringify(progressResponse.data));
      } else {
        // If no data returned from API, check localStorage first
        const storedProgress = localStorage.getItem('userProgress');
        if (storedProgress) {
          try {
            const parsedProgress = JSON.parse(storedProgress);
            setUserProgress(parsedProgress);
          } catch (e) {
            // If parsing fails, use default progress
            setUserProgress(defaultUserProgress);
          }
        } else {
          // If not in localStorage either, use default
          setUserProgress(defaultUserProgress);
        }
      }
    } catch (error) {
      console.error('Error loading user progress:', error);
      // Fall back to localStorage
      const storedProgress = localStorage.getItem('userProgress');
      if (storedProgress) {
        try {
          const parsedProgress = JSON.parse(storedProgress);
          setUserProgress(parsedProgress);
        } catch (e) {
          setUserProgress(defaultUserProgress);
        }
      } else {
        setUserProgress(defaultUserProgress);
      }
    } finally {
      setLoadingState(prev => ({ ...prev, progress: false }));
    }
  };

  // Get recent lessons (those with progress > 0)
  const recentLessons = lessons
    .filter(lesson => lesson.progress > 0)
    .sort((a, b) => {
      // Sort by completedAt date if completed, otherwise by progress percentage (descending)
      if (a.completedAt && b.completedAt) {
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      } else if (a.completedAt) {
        return -1;
      } else if (b.completedAt) {
        return 1;
      } else {
        return b.progress - a.progress;
      }
    })
    .slice(0, 5);

  // Get recommended lessons (those with progress === 0)
  const recommendedLessons = lessons
    .filter(lesson => lesson.progress === 0)
    .sort(() => Math.random() - 0.5) // Randomize order
    .slice(0, 3); // Limit to 3 lessons

  // Start a new lesson
  const startLesson = async (lessonId: string) => {
    setLoadingState(prev => ({ ...prev, lessonAction: true }));
    toast.info("Starting lesson...");
    
    try {
      const response = await lessonsService.startLesson(lessonId);
      
      if (response.success && response.data) {
        // Update lessons array with the new progress
        setLessons(prevLessons => 
          prevLessons.map(lesson => 
            lesson.id === lessonId 
              ? { ...lesson, progress: response.data.progress } 
              : lesson
          )
        );
        
        toast.success("Lesson started successfully");
      } else {
        toast.error("Failed to start lesson");
      }
    } catch (error) {
      console.error('Error starting lesson:', error);
      toast.error("Error starting lesson. Please try again.");
    } finally {
      setLoadingState(prev => ({ ...prev, lessonAction: false }));
    }
  };

  // Resume a lesson
  const resumeLesson = async (lessonId: string) => {
    setLoadingState(prev => ({ ...prev, lessonAction: true }));
    toast.info("Loading your progress...");
    
    try {
      const response = await lessonsService.getLesson(lessonId);
      
      if (response.success && response.data) {
        // In a real app, we would use this data to resume the lesson
        toast.success("Lesson loaded successfully");
      } else {
        toast.error("Failed to load lesson");
      }
    } catch (error) {
      console.error('Error resuming lesson:', error);
      toast.error("Error loading lesson. Please try again.");
    } finally {
      setLoadingState(prev => ({ ...prev, lessonAction: false }));
    }
  };

  // Complete a lesson
  const completeLesson = async (lessonId: string, score: number) => {
    setLoadingState(prev => ({ ...prev, lessonAction: true }));
    
    try {
      const response = await lessonsService.completeLesson(lessonId, score);
      
      if (response.success && response.data) {
        console.log('API Response after completing lesson:', response.data);
        // Update lessons array with immutable pattern
        setLessons(prevLessons => 
          prevLessons.map(lesson => 
            lesson.id === lessonId 
              ? { 
                  ...lesson, 
                  progress: 100, 
                  score,
                  completedAt: new Date()
                } 
              : lesson
          )
        );
        
        // Update user progress
        console.log('Updating user progress with:', response.data.progress);
        console.log('Weekly goal value in response:', response.data.progress?.weeklyGoal);
        setUserProgress(response.data.progress);
        
        // Show achievement notifications if any were unlocked
        if (response.data.achievementsUnlocked && response.data.achievementsUnlocked.length > 0) {
          response.data.achievementsUnlocked.forEach((achievement: Achievement, index: number) => {
            setTimeout(() => {
              toast.success(`🏆 Achievement unlocked: ${achievement.name}`, {
                icon: "🏆" as any
              });
            }, 1000 * (index + 1)); // Stagger notifications
          });
        }
        
        toast.success(`Lesson completed with a score of ${score}%!`);
      } else {
        toast.error("Failed to complete lesson");
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast.error("Error completing lesson. Please try again.");
    } finally {
      setLoadingState(prev => ({ ...prev, lessonAction: false }));
    }
  };

  // Update weekly goal
  const updateWeeklyGoal = async (newTarget: number) => {
    // Validate input
    if (newTarget < 1 || newTarget > 7) {
      toast.error('Weekly goal must be between 1 and 7 days');
      return Promise.reject(new Error('Invalid weekly goal value'));
    }
    
    setLoadingState(prev => ({ ...prev, progress: true }));
    
    try {
      // Optimistically update UI
      const updatedProgress = {
        ...userProgress,
        weeklyGoal: {
          ...userProgress.weeklyGoal,
          target: newTarget
        }
      };
      
      setUserProgress(updatedProgress);
      localStorage.setItem('userProgress', JSON.stringify(updatedProgress));
      
      // Send update to server
      const response = await progressService.updateWeeklyGoal(newTarget);
      
      if (response.success) {
        toast.success(`Weekly goal updated to ${newTarget} days`);
      } else {
        // If server update fails, revert to previous state
        throw new Error('Failed to update weekly goal');
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating weekly goal:', error);
      toast.error('Failed to update weekly goal');
      
      // Revert to previous state
      await loadUserProgress();
      
      return Promise.reject(error);
    } finally {
      setLoadingState(prev => ({ ...prev, progress: false }));
    }
  };
  
  // Record daily practice
  const recordDailyPractice = async (minutes: number) => {
    setLoadingState(prev => ({ ...prev, progress: true }));
    toast.info("Recording practice session...");
    
    try {
      const response = await progressService.recordDailyPractice(minutes);
      console.log('Record daily practice response:', response);
      
      if (response.success && response.data) {
        // Update the ENTIRE user progress object to ensure all fields are updated
        setUserProgress(response.data);
        toast.success(`Recorded ${minutes} minutes of practice!`);
      } else {
        toast.error("Failed to record practice session");
      }
    } catch (error) {
      console.error('Error recording practice:', error);
      toast.error("Error recording practice. Please try again.");
    } finally {
      setLoadingState(prev => ({ ...prev, progress: false }));
    }
  };

  const value = {
    recentLessons,
    recommendedLessons,
    allLessons: lessons,
    userProgress,
    isLoading: loadingState.data,
    isLessonActionLoading: loadingState.lessonAction,
    isProgressUpdating: loadingState.progress,
    startLesson,
    resumeLesson,
    completeLesson,
    updateWeeklyGoal,
    recordDailyPractice
  };

  return (
    <LessonsContext.Provider value={value}>
      {children}
    </LessonsContext.Provider>
  );
};

// Custom hook to use lessons context
export const useLessons = (): LessonsContextType => {
  const context = useContext(LessonsContext);
  if (context === undefined) {
    throw new Error('useLessons must be used within a LessonsProvider');
  }
  return context;
}; 