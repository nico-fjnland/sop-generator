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
import { StatusProvider } from './contexts/StatusContext';
import HelpButton from './components/HelpButton';
import AnimatedBackgroundGradient from './components/AnimatedBackgroundGradient';
import './App.css';

const AppContent = () => {
  const componentRef = useRef();
  const { getGradientClass, timeOfDay } = useTheme();
  
  // Gradient für Tag/Nacht-Modus (schwächer/transparenter)
  const bottomGradient = timeOfDay === 'night'
    ? 'linear-gradient(to top, rgba(10, 15, 25, 0.5) 0%, rgba(10, 15, 25, 0.25) 35%, rgba(10, 15, 25, 0.1) 60%, rgba(10, 15, 25, 0.02) 85%, transparent 100%)'
    : 'linear-gradient(to top, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.25) 35%, rgba(255, 255, 255, 0.1) 60%, rgba(255, 255, 255, 0.02) 85%, transparent 100%)';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${getGradientClass()}`}>
      {/* Background elements - fixed, nicht vom Zoom betroffen */}
      <AnimatedBackgroundGradient />
      <div className="grain-overlay" />
      
      {/* UI-Elemente außerhalb des Zoom-Wrappers - bleiben bei fixer Größe */}
      <HelpButton />
      <ZoomControl />
      
      {/* Bottom gradient für bessere Sichtbarkeit der Steuerungselemente */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-36 pointer-events-none z-40 no-print transition-all duration-300"
        style={{ background: bottomGradient }}
      />
      
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
            <main className="px-6 no-print flex justify-center pb-6">
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
        <StatusProvider>
          <ZoomProvider>
            <TipTapFocusProvider>
              <Router>
                <AppContent />
              </Router>
            </TipTapFocusProvider>
          </ZoomProvider>
        </StatusProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
