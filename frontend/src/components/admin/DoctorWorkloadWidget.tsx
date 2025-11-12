import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getAllAssignments, getAssignedCasesForDoctor } from '@/utils/adminCaseAssignment';
import { useI18n } from '@/lib/i18n';

// Mock doctor list - in production, this would come from API
const MOCK_DOCTORS = [
  { id: 'doctor-1', name: 'Dr. Harry Durusso', maxCapacity: 10 },
  { id: 'doctor-2', name: 'Dr. Marie Dubois', maxCapacity: 10 },
  { id: 'doctor-3', name: 'Dr. Jean Tremblay', maxCapacity: 10 },
];

interface DoctorWorkload {
  doctorId: string;
  doctorName: string;
  totalCases: number;
  maxCapacity: number;
  activeCases: number;
  pendingCases: number;
  inProgressCases: number;
  completedCases: number;
}

export const DoctorWorkloadWidget: React.FC = () => {
  const { t } = useI18n();
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen for storage changes to refresh workload
  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshKey((prev) => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen to custom event for same-tab updates
    window.addEventListener('assignmentUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('assignmentUpdated', handleStorageChange);
    };
  }, []);

  const workload = useMemo(() => {
    const allAssignments = getAllAssignments();

    return MOCK_DOCTORS.map((doctor) => {
      const doctorCases = getAssignedCasesForDoctor(doctor.id);
      const activeCases = doctorCases.filter(
        (case_) => case_.status === 'in_progress' || case_.status === 'pending_review'
      );
      const pendingCases = doctorCases.filter((case_) => case_.status === 'pending_review');
      const inProgressCases = doctorCases.filter((case_) => case_.status === 'in_progress');
      const completedCases = doctorCases.filter((case_) => case_.status === 'completed');

      return {
        doctorId: doctor.id,
        doctorName: doctor.name,
        totalCases: doctorCases.length,
        maxCapacity: doctor.maxCapacity,
        activeCases: activeCases.length,
        pendingCases: pendingCases.length,
        inProgressCases: inProgressCases.length,
        completedCases: completedCases.length,
      };
    });
  }, [refreshKey]);

  const getCapacityColor = (total: number, max: number) => {
    const percentage = (total / max) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getCapacityBgColor = (total: number, max: number) => {
    const percentage = (total / max) * 100;
    if (percentage >= 90) return 'bg-red-50';
    if (percentage >= 70) return 'bg-yellow-50';
    return 'bg-green-50';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('doctorWorkload')}</CardTitle>
        <CardDescription>
          {t('workloadDistribution')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {workload.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t('noCasesAssigned')}
          </div>
        ) : (
          <div className="space-y-3">
            {workload.map((doctor) => (
              <div
                key={doctor.doctorId}
                className={`p-4 rounded-lg border ${getCapacityBgColor(doctor.totalCases, doctor.maxCapacity)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">{doctor.doctorName}</div>
                  <div className={`text-sm font-semibold ${getCapacityColor(doctor.totalCases, doctor.maxCapacity)}`}>
                    {doctor.totalCases} / {doctor.maxCapacity}
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-gray-600">
                  <span>{t('pending')}: {doctor.pendingCases}</span>
                  <span>{t('inProgress')}: {doctor.inProgressCases}</span>
                  <span>{t('completed')}: {doctor.completedCases}</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      doctor.totalCases / doctor.maxCapacity >= 0.9
                        ? 'bg-red-500'
                        : doctor.totalCases / doctor.maxCapacity >= 0.7
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min((doctor.totalCases / doctor.maxCapacity) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

