# Spokify Frontend

This is the frontend for Spokify, an English learning platform with an AI teacher. It's built with React, TypeScript, and Vite.

## Features

- User authentication (login, registration, password reset)
- Dashboard for authorized users
- Interactive AI-powered language lessons
- Progress tracking for learners
- Dark mode / light mode theme support
- Responsive design with Tailwind CSS
- Toast notifications for user feedback

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Build for Production

```bash
npm run build
npm run preview # to test the production build locally
```

## Project Structure

```
src/
├── assets/        # Static assets (images, fonts)
├── components/    # Reusable UI components
├── context/       # React context providers
│   ├── AuthContext.tsx       # Authentication state
│   ├── LessonsContext.tsx    # Lesson data management
│   └── ThemeContext.tsx      # Theme management (dark/light)
├── hooks/         # Custom React hooks
├── pages/         # Page components
│   ├── Home.tsx             # Landing page
│   ├── Login.tsx            # User login
│   ├── Register.tsx         # User registration
│   ├── Dashboard.tsx        # User dashboard
│   ├── Lessons.tsx          # Lessons listing
│   ├── Lesson.tsx           # Individual lesson
│   └── [Other pages]        # Various utility pages
├── services/      # API service functions
│   ├── api.ts               # Axios configuration and base API
│   ├── auth.service.ts      # Authentication services
│   └── aiService.ts         # AI conversation services
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
├── App.tsx        # Main application component
└── main.tsx       # Application entry point
```

## Main Features

### Authentication System
- Login/Register with email and password
- Remember me functionality
- Password reset via email
- Protected routes for authenticated users

### Lesson System
- Browse available lessons
- Interactive lesson content with AI guidance
- Progress tracking

### Theme Support
- Dynamic light/dark mode toggle
- Persistent theme preferences
- Tailwind-based styling

## Dependencies

### Main Dependencies
- React v19 - UI library
- React Router DOM - Navigation and routing
- Axios - API request handling
- Formik & Yup - Form handling and validation
- React Toastify - Toast notifications
- React Icons - Icon library
- Headless UI - Unstyled, accessible UI components

### Development Dependencies
- TypeScript - Type safety
- Vite - Fast build tool and development server
- ESLint - Code linting
- Tailwind CSS - Utility-first CSS framework
- PostCSS - CSS transformation
- Autoprefixer - Browser compatibility

## Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build for production
- `npm run lint`: Run ESLint to check code quality
- `npm run preview`: Preview production build locally

## Browser Support

The application is designed to work on modern browsers including:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
