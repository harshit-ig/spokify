# Spokify Backend

This is the backend for Spokify, an English learning platform with an AI teacher. It's built with Node.js, Express, and TypeScript.

## Features

- User authentication with JWT
- Password reset functionality with email notifications
- RESTful API design
- MongoDB database with Mongoose ORM
- Secure cookie handling with cookie-parser
- AI-powered conversation capabilities

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the variables with your own values

3. Start the development server:
```bash
npm run dev
```

The server will start on the port specified in your `.env` file (default: 5000).

## Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── config/        # Configuration files and database connection
├── controllers/   # Route controllers
├── middleware/    # Express middleware
├── models/        # Mongoose models
├── routes/        # API routes
├── utils/         # Utility functions
└── server.ts      # Server entry point
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user (requires authentication)
- `POST /api/auth/forgotpassword` - Request password reset
- `PUT /api/auth/resetpassword/:resettoken` - Reset password

### Lessons

- `GET /api/lessons` - Get all lessons
- `GET /api/lessons/:id` - Get lesson by ID
- `POST /api/lessons` - Create a new lesson (admin only)
- `PUT /api/lessons/:id` - Update a lesson (admin only)
- `DELETE /api/lessons/:id` - Delete a lesson (admin only)

### Progress

- `GET /api/progress` - Get user's learning progress
- `POST /api/progress` - Update user's progress
- `GET /api/progress/stats` - Get user's learning statistics

### AI Conversation

- `POST /api/ai/chat` - Have a conversation with the AI teacher
- `POST /api/ai/feedback` - Get AI feedback on speaking or writing

## Dependencies

### Main Dependencies
- Express - Web framework
- Mongoose - MongoDB ORM
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- nodemailer - Email notifications
- cors - Cross-origin resource sharing
- dotenv - Environment variable management
- validator - Data validation
- cookie-parser - Cookie handling

### Dev Dependencies
- TypeScript
- ts-node
- nodemon
- Various TypeScript type definitions

## Available Scripts

- `npm run dev`: Start development server with nodemon
- `npm run build`: Build for production
- `npm start`: Start production server 