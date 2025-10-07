import React, { useEffect, useState } from 'react';
import { Save, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { useCaseStore } from '@/stores/caseStore';

interface PhysicianInformationFormProps {
  sectionId: string;
}

export const PhysicianInformationForm: React.FC<PhysicianInformationFormProps> = ({ sectionId }) => {
  const { t, language } = useI18n();
  const { updateSection, getSectionStatus, getAutosaveTimestamp } = useCaseStore();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [lastSaved, setLastSaved] = useState<string>('');
  const [hasSessionData, setHasSessionData] = useState<boolean>(false);

  const status = getSectionStatus(sectionId);
  const autosaveTimestamp = getAutosaveTimestamp(sectionId);

  // Load data from sessionStorage on component mount
  useEffect(() => {
    const savedData = sessionStorage.getItem(`physicianForm_${sectionId}`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
        setHasSessionData(true);
        console.log('✅ Loaded Physician Information data from sessionStorage:', parsedData);
      } catch (error) {
        console.error('❌ Error loading Physician Information data from sessionStorage:', error);
        setHasSessionData(false);
      }
    } else {
      setHasSessionData(false);
    }
  }, [sectionId]);

  // Auto-save effect with sessionStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(formData).length > 0) {
        // Save to case store
        updateSection(sectionId, formData);
        
        // Save to sessionStorage
        try {
          sessionStorage.setItem(`physicianForm_${sectionId}`, JSON.stringify(formData));
          console.log('✅ Saved Physician Information data to sessionStorage:', formData);
        } catch (error) {
          console.error('❌ Error saving Physician Information data to sessionStorage:', error);
        }
        
        setLastSaved(new Date().toLocaleTimeString());
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [formData, sectionId, updateSection]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Save to case store
    updateSection(sectionId, formData);
    
    // Save to sessionStorage
    try {
      sessionStorage.setItem(`physicianForm_${sectionId}`, JSON.stringify(formData));
      console.log('✅ Manually saved Physician Information data to sessionStorage:', formData);
    } catch (error) {
      console.error('❌ Error manually saving Physician Information data to sessionStorage:', error);
    }
    
    setLastSaved(new Date().toLocaleTimeString());
  };

  // Function to clear sessionStorage data
  const clearSessionData = () => {
    try {
      sessionStorage.removeItem(`physicianForm_${sectionId}`);
      setFormData({});
      setHasSessionData(false);
      console.log('✅ Cleared Physician Information data from sessionStorage');
    } catch (error) {
      console.error('❌ Error clearing Physician Information data from sessionStorage:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-700">
              {t('physicianInformation')}
            </h1>
            <p className="text-gray-500 mt-1">
              Section B - {t('sectionB')}
              {hasSessionData && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  📱 Session Data
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastSaved && (
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {language === 'fr' ? `Sauvegardé à ${lastSaved}` : `Saved at ${lastSaved}`}
              </div>
            )}
            <Button
              onClick={clearSessionData}
              variant="outline"
              size="sm"
              className="mr-2"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button
              onClick={handleSave}
              variant="outline"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {t('save')}
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-6">
          {/* Physician Information Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('physicianInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lastName">{t('lastName')}</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder={t('enterLastName')}
                  />
                </div>
                <div>
                  <Label htmlFor="firstName">{t('firstName')}</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder={t('enterFirstName')}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="licenseNumber">{t('licenseNumber')}</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber || ''}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    placeholder={t('enterLicenseNumber')}
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfService">{t('dateOfService')}</Label>
                  <Input
                    id="dateOfService"
                    type="date"
                    value={formData.dateOfService || ''}
                    onChange={(e) => handleInputChange('dateOfService', e.target.value)}
                    placeholder={t('enterDateOfService')}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telephone">{t('telephone')}</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    value={formData.telephone || ''}
                    onChange={(e) => handleInputChange('telephone', e.target.value)}
                    placeholder={t('enterTelephone')}
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={t('enterEmail')}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">{t('address')}</Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder={t('enterAddress')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status indicator */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {language === 'fr' ? 'Statut:' : 'Status:'}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                status === 'completed' ? 'bg-green-100 text-green-800' :
                status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {status === 'completed' ? (language === 'fr' ? 'Terminé' : 'Completed') :
                 status === 'in_progress' ? (language === 'fr' ? 'En cours' : 'In Progress') :
                 (language === 'fr' ? 'Non commencé' : 'Not Started')}
              </span>
            </div>
            {autosaveTimestamp && (
              <div className="text-xs text-gray-500">
                {language === 'fr' ? 'Dernière sauvegarde:' : 'Last saved:'} {new Date(autosaveTimestamp).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
