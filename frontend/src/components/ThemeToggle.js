import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="flex items-center">
      {/* Sun icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-5 w-5 mr-2 ${darkMode ? 'text-gray-400' : 'text-yellow-500'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>

      {/* Toggle switch */}
      <button
        onClick={toggleDarkMode}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cronbat-500 focus:ring-offset-2 ${
          darkMode ? 'bg-cronbat-600' : 'bg-gray-200'
        }`}
      >
        <span className="sr-only">Toggle dark mode</span>
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            darkMode ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>

      {/* Moon icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-5 w-5 ml-2 ${darkMode ? 'text-cronbat-300' : 'text-gray-400'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </div>
  );
};

export default ThemeToggle;
