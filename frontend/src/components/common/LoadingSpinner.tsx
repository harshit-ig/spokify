import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  darkColor?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'indigo-500',
  darkColor = 'indigo-400'
}) => {
  const { isDark } = useTheme();
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  // Use the appropriate color based on dark mode
  const spinnerColor = isDark ? darkColor : color;

  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-t-2 border-b-2 border-${spinnerColor}`}></div>
    </div>
  );
};

export default LoadingSpinner; 