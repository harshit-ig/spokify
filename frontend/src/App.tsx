import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css'; // Import index.css first
import './App.css'; // Import App.css second (like in homepay)

import { AuthProvider } from './context/AuthContext';
import { LessonsProvider } from './context/LessonsContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import PlaceholderPage from './components/common/PlaceholderPage';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Lesson from './pages/Lesson';
import Lessons from './pages/Lessons';

// Footer page imports
import About from './pages/About';
import Contact from './pages/Contact';
import Help from './pages/Help';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

// Theme toggle button component
const ThemeToggle = () => {
  const { toggleTheme, isDark } = useTheme();
  
  return (
    <button 
      onClick={toggleTheme}
      className="fixed z-40 bottom-5 left-5 sm:right-5 sm:left-auto p-3 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-lg hover:shadow-xl transition-all duration-300"
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
};

// App content component to use the theme hook
const AppContent = () => {
  const { isDark } = useTheme();
  
  // Apply dark mode class to html element
  React.useEffect(() => {
    // Apply dark class to html element
    document.documentElement.classList.toggle('dark', isDark);
    
    // Also apply dark class to body as a fallback
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    
    // Force tailwind dark mode to use class strategy
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    console.log('Dark mode state changed:', isDark ? 'DARK MODE ON' : 'LIGHT MODE ON');
  }, [isDark]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200"
         data-dark={isDark ? "true" : "false"}>
      <AuthProvider>
        <LessonsProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
              
              {/* Footer Pages */}
              <Route path="/about" element={<About />} />
              <Route path="/help" element={<Help />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cookie-policy" element={<PlaceholderPage title="Cookie Policy" description="Our Cookie Policy explains how we use cookies on our website. This page is currently under construction." />} />
              <Route path="/blog" element={<PlaceholderPage title="Blog" description="Stay tuned for language learning tips, success stories, and updates from our team." />} />
              <Route path="/careers" element={<PlaceholderPage title="Careers" description="Join our team and help change the way people learn languages. Current job openings will be listed here soon." />} />
              <Route path="/faq" element={<PlaceholderPage title="Frequently Asked Questions" description="Find answers to common questions about our platform and language learning process." />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/lessons" element={<Lessons />} />
                <Route path="/lessons/:lessonId" element={<Lesson />} />
              </Route>
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
          <ToastContainer 
            position="top-right" 
            autoClose={4000} 
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={isDark ? "dark" : "light"}
          />
          <ThemeToggle />
        </LessonsProvider>
      </AuthProvider>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
