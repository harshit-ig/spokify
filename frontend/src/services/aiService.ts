import axios from 'axios';

// Create axios instance with default config
const aiApi = axios.create({
  baseURL: '/api/ai',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to include auth token
aiApi.interceptors.request.use(
  (config) => {
    // Try localStorage first, then sessionStorage
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// AI services
export const aiService = {
  createPrompt: async (message: string) => {
    try {
      const response = await aiApi.post('/prompt', { message });
      return { success: true, promptId: response.data.promptId };
    } catch (error: any) {
      console.error('Error creating prompt:', error);
      
      // Check for specific error types
      if (error.response) {
        // Server responded with an error status
        const status = error.response.status;
        const errorMessage = error.response.data?.error || 'Unknown server error';
        
        if (status === 401) {
          return { success: false, error: 'Authentication required' };
        } else if (status === 503) {
          return { success: false, error: 'AI service unavailable' };
        } else {
          return { success: false, error: `Server error: ${errorMessage}` };
        }
      } else if (error.request) {
        // Request was made but no response received
        return { success: false, error: 'No response from server. Please check your connection.' };
      } else {
        // Error setting up the request
        return { success: false, error: 'Failed to create prompt request.' };
      }
    }
  },
  
  // Function to get auth token for EventSource which doesn't support headers
  getAuthToken: () => {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
  }
};

export default aiService; 