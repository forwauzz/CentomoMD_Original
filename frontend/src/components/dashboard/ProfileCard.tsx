import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useAuth } from '@/lib/authClient';
import { useUserStore, useEnsureProfileLoaded } from '@/stores/userStore';
import { resolveDisplayName } from '@/lib/resolveDisplayName';

export const ProfileCard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = useUserStore((s) => s.profile);
  const refreshProfile = useUserStore((s) => s.refreshProfile);

  useEnsureProfileLoaded();

  useEffect(() => {
    // Best-effort refresh on mount so data is fresh
    refreshProfile().catch(() => void 0);
  }, [refreshProfile]);

  const displayName = resolveDisplayName(profile as any, (user as any)?.rawUser ?? (user as any));

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-700">
            Profile
          </CardTitle>
          <div className="p-2 bg-indigo-50 rounded-lg">
            <User className="h-5 w-5 text-indigo-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-slate-600">
          <div className="font-medium">Welcome back{displayName ? `, ${displayName}` : ''}</div>
          {user?.email && (
            <div className="text-slate-500">{user.email}</div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/profile')} className="w-full">
          Open Profile
        </Button>
      </CardContent>
    </Card>
  );
}
