import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Editor from './components/Editor';
import { Button } from './components/ui/button';
import './App.css';

function App() {
  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'Standard Operating Procedure',
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm 15mm 10mm 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
        .content-box-block {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .block-wrapper {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .page-container:first-child {
          padding-top: 10mm !important;
        }
        .page-container:not(:first-child) {
          padding-top: 20mm !important;
        }
      }
    `,
    onBeforeGetContent: () => {
      // Ensure all content is loaded before printing
      return Promise.resolve();
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm p-4 flex justify-between items-center no-print">
        <h1 className="text-2xl font-bold text-foreground">SOP Editor</h1>
        <Button
          onClick={handlePrint}
          size="default"
          aria-label="PDF herunterladen"
        >
          PDF herunterladen
        </Button>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-8 overflow-auto no-print bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div
            ref={componentRef}
            className="print:bg-white"
          >
            <Editor />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

