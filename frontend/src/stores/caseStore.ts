import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Section {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  data: Record<string, any>;
  lastModified: string;
  audioRequired: boolean;
}

interface CaseState {
  // Active case state
  activeSectionId: string;
  sections: Section[];
  autosaveTimestamps: Record<string, string>;
  
  // Actions
  setActiveSection: (sectionId: string) => void;
  updateSection: (sectionId: string, data: Record<string, any>) => void;
  saveSection: (sectionId: string) => void;
  initializeCase: (sections: Section[]) => void;
  resetCase: () => void;
  updateSectionTitles: (sectionTitles: Record<string, string>) => void;
  getSectionStatus: (sectionId: string) => Section['status'];
  getAutosaveTimestamp: (sectionId: string) => string | null;
  saveCaseToDatabase: (user_id: string, clinic_id: string) => Promise<{ success: boolean; error?: string }>;
}

export const useCaseStore = create<CaseState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeSectionId: '',
      sections: [],
      autosaveTimestamps: {},
      
      // Actions
      setActiveSection: (sectionId) => {
        set({ activeSectionId: sectionId });
      },
      
      updateSection: (sectionId, data) => {
        set((state) => {
          const updatedSections = state.sections.map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  data: { ...section.data, ...data },
                  lastModified: new Date().toISOString(),
                  status: 'in_progress' as const,
                }
              : section
          );
          
          const updatedTimestamps = {
            ...state.autosaveTimestamps,
            [sectionId]: new Date().toISOString(),
          };
          
          return {
            sections: updatedSections,
            autosaveTimestamps: updatedTimestamps,
          };
        });
      },
      
      saveSection: (sectionId) => {
        set((state) => {
          const updatedSections = state.sections.map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  status: 'completed' as const,
                  lastModified: new Date().toISOString(),
                }
              : section
          );
          
          return { sections: updatedSections };
        });
      },
      
      initializeCase: (sections) => {
        set({
          sections,
          activeSectionId: sections[0]?.id || '',
          autosaveTimestamps: {},
        });
      },
      
      resetCase: () => {
        set({
          activeSectionId: '',
          sections: [],
          autosaveTimestamps: {},
        });
      },
      
      updateSectionTitles: (sectionTitles) => {
        set((state) => {
          const updatedSections = state.sections.map((section) => ({
            ...section,
            title: sectionTitles[section.id] || section.title,
          }));
          
          return { sections: updatedSections };
        });
      },
      
      getSectionStatus: (sectionId) => {
        const section = get().sections.find((s) => s.id === sectionId);
        return section?.status || 'not_started';
      },
      
      getAutosaveTimestamp: (sectionId) => {
        return get().autosaveTimestamps[sectionId] || null;
      },
      
      saveCaseToDatabase: async (user_id: string, clinic_id: string) => {
        try {
          const state = get();
          
          // Convert all sections data into a single draft object
          const draft = {
            sections: state.sections.map(section => ({
              id: section.id,
              title: section.title,
              status: section.status,
              data: section.data,
              lastModified: section.lastModified,
              audioRequired: section.audioRequired
            })),
            activeSectionId: state.activeSectionId,
            autosaveTimestamps: state.autosaveTimestamps,
            savedAt: new Date().toISOString()
          };

          // Send to backend API
          const response = await fetch('/api/cases/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              draft,
              user_id,
              clinic_id
            })
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to save case');
          }

          console.log('✅ Case saved to database successfully:', result.data);
          return { success: true };

        } catch (error) {
          console.error('❌ Error saving case to database:', error);
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      },
    }),
    {
      name: 'case-storage',
      partialize: (state) => ({
        activeSectionId: state.activeSectionId,
        sections: state.sections,
        autosaveTimestamps: state.autosaveTimestamps,
      }),
    }
  )
);
