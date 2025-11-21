import React, { useRef, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Editor from './components/Editor';
import FloatingAccountButton from './components/FloatingAccountButton';
import ZoomControl from './components/ZoomControl';
import ZoomWrapper from './components/ZoomWrapper';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Account from './pages/Account';
import DesignManual from './pages/DesignManual';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ZoomProvider } from './contexts/ZoomContext';
import { Toaster } from './components/ui/sonner';
import './App.css';

function App() {
  const componentRef = useRef();
  const [editorGradient, setEditorGradient] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('editorGradient');
    return saved || 'light'; // 'light' or 'dark'
  });

  useEffect(() => {
    // Save preference to localStorage
    localStorage.setItem('editorGradient', editorGradient);
  }, [editorGradient]);

  const toggleEditorGradient = () => {
    setEditorGradient(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <AuthProvider>
      <ZoomProvider>
      <Router>
        <div className="min-h-screen light-gradient-bg flex flex-col transition-colors duration-200">
            <Toaster position="bottom-left" />
          <FloatingAccountButton />
          <ZoomControl />
          
          <Routes>
            {/* Auth Routes - No Zoom, No FloatingButton constraints */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Fullscreen Pages - No Zoom wrapper */}
            <Route path="/account" element={
              <PrivateRoute>
                <Account editorGradient={editorGradient} toggleEditorGradient={toggleEditorGradient} />
              </PrivateRoute>
            } />
                    <Route path="/design-manual" element={
                      <PrivateRoute>
                        <Navigate to="/account?tab=design-manual" replace />
                      </PrivateRoute>
                    } />
            
            {/* Editor Route - With Zoom wrapper */}
            <Route path="/" element={
              <ZoomWrapper>
                <main className={`flex-grow px-6 overflow-auto no-print ${editorGradient === 'light' ? 'light-gradient-bg' : 'dark-gradient-bg dark'} transition-colors duration-200 flex justify-center`}>
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
      </Router>
      </ZoomProvider>
    </AuthProvider>
  );
}

export default App;
