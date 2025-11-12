import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Section01Props {
  data: any;
  onUpdate: (content: any) => void;
  onSave: () => void;
}

export const Section01: React.FC<Section01Props> = ({ data, onUpdate }) => {
  const [content, setContent] = useState(data.content || '');

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Section 1: Mandat de l'évaluation</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label>Mandat</Label>
          <Textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              onUpdate({ content: e.target.value });
            }}
            className="min-h-[200px] mt-2"
            placeholder="Décrivez le mandat de l'évaluation..."
          />
        </div>
      </CardContent>
    </Card>
  );
};

