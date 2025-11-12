import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AuditLogFilters, type AuditLogFilters as AuditLogFiltersType } from '@/components/audit/AuditLogFilters';
import {
  getAllAuditLogs,
  filterAuditLogs,
  exportAuditLogsToCSV,
  exportAuditLogsToJSON,
  type AuditLogEntry,
} from '@/utils/auditLogUtils';
import { useI18n } from '@/lib/i18n';
import { FileDown, Download, FileJson } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

export const AuditLogPage: React.FC = () => {
  const { t, language } = useI18n();
  const addToast = useUIStore((state) => state.addToast);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filters, setFilters] = useState<AuditLogFiltersType>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
    
    const handleAuditLogUpdate = () => {
      loadLogs();
    };

    window.addEventListener('auditLogUpdated', handleAuditLogUpdate);

    return () => {
      window.removeEventListener('auditLogUpdated', handleAuditLogUpdate);
    };
  }, []);

  const loadLogs = () => {
    try {
      const allLogs = getAllAuditLogs();
      setLogs(allLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      addToast({
        type: 'error',
        title: t('language') === 'fr' ? 'Erreur' : 'Error',
        message: t('language') === 'fr' ? 'Impossible de charger les journaux d\'audit' : 'Failed to load audit logs',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return filterAuditLogs(logs, filters);
  }, [logs, filters]);

  const availableUsers = useMemo(() => {
    const userMap = new Map<string, { id: string; name: string; role: string }>();
    logs.forEach((log) => {
      if (!userMap.has(log.userId)) {
        userMap.set(log.userId, {
          id: log.userId,
          name: log.userName,
          role: log.userRole,
        });
      }
    });
    return Array.from(userMap.values());
  }, [logs]);

  const handleExportCSV = () => {
    try {
      const csv = exportAuditLogsToCSV(filteredLogs);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addToast({
        type: 'success',
        title: t('language') === 'fr' ? 'Export réussi' : 'Export Successful',
        message: t('language') === 'fr' ? 'Les journaux d\'audit ont été exportés en CSV' : 'Audit logs exported to CSV',
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      addToast({
        type: 'error',
        title: t('language') === 'fr' ? 'Erreur' : 'Error',
        message: t('language') === 'fr' ? 'Impossible d\'exporter les journaux' : 'Failed to export logs',
      });
    }
  };

  const handleExportJSON = () => {
    try {
      const json = exportAuditLogsToJSON(filteredLogs);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addToast({
        type: 'success',
        title: t('language') === 'fr' ? 'Export réussi' : 'Export Successful',
        message: t('language') === 'fr' ? 'Les journaux d\'audit ont été exportés en JSON' : 'Audit logs exported to JSON',
      });
    } catch (error) {
      console.error('Error exporting JSON:', error);
      addToast({
        type: 'error',
        title: t('language') === 'fr' ? 'Erreur' : 'Error',
        message: t('language') === 'fr' ? 'Impossible d\'exporter les journaux' : 'Failed to export logs',
      });
    }
  };

  const getActionLabel = (action: string): string => {
    const actionLabels: Record<string, string> = {
      create: t('language') === 'fr' ? 'Créer' : 'Create',
      update: t('language') === 'fr' ? 'Modifier' : 'Update',
      assign: t('language') === 'fr' ? 'Assigner' : 'Assign',
      submit: t('language') === 'fr' ? 'Soumettre' : 'Submit',
      review: t('language') === 'fr' ? 'Réviser' : 'Review',
      export: t('language') === 'fr' ? 'Exporter' : 'Export',
      delete: t('language') === 'fr' ? 'Supprimer' : 'Delete',
      approve: t('language') === 'fr' ? 'Approuver' : 'Approve',
      reject: t('language') === 'fr' ? 'Rejeter' : 'Reject',
    };
    return actionLabels[action] || action;
  };

  const getResourceTypeLabel = (resourceType: string): string => {
    const typeLabels: Record<string, string> = {
      case: t('language') === 'fr' ? 'Cas' : 'Case',
      assignment: t('language') === 'fr' ? 'Affectation' : 'Assignment',
      document: t('language') === 'fr' ? 'Document' : 'Document',
      compliance_flag: t('language') === 'fr' ? 'Drapeau de conformité' : 'Compliance Flag',
      user: t('language') === 'fr' ? 'Utilisateur' : 'User',
    };
    return typeLabels[resourceType] || resourceType;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('auditLog')}</h1>
          <p className="text-white/80 mt-1">
            {t('language') === 'fr'
              ? 'Journal d\'audit des actions système'
              : 'System action audit log'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t('language') === 'fr' ? 'Exporter CSV' : 'Export CSV'}
          </Button>
          <Button onClick={handleExportJSON} variant="outline" className="flex items-center gap-2">
            <FileJson className="h-4 w-4" />
            {t('language') === 'fr' ? 'Exporter JSON' : 'Export JSON'}
          </Button>
        </div>
      </div>

      <AuditLogFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableUsers={availableUsers}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('language') === 'fr' ? 'Journal d\'audit' : 'Audit Log'}</CardTitle>
              <CardDescription>
                {t('language') === 'fr'
                  ? `${filteredLogs.length} entrée${filteredLogs.length !== 1 ? 's' : ''}`
                  : `${filteredLogs.length} entr${filteredLogs.length !== 1 ? 'ies' : 'y'}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">{t('loading')}</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {t('language') === 'fr' ? 'Aucune entrée trouvée' : 'No entries found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('language') === 'fr' ? 'Horodatage' : 'Timestamp'}</TableHead>
                    <TableHead>{t('language') === 'fr' ? 'Utilisateur' : 'User'}</TableHead>
                    <TableHead>{t('language') === 'fr' ? 'Rôle' : 'Role'}</TableHead>
                    <TableHead>{t('language') === 'fr' ? 'Action' : 'Action'}</TableHead>
                    <TableHead>{t('language') === 'fr' ? 'Type de ressource' : 'Resource Type'}</TableHead>
                    <TableHead>{t('language') === 'fr' ? 'Ressource' : 'Resource'}</TableHead>
                    <TableHead>{t('language') === 'fr' ? 'Détails' : 'Details'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(log.timestamp).toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA')}
                      </TableCell>
                      <TableCell>{log.userName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {log.userRole}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {getActionLabel(log.action)}
                        </span>
                      </TableCell>
                      <TableCell>{getResourceTypeLabel(log.resourceType)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-gray-600">{log.resourceId}</span>
                          {log.resourceName && (
                            <span className="text-sm text-gray-500">{log.resourceName}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-gray-600">
                        {log.details || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

