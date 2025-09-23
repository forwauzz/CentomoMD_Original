import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Specialty = 'orthopedics' | 'neuro' | null;

interface SpecialtyContextType {
  specialty: Specialty;
  setSpecialty: (specialty: Specialty) => void;
  isNeuro: boolean;
  isOrthopedics: boolean;
}

const SpecialtyContext = createContext<SpecialtyContextType | undefined>(undefined);

interface SpecialtyProviderProps {
  children: ReactNode;
}

export const SpecialtyProvider: React.FC<SpecialtyProviderProps> = ({ children }) => {
  const [specialty, setSpecialtyState] = useState<Specialty>(null);

  // Load specialty from localStorage on mount
  useEffect(() => {
    const savedSpecialty = localStorage.getItem('selectedSpecialty') as Specialty;
    if (savedSpecialty && (savedSpecialty === 'orthopedics' || savedSpecialty === 'neuro')) {
      setSpecialtyState(savedSpecialty);
    }
  }, []);

  const setSpecialty = (newSpecialty: Specialty) => {
    setSpecialtyState(newSpecialty);
    if (newSpecialty) {
      localStorage.setItem('selectedSpecialty', newSpecialty);
    } else {
      localStorage.removeItem('selectedSpecialty');
    }
  };

  const isNeuro = specialty === 'neuro';
  const isOrthopedics = specialty === 'orthopedics';

  return (
    <SpecialtyContext.Provider value={{
      specialty,
      setSpecialty,
      isNeuro,
      isOrthopedics,
    }}>
      {children}
    </SpecialtyContext.Provider>
  );
};

export const useSpecialty = (): SpecialtyContextType => {
  const context = useContext(SpecialtyContext);
  if (context === undefined) {
    throw new Error('useSpecialty must be used within a SpecialtyProvider');
  }
  return context;
};
