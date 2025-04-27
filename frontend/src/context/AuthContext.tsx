import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/api';
import { toast } from 'react-toastify';

interface User {
  _id: string;
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

// Create more granular loading states
interface LoadingState {
  auth: boolean;
  profile: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isProfileUpdating: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; data?: any; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    auth: true,
    profile: false
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const loadUserData = async () => {
      setLoadingState(prev => ({ ...prev, auth: true }));
      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (!token) {
          setLoadingState(prev => ({ ...prev, auth: false }));
          return;
        }

        // Get user data
        const response = await authService.getCurrentUser();
        console.log('getCurrentUser response from effect:', response);

        if (response.success && response.data) {
          console.log('User data loaded in AuthContext:', response.data);
          
          // Ensure proper name splitting
          let firstName = '';
          let lastName = '';
          
          if (response.data.name) {
            const nameParts = response.data.name.split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }
          
          // Create a properly structured user object with all required properties
          const userData = {
            _id: response.data._id || '',
            name: response.data.name || `${response.data.firstName || ''} ${response.data.lastName || ''}`.trim(),
            firstName: response.data.firstName || firstName,
            lastName: response.data.lastName || lastName,
            email: response.data.email || '',
            // Ensure settings object has all required properties
            settings: {
              dailyGoal: response.data.settings?.dailyGoal || 20,
              difficulty: response.data.settings?.difficulty || 'intermediate',
              notifications: {
                email: response.data.settings?.notifications?.email ?? true,
                push: response.data.settings?.notifications?.push ?? true,
                sms: response.data.settings?.notifications?.sms ?? false
              }
            }
          };
          
          console.log('Setting processed user data:', userData);
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          console.error('No user data returned from getCurrentUser:', response);
          // Don't remove token on every failed request - only on explicit 401s
          // localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Only remove token for auth errors, handled in the API service
      } finally {
        setLoadingState(prev => ({ ...prev, auth: false }));
      }
    };

    loadUserData();
  }, []);

  // Login user
  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      setLoadingState(prev => ({ ...prev, auth: true }));
      const response = await authService.login(email, password, rememberMe);
      
      if (response.success) {
        const userResponse = await authService.getCurrentUser();
        setUser(userResponse.data);
        setIsAuthenticated(true);
        toast.success('Login successful!');
      } else {
        toast.error(response.error || 'Invalid credentials');
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid credentials');
      throw error;
    } finally {
      setLoadingState(prev => ({ ...prev, auth: false }));
    }
  };

  // Register user
  const register = async (name: string, email: string, password: string) => {
    try {
      setLoadingState(prev => ({ ...prev, auth: true }));
      const response = await authService.register(name, email, password);
      
      if (response.success) {
        const userResponse = await authService.getCurrentUser();
        setUser(userResponse.data);
        setIsAuthenticated(true);
        toast.success('Registration successful!');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
      throw error;
    } finally {
      setLoadingState(prev => ({ ...prev, auth: false }));
    }
  };

  // Logout user
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    toast.info('You have been logged out');
  };

  // Update user profile
  const updateProfile = async (userData: Partial<User>) => {
    try {
      setLoadingState(prev => ({ ...prev, profile: true }));
      const response = await authService.updateProfile({
        firstName: userData.firstName,
        lastName: userData.lastName,
        settings: userData.settings
      });
      
      if (response.success) {
        // Only update the specific fields that changed, not the entire user object
        setUser(prevUser => {
          if (!prevUser) return response.data;
          return {
            ...prevUser,
            firstName: response.data.firstName || prevUser.firstName,
            lastName: response.data.lastName || prevUser.lastName,
            settings: response.data.settings || prevUser.settings
          };
        });
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile');
      throw error;
    } finally {
      setLoadingState(prev => ({ ...prev, profile: false }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading: loadingState.auth,
        isProfileUpdating: loadingState.profile,
        login,
        register,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 