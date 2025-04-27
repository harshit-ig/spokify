import { useLessons } from '../../context/LessonsContext';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime } from '../../utils/dateUtils';
import { useState } from 'react';
import { toast } from 'react-toastify';

const OverviewTab = ({ 
  handleStartLesson, 
  handleResumeLesson 
}: { 
  handleStartLesson: (lessonId: string) => void;
  handleResumeLesson: (lessonId: string) => void;
}) => {
  const { recentLessons, recommendedLessons, userProgress, updateWeeklyGoal } = useLessons();
  const navigate = useNavigate();
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalValue, setGoalValue] = useState(userProgress.weeklyGoal.target);
  const [isUpdating, setIsUpdating] = useState(false);

  // Handle saving the new weekly goal
  const handleSaveGoal = () => {
    setIsUpdating(true);
    
    // Simulate backend call with a timeout
    setTimeout(() => {
      updateWeeklyGoal(goalValue);
      setShowGoalModal(false);
      setIsUpdating(false);
      toast.success(`Weekly goal updated to ${goalValue} days`);
    }, 600);
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Main Content - 2/3 width on md screens and up */}
      <div className="md:col-span-2 space-y-6">
        {/* Progress Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">Your Progress</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 overflow-hidden rounded-lg">
                <div className="px-4 py-5 sm:p-6 text-center">
                  <dt className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                    Lessons Completed
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-indigo-800 dark:text-indigo-300">
                    {userProgress.lessonsCompleted}
                  </dd>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 overflow-hidden rounded-lg">
                <div className="px-4 py-5 sm:p-6 text-center">
                  <dt className="text-sm font-medium text-green-600 dark:text-green-400 truncate">
                    Practice Minutes
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-green-800 dark:text-green-300">
                    {userProgress.practiceMinutes}
                  </dd>
                </div>
              </div>
              <div className="px-4 py-5 sm:p-6 text-center bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <dt className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                  Fluency Score
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-blue-800 dark:text-blue-300">
                  {userProgress.fluencyScore}<span className="text-lg">%</span>
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Lessons */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">Recent Lessons</h3>
          </div>
          <div className="p-6">
            {recentLessons.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentLessons.map((lesson) => (
                  <li key={lesson.id} className="py-4 px-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-center space-x-4">
                      <div className={`bg-${lesson.iconColor}-100 dark:bg-${lesson.iconColor}-900/30 rounded-full p-2`}>
                        <svg className={`h-6 w-6 text-${lesson.iconColor}-600 dark:text-${lesson.iconColor}-400`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {lesson.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {lesson.completedAt ? `Completed ${formatRelativeTime(new Date(lesson.completedAt))}` : 'In progress'} • {lesson.score !== undefined ? `${lesson.score}% correct` : 'Not scored'}
                        </p>
                      </div>
                      <div>
                        <button
                          onClick={() => handleResumeLesson(lesson.id)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                        >
                          Resume
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400">No recent lessons available.</p>
                <button
                  onClick={() => navigate('/lessons')}
                  className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                >
                  Browse All Lessons
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Content - 1/3 width on md screens and up */}
      <div className="space-y-6">
        {/* Recommended Lessons */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">Recommended for You</h3>
          </div>
          <div className="p-6">
            {recommendedLessons.length > 0 ? (
              <div className="space-y-4">
                {recommendedLessons.map((lesson) => (
                  <div key={lesson.id} className={`bg-gradient-to-r from-${lesson.iconColor}-50 to-${lesson.iconColor}-100 dark:from-gray-800 dark:to-gray-750 dark:border dark:border-${lesson.iconColor}-800 rounded-lg p-4`}>
                    <h4 className={`text-sm font-semibold text-${lesson.iconColor}-800 dark:text-${lesson.iconColor}-300`}>{lesson.title}</h4>
                    <p className={`mt-1 text-xs text-${lesson.iconColor}-600 dark:text-gray-300`}>{lesson.description}</p>
                    <button 
                      onClick={() => handleStartLesson(lesson.id)}
                      className={`mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded bg-${lesson.iconColor}-600 text-white hover:bg-${lesson.iconColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${lesson.iconColor}-500 dark:bg-${lesson.iconColor}-700 dark:hover:bg-${lesson.iconColor}-600 dark:focus:ring-offset-gray-900`}
                    >
                      Start
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400">No recommendations available right now.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Weekly Goal */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">Weekly Goal</h3>
          </div>
          <div className="p-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
                <div>
                  <div className="text-2xl font-bold">{userProgress.weeklyGoal.current}/{userProgress.weeklyGoal.target}</div>
                  <div className="text-xs font-medium">days</div>
                </div>
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                {userProgress.weeklyGoal.current >= userProgress.weeklyGoal.target 
                  ? 'Goal completed!' 
                  : userProgress.weeklyGoal.current >= userProgress.weeklyGoal.target / 2 
                    ? 'On track!' 
                    : 'Keep going!'}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">You've practiced {userProgress.weeklyGoal.current} out of {userProgress.weeklyGoal.target} days this week</p>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full" 
                style={{ width: `${(userProgress.weeklyGoal.current / userProgress.weeklyGoal.target) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>0 days</span>
              <span>{userProgress.weeklyGoal.target} days</span>
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowGoalModal(true)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
              >
                Adjust Goal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Goal Adjustment Modal */}
      {showGoalModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowGoalModal(false)}></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                      Adjust Weekly Goal
                    </h3>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Set how many days per week you want to practice. A consistent schedule will help you progress faster.
                      </p>
                      
                      <div className="flex items-center justify-center space-x-4">
                        <span className="text-gray-700 dark:text-gray-300 text-lg w-8 text-center">{goalValue}</span>
                        <div className="w-full flex-1">
                          <input
                            type="range"
                            min="1"
                            max="7"
                            value={goalValue}
                            onChange={(e) => setGoalValue(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="w-full flex justify-between px-2 mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">1</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">2</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">3</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">4</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">5</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">6</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">7</span>
                          </div>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">days</span>
                      </div>
                      
                      <div className="mt-4 text-center">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {goalValue === 7 
                            ? "Wow! You're aiming to practice every day!" 
                            : goalValue >= 5 
                              ? "That's a great goal for consistent progress!" 
                              : goalValue >= 3 
                                ? "A good balanced goal to maintain steady progress."
                                : "Start small and build your habit gradually."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSaveGoal}
                  disabled={isUpdating}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {isUpdating ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  disabled={isUpdating}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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

export default OverviewTab; 