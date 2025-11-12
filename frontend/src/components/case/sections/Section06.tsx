import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Section06Props {
  data: any;
  onUpdate: (content: any) => void;
  onSave: () => void;
}

export const Section06: React.FC<Section06Props> = ({ data, onUpdate }) => {
  const [content, setContent] = useState(data.content || '');

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Section 6: Médication actuelle</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label>Médication</Label>
          <Textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              onUpdate({ content: e.target.value });
            }}
            className="min-h-[200px] mt-2"
            placeholder="Listez la médication actuelle du patient..."
          />
        </div>
      </CardContent>
    </Card>
  );
};

