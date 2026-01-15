import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStatus } from '../contexts/StatusContext';
import { logger } from '../utils/logger';

/**
 * Session timeout duration in minutes.
 * After this period of inactivity, the user will be automatically logged out.
 */
const TIMEOUT_MINUTES = 30;

/**
 * Warning duration in minutes before timeout.
 * Shows a warning this many minutes before auto-logout.
 */
const WARNING_MINUTES = 2;

/**
 * Hook for automatic session timeout after inactivity.
 * 
 * Listens for user activity (mouse, keyboard, scroll, touch) and
 * resets the timeout timer on each interaction. If no activity
 * is detected for TIMEOUT_MINUTES, the user is automatically logged out.
 * 
 * A warning is shown in the StatusIndicator WARNING_MINUTES before timeout occurs.
 * 
 * Usage:
 *   useSessionTimeout(); // Just call it, it handles everything
 */
export const useSessionTimeout = () => {
  const { user, signOut } = useAuth();
  const { showSessionTimeout, updateSessionTimeout, hideSessionTimeout } = useStatus();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const countdownRef = useRef(null);
  const isWarningActiveRef = useRef(false);

  const handleLogout = useCallback(async () => {
    logger.log('Session timeout - logging out user');
    isWarningActiveRef.current = false;
    
    try {
      await signOut();
      // Redirect to login page with timeout flag
      window.location.href = '/login?reason=timeout';
    } catch (error) {
      logger.error('Session timeout logout failed:', error);
      window.location.href = '/login?reason=timeout';
    }
  }, [signOut]);

  const resetTimer = useCallback(() => {
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    // Hide warning if shown
    if (isWarningActiveRef.current) {
      hideSessionTimeout();
      isWarningActiveRef.current = false;
    }
    
    // Only set new timeouts if user is logged in
    if (!user) return;
    
    const timeoutMs = TIMEOUT_MINUTES * 60 * 1000;
    const warningMs = (TIMEOUT_MINUTES - WARNING_MINUTES) * 60 * 1000;
    
    // Set warning timeout (fires before logout)
    warningTimeoutRef.current = setTimeout(() => {
      startCountdown();
    }, warningMs);
    
    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutMs);
  }, [user, handleLogout, hideSessionTimeout]);

  const extendSession = useCallback(() => {
    logger.log('Session extended by user');
    resetTimer();
  }, [resetTimer]);

  const startCountdown = useCallback(() => {
    let remaining = WARNING_MINUTES * 60;
    isWarningActiveRef.current = true;
    
    // Show the warning in StatusIndicator
    showSessionTimeout(remaining, {
      onExtend: extendSession,
      onLogout: handleLogout,
    });
    
    // Start countdown
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      
      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        return;
      }
      
      updateSessionTimeout(remaining);
    }, 1000);
  }, [showSessionTimeout, updateSessionTimeout, extendSession, handleLogout]);

  useEffect(() => {
    // Don't set up timeout for logged-out users
    if (!user) {
      return;
    }

    // Activity events to listen for
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    
    // Throttle event handler to avoid excessive resets
    let lastReset = Date.now();
    const throttledReset = () => {
      const now = Date.now();
      // Only reset if more than 10 seconds since last reset
      if (now - lastReset > 10000) {
        lastReset = now;
        resetTimer();
      }
    };

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, throttledReset, { passive: true });
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledReset);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [user, resetTimer]);

  return {
    /** Function to extend the session (dismiss warning and reset timer) */
    extendSession,
    /** Function to logout immediately */
    logout: handleLogout,
    /** Timeout duration in minutes (for display purposes) */
    timeoutMinutes: TIMEOUT_MINUTES,
  };
};

export default useSessionTimeout;
