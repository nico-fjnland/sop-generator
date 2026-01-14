import { useSessionTimeout } from '../hooks/useSessionTimeout';

/**
 * Session Timeout Warning Component
 * 
 * This component initializes the session timeout hook which monitors
 * user activity and shows a warning in the StatusIndicator when
 * the session is about to expire.
 * 
 * It doesn't render anything itself - the warning is displayed
 * through the StatusContext in the StatusIndicator component.
 */
const SessionTimeoutWarning = () => {
  // Initialize session timeout monitoring
  // The hook handles everything through StatusContext
  useSessionTimeout();

  // This component doesn't render anything
  return null;
};

export default SessionTimeoutWarning;
