import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { Filter, X } from 'lucide-react';

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  resourceType?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface AuditLogFiltersProps {
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
  availableUsers: Array<{ id: string; name: string; role: string }>;
}

export const AuditLogFilters: React.FC<AuditLogFiltersProps> = ({
  filters,
  onFiltersChange,
  availableUsers,
}) => {
  const { t } = useI18n();

  const actions = [
    { value: 'create', label: t('language') === 'fr' ? 'Créer' : 'Create' },
    { value: 'update', label: t('language') === 'fr' ? 'Modifier' : 'Update' },
    { value: 'assign', label: t('language') === 'fr' ? 'Assigner' : 'Assign' },
    { value: 'submit', label: t('language') === 'fr' ? 'Soumettre' : 'Submit' },
    { value: 'review', label: t('language') === 'fr' ? 'Réviser' : 'Review' },
    { value: 'export', label: t('language') === 'fr' ? 'Exporter' : 'Export' },
    { value: 'delete', label: t('language') === 'fr' ? 'Supprimer' : 'Delete' },
    { value: 'approve', label: t('language') === 'fr' ? 'Approuver' : 'Approve' },
    { value: 'reject', label: t('language') === 'fr' ? 'Rejeter' : 'Reject' },
  ];

  const resourceTypes = [
    { value: 'case', label: t('language') === 'fr' ? 'Cas' : 'Case' },
    { value: 'assignment', label: t('language') === 'fr' ? 'Affectation' : 'Assignment' },
    { value: 'document', label: t('language') === 'fr' ? 'Document' : 'Document' },
    { value: 'compliance_flag', label: t('language') === 'fr' ? 'Drapeau de conformité' : 'Compliance Flag' },
    { value: 'user', label: t('language') === 'fr' ? 'Utilisateur' : 'User' },
  ];

  const handleFilterChange = (key: keyof AuditLogFilters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4" />
            {t('language') === 'fr' ? 'Filtres' : 'Filters'}
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              {t('language') === 'fr' ? 'Effacer' : 'Clear'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="user-filter">
              {t('language') === 'fr' ? 'Utilisateur' : 'User'}
            </Label>
            <Select
              value={filters.userId || null}
              onValueChange={(value) => handleFilterChange('userId', value)}
              items={[
                { value: '', label: t('language') === 'fr' ? 'Tous' : 'All' },
                ...availableUsers.map((u) => ({ value: u.id, label: u.name })),
              ]}
              placeholder={t('language') === 'fr' ? 'Sélectionner un utilisateur' : 'Select user'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="action-filter">
              {t('language') === 'fr' ? 'Action' : 'Action'}
            </Label>
            <Select
              value={filters.action || null}
              onValueChange={(value) => handleFilterChange('action', value)}
              items={[
                { value: '', label: t('language') === 'fr' ? 'Toutes' : 'All' },
                ...actions,
              ]}
              placeholder={t('language') === 'fr' ? 'Sélectionner une action' : 'Select action'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource-type-filter">
              {t('language') === 'fr' ? 'Type de ressource' : 'Resource Type'}
            </Label>
            <Select
              value={filters.resourceType || null}
              onValueChange={(value) => handleFilterChange('resourceType', value)}
              items={[
                { value: '', label: t('language') === 'fr' ? 'Tous' : 'All' },
                ...resourceTypes,
              ]}
              placeholder={t('language') === 'fr' ? 'Sélectionner un type' : 'Select type'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-from">
              {t('language') === 'fr' ? 'Date de début' : 'Date From'}
            </Label>
            <Input
              id="date-from"
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-to">
              {t('language') === 'fr' ? 'Date de fin' : 'Date To'}
            </Label>
            <Input
              id="date-to"
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

