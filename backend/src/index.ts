import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🚀 Server starting - Build:', new Date().toISOString());

import { transcriptionService } from './services/transcriptionService.js';
import { templateLibrary } from './template-library/index.js';
import { AIFormattingService } from './services/aiFormattingService.js';
import { Mode1Formatter } from './services/formatter/mode1.js';
import { Mode2Formatter } from './services/formatter/mode2.js';
import { Section7Validator } from './services/formatter/validators/section7.js';
import { Section8Validator } from './services/formatter/validators/section8.js';
import { Section11Validator } from './services/formatter/validators/section11.js';
import { getConfig } from './routes/config.js';
import { getWsToken } from './routes/auth.js';
import profileRouter from './routes/profile.js';
import { securityMiddleware } from './server/security.js';
import { authMiddleware } from './auth.js';
import jwt from 'jsonwebtoken';
import { ENV } from './config/env.js';
import { bootProbe } from './database/connection.js';
import dbRouter from './routes/db.js';
import { logger } from './utils/logger.js';

const app = express();
const server = http.createServer(app);

// TODO: Apply security middleware
app.use(securityMiddleware);

// TODO: Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Config endpoint to expose flags to frontend
app.get('/api/config', getConfig);

// Auth endpoints
app.post('/api/auth/ws-token', getWsToken);

// Profile routes
try { 
  app.use(profileRouter); 
  console.log('✅ /api/profile routes mounted'); 
} catch(e) { 
  console.error('❌ mount /api/profile:', e); 
}

// Database ping route
try {
  app.use(dbRouter);
  console.log('✅ /api/db routes mounted');
} catch(e) {
  console.error('❌ mount /api/db:', e);
}

// Boot-time database probe
(async () => {
  try {
    await bootProbe();
  } catch (e) {
    console.error('[boot] DB probe failed:', e);
  }
})();

// Template Library API Endpoints - All Protected with Auth

// Function to print all registered routes
function printRoutes(app: any) {
  const out: string[] = [];
  app._router?.stack?.forEach((m: any) => {
    if (m.route?.path) { 
      out.push(`${Object.keys(m.route.methods).join(',').toUpperCase()} ${m.route.path}`); 
    } else if (m.name === 'router' && m.handle?.stack && m.regexp) {
      const prefix = m.regexp.toString().match(/\\\/([^\\]+)\\\//)?.[1] ? `/${RegExp.$1}` : '';
      m.handle.stack.forEach((h: any) => h.route?.path && out.push(`${Object.keys(h.route.methods).join(',').toUpperCase()} ${prefix}${h.route.path}`));
    }
  });
  console.log('🧭 Registered routes:\n  ' + out.join('\n  '));
}

// Print routes after all are mounted
printRoutes(app);

// All template endpoints are now protected with authMiddleware
app.get('/api/templates', authMiddleware, (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging for secure event tracking
    logger.info('Templates access requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { section, language } = req.query;
    let templates;
    
    if (section && ['7', '8', '11'].includes(section as string)) {
      templates = templateLibrary.getTemplates(section as "7" | "8" | "11", language as "fr" | "en" || "fr");
    } else {
      // Return all templates grouped by section
      templates = {
        section7: templateLibrary.getTemplatesBySection("7"),
        section8: templateLibrary.getTemplatesBySection("8"),
        section11: templateLibrary.getTemplatesBySection("11")
      };
    }
    
    // Audit logging for successful access
    logger.info('Templates access successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templatesReturned: Array.isArray(templates) ? templates.length : Object.keys(templates).length
    });
    
    res.json({ success: true, data: templates });
  } catch (error) {
    // Audit logging for errors
    logger.error('Templates access failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
});

app.get('/api/templates/stats', authMiddleware, (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging for secure event tracking
    logger.info('Template stats access requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const stats = templateLibrary.getTemplateStats();
    
    // Audit logging for successful access
    logger.info('Template stats access successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      statsReturned: Object.keys(stats).length
    });
    
    res.json({ success: true, data: stats });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template stats access failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error fetching template stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch template stats' });
  }
});

// AI Formatting API Endpoint - Protected with Auth
app.post('/api/templates/format', authMiddleware, (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging for secure event tracking
    logger.info('Template formatting requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      section: req.body.section,
      language: req.body.language,
      complexity: req.body.complexity,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { content, section, language, complexity, formattingLevel, includeSuggestions } = req.body;
    
    if (!content || !section || !language) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: content, section, language' 
      });
    }
    
    if (!['7', '8', '11'].includes(section)) {
      return res.status(400).json({ success: false, error: 'Invalid section' });
    }
    
    if (!['fr', 'en'].includes(language)) {
      return res.status(400).json({ success: false, error: 'Invalid language' });
    }
    
    const formattingOptions = {
      section: section as "7" | "8" | "11",
      language: language as "fr" | "en",
      complexity: complexity as "low" | "medium" | "high" || "medium",
      formattingLevel: formattingLevel as "basic" | "standard" | "advanced" || "standard",
      includeSuggestions: includeSuggestions || false
    };
    
    const formattedContent = AIFormattingService.formatTemplateContent(content, formattingOptions);
    
    // Audit logging for successful formatting
    logger.info('Template formatting successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      section,
      language,
      complexity,
      contentLength: content.length
    });
    
    return res.json({ 
      success: true, 
      data: formattedContent 
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template formatting failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error formatting template content:', error);
    return res.status(500).json({ success: false, error: 'Failed to format template content' });
  }
});

