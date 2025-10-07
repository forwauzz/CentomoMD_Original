import { Router } from 'express';
import { logger } from '@/utils/logger.js';
import { getDb } from '@/database/connection.js';
import { sessions, cases } from '@/database/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/sessions - Get all sessions for the authenticated user
router.get('/', async (req, res) => {
  try {
    logger.info('GET /api/sessions - Get all sessions');
    
    // Get user from authentication middleware
    const userId = (req as any).user?.user_id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const db = getDb();
    const userSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.user_id, userId));

    res.json({ 
      success: true, 
      data: userSessions,
      message: 'Sessions retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting sessions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// POST /api/sessions - Create a new session
router.post('/', async (req, res) => {
  try {
    logger.info('POST /api/sessions - Create new session');
    
    const { patient_id, case_id, consent_verified, mode, current_section } = req.body;
    
    // Get user from authentication middleware
    const userId = (req as any).user?.user_id;
    const clinicId = (req as any).user?.clinic_id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    if (!patient_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'patient_id is required' 
      });
    }

    // If case_id is provided, verify it exists and belongs to the user
    if (case_id) {
      const db = getDb();
      const existingCase = await db
        .select()
        .from(cases)
        .where(eq(cases.uid, case_id))
        .limit(1);
      
      if (existingCase.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Case not found' 
        });
      }
      
      if (existingCase[0].user_id !== userId) {
        return res.status(403).json({ 
          success: false, 
          error: 'Access denied to case' 
        });
      }
    }

    const db = getDb();
    const newSession = await db
      .insert(sessions)
      .values({
        user_id: userId,
        clinic_id: clinicId,
        case_id: case_id || null,
        patient_id,
        consent_verified: consent_verified || false,
        mode: mode || 'smart_dictation',
        current_section: current_section || 'section_7',
        status: 'active'
      })
      .returning();

    res.json({ 
      success: true, 
      data: newSession[0],
      message: 'Session created successfully'
    });
  } catch (error) {
    logger.error('Error creating session:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// GET /api/sessions/:id - Get a specific session
router.get('/:id', async (req, res) => {
  try {
    logger.info(`GET /api/sessions/${req.params.id} - Get session`);
    
    // Get user from authentication middleware
    const userId = (req as any).user?.user_id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const db = getDb();
    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, req.params.id))
      .limit(1);

    if (session.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Session not found' 
      });
    }

    // Check if user owns this session
    if (session[0].user_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied to session' 
      });
    }

    res.json({ 
      success: true, 
      data: session[0],
      message: 'Session retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting session:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export const sessionController = router;
