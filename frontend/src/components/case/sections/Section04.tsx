import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Section04Props {
  data: any;
  onUpdate: (content: any) => void;
  onSave: () => void;
}

export const Section04: React.FC<Section04Props> = ({ data, onUpdate }) => {
  const [name, setName] = useState(data.name || '');
  const [dob, setDob] = useState(data.dob || '');
  const [age, setAge] = useState(data.age || '');
  const [job, setJob] = useState(data.job || '');
  const [employer, setEmployer] = useState(data.employer || '');

  const updateField = (field: string, value: string) => {
    onUpdate({ ...data, [field]: value });
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Section 4: Identification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Nom</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                updateField('name', e.target.value);
              }}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Date de naissance</Label>
            <Input
              type="date"
              value={dob}
              onChange={(e) => {
                setDob(e.target.value);
                updateField('dob', e.target.value);
              }}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Âge</Label>
            <Input
              value={age}
              onChange={(e) => {
                setAge(e.target.value);
                updateField('age', e.target.value);
              }}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Emploi</Label>
            <Input
              value={job}
              onChange={(e) => {
                setJob(e.target.value);
                updateField('job', e.target.value);
              }}
              className="mt-2"
            />
          </div>
          <div className="col-span-2">
            <Label>Employeur</Label>
            <Input
              value={employer}
              onChange={(e) => {
                setEmployer(e.target.value);
                updateField('employer', e.target.value);
              }}
              className="mt-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

