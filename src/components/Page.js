import React from 'react';

/**
 * Page Component - Represents a single A4 page
 * 
 * This component creates a visual A4 page container with proper dimensions,
 * shadows, and spacing similar to Google Docs.
 * 
 * Features:
 * - A4 dimensions (210mm x 297mm)
 * - Shadow for depth
 * - Proper margins and padding
 * - Print-optimized
 * 
 * @param {React.ReactNode} children - Content to render inside the page
 * @param {number} pageNumber - Page number (1-indexed)
 * @param {boolean} isFirstPage - Whether this is the first page
 */
const Page = ({ children, pageNumber, isFirstPage = false }) => {
  return (
    <div 
      className="a4-page"
      data-page-number={pageNumber}
      data-first-page={isFirstPage}
      style={{
        width: '210mm',
        height: '297mm', // Fixed height, not min/max
        margin: '20px auto',
        background: 'white',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        overflow: 'visible', // Allow hover buttons to extend outside
        padding: 0, // No padding on page level
        boxSizing: 'border-box',
        borderRadius: '8px', // Same as toolbar (rounded-lg)
      }}
    >
      {children}
    </div>
  );
};

export default Page;

