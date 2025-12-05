import React, { useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Editor from './components/Editor';
import ZoomControl from './components/ZoomControl';
import ZoomWrapper from './components/ZoomWrapper';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Account from './pages/Account';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ZoomProvider } from './contexts/ZoomContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { TipTapFocusProvider } from './contexts/TipTapFocusContext';
import { Toaster } from './components/ui/sonner';
import HelpButton from './components/HelpButton';
import AnimatedBackgroundGradient from './components/AnimatedBackgroundGradient';
import './App.css';

const AppContent = () => {
  const componentRef = useRef();
  const { getGradientClass } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${getGradientClass()}`}>
      <AnimatedBackgroundGradient />
      <div className="grain-overlay" />
      <Toaster position="bottom-left" />
      <HelpButton />
      <ZoomControl />
      
      <Routes>
        {/* Auth Routes - No Zoom, No FloatingButton constraints */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Account Page - With Zoom wrapper */}
        <Route path="/account" element={
          <PrivateRoute>
            <ZoomWrapper>
              <Account />
            </ZoomWrapper>
          </PrivateRoute>
        } />
        
        {/* Editor Route - With Zoom wrapper */}
        <Route path="/" element={
          <ZoomWrapper>
            <main className="flex-grow px-6 overflow-auto no-print flex justify-center">
              <div className="w-full flex justify-center">
                <div
                  ref={componentRef}
                  className="w-full max-w-5xl print:bg-white"
                >
                  <Editor />
                </div>
              </div>
            </main>
          </ZoomWrapper>
        } />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ZoomProvider>
          <TipTapFocusProvider>
            <Router>
              <AppContent />
            </Router>
          </TipTapFocusProvider>
        </ZoomProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
