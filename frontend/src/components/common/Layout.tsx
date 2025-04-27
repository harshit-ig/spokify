import React, { ReactNode } from 'react';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  includeFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, includeFooter = true }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {children}
      </main>
      {includeFooter && <Footer />}
    </div>
  );
};

export default Layout; 