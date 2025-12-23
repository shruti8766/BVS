import React, { createContext, useContext, useState, useEffect } from 'react';

const HotelThemeContext = createContext();

export function HotelThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('hotelDashboardTheme');
    if (savedTheme !== null) {
      return savedTheme === 'dark';
    }
    // Default to light mode
    return false;
  });

  useEffect(() => {
    // Save preference to localStorage
    localStorage.setItem('hotelDashboardTheme', isDarkMode ? 'dark' : 'light');
    
    // Update document class for Tailwind dark mode
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <HotelThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </HotelThemeContext.Provider>
  );
}

export function useHotelTheme() {
  const context = useContext(HotelThemeContext);
  if (!context) {
    throw new Error('useHotelTheme must be used within HotelThemeProvider');
  }
  return context;
}
