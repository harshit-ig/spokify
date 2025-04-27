import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLessons } from '../context/LessonsContext';

const Lessons = () => {
  const navigate = useNavigate();
  const { allLessons, startLesson, isLoading } = useLessons();
  
  const handleStartLesson = (lessonId: string) => {
    startLesson(lessonId);
    navigate(`/lessons/${lessonId}`);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Lessons</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Browse all available lessons and start learning</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
          >
            Back to Dashboard
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 dark:border-indigo-400"></div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {allLessons.map((lesson) => (
              <div 
                key={lesson.id} 
                className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-300"
              >
                {/* Lesson header with difficulty */}
                <div className={`px-4 py-2 flex justify-between items-center bg-${lesson.iconColor}-50 dark:bg-${lesson.iconColor}-900/30`}>
                  <div className={`flex items-center text-${lesson.iconColor}-700 dark:text-${lesson.iconColor}-400 text-sm font-medium`}>
                    <svg className={`h-5 w-5 text-${lesson.iconColor}-500 dark:text-${lesson.iconColor}-400 mr-1.5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {lesson.category === 'conversation' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      )}
                      {lesson.category === 'pronunciation' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      )}
                      {lesson.category === 'grammar' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      )}
                      {lesson.category === 'vocabulary' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      )}
                    </svg>
                    {typeof lesson.category === 'string' ? lesson.category.charAt(0).toUpperCase() + lesson.category.slice(1) : ''}
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                    {lesson.difficulty}
                  </span>
                </div>
                
                {/* Lesson content */}
                <div className="px-6 py-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{lesson.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{lesson.description}</p>
                  
                  {/* Skills covered */}
                  {lesson.skills && lesson.skills.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Skills covered:</p>
                      <div className="flex flex-wrap gap-1">
                        {lesson.skills.map((skill, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Duration and estimated time */}
                  <div className="mt-4 flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <svg className="mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {lesson.estimatedTime} min
                    </div>
                    <div className="flex items-center">
                      <svg className="mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {lesson.xpPoints} XP
                    </div>
                  </div>
                </div>
                
                {/* Lesson footer with progress or completion */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700">
                  {lesson.progress > 0 && lesson.progress < 100 ? (
                    <>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{lesson.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full" style={{ width: `${lesson.progress}%` }}></div>
                      </div>
                      <button
                        onClick={() => handleStartLesson(lesson.id)}
                        className="mt-3 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
                      >
                        Continue
                      </button>
                    </>
                  ) : lesson.progress === 100 ? (
                    <>
                      <div className="flex items-center text-sm text-green-700 dark:text-green-400">
                        <svg className="mr-1.5 h-5 w-5 text-green-500 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Completed with {lesson.score}% score
                      </div>
                      <button
                        onClick={() => handleStartLesson(lesson.id)}
                        className="mt-3 w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
                      >
                        Review Again
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleStartLesson(lesson.id)}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
                    >
                      Start Lesson
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Lessons; 