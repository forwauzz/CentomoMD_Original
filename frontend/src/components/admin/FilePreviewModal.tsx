import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  fileBase64: string | null;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  open,
  onOpenChange,
  fileName,
  fileBase64,
}) => {
  const { t } = useI18n();

  const handlePrint = () => {
    if (!fileBase64) return;

    // Create a new window with the PDF
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert(t('language') === 'fr' ? 'Veuillez autoriser les fenêtres popup pour imprimer' : 'Please allow popups to print');
      return;
    }

    const pdfData = `data:application/pdf;base64,${fileBase64}`;
    printWindow.document.write(`
      <html>
        <head>
          <title>${fileName}</title>
          <style>
            body { margin: 0; padding: 0; }
            iframe { width: 100%; height: 100vh; border: none; }
          </style>
        </head>
        <body>
          <iframe src="${pdfData}"></iframe>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    if (!fileBase64) return;

    // Convert base64 to blob
    const byteCharacters = atob(fileBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!fileBase64) return null;

  const pdfData = `data:application/pdf;base64,${fileBase64}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{fileName}</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                {t('download')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-2" />
                {t('print')}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden border rounded-lg">
          <iframe
            src={pdfData}
            className="w-full h-full"
            title={fileName}
            style={{ minHeight: '600px' }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

