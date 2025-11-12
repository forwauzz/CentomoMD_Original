/**
 * Calendar utilities for managing case appointments
 */

import { getAllAssignments, AssignedCase } from './adminCaseAssignment';

// Mock doctor names - in production, this would come from API
const MOCK_DOCTORS: Record<string, string> = {
  'doctor-1': 'Dr. Harry Durusso',
  'doctor-2': 'Dr. Marie Dubois',
  'doctor-3': 'Dr. Jean Tremblay',
};

export interface CalendarEvent {
  id: string;
  caseId: string;
  caseName: string;
  doctorId: string;
  doctorName: string;
  date: string; // ISO date string (YYYY-MM-DD)
  time: string; // Time string (HH:mm)
  status: 'scheduled' | 'completed' | 'cancelled';
}

const CALENDAR_STORAGE_KEY = 'techemd_calendar_events';

/**
 * Get all calendar events
 */
export const getAllCalendarEvents = (): CalendarEvent[] => {
  try {
    const stored = localStorage.getItem(CALENDAR_STORAGE_KEY);
    if (!stored) {
      // Generate events from assigned cases that have scheduled dates
      return generateEventsFromCases();
    }
    
    const events: CalendarEvent[] = JSON.parse(stored);
    return events;
  } catch (error) {
    console.error('Error loading calendar events:', error);
    return [];
  }
};

/**
 * Generate calendar events from assigned cases
 */
const generateEventsFromCases = (): CalendarEvent[] => {
  const allCases = getAllAssignments();
  const events: CalendarEvent[] = [];

  allCases.forEach((case_) => {
    if (case_.scheduledDate && case_.scheduledTime && case_.assignedTo) {
      events.push({
        id: `event-${case_.id}`,
        caseId: case_.id,
        caseName: case_.patientName || case_.claimId || case_.fileName,
        doctorId: case_.assignedTo,
        doctorName: MOCK_DOCTORS[case_.assignedTo] || 'Unknown Doctor',
        date: case_.scheduledDate,
        time: case_.scheduledTime,
        status: case_.appointmentStatus || 'scheduled',
      });
    }
  });

  // Save to storage
  localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(events));
  return events;
};

/**
 * Book a case to a specific date and time
 */
export const bookCaseAppointment = (
  caseId: string,
  date: string,
  time: string
): void => {
  try {
    // Update the case assignment
    const stored = localStorage.getItem('techemd_admin_assignments');
    if (!stored) return;

    const assignments: AssignedCase[] = JSON.parse(stored);
    const updated = assignments.map((a) => {
      if (a.id === caseId) {
        return {
          ...a,
          scheduledDate: date,
          scheduledTime: time,
          appointmentStatus: 'scheduled' as const,
        };
      }
      return a;
    });

    localStorage.setItem('techemd_admin_assignments', JSON.stringify(updated));

    // Update calendar events
    const events = getAllCalendarEvents();
    const existingEventIndex = events.findIndex((e) => e.caseId === caseId);
    
    const newEvent: CalendarEvent = {
      id: `event-${caseId}`,
      caseId,
      caseName: updated.find((a) => a.id === caseId)?.patientName || 
                updated.find((a) => a.id === caseId)?.claimId || 
                updated.find((a) => a.id === caseId)?.fileName || 
                'Unknown Case',
      doctorId: updated.find((a) => a.id === caseId)?.assignedTo || '',
      doctorName: MOCK_DOCTORS[updated.find((a) => a.id === caseId)?.assignedTo || ''] || 'Unknown Doctor',
      date,
      time,
      status: 'scheduled',
    };

    if (existingEventIndex >= 0) {
      events[existingEventIndex] = newEvent;
    } else {
      events.push(newEvent);
    }

    localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(events));
    
    // Dispatch event for updates
    window.dispatchEvent(new Event('assignmentUpdated'));
    window.dispatchEvent(new Event('calendarUpdated'));
  } catch (error) {
    console.error('Error booking appointment:', error);
  }
};

/**
 * Get calendar events for a specific doctor
 */
export const getCalendarEventsForDoctor = (doctorId: string): CalendarEvent[] => {
  const allEvents = getAllCalendarEvents();
  return allEvents.filter((e) => e.doctorId === doctorId);
};

/**
 * Get calendar events for a specific date
 */
export const getCalendarEventsForDate = (date: string): CalendarEvent[] => {
  const allEvents = getAllCalendarEvents();
  return allEvents.filter((e) => e.date === date);
};

/**
 * Update appointment status
 */
export const updateAppointmentStatus = (
  caseId: string,
  status: 'scheduled' | 'completed' | 'cancelled'
): void => {
  try {
    // Update case assignment
    const stored = localStorage.getItem('techemd_admin_assignments');
    if (stored) {
      const assignments: AssignedCase[] = JSON.parse(stored);
      const updated = assignments.map((a) => {
        if (a.id === caseId) {
          return { ...a, appointmentStatus: status };
        }
        return a;
      });
      localStorage.setItem('techemd_admin_assignments', JSON.stringify(updated));
    }

    // Update calendar events
    const events = getAllCalendarEvents();
    const updatedEvents = events.map((e) => {
      if (e.caseId === caseId) {
        return { ...e, status };
      }
      return e;
    });
    localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(updatedEvents));

    window.dispatchEvent(new Event('assignmentUpdated'));
    window.dispatchEvent(new Event('calendarUpdated'));
  } catch (error) {
    console.error('Error updating appointment status:', error);
  }
};

