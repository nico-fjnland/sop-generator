/**
 * Zentrale Style-Konstanten für Editor und Export
 * 
 * Diese Datei ist die EINZIGE Quelle der Wahrheit für alle Text-Styles.
 * Änderungen hier wirken sich automatisch auf Editor UND Export aus.
 * 
 * WICHTIG: Bei Änderungen an diesen Werten müssen auch die entsprechenden
 * CSS-Dateien aktualisiert werden (TextBlock.css, TipTapTableBlock.css, etc.)
 * 
 * @module editorStyles
 */

/**
 * Alle Style-Konstanten für den Editor
 */
export const EDITOR_STYLES = {
  // ============================================
  // SCHRIFTARTEN
  // ============================================
  fonts: {
    /** Hauptschriftart für Fließtext */
    primary: "'Roboto', sans-serif",
    /** Schriftart für Überschriften und Labels */
    heading: "'Quicksand', sans-serif",
  },

  // ============================================
  // TEXT-STYLES (Standard-Fließtext)
  // ============================================
  text: {
    fontSize: '11px',
    lineHeight: 1.5,
    fontWeight: 400,
    color: '#003366',
  },

  // ============================================
  // SMALL TEXT (Kleiner Text, z.B. für Edge-Labels im Flowchart)
  // ============================================
  smallText: {
    fontSize: '9px',
    fontWeight: 500,
  },

  // ============================================
  // HEADING-STYLES (Überschriften innerhalb Content-Boxen)
  // WICHTIG: lineHeight ist bewusst größer als bei normalem Text!
  // ============================================
  heading: {
    fontSize: '11px',
    lineHeight: 1.8,  // Größer als text.lineHeight für bessere Lesbarkeit
    fontWeight: 600,
  },

  // ============================================
  // LISTEN-STYLES (Aufzählungen)
  // ============================================
  list: {
    paddingLeft: '12px',
    itemMarginBottom: '2px',
    bulletListStyle: 'disc',
    orderedListStyle: 'decimal',
  },

  // ============================================
  // HIGHLIGHT-ITEM (Auszeichnung mit Pfeil-Icon)
  // ============================================
  highlightItem: {
    paddingLeft: '20px',
    iconTop: '2px',
    iconSize: '14px',
    margin: '8px 0',
    minHeight: '18px',
  },

  // ============================================
  // CONTENT-BOX
  // ============================================
  contentBox: {
    borderWidth: '1.8px',
    borderRadius: '6px',
    padding: '24px 26px 20px 26px',
    captionFontSize: '9px',
    captionLetterSpacing: '1.05px',
  },

  // ============================================
  // TABELLEN
  // ============================================
  table: {
    cellPadding: '6px 14px',
    headerBackground: '#003366',
    headerColor: 'white',
    borderColor: '#d1d5db',
    wrapperBorderRadius: '6px',
    wrapperBorderWidth: '1.8px',
  },

  // ============================================
  // A4 SEITE
  // ============================================
  page: {
    width: '210mm',
    height: '297mm',
    contentPadding: '16px 32px 0 32px',
  },

  // ============================================
  // SOP HEADER
  // ============================================
  sopHeader: {
    titleFontSize: '32px',
    titleFontWeight: 600,
    titleLetterSpacing: '1.04px',
    standFontSize: '12px',
    standLetterSpacing: '2px',
    logoMaxWidth: '140px',
    logoHeight: '70px',
  },

  // ============================================
  // ZWEI-SPALTEN LAYOUT
  // ============================================
  twoColumnLayout: {
    gap: '16px',
  },

  // ============================================
  // FLOWCHART
  // ============================================
  flowchart: {
    /** Border radius für Edge-Connector-Lines (abgerundete Ecken) */
    edgeBorderRadius: 8,
    /** Visueller Abstand zwischen Edge und Node */
    edgeGap: 2,
    /** Stroke-Farbe für Edges */
    edgeStrokeColor: '#003366',
    /** Stroke-Breite für Edges */
    edgeStrokeWidth: 1,
    /** Schwellenwert für Edge-Snapping (px) - Differenz unter der Edges gerade gezeichnet werden */
    edgeSnapThreshold: 10,
    
    /** Font-Size für Node-Text (muss mit FlowchartBlock.css synchron sein) */
    nodeFontSize: '11px',
    
    /** Node-Type-spezifische Styles (fill, stroke, textColor, strokeStyle)
     *  Diese Werte müssen mit FlowchartBlock.css synchron gehalten werden!
     */
    nodeStyles: {
      start: { fill: '#E8FAF9', stroke: '#47D1C6', textColor: '#47D1C6', strokeStyle: 'solid' },
      phase: { fill: '#E5F2FF', stroke: '#003366', textColor: '#003366', strokeStyle: 'solid' },
      aktion: { fill: '#FFFFFF', stroke: '#003366', textColor: '#003366', strokeStyle: 'solid' },
      positive: { fill: '#ECF9EB', stroke: '#52C41A', textColor: '#52C41A', strokeStyle: 'solid' },
      negative: { fill: '#FCEAE8', stroke: '#EB5547', textColor: '#EB5547', strokeStyle: 'solid' },
      neutral: { fill: '#FFF7E6', stroke: '#FAAD14', textColor: '#B27700', strokeStyle: 'solid' },
      high: { fill: 'white', stroke: '#003366', textColor: '#003366', strokeStyle: 'solid' },
      low: { fill: 'white', stroke: '#003366', textColor: '#003366', strokeStyle: 'solid' },
      equal: { fill: 'white', stroke: '#003366', textColor: '#003366', strokeStyle: 'solid' },
      label: { fill: 'transparent', stroke: 'none', textColor: '#6b7280', strokeStyle: 'none' },
      comment: { fill: 'white', stroke: '#3399FF', textColor: '#3399FF', strokeStyle: 'dashed' },
    },
    
    /** Icon-Farben für high/low/equal Nodes */
    iconColors: {
      high: '#EB5547',
      low: '#3399FF',
      equal: '#FAAD14',
    },
  },
};

