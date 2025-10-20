import { Router } from 'express';
import { logger } from '@/utils/logger.js';
import { getDb } from '@/database/connection.js';
import { cases, case_sessions, sessions } from '@/database/schema.js';
import { eq, and, desc, gte, lt } from 'drizzle-orm';
import { authenticateUser } from '../middleware/auth.js';
import { getClinicTemplate } from '../config/clinic-templates.js';

const router = Router();

// Test endpoint removed - was used for database connectivity testing during development

// GET /api/cases - Get all cases for the authenticated user with retention filtering
router.get('/', authenticateUser, async (req, res) => {
  try {
    // User is now guaranteed to be authenticated by middleware
    const user = req.user!;
    const user_id = user.id || user.user_id;

    const { limit = 10, days = 30, status } = req.query;
    
    logger.info('GET /api/cases - Get all cases', { 
      userId: user_id, 
      limit: limit, 
      days: days,
      status: status 
    });

    const db = getDb();
    
    // Build query with retention filtering
    const conditions = [eq(cases.user_id, user_id)];
    
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days as string));
      conditions.push(gte(cases.updated_at, cutoffDate));
    }
    
    let query = db.select().from(cases).where(and(...conditions));
    
    const userCases = await query
      .orderBy(desc(cases.updated_at))
      .limit(parseInt(limit as string));

    // Filter by status in application layer (since it's in JSONB draft)
    const filteredCases = status 
      ? userCases.filter(caseItem => (caseItem.draft as any)?.metadata?.status === status)
      : userCases;

    // Transform cases to match expected frontend format
    const transformedCases = filteredCases.map(caseItem => {
      const draft = caseItem.draft as any;
      return {
        id: caseItem.id,
        user_id: caseItem.user_id,
        clinic_id: caseItem.clinic_id,
        patient_info: draft?.patientInfo || {},
        sections: draft?.sections || {},
        metadata: draft?.metadata || {},
        status: draft?.metadata?.status || 'draft',
        created_at: caseItem.created_at,
        updated_at: caseItem.updated_at,
        draft: caseItem.draft
      };
    });

    logger.info(`Retrieved ${transformedCases.length} cases for user ${user.user_id}`);

    res.json({ 
      success: true, 
      data: transformedCases,
      message: `Cases retrieved successfully (retention: ${days} days)`
    });
  } catch (error) {
    logger.error('Error getting cases:', error);
    console.error('Full error details:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/cases - Create a new case
router.post('/', authenticateUser, async (req, res) => {
  try {
    // User is now guaranteed to be authenticated by middleware
    const user = req.user!;
    const user_id = user.id || user.user_id;

    const { patientInfo, sections, metadata, clinic_id } = req.body;

    // Generate automatic case name with date/time
    const now = new Date();
    const caseName = `Case ${now.toLocaleDateString('fr-CA')} ${now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}`;

    // Get clinic template text - use provided clinic_id or default clinic
    const effectiveClinicId = clinic_id || 'c761a142-0236-47c5-b894-2f9780ead241';
    let clinicTemplateText = '';
    
    const clinicTemplate = getClinicTemplate(effectiveClinicId);
    if (clinicTemplate) {
      clinicTemplateText = clinicTemplate.sectionC3Text;
      logger.info('Using clinic template for Section C3', { 
        clinicId: effectiveClinicId, 
        clinicName: clinicTemplate.name,
        isDefault: !clinic_id
      });
    }

    logger.info('POST /api/cases - Create new case', { 
      userId: user_id,
      hasPatientInfo: !!patientInfo,
      hasSections: !!sections,
      caseName: caseName,
      clinicId: clinic_id,
      hasClinicTemplate: !!clinicTemplateText
    });

    const db = getDb();
    
    // Create case with proper database persistence using existing schema
    
    // Ensure profile exists and is synced with auth data
    const { ensureProfileSynced } = await import('../utils/profileSync.js');
    await ensureProfileSynced(user.user_id, {
      email: user.email,
      user_metadata: user.user_metadata || {}
    });
    
    // Create the case with structured draft data
    const structuredDraft = {
      caseId: null, // Will be set after creation
      patientInfo: {
        name: caseName, // Auto-generated date/time name
        id: '',
        dob: '',
        gender: '',
        phone: '',
        email: '',
        address: ''
      },
      physicianInfo: {
        lastName: '',
        firstName: '',
        license: '',
        address: '',
        phone: '',
        email: ''
      },
      sections: {
        ...sections,
        // Pre-fill Section C3 with clinic template text if available
        ...(clinicTemplateText && {
          section_c_modalite: {
            modaliteText: clinicTemplateText,
            duree: '',
            modaliteCommentaires: ''
          }
        })
      },
      metadata: {
        language: metadata?.language || 'fr',
        status: 'draft',
        totalSections: 0,
        completedSections: 0,
        autoGeneratedName: true,
        lastAccessedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      ui: {
        activeSectionId: '',
        order: [],
        autosave: {}
      },
      sessions: []
    };
    
    const newCase = await db.insert(cases).values({
      user_id: user_id,
      clinic_id: clinic_id || 'c761a142-0236-47c5-b894-2f9780ead241', // Default to CMNDI clinic if none specified
      draft: structuredDraft
    }).returning();
    
    // Update the caseId in the draft
    if (newCase[0]) {
      const updatedDraft = {
        ...structuredDraft,
        caseId: newCase[0].id
      };
      
      const finalCase = await db.update(cases)
        .set({ draft: updatedDraft })
        .where(eq(cases.id, newCase[0].id))
        .returning();
      
      const result = finalCase[0];
      if (result) {
        result.draft = updatedDraft;
        logger.info(`Case created successfully: ${result.id} for user ${user_id}`);
        
        return res.json({ 
          success: true, 
          data: result,
          message: 'Case created successfully'
        });
      }
    }
    
    // Fallback if something went wrong
    logger.error('Case creation failed - no result returned');
    return res.status(500).json({ 
      success: false, 
      error: 'Case creation failed' 
    });
  } catch (error) {
    logger.error('Error creating case:', error);
    console.error('Full error details:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

// GET /api/cases/:id - Get a specific case
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const user = req.user!;
    const user_id = user.id || user.user_id;

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Case ID is required' 
      });
    }

    logger.info(`GET /api/cases/${id} - Get case`, { userId: user_id, caseId: id });

    const db = getDb();
    const caseData = await db.select().from(cases)
      .where(and(
        eq(cases.id, id),
        eq(cases.user_id, user_id)
      ));

    if (!caseData.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'Case not found' 
      });
    }

    return res.json({ 
      success: true, 
      data: caseData[0],
      message: 'Case retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting case:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// PUT /api/cases/:id - Update a case
router.put('/:id', async (req, res) => {
  try {
    // TODO: Implement proper authentication middleware
    // For development, use a mock user
    const user = (req as any).user;
    if (!user?.user_id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { id } = req.params;
    const { patientInfo, sections, metadata } = req.body;

    logger.info(`PUT /api/cases/${id} - Update case`, { 
      userId: user.user_id, 
      caseId: id,
      hasPatientInfo: !!patientInfo,
      hasSections: !!sections
    });

    const db = getDb();
    
    // Check if case exists and belongs to user
    const existingCase = await db.select().from(cases)
      .where(and(
        eq(cases.id, id),
        eq(cases.user_id, user.user_id)
      ));

    if (!existingCase.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'Case not found' 
      });
    }

    const updateData: any = {
      updated_at: new Date()
    };

    // Update draft field with new data
    const currentDraft = existingCase[0]?.draft as any || {};
    const updatedDraft = {
      ...currentDraft,
      ...(patientInfo && { patientInfo }),
      ...(sections && { sections }),
      ...(metadata && { metadata: { ...currentDraft.metadata, ...metadata } })
    };

    updateData.draft = updatedDraft;

    const updatedCase = await db.update(cases)
      .set(updateData)
      .where(eq(cases.id, id))
      .returning();

    return res.json({ 
      success: true, 
      data: updatedCase[0],
      message: 'Case updated successfully'
    });
  } catch (error) {
    logger.error('Error updating case:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// DELETE /api/cases/:id - Delete a case
router.delete('/:id', async (req, res) => {
  try {
    // TODO: Implement proper authentication middleware
    // For development, use a mock user
    const user = (req as any).user;
    if (!user?.user_id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { id } = req.params;

    logger.info(`DELETE /api/cases/${id} - Delete case`, { userId: user.user_id, caseId: id });

    const db = getDb();
    
    // Check if case exists and belongs to user
    const existingCase = await db.select().from(cases)
      .where(and(
        eq(cases.id, id),
        eq(cases.user_id, user.user_id)
      ));

    if (!existingCase.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'Case not found' 
      });
    }

    await db.delete(cases).where(eq(cases.id, id));

    return res.json({ 
      success: true, 
      message: 'Case deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting case:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// POST /api/cases/:id/sections/:sectionId - Update a specific section
router.post('/:id/sections/:sectionId', async (req, res) => {
  try {
    // TODO: Implement proper authentication middleware
    // For development, use a mock user
    const user = (req as any).user;
    if (!user?.user_id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { id, sectionId } = req.params;
    const { data, status } = req.body;

    logger.info(`POST /api/cases/${id}/sections/${sectionId} - Update section`, { 
      userId: user.user_id, 
      caseId: id, 
      sectionId,
      hasData: !!data,
      status: status
    });

    const db = getDb();
    
    // Get existing case
    const existingCase = await db.select().from(cases)
      .where(and(
        eq(cases.id, id),
        eq(cases.user_id, user.user_id)
      ));

    if (!existingCase.length) {
      logger.warn(`Case not found: ${id} for user: ${user.user_id}`);
      return res.status(404).json({ 
        success: false, 
        error: 'Case not found' 
      });
    }

    // Update section data in the draft
    const currentDraft = existingCase[0]?.draft as any || {};
    const currentSections = currentDraft.sections || {};
    
    currentSections[sectionId] = {
      ...currentSections[sectionId],
      data: data || currentSections[sectionId]?.data || {},
      status: status || currentSections[sectionId]?.status || 'in_progress',
      lastModified: new Date().toISOString()
    };

    // Update the draft with new sections and metadata
    const updatedDraft = {
      ...currentDraft,
      sections: currentSections,
      meta: {
        ...currentDraft.meta,
        updatedAt: new Date().toISOString(),
        status: status === 'completed' ? 'completed' : 'in_progress'
      }
    };

    logger.info(`Updating case ${id} with sections:`, Object.keys(currentSections));

    const updatedCase = await db.update(cases)
      .set({
        draft: updatedDraft,
        updated_at: new Date()
      })
      .where(eq(cases.id, id))
      .returning();

    logger.info(`Section ${sectionId} updated successfully for case ${id}`);

    return res.json({ 
      success: true, 
      data: updatedCase[0],
      message: 'Section updated successfully'
    });
  } catch (error) {
    logger.error('Error updating section:', error);
    console.error('Full error details:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/cases/:id/sessions - Link a dictation session to a case section
router.post('/:id/sessions', async (req, res) => {
  try {
    // TODO: Implement proper authentication middleware
    // For development, use a mock user
    const user = (req as any).user;
    if (!user?.user_id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { id } = req.params;
    const { sessionId, sectionId, content, formattedContent } = req.body;

    logger.info(`POST /api/cases/${id}/sessions - Link session to case`, { 
      userId: user.user_id, 
      caseId: id, 
      sessionId, 
      sectionId 
    });

    const db = getDb();
    
    // Verify case exists and belongs to user
    const existingCase = await db.select().from(cases)
      .where(and(
        eq(cases.id, id),
        eq(cases.user_id, user.user_id)
      ));

    if (!existingCase.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'Case not found' 
      });
    }

    // Verify session exists
    const existingSession = await db.select().from(sessions)
      .where(eq(sessions.id, sessionId));

    if (!existingSession.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'Session not found' 
      });
    }

    // Create case-session link
    const caseSession = await db.insert(case_sessions).values({
      case_id: id,
      section_id: sectionId,
      session_id: sessionId,
      content,
      formatted_content: formattedContent
    }).returning();

    return res.json({ 
      success: true, 
      data: caseSession[0],
      message: 'Session linked to case successfully'
    });
  } catch (error) {
    logger.error('Error linking session to case:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// POST /api/cases/cleanup - Clean up expired cases (admin endpoint)
router.post('/cleanup', async (req, res) => {
  try {
    // Get the authenticated user
    const user = (req as any).user;
    if (!user?.user_id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { days = 30, dryRun = false } = req.body;
    
    logger.info('POST /api/cases/cleanup - Clean up expired cases', { 
      userId: user.user_id, 
      days: days,
      dryRun: dryRun 
    });

    const db = getDb();
    
    // Calculate cutoff date for expired cases
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    // Find expired cases (filter by status in application layer)
    const expiredCases = await db.select().from(cases)
      .where(and(
        eq(cases.user_id, user.user_id),
        lt(cases.updated_at, cutoffDate)
      ));
    
    // Filter by draft status in application layer
    const draftCases = expiredCases.filter(c => (c.draft as any)?.metadata?.status === 'draft');

    if (dryRun) {
      return res.json({ 
        success: true, 
        data: {
          expiredCases: draftCases.length,
          cutoffDate: cutoffDate.toISOString(),
          cases: draftCases.map(c => ({ id: c.id, updated_at: c.updated_at }))
        },
        message: `Found ${draftCases.length} expired draft cases (dry run)`
      });
    }

    // Delete expired draft cases
    const caseIds = draftCases.map(c => c.id);
    const deletedCount = caseIds.length > 0 ? await db.delete(cases)
      .where(and(
        eq(cases.user_id, user.user_id),
        lt(cases.updated_at, cutoffDate)
      )) : { rowCount: 0 };

    return res.json({ 
      success: true, 
      data: {
        deletedCount: (deletedCount as any).rowCount || 0,
        cutoffDate: cutoffDate.toISOString()
      },
      message: `Cleaned up ${(deletedCount as any).rowCount || 0} expired cases`
    });
  } catch (error) {
    logger.error('Error cleaning up cases:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export const caseController = router;
