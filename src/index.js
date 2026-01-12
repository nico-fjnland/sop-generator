import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

// Suppress ResizeObserver loop error - this is a benign error that doesn't affect functionality
// It occurs when ResizeObserver cannot deliver all observations in a single animation frame
// Many libraries (including ReactFlow) can trigger this, and it's safe to ignore
const suppressResizeObserverError = () => {
  const errorHandler = (e) => {
    if (e.message?.includes('ResizeObserver loop')) {
      e.stopImmediatePropagation();
      e.stopPropagation();
      e.preventDefault();
      return true;
    }
  };
  
  window.addEventListener('error', errorHandler);
  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason?.message?.includes('ResizeObserver loop')) {
      e.preventDefault();
    }
  });
  
  // Also patch the global ResizeObserver to catch errors at source
  const OriginalResizeObserver = window.ResizeObserver;
  window.ResizeObserver = class ResizeObserver extends OriginalResizeObserver {
    constructor(callback) {
      super((entries, observer) => {
        requestAnimationFrame(() => {
          try {
            callback(entries, observer);
          } catch (e) {
            // Silently ignore ResizeObserver errors
          }
        });
      });
    }
  };
};

suppressResizeObserverError();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    <SpeedInsights />
    <Analytics />
  </React.StrictMode>
);

