import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { AssignedCase, assignCaseToDoctors } from '@/utils/adminCaseAssignment';
import { useI18n } from '@/lib/i18n';

interface CaseAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  case_: AssignedCase | null;
  assignedBy: string;
  onAssigned: () => void;
}

// Mock doctor list - in production, this would come from API
const MOCK_DOCTORS = [
  { id: 'doctor-1', name: 'Dr. Harry Durusso' },
  { id: 'doctor-2', name: 'Dr. Marie Dubois' },
  { id: 'doctor-3', name: 'Dr. Jean Tremblay' },
];

export const CaseAssignmentModal: React.FC<CaseAssignmentModalProps> = ({
  open,
  onOpenChange,
  case_,
  assignedBy,
  onAssigned,
}) => {
  const { t } = useI18n();
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);

  const PRIORITY_OPTIONS = [
    { value: 'low', label: t('low') },
    { value: 'medium', label: t('medium') },
    { value: 'high', label: t('high') },
  ];

  const handleAssign = () => {
    if (!case_ || !selectedDoctor) return;

    setLoading(true);
    try {
      assignCaseToDoctors(
        case_.fileId,
        case_.fileName,
        case_.fileBase64,
        [selectedDoctor],
        assignedBy,
        case_.source,
        {
          patientName: case_.patientName,
          claimId: case_.claimId,
          injuryDate: case_.injuryDate,
        }
      );

      // Reset form
      setSelectedDoctor(null);
      setPriority('medium');
      onAssigned();
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning case:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!case_) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('assignCase')}</DialogTitle>
          <DialogDescription>
            {t('assignCaseDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="case-info">{t('case')}</Label>
            <div id="case-info" className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              <div className="font-medium">{case_.claimId || case_.fileName}</div>
              {case_.patientName && (
                <div className="text-xs mt-1">{t('worker')}: {case_.patientName}</div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doctor-select">{t('doctor')}</Label>
            <Select
              id="doctor-select"
              value={selectedDoctor || null}
              onValueChange={(v) => setSelectedDoctor(v)}
              items={MOCK_DOCTORS.map(doc => ({ value: doc.id, label: doc.name }))}
              placeholder={t('selectDoctor')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority-select">{t('priority')}</Label>
            <Select
              id="priority-select"
              value={priority}
              onValueChange={(v) => setPriority(v as 'low' | 'medium' | 'high')}
              items={PRIORITY_OPTIONS}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedDoctor || loading}
          >
            {loading ? t('assigning') : t('assign')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

