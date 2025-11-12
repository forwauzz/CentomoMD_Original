import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { CheckCircle2, Clock, XCircle, Send } from 'lucide-react';

interface SubmissionStatus {
  status: 'not_submitted' | 'submitted' | 'pending' | 'failed';
  submittedAt?: string;
  submittedBy?: string;
  submittedTo?: 'cnesst' | 'emr' | 'both';
  submissionId?: string;
  error?: string;
}

interface SubmissionStatusTrackerProps {
  caseId: string;
  submissionStatus: SubmissionStatus;
}

export const SubmissionStatusTracker: React.FC<SubmissionStatusTrackerProps> = ({
  caseId: _caseId,
  submissionStatus,
}) => {
  const { t, language } = useI18n();

  const getStatusIcon = () => {
    switch (submissionStatus.status) {
      case 'submitted':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Send className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusLabel = () => {
    switch (submissionStatus.status) {
      case 'submitted':
        return t('language') === 'fr' ? 'Soumis' : 'Submitted';
      case 'pending':
        return t('language') === 'fr' ? 'En attente' : 'Pending';
      case 'failed':
        return t('language') === 'fr' ? 'Échec' : 'Failed';
      default:
        return t('language') === 'fr' ? 'Non soumis' : 'Not Submitted';
    }
  };

  const getStatusColor = () => {
    switch (submissionStatus.status) {
      case 'submitted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          {getStatusIcon()}
          {t('language') === 'fr' ? 'Statut de soumission' : 'Submission Status'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {t('language') === 'fr' ? 'Statut' : 'Status'}
          </span>
          <Badge variant="outline" className={getStatusColor()}>
            {getStatusLabel()}
          </Badge>
        </div>

        {submissionStatus.submittedAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {t('language') === 'fr' ? 'Soumis le' : 'Submitted At'}
            </span>
            <span className="text-sm font-medium">
              {new Date(submissionStatus.submittedAt).toLocaleString(
                language === 'fr' ? 'fr-CA' : 'en-CA'
              )}
            </span>
          </div>
        )}

        {submissionStatus.submittedBy && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {t('language') === 'fr' ? 'Soumis par' : 'Submitted By'}
            </span>
            <span className="text-sm font-medium">{submissionStatus.submittedBy}</span>
          </div>
        )}

        {submissionStatus.submittedTo && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {t('language') === 'fr' ? 'Soumis à' : 'Submitted To'}
            </span>
            <span className="text-sm font-medium">
              {submissionStatus.submittedTo === 'cnesst'
                ? 'CNESST'
                : submissionStatus.submittedTo === 'emr'
                ? 'EMR'
                : 'CNESST & EMR'}
            </span>
          </div>
        )}

        {submissionStatus.submissionId && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {t('language') === 'fr' ? 'ID de soumission' : 'Submission ID'}
            </span>
            <span className="text-sm font-mono text-gray-600">{submissionStatus.submissionId}</span>
          </div>
        )}

        {submissionStatus.error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            {t('language') === 'fr' ? 'Erreur' : 'Error'}: {submissionStatus.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

