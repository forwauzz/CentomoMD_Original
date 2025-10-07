import React, { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Mic, Play, Volume2, CheckCircle, XCircle, HelpCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TrainingCommand {
  id: string;
  command: string;
  category: 'verbatim' | 'core' | 'navigation' | 'formatting';
  description: string;
  examples: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  practiced: boolean;
  successRate: number;
}

interface VoiceCommandTrainingProps {
  language?: 'fr' | 'en';
  onCommandPractice?: (command: string) => void;
  onAccessibilityToggle?: (enabled: boolean) => void;
}

const TRAINING_COMMANDS: TrainingCommand[] = [
  // Verbatim Commands
  {
    id: 'verbatim-open',
    command: 'début verbatim',
    category: 'verbatim',
    description: 'Start verbatim mode to protect text from formatting',
    examples: ['début verbatim', 'ouvrir parenthèse', 'commencer verbatim'],
    difficulty: 'easy',
    practiced: false,
    successRate: 0
  },
  {
    id: 'verbatim-close',
    command: 'fin verbatim',
    category: 'verbatim',
    description: 'End verbatim mode',
    examples: ['fin verbatim', 'fermer parenthèse', 'terminer verbatim'],
    difficulty: 'easy',
    practiced: false,
    successRate: 0
  },
  {
    id: 'radiology-report',
    command: 'rapport radiologique',
    category: 'verbatim',
    description: 'Start protected radiology report section',
    examples: ['rapport radiologique', 'fin rapport'],
    difficulty: 'medium',
    practiced: false,
    successRate: 0
  },

  // Core Control Commands
  {
    id: 'paragraph-break',
    command: 'nouveau paragraphe',
    category: 'core',
    description: 'Add a paragraph break',
    examples: ['nouveau paragraphe', 'paragraphe'],
    difficulty: 'easy',
    practiced: false,
    successRate: 0
  },
  {
    id: 'pause',
    command: 'pause',
    category: 'core',
    description: 'Pause transcription',
    examples: ['pause', 'pause transcription'],
    difficulty: 'easy',
    practiced: false,
    successRate: 0
  },
  {
    id: 'resume',
    command: 'reprendre',
    category: 'core',
    description: 'Resume transcription',
    examples: ['reprendre', 'reprendre transcription', 'continuer'],
    difficulty: 'easy',
    practiced: false,
    successRate: 0
  },
  {
    id: 'clear',
    command: 'effacer',
    category: 'core',
    description: 'Clear current buffer',
    examples: ['effacer', 'vider'],
    difficulty: 'easy',
    practiced: false,
    successRate: 0
  },

  // Navigation Commands
  {
    id: 'section-7',
    command: 'section 7',
    category: 'navigation',
    description: 'Switch to section 7',
    examples: ['section 7', 'section 8', 'section 11'],
    difficulty: 'easy',
    practiced: false,
    successRate: 0
  },
  {
    id: 'save',
    command: 'sauvegarder',
    category: 'core',
    description: 'Save current document',
    examples: ['sauvegarder', 'enregistrer'],
    difficulty: 'medium',
    practiced: false,
    successRate: 0
  },
  {
    id: 'export',
    command: 'export',
    category: 'core',
    description: 'Export document',
    examples: ['export', 'exporter'],
    difficulty: 'medium',
    practiced: false,
    successRate: 0
  },

  // Formatting Commands
  {
    id: 'format-cnesst',
    command: 'formatage cnesst',
    category: 'formatting',
    description: 'Apply CNESST formatting',
    examples: ['formatage cnesst', 'format cnesst'],
    difficulty: 'hard',
    practiced: false,
    successRate: 0
  },
  {
    id: 'validation',
    command: 'validation',
    category: 'formatting',
    description: 'Validate document',
    examples: ['validation', 'valider', 'vérifier'],
    difficulty: 'hard',
    practiced: false,
    successRate: 0
  }
];

export const VoiceCommandTraining: React.FC<VoiceCommandTrainingProps> = ({
  language = 'fr',
  onCommandPractice,
  onAccessibilityToggle
}) => {
  const [commands, setCommands] = useState<TrainingCommand[]>(TRAINING_COMMANDS);
  const [currentCommand, setCurrentCommand] = useState<TrainingCommand | null>(null);
  const [isPracticing, setIsPracticing] = useState(false);
  const [practiceResult, setPracticeResult] = useState<'success' | 'error' | null>(null);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [filter, setFilter] = useState<'all' | 'verbatim' | 'core' | 'navigation' | 'formatting'>('all');

  const filteredCommands = commands.filter(cmd => 
    filter === 'all' || cmd.category === filter
  );

  const getCategoryColor = (category: TrainingCommand['category']) => {
    switch (category) {
      case 'verbatim': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'core': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'navigation': return 'bg-green-100 text-green-800 border-green-200';
      case 'formatting': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: TrainingCommand['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const startPractice = useCallback((command: TrainingCommand) => {
    setCurrentCommand(command);
    setIsPracticing(true);
    setPracticeResult(null);
    onCommandPractice?.(command.command);
  }, [onCommandPractice]);

  const handlePracticeResult = useCallback((success: boolean) => {
    setPracticeResult(success ? 'success' : 'error');
    
    if (success && currentCommand) {
      setCommands(prev => prev.map(cmd => 
        cmd.id === currentCommand.id 
          ? { 
              ...cmd, 
              practiced: true, 
              successRate: Math.min(100, cmd.successRate + 10) 
            }
          : cmd
      ));
    }

    setTimeout(() => {
      setIsPracticing(false);
      setCurrentCommand(null);
      setPracticeResult(null);
    }, 2000);
  }, [currentCommand]);

  const toggleAccessibility = useCallback(() => {
    const newState = !accessibilityEnabled;
    setAccessibilityEnabled(newState);
    onAccessibilityToggle?.(newState);
  }, [accessibilityEnabled, onAccessibilityToggle]);

  const getOverallProgress = () => {
    const practiced = commands.filter(cmd => cmd.practiced).length;
    return (practiced / commands.length) * 100;
  };

  const getCategoryProgress = (category: TrainingCommand['category']) => {
    const categoryCommands = commands.filter(cmd => cmd.category === category);
    const practiced = categoryCommands.filter(cmd => cmd.practiced).length;
    return categoryCommands.length > 0 ? (practiced / categoryCommands.length) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mic className="h-5 w-5" />
              <span>{language === 'fr' ? 'Entraînement aux Commandes Vocales' : 'Voice Command Training'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAccessibility}
                className={cn(accessibilityEnabled && "bg-blue-50 border-blue-200")}
              >
                <Settings className="h-4 w-4 mr-1" />
                {language === 'fr' ? 'Accessibilité' : 'Accessibility'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHints(!showHints)}
              >
                <HelpCircle className="h-4 w-4 mr-1" />
                {language === 'fr' ? 'Aide' : 'Help'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Overall Progress */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>{language === 'fr' ? 'Progression Globale' : 'Overall Progress'}</span>
              <span>{Math.round(getOverallProgress())}%</span>
            </div>
            <Progress value={getOverallProgress()} className="h-2" />
          </div>

          {/* Category Progress */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {(['verbatim', 'core', 'navigation', 'formatting'] as const).map(category => (
              <div key={category} className="text-center">
                <div className="text-xs font-medium mb-1">
                  {language === 'fr' 
                    ? (category === 'verbatim' ? 'Verbatim' : 
                       category === 'core' ? 'Contrôle' : 
                       category === 'navigation' ? 'Navigation' : 'Formatage')
                    : category.charAt(0).toUpperCase() + category.slice(1)
                  }
                </div>
                <Progress value={getCategoryProgress(category)} className="h-1" />
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round(getCategoryProgress(category))}%
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(['all', 'verbatim', 'core', 'navigation', 'formatting'] as const).map(filterOption => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filterOption)}
              >
                {language === 'fr' 
                  ? (filterOption === 'all' ? 'Tous' : 
                     filterOption === 'verbatim' ? 'Verbatim' : 
                     filterOption === 'core' ? 'Contrôle' : 
                     filterOption === 'navigation' ? 'Navigation' : 'Formatage')
                  : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)
                }
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Practice Area */}
      {isPracticing && currentCommand && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Mic className={cn(
                  "h-6 w-6",
                  practiceResult === 'success' ? "text-green-500" :
                  practiceResult === 'error' ? "text-red-500" : "text-blue-500 animate-pulse"
                )} />
                <span className="text-lg font-semibold">
                  {language === 'fr' ? 'Pratiquez cette commande' : 'Practice this command'}
                </span>
              </div>
              
              <div className="text-2xl font-mono bg-white p-4 rounded-lg border">
                "{currentCommand.command}"
              </div>
              
              <div className="text-sm text-gray-600">
                {currentCommand.description}
              </div>

              {showHints && (
                <div className="text-xs text-gray-500">
                  <div className="font-medium mb-1">
                    {language === 'fr' ? 'Exemples:' : 'Examples:'}
                  </div>
                  <div className="space-y-1">
                    {currentCommand.examples.map((example, index) => (
                      <div key={index} className="font-mono">• {example}</div>
                    ))}
                  </div>
                </div>
              )}

              {practiceResult && (
                <div className={cn(
                  "flex items-center justify-center space-x-2 p-3 rounded-lg",
                  practiceResult === 'success' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                )}>
                  {practiceResult === 'success' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span className="font-medium">
                    {practiceResult === 'success' 
                      ? (language === 'fr' ? 'Succès!' : 'Success!')
                      : (language === 'fr' ? 'Essayez encore' : 'Try again')
                    }
                  </span>
                </div>
              )}

              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handlePracticeResult(true)}
                  disabled={practiceResult !== null}
                >
                  {language === 'fr' ? 'Succès' : 'Success'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePracticeResult(false)}
                  disabled={practiceResult !== null}
                >
                  {language === 'fr' ? 'Échec' : 'Failed'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Command List */}
      <div className="grid gap-4">
        {filteredCommands.map(command => (
          <Card key={command.id} className={cn(
            "transition-all duration-200",
            command.practiced && "border-green-200 bg-green-50"
          )}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-lg">{command.command}</span>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getCategoryColor(command.category))}
                    >
                      {language === 'fr' 
                        ? (command.category === 'verbatim' ? 'Verbatim' : 
                           command.category === 'core' ? 'Contrôle' : 
                           command.category === 'navigation' ? 'Navigation' : 'Formatage')
                        : command.category.charAt(0).toUpperCase() + command.category.slice(1)
                      }
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getDifficultyColor(command.difficulty))}
                    >
                      {language === 'fr' 
                        ? (command.difficulty === 'easy' ? 'Facile' : 
                           command.difficulty === 'medium' ? 'Moyen' : 'Difficile')
                        : command.difficulty.charAt(0).toUpperCase() + command.difficulty.slice(1)
                      }
                    </Badge>
                    {command.practiced && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {command.description}
                  </p>

                  {showHints && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">
                        {language === 'fr' ? 'Exemples:' : 'Examples:'}
                      </span>
                      <div className="mt-1 space-y-1">
                        {command.examples.map((example, index) => (
                          <div key={index} className="font-mono">• {example}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {command.practiced && (
                    <div className="flex items-center space-x-2">
                      <Progress value={command.successRate} className="h-1 flex-1" />
                      <span className="text-xs text-gray-500">
                        {command.successRate}% {language === 'fr' ? 'réussite' : 'success'}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startPractice(command)}
                  disabled={isPracticing}
                  className="ml-4"
                >
                  <Play className="h-4 w-4 mr-1" />
                  {language === 'fr' ? 'Pratiquer' : 'Practice'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Accessibility Features */}
      {accessibilityEnabled && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Volume2 className="h-5 w-5" />
              <span>{language === 'fr' ? 'Fonctionnalités d\'Accessibilité' : 'Accessibility Features'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">{language === 'fr' ? 'Audio Feedback' : 'Audio Feedback'}</h4>
                <p className="text-sm text-gray-600">
                  {language === 'fr' 
                    ? 'Retour audio pour confirmer les commandes détectées'
                    : 'Audio feedback to confirm detected commands'
                  }
                </p>
                <Button variant="outline" size="sm">
                  <Volume2 className="h-4 w-4 mr-1" />
                  {language === 'fr' ? 'Tester Audio' : 'Test Audio'}
                </Button>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">{language === 'fr' ? 'Commandes Vocales' : 'Voice Commands'}</h4>
                <p className="text-sm text-gray-600">
                  {language === 'fr' 
                    ? 'Contrôler l\'interface par commandes vocales'
                    : 'Control interface with voice commands'
                  }
                </p>
                <Button variant="outline" size="sm">
                  <Mic className="h-4 w-4 mr-1" />
                  {language === 'fr' ? 'Activer' : 'Enable'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
