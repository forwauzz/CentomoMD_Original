import React from 'react';
import { NewCaseButton } from '@/components/case/NewCaseButton';
import { useSessionStore } from '@/stores/sessionStore';
import { useCaseStore } from '@/stores/caseStore';
import { useUserStore } from '@/stores/userStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, User, Calendar } from 'lucide-react';

export const CaseManagementPage: React.FC = () => {
  const { currentSession, hasActiveCase, getCurrentCaseId } = useSessionStore();
  const { sections, currentCaseId, hasActiveCase: caseHasActiveCase } = useCaseStore();
  const { profile } = useUserStore();

  const sessionCaseId = getCurrentCaseId();
  const activeCaseId = sessionCaseId || currentCaseId;
  const hasActiveCaseData = hasActiveCase() || caseHasActiveCase();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Case Management</h1>
          <p className="text-muted-foreground">
            Manage your medical cases and transcription sessions
          </p>
        </div>
        <NewCaseButton size="lg">
          Start New Case
        </NewCaseButton>
      </div>

      {/* Current Session Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current Session Status
          </CardTitle>
          <CardDescription>
            Information about your current transcription session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentSession ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Session ID</label>
                <p className="text-sm text-muted-foreground font-mono">
                  {currentSession.id.slice(0, 8)}...
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Patient ID</label>
                <p className="text-sm text-muted-foreground">
                  {currentSession.patient_id}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Badge variant={currentSession.status === 'active' ? 'default' : 'secondary'}>
                  {currentSession.status}
                </Badge>
              </div>
              {activeCaseId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Case ID</label>
                  <Badge variant="outline">
                    Case #{activeCaseId}
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No active session</p>
          )}
        </CardContent>
      </Card>

      {/* Current Case Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Current Case Status
          </CardTitle>
          <CardDescription>
            Information about your current case and sections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasActiveCaseData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {activeCaseId ? `Case #${activeCaseId}` : 'New Case'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {sections.length} sections, {sections.filter(s => s.status === 'completed').length} completed
                  </p>
                </div>
                <Badge variant={sections.length > 0 ? 'default' : 'secondary'}>
                  {sections.length > 0 ? 'Active' : 'Empty'}
                </Badge>
              </div>
              
              {sections.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sections</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {sections.map((section) => (
                      <div key={section.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{section.title}</span>
                        <Badge 
                          variant={
                            section.status === 'completed' ? 'default' : 
                            section.status === 'in_progress' ? 'secondary' : 'outline'
                          }
                        >
                          {section.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No active case</p>
              <p className="text-sm text-muted-foreground">
                Click "Start New Case" to begin working on a new medical case
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Profile Info */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              User Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <p className="text-sm text-muted-foreground">
                  {profile.display_name}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Locale</label>
                <Badge variant="outline">
                  {profile.locale}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use Case Switching</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">When you have an active case:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Click "Start New Case" to see the confirmation popup</li>
              <li>• Choose "Yes" to save current case and start a new one</li>
              <li>• Choose "No" to continue working on the current case</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">When you don't have an active case:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Click "Start New Case" to immediately start a new case</li>
              <li>• No confirmation popup will appear</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
