import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, ImageRun, SectionType } from 'docx';
import jsPDF from 'jspdf';
import { toPng, toJpeg } from 'html-to-image';

/**
 * Exports the current editor state as a JSON file.
 * @param {Object} state - The editor state object.
 */
export const exportAsJson = (state) => {
  const date = new Date().toISOString().split('T')[0];
  const fileName = `sop-state-${date}.json`;
  const jsonString = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  saveAs(blob, fileName);
};

/**
 * Imports editor state from a JSON file.
 * @param {File} file - The uploaded JSON file.
 * @returns {Promise<Object>} - Resolves with the parsed state object.
 */
export const importFromJson = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        // Basic validation: check if 'rows' exists and is an array
        if (!json || !Array.isArray(json.rows)) {
          reject(new Error('Invalid file format: missing rows array'));
          return;
        }
        resolve(json);
      } catch (error) {
        reject(new Error('Failed to parse JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Helper to filter out non-printable elements
// We rely on CSS (.exporting-mode) to hide specific elements
const printFilter = (node) => {
  return true;
};

/**
 * Prepares the element for export by adding a temporary class
 * to force visibility of print-only elements and adjust styles.
 */
const prepareForExport = async () => {
  document.body.classList.add('exporting-mode');
  // Wait for styles to apply and layout to stabilize
  await new Promise(resolve => setTimeout(resolve, 500));
};

const cleanupAfterExport = () => {
  document.body.classList.remove('exporting-mode');
};

/**
 * Exports the current editor content as a Word document (DOCX).
 * It captures each page as an image and embeds it into the DOCX.
 * @param {HTMLElement} containerRef - Ref to the editor container element.
 */
export const exportAsWord = async (containerRef) => {
  if (!containerRef) return;

  await prepareForExport();
  
  // Select pages after preparation to ensure they are in the DOM
  const pages = Array.from(containerRef.querySelectorAll('.page-container'));
  
  if (!pages || pages.length === 0) {
    cleanupAfterExport();
    return;
  }

  const docChildren = [];

  try {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      
      // Use html-to-image to capture the page
      // Use PNG for Word to maintain higher quality for text
      // We remove the filter here and rely on CSS to hide/show elements
      const dataUrl = await toPng(page, {
        quality: 1.0,
        pixelRatio: 3, // High resolution
        backgroundColor: '#ffffff'
      });

      // Convert base64 data URL to buffer (ArrayBuffer) for docx
      const response = await fetch(dataUrl);
      const buffer = await response.arrayBuffer();

      // Create an image run for the Word document
      const imageRun = new ImageRun({
        data: buffer,
        transformation: {
          width: 794, // approx A4 width in px at 96dpi
          height: 1123, // approx A4 height
        },
      });

      const paragraph = new Paragraph({
        children: [imageRun],
      });

      docChildren.push(paragraph);
    }

    // Create the document
    const doc = new Document({
      sections: docChildren.map((child) => ({
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            margin: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            },
          },
        },
        children: [child],
      })),
    });

    // Generate and download the file
    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'sop-export.docx');

  } catch (err) {
    console.error('Error rendering page for Word:', err);
  } finally {
    cleanupAfterExport();
  }
};

/**
 * Exports the current editor content as a PDF file directly.
 * Uses high-resolution image capture to ensure visual fidelity (WYSIWYG).
 * Note: Vector export (jsPDF.html) proved unreliable for complex overlapping UI (icons, captions).
 * We use a high pixelRatio to ensure print quality.
 * @param {HTMLElement} containerRef - Ref to the editor container element.
 */
export const exportAsPdf = async (containerRef) => {
  if (!containerRef) return;

  await prepareForExport();
  const pages = Array.from(containerRef.querySelectorAll('.page-container'));
  
  if (!pages || pages.length === 0) {
    cleanupAfterExport();
    return;
  }

  // Initialize PDF - A4 size, portrait, mm units
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;

  try {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      
      // Use JPEG for PDF to reduce file size compared to PNG
      // pixelRatio 3 ensures high quality (approx 300dpi)
      // quality 0.9 provides good balance
      const dataUrl = await toJpeg(page, {
        quality: 0.9,
        pixelRatio: 3, 
        backgroundColor: '#ffffff'
      });
      
      if (i > 0) {
        pdf.addPage();
      }

      // Add image to PDF, fitting A4 dimensions
      pdf.addImage(dataUrl, 'JPEG', 0, 0, pageWidth, pageHeight);
    }

    pdf.save('sop-export.pdf');
  } catch (err) {
    console.error('Error rendering page for PDF:', err);
  } finally {
    cleanupAfterExport();
  }
};
