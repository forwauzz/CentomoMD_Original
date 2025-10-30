import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClinicSelectionModal } from './ClinicSelectionModal';
import { apiFetch } from '@/lib/api';

interface Clinic {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

interface NewCaseWithClinicSelectionProps {
  onCaseCreated?: (caseId: string) => void;
}

export const NewCaseWithClinicSelection: React.FC<NewCaseWithClinicSelectionProps> = ({
  onCaseCreated
}) => {
  const navigate = useNavigate();
  const [isClinicModalOpen, setIsClinicModalOpen] = useState(false);
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);

  const handleCreateNewCase = () => {
    setIsClinicModalOpen(true);
  };

  const handleClinicSelected = async (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setIsCreatingCase(true);
    
    try {
      // Create new case with selected clinic
      const response = await apiFetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinic_id: clinic.id,
          metadata: {
            language: 'fr'
          }
        }),
      });

      if (response.success) {
        const caseId = response.data.id;
        
        // Notify parent component if callback provided
        if (onCaseCreated) {
          onCaseCreated(caseId);
        }
        
        // Navigate to the new case
        navigate(`/case/new?caseId=${caseId}`);
      } else {
        console.error('Failed to create case:', response.error);
        alert('Erreur lors de la création du cas. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Error creating case:', error);
      alert('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsCreatingCase(false);
      setSelectedClinic(null);
    }
  };

  const handleModalClose = () => {
    setIsClinicModalOpen(false);
    setSelectedClinic(null);
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Plus className="h-5 w-5 text-blue-600" />
            <span>Nouveau cas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Créer un nouveau cas d'évaluation CNESST
          </p>
          
          {selectedClinic && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Clinique sélectionnée: {selectedClinic.name}
                </span>
              </div>
            </div>
          )}
          
          <Button 
            onClick={handleCreateNewCase}
            disabled={isCreatingCase}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isCreatingCase ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Création en cours...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Créer un nouveau cas
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <ClinicSelectionModal
        isOpen={isClinicModalOpen}
        onClose={handleModalClose}
        onSelectClinic={handleClinicSelected}
        title="Sélectionner votre clinique"
        description="Choisissez la clinique où vous travaillez aujourd'hui pour créer un nouveau cas"
      />
    </>
  );
};
