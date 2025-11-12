import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAllAssignments } from '@/utils/adminCaseAssignment';
import { useI18n } from '@/lib/i18n';
import { Badge } from '@/components/ui/badge';

// Mock doctor names - in production, this would come from API
const MOCK_DOCTORS: Record<string, string> = {
  'doctor-1': 'Dr. Harry Durusso',
  'doctor-2': 'Dr. Marie Dubois',
  'doctor-3': 'Dr. Jean Tremblay',
};

interface DoctorStats {
  doctorId: string;
  doctorName: string;
  totalCases: number;
  completedCases: number;
  averageDays: number;
}

export const DoctorPerformanceTable: React.FC = () => {
  const { t } = useI18n();

  const doctorStats = useMemo(() => {
    const allCases = getAllAssignments();
    const statsByDoctor: Record<string, DoctorStats> = {};

    allCases.forEach((case_) => {
      if (!case_.assignedTo) return;

      const doctorId = case_.assignedTo;
      if (!statsByDoctor[doctorId]) {
        statsByDoctor[doctorId] = {
          doctorId,
          doctorName: MOCK_DOCTORS[doctorId] || t('language') === 'fr' ? 'Médecin inconnu' : 'Unknown Doctor',
          totalCases: 0,
          completedCases: 0,
          averageDays: 0,
        };
      }

      statsByDoctor[doctorId].totalCases++;

      if (case_.status === 'submitted' && case_.assignedAt && case_.submittedAt) {
        statsByDoctor[doctorId].completedCases++;
        const assignedDate = new Date(case_.assignedAt);
        const submittedDate = new Date(case_.submittedAt);
        const days = Math.ceil((submittedDate.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate running average
        const currentAvg = statsByDoctor[doctorId].averageDays;
        const completedCount = statsByDoctor[doctorId].completedCases;
        statsByDoctor[doctorId].averageDays = Math.round(
          ((currentAvg * (completedCount - 1)) + days) / completedCount
        );
      }
    });

    return Object.values(statsByDoctor).sort((a, b) => b.completedCases - a.completedCases);
  }, [t]);

  if (doctorStats.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p className="text-sm">{t('language') === 'fr' ? 'Aucune donnée disponible' : 'No data available'}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('doctor')}</TableHead>
            <TableHead>{t('totalCases')}</TableHead>
            <TableHead>{t('completedCases')}</TableHead>
            <TableHead>{t('averageCompletionTime')}</TableHead>
            <TableHead>{t('completionRate')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {doctorStats.map((stats) => {
            const completionRate = stats.totalCases > 0 
              ? Math.round((stats.completedCases / stats.totalCases) * 100) 
              : 0;

            return (
              <TableRow key={stats.doctorId}>
                <TableCell className="font-medium">{stats.doctorName}</TableCell>
                <TableCell>{stats.totalCases}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    {stats.completedCases}
                  </Badge>
                </TableCell>
                <TableCell>
                  {stats.completedCases > 0 ? (
                    <span>{stats.averageDays} {t('language') === 'fr' ? 'jours' : 'days'}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={
                      completionRate >= 80 
                        ? 'bg-green-50 text-green-700 border-green-300'
                        : completionRate >= 50
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                        : 'bg-red-50 text-red-700 border-red-300'
                    }
                  >
                    {completionRate}%
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

