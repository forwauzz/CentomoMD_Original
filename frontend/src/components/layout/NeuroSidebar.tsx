import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Mic,
  FileText as Template,
  BarChart3,
  ChevronLeft, 
  ChevronRight,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/lib/i18n';
import { ROUTES } from '@/lib/constants';
import { useSpecialty } from '@/contexts/SpecialtyContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NeuroSidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export const NeuroSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const { t } = useI18n();
  const { isNeuro, setSpecialty } = useSpecialty();

  // If on neuro-dashboard route, ensure specialty is set to neuro
  React.useEffect(() => {
    if (location.pathname === ROUTES.NEURO_DASHBOARD && !isNeuro) {
      setSpecialty('neuro');
    }
  }, [location.pathname, isNeuro, setSpecialty]);

  // Only show Neuro sidebar if user selected Neuro specialty
  if (!isNeuro) {
    return null;
  }

  const neuroSidebarItems: NeuroSidebarItem[] = [
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
    {
      id: 'transcript-analysis',
      label: t('transcriptAnalysis'),
      icon: BarChart3,
      href: ROUTES.TRANSCRIPT_ANALYSIS,
    },
  ];

  const handleItemClick = (href: string) => {
    navigate(href);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const renderSidebarItem = (item: NeuroSidebarItem) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    const itemContent = (
      <div
        className={cn(
          "neuro-nav-item flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 cursor-pointer group",
          isActive 
            ? "bg-neuro-primary/10 text-neuro-primary border-l-4 border-neuro-primary" 
            : "text-neuro-text hover:bg-neuro-surface hover:text-neuro-primary",
          sidebarCollapsed && "justify-center px-2"
        )}
        onClick={() => handleItemClick(item.href)}
      >
        <Icon 
          className={cn(
            "h-5 w-5 neuro-icon transition-all duration-300",
            isActive ? "text-neuro-primary" : "text-neuro-text-secondary group-hover:text-neuro-primary"
          )} 
        />
        {!sidebarCollapsed && (
          <span className="font-medium text-sm transition-all duration-300">
            {item.label}
          </span>
        )}
      </div>
    );

    if (sidebarCollapsed) {
      return (
        <TooltipProvider key={item.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              {itemContent}
            </TooltipTrigger>
            <TooltipContent side="right" className="neuro-tooltip">
              <p className="text-neuro-text">{item.label}</p>
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
        "neuro-sidebar bg-neuro-background border-r border-neuro-border transition-all duration-300 flex flex-col",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neuro-border">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-neuro-primary neuro-icon" />
            <h1 className="text-lg font-bold text-neuro-text">TecheMD</h1>
            <span className="text-xs text-neuro-text-secondary bg-neuro-primary/10 px-2 py-1 rounded-full">
              Neuro
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="neuro-button p-2 hover:bg-neuro-surface"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4 text-neuro-text-secondary" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-neuro-text-secondary" />
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {neuroSidebarItems.map(renderSidebarItem)}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-neuro-border">
        {!sidebarCollapsed && (
          <div className="text-xs text-neuro-text-secondary text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-2 h-2 bg-neuro-primary rounded-full animate-pulse"></div>
              <span>Neuro Mode Active</span>
            </div>
            <p>AI-Powered Analysis</p>
          </div>
        )}
      </div>
    </div>
  );
};
