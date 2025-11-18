import { useEffect } from 'react';

/**
 * Custom hook to detect clicks outside of specified elements
 * Consolidates duplicate click-outside logic from multiple components
 * 
 * @param {Array<React.RefObject>} refs - Array of refs to check
 * @param {Function} handler - Callback when click outside is detected
 * @param {boolean} active - Whether the listener is active (default: true)
 * 
 * @example
 * const dropdownRef = useRef(null);
 * const triggerRef = useRef(null);
 * 
 * useClickOutside([dropdownRef, triggerRef], () => {
 *   setIsOpen(false);
 * }, isOpen);
 */
export const useClickOutside = (refs, handler, active = true) => {
  useEffect(() => {
    if (!active) return;
    
    const handleClickOutside = (event) => {
      // Check if click is outside all specified refs
      const isOutside = refs.every(ref => 
        !ref.current || !ref.current.contains(event.target)
      );
      
      if (isOutside) {
        handler(event);
      }
    };
    
    // Use mousedown instead of click for better UX
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [refs, handler, active]);
};

