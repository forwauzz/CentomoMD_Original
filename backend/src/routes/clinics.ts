import { Router } from 'express';
import { getDb } from '../database/connection.js';
import { clinics } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

const router = Router();

// GET /api/clinics - Get all available clinics
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    
    logger.info('GET /api/clinics - Fetching all clinics');

    const allClinics = await db.select().from(clinics).orderBy(clinics.name);

    logger.info(`Retrieved ${allClinics.length} clinics`);

    res.json({
      success: true,
      data: allClinics,
      message: 'Clinics retrieved successfully'
    });

  } catch (error) {
    logger.error('Error fetching clinics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/clinics/:id - Get specific clinic by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    
    logger.info(`GET /api/clinics/${id} - Fetching clinic`);

    const clinic = await db.select().from(clinics).where(eq(clinics.id, id)).limit(1);

    if (clinic.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Clinic not found'
      });
    }

    logger.info(`Retrieved clinic: ${clinic[0].name}`);

    res.json({
      success: true,
      data: clinic[0],
      message: 'Clinic retrieved successfully'
    });

  } catch (error) {
    logger.error('Error fetching clinic:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
