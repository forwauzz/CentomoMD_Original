import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Settings,
  FileText,
  CheckCircle,
  Star,
  Zap,
  Shield,
  Layers,
  Globe,
  BarChart3,
  Save,
  X,
  Grid,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { TemplateConfig } from '@/config/template-config';
import { useTemplates } from '@/contexts/TemplateContext';
import { useUIStore } from '@/stores/uiStore';

interface TemplateCombinationManagementProps {
  // Add any props if needed
}

export const TemplateCombinationManagement: React.FC<TemplateCombinationManagementProps> = () => {
  const { templates, updateTemplate, deleteTemplate, loading, error } = useTemplates();
  const { language } = useUIStore();
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateConfig[]>(templates);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<'all' | '7' | '8' | '11'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'formatter' | 'ai-formatter' | 'template-combo'>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Partial<TemplateConfig>>({});

  // Filter templates when search or filters change
  useEffect(() => {
    let filtered = templates;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.nameFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Section filter
    if (selectedSection !== 'all') {
      filtered = filtered.filter(template => template.compatibleSections.includes(selectedSection));
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(template => template.type === selectedType);
    }

    // Complexity filter
    if (selectedComplexity !== 'all') {
      filtered = filtered.filter(template => template.complexity === selectedComplexity);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, selectedSection, selectedType, selectedComplexity]);

  const handleEditTemplate = (template: TemplateConfig) => {
    setSelectedTemplate(template);
    setEditingTemplate({ ...template });
    setShowEditModal(true);
  };

  const handleSaveTemplate = async () => {
    if (selectedTemplate && editingTemplate.id) {
      const success = await updateTemplate(editingTemplate.id, editingTemplate);
      if (success) {
        setShowEditModal(false);
        setSelectedTemplate(null);
        setEditingTemplate({});
      }
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(templateId);
    }
  };

  const handleToggleActive = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      await updateTemplate(templateId, { isActive: !template.isActive });
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'formatter': return 'bg-blue-100 text-blue-800';
      case 'ai-formatter': return 'bg-purple-100 text-purple-800';
      case 'template-combo': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'verbatimSupport': return <Shield className="w-4 h-4" />;
      case 'voiceCommandsSupport': return <Zap className="w-4 h-4" />;
      case 'aiFormatting': return <Layers className="w-4 h-4" />;
      case 'postProcessing': return <Settings className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600 mt-2">Manage templates, names, descriptions, and prompts</p>
        </div>
        <Button onClick={() => setShowEditModal(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Template</span>
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-blue-700">Loading templates...</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select 
              value={selectedSection} 
              onValueChange={(value: any) => setSelectedSection(value)}
              items={[
                { label: 'All Sections', value: 'all' },
                { label: 'Section 7', value: '7' },
                { label: 'Section 8', value: '8' },
                { label: 'Section 11', value: '11' }
              ]}
            />

            <Select 
              value={selectedType} 
              onValueChange={(value: any) => setSelectedType(value)}
              items={[
                { label: 'All Types', value: 'all' },
                { label: 'Formatter', value: 'formatter' },
                { label: 'AI Formatter', value: 'ai-formatter' },
                { label: 'Template Combo', value: 'template-combo' }
              ]}
            />

            <Select 
              value={selectedComplexity} 
              onValueChange={(value: any) => setSelectedComplexity(value)}
              items={[
                { label: 'All Complexities', value: 'all' },
                { label: 'Low', value: 'low' },
                { label: 'Medium', value: 'medium' },
                { label: 'High', value: 'high' }
              ]}
            />

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid/List */}
      <div className={cn(
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
      )}>
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {language === 'fr' ? template.nameFr : template.name}
                  </CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={template.isActive}
                    onCheckedChange={() => handleToggleActive(template.id)}
                  />
                  {template.isDefault && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Description */}
              <p className="text-sm text-gray-700 line-clamp-3">
                {language === 'fr' ? template.descriptionFr : template.description}
              </p>

              {/* Tags and Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge className={getTypeColor(template.type)}>
                  {template.type}
                </Badge>
                <Badge className={getComplexityColor(template.complexity)}>
                  {template.complexity}
                </Badge>
                <Badge variant="outline">
                  Sections {template.compatibleSections.map(s => s.replace('section_', '')).join(', ')}
                </Badge>
                <Badge variant="outline">
                  <Globe className="w-3 h-3 mr-1" />
                  {template.language}
                </Badge>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-500">Features</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(template.features).map(([feature, enabled]) => (
                    <div
                      key={feature}
                      className={cn(
                        "flex items-center space-x-1 px-2 py-1 rounded text-xs",
                        enabled 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {getFeatureIcon(feature)}
                      <span className="capitalize">
                        {feature.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <BarChart3 className="w-4 h-4" />
                  <span>{template.usage.count} uses</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>{template.usage.successRate}% success</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowPreviewModal(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
                {!template.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Edit Template</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList>
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="prompts">Prompts</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name (English)</Label>
                    <Input
                      id="name"
                      value={editingTemplate.name || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nameFr">Name (French)</Label>
                    <Input
                      id="nameFr"
                      value={editingTemplate.nameFr || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, nameFr: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description (English)</Label>
                  <Textarea
                    id="description"
                    value={editingTemplate.description || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="descriptionFr">Description (French)</Label>
                  <Textarea
                    id="descriptionFr"
                    value={editingTemplate.descriptionFr || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, descriptionFr: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="section">Section</Label>
                    <Select
                      value={editingTemplate.compatibleSections?.[0] || 'section_7'}
                      onValueChange={(value: any) => setEditingTemplate({ 
                        ...editingTemplate, 
                        compatibleSections: [value] 
                      })}
                      items={[
                        { label: 'Section 7', value: 'section_7' },
                        { label: 'Section 8', value: 'section_8' },
                        { label: 'Section 11', value: 'section_11' },
                        { label: 'All Sections', value: 'all' }
                      ]}
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={editingTemplate.type || 'formatter'}
                      onValueChange={(value: any) => setEditingTemplate({ ...editingTemplate, type: value })}
                      items={[
                        { label: 'Formatter', value: 'formatter' },
                        { label: 'AI Formatter', value: 'ai-formatter' },
                        { label: 'Template Combo', value: 'template-combo' }
                      ]}
                    />
                  </div>

                  <div>
                    <Label htmlFor="complexity">Complexity</Label>
                    <Select
                      value={editingTemplate.complexity || 'low'}
                      onValueChange={(value: any) => setEditingTemplate({ ...editingTemplate, complexity: value })}
                      items={[
                        { label: 'Low', value: 'low' },
                        { label: 'Medium', value: 'medium' },
                        { label: 'High', value: 'high' }
                      ]}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="prompts" className="space-y-4">
                <div>
                  <Label htmlFor="prompt">AI Prompt (English)</Label>
                  <Textarea
                    id="prompt"
                    value={editingTemplate.prompt || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, prompt: e.target.value })}
                    rows={6}
                    placeholder="Enter the AI formatting prompt..."
                  />
                </div>

                <div>
                  <Label htmlFor="promptFr">AI Prompt (French)</Label>
                  <Textarea
                    id="promptFr"
                    value={editingTemplate.promptFr || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, promptFr: e.target.value })}
                    rows={6}
                    placeholder="Entrez le prompt de formatage IA..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <div className="space-y-4">
                  <Label className="text-base font-medium">Feature Toggles</Label>
                  {Object.entries(editingTemplate.features || {}).map(([feature, enabled]) => (
                    <div key={feature} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getFeatureIcon(feature)}
                        <div>
                          <div className="font-medium capitalize">
                            {feature.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {feature === 'verbatimSupport' && 'Preserve exact quotes and specific text'}
                            {feature === 'voiceCommandsSupport' && 'Process voice commands during dictation'}
                            {feature === 'aiFormatting' && 'Apply AI-powered formatting'}
                            {feature === 'postProcessing' && 'Apply post-processing corrections'}
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => 
                          setEditingTemplate({
                            ...editingTemplate,
                            features: {
                              verbatimSupport: editingTemplate.features?.verbatimSupport || false,
                              voiceCommandsSupport: editingTemplate.features?.voiceCommandsSupport || false,
                              aiFormatting: editingTemplate.features?.aiFormatting || false,
                              postProcessing: editingTemplate.features?.postProcessing || false,
                              [feature]: checked
                            }
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="config" className="space-y-4">
                <div className="space-y-4">
                  <Label className="text-base font-medium">Configuration Settings</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="mode">Mode</Label>
                      <Input
                        id="mode"
                        value={editingTemplate.config?.mode || ''}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          config: { ...editingTemplate.config, mode: e.target.value }
                        })}
                        placeholder="e.g., mode2, word-for-word"
                      />
                    </div>

                    <div>
                      <Label htmlFor="templateCombo">Template Combo</Label>
                      <Input
                        id="templateCombo"
                        value={editingTemplate.config?.templateCombo || ''}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          config: { ...editingTemplate.config, templateCombo: e.target.value }
                        })}
                        placeholder="e.g., SECTION_7_TEMPLATE_VERBATIM"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Enforce Worker First</div>
                        <div className="text-sm text-gray-500">Prioritize worker perspective in narrative</div>
                      </div>
                      <Switch
                        checked={editingTemplate.config?.enforceWorkerFirst || false}
                        onCheckedChange={(checked) => 
                          setEditingTemplate({
                            ...editingTemplate,
                            config: { ...editingTemplate.config, enforceWorkerFirst: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Chronological Order</div>
                        <div className="text-sm text-gray-500">Maintain chronological sequence</div>
                      </div>
                      <Switch
                        checked={editingTemplate.config?.chronologicalOrder || false}
                        onCheckedChange={(checked) => 
                          setEditingTemplate({
                            ...editingTemplate,
                            config: { ...editingTemplate.config, chronologicalOrder: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Medical Terminology</div>
                        <div className="text-sm text-gray-500">Preserve medical terms exactly</div>
                      </div>
                      <Switch
                        checked={editingTemplate.config?.medicalTerminology || false}
                        onCheckedChange={(checked) => 
                          setEditingTemplate({
                            ...editingTemplate,
                            config: { ...editingTemplate.config, medicalTerminology: checked }
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Template Preview</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreviewModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Template Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">English</h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm text-gray-700">{selectedTemplate.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm text-gray-700">{selectedTemplate.description}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">AI Prompt</Label>
                      <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                        {selectedTemplate.prompt || 'No prompt defined'}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">French</h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm text-gray-700">{selectedTemplate.nameFr}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm text-gray-700">{selectedTemplate.descriptionFr}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">AI Prompt</Label>
                      <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                        {selectedTemplate.promptFr || 'No prompt defined'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Configuration</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <pre className="text-sm font-mono overflow-x-auto">
                    {JSON.stringify(selectedTemplate.config, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
