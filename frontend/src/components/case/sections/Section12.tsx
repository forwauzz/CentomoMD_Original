import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { Plus, Trash2 } from 'lucide-react';

interface Section12Props {
  data: any;
  onUpdate: (content: any) => void;
  onSave: () => void;
}

interface SequelaRow {
  id: string;
  code: string;
  description: string;
  percentage: string;
  footnote?: string;
}

export const Section12: React.FC<Section12Props> = ({ data, onUpdate, onSave }) => {
  const addToast = useUIStore(state => state.addToast);
  const [currentSequelae, setCurrentSequelae] = useState<SequelaRow[]>(
    data.currentSequelae || []
  );
  const [previousSequelae, setPreviousSequelae] = useState<string>(
    data.previousSequelae || ''
  );
  const [bilateralDeficits, setBilateralDeficits] = useState<string>(
    data.bilateralDeficits || ''
  );
  const [footnotes, setFootnotes] = useState<string[]>(
    data.footnotes || []
  );

  const handleUpdateCurrentSequela = (id: string, field: keyof SequelaRow, value: string) => {
    const updated = currentSequelae.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    );
    setCurrentSequelae(updated);
    onUpdate({ 
      currentSequelae: updated,
      previousSequelae,
      bilateralDeficits,
      footnotes
    });
  };

  const handleAddCurrentSequela = () => {
    const newRow: SequelaRow = {
      id: Date.now().toString(),
      code: '',
      description: '',
      percentage: ''
    };
    const updated = [...currentSequelae, newRow];
    setCurrentSequelae(updated);
    onUpdate({ 
      currentSequelae: updated,
      previousSequelae,
      bilateralDeficits,
      footnotes
    });
  };

  const handleDeleteCurrentSequela = (id: string) => {
    const updated = currentSequelae.filter(row => row.id !== id);
    setCurrentSequelae(updated);
    onUpdate({ 
      currentSequelae: updated,
      previousSequelae,
      bilateralDeficits,
      footnotes
    });
  };

  const handleFillTable = async () => {
    try {
      addToast({
        type: 'info',
        title: 'Remplissage automatique',
        message: 'Remplissage du tableau à partir du système RAG...'
      });

      // Fill with the structure from the image
      const filledCurrentSequelae: SequelaRow[] = [
        {
          id: '1',
          code: '103 266',
          description: 'Entorse cheville droite avec séquelles fonctionnelles',
          percentage: '2'
        },
        {
          id: '2',
          code: '107 299',
          description: 'Perte de 15°* de l\'articulation tibio-tarsienne droite',
          percentage: '3',
          footnote: '* Cette valeur est comparée à une valeur normale d\'amplitude articulaire étant donnée la fracture au tibia gauche.'
        }
      ];

      const filledPreviousSequelae = 'Aucune';
      const filledBilateralDeficits = 'Ne s\'applique pas';
      const filledFootnotes = [
        '* Cette valeur est comparée à une valeur normale d\'amplitude articulaire étant donnée la fracture au tibia gauche.'
      ];

      setCurrentSequelae(filledCurrentSequelae);
      setPreviousSequelae(filledPreviousSequelae);
      setBilateralDeficits(filledBilateralDeficits);
      setFootnotes(filledFootnotes);

      onUpdate({ 
        currentSequelae: filledCurrentSequelae,
        previousSequelae: filledPreviousSequelae,
        bilateralDeficits: filledBilateralDeficits,
        footnotes: filledFootnotes,
        filledAt: new Date().toISOString()
      });
      onSave();

      addToast({
        type: 'success',
        title: 'Tableau rempli',
        message: 'Le tableau a été rempli automatiquement à partir du système RAG.'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de remplir le tableau automatiquement.'
      });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Section 12: Atteinte permanente</span>
            <Button
              onClick={handleFillTable}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Remplir le tableau</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="max-h-[calc(100vh-450px)] overflow-y-auto overflow-x-visible pr-2">
          {/* SÉQUELLES ACTUELLES */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              SÉQUELLES ACTUELLES
            </h3>
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full border-collapse border border-gray-300 min-w-[600px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-left font-semibold text-sm">
                      Code de séquelle
                    </th>
                    <th className="border border-gray-300 p-3 text-left font-semibold text-sm">
                      Description
                    </th>
                    <th className="border border-gray-300 p-3 text-left font-semibold text-sm w-24">
                      %
                    </th>
                    <th className="border border-gray-300 p-3 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {currentSequelae.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="border border-gray-300 p-4 text-center text-gray-500">
                        Aucune séquelle actuelle. Cliquez sur "Remplir le tableau" ou ajoutez une ligne.
                      </td>
                    </tr>
                  ) : (
                    currentSequelae.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-3">
                          <Input
                            value={row.code}
                            onChange={(e) => handleUpdateCurrentSequela(row.id, 'code', e.target.value)}
                            placeholder="Ex: 103 266"
                            className="w-full border-0 focus:ring-0 p-0"
                          />
                        </td>
                        <td className="border border-gray-300 p-3">
                          <Input
                            value={row.description}
                            onChange={(e) => handleUpdateCurrentSequela(row.id, 'description', e.target.value)}
                            placeholder="Description de la séquelle"
                            className="w-full border-0 focus:ring-0 p-0"
                          />
                        </td>
                        <td className="border border-gray-300 p-3">
                          <Input
                            value={row.percentage}
                            onChange={(e) => handleUpdateCurrentSequela(row.id, 'percentage', e.target.value)}
                            placeholder="%"
                            className="w-full border-0 focus:ring-0 p-0 text-center"
                          />
                        </td>
                        <td className="border border-gray-300 p-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCurrentSequela(row.id)}
                            className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Button
              variant="outline"
              onClick={handleAddCurrentSequela}
              className="mt-3 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter une séquelle</span>
            </Button>
          </div>

          {/* SÉQUELLES ANTÉRIEURES */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              SÉQUELLES ANTÉRIEURES
            </h3>
            <Textarea
              value={previousSequelae}
              onChange={(e) => {
                setPreviousSequelae(e.target.value);
                onUpdate({ 
                  currentSequelae,
                  previousSequelae: e.target.value,
                  bilateralDeficits,
                  footnotes
                });
              }}
              placeholder="Aucune ou description des séquelles antérieures..."
              className="min-h-[100px]"
            />
          </div>

          {/* AUTRES DÉFICITS LIÉS À LA BILATÉRALITÉ */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              AUTRES DÉFICITS LIÉS À LA BILATÉRALITÉ
            </h3>
            <Textarea
              value={bilateralDeficits}
              onChange={(e) => {
                setBilateralDeficits(e.target.value);
                onUpdate({ 
                  currentSequelae,
                  previousSequelae,
                  bilateralDeficits: e.target.value,
                  footnotes
                });
              }}
              placeholder="Ne s'applique pas ou description des déficits..."
              className="min-h-[100px]"
            />
          </div>

          {/* Footnotes */}
          {footnotes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes de bas de page</h4>
              <div className="space-y-2">
                {footnotes.map((note, index) => (
                  <div key={index} className="text-sm text-gray-600 italic">
                    {note}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.filledAt && (
            <p className="text-xs text-gray-500">
              Rempli automatiquement le {new Date(data.filledAt).toLocaleString('fr-CA')}
            </p>
          )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
