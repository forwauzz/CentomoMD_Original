import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/authClient';
import { getAssignedCasesForDoctor } from '@/utils/adminCaseAssignment';

export const InReviewCard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  // Get current doctor ID
  const doctorId = user?.id || 'doctor-1'; // Mock for prototype

  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshKey((prev) => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('assignmentUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('assignmentUpdated', handleStorageChange);
    };
  }, []);

  const inReviewCases = useMemo(() => {
    const doctorCases = getAssignedCasesForDoctor(doctorId);
    return doctorCases.filter((case_) => case_.status === 'completed');
  }, [doctorId, refreshKey]);

  const handleViewCases = () => {
    navigate('/review-cases?tab=completed');
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-700">
            {t('inReview')}
          </CardTitle>
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Eye className="h-5 w-5 text-yellow-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{inReviewCases.length}</span>
          <span className="text-sm text-gray-500">{t('casesInReview')}</span>
        </div>
        <p className="text-gray-600 text-sm">{t('awaitingQAReview')}</p>
        <Button
          onClick={handleViewCases}
          variant="outline"
          className="w-full"
          disabled={inReviewCases.length === 0}
        >
          {t('viewCases')}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

