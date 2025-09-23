import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSpecialty } from '@/contexts/SpecialtyContext';
import { ROUTES } from '@/lib/constants';

export const DefaultRouteHandler: React.FC = () => {
  const { specialty } = useSpecialty();

  // If no specialty is selected, redirect to specialty selection
  if (!specialty) {
    return <Navigate to={ROUTES.SPECIALTY_SELECTION} replace />;
  }

  // If Neuro specialty, redirect to Neuro dashboard
  if (specialty === 'neuro') {
    return <Navigate to={ROUTES.NEURO_DASHBOARD} replace />;
  }

  // If Orthopedics specialty, redirect to regular dashboard
  if (specialty === 'orthopedics') {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // Fallback to specialty selection
  return <Navigate to={ROUTES.SPECIALTY_SELECTION} replace />;
};
