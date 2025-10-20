import React, { useState, useEffect, useRef } from 'react';
import { Building2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

interface ClinicSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClinic: (clinic: Clinic) => void;
  title?: string;
  description?: string;
}

export const ClinicSelectionModal: React.FC<ClinicSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectClinic,
  title = "Sélectionner votre clinique",
  description = "Choisissez la clinique où vous travaillez aujourd'hui"
}) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const inFlightRef = useRef(false);

  // Fetch clinics when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchClinics();
    }
  }, [isOpen]);

  const fetchClinics = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const data = await apiFetch('/api/clinics');
      
      if (data.success) {
        setClinics(data.data);
      } else {
        setError('Erreur lors du chargement des cliniques');
      }
    } catch (err) {
      console.error('Error fetching clinics:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectClinic = async (e?: React.MouseEvent) => {
    // Prevent form submission if this is inside a form
    if (e) {
      e.preventDefault();
    }
    
    // Early return if no clinic selected or already in flight
    if (!selectedClinic || inFlightRef.current) return;
    
    const clinic = clinics.find(c => c.id === selectedClinic);
    if (!clinic) return;
    
    try {
      inFlightRef.current = true;
      console.info("[NewCase] creating case", { clinicId: clinic.id, clinicName: clinic.name });
      
      await onSelectClinic(clinic);
      onClose();
    } finally {
      inFlightRef.current = false;
    }
  };

  const handleClose = () => {
    setSelectedClinic('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">{description}</p>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Chargement des cliniques...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchClinics}
                className="mt-2"
              >
                Réessayer
              </Button>
            </div>
          )}

          {!isLoading && !error && clinics.length > 0 && (
            <div className="relative max-h-[80vh] overflow-y-auto z-[60]">
              <div className="space-y-3">
                {clinics.map((clinic) => (
                  <Card
                    key={clinic.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedClinic === clinic.id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedClinic(clinic.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          <input
                            type="radio"
                            name="clinic"
                            value={clinic.id}
                            checked={selectedClinic === clinic.id}
                            onChange={() => setSelectedClinic(clinic.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {clinic.name}
                          </h3>
                          {clinic.address && (
                            <p className="text-sm text-gray-600 mt-1">
                              📍 {clinic.address}
                            </p>
                          )}
                          {clinic.phone && (
                            <p className="text-sm text-gray-600">
                              📞 {clinic.phone}
                            </p>
                          )}
                          {clinic.email && (
                            <p className="text-sm text-gray-600">
                              ✉️ {clinic.email}
                            </p>
                          )}
                        </div>
                        {selectedClinic === clinic.id && (
                          <div className="flex-shrink-0">
                            <Check className="h-5 w-5 text-blue-600" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!isLoading && !error && clinics.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune clinique disponible</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t">
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button 
              type="button"
              onClick={handleSelectClinic}
              disabled={!selectedClinic || inFlightRef.current}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Check className="h-4 w-4 mr-2" />
              {inFlightRef.current ? 'Création...' : 'Sélectionner'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
