import React, { useRef, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Editor from './components/Editor';
import FloatingAccountButton from './components/FloatingAccountButton';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Account from './pages/Account';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
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
    <AuthProvider>
      <Router>
        <div className={`min-h-screen light-gradient-bg dark-gradient-bg flex flex-col transition-colors duration-200 ${isDarkMode ? 'dark' : ''}`}>
          <FloatingAccountButton isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
          
          {/* Main Content Area */}
          <main className={`flex-grow py-12 px-6 overflow-auto no-print light-gradient-bg dark-gradient-bg transition-colors duration-200 flex justify-center ${isDarkMode ? 'dark' : ''}`}>
            <div className="w-full flex justify-center">
              <div
                ref={componentRef}
                className="w-full max-w-5xl print:bg-white"
              >
                <Routes>
                  <Route path="/" element={
                    <Editor 
                      isDarkMode={isDarkMode} 
                      toggleDarkMode={toggleDarkMode} 
                    />
                  } />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/account" element={
                    <PrivateRoute>
                      <Account isDarkMode={isDarkMode} />
                    </PrivateRoute>
                  } />
                </Routes>
              </div>
            </div>
          </main>

        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
