import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';

export const useNeuroSession = () => {
  const navigate = useNavigate();

  // Check if we're in a Neuro session context
  const isNeuroSession = useCallback(() => {
    const sessionData = localStorage.getItem('neuroSessionData');
    return !!sessionData;
  }, []);

  // Save formatted content back to Neuro session
  const saveToNeuroSession = useCallback((formattedContent: string) => {
    // Store the formatted content for the Neuro session to pick up
    localStorage.setItem('neuroDictationResults', JSON.stringify({
      formattedContent,
      timestamp: new Date().toISOString()
    }));

    // Navigate back to Neuro session
    navigate(ROUTES.NEURO_SESSION);
  }, [navigate]);

  // Get Neuro session data
  const getNeuroSessionData = useCallback(() => {
    const sessionData = localStorage.getItem('neuroSessionData');
    if (sessionData) {
      try {
        return JSON.parse(sessionData);
      } catch (error) {
        console.error('Error parsing Neuro session data:', error);
        return null;
      }
    }
    return null;
  }, []);

  return {
    isNeuroSession,
    saveToNeuroSession,
    getNeuroSessionData
  };
};
