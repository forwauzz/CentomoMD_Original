import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authClient';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, User, Globe, Shield, Mail, Plus, Key } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useUserStore } from '@/stores/userStore';
import { dbLocaleToUi } from '@/lib/i18n';
import { supabase } from '@/lib/authClient';

// Profile types - matches backend API response
interface ProfileData {
  display_name: string;
  locale: 'en-CA' | 'fr-CA';
  consent_pipeda: boolean;
  consent_marketing: boolean;
  default_clinic_id?: string;
}

interface ProfileUpdate {
  display_name?: string;
  locale?: 'en-CA' | 'fr-CA';
  consent_pipeda?: boolean;
  consent_marketing?: boolean;
  default_clinic_id?: string;
}

// Profile API service functions
const profileService = {
  async getProfile(): Promise<ProfileData> {
    const response = await apiFetch<{ ok: boolean; profile: ProfileData }>('/api/profile');
    return response.profile;
  },

  async updateProfile(updates: ProfileUpdate): Promise<ProfileData> {
    const response = await apiFetch<{ success: boolean; data: ProfileData }>('/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return response.data;
  },
};

// Language options for the select component
// const languageOptions = [
//   { label: 'English (Canada)', value: 'en-CA' as const },
//   { label: 'Français (Canada)', value: 'fr-CA' as const },
// ];

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { addToast, setLanguage } = useUIStore();
  const { setProfile: setUserProfile, refreshProfile } = useUserStore();
  const { t } = useI18n();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [hasPasswordAuth, setHasPasswordAuth] = useState(false);

  // TODO: Form state for editing
  const [formData, setFormData] = useState<ProfileData>({
    display_name: '',
    locale: 'en-CA',
    consent_pipeda: false,
    consent_marketing: false,
  });

  // Load profile data on component mount
  useEffect(() => {
    loadProfile();
    checkPasswordAuth();
  }, []);

  const checkPasswordAuth = async () => {
    try {
      if (user?.email) {
        // Check if user has password authentication enabled
        // This is a simple check - in a real app you might want to check user metadata
        // For now, we'll assume password auth is available if user has email
        setHasPasswordAuth(true);
      }
    } catch (error) {
      console.error('Error checking password auth:', error);
      setHasPasswordAuth(false);
    }
  };

  const loadProfile = async () => {
    try {
      console.log('🔍 ProfilePage: Starting profile load...');
      setLoading(true);
      const data = await profileService.getProfile();
      console.log('🔍 ProfilePage: Profile data received:', data);
      
      // Ensure we have valid profile data
      if (data && typeof data === 'object') {
        setProfile(data);
        setFormData(data);
        setErrors({});
        
        // Update platform language based on profile (DB is source of truth)
        const uiLanguage = dbLocaleToUi(data.locale);
        setLanguage(uiLanguage);
        
        // Update user store with profile data
        setUserProfile(data);
        console.log('✅ ProfilePage: Profile loaded and form updated successfully');
      } else {
        console.warn('⚠️ ProfilePage: Invalid profile data received:', data);
        // Set default data if profile is invalid
        const defaultProfile: ProfileData = {
          display_name: user?.email?.split('@')[0] || 'User',
          locale: 'fr-CA',
          consent_pipeda: false,
          consent_marketing: false,
        };
        setProfile(defaultProfile);
        setFormData(defaultProfile);
        setUserProfile(defaultProfile);
      }
    } catch (error) {
      console.error('❌ ProfilePage: Failed to load profile:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load profile data'
      });
      
      // Show fallback data for development
      const fallbackData: ProfileData = {
        display_name: user?.email?.split('@')[0] || 'Unknown User',
        locale: 'en-CA',
        consent_pipeda: false,
        consent_marketing: false,
      };
      setProfile(fallbackData);
      setFormData(fallbackData);
      setUserProfile(fallbackData);
    } finally {
      setLoading(false);
      console.log('🔍 ProfilePage: Profile loading completed');
    }
  };

  // TODO: Handle form field changes
  const handleFieldChange = (field: keyof ProfileData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // TODO: Validate form data
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    }

    if (formData.display_name.length > 100) {
      newErrors.display_name = 'Display name must be less than 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // TODO: Save profile changes
  const handleSave = async () => {
    if (!validateForm()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fix the errors before saving'
      });
      return;
    }

    try {
      setSaving(true);
      
      // TODO: Only send changed fields
      const changes: ProfileUpdate = {};
      if (formData.display_name !== profile?.display_name) {
        changes.display_name = formData.display_name;
      }
      if (formData.locale !== profile?.locale) {
        changes.locale = formData.locale;
      }
      if (formData.consent_pipeda !== profile?.consent_pipeda) {
        changes.consent_pipeda = formData.consent_pipeda;
      }
      if (formData.consent_marketing !== profile?.consent_marketing) {
        changes.consent_marketing = formData.consent_marketing;
      }

      if (Object.keys(changes).length === 0) {
        addToast({
          type: 'info',
          title: 'No Changes',
          message: 'No changes to save'
        });
        return;
      }

      const updatedProfile = await profileService.updateProfile(changes);
      
      // Optimistic update to stop flicker, then ensure with refresh
      setUserProfile(updatedProfile);
      setProfile(updatedProfile);
      setFormData(updatedProfile);
      
      // Update platform language if locale changed (DB is source of truth)
      if (changes.locale) {
        const uiLanguage = dbLocaleToUi(updatedProfile.locale);
        setLanguage(uiLanguage);
      }
      
      // Ensure store is in sync with server
      refreshProfile().catch(() => void 0);
      
      addToast({
        type: 'success',
        title: 'Success',
        message: 'Profile updated successfully'
      });
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      
      // TODO: Handle validation errors from backend
      if (error.status === 400 && error.details) {
        const backendErrors: Record<string, string> = {};
        error.details.forEach((err: any) => {
          backendErrors[err.path[0]] = err.message;
        });
        setErrors(backendErrors);
        addToast({
          type: 'error',
          title: 'Validation Error',
          message: 'Please fix the validation errors'
        });
      } else {
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to update profile'
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No email address found for password reset'
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-callback`
      });

      if (error) {
        throw error;
      }

      setPasswordResetSent(true);
      addToast({
        type: 'success',
        title: 'Password Reset Sent',
        message: `We sent a password reset link to ${user.email}`
      });
    } catch (error) {
      console.error('Password reset error:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to send password reset email'
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-6 w-6" />
            <span>{t('profileSettings')}</span>
          </CardTitle>
          <CardDescription>
            {t('basicInformation')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Profile Creation Notice */}
          {!profile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-800">
                    Welcome! Let's set up your profile
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Fill out the form below and click Save to create your profile.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TODO: Display Name Field */}
          <div className="space-y-2">
            <Label htmlFor="display_name">{t('displayName')}</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => handleFieldChange('display_name', e.target.value)}
              placeholder={t('displayNamePlaceholder')}
              className={errors.display_name ? 'border-red-500' : ''}
            />
            {errors.display_name && (
              <p className="text-sm text-red-500">{errors.display_name}</p>
            )}
          </div>

          {/* TODO: Language/Locale Field */}
          <div className="space-y-2">
            <Label htmlFor="locale" className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>{t('language')}</span>
            </Label>
            <p className="text-sm text-gray-600">{t('languageDescription')}</p>
            <Select
              value={formData.locale}
              onValueChange={(value: 'en-CA' | 'fr-CA') => handleFieldChange('locale', value)}
              items={[
                { label: t('englishCanada'), value: 'en-CA' as const },
                { label: t('frenchCanada'), value: 'fr-CA' as const },
              ]}
              className="w-full"
            />
          </div>

          {/* TODO: Privacy Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>{t('privacySettings')}</span>
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="consent_pipeda">{t('pipedaConsent')}</Label>
                <p className="text-sm text-gray-500">
                  {t('pipedaDescription')}
                </p>
              </div>
              <Switch
                id="consent_pipeda"
                checked={formData.consent_pipeda}
                onCheckedChange={(checked: boolean) => handleFieldChange('consent_pipeda', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="consent_marketing" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>{t('marketingConsent')}</span>
                </Label>
                <p className="text-sm text-gray-500">
                  {t('marketingDescription')}
                </p>
              </div>
              <Switch
                id="consent_marketing"
                checked={formData.consent_marketing}
                onCheckedChange={(checked: boolean) => handleFieldChange('consent_marketing', checked)}
              />
            </div>
          </div>

          {/* Password Reset Section */}
          {hasPasswordAuth && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>Password</span>
              </h3>
              
              {passwordResetSent ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Mail className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-green-800">
                        Password Reset Email Sent
                      </h4>
                      <p className="text-sm text-green-700 mt-1">
                        We sent a password reset link to {user?.email}. Check your email and follow the instructions to reset your password.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Reset Password</Label>
                    <p className="text-sm text-gray-500">
                      Send a password reset link to your email address
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handlePasswordReset}
                    className="flex items-center space-x-2"
                  >
                    <Key className="h-4 w-4" />
                    <span>Reset Password</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={loadProfile}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saving ? 'Saving...' : t('saveProfile')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
