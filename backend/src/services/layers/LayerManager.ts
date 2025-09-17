import fs from 'fs';
import path from 'path';

export interface LayerOptions {
  language: 'fr' | 'en';
  correlationId?: string;
  [key: string]: any;
}

export interface LayerResult {
  success: boolean;
  data: any;
  metadata: {
    processingTime: number;
    language: 'fr' | 'en';
    [key: string]: any;
  };
}

export interface LayerProcessor {
  process(transcript: string, options: LayerOptions): Promise<LayerResult>;
}

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
      const layerFiles = ['verbatim-layer.json', 'voice-commands-layer.json', 'clinical-extraction-layer.json', 'universal-cleanup-layer.json'];
      
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
    // Handle 'default' case by resolving to actual default combination
    const actualComboName = comboName === 'default' ? this.getDefaultCombination() : comboName;
    
    const combination = this.getTemplateCombination(actualComboName);
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

    // Handle 'default' case by resolving to actual default combination
    const actualComboName = comboName === 'default' ? this.getDefaultCombination() : comboName;
    
    const combination = this.getTemplateCombination(actualComboName);
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
    // Handle 'default' case by resolving to actual default combination
    const actualComboName = comboName === 'default' ? this.getDefaultCombination() : comboName;
    
    const combination = this.getTemplateCombination(actualComboName);
    return combination?.fallback || this.getDefaultCombination();
  }

  /**
   * Process layers for a template combination
   */
  async processLayers(transcript: string, comboName: string, options: LayerOptions): Promise<LayerResult[]> {
    const enabledLayers = this.getEnabledLayers(comboName);
    const results: LayerResult[] = [];

    for (const layerConfig of enabledLayers) {
      try {
        // Dynamically import and instantiate the layer processor
        const processor = await this.getLayerProcessor(layerConfig.name);
        if (processor) {
          const result = await processor.process(transcript, options);
          results.push(result);
        }
      } catch (error) {
        console.error(`Layer ${layerConfig.name} processing failed:`, error);
        // Continue with other layers even if one fails
      }
    }

    return results;
  }

  /**
   * Get layer processor instance
   */
  private async getLayerProcessor(layerName: string): Promise<LayerProcessor | null> {
    try {
      switch (layerName) {
        case 'clinical-extraction-layer':
          const { ClinicalExtractionLayer } = await import('./ClinicalExtractionLayer.js');
          return new ClinicalExtractionLayer();
        case 'universal-cleanup-layer':
          const { UniversalCleanupLayer } = await import('./UniversalCleanupLayer.js');
          return new UniversalCleanupLayer();
        // Add other layer processors as needed
        default:
          console.warn(`No processor found for layer: ${layerName}`);
          return null;
      }
    } catch (error) {
      console.error(`Failed to load processor for layer ${layerName}:`, error);
      return null;
    }
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
