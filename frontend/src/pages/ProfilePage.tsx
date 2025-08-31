import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Save,
  Edit
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profile, setProfile] = useState({
    firstName: 'Dr. Marie',
    lastName: 'Dubois',
    email: 'marie.dubois@clinique.ca',
    phone: '+1 (514) 555-0123',
    clinic: 'Clinique Médicale Centomo',
    address: '1234 Rue de la Santé, Montréal, QC H2K 1A1',
    license: 'MD-12345',
    specialization: 'Médecine du travail',
    joinDate: '2023-01-15',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileChange = (key: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePasswordChange = (key: string, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveProfile = () => {
    // TODO: Implement profile save to backend
    console.log('Saving profile:', profile);
    
    setIsSaving(true);
    
    // Simulate save operation
    setTimeout(() => {
      // Show success feedback
      alert('Profil sauvegardé avec succès!');
      setIsEditing(false);
      setIsSaving(false);
      // In a real app, you would:
      // 1. Call API to save profile
      // 2. Update global state if needed
      // 3. Show toast notification
    }, 500);
  };

  const handleChangePassword = () => {
    // TODO: Implement password change
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      alert('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    console.log('Changing password...');
    
    setIsChangingPassword(true);
    
    // Simulate password change
    setTimeout(() => {
      alert('Mot de passe changé avec succès!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsChangingPassword(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-700">
          {t('profile')}
        </h1>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleSaveProfile} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Sauvegarde...' : t('save')}
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            {t('edit')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              {t('basicInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={profile.firstName}
                  onChange={(e) => handleProfileChange('firstName', e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom de famille</Label>
                <Input
                  id="lastName"
                  value={profile.lastName}
                  onChange={(e) => handleProfileChange('lastName', e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Téléphone
              </Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => handleProfileChange('phone', e.target.value)}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="clinic" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Clinique
              </Label>
              <Input
                id="clinic"
                value={profile.clinic}
                onChange={(e) => handleProfileChange('clinic', e.target.value)}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Adresse
              </Label>
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => handleProfileChange('address', e.target.value)}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-green-600" />
              Informations professionnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="license">Numéro de licence</Label>
              <Input
                id="license"
                value={profile.license}
                onChange={(e) => handleProfileChange('license', e.target.value)}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="specialization">Spécialisation</Label>
              <Input
                id="specialization"
                value={profile.specialization}
                onChange={(e) => handleProfileChange('specialization', e.target.value)}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="joinDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date d'adhésion
              </Label>
              <Input
                id="joinDate"
                type="date"
                value={profile.joinDate}
                onChange={(e) => handleProfileChange('joinDate', e.target.value)}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div className="pt-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Statut du compte</h4>
                <div className="space-y-1 text-sm text-blue-700">
                  <p>• Compte actif</p>
                  <p>• Accès complet aux fonctionnalités</p>
                  <p>• Dernière connexion: Aujourd'hui</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-600" />
              {t('changePassword')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <div className="relative mt-1">
                  <Input
                    id="currentPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <div className="relative mt-1">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleChangePassword} 
                className="bg-red-600 hover:bg-red-700"
                disabled={isChangingPassword}
              >
                <Lock className="h-4 w-4 mr-2" />
                {isChangingPassword ? 'Changement...' : 'Changer le mot de passe'}
              </Button>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Conseils de sécurité</h4>
              <div className="space-y-1 text-sm text-yellow-700">
                <p>• Utilisez au moins 8 caractères</p>
                <p>• Incluez des lettres majuscules et minuscules</p>
                <p>• Ajoutez des chiffres et des symboles</p>
                <p>• Évitez les informations personnelles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
