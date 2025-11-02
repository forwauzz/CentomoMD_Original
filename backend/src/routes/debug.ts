import { Router } from 'express';
import { getSql } from '../database/connection.js';

const router = Router();

// GET /api/debug/supabase-structure - Read-only query to understand Supabase structure
router.get('/supabase-structure', async (_req, res) => {
  try {
    const sql = getSql();
    
    console.log('🔍 [Debug] Running Supabase structure queries...');
    
    // 1. Check all tables in the public schema
    const tablesResult = await sql`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    // 2. Check foreign key relationships for sessions and cases tables
    const fkResult = await sql`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name IN ('sessions', 'cases', 'profiles')
      ORDER BY tc.table_name, kcu.column_name
    `;
    
    // 3. Check the structure of key tables
    const columnsResult = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
          AND table_name IN ('sessions', 'cases', 'profiles')
      ORDER BY table_name, ordinal_position
    `;
    
    // 4. Check auth.users table (Supabase managed)
    const authUsersCountResult = await sql`SELECT COUNT(*) as auth_user_count FROM auth.users`;
    
    // 5. Check profiles table sample data
    const profilesResult = await sql`
      SELECT user_id, display_name, locale, created_at
      FROM profiles 
      LIMIT 5
    `;
    
    console.log('✅ [Debug] Supabase structure queries completed');
    
    return res.json({
      success: true,
      data: {
        tables: tablesResult,
        foreignKeys: fkResult,
        columns: columnsResult,
        authUsersCount: authUsersCountResult[0]?.['auth_user_count'] || 0,
        profilesSample: profilesResult
      }
    });
    
  } catch (error) {
    console.error('❌ [Debug] Failed to get Supabase structure:', error);
    return res.status(500).json({
      error: 'Failed to get Supabase structure',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
