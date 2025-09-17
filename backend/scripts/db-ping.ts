import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL!;
console.log('Testing connection to:', url.replace(/:[^:@]*@/, ':****@'));

const sql = postgres(url, { 
  ssl: 'require', 
  prepare: false 
});

try {
  const r = await sql`select now() as t`;
  console.log('✅ DB now():', r[0].t);
  console.log('✅ Database connection successful!');
} catch (error) {
  console.error('❌ Database connection failed:', error);
  process.exit(1);
} finally {
  await sql.end();
}
