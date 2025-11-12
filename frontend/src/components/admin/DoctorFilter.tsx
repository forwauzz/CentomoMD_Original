import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Users } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export interface Doctor {
  id: string;
  name: string;
}

interface DoctorFilterProps {
  doctors: Doctor[];
  selectedDoctorIds: string[]; // Empty array means "all doctors"
  onSelectionChange: (doctorIds: string[]) => void;
}

export const DoctorFilter: React.FC<DoctorFilterProps> = ({
  doctors,
  selectedDoctorIds,
  onSelectionChange,
}) => {
  const { t } = useI18n();
  const isAllSelected = selectedDoctorIds.length === 0;

  const handleToggleAll = () => {
    if (isAllSelected) {
      // If all are selected, select none (but show all)
      onSelectionChange([]);
    } else {
      // Select all doctors
      onSelectionChange(doctors.map(d => d.id));
    }
  };

  const handleToggleDoctor = (doctorId: string) => {
    if (selectedDoctorIds.includes(doctorId)) {
      // Deselect this doctor
      const newSelection = selectedDoctorIds.filter(id => id !== doctorId);
      // If no doctors selected, show all
      onSelectionChange(newSelection.length === 0 ? [] : newSelection);
    } else {
      // Select this doctor
      onSelectionChange([...selectedDoctorIds, doctorId]);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          {t('language') === 'fr' ? 'Filtrer par médecin' : 'Filter by Doctor'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant={isAllSelected ? 'default' : 'outline'}
          size="sm"
          className="w-full justify-start"
          onClick={handleToggleAll}
        >
          <Users className="h-4 w-4 mr-2" />
          {t('language') === 'fr' ? 'Tous les médecins' : 'All Doctors'}
          {isAllSelected && (
            <Badge variant="secondary" className="ml-auto">
              {doctors.length}
            </Badge>
          )}
        </Button>
        
        <div className="space-y-1 pt-2 border-t">
          {doctors.map((doctor) => {
            const isSelected = selectedDoctorIds.includes(doctor.id) || isAllSelected;
            return (
              <Button
                key={doctor.id}
                variant={isSelected && !isAllSelected ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'w-full justify-start',
                  isSelected && !isAllSelected && 'bg-blue-600 hover:bg-blue-700'
                )}
                onClick={() => handleToggleDoctor(doctor.id)}
              >
                <User className="h-3 w-3 mr-2" />
                <span className="flex-1 text-left">{doctor.name}</span>
                {isSelected && !isAllSelected && (
                  <Badge variant="secondary" className="ml-auto">
                    ✓
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

