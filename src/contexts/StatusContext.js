import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const StatusContext = createContext(null);

/**
 * Status types and their colors based on ContentBox categories:
 * - Success: Therapie (Green) #52C41A
 * - Error: Definition (Red) #EB5547
 * - Warning: Merke (Yellow) #FAAD14
 * - Info/Default: Blue #39F
 */
export const STATUS_TYPES = {
  // Default states (blue)
  saving: { type: 'saving', color: '#39F', textColor: 'white', isLoading: true },
  exporting: { type: 'exporting', color: '#39F', textColor: 'white', isLoading: true },
  synced: { type: 'synced', color: '#39F', textColor: 'white', isLoading: false },
  info: { type: 'info', color: '#39F', textColor: 'white', isLoading: false },
  
  // Success (green - Therapie)
  success: { type: 'success', color: '#52C41A', textColor: 'white', isLoading: false },
  
  // Error (red - Definition)
  error: { type: 'error', color: '#EB5547', textColor: 'white', isLoading: false },
  
  // Warning (yellow - Merke)
  warning: { type: 'warning', color: '#FAAD14', textColor: 'white', isLoading: false },
  
  // Confirm dialog (red - destructive action)
  confirm: { type: 'confirm', color: '#EB5547', textColor: 'white', isLoading: false },
  
  // Session timeout warning (yellow)
  sessionTimeout: { type: 'sessionTimeout', color: '#FAAD14', textColor: 'white', isLoading: false },
};

