import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Edit, 
  Trash2, 
  Eye,
  FileText,
  Tag,
  Zap,
  Clock,
  Star,
  Download,
  Upload
} from 'lucide-react';
import { TemplateJSON } from '@/components/transcription/TemplateDropdown';
import { TemplateModal } from '@/components/templates/TemplateModal';
import { TemplatePreview } from '@/components/transcription/TemplatePreview';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateJSON | null>(null);

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Filter templates when search or filters change
  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, selectedSection, selectedLanguage, selectedComplexity]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      console.log('Loading templates...');
      // Load templates from all sections
      const sections = ['7', '8', '11'];
      const allTemplates: TemplateJSON[] = [];

      for (const section of sections) {
        console.log('Loading templates for section:', section);
        const response = await fetch(`http://localhost:3001/api/templates/${section}`);
        console.log('Response for section', section, ':', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('Templates for section', section, ':', result.data?.length || 0);
          if (result.success && result.data) {
            allTemplates.push(...result.data);
          }
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

    setFilteredTemplates(filtered);
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
        ? `http://localhost:3001/api/templates` 
        : `http://localhost:3001/api/templates/${template.id}`;
      
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
        const response = await fetch(`http://localhost:3001/api/templates/${template.id}?section=${template.section}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
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

  const handleExportTemplates = () => {
    // TODO: Implement export functionality
    console.log('Exporting templates...');
  };

  const handleImportTemplates = () => {
    // TODO: Implement import functionality
    console.log('Importing templates...');
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

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
      </div>

      {/* Templates Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {template.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getSectionColor(template.section)}>
                        Section {template.section}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.language}
                      </Badge>
                      <Badge className={`text-xs ${getComplexityColor(template.complexity)}`}>
                        {template.complexity}
                      </Badge>
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
                    <span>Updated recently</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTemplates.map((template, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.title}
                      </h3>
                      <Badge className={getSectionColor(template.section)}>
                        Section {template.section}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.language}
                      </Badge>
                      <Badge className={`text-xs ${getComplexityColor(template.complexity)}`}>
                        {template.complexity}
                      </Badge>
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
           onSelect={(template) => {
             setShowPreviewModal(false);
             // Handle template selection if needed
           }}
           currentSection={selectedTemplate.section}
           currentLanguage={selectedTemplate.language}
         />
       )}
    </div>
  );
};
