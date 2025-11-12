import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getAllAssignments, AssignedCase } from '@/utils/adminCaseAssignment';
import { Building2, Briefcase, Stethoscope } from 'lucide-react';
import { CaseAssignmentModal } from '@/components/admin/CaseAssignmentModal';
import { DoctorWorkloadWidget } from '@/components/admin/DoctorWorkloadWidget';
import { ComplianceAlertsPanel } from '@/components/admin/ComplianceAlertsPanel';
import { FileUploadForm } from '@/components/admin/FileUploadForm';
import { FilePreviewModal } from '@/components/admin/FilePreviewModal';
import { KanbanBoard } from '@/components/admin/KanbanBoard';
import { SimpleCalendar } from '@/components/calendar/SimpleCalendar';
import { getAllCalendarEvents, CalendarEvent } from '@/utils/calendarUtils';
import { DoctorFilter, Doctor } from '@/components/admin/DoctorFilter';
import { useAuth } from '@/lib/authClient';
import { useI18n } from '@/lib/i18n';
import { Upload, Eye, Calendar as CalendarIcon } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const [incomingCases, setIncomingCases] = useState<AssignedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<AssignedCase | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ name: string; base64: string } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]); // Empty = all doctors
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    loadIncomingCases();
    loadCalendarEvents();
    
    const handleCalendarUpdate = () => {
      loadCalendarEvents();
    };

    window.addEventListener('calendarUpdated', handleCalendarUpdate);
    window.addEventListener('assignmentUpdated', handleCalendarUpdate);

    return () => {
      window.removeEventListener('calendarUpdated', handleCalendarUpdate);
      window.removeEventListener('assignmentUpdated', handleCalendarUpdate);
    };
  }, []);

  const loadCalendarEvents = () => {
    const events = getAllCalendarEvents();
    setCalendarEvents(events);
    
    // Extract unique doctors from events
    const uniqueDoctors = new Map<string, string>();
    events.forEach(event => {
      if (event.doctorId && event.doctorName) {
        uniqueDoctors.set(event.doctorId, event.doctorName);
      }
    });
    
    const doctorsList: Doctor[] = Array.from(uniqueDoctors.entries()).map(([id, name]) => ({
      id,
      name,
    }));
    
    // If no doctors from events, use mock doctors
    if (doctorsList.length === 0) {
      doctorsList.push(
        { id: 'doctor-1', name: 'Dr. Harry Durusso' },
        { id: 'doctor-2', name: 'Dr. Marie Dubois' },
        { id: 'doctor-3', name: 'Dr. Jean Tremblay' },
      );
    }
    
    setDoctors(doctorsList);
  };

  const loadIncomingCases = () => {
    try {
      const allAssignments = getAllAssignments();
      // Filter for cases that are pending assignment (status: pending_review or pending)
      const pending = allAssignments.filter(
        (case_) => case_.status === 'pending_review' || case_.status === 'pending'
      );
      setIncomingCases(pending);
    } catch (error) {
      console.error('Error loading incoming cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSourceInfo = (source: AssignedCase['source']) => {
    switch (source.type) {
      case 'cnesst':
        return {
          label: 'CNESST',
          icon: Building2,
          color: 'text-[#009639]',
        };
      case 'employer':
        return {
          label: 'Employeur',
          icon: Briefcase,
          color: 'text-blue-600',
        };
      case 'clinic':
        return {
          label: 'Clinique',
          icon: Stethoscope,
          color: 'text-purple-600',
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('adminDashboard')}</h1>
          <p className="text-white/80 mt-1">{t('manageCasesAndAssignments')}</p>
        </div>
        <Button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {t('uploadCase')}
        </Button>
      </div>

                  <Tabs defaultValue="queue" className="space-y-6">
                    <TabsList>
                      <TabsTrigger value="queue">{t('incomingCasesQueue')}</TabsTrigger>
                      <TabsTrigger value="kanban">{t('kanbanView')}</TabsTrigger>
                      <TabsTrigger value="calendar" className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {t('calendar')}
                      </TabsTrigger>
                    </TabsList>

        <TabsContent value="queue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('incomingCasesQueue')}</CardTitle>
                  <CardDescription>
                    {t('casesPendingAssignment')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">{t('loading')}</div>
                  ) : incomingCases.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {t('noCasesPending')}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 text-sm font-medium text-gray-700">{t('case')}</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-700">{t('worker')}</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-700">{t('injuryDate')}</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-700">{t('source')}</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-700">{t('actions')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {incomingCases.map((case_) => {
                            const sourceInfo = getSourceInfo(case_.source);
                            const Icon = sourceInfo.icon;
                            return (
                              <tr key={case_.id} className="border-b hover:bg-gray-50">
                                <td className="p-3">
                                  <div className="font-medium">{case_.claimId || case_.id.substring(0, 8)}</div>
                                  <div className="text-sm text-gray-500">{case_.fileName}</div>
                                </td>
                                <td className="p-3">
                                  {case_.patientName || '-'}
                                </td>
                                <td className="p-3">
                                  {case_.injuryDate 
                                    ? new Date(case_.injuryDate).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA')
                                    : '-'}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <Icon className={`h-4 w-4 ${sourceInfo.color}`} />
                                    <span className="text-sm">{case_.source.name}</span>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="flex gap-2">
                                    {case_.fileBase64 && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setPreviewFile({
                                            name: case_.fileName,
                                            base64: case_.fileBase64!,
                                          });
                                          setIsPreviewOpen(true);
                                        }}
                                        title={t('preview')}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedCase(case_);
                                        setIsModalOpen(true);
                                      }}
                                    >
                                      {t('assign')}
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <DoctorWorkloadWidget />
              <ComplianceAlertsPanel />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="kanban" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <KanbanBoard />
            </div>
            <div className="space-y-6">
              <DoctorWorkloadWidget />
              <ComplianceAlertsPanel />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <SimpleCalendar 
                events={
                  selectedDoctorIds.length === 0
                    ? calendarEvents
                    : calendarEvents.filter(e => selectedDoctorIds.includes(e.doctorId))
                }
              />
            </div>
            <div className="space-y-6">
              <DoctorFilter
                doctors={doctors}
                selectedDoctorIds={selectedDoctorIds}
                onSelectionChange={setSelectedDoctorIds}
              />
              <DoctorWorkloadWidget />
              <ComplianceAlertsPanel />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <CaseAssignmentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        case_={selectedCase}
        assignedBy={user?.id || 'admin'}
        onAssigned={() => {
          loadIncomingCases();
          // Trigger refresh for workload widget
          window.dispatchEvent(new Event('assignmentUpdated'));
        }}
      />

      <FileUploadForm
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        assignedBy={user?.id || 'admin'}
        onUploaded={() => {
          loadIncomingCases();
          window.dispatchEvent(new Event('assignmentUpdated'));
        }}
      />

      <FilePreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        fileName={previewFile?.name || ''}
        fileBase64={previewFile?.base64 || null}
      />
    </div>
  );
};
