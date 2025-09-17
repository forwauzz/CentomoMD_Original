import { getDb } from './src/database/connection.js';
import { profiles } from './src/database/schema.js';

async function checkProfiles() {
  try {
    const db = getDb();
    const result = await db.select().from(profiles);
    console.log('All profiles in database:');
    console.table(result);
    
    if (result.length === 0) {
      console.log('\n❌ No profiles found in database!');
      console.log('This explains why profile_display_name is undefined.');
    } else {
      console.log(`\n✅ Found ${result.length} profile(s)`);
    }
  } catch (error) {
    console.error('Error checking profiles:', error);
  }
}

checkProfiles();
