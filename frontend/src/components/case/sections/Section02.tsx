import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Section02Props {
  data: any;
  onUpdate: (content: any) => void;
  onSave: () => void;
}

export const Section02: React.FC<Section02Props> = ({ data, onUpdate }) => {
  const [content, setContent] = useState(data.content || '');

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Section 2: Diagnostics acceptés</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label>Diagnostics</Label>
          <Textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              onUpdate({ content: e.target.value });
            }}
            className="min-h-[200px] mt-2"
            placeholder="Listez les diagnostics acceptés par la CNESST..."
          />
        </div>
      </CardContent>
    </Card>
  );
};

