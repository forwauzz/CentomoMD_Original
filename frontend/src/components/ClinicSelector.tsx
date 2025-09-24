import React, { useState, useEffect } from 'react';
import { Select } from '@/components/ui/select';
import { fetchClinics, Clinic } from '@/lib/api';
import { getSelectedClinic, setSelectedClinic } from '@/lib/clinicSession';
import { Loader2, Building2 } from 'lucide-react';

interface ClinicSelectorProps {
  onClinicChange?: (clinic: Clinic | null) => void;
  className?: string;
  placeholder?: string;
}

export const ClinicSelector: React.FC<ClinicSelectorProps> = ({
  onClinicChange,
  className = '',
  placeholder = 'Select a clinic...'
}) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinicState] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load clinics on component mount
  useEffect(() => {
    const loadClinics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const clinicsData = await fetchClinics();
        setClinics(clinicsData);
        
        // Load previously selected clinic from session
        const savedClinic = getSelectedClinic();
        if (savedClinic) {
          // Verify the saved clinic still exists in the fetched clinics
          const clinicExists = clinicsData.find(c => c.id === savedClinic.id);
          if (clinicExists) {
            setSelectedClinicState(clinicExists);
          } else {
            // Clear invalid clinic from session
            setSelectedClinic(null);
          }
        }
      } catch (err) {
        console.error('Failed to load clinics:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load clinics';
        
        // Check if it's a connection error
        if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch')) {
          setError('Unable to connect to server. Please check if the backend is running.');
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to allow backend to start up
    const timeoutId = setTimeout(loadClinics, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Handle clinic selection change
  const handleClinicChange = (clinicId: string) => {
    const clinic = clinics.find(c => c.id === clinicId) || null;
    
    // Update local state
    setSelectedClinicState(clinic);
    
    // Save to session storage
    setSelectedClinic(clinic);
    
    // Notify parent component
    if (onClinicChange) {
      onClinicChange(clinic);
    }
    
    console.log('🏥 Clinic selected:', clinic?.name || 'None');
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-500">Loading clinics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-sm text-red-500">Error: {error}</span>
      </div>
    );
  }

  if (clinics.length === 0) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Building2 className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">No clinics available</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Building2 className="h-4 w-4 text-gray-400" />
      <Select
        value={selectedClinic?.id || ''}
        onValueChange={handleClinicChange}
        items={(clinics || []).map((clinic) => ({
          value: clinic.id,
          label: clinic.name
        }))}
        className="w-full"
      />
    </div>
  );
};

export default ClinicSelector;
