/**
 * Layout constants for consistent sizing and spacing throughout the application
 */

// Page dimensions
export const PAGE = {
  WIDTH_MM: 210, // A4 width in millimeters
  WIDTH_PX: 794, // A4 width in pixels (at 96 DPI: 210mm * 96 / 25.4)
  HEIGHT_MM: 297, // A4 height in millimeters
  HEIGHT_PX: 1123, // Printable height in pixels (at 96 DPI)
  TOP_PADDING: 32, // Top padding in pixels
  SIDE_PADDING: 32, // Left/right padding in pixels
  CONTENT_WIDTH: 730, // Content area width: 794 - (32 * 2) = 730px
  // Note: No BOTTOM_PADDING - footer height is measured dynamically and includes its own padding
};

// Content box styling
export const CONTENT_BOX = {
  PADDING: {
    top: 24,
    right: 26,
    bottom: 20,
    left: 26,
  },
  CAPTION: {
    TOP_OFFSET: -10, // Centered on border
    LEFT_OFFSET: 26,
    HEIGHT: 20,
    BORDER_RADIUS: 6,
  },
  BORDER: {
    WIDTH: 1.5,
    RADIUS: 12,
  },
  MARGIN: {
    BOTTOM: 16,
    RIGHT_SINGLE: 14, // For single-column boxes
  },
};

// Hover controls (Notion-like buttons)
export const HOVER_CONTROLS = {
  BUTTON: {
    SIZE: 32, // Width and height
    BORDER_RADIUS: 999, // Fully rounded
    ICON_SIZE: 16,
  },
  POSITION: {
    LEFT_OFFSET: -10, // Distance from left edge
    GAP: 8, // Gap between buttons
  },
  ANIMATION: {
    SLIDE_DISTANCE: -50, // How far buttons slide out (in px)
    DELAY: 0.15, // Transition delay in seconds
    STAGGER: 0.05, // Delay between buttons appearing
  },
};

// Footer configuration
export const FOOTER = {
  PADDING: {
    TOP: 16,
    RIGHT: 46,
    BOTTOM: 46,
    LEFT: 46,
  },
  // Note: Footer height is measured dynamically from DOM in usePageBreaks.js
  // These are available variants (content height is determined by actual content)
  VARIANTS: ['tiny', 'small', 'signature', 'placeholder'],
};

// Header configuration
export const HEADER = {
  PADDING: {
    TOP: 14,
    RIGHT: 14,
    BOTTOM: 14,
    LEFT: 14,
  },
  LOGO: {
    WIDTH: 87.6,
    HEIGHT: 49.2,
    CONTAINER_WIDTH: 155.4, // Increased by 50% (was 103.6)
    CONTAINER_HEIGHT: 65.2,
  },
  MARGIN_BOTTOM: 32, // Space below header (in screen mode)
};

// Page Header (for pages 2+) - shows SOP title and page number
export const PAGE_HEADER = {
  HEIGHT: 22, // Approximate height including margin
  MARGIN_BOTTOM: 12,
  PADDING_RIGHT: 14,
  FONT_SIZE: 9, // Small font size (matches SmallFont mark)
};

// Dropdown menus
export const DROPDOWN = {
  WIDTH: 220,
  MAX_HEIGHT: 300,
  BORDER_RADIUS: 12,
  PADDING: 12,
  OFFSET: 4, // Distance from trigger element
  Z_INDEX: 10000,
  ITEM: {
    PADDING_Y: 6,
    PADDING_X: 8,
    MIN_HEIGHT: 32,
    ICON_SIZE: 18,
    CHECK_ICON_SIZE: 14,
    GAP: 8,
  },
};

// Drag and drop
export const DRAG_DROP = {
  INDICATOR: {
    HEIGHT: 2,
    COLOR: '#3399FF',
  },
  GHOST: {
    OPACITY: 0.95,
    ROTATION: 1, // degrees
    SHADOW: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  ORIGINAL_OPACITY: 0.4, // Opacity of original element during drag
};

// Colors (commonly used)
export const COLORS = {
  PRIMARY: '#003366',
  ACCENT: '#3399FF',
  BORDER: 'rgba(0, 51, 102, 0.08)',
  BACKGROUND_GRAY: '#FAFAFA',
  TEXT_GRAY: '#666666',
  ERROR: '#EB5547',
  SUCCESS: '#52C41A',
  WARNING: '#FAAD14',
};

// Z-index layers
export const Z_INDEX = {
  DROPDOWN: 10000,
  HOVER_CONTROLS: 10001,
  DRAG_IMAGE: 10001,
  MODAL: 10002,
};

// Timing constants
export const TIMING = {
  DEBOUNCE: {
    PAGE_BREAK_CALC: 150, // Debounce page break calculations
    TEXT_INPUT: 100, // Debounce text content sync
  },
  THROTTLE: {
    SCROLL: 100, // Throttle scroll events
    RESIZE: 200, // Throttle resize events
    DROPDOWN_POSITION: 100, // Throttle dropdown position updates
  },
  ANIMATION: {
    FAST: 150, // Fast transitions (hover, click)
    NORMAL: 200, // Normal transitions
    SLOW: 300, // Slow transitions (page transitions)
  },
};

