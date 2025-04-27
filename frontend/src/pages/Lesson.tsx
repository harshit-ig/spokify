import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLessons } from '../context/LessonsContext';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import AIChat from '../components/AIChat';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatRelativeTime } from '../utils/dateUtils';

// Format date utility function
const formatDate = (dateString: string | Date) => {
  if (!dateString) return 'Unknown';
  return formatRelativeTime(dateString);
};

// Simple LessonCard component definition
const LessonCard = ({ lesson }: { lesson: any }) => {
  return (
    <Link
      to={`/lessons/${lesson.id}`}
      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 flex flex-col h-full"
    >
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{lesson.title}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">{lesson.description}</p>
        
        <div className="mt-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress: {lesson.progress || 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full"
              style={{ width: `${lesson.progress || 0}%` }}
            ></div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const Lesson = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { allLessons, completeLesson, isLoading } = useLessons();
  const { user } = useAuth();
  
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [userResponses, setUserResponses] = useState<string[]>([]);
  const [aiResponses, setAiResponses] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [conversationScores, setConversationScores] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [relatedLessons, setRelatedLessons] = useState<any[]>([]);
  const [showChat, setShowChat] = useState(false);
  
  // Mock conversation stages for interactive lessons
  const conversationStages = [
    {
      prompt: "Hello! I'm your AI speaking partner. How are you feeling today?",
      expectedTopics: ["feelings", "mood", "day"],
      aiResponses: [
        "That's great to hear! Could you tell me about your plans for the weekend?",
        "I'm sorry to hear that. Would you like to talk about something that might cheer you up?",
        "Interesting! Could you elaborate a bit more on that?"
      ]
    },
    {
      prompt: "Let's practice describing things. Can you describe your favorite place to visit?",
      expectedTopics: ["place", "location", "visit", "favorite", "like"],
      aiResponses: [
        "That sounds like a wonderful place! What do you enjoy most about it?",
        "I'd love to visit there someday. What makes this place special to you?",
        "Great description! Is there a specific memory you have from this place?"
      ]
    },
    {
      prompt: "Now, let's try using past tense. What did you do yesterday?",
      expectedTopics: ["went", "visited", "watched", "ate", "met", "worked", "studied"],
      aiResponses: [
        "That sounds like a productive day! Did you enjoy it?",
        "Interesting! Is that something you do regularly?",
        "Tell me more about that experience. Was it what you expected?"
      ]
    }
  ];
  
  useEffect(() => {
    if (lessonId && allLessons.length > 0) {
      const lesson = allLessons.find(l => l.id === lessonId);
      if (lesson) {
        // Add mock content if none exists
        if (!lesson.content || lesson.content.trim() === '') {
          const mockContent = generateMockLessonContent(lesson.title, lesson.level || 'intermediate');
          lesson.content = mockContent;
        }
        
        setCurrentLesson(lesson);
        // Set initial progress
        setProgress(lesson.progress || 0);
        // Initialize with the first AI prompt
        setAiResponses([conversationStages[0].prompt]);
        // Set page title
        document.title = `${lesson.title} | Spokify`;
      } else {
        navigate('/lessons');
      }
    }
    
    // Cleanup function to reset title
    return () => {
      document.title = 'Spokify';
    };
  }, [lessonId, allLessons, navigate]);
  
  // Function to generate mock lesson content
  const generateMockLessonContent = (title: string, level: string) => {
    const difficultyText = {
      'beginner': 'For beginners starting their language journey',
      'intermediate': 'For intermediate learners with basic knowledge',
      'advanced': 'For advanced learners refining their skills'
    };
    
    return `
    <div class="lesson-compact h-full flex flex-col">
      <div class="mb-3 border-l-4 border-indigo-500 pl-3 py-1">
        <h2 class="text-lg font-bold">${title}</h2>
        <p class="text-xs text-gray-600 dark:text-gray-300">${difficultyText[level as keyof typeof difficultyText]}</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 flex-grow">
        <div class="bg-gray-50 dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700 flex flex-col">
          <h3 class="text-sm font-bold mb-2 flex items-center">
            <span class="bg-indigo-500 text-white w-5 h-5 rounded-full flex items-center justify-center mr-2 text-xs">1</span>
            Overview
          </h3>
          <p class="text-xs">Practice conversation about "${title.toLowerCase()}" to improve fluency and build confidence in real-world situations.</p>
        </div>
        
        <div class="bg-gray-50 dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700 flex flex-col">
          <h3 class="text-sm font-bold mb-2 flex items-center">
            <span class="bg-indigo-500 text-white w-5 h-5 rounded-full flex items-center justify-center mr-2 text-xs">2</span>
            Key Vocabulary
          </h3>
          <ul class="text-xs list-disc list-inside space-y-1">
            <li><strong>Conversation</strong>: structured dialog</li>
            <li><strong>Fluency</strong>: speaking smoothly</li>
            <li><strong>Expression</strong>: conveying thoughts</li>
          </ul>
        </div>
        
        <div class="bg-gray-50 dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700 flex flex-col">
          <h3 class="text-sm font-bold mb-2 flex items-center">
            <span class="bg-indigo-500 text-white w-5 h-5 rounded-full flex items-center justify-center mr-2 text-xs">3</span>
            Practice Tips
          </h3>
          <ul class="text-xs list-disc list-inside space-y-1">
            <li>Respond in complete sentences</li>
            <li>Use topic-related vocabulary</li>
            <li>Ask follow-up questions</li>
          </ul>
        </div>
        
        <div class="bg-gray-50 dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700 flex flex-col">
          <h3 class="text-sm font-bold mb-2 flex items-center">
            <span class="bg-indigo-500 text-white w-5 h-5 rounded-full flex items-center justify-center mr-2 text-xs">4</span>
            Success Criteria
          </h3>
          <ul class="text-xs list-disc list-inside space-y-1">
            <li>Maintain a 2-minute conversation</li>
            <li>Use at least 3 vocabulary words</li>
            <li>Ask at least 1 question</li>
          </ul>
        </div>
      </div>
      
      <div class="text-center mt-auto mb-3">
        <p class="inline-block bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-xs">
          <span class="font-medium">Ready?</span> Start practicing with our AI →
        </p>
      </div>
    </div>
    `;
  };
  
  // Handle AI chat conversation completion
  const handleAIChatComplete = (transcript: string, conversationScore: number) => {
    // Add the user's response
    setUserResponses(prev => [...prev, transcript]);
    
    // Randomly select an AI response from the current stage
    const randomIndex = Math.floor(Math.random() * conversationStages[currentStage].aiResponses.length);
    const aiResponse = conversationStages[currentStage].aiResponses[randomIndex];
    setAiResponses(prev => [...prev, aiResponse]);
    
    // Record the score
    setConversationScores(prev => [...prev, conversationScore]);
    
    // Wait for a second before moving to next stage (if not the last stage)
      setTimeout(() => {
      if (currentStage < conversationStages.length - 1) {
        setCurrentStage(prevStage => prevStage + 1);
        // Show stage progress toast
        toast.info(`Stage ${currentStage + 1} completed! Moving to stage ${currentStage + 2}.`, {
          autoClose: 2000
        });
        } else {
        // Calculate final score as an average of all conversation scores
        const finalScore = Math.round(
          conversationScores.reduce((sum, score) => sum + score, conversationScore) / 
          (conversationScores.length + 1)
        );
        setScore(finalScore);
            setIsCompleting(true);
        // Celebrate completion
        toast.success("Conversation complete! Great job!", {
          icon: "🎉" as any
        });
        }
      }, 1000);
  };
  
  // Handle lesson completion
  const handleCompleteLesson = () => {
    if (!lessonId) return;
    
    // Normalize score to be out of 100
    const normalizedScore = Math.min(Math.round((score / (conversationStages.length * 10)) * 100), 100);
    
    setIsSubmitting(true);
    toast.info("Saving your progress...");
    
    try {
      // Complete the lesson
      completeLesson(lessonId, normalizedScore);
      
      // Add a delay to simulate server processing
      setTimeout(() => {
        toast.success(`Lesson completed with a score of ${normalizedScore}%!`);
        
        // Show achievement notifications with delays to make them more noticeable
        if (normalizedScore >= 90) {
          setTimeout(() => {
            toast.success("🏆 Achievement unlocked: High Scorer!", {
              icon: "🏆" as any
            });
          }, 1000);
        } else if (normalizedScore >= 75) {
          setTimeout(() => {
            toast.success("🌟 Achievement unlocked: Great Progress!", {
              icon: "🌟" as any
            });
          }, 1000);
        }
        
        // Navigate back to dashboard after completion
        setTimeout(() => {
          setIsSubmitting(false);
          navigate('/dashboard');
        }, 2000);
      }, 1500);
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast.error('Failed to complete lesson. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  // Handle exit confirmation
  const handleExitLesson = () => {
    if (userResponses.length > 0 && !isCompleting) {
      setShowExitConfirmation(true);
    } else {
      navigate('/lessons');
    }
  };
  
  // Handle confirmed exit from lesson
  const handleConfirmedExit = () => {
    // Close the confirmation modal
    setShowExitConfirmation(false);
    // Navigate to lessons page
    navigate('/lessons');
  };
  
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };
  
  const markAsComplete = () => {
    setProgress(100);
    handleCompleteLesson();
  };
  
  const saveNotes = () => {
    // Implementation of saving notes
  };
  
  const toggleChat = () => {
    setShowChat(!showChat);
  };
  
  if (isLoading || !currentLesson) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-600 dark:text-gray-300 mt-4">Loading your lesson...</p>
        </div>
      </div>
    );
  }
  
  // Mobile chat view
  if (showChat && window.innerWidth < 768) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col">
        {/* Mobile header */}
        <div className="bg-white dark:bg-gray-800 shadow-md py-3 px-4 flex items-center">
          <button 
            onClick={toggleChat}
            className="mr-3 text-gray-600 dark:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex-1 truncate">
            {currentLesson.title} - Practice
          </h2>
        </div>
        
        {/* Full screen chat */}
        <div className="flex-1 h-[calc(100%-60px)] overflow-hidden">
          <AIChat 
            isActive={true}
            promptText={`Let's practice ${currentLesson.title}`} 
            difficulty={(currentLesson.level || 'intermediate').toLowerCase()}
            className="h-full"
            onConversationComplete={handleAIChatComplete}
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Top Navigation Bar */}
      <div className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center">
              <button
              onClick={() => navigate('/dashboard')}
              className="mr-3 text-gray-600 dark:text-gray-300"
              aria-label="Back to dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
              </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[60%]">
              {currentLesson.title}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            {/* Progress indicator */}
            <div className="hidden sm:flex items-center mr-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Progress</span>
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-1">
                <div 
                  className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{progress}%</span>
            </div>
            
            {progress < 100 ? (
              <button
                onClick={markAsComplete}
                disabled={isSubmitting}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  isSubmitting 
                    ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isSubmitting ? 'Saving...' : 'Complete'}
              </button>
            ) : (
              <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded text-sm font-medium">
                Completed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar - Mobile only */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-sm sm:hidden">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Progress</span>
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{progress}%</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
                        </div>

      <div className="container mx-auto px-4 py-4">
        {/* Desktop layout - Side by side with sticky info */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column - Lesson content - more compact with reduced margins */}
          <div className="lg:w-3/5">
            {/* Lesson Info Card - More compact */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-4">
              <div className="p-3 flex flex-col md:flex-row">
                {currentLesson.imageUrl && (
                  <div className="md:w-1/4 h-32 md:h-auto relative overflow-hidden rounded-md">
                    <img 
                      src={currentLesson.imageUrl} 
                      alt={currentLesson.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className={`${currentLesson.imageUrl ? 'md:w-3/4 md:pl-4 pt-2 md:pt-0' : 'w-full'}`}>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {currentLesson.level && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        currentLesson.level === 'beginner' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : currentLesson.level === 'intermediate' 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {currentLesson.level.charAt(0).toUpperCase() + currentLesson.level.slice(1)}
                      </span>
                    )}
                    {currentLesson.category && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full text-xs font-medium">
                        {currentLesson.category.charAt(0).toUpperCase() + currentLesson.category.slice(1)}
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-xs font-medium flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {currentLesson.estimatedTime || 15} min
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{currentLesson.title}</h2>
                  <p className="text-gray-600 dark:text-gray-300 text-xs mb-1 line-clamp-2 md:line-clamp-none">{currentLesson.description}</p>
                  
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(currentLesson.createdAt)}
                    </span>
                    {currentLesson.views && (
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {currentLesson.views} views
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Lesson Content - With max height and scrolling */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Lesson Content</h3>
                <div 
                  className="prose dark:prose-invert prose-indigo max-w-none prose-sm lg:prose-sm max-h-[calc(100vh-280px)] overflow-y-auto pr-2"
                  dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                />
              </div>
            </div>
          </div>
                
          {/* Right column - AI chat (desktop) or chat button (mobile) */}
          <div className="lg:w-2/5">
            {/* Desktop chat */}
            <div className="hidden md:block sticky top-16">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="border-b border-gray-200 dark:border-gray-700 py-2 px-3 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    AI Conversation Partner
                  </h3>
                  {isCompleting && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium rounded-full">
                      Complete
                    </span>
                  )}
                </div>
                <div className="h-[calc(100vh-130px)] overflow-hidden">
                  <AIChat 
                    isActive={true}
                    promptText={`Let's practice ${currentLesson.title}`} 
                    difficulty={(currentLesson.level || 'intermediate').toLowerCase()}
                    className="h-full"
                    onConversationComplete={handleAIChatComplete}
                  />
                </div>
              </div>
            </div>
            
            {/* Mobile chat button */}
            <div className="md:hidden">
              <button
                onClick={toggleChat}
                className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg transition-colors z-30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
          
          {/* Exit confirmation modal */}
          {showExitConfirmation && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 dark:bg-gray-800 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                        <svg className="h-6 w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                          Exit Lesson?
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Your progress in this lesson will not be saved. Are you sure you want to exit?
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      onClick={handleConfirmedExit}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                    >
                      Exit Lesson
                    </button>
                    <button
                      onClick={() => setShowExitConfirmation(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
        </div>
      )}
    </div>
  );
};

export default Lesson; 