import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useLessons } from '../context/LessonsContext';

// Import dashboard tab components
import OverviewTab from '../components/dashboard/OverviewTab';
import LessonsTab from '../components/dashboard/LessonsTab';
import ProgressTab from '../components/dashboard/ProgressTab';
import SettingsTab from '../components/dashboard/SettingsTab';

// Mock notifications
const mockNotifications = [
  { id: 1, text: "New lesson available: Advanced Conversation Practice", isRead: false, time: "Just now" },
  { id: 2, text: "You've earned a new achievement: 7-Day Streak!", isRead: false, time: "2 hours ago" },
  { id: 3, text: "Don't forget to practice today! Keep your streak going.", isRead: true, time: "Yesterday" },
];

const Dashboard = () => {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'progress' | 'settings'>('overview');
  
  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  
  // Use the LessonsContext for data
  const { 
    recentLessons, 
    recommendedLessons, 
    userProgress, 
    startLesson, 
    resumeLesson,
    isLoading: lessonsLoading 
  } = useLessons();

  // View all notifications modal
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const handleStartLesson = (lessonId: string) => {
    startLesson(lessonId);
    navigate(`/lessons/${lessonId}`);
  };

  const handleResumeLesson = (lessonId: string) => {
    resumeLesson(lessonId);
    navigate(`/lessons/${lessonId}`);
  };
  
  // Handle marking notification as read
  const handleMarkAsRead = (id: number) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };
  
  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, isRead: true }))
    );
  };

  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  // Only show the main loading screen when first loading the auth data
  if (authLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="loading-spinner"></div>
        <p className="ml-3 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent hover:from-indigo-700 hover:to-blue-600 transition duration-150">Spokify</Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span className="sr-only">View notifications</span>
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
                {unreadCount > 0 && (
                  <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500"></div>
                )}
                
                {/* Notification dropdown */}
                {showNotifications && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 dark:divide-gray-700 focus:outline-none z-10">
                    <div className="py-1">
                      <div className="px-4 py-2 flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <button 
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="py-1">
                      {notifications.slice(0, 3).map(notification => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                        >
                          <div className="flex justify-between">
                            <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                              {notification.text}
                            </p>
                            {!notification.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="ml-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{notification.time}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="py-1">
                      <button 
                        onClick={() => {
                          setShowAllNotifications(true);
                          setShowNotifications(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-indigo-600 hover:text-indigo-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                      >
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                    {user?.firstName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.firstName || 'User'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Banner */}
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-8 md:px-10 md:py-12">
              <div className="max-w-4xl">
                <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Welcome back, {user?.firstName || 'User'}!
                </h2>
                <p className="mt-3 text-xl text-indigo-100">
                  Continue your journey to English fluency with personalized lessons and exercises.
                </p>
                <div className="mt-6">
                  <button 
                    onClick={() => {
                      if (recommendedLessons.length > 0) {
                        handleStartLesson(recommendedLessons[0].id);
                      } else if (recentLessons.length > 0) {
                        handleResumeLesson(recentLessons[0].id);
                      }
                    }}
                    disabled={lessonsLoading}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 transition duration-150 transform hover:-translate-y-1 hover:shadow-md"
                  >
                    Start a New Lesson
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Tabs */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${
                  activeTab === 'overview'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('lessons')}
                className={`${
                  activeTab === 'lessons'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Lessons
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`${
                  activeTab === 'progress'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Progress
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`${
                  activeTab === 'settings'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Settings
              </button>
            </nav>
          </div>
          
          {/* Tab content */}
          <div className="mt-6 px-4 sm:px-0 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {/* Only show loading indicator for lessons data if we're not on settings tab */}
            {lessonsLoading && activeTab !== 'settings' ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading content...</span>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <OverviewTab 
                    handleStartLesson={handleStartLesson} 
                    handleResumeLesson={handleResumeLesson} 
                  />
                )}
                {activeTab === 'lessons' && (
                  <LessonsTab handleStartLesson={handleStartLesson} />
                )}
                {activeTab === 'progress' && (
                  <ProgressTab />
                )}
                {activeTab === 'settings' && (
                  <SettingsTab />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* All Notifications Modal */}
      {showAllNotifications && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowAllNotifications(false)}></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                        All Notifications
                      </h3>
                      <button 
                        onClick={handleMarkAllAsRead}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                      >
                        Mark all as read
                      </button>
                    </div>
                    <div className="mt-2 max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                          {notifications.map((notification) => (
                            <li key={notification.id} className={`py-4 ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                              <div className="flex justify-between">
                                <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {notification.text}
                                </p>
                                {!notification.isRead && (
                                  <button
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="ml-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                                  >
                                    Mark read
                                  </button>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{notification.time}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No notifications</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowAllNotifications(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to format relative time (e.g., "2 days ago")
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'today';
  if (diffInDays === 1) return 'yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return `${Math.floor(diffInDays / 30)} months ago`;
}

export default Dashboard; 