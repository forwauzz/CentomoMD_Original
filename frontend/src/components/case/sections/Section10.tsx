import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Section10Props {
  data: any;
  onUpdate: (content: any) => void;
  onSave: () => void;
}

export const Section10: React.FC<Section10Props> = ({ data, onUpdate }) => {
  const [content, setContent] = useState(data.content || '');

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Section 10: Examens paracliniques</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label>Examens paracliniques</Label>
          <Textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              onUpdate({ content: e.target.value });
            }}
            className="min-h-[300px] mt-2"
            placeholder="Décrivez les examens paracliniques effectués..."
          />
        </div>
      </CardContent>
    </Card>
  );
};

