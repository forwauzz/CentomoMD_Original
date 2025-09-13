import { Router } from 'express';
import { logger } from '@/utils/logger.js';

const router = Router();

// GET /api/transcripts - Get all transcripts for the authenticated user
router.get('/', async (_req, res) => {
  try {
    logger.info('GET /api/transcripts - Get all transcripts');
    res.json({ 
      success: true, 
      data: [],
      message: 'Transcripts endpoint - not yet implemented'
    });
  } catch (error) {
    logger.error('Error getting transcripts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// POST /api/transcripts - Create a new transcript
router.post('/', async (_req, res) => {
  try {
    logger.info('POST /api/transcripts - Create new transcript');
    res.json({ 
      success: true, 
      data: { id: 'temp-transcript-id' },
      message: 'Transcript creation endpoint - not yet implemented'
    });
  } catch (error) {
    logger.error('Error creating transcript:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// GET /api/transcripts/:id - Get a specific transcript
router.get('/:id', async (req, res) => {
  try {
    logger.info(`GET /api/transcripts/${req.params.id} - Get transcript`);
    
    // Get the transcript from the in-memory store
    const transcript = (global as any).finalTranscripts?.get(req.params.id);
    
    if (!transcript) {
      return res.status(404).json({ 
        success: false, 
        error: 'Transcript not found' 
      });
    }
    
    console.log('[API] Retrieved transcript:', JSON.stringify(transcript, null, 2));
    
    // Extract text from AWS result - try multiple paths
    let awsText = 'No transcript available';
    
    if (transcript.payload?.results?.transcripts?.[0]?.transcript) {
      awsText = transcript.payload.results.transcripts[0].transcript;
    } else if (transcript.payload?.results?.items) {
      // Fallback: reconstruct from items
      awsText = transcript.payload.results.items
        .filter((item: any) => item.type === 'pronunciation')
        .map((item: any) => item.alternatives?.[0]?.content || '')
        .join(' ')
        .trim();
    }
    
    console.log('[API] Extracted text:', awsText);
    
    res.json({ 
      success: true, 
      data: transcript,
      narrative: awsText
    });
  } catch (error) {
    logger.error('Error getting transcript:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export const transcriptController = router;
