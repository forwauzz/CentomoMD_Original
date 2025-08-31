import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';

import { transcriptionService } from './services/transcriptionService.js';
import { TranscriptionConfig, TranscriptionResult } from './types/index.js';
import { templateLibrary } from './template-library/index.js';
import { AIFormattingService } from './services/aiFormattingService.js';
import { getConfig } from './routes/config.js';
import { securityMiddleware } from './server/security.js';

const app = express();
const server = http.createServer(app);

// TODO: Apply security middleware
app.use(securityMiddleware);

// TODO: Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Config endpoint to expose flags to frontend
app.get('/api/config', getConfig);

// Template Library API Endpoints
app.get('/api/templates', (req, res) => {
  try {
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
    
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
});

app.get('/api/templates/stats', (req, res) => {
  try {
    const stats = templateLibrary.getTemplateStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching template stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch template stats' });
  }
});

// AI Formatting API Endpoint
app.post('/api/templates/format', (req, res) => {
  try {
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
    
    res.json({ 
      success: true, 
      data: formattedContent 
    });
  } catch (error) {
    console.error('Error formatting template content:', error);
    res.status(500).json({ success: false, error: 'Failed to format template content' });
  }
});

// Template CRUD Operations
app.post('/api/templates', async (req, res) => {
  try {
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
    
    res.json({ 
      success: true, 
      data: newTemplate,
      message: 'Template created successfully'
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

app.put('/api/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, section, language, complexity, category, tags, version } = req.body;
    
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
    
    res.json({ 
      success: true, 
      data: updatedTemplate,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ success: false, error: 'Failed to update template' });
  }
});

app.delete('/api/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { section } = req.query;
    
    if (!section || !['7', '8', '11'].includes(section as string)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing or invalid section parameter' 
      });
    }
    
    console.log('Deleting template:', id, 'from section:', section);
    
    // Delete template from the template library
    await templateLibrary.deleteTemplate(id, section as "7" | "8" | "11");
    
    res.json({ 
      success: true, 
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ success: false, error: 'Failed to delete template' });
  }
});

// Advanced Template Features API Endpoints

// Get template versions
app.get('/api/templates/:id/versions', (req, res) => {
  try {
    const { id } = req.params;
    const versions = templateLibrary.getTemplateVersions(id);
    
    res.json({ 
      success: true, 
      data: versions 
    });
  } catch (error) {
    console.error('Error fetching template versions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch template versions' });
  }
});

// Get template analytics
app.get('/api/templates/analytics', (req, res) => {
  try {
    const analytics = templateLibrary.getAnalytics();
    
    res.json({ 
      success: true, 
      data: analytics 
    });
  } catch (error) {
    console.error('Error fetching template analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch template analytics' });
  }
});

// Get templates by section (must come after /analytics to avoid route conflict)
app.get('/api/templates/:section', (req, res) => {
  try {
    const { section } = req.params;
    const { language, search, tags } = req.query;
    
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
    
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching templates by section:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
});

// Track template usage
app.post('/api/templates/:id/usage', async (req, res) => {
  try {
    const { id } = req.params;
    const { section, language, user_id, session_id, performance_rating } = req.body;
    
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
    
    res.json({ 
      success: true, 
      message: 'Usage tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking template usage:', error);
    res.status(500).json({ success: false, error: 'Failed to track usage' });
  }
});

// Advanced search
app.post('/api/templates/search', (req, res) => {
  try {
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
    
    res.json({ 
      success: true, 
      data: templates 
    });
  } catch (error) {
    console.error('Error performing advanced search:', error);
    res.status(500).json({ success: false, error: 'Failed to perform search' });
  }
});

// Export templates
app.get('/api/templates/export', (req, res) => {
  try {
    const { section } = req.query;
    const templates = templateLibrary.exportTemplates(section as "7" | "8" | "11");
    
    res.json({ 
      success: true, 
      data: templates 
    });
  } catch (error) {
    console.error('Error exporting templates:', error);
    res.status(500).json({ success: false, error: 'Failed to export templates' });
  }
});

// Import templates
app.post('/api/templates/import', async (req, res) => {
  try {
    const { templates } = req.body;
    
    if (!Array.isArray(templates)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Templates must be an array' 
      });
    }
    
    await templateLibrary.importTemplates(templates);
    
    res.json({ 
      success: true, 
      message: `${templates.length} templates imported successfully`
    });
  } catch (error) {
    console.error('Error importing templates:', error);
    res.status(500).json({ success: false, error: 'Failed to import templates' });
  }
});

// Bulk operations
app.post('/api/templates/bulk/status', async (req, res) => {
  try {
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
    
    res.json({ 
      success: true, 
      message: `${templateIds.length} templates updated successfully`
    });
  } catch (error) {
    console.error('Error performing bulk status update:', error);
    res.status(500).json({ success: false, error: 'Failed to update templates' });
  }
});

app.post('/api/templates/bulk/delete', async (req, res) => {
  try {
    const { templateIds } = req.body;
    
    if (!Array.isArray(templateIds)) {
      return res.status(400).json({ 
        success: false, 
        error: 'templateIds must be an array' 
      });
    }
    
    await templateLibrary.bulkDelete(templateIds);
    
    res.json({ 
      success: true, 
      message: `${templateIds.length} templates deleted successfully`
    });
  } catch (error) {
    console.error('Error performing bulk delete:', error);
    res.status(500).json({ success: false, error: 'Failed to delete templates' });
  }
});

const wss = new WebSocketServer({ server });

// Store active transcription sessions - integrated with AWS Transcribe
const activeSessions = new Map();

wss.on('connection', (ws, req) => {
  let started = false;
  let sessionId = `dev-session-id`; // or your own
  let pushAudio: ((u8: Uint8Array) => void) | null = null;
  let endAudio: (() => void) | null = null;

  console.log("WebSocket connection established", { sessionId });

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

        // Start AWS stream (non-blocking) and expose feeder immediately
        const { pushAudio: feeder, endAudio: ender } =
          transcriptionService.startStreamingTranscription(
            sessionId,
            { 
              language_code: msg.languageCode, 
              media_sample_rate_hz: msg.sampleRate ?? 16000, 
              show_speaker_labels: false 
            },
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
