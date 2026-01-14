/**
 * Logger utility for environment-aware console output.
 * 
 * In production (NODE_ENV !== 'development'):
 * - log, debug, info are silenced
 * - warn and error still output (important for debugging production issues)
 * 
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.log('Debug info');
 *   logger.error('Error:', error);
 */

const isDevelopment = process.env.NODE_ENV === 'development';

// No-op function for silenced logs
const noop = () => {};

/**
 * Logger object with environment-aware methods
 */
export const logger = {
  /**
   * Log debug information (development only)
   */
  log: isDevelopment ? console.log.bind(console) : noop,
  
  /**
   * Log debug information (development only)
   */
  debug: isDevelopment ? console.debug.bind(console) : noop,
  
  /**
   * Log informational messages (development only)
   */
  info: isDevelopment ? console.info.bind(console) : noop,
  
  /**
   * Log warnings (always active - important for debugging)
   */
  warn: console.warn.bind(console),
  
  /**
   * Log errors (always active - critical for debugging)
   */
  error: console.error.bind(console),
};

export default logger;
