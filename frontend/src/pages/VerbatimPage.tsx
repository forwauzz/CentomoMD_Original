import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Quote, 
  Save, 
  X,
  Play,
  Pause,
  Copy
} from 'lucide-react';
// import { useI18n } from '@/lib/i18n'; // TODO: Implement i18n when needed

interface VerbatimTemplate {
  id: string;
  name: string;
  startMarker: string;
  endMarker: string;
  description: string;
  category: 'patient' | 'radiologist' | 'doctor' | 'custom';
  isActive: boolean;
  example?: string;
}

export const VerbatimPage: React.FC = () => {
  // const { t } = useI18n(); // TODO: Implement i18n when needed
  const [templates, setTemplates] = useState<VerbatimTemplate[]>([
    {
      id: '1',
      name: 'Patient Quote',
      startMarker: '___VERBATIM_START___',
      endMarker: '___VERBATIM_END___',
      description: 'Standard patient quote markers',
      category: 'patient',
      isActive: true,
      example: 'The patient said ___VERBATIM_START___ I have severe pain ___VERBATIM_END___ and continued...',
    },
    {
      id: '2',
      name: 'Radiology Report',
      startMarker: '___RADIOLOGY_START___',
      endMarker: '___RADIOLOGY_END___',
      description: 'Radiology report verbatim markers',
      category: 'radiologist',
      isActive: true,
      example: 'The scan shows ___RADIOLOGY_START___ normal findings ___RADIOLOGY_END___ with no abnormalities.',
    },
    {
      id: '3',
      name: 'Doctor Notes',
      startMarker: '___DOCTOR_START___',
      endMarker: '___DOCTOR_END___',
      description: 'Doctor notes verbatim markers',
      category: 'doctor',
      isActive: true,
      example: 'Dr. Smith noted ___DOCTOR_START___ patient shows improvement ___DOCTOR_END___ in the report.',
    },
  ]);

  const [isAddingNew, setIsAddingNew] = useState(false);
  // const [editingId, setEditingId] = useState<string | null>(null); // TODO: Implement editing functionality
  const [newTemplate, setNewTemplate] = useState<Partial<VerbatimTemplate>>({
    name: '',
    startMarker: '',
    endMarker: '',
    description: '',
    category: 'custom',
    isActive: true,
  });

  const handleAddTemplate = () => {
    if (newTemplate.name && newTemplate.startMarker && newTemplate.endMarker) {
      const template: VerbatimTemplate = {
        id: Date.now().toString(),
        name: newTemplate.name,
        startMarker: newTemplate.startMarker,
        endMarker: newTemplate.endMarker,
        description: newTemplate.description || '',
        category: newTemplate.category || 'custom',
        isActive: newTemplate.isActive ?? true,
        example: newTemplate.example,
      };
      setTemplates([...templates, template]);
      setNewTemplate({
        name: '',
        startMarker: '',
        endMarker: '',
        description: '',
        category: 'custom',
        isActive: true,
      });
      setIsAddingNew(false);
    }
  };

  const handleEditTemplate = (id: string) => {
    // setEditingId(id); // TODO: Implement editing functionality
    console.log('Edit template:', id);
  };

  // const handleSaveEdit = (id: string, updatedTemplate: Partial<VerbatimTemplate>) => {
  //   setTemplates(templates.map(template => 
  //     template.id === id ? { ...template, ...updatedTemplate } : template
  //   ));
  //   setEditingId(null);
  // };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(template => template.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setTemplates(templates.map(template => 
      template.id === id ? { ...template, isActive: !template.isActive } : template
    ));
  };

  const handleCopyMarkers = (startMarker: string, endMarker: string) => {
    const text = `${startMarker} ... ${endMarker}`;
    navigator.clipboard.writeText(text);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'patient': return 'bg-blue-100 text-blue-800';
      case 'radiologist': return 'bg-green-100 text-green-800';
      case 'doctor': return 'bg-purple-100 text-purple-800';
      case 'custom': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-700">Verbatim Management</h1>
          <p className="text-gray-600 mt-1">
            Manage verbatim text markers and templates
          </p>
        </div>
        <Button
          onClick={() => setIsAddingNew(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      {/* Add New Template Form */}
      {isAddingNew && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Quote className="h-5 w-5" />
              Add New Verbatim Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., 'Patient Quote'"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="patient">Patient</option>
                  <option value="radiologist">Radiologist</option>
                  <option value="doctor">Doctor</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startMarker">Start Marker</Label>
                <Input
                  id="startMarker"
                  value={newTemplate.startMarker}
                  onChange={(e) => setNewTemplate({ ...newTemplate, startMarker: e.target.value })}
                  placeholder="e.g., '___VERBATIM_START___'"
                />
              </div>
              <div>
                <Label htmlFor="endMarker">End Marker</Label>
                <Input
                  id="endMarker"
                  value={newTemplate.endMarker}
                  onChange={(e) => setNewTemplate({ ...newTemplate, endMarker: e.target.value })}
                  placeholder="e.g., '___VERBATIM_END___'"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Describe what this template is used for..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="example">Example Usage (Optional)</Label>
              <Textarea
                id="example"
                value={newTemplate.example}
                onChange={(e) => setNewTemplate({ ...newTemplate, example: e.target.value })}
                placeholder="Show how this template would be used in practice..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={handleAddTemplate} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAddingNew(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-slate-700">{template.name}</h3>
                    <Badge className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                    <span className={`text-sm ${template.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Start Marker</Label>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                        {template.startMarker}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">End Marker</Label>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                        {template.endMarker}
                      </p>
                    </div>
                  </div>
                  {template.description && (
                    <div className="mb-3">
                      <Label className="text-sm font-medium text-gray-600">Description</Label>
                      <p className="text-sm text-gray-700">{template.description}</p>
                    </div>
                  )}
                  {template.example && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Example</Label>
                      <p className="text-sm text-gray-700 font-mono bg-gray-50 p-2 rounded">
                        {template.example}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyMarkers(template.startMarker, template.endMarker)}
                    title="Copy markers"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(template.id)}
                  >
                    {template.isActive ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTemplate(template.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {templates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Quote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Verbatim Templates</h3>
            <p className="text-gray-500 mb-4">
              Create your first verbatim template to get started
            </p>
            <Button
              onClick={() => setIsAddingNew(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
