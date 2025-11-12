import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { 
  LayoutDashboard, 
  Mic, 
  Settings, 
  User, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Zap,
  BarChart3,
  FileText as Template,
  Clock,
  Play,
  Trash2,
  ClipboardCheck,
  Shield,
  Calendar,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/lib/i18n';
import { ROUTES } from '@/lib/constants';
import { useFeatureFlags } from '@/lib/featureFlags';
import { useCaseStore } from '@/stores/caseStore';
import { Badge } from '@/components/ui/badge';
import { ClinicSelectionModal } from '@/components/case/ClinicSelectionModal';
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
  hasSubmenu?: boolean;
  badgeCount?: number;
}

interface RecentCase {
  id: string;
  patientName: string;
  status: 'draft' | 'in_progress' | 'completed';
  progress: number;
  lastModified: string;
  sectionsCompleted: number;
  totalSections: number;
  createdAt: string;
}

export const PrimarySidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const { t } = useI18n();
  const featureFlags = useFeatureFlags();
  const { getRecentCases, deleteCase } = useCaseStore();
  
  const [showRecentCases, setShowRecentCases] = useState(false);
  const [recentCases, setRecentCases] = useState<RecentCase[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(false);
  const [isClinicModalOpen, setIsClinicModalOpen] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(2);

  const sidebarItems: SidebarItem[] = React.useMemo(() => [
    {
      id: 'dashboard',
      label: t('dashboard'),
      icon: LayoutDashboard,
      href: ROUTES.DASHBOARD,
    },
    // New Case and Recent Cases hidden from navigation
    // {
    //   id: 'new-case',
    //   label: t('newCase'),
    //   icon: Plus,
    //   href: ROUTES.NEW_CASE,
    //   hasSubmenu: featureFlags.caseManagement,
    // },
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
    // Voice commands and verbatim features hidden from navigation
    // ...(featureFlags.voiceCommands ? [{
    //   id: 'voice-commands',
    //   label: t('voiceCommands'),
    //   icon: MicIcon,
    //   href: ROUTES.VOICE_COMMANDS,
    // }] : []),
    // ...(featureFlags.verbatim ? [{
    //   id: 'verbatim',
    //   label: t('verbatim'),
    //   icon: Quote,
    //   href: ROUTES.VERBATIM,
    // }] : []),
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
      id: 'review-cases',
      label: 'Review Cases',
      icon: ClipboardCheck,
      href: ROUTES.REVIEW_CASES,
      badgeCount: pendingReviewCount,
    },
    {
      id: 'analytics',
      label: t('analytics'),
      icon: BarChart3,
      href: '/analytics',
    },
    {
      id: 'calendar',
      label: t('calendar'),
      icon: Calendar,
      href: '/calendar',
    },
    {
      id: 'admin',
      label: 'Administration',
      icon: Shield,
      href: ROUTES.ADMIN_DASHBOARD,
    },
    {
      id: 'audit-log',
      label: t('auditLog'),
      icon: FileText,
      href: '/audit-log',
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
  ], [pendingReviewCount, featureFlags.macros, t]);

  // Load recent cases when submenu is expanded
  useEffect(() => {
    if (showRecentCases && featureFlags.caseManagement && !sidebarCollapsed) {
      loadRecentCases();
    }
  }, [showRecentCases, featureFlags.caseManagement, sidebarCollapsed]);

  // Load pending review count
  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        // Mock count for now - replace with actual API call
        // const response = await apiFetch('/api/cases/pending-review/count');
        // setPendingReviewCount(response.count || 0);
        setPendingReviewCount(2);
      } catch (error) {
        console.error('Failed to load pending review count:', error);
      }
    };
    loadPendingCount();
    // Refresh count every 30 seconds
    const interval = setInterval(loadPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadRecentCases = async () => {
    setIsLoadingCases(true);
    try {
      const cases = await getRecentCases(5);
      
      // Transform API data to match our interface
      const transformedCases: RecentCase[] = cases.map((caseItem: any) => ({
        id: caseItem.id,
        patientName: caseItem.patientInfo?.name || generateCaseName(caseItem.created_at),
        status: caseItem.status || 'draft',
        progress: calculateProgress(caseItem.sections || {}),
        lastModified: caseItem.updated_at || caseItem.created_at,
        sectionsCompleted: countCompletedSections(caseItem.sections || {}),
        totalSections: 6, // CNESST sections
        createdAt: caseItem.created_at
      }));
      
      setRecentCases(transformedCases);
    } catch (error) {
      console.error('Failed to load recent cases:', error);
      setRecentCases([]);
    } finally {
      setIsLoadingCases(false);
    }
  };

  const generateCaseName = (createdAt: string): string => {
    const date = new Date(createdAt);
    return `Case ${date.toLocaleDateString('fr-CA')} ${date.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const calculateProgress = (sections: any): number => {
    const sectionIds = Object.keys(sections);
    if (sectionIds.length === 0) return 0;
    
    const completedSections = sectionIds.filter(id => 
      sections[id]?.status === 'completed'
    ).length;
    
    return Math.round((completedSections / 6) * 100);
  };

  const countCompletedSections = (sections: any): number => {
    const sectionIds = Object.keys(sections);
    return sectionIds.filter(id => 
      sections[id]?.status === 'completed'
    ).length;
  };

  const handleNewCase = () => {
    // Open clinic selection modal instead of directly creating case
    setIsClinicModalOpen(true);
  };

  const handleClinicSelected = async (clinic: any) => {
    try {
      // Generate client token for idempotency
      const clientToken = crypto.randomUUID();
      
      // Create new case with selected clinic
      const response = await apiFetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinic_id: clinic.id,
          client_token: clientToken,
          metadata: {
            language: 'fr'
          }
        }),
      });

      if (response.success) {
        const caseId = response.data.id;
        console.info("[NewCase] created", { caseId, clientToken });
        
        // Close modal first, then navigate exactly once
        setIsClinicModalOpen(false);
        navigate(`/case/new?caseId=${caseId}`);
      } else {
        console.error('Failed to create case:', response.error);
        alert('Erreur lors de la création du cas. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Error creating case:', error);
      alert('Erreur de connexion. Veuillez réessayer.');
    }
  };

  const handleResumeCase = (caseId: string) => {
    navigate(`${ROUTES.NEW_CASE}?caseId=${caseId}`);
  };

  const handleDeleteCase = async (caseId: string) => {
    if (confirm('Are you sure you want to delete this case?')) {
      try {
        const success = await deleteCase(caseId);
        if (success) {
          setRecentCases(prev => prev.filter(c => c.id !== caseId));
        }
      } catch (error) {
        console.error('Failed to delete case:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-CA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleItemClick = (href: string) => {
    navigate(href);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const renderSidebarItem = (item: SidebarItem) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    // Special handling for New Case with submenu
    if (item.id === 'new-case' && item.hasSubmenu && !sidebarCollapsed) {
      return (
        <div key={item.id} className="space-y-1">
          {/* Main New Case Button */}
          <Button
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              'w-full justify-start gap-3 h-10',
              isActive && 'bg-blue-500 text-white hover:bg-blue-600',
              !isActive && 'hover:bg-[#007a2e] text-white'
            )}
            onClick={handleNewCase}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </Button>

          {/* Recent Cases Submenu */}
          <div className="ml-4 space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 h-8 text-xs text-white hover:bg-[#007a2e]"
              onClick={() => setShowRecentCases(!showRecentCases)}
            >
              <Clock className="h-3 w-3" />
              <span>Recent Cases</span>
              {showRecentCases ? (
                <ChevronUp className="h-3 w-3 ml-auto" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-auto" />
              )}
            </Button>

            {/* Recent Cases List */}
            {showRecentCases && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {isLoadingCases ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  </div>
                ) : recentCases.length === 0 ? (
                  <div className="text-center py-2 text-white/70 text-xs">
                    No recent cases
                  </div>
                ) : (
                  recentCases.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="border border-white/20 rounded p-2 hover:bg-[#007a2e] transition-colors cursor-pointer bg-[#009639]"
                      onClick={() => handleResumeCase(caseItem.id)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate text-white">{caseItem.patientName}</p>
                          <p className="text-xs text-white/70">{formatDate(caseItem.lastModified)}</p>
                        </div>
                        <Badge className={`text-xs ${
                          caseItem.status === 'completed' ? 'bg-green-600 text-white' :
                          caseItem.status === 'in_progress' ? 'bg-blue-500 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {caseItem.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-white/80 mb-1">
                          <span>Progress</span>
                          <span>{caseItem.sectionsCompleted}/{caseItem.totalSections}</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-1">
                          <div
                            className="bg-white h-1 rounded-full transition-all duration-300"
                            style={{ width: `${caseItem.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResumeCase(caseItem.id);
                          }}
                          className="flex-1 text-xs h-5 border-white/30 text-white hover:bg-white/10"
                        >
                          <Play className="h-2 w-2 mr-1" />
                          Resume
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCase(caseItem.id);
                          }}
                          className="text-xs h-5 border-red-400/50 text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-2 w-2" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Regular sidebar item
    const itemContent = (
      <Button
        variant={isActive ? 'default' : 'ghost'}
        size="sm"
        className={cn(
          'w-full justify-start gap-3 h-10 relative',
          isActive && 'bg-blue-500 text-white hover:bg-blue-600',
          !isActive && 'hover:bg-[#007a2e] text-white'
        )}
        onClick={() => handleItemClick(item.href)}
        aria-current={isActive ? 'page' : undefined}
        aria-label={sidebarCollapsed ? item.label : undefined}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!sidebarCollapsed && (
          <>
            <span className="truncate flex-1">{item.label}</span>
            {item.badgeCount !== undefined && item.badgeCount > 0 && (
              <Badge className="ml-auto bg-red-600 text-white text-xs min-w-[20px] h-5 flex items-center justify-center px-1.5">
                {item.badgeCount}
              </Badge>
            )}
          </>
        )}
        {sidebarCollapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full">
            {item.badgeCount}
          </Badge>
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
        'flex flex-col bg-[#009639] border-r border-[#007a2e] transition-all duration-300 ease-in-out h-full',
        sidebarCollapsed ? 'w-20' : 'w-70'
      )}
      style={{
        width: sidebarCollapsed ? '80px' : '280px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#007a2e]">
        {!sidebarCollapsed && (
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(ROUTES.DASHBOARD);
              }
            }}
            aria-label="Go to Dashboard"
          >
            <Mic className="h-6 w-6 text-white" />
            <h1 className="text-lg font-bold text-white">techemd</h1>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="h-8 w-8 p-0 hover:bg-[#007a2e] text-white"
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

      {/* Navigation Items - Scrollable */}
      <div className="flex-1 flex flex-col p-2 space-y-1 overflow-y-auto">
        {/* Top items */}
        <div className="space-y-1">
          {sidebarItems
            .filter((item) => !item.isBottom)
            .map(renderSidebarItem)}
        </div>
      </div>

      {/* Bottom items - Fixed at bottom */}
      <div className="p-2 space-y-1 border-t border-[#007a2e] bg-[#009639] flex-shrink-0">
        {sidebarItems
          .filter((item) => item.isBottom)
          .map(renderSidebarItem)}
      </div>

      {/* Clinic Selection Modal */}
      <ClinicSelectionModal
        isOpen={isClinicModalOpen}
        onClose={() => setIsClinicModalOpen(false)}
        onSelectClinic={handleClinicSelected}
        title="Sélectionner votre clinique"
        description="Choisissez la clinique où vous travaillez aujourd'hui pour créer un nouveau cas"
      />
    </div>
  );
};
