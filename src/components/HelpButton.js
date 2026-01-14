import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QuestionMark, GitCommit } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { useStatus } from '../contexts/StatusContext';
import { useAuth } from '../contexts/AuthContext';
import packageJson from '../../package.json';

// App Version aus package.json
const APP_VERSION = packageJson.version;

// Vercel Build ID (kurze Version des Commit SHA)
const VERCEL_BUILD = process.env.REACT_APP_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local';

/**
 * Custom Help Button that triggers the Help Scout Beacon
 * Styled to match the ZoomControl bar visual language
 * Also displays app version and Vercel build ID
 */
const HelpButton = () => {
  const [isBeaconOpen, setIsBeaconOpen] = useState(false);
  const [isBeaconAvailable, setIsBeaconAvailable] = useState(false);
  const { timeOfDay } = useTheme();
  const { showWarning } = useStatus();
  const { user, profile, organization } = useAuth();

  // Helper to get display name from profile
  const getDisplayName = () => {
    if (profile?.first_name || profile?.last_name) {
      return [profile.first_name, profile.last_name].filter(Boolean).join(' ');
    }
    return user?.email?.split('@')[0] || '';
  };

  // Helper to identify user in Beacon (pre-fill feedback form)
  const identifyUserInBeacon = () => {
    if (!window.Beacon || !user?.email) return;
    
    // Build identify object with only non-empty values
    // Empty strings can cause 400 errors in Helpscout
    const identifyData = {
      email: user.email,
    };
    
    const displayName = getDisplayName();
    if (displayName) {
      identifyData.name = displayName;
    }
    
    if (organization?.name) {
      identifyData.company = organization.name;
    }
    
    // Avatar: only include if it's a valid URL (must start with http)
    // Helpscout requires: valid URL like "http://path.to/image.png"
    if (profile?.avatar_url && profile.avatar_url.startsWith('http')) {
      // Remove any query parameters (cache busters etc.)
      const cleanAvatarUrl = profile.avatar_url.split('?')[0];
      identifyData.avatar = cleanAvatarUrl;
    }
    
    if (profile?.job_position) {
      identifyData.jobTitle = profile.job_position;
    }
    
    window.Beacon('identify', identifyData);
  };


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
      // Identify user before opening (pre-fills name/email in feedback form)
      try {
        identifyUserInBeacon();
      } catch (e) {
        console.warn('Beacon identify failed:', e);
      }
      window.Beacon('toggle');
    } else {
      // Show informative warning when Beacon is blocked
      showWarning('Live-Chat aktuell nicht verfügbar.', {
        description: 'Ad-Blocker aktiv – E-Mail an support@example.com',
        duration: 4000,
      });
    }
  };

  // Text color based on theme
  const textColor = timeOfDay === 'night' ? '#ffffff' : '#003366';

  const helpButton = (
    <div 
      id="help-button-bar"
      className="fixed bottom-6 left-6 z-50 no-print hidden lg:flex items-center gap-3"
    >
      {/* Help Button - matches ZoomControl styling */}
      <div className="bg-popover rounded-lg border border-border p-1 shadow-lg relative">
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

      {/* Version and Build Display */}
      <div 
        className="flex flex-col text-[10px] font-medium select-none leading-tight"
        style={{ color: textColor }}
      >
        <span>SOP Editor {APP_VERSION}</span>
        <span className="opacity-70 flex items-center gap-1"><a href="https://github.com/nico-fjnland/sop-generator" target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-center gap-0.5"><GitCommit size={10} weight="regular" />{VERCEL_BUILD}</a> • <a href="https://fjnland.de" target="_blank" rel="noopener noreferrer" className="hover:underline">fjnland.de</a></span>
      </div>
    </div>
  );

  // Portal zum body - wie ZoomControl
  return createPortal(helpButton, document.body);
};

export default HelpButton;
