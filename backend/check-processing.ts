import { getDb } from './src/database/connection.js';
import { artifacts } from './src/database/schema.js';
import { desc } from 'drizzle-orm';

async function checkRecentProcessing() {
  try {
    console.log('🔍 Checking for recent Mode 3 processing activity...\n');
    
    const db = getDb();
    
    // Get the 5 most recent artifacts
    const recentArtifacts = await db.select()
      .from(artifacts)
      .orderBy(desc(artifacts.created_at))
      .limit(5);
    
    if (recentArtifacts.length === 0) {
      console.log('❌ No processing artifacts found in database');
      return;
    }
    
    console.log(`✅ Found ${recentArtifacts.length} recent processing artifacts:\n`);
    
    recentArtifacts.forEach((artifact, index) => {
      console.log(`📋 Artifact ${index + 1}:`);
      console.log(`   Session ID: ${artifact.session_id}`);
      console.log(`   Created: ${artifact.created_at}`);
      console.log(`   Processing Time: ${JSON.stringify(artifact.processing_time)}`);
      
      if (artifact.narrative) {
        const narrative = typeof artifact.narrative === 'string' 
          ? JSON.parse(artifact.narrative) 
          : artifact.narrative;
        console.log(`   Narrative Format: ${narrative.format || 'unknown'}`);
        console.log(`   Narrative Content Preview: ${(narrative.content || '').substring(0, 100)}...`);
      }
      
      if (artifact.role_map) {
        const roleMap = typeof artifact.role_map === 'string' 
          ? JSON.parse(artifact.role_map) 
          : artifact.role_map;
        console.log(`   Role Map: ${JSON.stringify(roleMap)}`);
      }
      
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error checking processing activity:', error);
  }
}

checkRecentProcessing();
