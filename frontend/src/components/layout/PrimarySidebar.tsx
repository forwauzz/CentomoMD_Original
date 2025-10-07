import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Mic, 
  Settings, 
  User, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  MicIcon,
  Quote,
  Zap,
  BarChart3,
  FileText as Template
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/lib/i18n';
import { ROUTES } from '@/lib/constants';
import { useFeatureFlags } from '@/lib/featureFlags';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  isBottom?: boolean;
}

export const PrimarySidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const { t } = useI18n();
  const featureFlags = useFeatureFlags();

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: t('dashboard'),
      icon: LayoutDashboard,
      href: ROUTES.DASHBOARD,
    },
    {
      id: 'new-case',
      label: t('newCase'),
      icon: Plus,
      href: ROUTES.NEW_CASE,
    },
    {
      id: 'templates',
      label: t('templates'),
      icon: Template,
      href: ROUTES.TEMPLATE_COMBINATIONS,
    },
    {
      id: 'dictation',
      label: t('dictation'),
      icon: Mic,
      href: ROUTES.DICTATION,
    },
    // Feature-flagged navigation items
    ...(featureFlags.voiceCommands ? [{
      id: 'voice-commands',
      label: t('voiceCommands'),
      icon: MicIcon,
      href: ROUTES.VOICE_COMMANDS,
    }] : []),
    ...(featureFlags.verbatim ? [{
      id: 'verbatim',
      label: t('verbatim'),
      icon: Quote,
      href: ROUTES.VERBATIM,
    }] : []),
    ...(featureFlags.macros ? [{
      id: 'macros',
      label: t('macros'),
      icon: Zap,
      href: ROUTES.MACROS,
    }] : []),
    {
      id: 'transcript-analysis',
      label: t('transcriptAnalysis'),
      icon: BarChart3,
      href: ROUTES.TRANSCRIPT_ANALYSIS,
    },
    {
      id: 'settings',
      label: t('settings'),
      icon: Settings,
      href: ROUTES.SETTINGS,
      isBottom: true,
    },
    {
      id: 'profile',
      label: t('profile'),
      icon: User,
      href: ROUTES.PROFILE,
      isBottom: true,
    },
  ];

  const handleItemClick = (href: string) => {
    navigate(href);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const renderSidebarItem = (item: SidebarItem) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    const itemContent = (
      <Button
        variant={isActive ? 'default' : 'ghost'}
        size="sm"
        className={cn(
          'w-full justify-start gap-3 h-10',
          isActive && 'bg-blue-600 text-white hover:bg-blue-700',
          !isActive && 'hover:bg-blue-50 text-slate-700'
        )}
        onClick={() => handleItemClick(item.href)}
        aria-current={isActive ? 'page' : undefined}
        aria-label={sidebarCollapsed ? item.label : undefined}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!sidebarCollapsed && (
          <span className="truncate">{item.label}</span>
        )}
      </Button>
    );

    if (sidebarCollapsed) {
      return (
        <TooltipProvider key={item.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                {itemContent}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-2">
              {item.label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return <div key={item.id}>{itemContent}</div>;
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'w-20' : 'w-70'
      )}
      style={{
        width: sidebarCollapsed ? '80px' : '280px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <Mic className="h-6 w-6 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-700">CentomoMD</h1>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="h-8 w-8 p-0 hover:bg-blue-50"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!sidebarCollapsed}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col p-2 space-y-1">
        {/* Top items */}
        <div className="space-y-1">
          {sidebarItems
            .filter((item) => !item.isBottom)
            .map(renderSidebarItem)}
        </div>

        {/* Bottom items */}
        <div className="mt-auto space-y-1">
          {sidebarItems
            .filter((item) => item.isBottom)
            .map(renderSidebarItem)}
        </div>
      </div>
    </div>
  );
};
