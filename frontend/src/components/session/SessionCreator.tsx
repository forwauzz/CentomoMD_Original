import React, { useState } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useCaseStore } from '@/stores/caseStore';
import { SessionFormData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SessionCreatorProps {
  onSessionCreated?: (sessionId: string) => void;
}

export const SessionCreator: React.FC<SessionCreatorProps> = ({ onSessionCreated }) => {
  const { createSession, loading, error } = useSessionStore();
  const { saveCaseToDatabase } = useCaseStore();
  const [formData, setFormData] = useState<SessionFormData>({
    patientId: '',
    caseId: undefined,
    consentVerified: false,
    mode: 'smart_dictation',
    currentSection: 'section_7',
  });
  const [createNewCase, setCreateNewCase] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let caseId = formData.caseId;
      
      // If creating a new case, save it first
      if (createNewCase) {
        const caseResult = await saveCaseToDatabase(
          '00000000-0000-0000-0000-000000000001', // Mock user ID
          '3267cef9-9a11-4e1a-a0c4-c1309538b952'  // Mock clinic ID
        );
        
        if (caseResult.success && caseResult.caseId) {
          caseId = caseResult.caseId;
        } else {
          throw new Error(caseResult.error || 'Failed to create case');
        }
      }
      
      // Create session with case_id
      const result = await createSession({
        ...formData,
        caseId,
      });
      
      if (result.success && result.session) {
        onSessionCreated?.(result.session.id);
        // Reset form
        setFormData({
          patientId: '',
          caseId: undefined,
          consentVerified: false,
          mode: 'smart_dictation',
          currentSection: 'section_7',
        });
        setCreateNewCase(false);
      } else {
        throw new Error(result.error || 'Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create New Session</CardTitle>
        <CardDescription>
          Start a new transcription session with optional case association
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patientId">Patient ID</Label>
            <Input
              id="patientId"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              placeholder="Enter patient identifier"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createNewCase"
                checked={createNewCase}
                onCheckedChange={(checked) => setCreateNewCase(checked as boolean)}
              />
              <Label htmlFor="createNewCase">Create new case</Label>
            </div>
            
            {!createNewCase && (
              <div>
                <Label htmlFor="caseId">Case ID (optional)</Label>
                <Input
                  id="caseId"
                  type="number"
                  value={formData.caseId || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    caseId: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  placeholder="Enter existing case ID"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mode">Transcription Mode</Label>
            <Select
              value={formData.mode}
              onValueChange={(value: any) => setFormData({ ...formData, mode: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="word_for_word">Word for Word</SelectItem>
                <SelectItem value="smart_dictation">Smart Dictation</SelectItem>
                <SelectItem value="ambient">Ambient</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentSection">Starting Section</Label>
            <Select
              value={formData.currentSection}
              onValueChange={(value: any) => setFormData({ ...formData, currentSection: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="section_7">Section 7</SelectItem>
                <SelectItem value="section_8">Section 8</SelectItem>
                <SelectItem value="section_11">Section 11</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="consentVerified"
              checked={formData.consentVerified}
              onCheckedChange={(checked) => setFormData({ ...formData, consentVerified: checked as boolean })}
            />
            <Label htmlFor="consentVerified">Consent verified</Label>
          </div>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating...' : 'Create Session'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
