import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';

function Layout() {
  const location = useLocation();
  const { isConnected } = useSocket();
  const { darkMode } = useTheme();

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <nav className="bg-cronbat-700 shadow-md dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center">
                  <img
                    src="/logo.svg"
                    alt="CronBat Logo"
                    className="h-8 w-8 mr-2 logo-svg"
                  />
                  <span className="text-white text-xl font-bold">CronBat</span>
                </Link>
              </div>
              <div className="ml-6 flex items-center space-x-4">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/'
                      ? 'bg-cronbat-800 text-white'
                      : 'text-cronbat-100 hover:bg-cronbat-600'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/jobs/new"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/jobs/new'
                      ? 'bg-cronbat-800 text-white'
                      : 'text-cronbat-100 hover:bg-cronbat-600'
                  }`}
                >
                  Create Job
                </Link>
                <Link
                  to="/executions"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/executions'
                      ? 'bg-cronbat-800 text-white'
                      : 'text-cronbat-100 hover:bg-cronbat-600'
                  }`}
                >
                  Execution History
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <span className="mr-2 text-sm text-cronbat-100">Status:</span>
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></span>
                <span className="ml-2 text-sm text-cronbat-100">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 dark:text-white">
        <Outlet />
      </main>

      <footer className="bg-white dark:bg-gray-800 shadow-inner mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            <a
              href="https://github.com/larsla/cronbat"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cronbat-600 dark:hover:text-cronbat-400 transition-colors"
            >
              CronBat - Task Scheduling and Monitoring
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
