import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QuestionMark, EnvelopeSimple, Warning } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import packageJson from '../../package.json';

// Support email - change this to your actual support email
const SUPPORT_EMAIL = 'support@example.com';

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
      // Show informative toast when Beacon is blocked
      toast.warning(
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 font-medium">
            <Warning size={18} weight="fill" />
            <span>Live-Chat nicht verfügbar</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Der Support-Chat wird vermutlich durch einen Ad-Blocker oder Browser-Einstellung blockiert.
          </p>
          <div className="flex gap-2 mt-1">
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1.5 h-8"
              onClick={() => {
                window.location.href = `mailto:${SUPPORT_EMAIL}?subject=SOP%20Editor%20Hilfe`;
              }}
            >
              <EnvelopeSimple size={14} weight="bold" />
              Per E-Mail kontaktieren
            </Button>
          </div>
        </div>,
        {
          duration: 8000,
          id: 'beacon-blocked', // Prevent duplicate toasts
        }
      );
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
      <div className="bg-popover rounded-lg border border-border p-1 relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
          className={`h-8 w-8 hover:bg-accent hover:text-accent-foreground ${
            isBeaconOpen ? 'bg-accent text-accent-foreground' : ''
          }`}
          title={isBeaconAvailable ? 'Hilfe & Support' : 'Live-Chat blockiert – klicken für Alternativen'}
          aria-label="Hilfe öffnen"
        >
          <QuestionMark size={16} weight="bold" />
        </Button>
        {/* Small warning indicator when Beacon is blocked */}
        {!isBeaconAvailable && (
          <div 
            className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-popover"
            title="Chat blockiert"
          />
        )}
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