// Template CRUD Operations - Protected with Auth
app.post('/api/templates', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging for secure event tracking
    logger.info('Template creation requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      section: req.body.section,
      language: req.body.language,
      complexity: req.body.complexity,
      title: req.body.title,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { title, content, section, language, complexity, category, tags, version } = req.body;
    
    if (!title || !content || !section || !language || !complexity) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: title, content, section, language, complexity' 
      });
    }
    
    if (!['7', '8', '11'].includes(section)) {
      return res.status(400).json({ success: false, error: 'Invalid section' });
    }
    
    if (!['fr', 'en'].includes(language)) {
      return res.status(400).json({ success: false, error: 'Invalid language' });
    }
    
    if (!['low', 'medium', 'high'].includes(complexity)) {
      return res.status(400).json({ success: false, error: 'Invalid complexity' });
    }
    
    // Create new template
    const newTemplate = {
      id: `template_${Date.now()}`,
      title,
      content,
      section,
      language,
      complexity,
      category: category || 'General',
      tags: tags || [],
      version: version || '1.0',
      source_file: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Creating new template:', newTemplate);
    
    // Add template to the template library
    await templateLibrary.addTemplate(newTemplate);
    
    // Audit logging for successful creation
    logger.info('Template creation successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: newTemplate.id,
      section,
      language,
      complexity,
      title
    });
    
    return res.json({ 
      success: true, 
      data: newTemplate,
      message: 'Template created successfully'
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template creation failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error creating template:', error);
    return res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

app.put('/api/templates/:id', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  
  try {
    const { id } = req.params;
    const { title, content, section, language, complexity, category, tags, version } = req.body;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing template ID' 
      });
    }
    
    // Audit logging for secure event tracking
    logger.info('Template update requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: id,
      section: req.body.section,
      language: req.body.language,
      complexity: req.body.complexity,
      title: req.body.title,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    if (!title || !content || !section || !language || !complexity) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: title, content, section, language, complexity' 
      });
    }
    
    const updatedTemplate = {
      id,
      title,
      content,
      section,
      language,
      complexity,
      category: category || 'General',
      tags: tags || [],
      version: version || '1.0',
      source_file: '',
      updated_at: new Date().toISOString()
    };
    
    console.log('Updating template:', updatedTemplate);
    
    // Update template in the template library
    await templateLibrary.updateTemplate(id, updatedTemplate);
    
    // Audit logging for successful update
    logger.info('Template update successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: id,
      section,
      language,
      complexity,
      title
    });
    
    return res.json({ 
      success: true, 
      data: updatedTemplate,
      message: 'Template updated successfully'
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template update failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: req.params['id'],
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error updating template:', error);
    return res.status(500).json({ success: false, error: 'Failed to update template' });
  }
});

