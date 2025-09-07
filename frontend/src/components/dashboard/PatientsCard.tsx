import React from 'react';
// import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

export const PatientsCard: React.FC = () => {
  // const navigate = useNavigate();
  const { t } = useI18n();

  // Mock data - in real app this would come from API
  const stats = {
    total: 89,
    active: 67,
    newThisMonth: 12,
  };

  const handleManagePatients = () => {
    // TODO: Navigate to patient management page when implemented
    console.log('Manage patients clicked');
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-700">
            {t('patients')}
          </CardTitle>
          <div className="p-2 bg-orange-50 rounded-lg">
            <Users className="h-5 w-5 text-orange-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-600">{stats.total}</span>
            <span className="text-sm text-gray-500">{t('patientsTotal')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Activity className="h-4 w-4 text-green-500" />
            <span>{stats.active} {t('patientsActive')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <UserPlus className="h-3 w-3" />
          <span>{stats.newThisMonth} {t('patientsNewThisMonth')}</span>
        </div>
        <Button 
          onClick={handleManagePatients}
          variant="outline"
          className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          {t('managePatients')}
        </Button>
      </CardContent>
    </Card>
  );
};
