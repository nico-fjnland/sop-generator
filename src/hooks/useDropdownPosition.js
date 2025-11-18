import { useState, useEffect, useRef, useMemo } from 'react';
import { rafThrottle } from '../utils/performance';

/**
 * Custom hook to calculate dropdown position with collision detection
 * OPTIMIZED: Uses RAF throttling for scroll/resize events
 * @param {boolean} isOpen - Whether the dropdown is open
 * @param {React.RefObject} triggerRef - Ref to the trigger element
 * @param {string} preferredPosition - Preferred position: 'bottom', 'top', 'left', 'right'
 * @param {number} offset - Offset in pixels from trigger element
 * @returns {Object} - { dropdownRef, position }
 */
export const useDropdownPosition = (isOpen, triggerRef, preferredPosition = 'bottom', offset = 4) => {
  const dropdownRef = useRef(null);
  const [position, setPosition] = useState({ top: 'auto', left: 'auto', transform: 'none' });

  // Memoize the throttled calculation function
  const throttledCalculate = useMemo(
    () => rafThrottle(() => {
      if (!isOpen || !triggerRef.current || !dropdownRef.current) return;
      
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      // Get actual dropdown dimensions after it's rendered
      const menuWidth = dropdownRef.current.offsetWidth || 220; // Default width from CSS
      const menuHeight = dropdownRef.current.offsetHeight || 200; // Approximate height
      
      let top = 'auto';
      let bottom = undefined;
      let left = 'auto';
      let right = undefined;
      let positionType = 'absolute'; // Use absolute positioning relative to parent
      let transform = 'none';

      // Calculate position based on preferred position
      if (preferredPosition === 'bottom') {
        // Default: position directly below trigger (relative positioning)
        top = `calc(100% + ${offset}px)`;
        left = '0';
        
        // Check if menu would go off bottom of viewport
        const wouldOverflowBottom = triggerRect.bottom + menuHeight + offset > viewportHeight;
        const canFitAbove = triggerRect.top - menuHeight - offset > 0;
        
        if (wouldOverflowBottom && canFitAbove) {
          // Position above instead - still relative to trigger
          top = 'auto';
          bottom = `calc(100% + ${offset}px)`;
        } else if (wouldOverflowBottom && !canFitAbove) {
          // Can't fit above, but keep it relative to trigger
          // Adjust vertically to stay in viewport
          const availableBottom = viewportHeight - triggerRect.bottom;
          if (availableBottom < menuHeight) {
            const shiftUp = menuHeight - availableBottom + 10;
            top = `calc(100% + ${offset - shiftUp}px)`;
          } else {
            top = `calc(100% + ${offset}px)`;
          }
        }
        
        // Check horizontal overflow - only adjust if necessary
        if (triggerRect.left + menuWidth > viewportWidth) {
          // Align to right edge of trigger
          left = 'auto';
          right = '0';
        }
      } else if (preferredPosition === 'top') {
        // Position directly above trigger (relative positioning)
        // Use absolute positioning relative to parent, but allow overflow
        positionType = 'absolute';
        bottom = `calc(100% + ${offset}px)`;
        // Account for text marginLeft (20px) to align with text content
        left = '20px';
        
        // Check horizontal overflow - only adjust if necessary
        // Keep left aligned to trigger by default
        const triggerLeft = triggerRect.left;
        if (triggerLeft + 20 + menuWidth > viewportWidth) {
          // Align to right edge of trigger instead
          left = 'auto';
          right = '0';
        }
      } else if (preferredPosition === 'right') {
        // Default: position directly to the right of trigger (relative positioning)
        top = '0';
        left = `calc(100% + ${offset}px)`;
        let needsAdjustment = false;
        
        // Check if menu would go off right of viewport
        const wouldOverflowRight = triggerRect.right + menuWidth + offset > viewportWidth;
        const canFitLeft = triggerRect.left - menuWidth - offset > 0;
        
        if (wouldOverflowRight && canFitLeft) {
          // Position to the left instead - still relative to trigger
          left = 'auto';
          right = `calc(100% + ${offset}px)`;
        } else if (wouldOverflowRight && !canFitLeft) {
          // Can't fit left, but keep it relative to trigger
          // Just ensure it doesn't go too far off screen
          left = `calc(100% + ${offset}px)`;
          needsAdjustment = true;
        }
        
        // Check vertical overflow - adjust only if necessary, but keep relative positioning
        if (triggerRect.top + menuHeight > viewportHeight) {
          // Shift up to fit, but keep relative to trigger
          const availableBottom = viewportHeight - triggerRect.top;
          if (availableBottom < menuHeight) {
            const shiftUp = menuHeight - availableBottom + 10;
            top = `-${shiftUp}px`;
          }
        }
        if (triggerRect.top < 0) {
          // If trigger is above viewport, shift down
          const shiftDown = -triggerRect.top + 10;
          top = `${shiftDown}px`;
        }
      } else if (preferredPosition === 'left') {
        top = triggerRect.top + scrollY;
        left = triggerRect.left - menuWidth - offset + scrollX;
        
        // Check if menu goes off left of viewport
        if (triggerRect.left - menuWidth - offset < 0) {
          // Try to position to the right instead
          if (triggerRect.right + menuWidth + offset < viewportWidth) {
            left = triggerRect.right + offset + scrollX;
          } else {
            // If can't fit right, position at left edge of viewport
            left = scrollX + 10;
          }
        }
        
        // Check vertical overflow
        if (triggerRect.top + menuHeight > viewportHeight) {
          top = viewportHeight - menuHeight - 10 + scrollY;
        }
        if (top < scrollY) {
          top = scrollY + 10;
        }
      }

      // Build position object - always use absolute for relative positioning
      // For right/left menus, we always use relative values, so keep absolute
      const positionObj = { position: positionType };
      if (top !== 'auto' && top !== undefined) positionObj.top = top;
      if (bottom !== undefined) positionObj.bottom = bottom;
      if (left !== 'auto' && left !== undefined) positionObj.left = left;
      if (right !== undefined) positionObj.right = right;
      if (transform !== 'none') positionObj.transform = transform;
      
      setPosition(positionObj);
    }),
    [isOpen]
  );

  useEffect(() => {
    if (!isOpen) return;

    // Calculate position after a short delay to ensure dropdown is rendered
    const timeoutId = setTimeout(() => throttledCalculate(), 0);
    
    // Recalculate on scroll and resize - now throttled with RAF
    window.addEventListener('scroll', throttledCalculate, true);
    window.addEventListener('resize', throttledCalculate);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', throttledCalculate, true);
      window.removeEventListener('resize', throttledCalculate);
    };
  }, [isOpen, triggerRef, preferredPosition, offset, throttledCalculate]);

  return { dropdownRef, position };
};

