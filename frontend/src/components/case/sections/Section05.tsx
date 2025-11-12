import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Section05Props {
  data: any;
  onUpdate: (content: any) => void;
  onSave: () => void;
}

export const Section05: React.FC<Section05Props> = ({ data, onUpdate }) => {
  const [content, setContent] = useState(data.content || '');

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Section 5: Antécédents</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label>Antécédents</Label>
          <Textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              onUpdate({ content: e.target.value });
            }}
            className="min-h-[300px] mt-2"
            placeholder="Décrivez les antécédents du patient..."
          />
        </div>
      </CardContent>
    </Card>
  );
};

