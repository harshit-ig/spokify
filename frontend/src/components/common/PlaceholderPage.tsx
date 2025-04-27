import React from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  returnPath?: string;
  returnText?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description = "This page is coming soon. We're working hard to bring you great content.",
  returnPath = "/",
  returnText = "Return to Home"
}) => {
  return (
    <Layout>
      <div className="min-h-screen-content flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {title}
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              {description}
            </p>
          </div>
          
          <div className="rounded-md shadow">
            <Link
              to={returnPath}
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition"
            >
              {returnText}
            </Link>
          </div>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PlaceholderPage; 