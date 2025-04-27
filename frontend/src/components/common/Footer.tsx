import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  // Links with proper URLs
  const companyLinks = [
    { name: 'About', url: '/about' },
    { name: 'Careers', url: '/careers' },
    { name: 'Blog', url: '/blog' }
  ];
  
  const supportLinks = [
    { name: 'Help Center', url: '/help' },
    { name: 'Contact Us', url: '/contact' },
    { name: 'FAQ', url: '/faq' }
  ];
  
  const legalLinks = [
    { name: 'Privacy', url: '/privacy' },
    { name: 'Terms', url: '/terms' },
    { name: 'Cookie Policy', url: '/cookie-policy' }
  ];
  
  const socialLinks = [
    { name: 'Twitter', url: 'https://twitter.com/spokify', external: true },
    { name: 'Facebook', url: 'https://facebook.com/spokify', external: true },
    { name: 'Instagram', url: 'https://instagram.com/spokify', external: true }
  ];

  return (
    <footer className="bg-gray-800 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-300 dark:text-gray-200 tracking-wider uppercase">Company</h3>
            <ul className="mt-4 space-y-4">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.url} 
                    className="text-base text-gray-400 hover:text-white transition duration-150"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-300 dark:text-gray-200 tracking-wider uppercase">Support</h3>
            <ul className="mt-4 space-y-4">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.url} 
                    className="text-base text-gray-400 hover:text-white transition duration-150"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-300 dark:text-gray-200 tracking-wider uppercase">Legal</h3>
            <ul className="mt-4 space-y-4">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.url} 
                    className="text-base text-gray-400 hover:text-white transition duration-150"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-300 dark:text-gray-200 tracking-wider uppercase">Connect</h3>
            <ul className="mt-4 space-y-4">
              {socialLinks.map((link) => (
                <li key={link.name}>
                  {link.external ? (
                    <a 
                      href={link.url} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-gray-400 hover:text-white transition duration-150 flex items-center"
                    >
                      {link.name}
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <Link 
                      to={link.url} 
                      className="text-base text-gray-400 hover:text-white transition duration-150"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 dark:border-gray-800 pt-8">
          <p className="text-center text-base text-gray-400">
            &copy; {new Date().getFullYear()} Spokify. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 