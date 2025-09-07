import fs from 'fs';
import path from 'path';

export interface LayerConfig {
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  priority: number;
  dependencies: string[];
  fallback?: {
    enabled: boolean;
    description: string;
    action: string;
  };
  validation?: {
    enabled: boolean;
    checks: string[];
  };
}

export interface TemplateCombination {
  name: string;
  description: string;
  layers: string[];
  fallback: string;
}

export interface TemplateCombinationsConfig {
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  combinations: Record<string, TemplateCombination>;
  default: string;
  validation?: {
    enabled: boolean;
    checks: string[];
  };
}

export class LayerManager {
  private layers: Map<string, LayerConfig> = new Map();
  private combinations: TemplateCombinationsConfig | null = null;
  private configPath: string;

  constructor(configPath: string = path.join(process.cwd(), 'config', 'layers')) {
    this.configPath = configPath;
    this.loadConfigurations();
  }

  /**
   * Load all layer configurations from JSON files
   */
  private loadConfigurations(): void {
    try {
      // Load individual layer configs
      const layerFiles = ['verbatim-layer.json', 'voice-commands-layer.json'];
      
      for (const file of layerFiles) {
        const filePath = path.join(this.configPath, file);
        if (fs.existsSync(filePath)) {
          const config = JSON.parse(fs.readFileSync(filePath, 'utf8')) as LayerConfig;
          this.layers.set(config.name, config);
        }
      }

      // Load template combinations config
      const combinationsPath = path.join(this.configPath, 'template-combinations.json');
      if (fs.existsSync(combinationsPath)) {
        this.combinations = JSON.parse(fs.readFileSync(combinationsPath, 'utf8')) as TemplateCombinationsConfig;
      }

      console.log(`LayerManager: Loaded ${this.layers.size} layers and ${this.combinations ? 'template combinations' : 'no combinations'}`);
    } catch (error) {
      console.error('LayerManager: Error loading configurations:', error);
    }
  }

  /**
   * Get template combination configuration
   */
  getTemplateCombination(comboName: string): TemplateCombination | null {
    if (!this.combinations || !this.combinations.enabled) {
      return null;
    }

    return this.combinations.combinations[comboName] || null;
  }

  /**
   * Get enabled layers for a template combination
   */
  getEnabledLayers(comboName: string): LayerConfig[] {
    const combination = this.getTemplateCombination(comboName);
    if (!combination) {
      return [];
    }

    const enabledLayers: LayerConfig[] = [];
    
    for (const layerName of combination.layers) {
      const layer = this.layers.get(layerName);
      if (layer && layer.enabled) {
        enabledLayers.push(layer);
      }
    }

    // Sort by priority
    return enabledLayers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Check if a layer is enabled
   */
  isLayerEnabled(layerName: string): boolean {
    const layer = this.layers.get(layerName);
    return layer ? layer.enabled : false;
  }

  /**
   * Get layer configuration
   */
  getLayerConfig(layerName: string): LayerConfig | null {
    return this.layers.get(layerName) || null;
  }

  /**
   * Get default template combination
   */
  getDefaultCombination(): string {
    return this.combinations?.default || 'template-only';
  }

  /**
   * Validate template combination
   */
  validateCombination(comboName: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.combinations || !this.combinations.enabled) {
      errors.push('Template combinations system is disabled');
      return { valid: false, errors };
    }

    const combination = this.getTemplateCombination(comboName);
    if (!combination) {
      errors.push(`Template combination '${comboName}' not found`);
      return { valid: false, errors };
    }

    // Check layer dependencies
    for (const layerName of combination.layers) {
      const layer = this.layers.get(layerName);
      if (!layer) {
        errors.push(`Layer '${layerName}' not found`);
      } else if (!layer.enabled) {
        errors.push(`Layer '${layerName}' is disabled`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get fallback combination for a given combination
   */
  getFallbackCombination(comboName: string): string {
    const combination = this.getTemplateCombination(comboName);
    return combination?.fallback || this.getDefaultCombination();
  }

  /**
   * Reload configurations (useful for development)
   */
  reloadConfigurations(): void {
    this.layers.clear();
    this.combinations = null;
    this.loadConfigurations();
  }
}
