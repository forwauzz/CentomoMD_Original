import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { API_CONFIG } from '@/lib/constants';
import { 
  Plus, 
  Search, 
  // Filter, 
  Grid, 
  List, 
  Edit, 
  Trash2, 
  Eye,
  FileText,
  // Tag,
  // Zap,
  Clock,
  // Star,
  Download,
  Upload,
  BarChart3,
  // History,
  Settings,
  // CheckSquare,
  // Square,
  // MoreHorizontal,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react';
import { TemplateJSON } from '@/components/transcription/TemplateDropdown';
import { TemplateModal } from '@/components/templates/TemplateModal';
import { TemplatePreview } from '@/components/transcription/TemplatePreview';

interface TemplateAnalytics {
  total_usage: number;
  average_performance: number;
  usage_by_section: Record<string, number>;
  usage_by_language: Record<string, number>;
  recent_usage: Array<{
    templateId: string;
    section: string;
    language: string;
    used_at: string;
    performance_rating?: number;
  }>;
  top_templates: Array<{ id: string; title: string; usage_count: number }>;
}

// interface TemplateVersion {
//   id: string;
//   templateId: string;
//   version: string;
//   content: string;
//   changes: string[];
//   created_at: string;
// }

interface TemplateManagementProps {
  // Add any props if needed
}

export const TemplateManagement: React.FC<TemplateManagementProps> = () => {
  const [templates, setTemplates] = useState<TemplateJSON[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateJSON[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<'all' | '7' | '8' | '11'>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'fr' | 'en'>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive' | 'draft'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateJSON | null>(null);
  
  // Advanced features state
  const [analytics, setAnalytics] = useState<TemplateAnalytics | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'none' | 'status' | 'delete'>('none');
  const [bulkStatus, setBulkStatus] = useState<'active' | 'inactive' | 'draft'>('active');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearchCriteria, setAdvancedSearchCriteria] = useState({
    section: '',
    language: '',
    complexity: '',
    tags: [] as string[],
    query: '',
    status: '',
    is_default: undefined as boolean | undefined
  });

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
    loadAnalytics();
  }, []);

  // Filter templates when search or filters change
  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, selectedSection, selectedLanguage, selectedComplexity, selectedStatus]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      console.log('Loading templates...');
      // Load templates from all sections
      const sections = ['7', '8', '11'];
      const allTemplates: TemplateJSON[] = [];

      for (const section of sections) {
        console.log('Loading templates for section:', section);
        try {
          const result = await apiFetch(`/api/templates/${section}`);
          console.log('Templates for section', section, ':', result.data?.length || 0);
          if (result.success && result.data) {
            allTemplates.push(...result.data);
          }
        } catch (error) {
          console.error(`Error loading section ${section}:`, error);
        }
      }

      console.log('Total templates loaded:', allTemplates.length);
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const result = await apiFetch('/api/templates/analytics');
      if (result.success) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply section filter
    if (selectedSection !== 'all') {
      filtered = filtered.filter(template => template.section === selectedSection);
    }

    // Apply language filter
    if (selectedLanguage !== 'all') {
      filtered = filtered.filter(template => template.language === selectedLanguage);
    }

    // Apply complexity filter
    if (selectedComplexity !== 'all') {
      filtered = filtered.filter(template => template.complexity === selectedComplexity);
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(template => template.status === selectedStatus);
    }

    setFilteredTemplates(filtered);
  };

  const performAdvancedSearch = async () => {
    try {
      const result = await apiFetch('/api/templates/search', {
        method: 'POST',
        body: JSON.stringify(advancedSearchCriteria),
      });

      if (result.success) {
        setFilteredTemplates(result.data);
      }
    } catch (error) {
      console.error('Error performing advanced search:', error);
    }
  };

  const handleCreateTemplate = () => {
    setShowCreateModal(true);
  };

  const handleEditTemplate = (template: TemplateJSON) => {
    setSelectedTemplate(template);
    setShowEditModal(true);
  };

  const handlePreviewTemplate = (template: TemplateJSON) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  const handleSaveTemplate = async (template: TemplateJSON) => {
    try {
      console.log('Saving template:', template);
      
      const url = template.id?.startsWith('template_') 
        ? `${API_CONFIG.BASE_URL}/api/templates` 
        : `${API_CONFIG.BASE_URL}/api/templates/${template.id}`;
      
      const method = template.id?.startsWith('template_') ? 'POST' : 'PUT';
      
      console.log('Making request to:', url, 'with method:', method);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Response result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save template');
      }

      console.log('Template saved successfully:', result.message);
      await loadTemplates(); // Reload templates
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  };

  const handleDeleteTemplate = async (template: TemplateJSON) => {
    if (window.confirm(`Are you sure you want to delete "${template.title}"?`)) {
      try {
        const result = await apiFetch(`/api/templates/${template.id}?section=${template.section}`, {
          method: 'DELETE',
        });
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete template');
        }

        console.log('Template deleted successfully:', result.message);
        await loadTemplates(); // Reload templates
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Failed to delete template. Please try again.');
      }
    }
  };

  const handleExportTemplates = async () => {
    try {
      const result = await apiFetch(`/api/templates/export${selectedSection !== 'all' ? `?section=${selectedSection}` : ''}`);
      if (result.success) {
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `templates_export_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting templates:', error);
      alert('Failed to export templates. Please try again.');
    }
  };

  const handleImportTemplates = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const templates = JSON.parse(text);
          
          const result = await apiFetch('/api/templates/import', {
            method: 'POST',
            body: JSON.stringify({ templates }),
          });

          if (result.success) {
            alert(result.message);
            await loadTemplates();
          }
        } catch (error) {
          console.error('Error importing templates:', error);
          alert('Failed to import templates. Please check the file format.');
        }
      }
    };
    input.click();
  };

  const handleBulkAction = async () => {
    if (selectedVersions.length === 0) {
      alert('Please select templates to perform bulk action.');
      return;
    }

    if (bulkAction === 'status') {
      try {
        const result = await apiFetch('/api/templates/bulk/status', {
          method: 'POST',
          body: JSON.stringify({
            templateIds: selectedVersions,
            status: bulkStatus
          }),
        });

        if (result.success) {
          alert(result.message);
          setSelectedVersions([]);
          await loadTemplates();
        }
      } catch (error) {
        console.error('Error performing bulk status update:', error);
        alert('Failed to update templates. Please try again.');
      }
    } else if (bulkAction === 'delete') {
      if (window.confirm(`Are you sure you want to delete ${selectedVersions.length} templates?`)) {
        try {
          const result = await apiFetch('/api/templates/bulk/delete', {
            method: 'POST',
            body: JSON.stringify({
              templateIds: selectedVersions
            }),
          });

          if (result.success) {
            alert(result.message);
            setSelectedVersions([]);
            await loadTemplates();
          }
        } catch (error) {
          console.error('Error performing bulk delete:', error);
          alert('Failed to delete templates. Please try again.');
        }
      }
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedVersions(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleSelectAll = () => {
    if (selectedVersions.length === filteredTemplates.length) {
      setSelectedVersions([]);
    } else {
      setSelectedVersions(filteredTemplates.map(t => t.id!));
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSectionColor = (section: string) => {
    switch (section) {
      case '7': return 'bg-blue-100 text-blue-800';
      case '8': return 'bg-purple-100 text-purple-800';
      case '11': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Template Management</h1>
          <p className="text-gray-600 mt-2">
            Manage and organize your CNESST report templates
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleImportTemplates}
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleExportTemplates}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button
            onClick={handleCreateTemplate}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Create Template</span>
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && analytics && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Template Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-blue-600">Total Usage</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{analytics.total_usage}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-600">Avg Performance</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{analytics.average_performance.toFixed(1)}%</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="text-sm text-purple-600">Active Templates</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">{templates.filter(t => t.status === 'active').length}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span className="text-sm text-orange-600">Recent Usage</span>
                </div>
                <p className="text-2xl font-bold text-orange-900">{analytics.recent_usage.length}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Top Templates</h4>
                <div className="space-y-2">
                  {analytics.top_templates.slice(0, 5).map((template, index) => (
                    <div key={template.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{index + 1}. {template.title}</span>
                      <Badge variant="secondary">{template.usage_count} uses</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Usage by Section</h4>
                <div className="space-y-2">
                  {Object.entries(analytics.usage_by_section).map(([section, count]) => (
                    <div key={section} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Section {section}</span>
                      <Badge variant="secondary">{count} uses</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Section Filter */}
            <div>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sections</option>
                <option value="7">Section 7</option>
                <option value="8">Section 8</option>
                <option value="11">Section 11</option>
              </select>
            </div>

            {/* Language Filter */}
            <div>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Languages</option>
                <option value="fr">French</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* Complexity Filter */}
            <div>
              <select
                value={selectedComplexity}
                onChange={(e) => setSelectedComplexity(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Complexities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Advanced Search Toggle */}
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Advanced Search</span>
            </Button>
          </div>

          {/* Advanced Search Panel */}
          {showAdvancedSearch && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Search query..."
                  value={advancedSearchCriteria.query}
                  onChange={(e) => setAdvancedSearchCriteria(prev => ({ ...prev, query: e.target.value }))}
                />
                <Input
                  placeholder="Tags (comma-separated)"
                  value={advancedSearchCriteria.tags.join(', ')}
                  onChange={(e) => setAdvancedSearchCriteria(prev => ({ 
                    ...prev, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  }))}
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={advancedSearchCriteria.is_default}
                    onChange={(e) => setAdvancedSearchCriteria(prev => ({ 
                      ...prev, 
                      is_default: e.target.checked ? true : undefined
                    }))}
                  />
                  <label htmlFor="is_default" className="text-sm">Default templates only</label>
                </div>
              </div>
              <div className="mt-3">
                <Button onClick={performAdvancedSearch} size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Operations */}
      {selectedVersions.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {selectedVersions.length} template(s) selected
                </span>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value as any)}
                  className="p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="none">Select Action</option>
                  <option value="status">Update Status</option>
                  <option value="delete">Delete</option>
                </select>
                {bulkAction === 'status' && (
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value as any)}
                    className="p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                )}
                <Button onClick={handleBulkAction} size="sm" variant="destructive">
                  Apply
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedVersions([])}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Templates</p>
                <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Section 7</p>
                <p className="text-2xl font-bold text-blue-600">
                  {templates.filter(t => t.section === '7').length}
                </p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">7</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Section 8</p>
                <p className="text-2xl font-bold text-purple-600">
                  {templates.filter(t => t.section === '8').length}
                </p>
              </div>
              <Badge className="bg-purple-100 text-purple-800">8</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Section 11</p>
                <p className="text-2xl font-bold text-orange-600">
                  {templates.filter(t => t.section === '11').length}
                </p>
              </div>
              <Badge className="bg-orange-100 text-orange-800">11</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {templates.filter(t => t.status === 'active').length}
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        checked={selectedVersions.includes(template.id!)}
                        onChange={() => handleSelectTemplate(template.id!)}
                        className="rounded"
                      />
                      <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {template.title}
                      </CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSectionColor(template.section)}>
                        Section {template.section}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.language}
                      </Badge>
                      <Badge className={`text-xs ${getComplexityColor(template.complexity || 'medium')}`}>
                        {template.complexity}
                      </Badge>
                      {template.status && (
                        <Badge className={`text-xs ${getStatusColor(template.status)}`}>
                          {template.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreviewTemplate(template)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                  {template.content}
                </p>
                {template.tags && template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.tags.slice(0, 3).map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{template.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{template.category || 'General'}</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{template.usage_count || 0} uses</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* List Header */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              checked={selectedVersions.length === filteredTemplates.length && filteredTemplates.length > 0}
              onChange={handleSelectAll}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-600">Select All</span>
          </div>
          
          {filteredTemplates.map((template, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <input
                        type="checkbox"
                        checked={selectedVersions.includes(template.id!)}
                        onChange={() => handleSelectTemplate(template.id!)}
                        className="rounded"
                      />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.title}
                      </h3>
                      <Badge className={getSectionColor(template.section)}>
                        Section {template.section}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.language}
                      </Badge>
                      <Badge className={`text-xs ${getComplexityColor(template.complexity || 'medium')}`}>
                        {template.complexity}
                      </Badge>
                      {template.status && (
                        <Badge className={`text-xs ${getStatusColor(template.status)}`}>
                          {template.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {template.content}
                    </p>
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredTemplates.length === 0 && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedSection !== 'all' || selectedLanguage !== 'all' || selectedComplexity !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first template.'}
            </p>
            <Button onClick={handleCreateTemplate} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <TemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleSaveTemplate}
        mode="create"
      />

      <TemplateModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveTemplate}
        template={selectedTemplate}
        mode="edit"
      />

      {selectedTemplate && (
        <TemplatePreview
          template={selectedTemplate}
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          onSelect={(_template) => {
            setShowPreviewModal(false);
            // Handle template selection if needed
          }}
          currentSection={selectedTemplate.section}
          currentLanguage={selectedTemplate.language === 'fr' ? 'fr-CA' : 'en-US'}
        />
      )}
    </div>
  );
};
