import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Volume2, Command } from 'lucide-react';
import { t } from '@/lib/utils';
import { CNESSTSection } from '@/types';

interface VoiceCommandPanelProps {
  onCommand: (command: string) => void;
  language?: 'fr' | 'en';
  currentSection?: CNESSTSection;
}

const voiceCommands = {
  fr: {
    general: [
      { command: 'Démarrer transcription', description: 'Commencer l\'enregistrement' },
      { command: 'Pause transcription', description: 'Mettre en pause' },
      { command: 'Reprendre transcription', description: 'Continuer l\'enregistrement' },
      { command: 'Arrêter transcription', description: 'Terminer l\'enregistrement' },
      { command: 'Effacer', description: 'Supprimer le dernier texte' },
      { command: 'Nouveau paragraphe', description: 'Créer un nouveau paragraphe' },
      { command: 'Sauvegarder et continuer', description: 'Sauvegarder et passer à la suite' },
    ],
    section_7: [
      { command: 'Debut historique', description: 'Commencer l\'historique' },
      { command: 'Description incident', description: 'Décrire l\'incident' },
      { command: 'Evolution medicale', description: 'Décrire l\'évolution médicale' },
      { command: 'Imagerie traitement', description: 'Décrire l\'imagerie et traitement' },
      { command: 'Fin section sept', description: 'Terminer la section 7' },
    ],
    section_8: [
      { command: 'Nouvelle plainte', description: 'Ajouter une nouvelle plainte' },
      { command: 'Impact activites', description: 'Décrire l\'impact sur les activités' },
      { command: 'Echelle douleur', description: 'Évaluer la douleur' },
      { command: 'Limitations fonctionnelles', description: 'Décrire les limitations' },
      { command: 'Fin section huit', description: 'Terminer la section 8' },
    ],
    section_11: [
      { command: 'Resume medical', description: 'Faire le résumé médical' },
      { command: 'Diagnostic', description: 'Énoncer le diagnostic' },
      { command: 'Pourcentage atteinte', description: 'Évaluer le pourcentage d\'atteinte' },
      { command: 'Date consolidation', description: 'Indiquer la date de consolidation' },
      { command: 'Conclusion finale', description: 'Terminer la conclusion' },
    ],
  },
  en: {
    general: [
      { command: 'Start transcription', description: 'Begin recording' },
      { command: 'Pause transcription', description: 'Pause recording' },
      { command: 'Resume transcription', description: 'Continue recording' },
      { command: 'Stop transcription', description: 'End recording' },
      { command: 'Clear', description: 'Delete last text' },
      { command: 'New paragraph', description: 'Create new paragraph' },
      { command: 'Save and continue', description: 'Save and continue' },
    ],
    section_7: [
      { command: 'Begin history', description: 'Start history' },
      { command: 'Describe incident', description: 'Describe the incident' },
      { command: 'Medical evolution', description: 'Describe medical evolution' },
      { command: 'Imaging treatment', description: 'Describe imaging and treatment' },
      { command: 'End section seven', description: 'End section 7' },
    ],
    section_8: [
      { command: 'New complaint', description: 'Add new complaint' },
      { command: 'Activity impact', description: 'Describe activity impact' },
      { command: 'Pain scale', description: 'Assess pain' },
      { command: 'Functional limitations', description: 'Describe limitations' },
      { command: 'End section eight', description: 'End section 8' },
    ],
    section_11: [
      { command: 'Medical summary', description: 'Make medical summary' },
      { command: 'Diagnosis', description: 'State diagnosis' },
      { command: 'Impairment percentage', description: 'Assess impairment percentage' },
      { command: 'Consolidation date', description: 'Indicate consolidation date' },
      { command: 'Final conclusion', description: 'End conclusion' },
    ],
  },
};

export const VoiceCommandPanel: React.FC<VoiceCommandPanelProps> = ({
  onCommand,
  language = 'fr',
  currentSection = 'section_7'
}) => {
  const commands = voiceCommands[language];
  const sectionCommands = commands[currentSection] || [];

  const handleCommandClick = (command: string) => {
    onCommand(command);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Command className="h-5 w-5" />
          <span>{t('voiceCommands', language)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* General Commands */}
          <div>
            <h4 className="text-sm font-medium mb-2">{t('generalCommands', language)}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {commands.general.map((cmd, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleCommandClick(cmd.command)}
                  className="justify-start text-left h-auto p-2"
                >
                  <div className="flex items-center space-x-2">
                    <Mic className="h-3 w-3 text-muted-foreground" />
                    <div>
                      <div className="text-xs font-medium">{cmd.command}</div>
                      <div className="text-xs text-muted-foreground">{cmd.description}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Section-Specific Commands */}
          <div>
            <h4 className="text-sm font-medium mb-2">
              {t('sectionCommands', language)} - {t(currentSection, language)}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sectionCommands.map((cmd, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleCommandClick(cmd.command)}
                  className="justify-start text-left h-auto p-2 border-medical-primary"
                >
                  <div className="flex items-center space-x-2">
                    <Volume2 className="h-3 w-3 text-medical-primary" />
                    <div>
                      <div className="text-xs font-medium">{cmd.command}</div>
                      <div className="text-xs text-muted-foreground">{cmd.description}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="bg-muted p-3 rounded-md">
            <h5 className="text-sm font-medium mb-2">{t('usageInstructions', language)}</h5>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• {t('speakClearly', language)}</li>
              <li>• {t('pauseBetweenCommands', language)}</li>
              <li>• {t('useNaturalLanguage', language)}</li>
              <li>• {t('commandsAreContextual', language)}</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