/**
 * Generiert CSS-String aus den Konstanten für den Export
 * Diese Funktion wird vom htmlSerializer verwendet, um die Export-CSS zu generieren.
 * 
 * @returns {string} CSS-String mit allen relevanten Styles
 */
export const generateExportCSS = () => {
  const s = EDITOR_STYLES;
  
  return `
    /* ============================================
       TIPTAP EDITOR TEXT STYLES
       Generiert aus src/styles/editorStyles.js
       ============================================ */
    .tiptap-wrapper {
      width: 100% !important;
    }
    
    .tiptap-editor,
    .ProseMirror {
      font-family: ${s.fonts.primary} !important;
      font-size: ${s.text.fontSize} !important;
      line-height: ${s.text.lineHeight} !important;
      font-weight: ${s.text.fontWeight} !important;
      color: ${s.text.color} !important;
      overflow-wrap: break-word !important;
      word-wrap: break-word !important;
      word-break: break-word !important;
      white-space: normal !important;
    }
    
    .tiptap-editor p,
    .ProseMirror p {
      margin: 0 !important;
      padding: 0 !important;
      line-height: ${s.text.lineHeight} !important;
    }
    
    .tiptap-heading {
      font-size: ${s.heading.fontSize} !important;
      line-height: ${s.heading.lineHeight} !important;
      font-weight: ${s.heading.fontWeight} !important;
    }
    
    /* List styles */
    .tiptap-editor ul,
    .tiptap-editor .bullet-list,
    .ProseMirror ul {
      margin: 0 !important;
      padding-left: ${s.list.paddingLeft} !important;
      list-style-type: ${s.list.bulletListStyle} !important;
      list-style-position: outside !important;
    }
    
    .tiptap-editor ol,
    .tiptap-editor .ordered-list,
    .ProseMirror ol {
      margin: 0 !important;
      padding-left: ${s.list.paddingLeft} !important;
      list-style-type: ${s.list.orderedListStyle} !important;
      list-style-position: outside !important;
    }
    
    .tiptap-editor li,
    .ProseMirror li {
      margin: 0 0 ${s.list.itemMarginBottom} 0 !important;
      padding: 0 !important;
    }
    
    /* Hide trailing empty paragraph */
    .tiptap-editor > p:last-child:empty,
    .tiptap-editor > p:last-child:has(> br:only-child),
    .ProseMirror > p:last-child:empty,
    .ProseMirror > p:last-child:has(> br:only-child),
    .content-box-content .tiptap-editor > p:last-child:empty,
    .content-box-content .ProseMirror > p:last-child:empty,
    .tiptap-wrapper > .ProseMirror > p:last-child:empty,
    .tiptap-wrapper > .ProseMirror > p:last-child:has(> br:only-child) {
      display: none !important;
      margin: 0 !important;
      padding: 0 !important;
      height: 0 !important;
      line-height: 0 !important;
      font-size: 0 !important;
    }
    
    /* Also handle any trailing br elements */
    .tiptap-editor > p:last-child > br:only-child,
    .ProseMirror > p:last-child > br:only-child {
      display: none !important;
    }
    
    /* ============================================
       HIGHLIGHT ITEM (Auszeichnung mit Pfeil-Icon)
       ============================================ */
    .highlight-item {
      display: block !important;
      position: relative !important;
      margin: ${s.highlightItem.margin} !important;
      padding-left: ${s.highlightItem.paddingLeft} !important;
      min-height: ${s.highlightItem.minHeight} !important;
    }
    
    .highlight-item:first-child {
      margin-top: 0 !important;
    }
    
    .highlight-item:last-child {
      margin-bottom: 0 !important;
    }
    
    /* The arrow icon element */
    .highlight-item-icon {
      position: absolute !important;
      left: 0 !important;
      top: ${s.highlightItem.iconTop} !important;
      width: ${s.highlightItem.iconSize} !important;
      height: ${s.highlightItem.iconSize} !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    /* Arrow icon via CSS - the filled circle with arrow */
    .highlight-item-icon::before {
      content: "" !important;
      display: block !important;
      width: ${s.highlightItem.iconSize} !important;
      height: ${s.highlightItem.iconSize} !important;
      background-color: var(--content-box-color, ${s.text.color}) !important;
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256' fill='currentColor'%3E%3Cpath d='M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,109.66-32,32a8,8,0,0,1-11.32-11.32L148.69,136H88a8,8,0,0,1,0-16h60.69l-18.35-18.34a8,8,0,0,1,11.32-11.32l32,32A8,8,0,0,1,173.66,133.66Z'/%3E%3C/svg%3E") !important;
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256' fill='currentColor'%3E%3Cpath d='M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,109.66-32,32a8,8,0,0,1-11.32-11.32L148.69,136H88a8,8,0,0,1,0-16h60.69l-18.35-18.34a8,8,0,0,1,11.32-11.32l32,32A8,8,0,0,1,173.66,133.66Z'/%3E%3C/svg%3E") !important;
      -webkit-mask-size: contain !important;
      mask-size: contain !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .highlight-item-content {
      display: inline !important;
    }
    
    /* ============================================
       TABLE STYLES
       ============================================ */
    .tiptap-table-block,
    .tiptap-table-block-wrapper {
      margin-left: 16px !important;
      margin-right: 14px !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    /* Table wrapper with rounded corners and border */
    .tiptap-table-wrapper {
      border: ${s.table.wrapperBorderWidth} solid ${s.text.color} !important;
      border-radius: ${s.table.wrapperBorderRadius} !important;
      overflow: hidden !important;
      width: 100% !important;
    }
    
    .tiptap-table-block table,
    .tiptap-table-wrapper table,
    .tiptap-table-editor table,
    .ProseMirror table {
      border-collapse: separate !important;
      border-spacing: 0 !important;
      width: 100% !important;
      table-layout: fixed !important;
      margin: 0 !important;
    }
    
    .tiptap-table-block th,
    .tiptap-table-block td,
    .tiptap-table-wrapper th,
    .tiptap-table-wrapper td,
    .tiptap-table-editor th,
    .tiptap-table-editor td,
    .ProseMirror th,
    .ProseMirror td {
      border-right: 1px solid ${s.table.borderColor} !important;
      border-bottom: 1px solid ${s.table.borderColor} !important;
      padding: ${s.table.cellPadding} !important;
      text-align: left !important;
      vertical-align: top !important;
      font-family: ${s.fonts.primary} !important;
      font-size: ${s.text.fontSize} !important;
      line-height: ${s.text.lineHeight} !important;
      color: ${s.text.color} !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    /* Remove right border on last column */
    .tiptap-table-block td:last-child,
    .tiptap-table-block th:last-child,
    .tiptap-table-wrapper td:last-child,
    .tiptap-table-wrapper th:last-child,
    .tiptap-table-editor td:last-child,
    .tiptap-table-editor th:last-child {
      border-right: none !important;
    }
    
    /* Remove bottom border on last row */
    .tiptap-table-block tr:last-child td,
    .tiptap-table-block tr:last-child th,
    .tiptap-table-wrapper tr:last-child td,
    .tiptap-table-wrapper tr:last-child th,
    .tiptap-table-editor tr:last-child td,
    .tiptap-table-editor tr:last-child th {
      border-bottom: none !important;
    }
    
    /* Header cells - dark blue background */
    .tiptap-table-block th,
    .tiptap-table-wrapper th,
    .tiptap-table-editor th,
    .ProseMirror th {
      font-weight: ${s.heading.fontWeight} !important;
      background-color: ${s.table.headerBackground} !important;
      color: ${s.table.headerColor} !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    /* Text inside header cells */
    .tiptap-table-block th p,
    .tiptap-table-wrapper th p,
    .tiptap-table-editor th p,
    .ProseMirror th p {
      color: ${s.table.headerColor} !important;
      margin: 0 !important;
    }
    
    /* Regular cells with white background */
    .tiptap-table-block td,
    .tiptap-table-wrapper td,
    .tiptap-table-editor td {
      background-color: white !important;
    }
  `;
};

export default EDITOR_STYLES;
