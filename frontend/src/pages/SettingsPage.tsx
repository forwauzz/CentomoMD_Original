import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { useUIStore } from '@/stores/uiStore';
import { useUserStore, useEnsureProfileLoaded } from '@/stores/userStore';
import { apiJSON } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Settings, 
  // Globe,
  // Clock,
  Image, 
  Shield, 
  Mic, 
  Download, 
  Database, 
  Save,
  Upload,
  Trash2
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { t } = useI18n();
  const { inputLanguage, setInputLanguage, addToast } = useUIStore();
  const profile = useUserStore((s) => s.profile);
  const refreshProfile = useUserStore((s) => s.refreshProfile);
  useEnsureProfileLoaded();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    // General
    timezone: 'America/Montreal',
    clinicLogo: '',
    
    // Compliance
    quebecLaw25: true,
    pipeda: true,
    consentAnalytics: true, // Default to true (checked ON)
    zeroRetention: false,
    
    // Dictation defaults - sync with UI store
    defaultLanguage: inputLanguage === 'fr' ? 'fr-CA' : 'en-US',
    autoSave: true,
    transcriptionMode: 'smart_dictation',
    
    // Export defaults
    defaultFormat: 'pdf',
    bilingualExport: true,
    includeMetadata: true,
    
    // Data
    autosaveEnabled: true,
    autosaveInterval: 5,
    clearCacheOnExit: false,
  });

  // Load profile data and sync with settings
  useEffect(() => {
    if (profile) {
      setSettings(prev => ({
        ...prev,
        pipeda: profile.consent_pipeda ?? prev.pipeda,
        consentAnalytics: profile.consent_analytics ?? true, // Default to true if not set
      }));
    }
  }, [profile]);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Update UI store language when defaultLanguage changes
    if (key === 'defaultLanguage') {
      const uiLanguageFormat = value === 'fr-CA' ? 'fr' : 'en';
      setInputLanguage(uiLanguageFormat);
      console.log('SettingsPage: UI language updated to:', uiLanguageFormat, 'from defaultLanguage:', value);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // Save compliance settings to profile
      await apiJSON('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          consent_pipeda: settings.pipeda,
          consent_analytics: settings.consentAnalytics,
        }),
      });

      // Refresh profile to get updated values
      await refreshProfile();

      addToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Your settings have been saved successfully.',
      });

      setIsSaving(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save settings. Please try again.',
      });
      setIsSaving(false);
    }
  };

  const handleClearCache = () => {
    // TODO: Implement cache clearing
    console.log('Clearing cache...');
    
    // Simulate cache clearing
    setTimeout(() => {
      alert('Cache vidé avec succès!');
    }, 300);
  };

  const handleUploadLogo = () => {
    // TODO: Implement logo upload
    console.log('Uploading logo...');
    
    // Simulate logo upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Simulate upload
        setTimeout(() => {
          handleSettingChange('clinicLogo', URL.createObjectURL(file));
          alert('Logo téléversé avec succès!');
        }, 1000);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-700">
          {t('settings')}
        </h1>
        <Button 
          onClick={handleSaveSettings} 
          className="bg-blue-600 hover:bg-blue-700"
          disabled={isSaving}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Sauvegarde...' : t('save')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              {t('general')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="language">Input Language</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={inputLanguage === 'fr' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInputLanguage('fr')}
                >
                  Français
                </Button>
                <Button
                  variant={inputLanguage === 'en' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInputLanguage('en')}
                >
                  English
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Output will always be in French (CNESST compliant)
              </p>
            </div>

            <div>
              <Label htmlFor="timezone">{t('timezone')}</Label>
              <select
                id="timezone"
                value={settings.timezone}
                onChange={(e) => handleSettingChange('timezone', e.target.value)}
                className="w-full mt-2 p-2 border border-gray-300 rounded-md"
              >
                <option value="America/Montreal">Eastern Time (Montreal)</option>
                <option value="America/Toronto">Eastern Time (Toronto)</option>
                <option value="America/Vancouver">Pacific Time (Vancouver)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div>
              <Label>{t('clinicLogo')}</Label>
              <div className="flex items-center gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={handleUploadLogo}>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('upload')}
                </Button>
                {settings.clinicLogo && (
                  <Button variant="outline" size="sm">
                    <Image className="h-4 w-4 mr-2" />
                    {t('preview')}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              {t('compliance')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="quebecLaw25"
                checked={settings.quebecLaw25}
                onCheckedChange={(checked) => handleSettingChange('quebecLaw25', checked)}
              />
              <Label htmlFor="quebecLaw25">{t('quebecLaw25')}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="pipeda"
                checked={settings.pipeda}
                onCheckedChange={(checked) => handleSettingChange('pipeda', checked)}
              />
              <Label htmlFor="pipeda">{t('pipeda')}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="consentAnalytics"
                checked={settings.consentAnalytics}
                onCheckedChange={(checked) => handleSettingChange('consentAnalytics', checked)}
              />
              <Label htmlFor="consentAnalytics">
                Analytics Consent
                <span className="text-xs text-gray-500 ml-1">(Help improve templates)</span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="zeroRetention"
                checked={settings.zeroRetention}
                onCheckedChange={(checked) => handleSettingChange('zeroRetention', checked)}
              />
              <Label htmlFor="zeroRetention">{t('zeroRetention')}</Label>
            </div>
          </CardContent>
        </Card>

        {/* Dictation Defaults */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-purple-600" />
              {t('dictationDefaults')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="defaultLanguage">{t('language')}</Label>
              <select
                id="defaultLanguage"
                value={settings.defaultLanguage}
                onChange={(e) => handleSettingChange('defaultLanguage', e.target.value)}
                className="w-full mt-2 p-2 border border-gray-300 rounded-md"
              >
                <option value="fr-CA">Français (Canada)</option>
                <option value="en-CA">English (Canada)</option>
                <option value="fr-FR">Français (France)</option>
                <option value="en-US">English (US)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoSave"
                checked={settings.autoSave}
                onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
              />
              <Label htmlFor="autoSave">{t('autosave')}</Label>
            </div>

            <div>
              <Label htmlFor="transcriptionMode">Mode de transcription</Label>
              <select
                id="transcriptionMode"
                value={settings.transcriptionMode}
                onChange={(e) => handleSettingChange('transcriptionMode', e.target.value)}
                className="w-full mt-2 p-2 border border-gray-300 rounded-md"
              >
                <option value="smart_dictation">Dictée intelligente</option>
                <option value="word_for_word">Mot pour mot</option>
                <option value="ambient">Ambient</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Export Defaults */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-orange-600" />
              {t('exportDefaults')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="defaultFormat">Format par défaut</Label>
              <select
                id="defaultFormat"
                value={settings.defaultFormat}
                onChange={(e) => handleSettingChange('defaultFormat', e.target.value)}
                className="w-full mt-2 p-2 border border-gray-300 rounded-md"
              >
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
                <option value="json">JSON</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="bilingualExport"
                checked={settings.bilingualExport}
                onCheckedChange={(checked) => handleSettingChange('bilingualExport', checked)}
              />
              <Label htmlFor="bilingualExport">{t('bilingualExport')}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeMetadata"
                checked={settings.includeMetadata}
                onCheckedChange={(checked) => handleSettingChange('includeMetadata', checked)}
              />
              <Label htmlFor="includeMetadata">Inclure les métadonnées</Label>
            </div>
          </CardContent>
        </Card>

        {/* Data Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-red-600" />
              {t('data')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autosaveEnabled"
                checked={settings.autosaveEnabled}
                onCheckedChange={(checked) => handleSettingChange('autosaveEnabled', checked)}
              />
              <Label htmlFor="autosaveEnabled">{t('autosave')}</Label>
            </div>

            {settings.autosaveEnabled && (
              <div>
                <Label htmlFor="autosaveInterval">Intervalle de sauvegarde (minutes)</Label>
                <Input
                  id="autosaveInterval"
                  type="number"
                  min="1"
                  max="60"
                  value={settings.autosaveInterval}
                  onChange={(e) => handleSettingChange('autosaveInterval', parseInt(e.target.value))}
                  className="w-32 mt-2"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="clearCacheOnExit"
                checked={settings.clearCacheOnExit}
                onCheckedChange={(checked) => handleSettingChange('clearCacheOnExit', checked)}
              />
              <Label htmlFor="clearCacheOnExit">Vider le cache à la fermeture</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleClearCache}>
                <Trash2 className="h-4 w-4 mr-2" />
                {t('clearCache')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
