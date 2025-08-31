import React from 'react';
import { useLocation } from 'react-router-dom';
import { Globe, Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/lib/i18n';
import { ROUTES } from '@/lib/constants';

export const AppHeader: React.FC = () => {
  const location = useLocation();
  const { language, setLanguage } = useUIStore();
  const { t } = useI18n();

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
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={breadcrumb.href}>
              {index > 0 && (
                <span className="text-gray-400 mx-2">/</span>
              )}
              <span className="text-slate-700 font-medium">
                {breadcrumb.label}
              </span>
            </React.Fragment>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-3">
          {/* Language toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2 text-slate-700 hover:bg-blue-50"
          >
            <Globe className="h-4 w-4" />
            <span className="font-medium">{language.toUpperCase()}</span>
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
              className="flex items-center gap-2 text-slate-700 hover:bg-blue-50"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Dr. Smith</span>
            </Button>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-700 hover:bg-blue-50"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
