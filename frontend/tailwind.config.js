/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4da6ff',
          DEFAULT: '#0066cc',
          dark: '#004080',
        },
        secondary: {
          light: '#ffd24d',
          DEFAULT: '#ffc107',
          dark: '#997300',
        },
        gray: {
          750: '#2e3748', // Custom gray shade for dark mode gradients
        },
        dark: {
          primary: '#1a1a1a',
          secondary: '#2d2d2d',
          text: '#f3f4f6',
          muted: '#9ca3af',
          border: '#4b5563',
          accent: '#8b5cf6',
        }
      },
    },
  },
  plugins: [],
  safelist: [
    // Base classes
    'bg-blue-500',
    'text-white',
    'rounded-md',
    'shadow-lg',
    'bg-gray-50',
    'min-h-screen',
    'flex',
    'items-center',
    'justify-center',
    'w-12',
    'h-12',
    'border-4',
    'border-blue-600',
    'border-t-transparent',
    'rounded-full',
    'animate-spin',
    
    // Dark mode classes
    'dark:bg-dark-primary',
    'dark:bg-dark-secondary',
    'dark:text-dark-text',
    'dark:text-dark-muted',
    'dark:border-dark-border',
    'dark:bg-gray-800',
    'dark:bg-gray-900',
    'dark:bg-gray-750',
    'dark:text-white',
    'dark:text-gray-200',
    'dark:text-gray-300',
    'dark:hover:bg-gray-700',
    'dark:border-gray-700',
    'dark:border-gray-600',
    
    // Lesson card color variants
    'from-blue-50',
    'to-blue-100',
    'dark:from-gray-800',
    'dark:to-gray-750',
    'dark:border-blue-800',
    'text-blue-800',
    'dark:text-blue-300',
    'text-blue-600',
    'bg-blue-600',
    'hover:bg-blue-700',
    'focus:ring-blue-500',
    'dark:bg-blue-700',
    'dark:hover:bg-blue-600',
    
    'from-green-50',
    'to-green-100',
    'dark:border-green-800',
    'text-green-800',
    'dark:text-green-300',
    'text-green-600',
    'bg-green-600',
    'hover:bg-green-700',
    'focus:ring-green-500',
    'dark:bg-green-700',
    'dark:hover:bg-green-600',
    'dark:text-green-400',
    
    'from-purple-50',
    'to-purple-100',
    'dark:border-purple-800',
    'text-purple-800',
    'dark:text-purple-300',
    'text-purple-600',
    'bg-purple-600',
    'hover:bg-purple-700',
    'focus:ring-purple-500',
    'dark:bg-purple-700',
    'dark:hover:bg-purple-600',
    
    'from-red-50',
    'to-red-100',
    'dark:border-red-800',
    'text-red-800',
    'dark:text-red-300',
    'text-red-600',
    'bg-red-600',
    'hover:bg-red-700',
    'focus:ring-red-500',
    'dark:bg-red-700',
    'dark:hover:bg-red-600',
    
    // Dynamic color variants for lessons cards
    'dark:bg-blue-900/30',
    'dark:bg-green-900/30',
    'dark:bg-purple-900/30', 
    'dark:bg-red-900/30',
    'dark:bg-indigo-900/30',
    'dark:bg-indigo-900/50',
    'dark:bg-indigo-800/50',
    'dark:hover:bg-indigo-800/50',
    
    // Individual lesson page classes
    'dark:text-gray-400',
    'dark:border-indigo-400',
    'dark:border-blue-400',
    'dark:focus:ring-offset-gray-900',
    'dark:focus:ring-offset-gray-800',
    
    // Modal overlay
    'bg-opacity-75',
    'dark:bg-opacity-75',
    
    // Additional dark mode gradient classes for ForgotPassword page
    'dark:from-blue-900',
    'dark:via-gray-900',
    'dark:to-blue-900',
    'dark:from-green-800',
    'dark:to-teal-800',
    
    // Additional classes for reset password page
    'dark:bg-red-800/30',
    'dark:border-red-700',
    'dark:text-red-300',
    'dark:text-red-400',
    'dark:text-blue-400',
    'dark:hover:text-blue-300',
    'dark:placeholder-red-500',
    'dark:placeholder-gray-400',
    
    // Scrollbar-related colors
    'bg-gray-200',
    'hover:bg-gray-300',
    'dark:bg-gray-700',
    'dark:hover:bg-gray-600',
    'bg-gray-100',
    'dark:bg-gray-750'
  ]
} 