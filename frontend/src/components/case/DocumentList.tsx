import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Eye, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useUIStore } from '@/stores/uiStore';
import { PDFViewer } from './PDFViewer';

interface Document {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  url?: string;
  base64?: string;
}

interface DocumentListProps {
  documents: Document[];
  onDocumentSelect?: (document: Document) => void;
  onDocumentUpload?: (file: File) => void;
  selectedDocumentId?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDocumentSelect,
  onDocumentUpload,
  selectedDocumentId,
}) => {
  const { t } = useI18n();
  const addToast = useUIStore(state => state.addToast);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [viewingPdf, setViewingPdf] = React.useState<Document | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (!validTypes.includes(file.type)) {
      addToast({
        type: 'error',
        title: t('language') === 'fr' ? 'Type de fichier invalide' : 'Invalid file type',
        message:
          t('language') === 'fr'
            ? 'Veuillez téléverser un fichier PDF ou DOCX.'
            : 'Please upload a PDF or DOCX file.',
      });
      return;
    }

    if (onDocumentUpload) {
      onDocumentUpload(file);
    }
  };

  const isPdf = (doc: Document) => {
    return doc.type === 'application/pdf' || doc.name.toLowerCase().endsWith('.pdf');
  };

  const handleDocumentClick = (doc: Document) => {
    onDocumentSelect?.(doc);
    // If it's a PDF, show it in the viewer
    if (isPdf(doc) && (doc.base64 || doc.url)) {
      setViewingPdf(doc);
    }
  };

  // If viewing a PDF, show the PDF viewer instead of the list
  if (viewingPdf) {
    return (
      <div className="h-full flex flex-col">
        <PDFViewer 
          document={viewingPdf} 
          onClose={() => setViewingPdf(null)}
        />
      </div>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>{t('documents')}</span>
          </CardTitle>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1"
          >
            <Upload className="h-3 w-3" />
            <span className="text-xs">{t('upload')}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-3">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">{t('noDocuments')}</p>
            <p className="text-xs text-gray-500 mb-4">{t('uploadDocumentsToStart')}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {t('upload')}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleDocumentClick(doc)}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-colors
                  ${
                    selectedDocumentId === doc.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <FileText
                      className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                        isPdf(doc) ? 'text-red-600' : 'text-blue-600'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(doc.uploadedAt).toLocaleDateString(
                          t('language') === 'fr' ? 'fr-CA' : 'en-CA'
                        )}
                      </p>
                    </div>
                  </div>
                  {isPdf(doc) && (doc.base64 || doc.url) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDocumentClick(doc);
                      }}
                      title={t('language') === 'fr' ? 'Voir le PDF' : 'View PDF'}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to convert base64 to blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64.split(',')[1] || base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

