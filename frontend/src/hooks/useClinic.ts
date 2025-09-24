import { useState, useEffect, useCallback } from 'react';
import { Clinic } from '@/lib/api';
import { getSelectedClinic, setSelectedClinic } from '@/lib/clinicSession';

export interface UseClinicReturn {
  selectedClinic: Clinic | null;
  setClinic: (clinic: Clinic | null) => void;
  clearClinic: () => void;
  isClinicSelected: boolean;
}

/**
 * Custom hook for managing clinic selection
 * Provides clinic state management with session persistence
 */
export const useClinic = (): UseClinicReturn => {
  const [selectedClinic, setSelectedClinicState] = useState<Clinic | null>(null);

  // Load clinic from session on mount
  useEffect(() => {
    const savedClinic = getSelectedClinic();
    if (savedClinic) {
      setSelectedClinicState(savedClinic);
    }
  }, []);

  // Set clinic and persist to session
  const setClinic = useCallback((clinic: Clinic | null) => {
    setSelectedClinicState(clinic);
    setSelectedClinic(clinic);
  }, []);

  // Clear clinic selection
  const clearClinic = useCallback(() => {
    setSelectedClinicState(null);
    setSelectedClinic(null);
  }, []);

  return {
    selectedClinic,
    setClinic,
    clearClinic,
    isClinicSelected: selectedClinic !== null
  };
};
