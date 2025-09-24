/**
 * Clinic Session Management
 * Handles storing and retrieving the selected clinic in session storage
 */

import { Clinic } from './api';

const CLINIC_SESSION_KEY = 'selected_clinic';

export interface ClinicSession {
  clinic: Clinic | null;
  lastUpdated: string;
}

// Get the currently selected clinic from session storage
export const getSelectedClinic = (): Clinic | null => {
  try {
    const stored = sessionStorage.getItem(CLINIC_SESSION_KEY);
    if (stored) {
      const session: ClinicSession = JSON.parse(stored);
      return session.clinic;
    }
  } catch (error) {
    console.warn('Failed to parse clinic session:', error);
  }
  return null;
};

// Set the selected clinic in session storage
export const setSelectedClinic = (clinic: Clinic | null): void => {
  try {
    const session: ClinicSession = {
      clinic,
      lastUpdated: new Date().toISOString()
    };
    sessionStorage.setItem(CLINIC_SESSION_KEY, JSON.stringify(session));
    console.log('✅ Clinic session updated:', clinic?.name || 'None');
  } catch (error) {
    console.error('Failed to save clinic session:', error);
  }
};

// Clear the clinic session
export const clearClinicSession = (): void => {
  try {
    sessionStorage.removeItem(CLINIC_SESSION_KEY);
    console.log('✅ Clinic session cleared');
  } catch (error) {
    console.error('Failed to clear clinic session:', error);
  }
};

// Get the full clinic session data
export const getClinicSession = (): ClinicSession | null => {
  try {
    const stored = sessionStorage.getItem(CLINIC_SESSION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to parse clinic session:', error);
  }
  return null;
};
