import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface BackendConfig {
  authRequired: boolean;
  wsRequireAuth: boolean;
  publicWsUrl: string;
  useWss: boolean;
  universalCleanupEnabled: boolean;
  universalCleanupShadow: boolean;
  enableOutputLanguageSelection: boolean;
  cnesstSectionsDefaultOutput: 'fr' | 'en';
  allowNonFrenchOutput: boolean;
}

export const useBackendConfig = () => {
  const [config, setConfig] = useState<BackendConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await api('/api/config');
        const configData = await response.json();
        setConfig(configData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch backend config:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch config');
        // Set default config on error
        setConfig({
          authRequired: false,
          wsRequireAuth: false,
          publicWsUrl: '',
          useWss: false,
          universalCleanupEnabled: false,
          universalCleanupShadow: false,
          enableOutputLanguageSelection: false,
          cnesstSectionsDefaultOutput: 'fr',
          allowNonFrenchOutput: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, loading, error };
};
