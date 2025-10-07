import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean;
  
  // Language state
  language: 'fr' | 'en';
  
  // Toast notifications
  toasts: Toast[];
  
  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLanguage: (lang: 'fr' | 'en') => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarCollapsed: false,
      language: 'fr', // Default to French for Quebec clinics
      toasts: [],
      
      // Actions
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      setLanguage: (lang) => set({ language: lang }),
      
      addToast: (toast) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { ...toast, id };
        
        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));
        
        // Auto-remove toast after duration (default 5 seconds)
        const duration = toast.duration || 5000;
        setTimeout(() => {
          get().removeToast(id);
        }, duration);
      },
      
      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
      },
      
      clearToasts: () => set({ toasts: [] }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        language: state.language,
      }),
    }
  )
);
