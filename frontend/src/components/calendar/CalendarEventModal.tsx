import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { Clock } from 'lucide-react';

interface CalendarEvent {
  id: string;
  caseId: string;
  caseName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface CalendarEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId?: string;
  caseName?: string;
  doctorId?: string;
  onBook: (date: string, time: string) => void;
}

export const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
  open,
  onOpenChange,
  caseId,
  caseName,
  doctorId,
  onBook,
}) => {
  const { t } = useI18n();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  // Generate time slots (9 AM to 5 PM, 30-minute intervals)
  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = 9 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${String(hour).padStart(2, '0')}:${minute}`;
  });

  const handleBook = () => {
    if (selectedDate && selectedTime) {
      onBook(selectedDate, selectedTime);
      setSelectedDate('');
      setSelectedTime('');
      onOpenChange(false);
    }
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('language') === 'fr' ? 'Planifier un rendez-vous' : 'Schedule Appointment'}
          </DialogTitle>
          <DialogDescription>
            {t('language') === 'fr'
              ? `Planifier le cas ${caseName || caseId}`
              : `Schedule case ${caseName || caseId}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">
              {t('language') === 'fr' ? 'Date' : 'Date'}
            </Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('language') === 'fr' ? 'Heure' : 'Time'}
            </Label>
            <Select
              value={selectedTime}
              onValueChange={setSelectedTime}
              items={timeSlots.map((time) => ({ label: time, value: time }))}
              placeholder={t('language') === 'fr' ? 'Sélectionner une heure' : 'Select time'}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleBook} disabled={!selectedDate || !selectedTime}>
            {t('language') === 'fr' ? 'Planifier' : 'Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

