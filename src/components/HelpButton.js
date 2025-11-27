import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QuestionMark } from '@phosphor-icons/react';
import { Button } from './ui/button';

/**
 * Custom Help Button that triggers the Help Scout Beacon
 * Styled to match the ZoomControl bar visual language
 */
const HelpButton = () => {
  const [isBeaconOpen, setIsBeaconOpen] = useState(false);

  useEffect(() => {
    // Configure Beacon to hide the default button when component mounts
    if (window.Beacon) {
      window.Beacon('config', {
        display: {
          style: 'manual' // Hides the default Beacon button
        }
      });

      // Listen to Beacon open/close events to sync state
      window.Beacon('on', 'open', () => setIsBeaconOpen(true));
      window.Beacon('on', 'close', () => setIsBeaconOpen(false));
    }

    // Cleanup listeners on unmount
    return () => {
      if (window.Beacon) {
        window.Beacon('off', 'open');
        window.Beacon('off', 'close');
      }
    };
  }, []);

  const handleClick = () => {
    if (window.Beacon) {
      window.Beacon('toggle');
    }
  };

  const helpButton = (
    <div 
      id="help-button-bar"
      className="fixed bottom-6 left-6 z-50 no-print"
    >
      {/* Help Button - matches ZoomControl styling */}
      <div className="bg-popover rounded-lg border border-border p-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
          className={`h-8 w-8 hover:bg-accent hover:text-accent-foreground ${
            isBeaconOpen ? 'bg-accent text-accent-foreground' : ''
          }`}
          title="Hilfe & Support"
          aria-label="Hilfe öffnen"
        >
          <QuestionMark size={16} weight="bold" />
        </Button>
      </div>
    </div>
  );

  // Portal zum body - wie ZoomControl
  return createPortal(helpButton, document.body);
};

export default HelpButton;
