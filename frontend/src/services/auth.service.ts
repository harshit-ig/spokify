import api from './api';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  password: string;
}

const AuthService = {
  // Register a new user
  register: async (userData: RegisterData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Login user
  login: async (userData: LoginData) => {
    const response = await api.post('/auth/login', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
  },

  // Get current user
  getCurrentUser: async () => {
    return api.get('/auth/me');
  },

  // Forgot password
  forgotPassword: async (email: string) => {
    return api.post('/auth/forgotpassword', { email });
  },

  // Reset password
  resetPassword: async (resetToken: string, passwordData: ResetPasswordData) => {
    return api.put(`/auth/resetpassword/${resetToken}`, passwordData);
  },

  // Check if user is logged in
  isLoggedIn: () => {
    return localStorage.getItem('token') ? true : false;
  },
};

export default AuthService; 