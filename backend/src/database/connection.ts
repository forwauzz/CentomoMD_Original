import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

// Database connection configuration
const connectionString = process.env['DATABASE_URL'] || process.env['SUPABASE_DB_URL'] || '';

let db: any;
let client: any;

if (!connectionString) {
  console.warn('⚠️  No DATABASE_URL or SUPABASE_DB_URL found. Database features will be disabled.');
  console.warn('   Set DATABASE_URL in your .env file to enable database features.');
  
  // Create a mock client for development without database
  const mockClient = {
    end: async () => console.log('Mock database client closed'),
    unsafe: async () => { throw new Error('Database not configured'); }
  };
  
  db = drizzle(mockClient as any, { schema });
  client = mockClient;
} else {
  try {
    // Validate the URL format
    new URL(connectionString);
    
    // Create postgres connection
    const postgresClient = postgres(connectionString, {
      max: 10, // Maximum number of connections
      idle_timeout: 20, // Close idle connections after 20 seconds
      connect_timeout: 10, // Connection timeout
      ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Create Drizzle instance
    db = drizzle(postgresClient, { schema });
    client = postgresClient;
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Closing database connections...');
      await postgresClient.end();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('Closing database connections...');
      await postgresClient.end();
      process.exit(0);
    });
    
    console.log('✅ Database connection configured successfully');
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format:', error);
    console.error('   Current DATABASE_URL:', connectionString);
    console.error('   Please check your .env file and ensure the URL is properly formatted.');
    console.error('   Example format: postgresql://username:password@host:port/database');
    
    // Create a mock client for development
    const mockClient = {
      end: async () => console.log('Mock database client closed'),
      unsafe: async () => { throw new Error('Database URL is invalid'); }
    };
    
    db = drizzle(mockClient as any, { schema });
    client = mockClient;
  }
}

export { db, client };
