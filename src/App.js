import React, { useRef, useState, useEffect } from 'react';
import Editor from './components/Editor';
import { Button } from './components/ui/button';
import { IconButton } from './components/ui/icon-button';
import { Moon, Sun } from '@phosphor-icons/react';
import './App.css';

function App() {
  const componentRef = useRef();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    // Apply dark mode class to document root
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save preference to localStorage
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`min-h-screen light-gradient-bg dark-gradient-bg flex flex-col transition-colors duration-200 ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="no-print sticky top-0 z-50 w-full">
        <div className="absolute left-6 top-4 flex items-center gap-3">
          <h1 className="text-xl font-semibold text-sop-primary dark:text-[#3399FF] font-display tracking-tight">SOP Editor</h1>
          <span className="text-xs text-muted-foreground dark:text-[#94a3b8] font-medium px-2 py-1 rounded-md bg-sop-light/50 dark:bg-[#1a2332]/50">Notaufnahme</span>
        </div>
        {/* Removed the "PDF herunterladen" button from here as it is now in the editor toolbar */}
      </header>

      {/* Main Content Area */}
      <main className={`flex-grow py-12 px-6 overflow-auto no-print light-gradient-bg dark-gradient-bg transition-colors duration-200 flex justify-center ${isDarkMode ? 'dark' : ''}`}>
        <div className="w-full flex justify-center">
          <div
            ref={componentRef}
            className="print:bg-white"
          >
            <Editor 
              isDarkMode={isDarkMode} 
              toggleDarkMode={toggleDarkMode} 
            />
          </div>
        </div>
      </main>

    </div>
  );
}

export default App;

