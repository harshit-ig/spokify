# Spokify - English Learning Platform with AI

Spokify is a web application that helps users learn to speak English fluently using AI technology. The platform provides personalized feedback, pronunciation correction, and interactive lessons.

## 📑 Table of Contents

- [Quick Start](#-quick-start)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Development Setup](#-development-setup)
  - [Web App Setup](#web-app-setup)
  - [AI Server Setup](#ai-server-setup)
- [MongoDB Configuration](#-mongodb-configuration)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [Production Deployment](#-production-deployment)
- [License](#-license)

## 🚀 Quick Start

For a fast development setup, follow these steps:

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/yourusername/spokify.git
   cd spokify
   npm run install:all
   ```

2. **Set up environment (minimum required)**
   ```bash
   # Copy the example env file
   cp backend/.env.example backend/.env
   
   # Edit the MongoDB connection
   # For local MongoDB: mongodb://localhost:27017/spokify
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## ✨ Features

- User authentication with JWT
- Password reset functionality
- Interactive learning dashboard
- AI-powered conversation practice
- Progress tracking and analytics
- Dark/light mode theme support
- Responsive design

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Headless UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB
- **Authentication**: JWT
- **AI Engine**: Python, Hugging Face Transformers (Phi-3.5-mini-instruct)

## 🔧 Development Setup

The project consists of three main components that can be developed separately or together:
1. **Frontend** - React application
2. **Backend** - Express API server
3. **AI Server** - Python-based AI engine

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn
- Python 3.8+ (for AI server)
- Hugging Face account with model access (for AI features)

### Web App Setup

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/spokify.git
cd spokify
```

#### 2. Install Dependencies
```bash
# Install all dependencies (frontend, backend, and root)
npm run install:all

# Or install separately:
npm install                # Root dependencies
cd backend && npm install  # Backend dependencies
cd ../frontend && npm install # Frontend dependencies
```

#### 3. Configure Environment Variables
Create and configure your backend environment:
```bash
# Copy example env file
cp backend/.env.example backend/.env

# Edit the .env file with your settings
# Most important for development:
# - MONGO_URI (database connection)
# - JWT_SECRET (any secure random string)
```

Example `backend/.env` file:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/spokify
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=no-reply@spokify.com
NODE_ENV=development
```

#### 4. Start Development Servers
You have three options to start the development environment:

**Option A**: Run both frontend and backend concurrently (recommended):
```bash
npm run dev
```

**Option B**: Run servers separately:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Option C**: For mobile device testing (exposes frontend to your local network):
```bash
npm run mobile-dev
```

#### 5. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### AI Server Setup

The AI server runs separately from the main web app and processes language learning requests.

#### Option 1: Using Intel Tiber Cloud (Recommended)

Intel Tiber cloud provides the ideal environment for the AI server with pre-configured XPU acceleration.

1. **Sign up for Intel Developer Cloud**
   - Create an account at [Intel Developer Cloud](https://developer.intel.com/)

2. **Create a PyTorch 2.6 notebook instance**
   - Select a notebook with XPU acceleration

3. **Set up the AI server in Jupyter**
   - Copy the code from `ai_server.py` into a Jupyter notebook
   - Update the MongoDB connection URL in the notebook

4. **Install required packages**
   ```python
   !pip install transformers==4.71.1 pymongo python-dotenv bson uuid
   ```

5. **Verify transformers version**
   ```python
   !pip show transformers
   ```

6. **Run the notebook cells to start the AI server**

#### Option 2: Local AI Server Setup

For local development with sufficient hardware:

1. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure MongoDB Atlas**
   - Create a database named `chatapp` with collections:
     - `prompts`
     - `responses`
     - `chat_history`

3. **Authenticate with Hugging Face**
   ```bash
   huggingface-cli login
   ```

4. **Set up environment variables**
   - Create a `.env` file in the AI server directory:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/chatapp
   ```

5. **Run the AI server**
   ```bash
   python ai_server.py
   ```

Note: The AI server requires substantial computational resources. For best results, use hardware with GPU/XPU acceleration.

## 🗄️ MongoDB Configuration

The application requires two MongoDB database setups:

### 1. Main Web App Database
Used by the Express backend for user data, lessons, etc.
- Configure in `backend/.env` as `MONGO_URI`
- Can be local MongoDB for development

### 2. AI Server Database (MongoDB Atlas)
Used for AI conversation storage and processing:
- Database: `chatapp`
- Collections:
  - `prompts`: Stores user prompts to the AI
  - `responses`: Stores AI-generated responses
  - `chat_history`: Stores conversation history

To set up the AI MongoDB correctly:
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database named `chatapp`
4. Create the required collections
5. Set up a database user with read/write access
6. Add the connection string to your AI server environment

## 📁 Project Structure

### Frontend

```
frontend/
├── src/
│   ├── assets/        # Static assets
│   ├── components/    # Reusable UI components
│   ├── context/       # React context providers
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── services/      # API service functions
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   ├── App.tsx        # Main application component
│   └── main.tsx       # Application entry point
└── ...
```

### Backend

```
backend/
├── src/
│   ├── config/        # Configuration files and database
│   ├── controllers/   # Route controllers
│   ├── middleware/    # Express middleware
│   ├── models/        # Mongoose models
│   ├── routes/        # API routes
│   ├── utils/         # Utility functions
│   └── server.ts      # Server entry point
└── ...
```

### AI Server
```
ai_server.py          # Main AI server script
requirements.txt      # Python dependencies
```

## 📜 Available Scripts

### Root Directory
- `npm run dev`: Start both frontend and backend in development mode
- `npm run mobile-dev`: Start in development mode with frontend accessible on local network
- `npm run start`: Start both services (frontend in dev mode)
- `npm run install:all`: Install all dependencies

### Backend
- `npm run dev`: Start development server with nodemon
- `npm run build`: Build for production
- `npm start`: Start production server

### Frontend
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build locally

## 🚢 Production Deployment

Refer to this section when you're ready to deploy the application to production.

### Backend Preparation

1. **Update environment variables**
   - Create `backend/.env.production` or update `.env`:
   ```
   PORT=5000
   MONGO_URI=your_production_mongodb_uri
   JWT_SECRET=your_secure_production_jwt_secret
   JWT_EXPIRE=30d
   JWT_COOKIE_EXPIRE=30
   EMAIL_SERVICE=your_email_service
   EMAIL_USERNAME=your_production_email
   EMAIL_PASSWORD=your_production_email_password
   EMAIL_FROM=no-reply@yourdomain.com
   NODE_ENV=production
   ```

2. **Update CORS configuration**
   - In `backend/src/server.ts`, replace placeholder domain:
   ```typescript
   origin: process.env.NODE_ENV === 'production'
     ? ['https://youractualdomainname.com']
     : true,
   ```

3. **Build and start**
   ```bash
   cd backend
   npm run build
   npm start
   ```

### Frontend Preparation

1. **Create production environment file**
   ```
   # frontend/.env.production
   VITE_API_URL=https://api.yourdomain.com
   ```

2. **Build frontend**
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy** the generated `dist` directory to your web server

### AI Server Production Deployment

1. **Set up production environment**
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/chatapp
   LOG_LEVEL=INFO
   ```

2. **Use process manager**
   ```bash
   pm2 start ai_server.py --name spokify-ai
   ```

### Deployment Options

#### Option 1: Same Domain (Recommended)
- Frontend: https://yourdomain.com
- Backend API: https://yourdomain.com/api
- Requires reverse proxy (Nginx, Apache)

#### Option 2: Separate Domains
- Frontend: https://yourdomain.com
- Backend API: https://api.yourdomain.com
- Configure CORS properly

#### Option 3: Platform Services
- Frontend: Netlify, Vercel, GitHub Pages
- Backend: Heroku, Railway, Render
- AI Server: AWS, GCP, Azure with GPU/XPU

## 📄 License

[MIT](LICENSE) 