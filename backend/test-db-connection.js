console.log('Starting database connection test...');

// Load environment variables
require('dotenv').config();

const postgres = require('postgres');

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ No DATABASE_URL found in environment variables');
    return;
  }
  
  console.log('Testing database connection...');
  console.log('Connection string:', connectionString.replace(/:[^:@]*@/, ':****@'));
  
  try {
    console.log('Creating postgres client...');
    const sql = postgres(connectionString, {
      max: 1,
      connect_timeout: 10,
      ssl: false, // Try without SSL first
    });
    
    console.log('Attempting to connect...');
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Connection successful!', result);
    
    await sql.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error);
    
    // Try with SSL
    console.log('\nTrying with SSL...');
    try {
      const sqlSSL = postgres(connectionString, {
        max: 1,
        connect_timeout: 10,
        ssl: { rejectUnauthorized: false },
      });
      
      const resultSSL = await sqlSSL`SELECT 1 as test`;
      console.log('✅ Connection successful with SSL!', resultSSL);
      
      await sqlSSL.end();
    } catch (sslError) {
      console.error('❌ SSL connection also failed:', sslError.message);
      console.error('SSL Error code:', sslError.code);
    }
  }
}

console.log('Calling testConnection...');
testConnection().then(() => {
  console.log('Test completed.');
}).catch(err => {
  console.error('Test failed with error:', err);
});
