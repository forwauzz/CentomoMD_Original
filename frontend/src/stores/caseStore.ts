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
