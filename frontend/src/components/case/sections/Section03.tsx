import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Section03Props {
  data: any;
  onUpdate: (content: any) => void;
  onSave: () => void;
}

export const Section03: React.FC<Section03Props> = ({ data, onUpdate }) => {
  const [content, setContent] = useState(data.content || '');

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Section 3: Modalité de l'entrevue</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label>Modalité</Label>
          <Textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              onUpdate({ content: e.target.value });
            }}
            className="min-h-[200px] mt-2"
            placeholder="Décrivez les modalités de l'entrevue..."
          />
        </div>
      </CardContent>
    </Card>
  );
};

