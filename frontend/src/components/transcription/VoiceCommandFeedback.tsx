import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VoiceCommandEvent {
  type: 'verbatim' | 'core' | 'error';
  command: string;
  timestamp: number;
  status: 'detected' | 'executing' | 'completed' | 'error';
  details?: string;
}

interface VoiceCommandFeedbackProps {
  commands: VoiceCommandEvent[];
  isListening: boolean;
  language?: 'fr' | 'en';
}

export const VoiceCommandFeedback: React.FC<VoiceCommandFeedbackProps> = ({
  commands,
  isListening,
  language = 'fr'
}) => {
  const recentCommands = commands.slice(-5); // Show last 5 commands

  const getStatusIcon = (status: VoiceCommandEvent['status']) => {
    switch (status) {
      case 'detected':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'executing':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: VoiceCommandEvent['status']) => {
    switch (status) {
      case 'detected':
        return language === 'fr' ? 'Détecté' : 'Detected';
      case 'executing':
        return language === 'fr' ? 'Exécution' : 'Executing';
      case 'completed':
        return language === 'fr' ? 'Terminé' : 'Completed';
      case 'error':
        return language === 'fr' ? 'Erreur' : 'Error';
      default:
        return '';
    }
  };

  const getCommandTypeColor = (type: VoiceCommandEvent['type']) => {
    switch (type) {
      case 'verbatim':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'core':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Mic className={cn(
              "h-5 w-5",
              isListening ? "text-green-500 animate-pulse" : "text-gray-400"
            )} />
            <span className="text-sm font-medium">
              {language === 'fr' ? 'Commandes Vocales' : 'Voice Commands'}
            </span>
          </div>
          <Badge variant={isListening ? "default" : "secondary"}>
            {isListening 
              ? (language === 'fr' ? 'Écoute' : 'Listening')
              : (language === 'fr' ? 'En attente' : 'Waiting')
            }
          </Badge>
        </div>

        {recentCommands.length > 0 ? (
          <div className="space-y-2">
            {recentCommands.map((cmd, index) => (
              <div
                key={`${cmd.timestamp}-${index}`}
                className="flex items-center justify-between p-2 rounded-md border"
              >
                <div className="flex items-center space-x-2">
                  {getStatusIcon(cmd.status)}
                  <span className="text-sm font-mono">{cmd.command}</span>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getCommandTypeColor(cmd.type))}
                  >
                    {cmd.type === 'verbatim' 
                      ? (language === 'fr' ? 'Verbatim' : 'Verbatim')
                      : cmd.type === 'core'
                      ? (language === 'fr' ? 'Contrôle' : 'Control')
                      : (language === 'fr' ? 'Erreur' : 'Error')
                    }
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {getStatusText(cmd.status)}
                  </span>
                  {cmd.details && (
                    <span className="text-xs text-gray-400">
                      {cmd.details}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <Mic className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">
              {language === 'fr' 
                ? 'Aucune commande détectée' 
                : 'No commands detected'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
