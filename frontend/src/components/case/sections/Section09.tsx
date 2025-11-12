import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

interface Section09Props {
  data: any;
  onUpdate: (content: any) => void;
  onSave: () => void;
}

interface ExamRow {
  id: string;
  category: string;
  test: string;
  result: string;
  notes: string;
}

export const Section09: React.FC<Section09Props> = ({ data, onUpdate, onSave }) => {
  const [examData, setExamData] = useState<ExamRow[]>(
    data.examData || [
      { id: '1', category: 'ROM', test: 'Flexion', result: '', notes: '' },
      { id: '2', category: 'ROM', test: 'Extension', result: '', notes: '' },
      { id: '3', category: 'Neuro', test: 'Réflexes', result: '', notes: '' },
      { id: '4', category: 'Neuro', test: 'Force musculaire', result: '', notes: '' },
      { id: '5', category: 'Special', test: 'Test de Lasègue', result: '', notes: '' }
    ]
  );

  const handleUpdateRow = (id: string, field: keyof ExamRow, value: string) => {
    const updated = examData.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    );
    setExamData(updated);
    onUpdate({ examData: updated });
  };

  const handleAddRow = () => {
    const newRow: ExamRow = {
      id: Date.now().toString(),
      category: '',
      test: '',
      result: '',
      notes: ''
    };
    const updated = [...examData, newRow];
    setExamData(updated);
    onUpdate({ examData: updated });
  };

  const handleDeleteRow = (id: string) => {
    const updated = examData.filter(row => row.id !== id);
    setExamData(updated);
    onUpdate({ examData: updated });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Section 9: Examen physique</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left p-3 font-semibold text-sm">Catégorie</th>
                  <th className="text-left p-3 font-semibold text-sm">Test</th>
                  <th className="text-left p-3 font-semibold text-sm">Résultat</th>
                  <th className="text-left p-3 font-semibold text-sm">Notes</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {examData.map((row) => (
                  <tr key={row.id} className="border-b border-gray-200">
                    <td className="p-3">
                      <Input
                        value={row.category}
                        onChange={(e) => handleUpdateRow(row.id, 'category', e.target.value)}
                        placeholder="ROM, Neuro, etc."
                        className="w-full"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        value={row.test}
                        onChange={(e) => handleUpdateRow(row.id, 'test', e.target.value)}
                        placeholder="Nom du test"
                        className="w-full"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        value={row.result}
                        onChange={(e) => handleUpdateRow(row.id, 'result', e.target.value)}
                        placeholder="Résultat"
                        className="w-full"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        value={row.notes}
                        onChange={(e) => handleUpdateRow(row.id, 'notes', e.target.value)}
                        placeholder="Notes additionnelles"
                        className="w-full"
                      />
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRow(row.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            variant="outline"
            onClick={handleAddRow}
            className="mt-4 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter une ligne</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

