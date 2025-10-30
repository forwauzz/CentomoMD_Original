import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Play, 
  Copy, 
  Trash2, 
  Search, 
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Circle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/lib/constants';
import { useCaseStore } from '@/stores/caseStore';
import { useFeatureFlags } from '@/lib/featureFlags';

interface RecentCase {
  id: string;
  patientName: string;
  status: 'draft' | 'in_progress' | 'completed';
  progress: number; // 0-100
  lastModified: string;
  sectionsCompleted: number;
  totalSections: number;
  createdAt: string;
}

export const RecentCasesCard: React.FC = () => {
  const navigate = useNavigate();
  const { createNewCase, getRecentCases, deleteCase } = useCaseStore();
  const featureFlags = useFeatureFlags();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'in_progress' | 'completed'>('all');
  const [recentCases, setRecentCases] = useState<RecentCase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [caseCount, setCaseCount] = useState<number>(0);

  // Mock data for demonstration - in real implementation, this would come from the API
  const mockCases: RecentCase[] = [
    {
      id: 'case-001',
      patientName: 'Jean Dupont',
      status: 'in_progress',
      progress: 65,
      lastModified: '2024-01-15T10:30:00Z',
      sectionsCompleted: 4,
      totalSections: 6,
      createdAt: '2024-01-15T09:00:00Z'
    },
    {
      id: 'case-002',
      patientName: 'Marie Tremblay',
      status: 'completed',
      progress: 100,
      lastModified: '2024-01-14T16:45:00Z',
      sectionsCompleted: 6,
      totalSections: 6,
      createdAt: '2024-01-14T14:00:00Z'
    },
    {
      id: 'case-003',
      patientName: 'Pierre Gagnon',
      status: 'draft',
      progress: 20,
      lastModified: '2024-01-13T11:20:00Z',
      sectionsCompleted: 1,
      totalSections: 6,
      createdAt: '2024-01-13T10:30:00Z'
    }
  ];

  useEffect(() => {
    if (isExpanded && featureFlags.caseManagement) {
      loadRecentCases();
    }
  }, [isExpanded, featureFlags.caseManagement]);

  // Load a lightweight count on mount so the header can show total
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!featureFlags.caseManagement) return;
      try {
        const cases = await getRecentCases(10);
        if (!mounted) return;
        setCaseCount(Array.isArray(cases) ? cases.length : 0);
      } catch {
        if (!mounted) return;
        setCaseCount(mockCases.length);
      }
    })();
    return () => { mounted = false; };
  }, [featureFlags.caseManagement, getRecentCases]);

  const loadRecentCases = async () => {
    setIsLoading(true);
    try {
      const cases = await getRecentCases(10);
      
      // Transform API data to match our interface
      const transformedCases: RecentCase[] = cases.map((caseItem: any) => ({
        id: caseItem.id,
        patientName: caseItem.patientInfo?.name || 'Unnamed Patient',
        status: caseItem.status || 'draft',
        progress: calculateProgress(caseItem.sections || {}),
        lastModified: caseItem.updated_at || caseItem.created_at,
        sectionsCompleted: countCompletedSections(caseItem.sections || {}),
        totalSections: 6, // CNESST sections
        createdAt: caseItem.created_at
      }));
      
      setRecentCases(transformedCases);
      setCaseCount(transformedCases.length);
    } catch (error) {
      console.error('Failed to load recent cases:', error);
      // Fallback to mock data for demonstration
      setRecentCases(mockCases);
      setCaseCount(mockCases.length);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgress = (sections: any): number => {
    const sectionIds = Object.keys(sections);
    if (sectionIds.length === 0) return 0;
    
    const completedSections = sectionIds.filter(id => 
      sections[id]?.status === 'completed'
    ).length;
    
    return Math.round((completedSections / 6) * 100); // 6 total CNESST sections
  };

  const countCompletedSections = (sections: any): number => {
    const sectionIds = Object.keys(sections);
    return sectionIds.filter(id => 
      sections[id]?.status === 'completed'
    ).length;
  };

  const filteredCases = recentCases.filter(caseItem => {
    const matchesSearch = caseItem.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || caseItem.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'draft':
        return <Circle className="h-4 w-4 text-gray-400" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      draft: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={`text-xs ${variants[status as keyof typeof variants]}`}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const handleResumeCase = (caseId: string) => {
    navigate(`${ROUTES.NEW_CASE}?caseId=${caseId}`);
  };

  const handleDuplicateCase = async (caseId: string) => {
    try {
      const newCaseId = await createNewCase();
      // TODO: Copy case data from original case
      console.log('Duplicated case:', caseId, 'to:', newCaseId);
    } catch (error) {
      console.error('Failed to duplicate case:', error);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (confirm('Are you sure you want to delete this case?')) {
      try {
        const success = await deleteCase(caseId);
        if (success) {
          // Remove from local state
          setRecentCases(prev => prev.filter(c => c.id !== caseId));
          console.log('✅ Case deleted successfully');
        }
      } catch (error) {
        console.error('❌ Failed to delete case:', error);
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

  if (!featureFlags.caseManagement) {
    return null;
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <span>Recent Cases</span>
            <Badge variant="secondary" className="text-xs">{caseCount}</Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              {(['all', 'draft', 'in_progress', 'completed'] as const).map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className="text-xs"
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>

          {/* Cases List */}
          <div className="space-y-2 max-h-[28rem] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No cases found</p>
              </div>
            ) : (
              filteredCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2">
                      {getStatusIcon(caseItem.status)}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{caseItem.patientName}</p>
                        <p className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(caseItem.lastModified)}
                        </p>
                      </div>
                    </div>
                    <div className="sm:self-start">{getStatusBadge(caseItem.status)}</div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{caseItem.sectionsCompleted}/{caseItem.totalSections} sections</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${caseItem.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResumeCase(caseItem.id)}
                      className="w-full sm:flex-1 text-xs"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Resume
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDuplicateCase(caseItem.id)}
                      className="text-xs"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCase(caseItem.id)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
