import { Request, Response } from 'express';
import Lesson, { ILesson } from '../models/Lesson';
import UserLesson, { IUserLesson } from '../models/UserLesson';
import UserProgress from '../models/UserProgress';
import { getInitialLessons } from '../utils/mockData';
import mongoose from 'mongoose';

// Helper function to check if we should reset the weekly goal
const shouldResetWeeklyGoal = (lastResetDate: Date): boolean => {
  const now = new Date();
  const daysSinceReset = (now.getTime() - lastResetDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // Reset if more than 7 days have passed or if we're in a different week
  // (considering Monday as the first day of the week)
  const lastDay = lastResetDate.getDay() || 7; // Convert Sunday (0) to 7
  const currentDay = now.getDay() || 7; // Convert Sunday (0) to 7
  
  // Reset if we've passed a Monday since the last reset
  return daysSinceReset >= 7 || (currentDay < lastDay);
};

// @desc    Get all lessons
// @route   GET /api/lessons
// @access  Private
export const getAllLessons = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore - req.user is added by auth middleware
    const userId = req.user.id;
    
    // Check if we need to seed lessons
    const lessonsCount = await Lesson.countDocuments();
    
    if (lessonsCount === 0) {
      // Seed initial lessons
      const initialLessons = getInitialLessons();
      await Lesson.insertMany(initialLessons);
    }
    
    // Get all lessons
    const lessons = await Lesson.find({ isActive: true });
    
    // Get user progress for these lessons
    const userLessons = await UserLesson.find({ 
      user: userId,
      lesson: { $in: lessons.map(lesson => lesson._id as unknown as mongoose.Types.ObjectId) }
    });
    
    // Map lessons with progress
    const lessonsWithProgress = lessons.map(lesson => {
      const userLesson = userLessons.find(ul => 
        (ul.lesson as unknown as mongoose.Types.ObjectId).toString() === 
        (lesson._id as unknown as mongoose.Types.ObjectId).toString()
      );
      
      return {
        id: lesson._id,
        title: lesson.title,
        description: lesson.description,
        category: lesson.category,
        iconColor: lesson.iconColor,
        difficulty: lesson.difficulty,
        estimatedTime: lesson.estimatedTime,
        xpPoints: lesson.xpPoints,
        skills: lesson.skills,
        progress: userLesson ? userLesson.progress : 0,
        score: userLesson?.score,
        completedAt: userLesson?.completedAt
      };
    });
    
    res.status(200).json({
      success: true,
      data: lessonsWithProgress
    });
  } catch (error) {
    console.error('Error getting lessons:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single lesson
// @route   GET /api/lessons/:id
// @access  Private
export const getLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore - req.user is added by auth middleware
    const userId = req.user.id;
    const lessonId = req.params.id;
    
    // Get lesson
    const lesson = await Lesson.findById(lessonId);
    
    if (!lesson) {
      res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
      return;
    }
    
    // Get user progress for this lesson
    let userLesson = await UserLesson.findOne({
      user: userId,
      lesson: lessonId
    });
    
    const response = {
      id: lesson._id,
      title: lesson.title,
      description: lesson.description,
      category: lesson.category,
      iconColor: lesson.iconColor,
      difficulty: lesson.difficulty,
      estimatedTime: lesson.estimatedTime,
      xpPoints: lesson.xpPoints,
      skills: lesson.skills,
      content: lesson.content,
      progress: userLesson ? userLesson.progress : 0,
      score: userLesson?.score,
      completedAt: userLesson?.completedAt,
      currentStage: userLesson ? userLesson.currentStage : 0,
      userResponses: userLesson ? userLesson.userResponses : []
    };
    
    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error getting lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Start or resume a lesson
// @route   POST /api/lessons/:id/start
// @access  Private
export const startLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore - req.user is added by auth middleware
    const userId = req.user.id;
    const lessonId = req.params.id;
    
    // Get lesson
    const lesson = await Lesson.findById(lessonId);
    
    if (!lesson) {
      res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
      return;
    }
    
    // Find or create user lesson progress
    let userLesson = await UserLesson.findOne({
      user: userId,
      lesson: lessonId
    });
    
    if (!userLesson) {
      userLesson = await UserLesson.create({
        user: userId,
        lesson: lessonId,
        progress: 5, // Initial progress
        currentStage: 0,
        userResponses: [],
        startedAt: new Date(),
        lastAccessedAt: new Date()
      });
    } else {
      // Just update last accessed time
      userLesson.lastAccessedAt = new Date();
      await userLesson.save();
    }
    
    // Return the lesson with user progress
    const response = {
      id: lesson._id as unknown as mongoose.Types.ObjectId,
      title: lesson.title,
      description: lesson.description,
      category: lesson.category,
      iconColor: lesson.iconColor,
      difficulty: lesson.difficulty,
      estimatedTime: lesson.estimatedTime,
      xpPoints: lesson.xpPoints,
      skills: lesson.skills,
      content: lesson.content,
      progress: userLesson.progress,
      score: userLesson.score,
      completedAt: userLesson.completedAt,
      currentStage: userLesson.currentStage,
      userResponses: userLesson.userResponses
    };
    
    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error starting lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update lesson progress with user response
// @route   POST /api/lessons/:id/response
// @access  Private
export const submitResponse = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore - req.user is added by auth middleware
    const userId = req.user.id;
    const lessonId = req.params.id;
    const { response } = req.body;
    
    if (!response) {
      res.status(400).json({
        success: false,
        message: 'Response is required'
      });
      return;
    }
    
    // Get lesson
    const lesson = await Lesson.findById(lessonId);
    
    if (!lesson) {
      res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
      return;
    }
    
    // Find user lesson progress
    let userLesson = await UserLesson.findOne({
      user: userId,
      lesson: lessonId
    });
    
    if (!userLesson) {
      userLesson = await UserLesson.create({
        user: userId,
        lesson: lessonId,
        progress: 5, // Initial progress
        currentStage: 0,
        userResponses: [response],
        startedAt: new Date(),
        lastAccessedAt: new Date()
      });
    } else {
      // Add response and advance stage
      userLesson.userResponses.push(response);
      
      // Calculate progress based on stages completed
      if (userLesson.currentStage < lesson.content.stages.length - 1) {
        userLesson.currentStage += 1;
        
        // Calculate progress percentage
        const totalStages = lesson.content.stages.length;
        const progress = Math.floor(((userLesson.currentStage + 1) / totalStages) * 90);
        userLesson.progress = Math.min(progress, 90); // Cap at 90% until completed
      } else {
        // Last stage completed but not yet marked as complete
        userLesson.progress = 90;
      }
      
      userLesson.lastAccessedAt = new Date();
      await userLesson.save();
    }
    
    // Select AI response
    let aiResponse = "";
    if (userLesson.currentStage < lesson.content.stages.length) {
      // Simple algorithm to select a response
      const stage = lesson.content.stages[userLesson.currentStage - 1];
      if (stage) {
        // Get random response
        const responseIndex = Math.floor(Math.random() * stage.aiResponses.length);
        aiResponse = stage.aiResponses[responseIndex];
      }
    }
    
    // Get next prompt if available
    let nextPrompt = "";
    if (userLesson.currentStage < lesson.content.stages.length) {
      nextPrompt = lesson.content.stages[userLesson.currentStage].prompt;
    } else {
      // Send completion message if at last stage
      nextPrompt = "Great job! You've completed this conversation practice. Let's see how you did.";
    }
    
    res.status(200).json({
      success: true,
      data: {
        currentStage: userLesson.currentStage,
        progress: userLesson.progress,
        aiResponse,
        nextPrompt,
        isLastStage: userLesson.currentStage >= lesson.content.stages.length
      }
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Complete a lesson
// @route   POST /api/lessons/:id/complete
// @access  Private
export const completeLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore - req.user is added by auth middleware
    const userId = req.user.id;
    const lessonId = req.params.id;
    const { score } = req.body;
    
    if (score === undefined || score < 0 || score > 100) {
      res.status(400).json({
        success: false,
        message: 'Valid score is required (0-100)'
      });
      return;
    }
    
    // Get lesson
    const lesson = await Lesson.findById(lessonId);
    
    if (!lesson) {
      res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
      return;
    }
    
    // Find user lesson progress
    let userLesson = await UserLesson.findOne({
      user: userId,
      lesson: lessonId
    });
    
    if (!userLesson) {
      res.status(404).json({
        success: false,
        message: 'User has not started this lesson'
      });
      return;
    }
    
    // Update user lesson progress
    userLesson.progress = 100;
    userLesson.score = score;
    userLesson.completedAt = new Date();
    userLesson.lastAccessedAt = new Date();
    await userLesson.save();
    
    // Update user overall progress
    let userProgress = await UserProgress.findOne({ user: userId });
    
    if (!userProgress) {
      // Create default user progress if it doesn't exist
      userProgress = await UserProgress.create({
        user: userId,
        lessonsCompleted: 1,
        practiceMinutes: lesson.estimatedTime,
        fluencyScore: score,
        weeklyGoal: {
          current: 1,
          target: 5,
          lastResetDate: new Date()
        },
        streak: {
          current: 1,
          longest: 1,
          lastPracticeDate: new Date()
        }
      });
    } else {
      // Update overall progress
      userProgress.lessonsCompleted += 1;
      userProgress.practiceMinutes += lesson.estimatedTime;
      
      // Calculate new fluency score (weighted average)
      const oldTotalScore = userProgress.fluencyScore * (userProgress.lessonsCompleted - 1);
      const newFluencyScore = Math.round((oldTotalScore + score) / userProgress.lessonsCompleted);
      userProgress.fluencyScore = newFluencyScore;
      
      // Update practice tracking for today
      const lastPracticeDate = new Date(userProgress.streak.lastPracticeDate);
      const today = new Date();
      
      const isAlreadyPracticedToday = (
        lastPracticeDate.getFullYear() === today.getFullYear() &&
        lastPracticeDate.getMonth() === today.getMonth() &&
        lastPracticeDate.getDate() === today.getDate()
      );
      
      console.log('Last practice date:', lastPracticeDate);
      console.log('Today:', today);
      console.log('Already practiced today?', isAlreadyPracticedToday);
      
      // If last practice was not today (comparing just the date part)
      if (!isAlreadyPracticedToday) {
        // Check if this is consecutive day (yesterday)
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (
          lastPracticeDate.getFullYear() === yesterday.getFullYear() &&
          lastPracticeDate.getMonth() === yesterday.getMonth() &&
          lastPracticeDate.getDate() === yesterday.getDate()
        ) {
          // Consecutive day, increase streak
          userProgress.streak.current += 1;
          
          // Update longest streak if current is longer
          if (userProgress.streak.current > userProgress.streak.longest) {
            userProgress.streak.longest = userProgress.streak.current;
          }
        } else {
          // Not consecutive, reset streak
          userProgress.streak.current = 1;
        }
        
        // Check if we need to reset the weekly goal counter
        if (!userProgress.weeklyGoal.lastResetDate) {
          userProgress.weeklyGoal.lastResetDate = new Date();
          userProgress.weeklyGoal.current = 1; // Reset to 1 since they're practicing today
        } else if (shouldResetWeeklyGoal(userProgress.weeklyGoal.lastResetDate)) {
          // Reset the counter if it's a new week
          userProgress.weeklyGoal.current = 1; // Reset to 1 since they're practicing today
          userProgress.weeklyGoal.lastResetDate = new Date();
        } else {
          // Increment weekly goal counter
          userProgress.weeklyGoal.current += 1;
          if (userProgress.weeklyGoal.current > 7) {
            userProgress.weeklyGoal.current = 7;
          }
        }
        
        // Update last practice date
        userProgress.streak.lastPracticeDate = today;
      }
      
      // Check for achievements
      let achievementsUnlocked = [];
      
      // Check if perfect score
      if (score >= 95 && !userProgress.achievements.find(a => a.id === '4')?.unlocked) {
        const perfectScoreAchievement = userProgress.achievements.find(a => a.id === '4');
        if (perfectScoreAchievement) {
          perfectScoreAchievement.unlocked = true;
          perfectScoreAchievement.unlockedAt = new Date();
          achievementsUnlocked.push(perfectScoreAchievement);
        }
      }
      
      // Check lesson category achievements
      const categoryMap: { [key: string]: string } = {
        'conversation': '5', // Conversation Master achievement id
        'grammar': '6',      // Grammar Guru achievement id
      };
      
      if (lesson.category in categoryMap) {
        const achievementId = categoryMap[lesson.category];
        const categoryAchievement = userProgress.achievements.find(a => a.id === achievementId);
        
        if (categoryAchievement && !categoryAchievement.unlocked) {
          // Check if user has completed 5 lessons in this category
          const completedLessonsInCategory = await UserLesson.countDocuments({
            user: userId,
            completedAt: { $exists: true },
            lesson: { 
              $in: (await Lesson.find({ category: lesson.category }))
                .map(l => l._id as unknown as mongoose.Types.ObjectId) 
            }
          });
          
          if (completedLessonsInCategory >= 5) {
            categoryAchievement.unlocked = true;
            categoryAchievement.unlockedAt = new Date();
            achievementsUnlocked.push(categoryAchievement);
          }
        }
      }
      
      // Check practice time achievements
      if (userProgress.practiceMinutes >= 600 && !userProgress.achievements.find(a => a.id === '8')?.unlocked) {
        const practiceAchievement = userProgress.achievements.find(a => a.id === '8');
        if (practiceAchievement) {
          practiceAchievement.unlocked = true;
          practiceAchievement.unlockedAt = new Date();
          achievementsUnlocked.push(practiceAchievement);
        }
      }
      
      await userProgress.save();
      
      res.status(200).json({
        success: true,
        data: {
          progress: userProgress,
          achievementsUnlocked
        }
      });
    }
  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 