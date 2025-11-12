import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DictationPanel } from '@/components/case/DictationPanel';
import { RichTextEditor } from '@/components/case/RichTextEditor';
import { FileText } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

interface Section08Props {
  data: any;
  onUpdate: (content: any) => void;
  onSave: () => void;
}

const DEFAULT_SECTION8_TEXT = `Appréciation subjective de l'évolution : Le travailleur nous mentionne envisager une réorientation de carrière. Il aimerait faire de la programmation ou devenir mécanicien techniques industriel. À noter qu'il nous mentionne avoir aucune séquelle au niveau de sa main droite.

Plaintes et problèmes : Au niveau de la cheville droite, le travailleur se plaint principalement d'instabilité. Il note des douleurs en externe de sa cheville en fin de journée ainsi qu'au niveau de son pied et de sa face plantaire. Il note une exacerbation de la douleur et de l'instabilité sur des surfaces glissantes et lorsqu'il monte des escaliers. Il rapporte être incapable de monter dans des escabeaux, des échelles ou des échafauds.

Il rapporte des éveils nocturnes secondaires à la douleur et des raideurs matinales. Il nie tout symptôme neurologique.

Impact sur AVQ/AVD : cf feuille en annexe.`;

export const Section08: React.FC<Section08Props> = ({ data, onUpdate, onSave }) => {
  const addToast = useUIStore(state => state.addToast);
  const [formattedText, setFormattedText] = useState(
    data.formattedText || data.transcript || ''
  );
  const [transcript, setTranscript] = useState(
    data.transcript || DEFAULT_SECTION8_TEXT
  );

  // Initialize with default text if no transcript exists
  useEffect(() => {
    if (!data.transcript && !data.formattedText) {
      setFormattedText(DEFAULT_SECTION8_TEXT);
      onUpdate({ 
        transcript: DEFAULT_SECTION8_TEXT,
        formattedText: DEFAULT_SECTION8_TEXT
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTranscriptReady = (newTranscript: string) => {
    setTranscript(newTranscript);
    onUpdate({ transcript: newTranscript });
  };

  const handleFormattedReady = (formatted: string) => {
    setFormattedText(formatted);
    onUpdate({ 
      formattedText: formatted,
      formattedAt: new Date().toISOString()
    });
    onSave();
  };

  const handleFormattedTextChange = (newText: string) => {
    setFormattedText(newText);
    onUpdate({ formattedText: newText });
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#009639]" />
          <span>Section 8: Entrevue patient (formatée)</span>
        </CardTitle>
      </div>

      {/* Split View */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0 p-6">
        {/* Left: Dictation Panel (shows live transcript, then formatted text with rich formatting) */}
        <div className="h-full min-h-0">
          <DictationPanel
            onTranscriptReady={handleTranscriptReady}
            onFormattedReady={handleFormattedReady}
            initialTranscript=""
          />
        </div>

        {/* Right: Rich Text Editor for final editing */}
        <div className="h-full min-h-0 flex flex-col">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Édition finale</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              <RichTextEditor
                value={formattedText}
                onChange={handleFormattedTextChange}
                placeholder="Le texte formaté du panneau de gauche peut être copié ici pour édition finale..."
                className="h-full"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

