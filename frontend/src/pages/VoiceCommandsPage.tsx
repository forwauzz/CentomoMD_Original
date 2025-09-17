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
  Mic, 
  Save, 
  X,
  Play,
  Pause,
  Search,
  Filter
} from 'lucide-react';

interface VoiceCommand {
  id: string;
  trigger: string;
  replacement: string;
  category: 'verbatim' | 'punctuation' | 'template' | 'custom' | 'examination' | 'instructions' | 'vitals' | 'examen' | 'vitaux' | 'orthopédie' | 'douleur' | 'template-combo';
  description?: string;
  isActive: boolean;
  created?: string;
  isTemplateCombo?: boolean;
}

export const VoiceCommandsPage: React.FC = () => {
  const [commands, setCommands] = useState<VoiceCommand[]>([
    // Template Combination Commands - Special templates for Section 7
    {
      id: 'template-1',
      trigger: 'section 7 template only',
      replacement: 'SECTION_7_TEMPLATE_ONLY',
      category: 'template-combo',
      description: 'Apply Section 7 AI formatting template only (no verbatim or voice commands)',
      isActive: true,
      created: '2024-12-19',
      isTemplateCombo: true,
    },
    {
      id: 'template-2',
      trigger: 'section 7 template with verbatim',
      replacement: 'SECTION_7_TEMPLATE_VERBATIM',
      category: 'template-combo',
      description: 'Apply Section 7 AI formatting template with verbatim text support',
      isActive: true,
      created: '2024-12-19',
      isTemplateCombo: true,
    },
    {
      id: 'template-3',
      trigger: 'section 7 template with verbatim and voice commands',
      replacement: 'SECTION_7_TEMPLATE_VERBATIM_VOICE_COMMANDS',
      category: 'template-combo',
      description: 'Apply Section 7 AI formatting template with verbatim text and voice commands support',
      isActive: true,
      created: '2024-12-19',
      isTemplateCombo: true,
    },
    {
      id: 'template-4',
      trigger: 'section 7 template complet',
      replacement: 'SECTION_7_TEMPLATE_VERBATIM_VOICE_COMMANDS',
      category: 'template-combo',
      description: 'Appliquer le template Section 7 avec support verbatim et commandes vocales (version française)',
      isActive: true,
      created: '2024-12-19',
      isTemplateCombo: true,
    },
    
    // Verbatim commands - English
    {
      id: '1',
      trigger: 'open parenthesis',
      replacement: '___VERBATIM_START___',
      category: 'verbatim',
      description: 'Start verbatim text block',
      isActive: true,
      created: '2024-12-19',
    },
    {
      id: '2',
      trigger: 'close parenthesis',
      replacement: '___VERBATIM_END___',
      category: 'verbatim',
      description: 'End verbatim text block',
      isActive: true,
      created: '2024-12-19',
    },
    {
      id: '3',
      trigger: 'start verbatim',
      replacement: '___VERBATIM_START___',
      category: 'verbatim',
      description: 'Start verbatim text block (alternative)',
      isActive: true,
      created: '2024-12-19',
    },
    {
      id: '4',
      trigger: 'end verbatim',
      replacement: '___VERBATIM_END___',
      category: 'verbatim',
      description: 'End verbatim text block (alternative)',
      isActive: true,
      created: '2024-12-19',
    },
    
    // Medical examination commands - English
    {
      id: '5',
      trigger: 'insert physical exam',
      replacement: 'Physical examination reveals normal gait and posture. Patient appears comfortable and in no acute distress. Vital signs are stable and within normal limits.',
      category: 'examination',
      description: 'Standard physical examination template',
      isActive: true,
      created: '2024-12-19',
    },
    {
      id: '6',
      trigger: 'insert normal neuro',
      replacement: 'Neurological examination: Alert and oriented x3. Cranial nerves II-XII intact. Motor strength 5/5 throughout. Deep tendon reflexes 2+ and symmetric. No focal neurological deficits noted.',
      category: 'examination',
      description: 'Normal neurological examination template',
      isActive: true,
      created: '2024-12-19',
    },
    {
      id: '7',
      trigger: 'insert normal vitals',
      replacement: 'Vital signs: Blood pressure 120/80 mmHg, Heart rate 72 bpm regular, Respiratory rate 16 breaths per minute, Temperature 98.6°F (37°C), Oxygen saturation 98% on room air.',
      category: 'vitals',
      description: 'Normal vital signs template',
      isActive: true,
      created: '2024-12-19',
    },
    {
      id: '8',
      trigger: 'insert follow up',
      replacement: 'Patient advised to follow up in 2-4 weeks or sooner if symptoms worsen. Return precautions discussed. Patient verbalized understanding.',
      category: 'instructions',
      description: 'Standard follow-up instructions',
      isActive: true,
      created: '2024-12-19',
    },
    
    // French medical commands
    {
      id: '9',
      trigger: 'ouvrir parenthèse',
      replacement: '___VERBATIM_START___',
      category: 'verbatim',
      description: 'Commencer bloc de texte verbatim',
      isActive: true,
      created: '2024-12-19',
    },
    {
      id: '10',
      trigger: 'fermer parenthèse',
      replacement: '___VERBATIM_END___',
      category: 'verbatim',
      description: 'Terminer bloc de texte verbatim',
      isActive: true,
      created: '2024-12-19',
    },
    {
      id: '11',
      trigger: 'insérer examen physique',
      replacement: 'L\'examen physique révèle une démarche et une posture normales. Le patient semble à l\'aise et ne présente aucune détresse aiguë. Les signes vitaux sont stables et dans les limites normales.',
      category: 'examen',
      description: 'Modèle d\'examen physique standard',
      isActive: true,
      created: '2024-12-19',
    },
    {
      id: '12',
      trigger: 'insérer neuro normal',
      replacement: 'Examen neurologique : Alerte et orienté x3. Nerfs crâniens II-XII intacts. Force motrice 5/5 partout. Réflexes tendineux profonds 2+ et symétriques. Aucun déficit neurologique focal noté.',
      category: 'examen',
      description: 'Modèle d\'examen neurologique normal',
      isActive: true,
      created: '2024-12-19',
    },
    {
      id: '13',
      trigger: 'insérer signes vitaux',
      replacement: 'Signes vitaux : Tension artérielle 120/80 mmHg, Fréquence cardiaque 72 bpm régulière, Fréquence respiratoire 16 respirations par minute, Température 37°C, Saturation en oxygène 98% à l\'air ambiant.',
      category: 'vitaux',
      description: 'Modèle de signes vitaux normaux',
      isActive: true,
      created: '2024-12-19',
    },
    {
      id: '14',
      trigger: 'insérer examen genou',
      replacement: 'Examen du genou : Inspection révèle absence d\'œdème, d\'ecchymose ou de déformation. Palpation normale. Amplitude de mouvement complète. Manœuvres ligamentaires négatives. Ménisques intacts.',
      category: 'orthopédie',
      description: 'Modèle d\'examen du genou',
      isActive: true,
      created: '2024-12-19',
    },
    {
      id: '15',
      trigger: 'insérer douleur chronique',
      replacement: 'Douleur chronique bien contrôlée avec médication actuelle. Patient rapporte amélioration fonctionnelle. Aucun effet secondaire significatif des médicaments rapporté.',
      category: 'douleur',
      description: 'Modèle de gestion de douleur chronique',
      isActive: true,
      created: '2024-12-19',
    },
  ]);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [newCommand, setNewCommand] = useState<Partial<VoiceCommand>>({
    trigger: '',
    replacement: '',
    category: 'custom',
    description: '',
    isActive: true,
  });

  const handleAddCommand = () => {
    if (newCommand.trigger && newCommand.replacement) {
      const command: VoiceCommand = {
        id: Date.now().toString(),
        trigger: newCommand.trigger,
        replacement: newCommand.replacement,
        category: newCommand.category || 'custom',
        description: newCommand.description,
        isActive: newCommand.isActive ?? true,
      };
      setCommands([...commands, command]);
      setNewCommand({
        trigger: '',
        replacement: '',
        category: 'custom',
        description: '',
        isActive: true,
      });
      setIsAddingNew(false);
    }
  };

  const handleEditCommand = (id: string) => {
    // TODO: Implement edit functionality
    console.log('Edit command:', id);
  };

  const handleDeleteCommand = (id: string) => {
    setCommands(commands.filter(cmd => cmd.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setCommands(commands.map(cmd => 
      cmd.id === id ? { ...cmd, isActive: !cmd.isActive } : cmd
    ));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'template-combo': return 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border border-purple-200';
      case 'verbatim': return 'bg-blue-100 text-blue-800';
      case 'punctuation': return 'bg-green-100 text-green-800';
      case 'template': return 'bg-purple-100 text-purple-800';
      case 'examination': return 'bg-indigo-100 text-indigo-800';
      case 'instructions': return 'bg-yellow-100 text-yellow-800';
      case 'vitals': return 'bg-red-100 text-red-800';
      case 'examen': return 'bg-indigo-100 text-indigo-800';
      case 'vitaux': return 'bg-red-100 text-red-800';
      case 'orthopédie': return 'bg-orange-100 text-orange-800';
      case 'douleur': return 'bg-pink-100 text-pink-800';
      case 'custom': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter commands based on search term and category
  const filteredCommands = commands.filter(command => {
    const matchesSearch = command.trigger.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         command.replacement.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (command.description && command.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || command.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-700">Voice Commands</h1>
          <p className="text-gray-600 mt-1">
            Manage custom voice commands for dictation
          </p>
        </div>
        <Button
          onClick={() => setIsAddingNew(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Command
        </Button>
      </div>

      {/* Template Combinations Highlight */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h3 className="font-semibold text-purple-800">Template Combinations</h3>
              <p className="text-sm text-purple-600">
                Special commands that combine Section 7 AI formatting with different feature sets
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="bg-white p-3 rounded border border-purple-100">
              <div className="font-medium text-gray-700 mb-1">Section 7 Only</div>
              <div className="text-gray-600">AI formatting template only</div>
              <div className="font-mono text-xs text-purple-600 mt-1">"section 7 template only"</div>
            </div>
            <div className="bg-white p-3 rounded border border-purple-100">
              <div className="font-medium text-gray-700 mb-1">Section 7 + Verbatim</div>
              <div className="text-gray-600">AI formatting with verbatim text support</div>
              <div className="font-mono text-xs text-purple-600 mt-1">"section 7 template with verbatim"</div>
            </div>
            <div className="bg-white p-3 rounded border border-purple-100">
              <div className="font-medium text-gray-700 mb-1">Section 7 + Verbatim + Voice</div>
              <div className="text-gray-600">Full feature set with voice commands</div>
              <div className="font-mono text-xs text-purple-600 mt-1">"section 7 template with verbatim and voice commands"</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search commands by trigger, replacement, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Categories</option>
            <optgroup label="Template Combinations">
              <option value="template-combo">Template Combinations</option>
            </optgroup>
            <optgroup label="Text Processing">
              <option value="verbatim">Verbatim</option>
              <option value="punctuation">Punctuation</option>
              <option value="template">Template</option>
            </optgroup>
            <optgroup label="Medical - English">
              <option value="examination">Examination</option>
              <option value="instructions">Instructions</option>
              <option value="vitals">Vital Signs</option>
            </optgroup>
            <optgroup label="Medical - French">
              <option value="examen">Examen</option>
              <option value="vitaux">Signes Vitaux</option>
              <option value="orthopédie">Orthopédie</option>
              <option value="douleur">Douleur</option>
            </optgroup>
            <optgroup label="Other">
              <option value="custom">Custom</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Add New Command Form */}
      {isAddingNew && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Add New Voice Command
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trigger">Trigger Phrase</Label>
                <Input
                  id="trigger"
                  value={newCommand.trigger}
                  onChange={(e) => setNewCommand({ ...newCommand, trigger: e.target.value })}
                  placeholder="e.g., 'open parenthesis'"
                />
              </div>
              <div>
                <Label htmlFor="replacement">Replacement Text</Label>
                <Input
                  id="replacement"
                  value={newCommand.replacement}
                  onChange={(e) => setNewCommand({ ...newCommand, replacement: e.target.value })}
                  placeholder="e.g., '___VERBATIM_START___'"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={newCommand.category}
                onChange={(e) => setNewCommand({ ...newCommand, category: e.target.value as any })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <optgroup label="Template Combinations">
                  <option value="template-combo">Template Combinations</option>
                </optgroup>
                <optgroup label="Text Processing">
                  <option value="verbatim">Verbatim</option>
                  <option value="punctuation">Punctuation</option>
                  <option value="template">Template</option>
                </optgroup>
                <optgroup label="Medical - English">
                  <option value="examination">Examination</option>
                  <option value="instructions">Instructions</option>
                  <option value="vitals">Vital Signs</option>
                </optgroup>
                <optgroup label="Medical - French">
                  <option value="examen">Examen</option>
                  <option value="vitaux">Signes Vitaux</option>
                  <option value="orthopédie">Orthopédie</option>
                  <option value="douleur">Douleur</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="custom">Custom</option>
                </optgroup>
              </select>
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={newCommand.description}
                onChange={(e) => setNewCommand({ ...newCommand, description: e.target.value })}
                placeholder="Describe what this command does..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={handleAddCommand} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save Command
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

      {/* Commands List */}
      <div className="grid gap-4">
        {filteredCommands.map((command) => (
          <Card key={command.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-slate-700">
                      {command.isTemplateCombo && (
                        <span className="text-purple-600 mr-2">🎯</span>
                      )}
                      {command.trigger}
                    </h3>
                    <Badge className={getCategoryColor(command.category)}>
                      {command.category === 'template-combo' ? 'Template Combo' : command.category}
                    </Badge>
                    <span className={`text-sm ${command.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                      {command.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Trigger</Label>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                        "{command.trigger}"
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Replacement</Label>
                      <div className="font-mono text-sm bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                        {command.replacement.length > 100 ? (
                          <details>
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                              {command.replacement.substring(0, 100)}...
                            </summary>
                            <div className="mt-2 whitespace-pre-wrap">
                              {command.replacement}
                            </div>
                          </details>
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {command.replacement}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {command.description && (
                    <div className="mt-2">
                      <Label className="text-sm font-medium text-gray-600">Description</Label>
                      <p className="text-sm text-gray-700">{command.description}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(command.id)}
                  >
                    {command.isActive ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCommand(command.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCommand(command.id)}
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
      {filteredCommands.length === 0 && commands.length > 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Commands Found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search terms or filter criteria
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('all');
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {commands.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Voice Commands</h3>
            <p className="text-gray-500 mb-4">
              Create your first voice command to get started
            </p>
            <Button
              onClick={() => setIsAddingNew(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Command
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
