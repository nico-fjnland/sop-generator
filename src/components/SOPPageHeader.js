import React from 'react';

/**
 * SOPPageHeader - Zeigt SOP-Titel und Seitenzahl auf Folgeseiten (ab Seite 2)
 * 
 * Dieses Element erscheint rechtsbündig über der ersten Box auf allen Seiten
 * außer der ersten Seite.
 */
const SOPPageHeader = ({ title, pageNumber, totalPages }) => {
  return (
    <div 
      className="sop-page-header"
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 12,
        paddingRight: 14,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 400,
          fontStyle: 'italic',
          color: '#003366',
          fontFamily: 'inherit',
          letterSpacing: '0.02em',
        }}
      >
        {title} — Seite {pageNumber}/{totalPages}
      </span>
    </div>
  );
};

export default SOPPageHeader;

