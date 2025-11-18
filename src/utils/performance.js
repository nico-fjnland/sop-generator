/**
 * Performance utility functions for optimizing React components
 */

/**
 * Debounce function - delays execution until after wait time has passed
 * Use for: expensive operations that should only run after user stops action
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function - limits execution to once per wait time
 * Use for: continuous events like scroll, resize where you need regular updates
 * @param {Function} func - Function to throttle
 * @param {number} wait - Minimum time between executions in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, wait) => {
  let timeout = null;
  let lastRan = null;
  
  return function executedFunction(...args) {
    if (!lastRan) {
      func(...args);
      lastRan = Date.now();
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if ((Date.now() - lastRan) >= wait) {
          func(...args);
          lastRan = Date.now();
        }
      }, wait - (Date.now() - lastRan));
    }
  };
};

/**
 * RequestAnimationFrame throttle - limits to one call per animation frame
 * Use for: visual updates that should sync with browser paint
 * @param {Function} func - Function to throttle
 * @returns {Function} RAF-throttled function
 */
export const rafThrottle = (func) => {
  let rafId = null;
  
  return function executedFunction(...args) {
    if (rafId !== null) return;
    
    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
};

