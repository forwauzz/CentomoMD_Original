import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session, SessionFormData } from '@/types';
import { apiFetch } from '@/lib/api';

interface SessionState {
  // Current session
  currentSession: Session | null;
  sessions: Session[];
  loading: boolean;
  error: string | null;
  
  // Actions
  createSession: (sessionData: SessionFormData) => Promise<{ success: boolean; session?: Session; error?: string }>;
  getSessions: () => Promise<{ success: boolean; sessions?: Session[]; error?: string }>;
  getSession: (sessionId: string) => Promise<{ success: boolean; session?: Session; error?: string }>;
  updateSession: (sessionId: string, updates: Partial<Session>) => Promise<{ success: boolean; session?: Session; error?: string }>;
  endSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  setCurrentSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearSessions: () => void;
  
  // Case switching actions
  hasActiveCase: () => boolean;
  getCurrentCaseId: () => number | null;
  switchToNewCase: (newCaseId: number) => Promise<{ success: boolean; session?: Session; error?: string }>;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      sessions: [],
      loading: false,
      error: null,
      
      // Actions
      createSession: async (sessionData) => {
        set({ loading: true, error: null });
        
        try {
          const response = await apiFetch<{ success: boolean; data: Session }>('/api/sessions', {
            method: 'POST',
            body: JSON.stringify({
              patient_id: sessionData.patientId,
              case_id: sessionData.caseId,
              consent_verified: sessionData.consentVerified,
              mode: sessionData.mode,
              current_section: sessionData.currentSection,
            }),
          });

          if (response.success) {
            const newSession = response.data;
            set((state) => ({
              currentSession: newSession,
              sessions: [...state.sessions, newSession],
              loading: false,
            }));
            
            return { success: true, session: newSession };
          } else {
            throw new Error('Failed to create session');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },
      
      getSessions: async () => {
        set({ loading: true, error: null });
        
        try {
          const response = await apiFetch<{ success: boolean; data: Session[] }>('/api/sessions');
          
          if (response.success) {
            set({ sessions: response.data, loading: false });
            return { success: true, sessions: response.data };
          } else {
            throw new Error('Failed to fetch sessions');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },
      
      getSession: async (sessionId) => {
        set({ loading: true, error: null });
        
        try {
          const response = await apiFetch<{ success: boolean; data: Session }>(`/api/sessions/${sessionId}`);
          
          if (response.success) {
            set({ loading: false });
            return { success: true, session: response.data };
          } else {
            throw new Error('Failed to fetch session');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },
      
      updateSession: async (sessionId, updates) => {
        set({ loading: true, error: null });
        
        try {
          const response = await apiFetch<{ success: boolean; data: Session }>(`/api/sessions/${sessionId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
          });
          
          if (response.success) {
            const updatedSession = response.data;
            set((state) => ({
              currentSession: state.currentSession?.id === sessionId ? updatedSession : state.currentSession,
              sessions: state.sessions.map(s => s.id === sessionId ? updatedSession : s),
              loading: false,
            }));
            
            return { success: true, session: updatedSession };
          } else {
            throw new Error('Failed to update session');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },
      
      endSession: async (sessionId) => {
        set({ loading: true, error: null });
        
        try {
          const response = await apiFetch<{ success: boolean }>(`/api/sessions/${sessionId}`, {
            method: 'PATCH',
            body: JSON.stringify({ 
              status: 'completed',
              ended_at: new Date().toISOString()
            }),
          });
          
          if (response.success) {
            set((state) => ({
              currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
              sessions: state.sessions.map(s => 
                s.id === sessionId 
                  ? { ...s, status: 'completed' as const, ended_at: new Date().toISOString() }
                  : s
              ),
              loading: false,
            }));
            
            return { success: true };
          } else {
            throw new Error('Failed to end session');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },
      
      setCurrentSession: (session) => {
        set({ currentSession: session });
      },
      
      setLoading: (loading) => {
        set({ loading });
      },
      
      setError: (error) => {
        set({ error });
      },
      
      clearSessions: () => {
        set({
          currentSession: null,
          sessions: [],
          loading: false,
          error: null,
        });
      },
      
      // Case switching actions
      hasActiveCase: () => {
        const currentSession = get().currentSession;
        return currentSession !== null && currentSession.case_id !== null && currentSession.case_id !== undefined;
      },
      
      getCurrentCaseId: () => {
        const currentSession = get().currentSession;
        return currentSession?.case_id || null;
      },
      
      switchToNewCase: async (newCaseId: number) => {
        const currentSession = get().currentSession;
        if (!currentSession) {
          return { success: false, error: 'No active session to update' };
        }
        
        set({ loading: true, error: null });
        
        try {
          const response = await apiFetch<{ success: boolean; data: Session }>(`/api/sessions/${currentSession.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              case_id: newCaseId,
              updated_at: new Date().toISOString(),
            }),
          });
          
          if (response.success) {
            const updatedSession = response.data;
            set((state) => ({
              currentSession: updatedSession,
              sessions: state.sessions.map(s => s.id === currentSession.id ? updatedSession : s),
              loading: false,
            }));
            
            return { success: true, session: updatedSession };
          } else {
            throw new Error('Failed to update session with new case ID');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }
      },
    }),
    {
      name: 'session-storage',
      partialize: (state) => ({
        currentSession: state.currentSession,
        sessions: state.sessions,
      }),
    }
  )
);