export const StatusProvider = ({ children }) => {
  const [currentStatus, setCurrentStatus] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const hideTimeoutRef = useRef(null);
  const queueRef = useRef([]);
  const isProcessingRef = useRef(false);
  const currentStatusRef = useRef(null); // Ref to track current status synchronously
  const confirmResolveRef = useRef(null); // Ref for confirm dialog promise
  const sessionTimeoutCallbacksRef = useRef(null); // Ref for session timeout callbacks

  const clearTimeouts = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const hideStatus = useCallback(() => {
    setIsHiding(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsHiding(false);
      setCurrentStatus(null);
      currentStatusRef.current = null;
      isProcessingRef.current = false;
      
      // Process next item in queue
      if (queueRef.current.length > 0) {
        const nextStatus = queueRef.current.shift();
        setTimeout(() => showStatusInternal(nextStatus), 100);
      }
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showStatusInternal = useCallback((status) => {
    clearTimeouts();
    isProcessingRef.current = true;
    currentStatusRef.current = status;
    
    setCurrentStatus(status);
    setIsHiding(false);
    setIsVisible(true);

    // Auto-hide after duration
    // - Errors: 4s
    // - Warnings: 3.5s
    // - Success/Info: 2.5s
    // - Persistent (saving/exporting): never
    const duration = status.duration || 
      (status.type === 'error' ? 4000 : 
       status.type === 'warning' ? 3500 : 2500);
    
    // Don't auto-hide for persistent states like saving/exporting
    if (!status.persistent) {
      hideTimeoutRef.current = setTimeout(() => {
        hideStatus();
      }, duration);
    }
  }, [clearTimeouts, hideStatus]);

  const showStatus = useCallback((type, message, options = {}) => {
    const statusConfig = STATUS_TYPES[type] || STATUS_TYPES.info;
    const status = {
      ...statusConfig,
      message,
      description: options.description,
      duration: options.duration,
      persistent: options.persistent || false,
    };

    // Use ref for synchronous access to current status
    const current = currentStatusRef.current;

    // If currently showing a status, handle based on priority
    if (isProcessingRef.current && current) {
      // Persistent states (saving/exporting) should be replaced immediately by any new status
      if (current.persistent) {
        showStatusInternal(status);
      } 
      // Error messages should replace non-error messages
      else if (status.type === 'error' && current.type !== 'error') {
        showStatusInternal(status);
      }
      // Success messages should also replace current status immediately
      else if (status.type === 'success') {
        showStatusInternal(status);
      }
      // Queue other statuses
      else {
        queueRef.current.push(status);
      }
    } else {
      showStatusInternal(status);
    }
  }, [showStatusInternal]);

  // Convenience methods
  const showSuccess = useCallback((message, options) => {
    showStatus('success', message, options);
  }, [showStatus]);

  const showError = useCallback((message, options) => {
    showStatus('error', message, options);
  }, [showStatus]);

  const showWarning = useCallback((message, options) => {
    showStatus('warning', message, options);
  }, [showStatus]);

  const showInfo = useCallback((message, options) => {
    showStatus('info', message, options);
  }, [showStatus]);

  const showSaving = useCallback((message = 'Speichern…') => {
    showStatus('saving', message, { persistent: true });
  }, [showStatus]);

  const showExporting = useCallback((message = 'Exportiere…') => {
    showStatus('exporting', message, { persistent: true });
  }, [showStatus]);

  const showSynced = useCallback((message = 'Synchronisiert') => {
    showStatus('synced', message);
  }, [showStatus]);

  // Confirm dialog - returns a Promise that resolves to true (confirmed) or false (cancelled)
  const showConfirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      
      const status = {
        ...STATUS_TYPES.confirm,
        message,
        description: options.description,
        confirmLabel: options.confirmLabel || 'Bestätigen',
        cancelLabel: options.cancelLabel || 'Abbrechen',
        persistent: true, // Don't auto-hide
        isConfirm: true,
      };
      
      showStatusInternal(status);
    });
  }, [showStatusInternal]);

  // Handle confirm button click
  const handleConfirm = useCallback(() => {
    if (confirmResolveRef.current) {
      confirmResolveRef.current(true);
      confirmResolveRef.current = null;
    }
    hideStatus();
  }, [hideStatus]);

  // Handle cancel button click
  const handleCancel = useCallback(() => {
    if (confirmResolveRef.current) {
      confirmResolveRef.current(false);
      confirmResolveRef.current = null;
    }
    if (sessionTimeoutCallbacksRef.current?.onLogout) {
      sessionTimeoutCallbacksRef.current.onLogout();
      sessionTimeoutCallbacksRef.current = null;
    }
    hideStatus();
  }, [hideStatus]);

  // Show session timeout warning with countdown
  const showSessionTimeout = useCallback((timeRemaining, callbacks) => {
    sessionTimeoutCallbacksRef.current = callbacks;
    
    const status = {
      ...STATUS_TYPES.sessionTimeout,
      timeRemaining,
      confirmLabel: 'Verlängern',
      cancelLabel: 'Abmelden',
      persistent: true,
      isSessionTimeout: true,
    };
    
    showStatusInternal(status);
  }, [showStatusInternal]);

  // Update session timeout countdown
  const updateSessionTimeout = useCallback((timeRemaining) => {
    if (!currentStatusRef.current?.isSessionTimeout) return;
    
    setCurrentStatus(prev => ({
      ...prev,
      timeRemaining,
    }));
  }, []);

  // Hide session timeout and extend session
  const handleExtendSession = useCallback(() => {
    if (sessionTimeoutCallbacksRef.current?.onExtend) {
      sessionTimeoutCallbacksRef.current.onExtend();
      sessionTimeoutCallbacksRef.current = null;
    }
    hideStatus();
  }, [hideStatus]);

  // Hide session timeout warning
  const hideSessionTimeout = useCallback(() => {
    if (currentStatusRef.current?.isSessionTimeout) {
      sessionTimeoutCallbacksRef.current = null;
      hideStatus();
    }
  }, [hideStatus]);

  const hide = useCallback(() => {
    // If hiding a confirm dialog, treat as cancel
    if (confirmResolveRef.current) {
      confirmResolveRef.current(false);
      confirmResolveRef.current = null;
    }
    clearTimeouts();
    hideStatus();
  }, [clearTimeouts, hideStatus]);

  const value = {
    currentStatus,
    isVisible,
    isHiding,
    showStatus,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showSaving,
    showExporting,
    showSynced,
    showConfirm,
    handleConfirm,
    handleCancel,
    hide,
    // Session timeout
    showSessionTimeout,
    updateSessionTimeout,
    hideSessionTimeout,
    handleExtendSession,
  };

  return (
    <StatusContext.Provider value={value}>
      {children}
    </StatusContext.Provider>
  );
};

export const useStatus = () => {
  const context = useContext(StatusContext);
  if (!context) {
    throw new Error('useStatus must be used within a StatusProvider');
  }
  return context;
};

export default StatusContext;
