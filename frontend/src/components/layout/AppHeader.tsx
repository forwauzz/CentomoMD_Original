import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Globe, Bell, User, LogOut, ChevronRight, Home, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/lib/i18n';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/lib/authClient';
import { useUserStore, useEnsureProfileLoaded } from '@/stores/userStore';
import { resolveDisplayName } from '@/lib/resolveDisplayName';
import { supabase } from '@/lib/authClient';

interface AppHeaderProps {
  onMobileMenuToggle?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onMobileMenuToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { inputLanguage, setInputLanguage } = useUIStore();
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const profile = useUserStore((s) => s.profile);
  const refreshProfile = useUserStore((s) => s.refreshProfile);
  const [authUser, setAuthUser] = useState<import('@supabase/supabase-js').User | null>(null);

  // Ensure profile is loaded on first render
  useEnsureProfileLoaded();

  // Keep a live view of the auth user (for fallback only)
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => mounted && setAuthUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      setAuthUser(session?.user ?? null);
      // After login/logout, refresh the profile row to avoid stale header
      refreshProfile().catch(() => void 0);
    });
    return () => { 
      mounted = false; 
      sub?.subscription.unsubscribe(); 
    };
  }, [refreshProfile]);

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    // Add home
    breadcrumbs.push({ label: t('home'), href: '/' });

    // Add path segments
    if (pathSegments.length > 0) {
      if (pathSegments[0] === 'dashboard') {
        breadcrumbs.push({ label: t('dashboard'), href: ROUTES.DASHBOARD });
      } else if (pathSegments[0] === 'case' && pathSegments[1] === 'new') {
        breadcrumbs.push({ label: t('newCase'), href: ROUTES.NEW_CASE });
      } else if (pathSegments[0] === 'templates') {
        breadcrumbs.push({ label: t('templates'), href: ROUTES.TEMPLATES });
      } else if (pathSegments[0] === 'dictation') {
        breadcrumbs.push({ label: t('dictation'), href: ROUTES.DICTATION });
      } else if (pathSegments[0] === 'settings') {
        breadcrumbs.push({ label: t('settings'), href: ROUTES.SETTINGS });
      } else if (pathSegments[0] === 'profile') {
        breadcrumbs.push({ label: t('profile'), href: ROUTES.PROFILE });
      }
    }

    return breadcrumbs;
  };

  const toggleLanguage = () => {
    setInputLanguage(inputLanguage === 'fr' ? 'en' : 'fr');
  };

  const handleBreadcrumbClick = (href: string) => {
    navigate(href);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const breadcrumbs = getBreadcrumbs();

  // Use the centralized display name resolver
  const name = useMemo(() => resolveDisplayName(profile, authUser), [profile, authUser]);

  // Development diagnostics
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.table({
      profile_display_name: profile?.display_name,
      auth_meta_name: authUser?.user_metadata?.full_name || authUser?.user_metadata?.name,
      auth_email: authUser?.email,
      final: name,
    });
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileMenuToggle}
            className="text-slate-700 hover:bg-blue-50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center space-x-1 text-sm">
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={breadcrumb.href}>
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
              )}
              <button
                onClick={() => handleBreadcrumbClick(breadcrumb.href)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleBreadcrumbClick(breadcrumb.href);
                  }
                }}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded-md transition-colors
                  ${index === breadcrumbs.length - 1 
                    ? 'text-slate-900 font-semibold cursor-default' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-blue-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  }
                `}
                tabIndex={index === breadcrumbs.length - 1 ? -1 : 0}
                aria-label={`Navigate to ${breadcrumb.label}`}
              >
                {index === 0 && <Home className="h-3 w-3" />}
                <span>{breadcrumb.label}</span>
              </button>
            </React.Fragment>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-2 lg:space-x-3">
          {/* Language toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-1 lg:gap-2 text-slate-700 hover:bg-blue-50"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">{inputLanguage.toUpperCase()}</span>
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-700 hover:bg-blue-50"
          >
            <Bell className="h-4 w-4" />
          </Button>

          {/* User menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 lg:gap-2 text-slate-700 hover:bg-blue-50"
            >
              <User className="h-4 w-4" />
              <span className="hidden lg:inline">{name}</span>
            </Button>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={!user}
            className="text-slate-700 hover:bg-blue-50 disabled:text-gray-400 disabled:cursor-not-allowed"
            title={user ? "Sign out" : "Not authenticated"}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
