import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { formSchemaLoader, FormSchema, Section, SectionData } from '@/lib/formSchema';
import { Case as NewCase, CaseContext } from '@/types/case';
import { apiFetch } from '@/lib/api';
import { useUserStore } from '@/stores/userStore';
import { getSectionTitle, CNESST_SECTIONS } from '@/lib/constants';

// Legacy types for backward compatibility
interface LegacySection {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  data: Record<string, any>;
  lastModified: string;
  audioRequired: boolean;
}

interface LegacyCase {
  id: string;
  sections: LegacySection[];
  createdAt: string;
  updatedAt: string;
}

interface Case {
  id: string;
  user_id: string;
  clinic_id: string;
  name: string;
  status: 'draft' | 'in_progress' | 'completed';
  draft: FormSchema;
  created_at: string;
  updated_at: string;
}

interface CaseState {
  currentCase: Case | null;
  schema: FormSchema | null;
  activeSectionId: string;
  isDirty: boolean;
  lastSaved: string;
  autosaveTimestamps: Record<string, string>;
  isLoading: boolean;
  isSaving: boolean;
  sectionSavingStates: Record<string, boolean>;
  sectionErrorStates: Record<string, boolean>;
  loadSchema: () => Promise<void>;
  loadCase: (caseId: string) => Promise<void>;
  createCase: () => Promise<string>;
  updateCaseDraft: (draft: FormSchema) => void;
  updateSectionData: (sectionId: string, data: SectionData) => void;
  commitSection: (sectionId: string, data: SectionData) => Promise<void>;
  saveCase: () => Promise<void>;
  setActiveSection: (sectionId: string) => Promise<void>;
  getSectionStatus: (sectionId: string) => string;
  getAutosaveTimestamp: (sectionId: string) => string | null;
  setSectionSaving: (sectionId: string, isSaving: boolean) => void;
  setSectionError: (sectionId: string, hasError: boolean) => void;
  resetCase: () => void;
  createSession: (sectionId: string, transcript: string, metadata?: any) => Promise<any>;
  commitSectionFromSession: (sectionId: string, sessionId: string, finalText: string) => Promise<any>;
  generateSection11FromSections: () => Promise<any>;
  updateSection: (sectionId: string, data: Record<string, any>) => void;
  saveSection: (sectionId: string) => void;
  initializeCase: (sections: LegacySection[]) => void;
  updateSectionTitles: (sectionTitles: Record<string, string>) => void;
  sections: LegacySection[];
  createNewCase: (patientInfo?: any) => Promise<string>;
  loadNewCase: (caseId: string) => Promise<NewCase | null>;
  updateNewCaseSection: (caseId: string, sectionId: string, data: any, status?: string) => Promise<any>;
  linkDictationSession: (caseId: string, sessionId: string, sectionId: string, content?: string, formattedContent?: string) => Promise<any>;
  updateCaseName: (caseId: string, name: string) => Promise<any>;
  completeCase: (caseId: string) => Promise<any>;
  markCaseInProgress: (caseId: string) => Promise<any>;
  getCaseContext: (caseId: string, sectionId: string) => CaseContext | null;
  getRecentCases: (limit?: number) => Promise<any[]>;
  deleteCase: (caseId: string) => Promise<boolean>;
  hasUnsavedChanges: () => boolean;
  saveDraft: () => Promise<void>;
}

// Legacy helper functions
const isLegacyFormat = (data: any): boolean => {
  return data && typeof data === 'object' && !data.draft && Array.isArray(data.sections);
};

const migrateLegacyCaseData = (legacyData: LegacyCase, schema: FormSchema): FormSchema => {
  // Convert legacy case data to new format
  const sectionsMap: Record<string, Section> = {};
  legacyData.sections.forEach(section => {
    sectionsMap[section.id] = {
      id: section.id,
      title: section.title,
      status: section.status,
      audioRequired: section.audioRequired,
      data: section.data,
      lastModified: section.lastModified
    };
  });
  
  return {
    ...schema,
    sections: sectionsMap
  };
};

