import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/common/Footer';

const Home = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm fixed w-full z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition duration-150">Spokify</Link>
              </div>
            </div>
            <div className="flex items-center">
              {user ? (
                <Link
                  to="/dashboard"
                  className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero section */}
      <div className="relative pt-16 bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-900 dark:to-gray-900">
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-white dark:bg-gray-900"></div>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 pt-10">
          <div className="relative shadow-2xl sm:rounded-2xl sm:overflow-hidden">
            <div className="absolute inset-0">
              <img
                className="h-full w-full object-cover"
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80"
                alt="People having a conversation"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-indigo-800 mix-blend-multiply opacity-90"></div>
            </div>
            <div className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
              <h1 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="block text-white drop-shadow-md">Speak English Confidently</span>
                <span className="block text-indigo-100 mt-2 drop-shadow-md">Talk with an AI Teacher</span>
              </h1>
              <p className="mt-6 max-w-lg mx-auto text-center text-xl text-white sm:max-w-3xl drop-shadow-md font-medium">
                Practice speaking English through voice conversations with our AI teacher. Get real-time feedback on pronunciation and fluency without any fear of judgment.
              </p>
              <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                  {user ? (
                    <Link
                      to="/dashboard"
                      className="flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-md shadow-md text-indigo-700 bg-white hover:bg-indigo-50 transition duration-150 transform hover:-translate-y-1 hover:shadow-lg sm:px-10"
                    >
                      Go to Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/register"
                        className="flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-md shadow-md text-indigo-700 bg-white hover:bg-indigo-50 transition duration-150 transform hover:-translate-y-1 hover:shadow-lg sm:px-10"
                      >
                        Start Speaking
                      </Link>
                      <Link
                        to="/login"
                        className="flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-md shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150 transform hover:-translate-y-1 hover:shadow-xl sm:px-10"
                      >
                        Sign in
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats section */}
          <div className="relative max-w-7xl mx-auto mt-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-3">
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-lg">
                <div className="px-4 py-5 sm:p-6 text-center">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Voice Conversations
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-indigo-600 dark:text-indigo-400">
                    5M+
                  </dd>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-lg">
                <div className="px-4 py-5 sm:p-6 text-center">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Speaking Accuracy Improvement
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-indigo-600 dark:text-indigo-400">
                    87%
                  </dd>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-lg">
                <div className="px-4 py-5 sm:p-6 text-center">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Confidence Boost
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-indigo-600 dark:text-indigo-400">
                    93%
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature section */}
      <div className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <span className="inline-block px-3 py-1 text-xs font-semibold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full uppercase tracking-wider">Voice-Based Learning</span>
            <h2 className="mt-4 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Speak English Without Fear
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto">
              Spokify uses speech recognition technology and AI to help you practice speaking English in a judgment-free environment.
            </p>
          </div>

          <div className="mt-12">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-12">
              <div className="relative p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm transition duration-300 hover:shadow-md">
                <dt>
                  <div className="absolute flex items-center justify-center h-14 w-14 rounded-md bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
                    <svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <p className="ml-20 text-xl leading-6 font-bold text-gray-900">Voice Recognition Technology</p>
                </dt>
                <dd className="mt-2 ml-20 text-base text-gray-500">
                  Speak into your microphone and our advanced speech recognition system analyzes your pronunciation, fluency, and grammar in real-time.
                </dd>
              </div>

              <div className="relative p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm transition duration-300 hover:shadow-md">
                <dt>
                  <div className="absolute flex items-center justify-center h-14 w-14 rounded-md bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
                    <svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <p className="ml-20 text-xl leading-6 font-bold text-gray-900">AI Conversation Partner</p>
                </dt>
                <dd className="mt-2 ml-20 text-base text-gray-500">
                  Have natural voice conversations with our AI teacher that responds intelligently and helps you improve your speaking skills.
                </dd>
              </div>

              <div className="relative p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm transition duration-300 hover:shadow-md">
                <dt>
                  <div className="absolute flex items-center justify-center h-14 w-14 rounded-md bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
                    <svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <p className="ml-20 text-xl leading-6 font-bold text-gray-900">Pronunciation Feedback</p>
                </dt>
                <dd className="mt-2 ml-20 text-base text-gray-500">
                  Get detailed audio feedback on your pronunciation with visual guides showing where to improve your speech.
                </dd>
              </div>

              <div className="relative p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm transition duration-300 hover:shadow-md">
                <dt>
                  <div className="absolute flex items-center justify-center h-14 w-14 rounded-md bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
                    <svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="ml-20 text-xl leading-6 font-bold text-gray-900">Tailored Speaking Exercises</p>
                </dt>
                <dd className="mt-2 ml-20 text-base text-gray-500">
                  Practice with speaking exercises designed for different scenarios – from job interviews to casual conversations.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* How It Works section */}
      <div className="py-16 bg-indigo-50 dark:bg-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <span className="inline-block px-3 py-1 text-xs font-semibold bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-full uppercase tracking-wider">Process</span>
            <h2 className="mt-4 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              How Spokify Works
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-300 lg:mx-auto">
              Our voice-based learning approach is simple, effective, and designed to build your confidence.
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xl font-bold">1</div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Speak with AI</h3>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-400">Have voice conversations with our AI teacher in various scenarios.</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xl font-bold">2</div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Get Voice Feedback</h3>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-400">Receive audio feedback on your pronunciation, grammar, and fluency.</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xl font-bold">3</div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Improve & Build Confidence</h3>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-400">Practice regularly and watch your speaking confidence grow.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            <span className="block">Ready to speak English confidently?</span>
            <span className="block text-indigo-600 dark:text-indigo-400">Start speaking with AI today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Start Speaking Now
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home; 