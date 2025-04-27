import { useLessons } from '../../context/LessonsContext';
import LoadingSpinner from '../common/LoadingSpinner';

const ProgressTab = () => {
  const { userProgress, isProgressUpdating, updateWeeklyGoal } = useLessons();

  // Sample data for charts - in a real app, this would come from the API
  const monthlyActivity = [
    { month: 'Jan', minutes: 120 },
    { month: 'Feb', minutes: 180 },
    { month: 'Mar', minutes: 240 },
    { month: 'Apr', minutes: 300 },
    { month: 'May', minutes: 270 },
    { month: 'Jun', minutes: 330 }
  ];

  const skillProgress = [
    { skill: 'Speaking', level: 7, maxLevel: 10 },
    { skill: 'Listening', level: 8, maxLevel: 10 },
    { skill: 'Grammar', level: 6, maxLevel: 10 },
    { skill: 'Vocabulary', level: 9, maxLevel: 10 },
    { skill: 'Reading', level: 8, maxLevel: 10 },
    { skill: 'Writing', level: 5, maxLevel: 10 }
  ];

  // Calculate weekly progress percentage
  const weeklyProgressPercentage = userProgress 
    ? Math.min(Math.round((userProgress.weeklyGoal.current / userProgress.weeklyGoal.target) * 100), 100)
    : 0;

  // Find max value for scaling chart
  const maxMinutes = Math.max(...monthlyActivity.map(item => item.minutes));

  // Handle changing weekly goal
  const handleChangeWeeklyGoal = async (newGoal: number) => {
    if (newGoal >= 1 && newGoal <= 7) {
      try {
        await updateWeeklyGoal(newGoal);
      } catch (error) {
        console.error('Failed to update weekly goal:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Activity Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Activity Overview</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 overflow-hidden rounded-lg">
              <div className="px-4 py-5 sm:p-6 text-center">
                <dt className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                  Current Streak
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-indigo-800 dark:text-indigo-300">
                  {isProgressUpdating ? (
                    <span className="flex justify-center">
                      <LoadingSpinner size="sm" color="indigo" />
                    </span>
                  ) : (
                    `${userProgress.streak.current} days`
                  )}
                </dd>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 overflow-hidden rounded-lg">
              <div className="px-4 py-5 sm:p-6 text-center">
                <dt className="text-sm font-medium text-green-600 dark:text-green-400 truncate">
                  Longest Streak
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-green-800 dark:text-green-300">
                  {isProgressUpdating ? (
                    <span className="flex justify-center">
                      <LoadingSpinner size="sm" color="green" />
                    </span>
                  ) : (
                    `${userProgress.streak.longest} days`
                  )}
                </dd>
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 overflow-hidden rounded-lg">
              <div className="px-4 py-5 sm:p-6 text-center">
                <dt className="text-sm font-medium text-purple-600 dark:text-purple-400 truncate">
                  Total Practice Time
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-purple-800 dark:text-purple-300">
                  {isProgressUpdating ? (
                    <span className="flex justify-center">
                      <LoadingSpinner size="sm" color="purple" />
                    </span>
                  ) : (
                    `${userProgress.practiceMinutes} mins`
                  )}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Goals Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Weekly Goals</h3>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Weekly Progress: {userProgress.weeklyGoal.current} of {userProgress.weeklyGoal.target} days
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {weeklyProgressPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${weeklyProgressPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Adjust your weekly goal (days per week):
            </p>
            <div className="flex space-x-2">
              {[3, 4, 5, 6, 7].map((goal) => (
                <button
                  key={goal}
                  onClick={() => handleChangeWeeklyGoal(goal)}
                  disabled={isProgressUpdating}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    userProgress.weeklyGoal.target === goal
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                  } transition-colors duration-150`}
                >
                  {goal} days
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Skill Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Skill Progress</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Your current language skill levels across different areas.</p>
          
          <div className="space-y-4">
            {skillProgress.map((skill, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{skill.skill}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Level {skill.level}/{skill.maxLevel}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full" 
                    style={{ width: `${(skill.level / skill.maxLevel) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Achievement Badges */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Achievements</h3>
        </div>
        <div className="p-6">
          {isProgressUpdating ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {userProgress.achievements && userProgress.achievements.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {userProgress.achievements.map((achievement) => (
                    <div 
                      key={achievement.id} 
                      className={`p-4 rounded-lg border ${
                        achievement.unlocked 
                          ? `bg-${achievement.color}-50 dark:bg-${achievement.color}-900/30 border-${achievement.color}-200 dark:border-${achievement.color}-800` 
                          : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                          achievement.unlocked 
                            ? `bg-${achievement.color}-100 dark:bg-${achievement.color}-900 text-${achievement.color}-600 dark:text-${achievement.color}-300` 
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500'
                        }`}>
                          {achievement.unlocked ? '🏆' : '🔒'}
                        </div>
                        <div className="ml-3">
                          <h4 className={`text-sm font-medium ${
                            achievement.unlocked 
                              ? `text-${achievement.color}-800 dark:text-${achievement.color}-300` 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {achievement.name}
                          </h4>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Complete lessons and practice regularly to earn achievements!</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressTab; 