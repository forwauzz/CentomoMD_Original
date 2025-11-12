import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download, Printer } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface PDFViewerProps {
  document: {
    id: string;
    name: string;
    base64?: string;
    url?: string;
  };
  onClose?: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ document, onClose }) => {
  const { t } = useI18n();
  const [zoom, setZoom] = React.useState(100);
  const [rotation, setRotation] = React.useState(0);

  const getPdfUrl = () => {
    if (document.base64) {
      // Handle base64 data
      const base64Data = document.base64.includes(',') 
        ? document.base64.split(',')[1] 
        : document.base64;
      return `data:application/pdf;base64,${base64Data}`;
    }
    if (document.url) {
      return document.url;
    }
    return null;
  };

  const pdfUrl = getPdfUrl();

  if (!pdfUrl) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">{t('language') === 'fr' ? 'Aucun PDF disponible' : 'No PDF available'}</p>
        </CardContent>
      </Card>
    );
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (document.base64) {
      const byteCharacters = atob(document.base64.includes(',') ? document.base64.split(',')[1] : document.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0 bg-white border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium truncate">{document.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-gray-600 min-w-[3rem] text-center">{zoom}%</span>
            <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                {t('language') === 'fr' ? 'Fermer' : 'Close'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 bg-gray-100" style={{ minHeight: 0 }}>
        <div className="w-full h-full">
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            style={{ 
              display: 'block',
              width: '100%',
              height: '100%',
              minHeight: '600px'
            }}
            title={document.name}
          />
        </div>
      </CardContent>
    </Card>
  );
};