app.delete('/api/templates/:id', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  
  try {
    const { id } = req.params;
    const { section } = req.query;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing template ID' 
      });
    }
    
    // Audit logging for secure event tracking
    logger.info('Template deletion requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: id,
      section: req.query['section'],
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    if (!section || !['7', '8', '11'].includes(section as string)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing or invalid section parameter' 
      });
    }
    
    console.log('Deleting template:', id, 'from section:', section);
    
    // Delete template from the template library
    await templateLibrary.deleteTemplate(id, section as "7" | "8" | "11");
    
    // Audit logging for successful deletion
    logger.info('Template deletion successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: id,
      section: section as string
    });
    
    return res.json({ 
      success: true, 
      message: 'Template deleted successfully'
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template deletion failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: req.params['id'],
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error deleting template:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete template' });
  }
});

// Advanced Template Features API Endpoints

// Get template versions - Protected with Auth
app.get('/api/templates/:id/versions', authMiddleware, (req, res) => {
  const user = (req as any).user;
  
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing template ID' 
      });
    }
    
    // Audit logging for secure event tracking
    logger.info('Template versions access requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    const versions = templateLibrary.getTemplateVersions(id);
    
    // Audit logging for successful access
    logger.info('Template versions access successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: id,
      versionsReturned: versions.length
    });
    
    return res.json({ 
      success: true, 
      data: versions 
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template versions access failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: req.params['id'],
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error fetching template versions:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch template versions' });
  }
});

// Get template analytics - Protected with Auth
app.get('/api/templates/analytics', authMiddleware, (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging for secure event tracking
    logger.info('Template analytics access requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const analytics = templateLibrary.getAnalytics();
    
    // Audit logging for successful access
    logger.info('Template analytics access successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      analyticsReturned: analytics ? Object.keys(analytics).length : 0
    });
    
    res.json({ 
      success: true, 
      data: analytics || {}
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template analytics access failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error fetching template analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch template analytics' });
  }
});

// Get templates by section (must come after /analytics to avoid route conflict) - Protected with Auth
app.get('/api/templates/:section', authMiddleware, (req, res) => {
  const user = (req as any).user;
  
  try {
    const { section } = req.params;
    const { language, search, tags } = req.query;
    
    if (!section) {
      return res.status(400).json({ success: false, error: 'Missing section parameter' });
    }
    
    // Audit logging for secure event tracking
    logger.info('Templates by section access requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      section,
      language: req.query['language'],
      search: req.query['search'],
      tags: req.query['tags'],
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    if (!['7', '8', '11'].includes(section)) {
      return res.status(400).json({ success: false, error: 'Invalid section' });
    }
    
    let templates = templateLibrary.getTemplatesBySection(section as "7" | "8" | "11");
    
    // Apply filters
    if (language) {
      templates = templates.filter(t => !t.language || t.language === language);
    }
    
    if (search) {
      templates = templateLibrary.searchTemplates(section as "7" | "8" | "11", search as string);
    }
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      templates = templateLibrary.getTemplatesByTags(section as "7" | "8" | "11", tagArray as string[]);
    }
    
    // Audit logging for successful access
    logger.info('Templates by section access successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      section,
      templatesReturned: templates.length
    });
    
    return res.json({ success: true, data: templates });
  } catch (error) {
    // Audit logging for errors
    logger.error('Templates by section access failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      section: req.params['section'],
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error fetching templates by section:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
});

// Track template usage - Protected with Auth
app.post('/api/templates/:id/usage', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  
  try {
    const { id } = req.params;
    const { section, language, user_id, session_id, performance_rating } = req.body;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing template ID' 
      });
    }
    
    // Audit logging for secure event tracking
    logger.info('Template usage tracking requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: id,
      section,
      language,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    if (!section || !language) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: section, language' 
      });
    }
    
    await templateLibrary.trackUsage({
      templateId: id,
      section,
      language,
      user_id,
      session_id,
      performance_rating
    });
    
    // Audit logging for successful tracking
    logger.info('Template usage tracking successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: id,
      section,
      language
    });
    
    return res.json({ 
      success: true, 
      message: 'Usage tracked successfully'
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template usage tracking failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: req.params['id'],
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error tracking template usage:', error);
    return res.status(500).json({ success: false, error: 'Failed to track usage' });
  }
});

