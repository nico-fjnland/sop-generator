import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
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

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'Standard Operating Procedure',
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm 15mm 10mm 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
        .content-box-block {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .block-wrapper {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .page-container {
          padding: 32px !important;
        }
        .page-container:first-child {
          padding-top: 32px !important;
        }
        .page-container:not(:first-child) {
          padding-top: 32px !important;
        }
      }
    `,
    onBeforeGetContent: () => {
      // Ensure all content is loaded before printing
      return Promise.resolve();
    },
  });

  return (
    <div className={`min-h-screen light-gradient-bg dark-gradient-bg flex flex-col transition-colors duration-200 ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="no-print sticky top-0 z-50 w-full">
        <div className="absolute left-6 top-4 flex items-center gap-3">
          <h1 className="text-xl font-semibold text-sop-primary dark:text-[#3399FF] font-display tracking-tight">SOP Editor</h1>
          <span className="text-xs text-muted-foreground dark:text-[#94a3b8] font-medium px-2 py-1 rounded-md bg-sop-light/50 dark:bg-[#1a2332]/50">Notaufnahme</span>
        </div>
        <div className="absolute right-6 top-4 flex items-center gap-3">
          <Button
            onClick={handlePrint}
            size="default"
            aria-label="PDF herunterladen"
            className="font-medium"
            style={{
              backgroundColor: '#0099FF',
              borderRadius: '99px'
            }}
          >
            PDF herunterladen
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-grow py-12 px-6 overflow-auto no-print light-gradient-bg dark-gradient-bg transition-colors duration-200 flex justify-center ${isDarkMode ? 'dark' : ''}`}>
        <div className="w-full flex justify-center">
          <div
            ref={componentRef}
            className="print:bg-white"
          >
            <Editor />
          </div>
        </div>
      </main>

      {/* Floating Action Buttons */}
      {/* Dark/Light Mode Switcher - Bottom Left */}
      <div className="fixed bottom-6 left-6 no-print z-40">
        <IconButton
          onClick={toggleDarkMode}
          variant="ghost"
          size="icon"
          aria-label={isDarkMode ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
          className="shadow-lg hover:shadow-xl transition-all text-sop-primary dark:text-[#3399FF] hover:bg-sop-light dark:hover:bg-[#1a2332] bg-white dark:bg-[#1e293b]"
          style={{
            borderRadius: '50%',
            width: '56px',
            height: '56px'
          }}
        >
          {isDarkMode ? <Sun size={24} weight="bold" /> : <Moon size={24} weight="bold" />}
        </IconButton>
      </div>

    </div>
  );
}

export default App;

