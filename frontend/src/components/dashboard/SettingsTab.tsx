import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// Define types for settings form
interface UserSettings {
  firstName: string;
  lastName: string;
  email: string;
  settings: {
    dailyGoal: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
}

const SettingsTab = () => {
  const { user, isProfileUpdating, updateProfile, isLoading } = useAuth();
  const { isDark } = useTheme();
  
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  // Create a form state based on user data
  const [formValues, setFormValues] = useState<UserSettings>({
    firstName: '',
    lastName: '',
    email: '',
    settings: {
      dailyGoal: 20,
      difficulty: 'intermediate',
      notifications: {
        email: true,
        push: true,
        sms: false
      }
    }
  });

  // Add debugging to see user data
  useEffect(() => {
    console.log('User data in SettingsTab:', user);
  }, [user]);

  // Update form values when user data is loaded
  useEffect(() => {
    if (user) {
      console.log('Setting form values from user:', user);
      try {
        // Create a new object with all the user data, with fallbacks for missing properties
        const updatedFormValues = {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          settings: {
            dailyGoal: user.settings?.dailyGoal || 20,
            difficulty: user.settings?.difficulty || 'intermediate',
            notifications: {
              email: user.settings?.notifications?.email ?? true,
              push: user.settings?.notifications?.push ?? true,
              sms: user.settings?.notifications?.sms ?? false
            }
          }
        };
        
        console.log('Updated form values:', updatedFormValues);
        setFormValues(updatedFormValues);
        setFormInitialized(true);
      } catch (err) {
        console.error('Error setting form values:', err, user);
      }
    }
  }, [user]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'dailyGoal') {
      setFormValues({
        ...formValues,
        settings: {
          ...formValues.settings,
          dailyGoal: parseInt(value)
        }
      });
    } else if (type === 'checkbox') {
      // Handle notification checkboxes
      const isChecked = (e.target as HTMLInputElement).checked;
      const notificationType = name.split('.')[1]; // email, push, or sms
      
      setFormValues({
        ...formValues,
        settings: {
          ...formValues.settings,
          notifications: {
            ...formValues.settings.notifications,
            [notificationType]: isChecked
          }
        }
      });
    } else {
      // Handle regular inputs (firstName, lastName, email)
      setFormValues({
        ...formValues,
        [name]: value
      });
    }
  };

  // Handle difficulty change
  const handleDifficultyChange = (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    setFormValues({
      ...formValues,
      settings: {
        ...formValues.settings,
        difficulty
      }
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      // Make a copy of the form data to send to the API
      const userData = {
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        settings: {
          dailyGoal: formValues.settings.dailyGoal,
          difficulty: formValues.settings.difficulty,
          notifications: {
            email: formValues.settings.notifications.email,
            push: formValues.settings.notifications.push,
            sms: formValues.settings.notifications.sms
          }
        }
      };
      
      // Call the updateProfile function from AuthContext
      await updateProfile(userData);
      
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state if data is still loading
  if (isLoading || isProfileUpdating) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-500 dark:text-gray-400">Loading your settings...</span>
      </div>
    );
  }

  // If user is null but not loading, show error message
  if (!user && !isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <p className="text-red-500 dark:text-red-400">Unable to load user data. Please try refreshing the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Profile Settings</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Update your personal information</p>
        </div>
        
        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                First name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  value={formValues.firstName}
                  onChange={handleInputChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Last name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  value={formValues.lastName}
                  onChange={handleInputChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formValues.email}
                  onChange={handleInputChange}
                  disabled
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-md bg-gray-50 dark:bg-gray-600 cursor-not-allowed"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Email cannot be changed once set
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Learning Preferences</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Customize your learning experience</p>
        </div>
        
        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Difficulty Level
              </label>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <button
                    type="button"
                    onClick={() => handleDifficultyChange('beginner')}
                    className={`flex items-center justify-center w-full px-4 py-2 border rounded-md focus:outline-none ${
                      formValues.settings.difficulty === 'beginner'
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-gray-300 dark:border-gray-600 dark:text-gray-200'
                    }`}
                  >
                    Beginner
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => handleDifficultyChange('intermediate')}
                    className={`flex items-center justify-center w-full px-4 py-2 border rounded-md focus:outline-none ${
                      formValues.settings.difficulty === 'intermediate'
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-gray-300 dark:border-gray-600 dark:text-gray-200'
                    }`}
                  >
                    Intermediate
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => handleDifficultyChange('advanced')}
                    className={`flex items-center justify-center w-full px-4 py-2 border rounded-md focus:outline-none ${
                      formValues.settings.difficulty === 'advanced'
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-gray-300 dark:border-gray-600 dark:text-gray-200'
                    }`}
                  >
                    Advanced
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="dailyGoal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Daily practice goal (minutes)
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="dailyGoal"
                  id="dailyGoal"
                  min="1"
                  max="240"
                  value={formValues.settings.dailyGoal}
                  onChange={handleInputChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Notification preferences</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">How would you like to receive notifications?</p>
              
              <div className="mt-4 space-y-3">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="notifications.email"
                      name="notifications.email"
                      type="checkbox"
                      checked={formValues.settings.notifications.email}
                      onChange={handleInputChange}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="notifications.email" className="font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <p className="text-gray-500 dark:text-gray-400">Get emails about your practice reminders and achievements</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="notifications.push"
                      name="notifications.push"
                      type="checkbox"
                      checked={formValues.settings.notifications.push}
                      onChange={handleInputChange}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="notifications.push" className="font-medium text-gray-700 dark:text-gray-300">Push notifications</label>
                    <p className="text-gray-500 dark:text-gray-400">Receive push notifications about your practice schedule</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="notifications.sms"
                      name="notifications.sms"
                      type="checkbox"
                      checked={formValues.settings.notifications.sms}
                      onChange={handleInputChange}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="notifications.sms" className="font-medium text-gray-700 dark:text-gray-300">SMS</label>
                    <p className="text-gray-500 dark:text-gray-400">Get text messages for important reminders</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isProfileUpdating || isSaving}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isProfileUpdating || isSaving ? (
                <span className="flex items-center">
                  <LoadingSpinner size="sm" color="white" />
                  <span className="ml-2">Saving...</span>
                </span>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Account Management</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Manage your account settings</p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Delete account</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
            <p>Once you delete your account, you will lose all data associated with it.</p>
          </div>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
            >
              Delete account
            </button>
          </div>
        </div>
      </div>

      {/* Delete account confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Delete account</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete your account? All of your data will be permanently removed. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    toast.error('This feature is not available in the demo version.');
                    setShowDeleteConfirm(false);
                  }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteConfirm(false)}
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

export default SettingsTab; 