// Advanced search - Protected with Auth
app.post('/api/templates/search', authMiddleware, (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging for secure event tracking
    logger.info('Template advanced search requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      section: req.body.section,
      language: req.body.language,
      complexity: req.body.complexity,
      query: req.body.query,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { section, language, complexity, tags, query, status, is_default } = req.body;
    
    const templates = templateLibrary.advancedSearch({
      section,
      language,
      complexity,
      tags,
      query,
      status,
      is_default
    });
    
    // Audit logging for successful search
    logger.info('Template advanced search successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templatesReturned: templates.length
    });
    
    res.json({ 
      success: true, 
      data: templates 
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template advanced search failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error performing advanced search:', error);
    res.status(500).json({ success: false, error: 'Failed to perform search' });
  }
});

// Export templates - Protected with Auth
app.get('/api/templates/export', authMiddleware, (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging for secure event tracking
    logger.info('Template export requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      section: req.query['section'],
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { section } = req.query;
    const templates = templateLibrary.exportTemplates(section as "7" | "8" | "11");
    
    // Audit logging for successful export
    logger.info('Template export successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      section: req.query['section'],
      templatesExported: templates.length
    });
    
    res.json({ 
      success: true, 
      data: templates 
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template export failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error exporting templates:', error);
    res.status(500).json({ success: false, error: 'Failed to export templates' });
  }
});

// Import templates - Protected with Auth
app.post('/api/templates/import', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging for secure event tracking
    logger.info('Template import requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templatesCount: req.body.templates?.length || 0,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { templates } = req.body;
    
    if (!Array.isArray(templates)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Templates must be an array' 
      });
    }
    
    await templateLibrary.importTemplates(templates);
    
    // Audit logging for successful import
    logger.info('Template import successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templatesImported: templates.length
    });
    
    return res.json({ 
      success: true, 
      message: `${templates.length} templates imported successfully`
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template import failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error importing templates:', error);
    return res.status(500).json({ success: false, error: 'Failed to import templates' });
  }
});

// Bulk operations - Protected with Auth
app.post('/api/templates/bulk/status', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging for secure event tracking
    logger.info('Bulk template status update requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateIdsCount: req.body.templateIds?.length || 0,
      status: req.body.status,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { templateIds, status } = req.body;
    
    if (!Array.isArray(templateIds) || !status) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: templateIds (array), status' 
      });
    }
    
    if (!['active', 'inactive', 'draft'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status. Must be active, inactive, or draft' 
      });
    }
    
    await templateLibrary.bulkUpdateStatus(templateIds, status);
    
    // Audit logging for successful update
    logger.info('Bulk template status update successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templatesUpdated: templateIds.length,
      status
    });
    
    return res.json({ 
      success: true, 
      message: `${templateIds.length} templates updated successfully`
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Bulk template status update failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error performing bulk status update:', error);
    return res.status(500).json({ success: false, error: 'Failed to update templates' });
  }
});

