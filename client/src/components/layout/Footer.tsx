import React from 'react';
import { Globe } from 'lucide-react';
import { BACKEND_URL } from '../../utils/constants';

const Footer: React.FC = () => {
  return (
    <footer className="mt-2 border-t border-gray-200/50 dark:border-gray-700/50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="bg-gradient-to-r from-primary-500 to-purple-600 p-2 rounded-lg">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              VS Code File Sync • Backend: {BACKEND_URL}
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Documentation
            </button>
            <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              GitHub
            </button>
            <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Settings
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;