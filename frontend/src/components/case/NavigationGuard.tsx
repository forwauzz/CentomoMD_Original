import React, { useEffect } from 'react';
import { useCaseStore } from '@/stores/caseStore';

interface NavigationGuardProps {
  children: React.ReactNode;
}

export const NavigationGuard: React.FC<NavigationGuardProps> = ({ children }) => {
  const { hasUnsavedChanges, saveDraft } = useCaseStore();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = 'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter?';
        return e.returnValue;
      }
    };

    const handleNavigation = (e: PopStateEvent) => {
      if (hasUnsavedChanges()) {
        const shouldLeave = window.confirm(
          'Vous avez des modifications non sauvegardées. Voulez-vous sauvegarder comme brouillon avant de continuer?'
        );
        
        if (shouldLeave) {
          saveDraft().catch(console.error);
        } else {
          // Prevent navigation
          e.preventDefault();
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handleNavigation);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, [hasUnsavedChanges, saveDraft]);

  return <>{children}</>;
};
