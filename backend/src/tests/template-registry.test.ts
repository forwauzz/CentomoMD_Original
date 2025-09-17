import { describe, it, expect, beforeEach } from 'vitest';
import { TEMPLATE_REGISTRY, TemplateManager } from '../config/templates.js';

describe('Template Registry', () => {
  describe('Mode 3 (Ambient) Template Support', () => {
    it('should include mode3-transcribe-passthrough template for ambient mode', () => {
      const template = TEMPLATE_REGISTRY['mode3-transcribe-passthrough'];
      
      expect(template).toBeDefined();
      expect(template.id).toBe('mode3-transcribe-passthrough');
      expect(template.compatibleModes).toContain('ambient');
      expect(template.compatibleModes).not.toContain('mode3');
    });

    it('should have correct metadata tags for ambient mode', () => {
      const template = TEMPLATE_REGISTRY['mode3-transcribe-passthrough'];
      
      expect(template.metadata?.tags).toContain('ambient');
      expect(template.metadata?.tags).not.toContain('mode3');
      expect(template.metadata?.tags).toContain('transcribe');
      expect(template.metadata?.tags).toContain('passthrough');
      expect(template.metadata?.tags).toContain('pipeline');
    });

    it('should support ambient mode in all relevant templates', () => {
      const ambientTemplates = Object.values(TEMPLATE_REGISTRY).filter(
        template => template.compatibleModes.includes('ambient')
      );
      
      expect(ambientTemplates.length).toBeGreaterThan(0);
      
      // Verify specific templates that should support ambient mode
      const expectedAmbientTemplates = [
        'mode3-transcribe-passthrough'
      ];
      
      expectedAmbientTemplates.forEach(templateId => {
        const template = TEMPLATE_REGISTRY[templateId];
        expect(template).toBeDefined();
        expect(template.compatibleModes).toContain('ambient');
      });
    });
  });

  describe('TemplateManager', () => {
    let templateManager: TemplateManager;

    beforeEach(() => {
      templateManager = new TemplateManager();
    });

    it('should return templates compatible with ambient mode', () => {
      const ambientTemplates = templateManager.getTemplatesByMode('ambient');
      
      expect(ambientTemplates).toBeDefined();
      expect(ambientTemplates.length).toBeGreaterThan(0);
      
      // Should include the passthrough template
      const passthroughTemplate = ambientTemplates.find(
        template => template.id === 'mode3-transcribe-passthrough'
      );
      expect(passthroughTemplate).toBeDefined();
    });

    it('should not return templates with mode3 in compatibleModes', () => {
      const allTemplates = Object.values(TEMPLATE_REGISTRY);
      const templatesWithMode3 = allTemplates.filter(
        template => template.compatibleModes.includes('mode3')
      );
      
      expect(templatesWithMode3).toHaveLength(0);
    });

    it('should return templates by section for ambient mode', () => {
      const section7Templates = templateManager.getTemplatesBySection('section_7');
      const ambientSection7Templates = section7Templates.filter(
        template => template.compatibleModes.includes('ambient')
      );
      
      expect(ambientSection7Templates.length).toBeGreaterThan(0);
    });
  });

  describe('Template Configuration Validation', () => {
    it('should have valid template configurations', () => {
      Object.values(TEMPLATE_REGISTRY).forEach(template => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.compatibleModes).toBeInstanceOf(Array);
        expect(template.compatibleSections).toBeInstanceOf(Array);
        expect(template.supportedLanguages).toBeInstanceOf(Array);
        expect(template.features).toBeDefined();
        expect(template.configuration).toBeDefined();
      });
    });

    it('should not have mode3 references in any template', () => {
      Object.values(TEMPLATE_REGISTRY).forEach(template => {
        // Check compatibleModes
        expect(template.compatibleModes).not.toContain('mode3');
        
        // Check metadata tags
        if (template.metadata?.tags) {
          expect(template.metadata.tags).not.toContain('mode3');
        }
      });
    });
  });
});