app.post('/api/templates/bulk/delete', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging for secure event tracking
    logger.info('Bulk template deletion requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateIdsCount: req.body.templateIds?.length || 0,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { templateIds } = req.body;
    
    if (!Array.isArray(templateIds)) {
      return res.status(400).json({ 
        success: false, 
        error: 'templateIds must be an array' 
      });
    }
    
    await templateLibrary.bulkDelete(templateIds);
    
    // Audit logging for successful deletion
    logger.info('Bulk template deletion successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templatesDeleted: templateIds.length
    });
    
    return res.json({ 
      success: true, 
      message: `${templateIds.length} templates deleted successfully`
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Bulk template deletion failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error performing bulk delete:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete templates' });
  }
});

// Mode 1 Formatting Endpoint
app.post('/api/format/mode1', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { transcript, language, quote_style, radiology_mode, section } = req.body;
    
    if (!transcript || typeof transcript !== 'string') {
      res.status(400).json({ 
        error: 'Transcript is required and must be a string' 
      });
      return;
    }

    if (!language || !['fr', 'en'].includes(language)) {
      res.status(400).json({ 
        error: 'Language must be either "fr" or "en"' 
      });
      return;
    }

    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Initialize Mode 1 formatter
    const formatter = new Mode1Formatter();
    
    // Format the transcript
    const result = formatter.format(transcript, {
      language: language as 'fr' | 'en',
      quote_style: quote_style || 'smart',
      radiology_mode: radiology_mode || false,
      preserve_verbatim: true
    });

    // Validate the formatted content if section is specified
    let validationResult = null;
    if (section && ['7', '8', '11'].includes(section)) {
      let validator;
      switch (section) {
        case '7':
          validator = new Section7Validator();
          break;
        case '8':
          validator = new Section8Validator();
          break;
        case '11':
          validator = new Section11Validator();
          break;
      }
      
      if (validator) {
        validationResult = validator.validate(result.formatted, language as 'fr' | 'en');
      }
    }

    res.json({
      formatted: result.formatted,
      issues: result.issues,
      verbatim_blocks: result.verbatim_blocks,
      validation: validationResult,
      success: true
    });

  } catch (error) {
    console.error('Mode 1 formatting error:', error);
    res.status(500).json({ 
      error: 'Failed to format transcript',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mode 2 Formatting Endpoint (Smart Dictation)
app.post('/api/format/mode2', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { transcript, section, language, case_id, selected_sections, extra_dictation } = req.body;
    
    if (!transcript || typeof transcript !== 'string') {
      res.status(400).json({ 
        error: 'Transcript is required and must be a string' 
      });
      return;
    }

    if (!section || !['7', '8', '11'].includes(section)) {
      res.status(400).json({ 
        error: 'Section must be "7", "8", or "11"' 
      });
      return;
    }

    if (!language || !['fr', 'en'].includes(language)) {
      res.status(400).json({ 
        error: 'Language must be either "fr" or "en"' 
      });
      return;
    }

    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Initialize Mode 2 formatter
    const formatter = new Mode2Formatter();
    
    // Format the transcript with AI
    const result = await formatter.format(transcript, {
      language: language as 'fr' | 'en',
      section: section as '7' | '8' | '11',
      case_id,
      selected_sections,
      extra_dictation
    });

    // Return the formatted result
    res.json({
      formatted: result.formatted,
      issues: result.issues,
      sources_used: result.sources_used,
      confidence_score: result.confidence_score,
      success: true
    });

  } catch (error) {
    console.error('Mode 2 formatting error:', error);
    res.status(500).json({ 
      error: 'Failed to format transcript',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Phase 0: Mode-specific AWS configuration function
const getModeSpecificConfig = (mode: string, baseConfig: any) => {
  const config = {
    language_code: baseConfig.language_code,
    media_sample_rate_hz: baseConfig.media_sample_rate_hz,
  };

  switch (mode) {
    case 'word_for_word':
      return {
        ...config,
        show_speaker_labels: false,
        partial_results_stability: 'high' as const
        // vocabulary_name omitted - will be undefined
      };
    case 'smart_dictation':
      return {
        ...config,
        show_speaker_labels: true,
        partial_results_stability: 'high' as const,
        vocabulary_name: 'medical_terms_fr'  // When available
      };
    case 'ambient':
      return {
        ...config,
        show_speaker_labels: true,
        partial_results_stability: 'medium' as const
        // vocabulary_name omitted - will be undefined
      };
    default:
      // Fallback to current configuration
      return {
        ...config,
        show_speaker_labels: false,
        partial_results_stability: 'high' as const
        // vocabulary_name omitted - will be undefined
      };
  }
};

const wss = new WebSocketServer({ server });

// Store active transcription sessions - integrated with AWS Transcribe
const activeSessions = new Map();

wss.on('connection', (ws, req) => {
  let started = false;
  let sessionId = `dev-session-id`; // or your own
  let pushAudio: ((u8: Uint8Array) => void) | null = null;
  let endAudio: (() => void) | null = null;

  console.log("WebSocket connection established", { sessionId });
  
  // TODO: Add authentication here when WS_REQUIRE_AUTH is enabled
  let authenticatedUser: { userId: string; userEmail: string } | null = null;
  
  if (ENV.WS_REQUIRE_AUTH) {
    // Standardize on ws_token parameter
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const wsToken = url.searchParams.get('ws_token');
    
    if (!wsToken) {
      console.log('WebSocket connection rejected: No ws_token provided');
      ws.close(1008, 'Authentication required');
      return;
    }
    
    try {
      // TODO: Verify WS token
      const decoded = jwt.verify(wsToken, ENV.WS_JWT_SECRET || ENV.JWT_SECRET) as any;
      
      if (decoded.type !== 'ws_token') {
        console.log('WebSocket connection rejected: Invalid token type');
        ws.close(1008, 'Invalid token type');
        return;
      }
      
      authenticatedUser = {
        userId: decoded.userId,
        userEmail: decoded.userEmail,
      };
      
      console.log(`WebSocket authenticated for user: ${authenticatedUser.userEmail}`);
      
    } catch (error) {
      console.log('WebSocket connection rejected: Invalid token');
      ws.close(1008, 'Invalid token');
      return;
    }
  }
  
  // TODO: Add user context to connection
  (ws as any).user = authenticatedUser;

  ws.on('message', async (data, isBinary) => {
    if (!started) {
      // Expect the very first message to be start JSON
      try {
        const msg = JSON.parse(data.toString());
        if (msg?.type !== 'start_transcription' || !['fr-CA','en-US'].includes(msg.languageCode)) {
          ws.send(JSON.stringify({ type: 'transcription_error', error: 'Invalid languageCode' }));
          return ws.close();
        }
        started = true;

        // Phase 0: Use mode-specific configuration
        const modeConfig = getModeSpecificConfig(msg.mode || 'smart_dictation', {
          language_code: msg.languageCode, 
          media_sample_rate_hz: msg.sampleRate ?? 16000
        });

        // Start AWS stream (non-blocking) and expose feeder immediately
        const { pushAudio: feeder, endAudio: ender } =
          transcriptionService.startStreamingTranscription(
            sessionId,
            modeConfig,
            (res) => ws.send(JSON.stringify({ 
              type: 'transcription_result', 
              resultId: res.resultId,                         // stable key
              startTime: res.startTime ?? null,
              endTime: res.endTime ?? null,
              text: res.transcript, 
              isFinal: !res.is_partial,
              language_detected: res.language_detected,
              confidence_score: res.confidence_score,
              speaker: res.speaker                           // PATIENT vs CLINICIAN
            })),
            (err) => ws.send(JSON.stringify({ type: 'transcription_error', error: String(err) }))
          );

        pushAudio = feeder;
        endAudio = ender;

        // Store session info
        activeSessions.set(sessionId, { 
          ws, 
          pushAudio: feeder,
          endAudio: ender,
          config: msg
        });

        // Tell client to start mic now
        ws.send(JSON.stringify({ type: 'stream_ready' }));
      } catch {
        ws.send(JSON.stringify({ type: 'transcription_error', error: 'Expected start_transcription JSON' }));
        return ws.close();
      }
      return;
    }

    // After start: binary = audio; JSON = control
    if (isBinary) {
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
      if (buf.length && pushAudio) {
        // Optional debug:
        // console.log('chunk bytes:', buf.length);
        pushAudio(new Uint8Array(buf));
      }
      return;
    }

    try {
      const msg = JSON.parse(data.toString());
      if (msg?.type === 'stop_transcription') endAudio?.();
      
      // Handle voice commands
      if (msg?.type === 'cmd.save') {
        // TODO: implement save functionality
        console.log('Save command received for session:', sessionId);
        ws.send(JSON.stringify({ type:'cmd_ack', cmd:'save', ok:true }));
      }
      if (msg?.type === 'cmd.export') {
        // TODO: implement export functionality
        console.log('Export command received for session:', sessionId);
        ws.send(JSON.stringify({ type:'cmd_ack', cmd:'export', ok:true }));
      }
    } catch {}
  });

  ws.on('close', () => {
    endAudio?.();
    
    // Clean up session
    if (activeSessions.has(sessionId)) {
      activeSessions.delete(sessionId);
    }
    
    try {
      const status = transcriptionService.getStatus();
      console.log("Closed WebSocket. Transcription status:", status);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.warn("getStatus() not available:", errorMessage);
    }
  });

  // Send connection confirmation
  ws.send(JSON.stringify({
    type: 'connection_established',
    payload: {
      sessionId,
      timestamp: new Date()
    }
  }));
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  // Clean up transcription service
  await transcriptionService.cleanup();
  
  // Close WebSocket server
  wss.close(() => {
    console.log('WebSocket server closed');
  });
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default async function run() {
  return new Promise<void>((resolve) => {
    server.listen(3001, () => {
      console.log("✅ Backend listening on http://localhost:3001");
      console.log("📋 Phase 2: Raw PCM16 streaming implemented");
      console.log("🚀 Phase 3: AWS Transcribe integration active");
      console.log("🌍 AWS Region:", transcriptionService.getStatus().region);
      console.log("🎤 Ready for real-time transcription");
      
      // Template Library Status
      try {
        const templateStats = templateLibrary.getTemplateStats();
        console.log("📚 Template Library loaded:", templateStats.total, "templates");
        console.log("   - Section 7:", templateStats.bySection["7"], "templates");
        console.log("   - Section 8:", templateStats.bySection["8"], "templates");
        console.log("   - Section 11:", templateStats.bySection["11"], "templates");
        console.log("🔗 Template API endpoints available at /api/templates");
      } catch (error) {
        console.warn("⚠️ Template Library not available:", error);
      }
      
      resolve();
    });
  });
}

// Start the HTTP server immediately when this file is executed
server.listen(3001, () => {
  console.log("✅ Backend listening on http://localhost:3001");
  console.log("📋 Phase 2: Raw PCM16 streaming implemented");
  console.log("🚀 Phase 3: AWS Transcribe integration active");
  console.log("🌍 AWS Region:", transcriptionService.getStatus().region);
  console.log("🎤 Ready for real-time transcription");
  
  // Template Library Status
  try {
    const templateStats = templateLibrary.getTemplateStats();
    console.log("📚 Template Library loaded:", templateStats.total, "templates");
    console.log("   - Section 7:", templateStats.bySection["7"], "templates");
    console.log("   - Section 8:", templateStats.bySection["8"], "templates");
    console.log("   - Section 11:", templateStats.bySection["11"], "templates");
    console.log("🔗 Template API endpoints available at /api/templates");
  } catch (error) {
    console.warn("⚠️ Template Library not available:", error);
  }
});
