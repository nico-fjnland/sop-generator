import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [timeOfDay, setTimeOfDay] = useState(() => {
    const saved = localStorage.getItem('timeOfDay');
    return saved || 'day';
  });

  useEffect(() => {
    localStorage.setItem('timeOfDay', timeOfDay);
    
    // Optional: Add/remove dark class to html/body for Tailwind dark mode
    if (timeOfDay === 'night') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [timeOfDay]);

  const toggleTime = () => {
    setTimeOfDay(prev => prev === 'day' ? 'night' : 'day');
  };

  const getGradientClass = () => {
    return timeOfDay === 'night' ? 'night-mode dark' : 'day-mode';
  };

  return (
    <ThemeContext.Provider value={{ timeOfDay, toggleTime, getGradientClass }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

