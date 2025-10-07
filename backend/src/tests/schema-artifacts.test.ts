import { describe, it, expect, beforeEach } from 'vitest';
import { getDb } from '../database/connection.js';
import { artifacts, sessions, users, clinics } from '../database/schema.js';
import { eq } from 'drizzle-orm';

describe('Artifacts Schema', () => {
  let db: ReturnType<typeof getDb>;
  let testUserId: string;
  let testClinicId: string;
  let testSessionId: string;

  beforeEach(async () => {
    db = getDb();
    
    // Clean up any existing test data
    await db.delete(artifacts);
    await db.delete(sessions);
    await db.delete(clinics);
    await db.delete(users);
    
    // Create test clinic
    const [clinic] = await db.insert(clinics).values({
      name: 'Test Clinic',
      address: '123 Test St',
      phone: '555-0123',
      email: 'test@clinic.com'
    }).returning();
    testClinicId = clinic.id;
    
    // Create test user
    const [user] = await db.insert(users).values({
      email: 'test@example.com',
      name: 'Test User',
      role: 'doctor',
      clinic_id: testClinicId
    }).returning();
    testUserId = user.id;
    
    // Create test session
    const [session] = await db.insert(sessions).values({
      user_id: testUserId,
      clinic_id: testClinicId,
      patient_id: 'PATIENT-001', // Required field
      status: 'active',
      mode: 'ambient'
    }).returning();
    testSessionId = session.id;
  });

  it('should insert a minimal artifacts row', async () => {
    const testArtifact = {
      session_id: testSessionId,
      ir: {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.5,
            text: 'Bonjour docteur',
            isPartial: false
          }
        ],
        metadata: {
          speakerCount: 1,
          totalDuration: 2.5
        }
      },
      role_map: {
        'spk_0': 'PATIENT'
      },
      narrative: {
        content: 'PATIENT: Bonjour docteur',
        format: 'role_prefixed'
      },
      processing_time: {
        total: 150,
        stages: {
          s1: 50,
          s2: 30,
          s3: 20,
          s4: 25,
          s5: 25
        }
      }
    };

    const [insertedArtifact] = await db.insert(artifacts).values(testArtifact).returning();

    expect(insertedArtifact).toBeDefined();
    expect(insertedArtifact.id).toBeDefined();
    expect(insertedArtifact.session_id).toBe(testSessionId);
    expect(insertedArtifact.ir).toEqual(testArtifact.ir);
    expect(insertedArtifact.role_map).toEqual(testArtifact.role_map);
    expect(insertedArtifact.narrative).toEqual(testArtifact.narrative);
    expect(insertedArtifact.processing_time).toEqual(testArtifact.processing_time);
    expect(insertedArtifact.created_at).toBeDefined();
  });

  it('should handle artifacts with minimal required fields', async () => {
    const minimalArtifact = {
      session_id: testSessionId,
      ir: { turns: [], metadata: { speakerCount: 0, totalDuration: 0 } },
      role_map: {},
      narrative: { content: '', format: 'single_block' }
    };

    const [insertedArtifact] = await db.insert(artifacts).values(minimalArtifact).returning();

    expect(insertedArtifact).toBeDefined();
    expect(insertedArtifact.session_id).toBe(testSessionId);
    expect(insertedArtifact.processing_time).toBeNull();
  });

  it('should enforce foreign key constraint on session_id', async () => {
    const invalidArtifact = {
      session_id: '00000000-0000-0000-0000-000000000000', // Non-existent session
      ir: { turns: [], metadata: { speakerCount: 0, totalDuration: 0 } },
      role_map: {},
      narrative: { content: '', format: 'single_block' }
    };

    await expect(
      db.insert(artifacts).values(invalidArtifact)
    ).rejects.toThrow();
  });

  it('should cascade delete when session is deleted', async () => {
    // Insert an artifact
    await db.insert(artifacts).values({
      session_id: testSessionId,
      ir: { turns: [], metadata: { speakerCount: 0, totalDuration: 0 } },
      role_map: {},
      narrative: { content: 'Test', format: 'single_block' }
    });

    // Verify artifact exists
    const artifactsBefore = await db.select().from(artifacts).where(eq(artifacts.session_id, testSessionId));
    expect(artifactsBefore).toHaveLength(1);

    // Delete the session
    await db.delete(sessions).where(eq(sessions.id, testSessionId));

    // Verify artifact is cascade deleted
    const artifactsAfter = await db.select().from(artifacts).where(eq(artifacts.session_id, testSessionId));
    expect(artifactsAfter).toHaveLength(0);
  });

  it('should support multiple artifacts per session', async () => {
    const artifact1 = {
      session_id: testSessionId,
      ir: { turns: [], metadata: { speakerCount: 1, totalDuration: 5.0 } },
      role_map: { 'spk_0': 'PATIENT' },
      narrative: { content: 'First processing', format: 'role_prefixed' }
    };

    const artifact2 = {
      session_id: testSessionId,
      ir: { turns: [], metadata: { speakerCount: 2, totalDuration: 10.0 } },
      role_map: { 'spk_0': 'PATIENT', 'spk_1': 'CLINICIAN' },
      narrative: { content: 'Second processing', format: 'role_prefixed' }
    };

    await db.insert(artifacts).values([artifact1, artifact2]);

    const sessionArtifacts = await db.select().from(artifacts).where(eq(artifacts.session_id, testSessionId));
    expect(sessionArtifacts).toHaveLength(2);
  });
});
