import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QuestionMark } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';
import packageJson from '../../package.json';

// App Version aus package.json
const APP_VERSION = packageJson.version;

/**
 * Custom Help Button that triggers the Help Scout Beacon
 * Styled to match the ZoomControl bar visual language
 * Also displays current time (UTC+1) and app version
 */
const HelpButton = () => {
  const [isBeaconOpen, setIsBeaconOpen] = useState(false);
  const [isBeaconAvailable, setIsBeaconAvailable] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const { timeOfDay } = useTheme();

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Get UTC+1 time
      const utcPlus1 = new Date(now.getTime() + (1 * 60 * 60 * 1000));
      const hours = utcPlus1.getUTCHours().toString().padStart(2, '0');
      const minutes = utcPlus1.getUTCMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check if Beacon is available (may be blocked by ad-blockers)
    const checkBeaconAvailability = () => {
      // Beacon is available when the script has loaded and initialized
      if (window.Beacon && typeof window.Beacon === 'function') {
        setIsBeaconAvailable(true);
        
        // Configure Beacon to hide the default button
        window.Beacon('config', {
          display: {
            style: 'manual' // Hides the default Beacon button
          }
        });

        // Listen to Beacon open/close events to sync state
        window.Beacon('on', 'open', () => setIsBeaconOpen(true));
        window.Beacon('on', 'close', () => setIsBeaconOpen(false));
      }
    };

    // Check immediately and after a delay (script may still be loading)
    checkBeaconAvailability();
    const timeout = setTimeout(checkBeaconAvailability, 2000);

    // Cleanup listeners on unmount
    return () => {
      clearTimeout(timeout);
      if (window.Beacon) {
        window.Beacon('off', 'open');
        window.Beacon('off', 'close');
      }
    };
  }, []);

  const handleClick = () => {
    if (isBeaconAvailable && window.Beacon) {
      window.Beacon('toggle');
    } else {
      // Fallback: Open email if Beacon is blocked (e.g. by ad-blocker)
      // TODO: Replace with your actual support email address
      window.location.href = 'mailto:support@example.com?subject=SOP%20Editor%20Hilfe';
    }
  };

  // Text color based on theme
  const textColor = timeOfDay === 'night' ? '#ffffff' : '#003366';

  const helpButton = (
    <div 
      id="help-button-bar"
      className="fixed bottom-6 left-6 z-50 no-print flex items-center gap-3"
    >
      {/* Help Button - matches ZoomControl styling */}
      <div className="bg-popover rounded-lg border border-border p-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
          className={`h-8 w-8 hover:bg-accent hover:text-accent-foreground ${
            isBeaconOpen ? 'bg-accent text-accent-foreground' : ''
          } ${!isBeaconAvailable ? 'opacity-60' : ''}`}
          title={isBeaconAvailable ? 'Hilfe & Support' : 'Hilfe per E-Mail (Chat blockiert)'}
          aria-label="Hilfe öffnen"
        >
          <QuestionMark size={16} weight="bold" />
        </Button>
      </div>

      {/* Time and Version Display */}
      <div 
        className="flex flex-col text-[10px] font-medium select-none leading-tight"
        style={{ color: textColor }}
      >
        <span>{currentTime} Uhr (MEZ)</span>
        <span className="opacity-70">SOP Editor {APP_VERSION}</span>
      </div>
    </div>
  );

  // Portal zum body - wie ZoomControl
  return createPortal(helpButton, document.body);
};

export default HelpButton;
