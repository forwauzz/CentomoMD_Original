import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Upload, X } from 'lucide-react';
import { assignCaseToDoctors, AssignedCase } from '@/utils/adminCaseAssignment';
import { useI18n } from '@/lib/i18n';

interface FileUploadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignedBy: string;
  onUploaded: () => void;
}

const SOURCE_OPTIONS = [
  { value: 'cnesst', label: 'CNESST' },
  { value: 'employer', label: 'Employeur' },
  { value: 'clinic', label: 'Clinique' },
];

export const FileUploadForm: React.FC<FileUploadFormProps> = ({
  open,
  onOpenChange,
  assignedBy,
  onUploaded,
}) => {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<'cnesst' | 'employer' | 'clinic'>('cnesst');
  const [sourceName, setSourceName] = useState('');
  const [patientName, setPatientName] = useState('');
  const [claimId, setClaimId] = useState('');
  const [injuryDate, setInjuryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Only allow PDF files
    if (selectedFile.type !== 'application/pdf') {
      alert(t('language') === 'fr' ? 'Veuillez sélectionner un fichier PDF' : 'Please select a PDF file');
      return;
    }

    setFile(selectedFile);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        // Remove data:application/pdf;base64, prefix if present
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        setFileBase64(base64);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = () => {
    if (!file || !fileBase64) {
      alert(t('language') === 'fr' ? 'Veuillez sélectionner un fichier' : 'Please select a file');
      return;
    }

    if (!sourceName.trim()) {
      alert(t('language') === 'fr' ? 'Veuillez entrer le nom de la source' : 'Please enter the source name');
      return;
    }

    setLoading(true);
    try {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create a case with pending status (not assigned yet)
      assignCaseToDoctors(
        fileId,
        file.name,
        fileBase64,
        [], // No doctor assigned yet - will be in pending queue
        assignedBy,
        {
          type: sourceType,
          name: sourceName,
        },
        {
          patientName: patientName || undefined,
          claimId: claimId || undefined,
          injuryDate: injuryDate || undefined,
        }
      );

      // Reset form
      setFile(null);
      setFileBase64(null);
      setSourceType('cnesst');
      setSourceName('');
      setPatientName('');
      setClaimId('');
      setInjuryDate('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploaded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(t('language') === 'fr' ? 'Erreur lors du téléversement du fichier' : 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFile(null);
      setFileBase64(null);
      setSourceType('cnesst');
      setSourceName('');
      setPatientName('');
      setClaimId('');
      setInjuryDate('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('uploadNewCase')}</DialogTitle>
          <DialogDescription>
            {t('addToQueue')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">{t('pdfFile')}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="flex-1"
              />
              {file && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setFileBase64(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {file && (
              <div className="text-sm text-gray-600">
                {t('fileSelected')}: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="source-type">{t('sourceType')}</Label>
            <Select
              id="source-type"
              value={sourceType}
              onValueChange={(v) => setSourceType(v as 'cnesst' | 'employer' | 'clinic')}
              items={SOURCE_OPTIONS}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source-name">{t('sourceName')}</Label>
            <Input
              id="source-name"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder={t('sourceNamePlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient-name">{t('workerNameOptional')}</Label>
              <Input
                id="patient-name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder={t('workerNamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="claim-id">{t('claimIdOptional')}</Label>
              <Input
                id="claim-id"
                value={claimId}
                onChange={(e) => setClaimId(e.target.value)}
                placeholder={t('claimIdPlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="injury-date">{t('injuryDateOptional')}</Label>
            <Input
              id="injury-date"
              type="date"
              value={injuryDate}
              onChange={(e) => setInjuryDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || !fileBase64 || !sourceName.trim() || loading}
          >
            {loading ? t('uploading') : t('upload')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

