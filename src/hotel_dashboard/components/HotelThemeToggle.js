import React from 'react';
import { useHotelTheme } from '../context/HotelThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function HotelThemeToggle() {
  const { isDarkMode, toggleTheme } = useHotelTheme();

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={toggleTheme}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${
          isDarkMode ? 'bg-green-700 dark:bg-green-800' : 'bg-gray-300'
        }`}
        role="switch"
        aria-checked={isDarkMode}
        aria-label="Toggle dark mode"
        title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {/* Sliding toggle background */}
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 flex items-center justify-center ${
            isDarkMode ? 'translate-x-7' : 'translate-x-1'
          }`}
        >
          {isDarkMode ? (
            <MoonIcon className="w-4 h-4 text-gray-800" />
          ) : (
            <SunIcon className="w-4 h-4 text-yellow-500" />
          )}
        </span>
      </button>
    </div>
  );
}
