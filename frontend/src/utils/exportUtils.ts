// TypeScript workaround for libraries without proper type definitions
// @ts-expect-error - pizzip doesn't have proper TypeScript definitions
import PizZip from 'pizzip';
// @ts-expect-error - docxtemplater doesn't have proper TypeScript definitions
import Docxtemplater from 'docxtemplater';
import { PDFDocument } from 'pdf-lib';

/**
 * Export case data to DOCX format using docxtemplater
 * @param caseData - The complete case data object
 * @param templateBlob - Optional DOCX template file (Blob)
 * @returns Promise<Blob> - The generated DOCX file
 */
export async function exportToDocx(
  caseData: any,
  templateBlob?: Blob
): Promise<Blob> {
  try {
    // For now, we require a template or use a default one
    // In production, you should have a proper DOCX template file
    let zip: PizZip;
    
    if (templateBlob) {
      const arrayBuffer = await templateBlob.arrayBuffer();
      zip = new PizZip(arrayBuffer);
    } else {
      // TODO: Load a default template from assets or create a minimal DOCX structure
      // For now, throw an error indicating a template is needed
      throw new Error('DOCX template is required. Please provide a template file.');
    }

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Prepare data for template
    const templateData = {
      patientName: caseData.patientName || 'N/A',
      claimId: caseData.claimId || 'N/A',
      injuryDate: caseData.injuryDate || 'N/A',
      sections: {
        section1: caseData.sections?.section_1?.content || '',
        section2: caseData.sections?.section_2?.content || '',
        section3: caseData.sections?.section_3?.content || '',
        section4: caseData.sections?.section_4 || {},
        section5: caseData.sections?.section_5?.content || '',
        section6: caseData.sections?.section_6?.content || '',
        section7: caseData.sections?.section_7?.summary || '',
        section8: caseData.sections?.section_8?.transcript || '',
        section9: caseData.sections?.section_9?.examData || [],
        section10: caseData.sections?.section_10?.content || '',
        section11: caseData.sections?.section_11?.summary || '',
        section12: caseData.sections?.section_12 || {},
      },
      generatedDate: new Date().toLocaleDateString('fr-CA'),
    };

    // Render the document
    doc.render(templateData);

    // Generate the output
    const blob = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      compression: 'DEFLATE',
    });

    return blob;
  } catch (error) {
    console.error('Error generating DOCX:', error);
    throw new Error('Failed to generate DOCX document');
  }
}

/**
 * Export case data to PDF format using pdf-lib
 * @param caseData - The complete case data object
 * @returns Promise<Blob> - The generated PDF file
 */
export async function exportToPdf(caseData: any): Promise<Blob> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size

    // Add content to PDF
    const { width, height } = page.getSize();
    const fontSize = 12;
    let yPosition = height - 50;

    // Helper to add text with word wrapping
    const addText = (text: string, x: number, y: number, size: number = fontSize) => {
      page.drawText(text, {
        x,
        y,
        size,
        maxWidth: width - 100,
      });
    };

    // Add header
    addText('RAPPORT CNESST', 50, yPosition, 16);
    yPosition -= 30;

    // Add case information
    addText(`Patient: ${caseData.patientName || 'N/A'}`, 50, yPosition);
    yPosition -= 20;
    addText(`Réclamation: ${caseData.claimId || 'N/A'}`, 50, yPosition);
    yPosition -= 20;
    addText(`Date de lésion: ${caseData.injuryDate || 'N/A'}`, 50, yPosition);
    yPosition -= 40;

    // Add sections
    const sections = [
      { key: 'section_1', label: 'Section 1: Mandat' },
      { key: 'section_2', label: 'Section 2: Diagnostics' },
      { key: 'section_3', label: 'Section 3: Modalités' },
      { key: 'section_7', label: 'Section 7: Historique', contentKey: 'summary' },
      { key: 'section_8', label: 'Section 8: Entrevue', contentKey: 'transcript' },
      { key: 'section_11', label: 'Section 11: Conclusion', contentKey: 'summary' },
    ];

    for (const section of sections) {
      if (yPosition < 100) {
        // Add new page if needed
        const newPage = pdfDoc.addPage([612, 792]);
        yPosition = height - 50;
      }

      const sectionData = caseData.sections?.[section.key];
      const content = section.contentKey 
        ? sectionData?.[section.contentKey] || sectionData?.content || ''
        : sectionData?.content || '';

      if (content) {
        addText(section.label, 50, yPosition, 14);
        yPosition -= 20;
        addText(content.substring(0, 500), 50, yPosition);
        yPosition -= 40;
      }
    }

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF document');
  }
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