export const useCaseStore = create<CaseState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentCase: null,
      schema: null,
      activeSectionId: '',
      isDirty: false,
      lastSaved: '',
      autosaveTimestamps: {},
      isLoading: false,
      isSaving: false,
      sectionSavingStates: {},
      sectionErrorStates: {},
      
      // Actions
      loadSchema: async () => {
        set({ isLoading: true });
        try {
          const schema = await formSchemaLoader.loadSchema();
          set({ schema });
        } catch (error) {
          console.error('Failed to load schema:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      loadCase: async (caseId: string) => {
        set({ isLoading: true });
        try {
          const result = await apiFetch(`/api/cases/${caseId}`);
          const caseData = result.data as Case;

          // Ensure schema loaded for UI fallbacks
          if (!get().schema) {
            await get().loadSchema();
          }
          const schema = get().schema;
          const activeFromDraft = (caseData.draft as any)?.ui?.activeSectionId as string | undefined;
          const firstFromSchema = schema?.ui?.order?.[0];
          const firstLegacy = CNESST_SECTIONS[0]?.id;
          const nextActive = activeFromDraft || firstFromSchema || firstLegacy || '';

          set({ currentCase: caseData, activeSectionId: nextActive, isDirty: false });
          console.log('✅ Case loaded from backend:', caseData.id);
        } catch (error) {
          console.error('❌ Failed to load case:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      createCase: async (): Promise<string> => {
        set({ isLoading: true });
        try {
          // Load schema if not already loaded
          if (!get().schema) {
            await get().loadSchema();
          }
          
          const schema = get().schema;
          if (!schema) throw new Error('Schema not loaded');
          
          const caseId = crypto.randomUUID();
          const newCase: Case = {
            id: caseId,
            user_id: 'current-user', // TODO: Get from auth
            clinic_id: 'current-clinic', // TODO: Get from auth
            name: 'Nouveau cas',
            status: 'draft',
            draft: schema,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          set({ 
            currentCase: newCase,
            activeSectionId: schema.ui.activeSectionId,
            isDirty: false
          });
          
          console.log('✅ Case created successfully:', caseId);
          return caseId;
        } catch (error) {
          console.error('❌ Failed to create case:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      updateCaseDraft: (draft: FormSchema) => {
        const currentCase = get().currentCase;
        if (currentCase) {
          set({
            currentCase: {
              ...currentCase,
              draft,
              updated_at: new Date().toISOString()
            },
            isDirty: true
          });
        }
      },
      
      updateSectionData: (sectionId: string, data: SectionData) => {
        const currentCase = get().currentCase;
        if (!currentCase) return;
        
        // Ensure sections object exists
        const sections = currentCase.draft.sections || {};
        const existingSection = sections[sectionId];
        
        const updatedDraft = {
          ...currentCase.draft,
          sections: {
            ...sections,
            [sectionId]: {
              ...existingSection,
              data: {
                ...(existingSection?.data || {}),
                ...data
              },
              status: (existingSection?.status || 'in_progress') as 'in_progress' | 'completed' | 'not_started',
              lastModified: new Date().toISOString()
            }
          }
        };
        
        // Update autosave timestamp
        const updatedTimestamps = {
          ...get().autosaveTimestamps,
          [sectionId]: new Date().toISOString()
        };
        
        set({
          currentCase: {
            ...currentCase,
            draft: updatedDraft,
            updated_at: new Date().toISOString()
          },
          autosaveTimestamps: updatedTimestamps,
          isDirty: true
        });

        // Auto-save to backend if case management is enabled
        if (currentCase.id) {
          // Debounce backend updates to avoid too many API calls
          const debounceKey = `update_${currentCase.id}_${sectionId}`;
          const existingTimeout = (window as any)[debounceKey];
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }
          
          (window as any)[debounceKey] = setTimeout(async () => {
            try {
              await get().updateNewCaseSection(currentCase.id, sectionId, data, 'in_progress');
              console.log('✅ Auto-saved section to backend:', sectionId);
            } catch (error) {
              console.error('❌ Failed to auto-save section to backend:', error);
            }
          }, 1000); // 1 second debounce
        }
      },
      
      commitSection: async (sectionId: string, data: SectionData) => {
        set({ isSaving: true });
        try {
          const currentCase = get().currentCase;
          
          // Update local state
          get().updateSectionData(sectionId, data);
          
          // Mark section as completed in local state
          if (currentCase) {
            const sections = currentCase.draft.sections || {};
            const existingSection = sections[sectionId];
            
            const updatedDraft = {
              ...currentCase.draft,
              sections: {
                ...sections,
                [sectionId]: {
                  ...existingSection,
                  data: existingSection?.data || data,
                  status: 'completed' as const,
                  lastModified: new Date().toISOString()
                }
              }
            };
            
            set({
              currentCase: {
                ...currentCase,
                draft: updatedDraft,
                updated_at: new Date().toISOString()
              }
            });
          }
          
          // Save to backend if case management is enabled
          if (currentCase?.id) {
            try {
              await get().updateNewCaseSection(currentCase.id, sectionId, data, 'completed');
              console.log('✅ Section committed to backend:', sectionId);
            } catch (error) {
              console.error('❌ Failed to commit section to backend:', error);
            }
          }
          
          console.log('✅ Section committed successfully:', sectionId);
        } catch (error) {
          console.error('❌ Failed to commit section:', error);
          throw error;
        } finally {
          set({ isSaving: false });
        }
      },
      
      saveCase: async () => {
        set({ isSaving: true });
        try {
          const currentCase = get().currentCase;
          if (!currentCase) throw new Error('No case to save');
          
          // TODO: Implement API call to save case to backend
          // await api.saveCase(currentCase);
          
          set({ 
            isDirty: false,
            lastSaved: new Date().toLocaleTimeString()
          });
          
          console.log('✅ Case saved successfully');
        } catch (error) {
          console.error('❌ Failed to save case:', error);
          throw error;
        } finally {
          set({ isSaving: false });
        }
      },
      
      setActiveSection: async (sectionId: string) => {
        const currentCase = get().currentCase;
        const currentSectionId = get().activeSectionId;
        
        // Auto-save current section before switching if there are unsaved changes
        if (currentCase?.id && currentSectionId && currentSectionId !== sectionId) {
          const sections = currentCase.draft.sections || {};
          const currentSection = sections[currentSectionId];
          
          if (currentSection && currentSection.status === 'in_progress') {
            try {
              await get().updateNewCaseSection(
                currentCase.id, 
                currentSectionId, 
                currentSection.data, 
                'in_progress'
              );
              console.log('✅ Auto-saved section before switching:', currentSectionId);
            } catch (error) {
              console.error('❌ Failed to auto-save section:', error);
            }
          }
        }
        
        set({ activeSectionId: sectionId });
        
        // Update schema UI state
        if (currentCase) {
          const updatedDraft = {
            ...currentCase.draft,
            ui: {
              ...currentCase.draft.ui,
              activeSectionId: sectionId
            }
          };
          
          set({
            currentCase: {
              ...currentCase,
              draft: updatedDraft
            }
          });
        }
      },
      
      getSectionStatus: (sectionId: string) => {
        const state = get();
        
        // Check for error state first
        if (state.sectionErrorStates[sectionId]) {
          return 'error';
        }
        
        // Check for saving state
        if (state.sectionSavingStates[sectionId]) {
          return 'saving';
        }
        
        // Check case status
        const currentCase = state.currentCase;
        if (currentCase && currentCase.draft.sections[sectionId]) {
          return currentCase.draft.sections[sectionId].status;
        }
        
        return 'not_started';
      },
      
      getAutosaveTimestamp: (sectionId: string) => {
        return get().autosaveTimestamps[sectionId] || null;
      },

      setSectionSaving: (sectionId: string, isSaving: boolean) => {
        set(state => ({
          sectionSavingStates: {
            ...state.sectionSavingStates,
            [sectionId]: isSaving
          }
        }));
      },

      setSectionError: (sectionId: string, hasError: boolean) => {
        set(state => ({
          sectionErrorStates: {
            ...state.sectionErrorStates,
            [sectionId]: hasError
          }
        }));
      },
      
      resetCase: () => {
        set({
          currentCase: null,
          activeSectionId: '',
          isDirty: false,
          lastSaved: '',
          autosaveTimestamps: {},
          isSaving: false
        });
      },

      // Session management actions
      createSession: async (sectionId: string, transcript: string, metadata?: any) => {
        try {
          const response = await apiFetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sectionId,
              transcript,
              metadata: metadata || {},
            }),
          });
          
          return response;
        } catch (error) {
          console.error('Failed to create session:', error);
          throw error;
        }
      },

      commitSectionFromSession: async (sectionId: string, sessionId: string, finalText: string) => {
        try {
          const response = await apiFetch(`/api/cases/${get().currentCase?.id}/sections/${sectionId}/commit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              finalText,
            }),
          });
          
          // Update local state
          const currentCase = get().currentCase;
          if (currentCase) {
            const updatedCase = {
              ...currentCase,
              draft: {
                ...currentCase.draft,
                sections: {
                  ...currentCase.draft.sections,
                  [sectionId]: {
                    ...currentCase.draft.sections[sectionId],
                    data: {
                      ...currentCase.draft.sections[sectionId].data,
                      finalText,
                    },
                    lastModified: new Date().toISOString(),
                  },
                },
              },
            };
            set({ currentCase: updatedCase, isDirty: true });
          }
          
          return await response.json();
        } catch (error) {
          console.error('Failed to commit section:', error);
          throw error;
        }
      },

      generateSection11FromSections: async () => {
        try {
          const response = await apiFetch('/api/format/merge/section11', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              caseId: get().currentCase?.id,
              sourceSections: ['section_7', 'section_8', 'section_9'],
            }),
          });
          
          const result = response;
          
          // Update section 11 with generated content
          const currentCase = get().currentCase;
          if (currentCase && result.autoSummary) {
            const updatedCase = {
              ...currentCase,
              draft: {
                ...currentCase.draft,
                sections: {
                  ...currentCase.draft.sections,
                  section_11: {
                    ...currentCase.draft.sections.section_11,
                    data: {
                      ...currentCase.draft.sections.section_11.data,
                      autoSummary: result.autoSummary,
                      finalText: result.autoSummary,
                    },
                    lastModified: new Date().toISOString(),
                  },
                },
              },
            };
            set({ currentCase: updatedCase, isDirty: true });
          }
          
          return result;
        } catch (error) {
          console.error('Failed to generate section 11:', error);
          throw error;
        }
      },

      // Backward compatibility methods
      updateSection: (sectionId: string, data: Record<string, any>) => {
        get().updateSectionData(sectionId, data);
      },
      
      saveSection: (sectionId: string) => {
        const currentCase = get().currentCase;
        if (currentCase) {
          const sections = currentCase.draft.sections || {};
          const existingSection = sections[sectionId];
          
          if (existingSection) {
            const updatedDraft = {
              ...currentCase.draft,
              sections: {
                ...sections,
                [sectionId]: {
                  ...existingSection,
                  status: 'completed' as const,
                  lastModified: new Date().toISOString()
                }
              }
            };
            
            set({
              currentCase: {
                ...currentCase,
                draft: updatedDraft,
                updated_at: new Date().toISOString()
              }
            });
          }
        }
      },
      
      initializeCase: (sections: LegacySection[]) => {
        // Convert legacy sections to new format
        const sectionsMap: Record<string, Section> = {};
        sections.forEach(section => {
          sectionsMap[section.id] = {
            id: section.id,
            title: section.title,
            status: section.status,
            audioRequired: section.audioRequired,
            data: section.data,
            lastModified: section.lastModified
          };
        });
        
        const schema: FormSchema = {
          caseId: `case_${Date.now()}`,
          patientInfo: { name: '', dob: '', healthCard: '', phone: '', address: '' },
          physicianInfo: { lastName: '', firstName: '', license: '', address: '', phone: '', email: '' },
          meta: { language: 'fr', createdAt: null, updatedAt: null, export: { status: 'not_exported', lastExportAt: null, lastExportFormat: null } },
          ui: { activeSectionId: sections[0]?.id || '', order: sections.map(s => s.id), autosave: {} },
          sections: sectionsMap,
          sessions: []
        };
        
        const profile = useUserStore.getState().profile;
        const newCase: Case = {
          id: `case_${Date.now()}`,
          user_id: profile?.user_id || 'unknown-user',
          clinic_id: profile?.default_clinic_id || 'unknown-clinic',
          name: 'Nouveau cas',
          status: 'draft',
          draft: schema,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        set({
          currentCase: newCase,
          activeSectionId: sections[0]?.id || '',
          autosaveTimestamps: {},
          isDirty: false
        });
      },
      
      updateSectionTitles: (sectionTitles: Record<string, string>) => {
        const currentCase = get().currentCase;
        if (currentCase) {
          const updatedSections: Record<string, Section> = {};
          Object.keys(currentCase.draft.sections).forEach(sectionId => {
            updatedSections[sectionId] = {
              ...currentCase.draft.sections[sectionId],
              title: sectionTitles[sectionId] || currentCase.draft.sections[sectionId].title
            };
          });
          
          const updatedDraft = {
            ...currentCase.draft,
            sections: updatedSections
          };
          
          set({
            currentCase: {
              ...currentCase,
              draft: updatedDraft
            }
          });
        }
      },
      
      // Computed property for backward compatibility
      get sections() {
        const currentCase = get().currentCase;
        if (!currentCase || !currentCase.draft.sections) return [];
        
        return Object.entries(currentCase.draft.sections).map(([sectionId, section]) => {
          // Find the section in CNESST_SECTIONS to get the proper title
          const cnesstSection = CNESST_SECTIONS.find(s => s.id === sectionId);
          const title = section.title || (cnesstSection ? getSectionTitle(cnesstSection, 'fr') : sectionId);
          
          return {
            id: sectionId,
            title,
            status: section.status || 'not_started',
            data: section.data || {},
            lastModified: section.lastModified || new Date().toISOString(),
            audioRequired: section.audioRequired || false
          };
        });
      },

      // New Case Management API (Feature Flagged)
      createNewCase: async (patientInfo?: any): Promise<string> => {
        set({ isLoading: true });
        try {
          // Create case with auto-save enabled
          const caseData = {
            patientInfo: patientInfo || {},
            sections: {},
            metadata: {
              language: 'fr',
              createdAt: new Date().toISOString(),
              autoSave: true,
              status: 'draft'
            }
          };

          console.log('📝 Creating new case with data:', caseData);

          const result = await apiFetch('/api/cases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(caseData)
          });
          const caseId = result.data.id;
          
          console.log('✅ Case created successfully:', caseId, result.data);
          
          // Auto-save the case locally for immediate access
          const profile = useUserStore.getState().profile;
          const localCase: Case = {
            id: caseId,
            user_id: profile?.user_id || 'unknown-user',
            clinic_id: profile?.default_clinic_id || 'unknown-clinic',
            name: 'Nouveau cas',
            status: result.data.status || 'draft',
            draft: {
              caseId,
              patientInfo: caseData.patientInfo,
              physicianInfo: { lastName: '', firstName: '', license: '', address: '', phone: '', email: '' },
              meta: { 
                language: 'fr', 
                createdAt: new Date().toISOString(), 
                updatedAt: new Date().toISOString(), 
                export: { status: 'not_exported', lastExportAt: null, lastExportFormat: null } 
              },
              ui: { activeSectionId: '', order: [], autosave: {} },
              sections: {},
              sessions: []
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Update local state with the new case
          set({ 
            currentCase: localCase,
            isDirty: false,
            lastSaved: new Date().toLocaleTimeString()
          });
          
          console.log('✅ New case created with auto-save:', caseId);
          return caseId;
        } catch (error) {
          console.error('❌ Failed to create new case:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      loadNewCase: async (caseId: string): Promise<NewCase | null> => {
        set({ isLoading: true });
        try {
          const result = await apiFetch(`/api/cases/${caseId}`);
          const caseData = result.data;
          
          // Ensure schema is loaded if not already
          if (!get().schema) {
            console.log('🔍 [loadNewCase] Loading schema for case:', caseId);
            await get().loadSchema();
          }
          
          // Set the current case in the store to prevent reloading
          set({ 
            currentCase: caseData,
            isLoading: false 
          });
          
          console.log('✅ New case loaded and set in store:', caseData.id);
          return caseData;
        } catch (error) {
          console.error('❌ Failed to load new case:', error);
          set({ isLoading: false });
          return null;
        }
      },

      updateNewCaseSection: async (caseId: string, sectionId: string, data: any, status?: string) => {
        try {
          console.log('📝 Updating section:', { caseId, sectionId, data, status });
          
          const result = await apiFetch(`/api/cases/${caseId}/sections/${sectionId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data, status })
          });

          console.log('✅ Section updated successfully:', sectionId);
          // Return the data from the response
          return result.data || result;
        } catch (error) {
          console.error('❌ Failed to update section:', error);
          throw error;
        }
      },

      linkDictationSession: async (caseId: string, sessionId: string, sectionId: string, content?: string, formattedContent?: string) => {
        try {
          const result = await apiFetch(`/api/cases/${caseId}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              sectionId,
              content,
              formattedContent
            })
          });

          console.log('✅ Session linked to case:', sessionId);
          return result.data;
        } catch (error) {
          console.error('❌ Failed to link session:', error);
          throw error;
        }
      },

      updateCaseName: async (caseId: string, name: string) => {
        try {
          const result = await apiFetch(`/api/cases/${caseId}/name`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          });
          
          // Update local state
          const currentCase = get().currentCase;
          if (currentCase && currentCase.id === caseId) {
            set({
              currentCase: {
                ...currentCase,
                name: result.name,
                updated_at: result.updatedAt
              }
            });
          }
          
          console.log('✅ Case name updated:', result.name);
          return result;
        } catch (error) {
          console.error('❌ Failed to update case name:', error);
          throw error;
        }
      },

      completeCase: async (caseId: string) => {
        try {
          const result = await apiFetch(`/api/cases/${caseId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' }),
          });
          
          // Update local state
          const currentCase = get().currentCase;
          if (currentCase && currentCase.id === caseId) {
            set({
              currentCase: {
                ...currentCase,
                status: 'completed',
                updated_at: result.updatedAt
              }
            });
          }
          
          console.log('✅ Case marked as completed:', caseId);
          return result;
        } catch (error) {
          console.error('❌ Failed to complete case:', error);
          throw error;
        }
      },

      markCaseInProgress: async (caseId: string) => {
        try {
          const result = await apiFetch(`/api/cases/${caseId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'in_progress' }),
          });
          
          // Update local state
          const currentCase = get().currentCase;
          if (currentCase && currentCase.id === caseId) {
            set({
              currentCase: {
                ...currentCase,
                status: 'in_progress',
                updated_at: result.updatedAt
              }
            });
          }
          
          console.log('✅ Case marked as in progress:', caseId);
          return result;
        } catch (error) {
          console.error('❌ Failed to mark case as in progress:', error);
          throw error;
        }
      },

      getCaseContext: (caseId: string, sectionId: string): CaseContext | null => {
        // This would typically come from the loaded case data
        // For now, return a basic context
        return {
          caseId,
          sectionId,
          sectionTitle: `Section ${sectionId}`,
          audioRequired: ['section_7', 'section_8', 'section_11'].includes(sectionId)
        };
      },

      getRecentCases: async (limit: number = 10, days: number = 30): Promise<any[]> => {
        try {
          const result = await apiFetch(`/api/cases?limit=${limit}&days=${days}&sort=updated_at&order=desc`);
          return result.data || [];
        } catch (error) {
          console.error('❌ Failed to fetch recent cases:', error);
          return [];
        }
      },

      deleteCase: async (caseId: string): Promise<boolean> => {
        try {
          await apiFetch(`/api/cases/${caseId}`, {
            method: 'DELETE'
          });
          
          console.log('✅ Case deleted:', caseId);
          return true;
        } catch (error) {
          console.error('❌ Failed to delete case:', error);
          return false;
        }
      },

      hasUnsavedChanges: () => {
        const currentCase = get().currentCase;
        if (!currentCase) return false;
        
        // Check if there are any sections with unsaved changes
        const sections = currentCase.draft.sections || {};
        return Object.values(sections).some(section => 
          section.status === 'in_progress' || 
          (section.lastModified && new Date(section.lastModified) > new Date(currentCase.updated_at))
        );
      },

      saveDraft: async () => {
        const currentCase = get().currentCase;
        if (!currentCase?.id) return;
        
        try {
          // Save all in_progress sections to database
          const sections = currentCase.draft.sections || {};
          const savePromises = Object.entries(sections)
            .filter(([_, section]) => section.status === 'in_progress')
            .map(([sectionId, section]) => 
              get().updateNewCaseSection(currentCase.id, sectionId, section.data, 'in_progress')
            );
          
          await Promise.all(savePromises);
          
          // Update case status to in_progress
          await get().markCaseInProgress(currentCase.id);
          
          console.log('✅ Draft saved successfully');
        } catch (error) {
          console.error('❌ Failed to save draft:', error);
          throw error;
        }
      }
    }),
    {
      name: 'case-storage',
      partialize: (state) => ({
        // Persist essential state including current case
        currentCase: state.currentCase,
        activeSectionId: state.activeSectionId,
        autosaveTimestamps: state.autosaveTimestamps,
        lastSaved: state.lastSaved
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Check if we have legacy data and migrate it
          const persistedData = localStorage.getItem('case-storage');
          if (persistedData) {
            try {
              const parsed = JSON.parse(persistedData);
              if (parsed.state && isLegacyFormat(parsed.state)) {
                console.log('🔄 Migrating legacy case data...');
                // Migration will happen when schema is loaded
              }
            } catch (error) {
              console.warn('⚠️ Failed to parse persisted data:', error);
            }
          }
        }
      }
    }
  )
);

// Migration helper for existing data
export const migrateExistingData = (legacyData: LegacyCase, schema: FormSchema): FormSchema => {
  return migrateLegacyCaseData(legacyData, schema);
};
