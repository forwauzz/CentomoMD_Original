/**
 * Template Bundle Management API Routes
 * Handles bundle uploads, versioning, and metadata management
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getSql } from '../database/connection.js';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Initialize Supabase Storage client
function getSupabaseStorageClient() {
  const supabaseUrl = process.env['SUPABASE_URL'] || ENV.SUPABASE_URL || '';
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || '';
  
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Helper: Compute SHA256 hash
function computeSHA256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

// Helper: Get content type from filename
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'md': return 'text/markdown';
    case 'json': return 'application/json';
    case 'jsonl': return 'application/x-ndjson';
    case 'xml': return 'application/xml';
    default: return 'text/plain';
  }
}

/**
 * POST /api/templates/bundles/upload
 * Upload a template bundle with artifacts
 * 
 * Body: {
 *   bundleName: string (e.g., "section7-ai-formatter")
 *   version: string (e.g., "current" or "1.0.0")
 *   setAsDefault: boolean
 *   artifacts: Array<{
 *     kind: string (e.g., "master_prompt", "json_config", "golden_example")
 *     locale?: string ("fr" | "en" | null)
 *     content: string
 *     filename: string
 *   }>
 * }
 */
router.post('/upload', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging
    logger.info('Bundle upload requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      bundleName: req.body.bundleName,
      version: req.body.version,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { bundleName, version, setAsDefault = false, artifacts } = req.body;
    
    // Validation
    if (!bundleName || !version || !Array.isArray(artifacts) || artifacts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: bundleName, version, artifacts'
      });
    }

    // Validate bundle name format
    if (!/^section[78](-ai-formatter|-rd)$/.test(bundleName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bundle name. Must be: section7-ai-formatter, section7-rd, or section8-ai-formatter'
      });
    }

    // Validate version format
    if (!/^[\w.-]+$/.test(version)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid version format'
      });
    }

    // Validate artifacts
    for (const artifact of artifacts) {
      if (!artifact.kind || !artifact.content || !artifact.filename) {
        return res.status(400).json({
          success: false,
          error: 'Each artifact must have: kind, content, filename'
        });
      }
    }

    const supabase = getSupabaseStorageClient();
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase Storage not configured'
      });
    }

    const sql = getSql();
    const uploadedArtifacts: any[] = [];

    // Step 1: Create or get template bundle
    let bundleResult = await sql`
      SELECT id FROM template_bundles WHERE name = ${bundleName} LIMIT 1
    `;
    
    let bundleId: string;
    if (bundleResult && bundleResult.length > 0) {
      bundleId = (bundleResult[0] as any)['id'];
    } else {
      const insertBundle = await sql`
        INSERT INTO template_bundles (name, enabled)
        VALUES (${bundleName}, true)
        RETURNING id
      `;
      bundleId = (insertBundle[0] as any)['id'];
    }
    
    // Step 2: Create or update template version
    const versionResult = await sql`
      INSERT INTO template_bundle_versions (template_bundle_id, semver, status)
      VALUES (${bundleId}, ${version}, 'stable')
      ON CONFLICT (template_bundle_id, semver) DO UPDATE
      SET status = 'stable', updated_at = now()
      RETURNING id
    `;
    
    const versionId = (versionResult[0] as any)['id'];
    
    // Step 3: Set as default if requested
    if (setAsDefault) {
      await sql`
        UPDATE template_bundles
        SET default_version_id = ${versionId}
        WHERE id = ${bundleId}
      `;
    }
    
    // Step 4: Upload artifacts to Storage and insert metadata
    for (const artifact of artifacts) {
      const sha256 = computeSHA256(artifact.content);
      const storagePath = `${bundleName}/${version}/${artifact.filename}`;
      const contentType = getContentType(artifact.filename);
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('template-artifacts')
        .upload(storagePath, artifact.content, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error(`Failed to upload ${storagePath}:`, uploadError);
        return res.status(500).json({
          success: false,
          error: `Failed to upload artifact: ${artifact.filename}`,
          details: uploadError.message
        });
      }

      // Insert artifact metadata
      await sql`
        INSERT INTO template_bundle_artifacts (
          template_bundle_version_id,
          kind,
          storage_path,
          sha256,
          size_bytes,
          content_type,
          locale
        )
        VALUES (
          ${versionId},
          ${artifact.kind},
          ${storagePath},
          ${sha256},
          ${artifact.content.length},
          ${contentType},
          ${artifact.locale || null}
        )
        ON CONFLICT DO NOTHING
      `;

      uploadedArtifacts.push({
        kind: artifact.kind,
        filename: artifact.filename,
        storagePath,
        sha256: sha256.substring(0, 8) + '...',
        sizeBytes: artifact.content.length
      });
    }

    // Audit logging for success
    logger.info('Bundle upload successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      bundleName,
      version,
      artifactsCount: uploadedArtifacts.length
    });

    return res.json({
      success: true,
      bundle: {
        id: bundleId,
        name: bundleName,
        version,
        versionId,
        artifactsCount: uploadedArtifacts.length,
        artifacts: uploadedArtifacts
      }
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Bundle upload failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Bundle upload error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload bundle',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/templates/bundles
 * List all template bundles with versions
 * NOTE: This route is handled by the explicit route in index.ts (line 1277) to avoid conflicts
 * with /api/templates/:section. The explicit route ensures it matches before the parameterized route.
 * This handler is commented out to prevent duplicate route registration.
 */
/*
router.get('/', authMiddleware, async (_req, res) => {
  try {
    const sql = getSql();
    
    const bundles = await sql`
      SELECT 
        b.id,
        b.name,
        b.enabled,
        b.default_version_id,
        v.id as version_id,
        v.semver,
        v.status,
        v.created_at,
        v.updated_at,
        COUNT(a.id) as artifacts_count
      FROM template_bundles b
      LEFT JOIN template_bundle_versions v ON b.id = v.template_bundle_id
      LEFT JOIN template_bundle_artifacts a ON v.id = a.template_bundle_version_id
      GROUP BY b.id, v.id
      ORDER BY b.name, v.semver DESC
    `;
    
    // Group by bundle
    const grouped: Record<string, any> = {};
    for (const row of bundles) {
      const bundleName = (row as any)['name'];
      if (!grouped[bundleName]) {
        grouped[bundleName] = {
          id: (row as any)['id'],
          name: bundleName,
          enabled: (row as any)['enabled'],
          defaultVersionId: (row as any)['default_version_id'],
          versions: []
        };
      }
      
      if ((row as any)['version_id']) {
        grouped[bundleName].versions.push({
          id: (row as any)['version_id'],
          semver: (row as any)['semver'],
          status: (row as any)['status'],
          artifactsCount: parseInt((row as any)['artifacts_count']) || 0,
          createdAt: (row as any)['created_at'],
          updatedAt: (row as any)['updated_at']
        });
      }
    }
    
    return res.json({
      success: true,
      bundles: Object.values(grouped)
    });
  } catch (error) {
    console.error('Error listing bundles:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to list bundles',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
*/

/**
 * GET /api/templates/bundles/by-template/:templateId
 * Get bundle versions for a template ID
 */
router.get('/by-template/:templateId', authMiddleware, async (req, res) => {
  try {
    const { templateId } = req.params;
    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Missing template ID'
      });
    }
    
    // Map template ID to bundle name
    const templateToBundleMap: Record<string, string> = {
      'section7-ai-formatter': 'section7-ai-formatter',
      'section7-rd': 'section7-rd',
      'section8-ai-formatter': 'section8-ai-formatter',
    };
    
    const bundleName = templateToBundleMap[templateId];
    if (!bundleName) {
      return res.status(404).json({
        success: false,
        error: 'Template not found or does not have versioned bundles'
      });
    }
    
    const sql = getSql();
    
    // Get bundle info
    const bundleResult = await sql`
      SELECT id, name, enabled, default_version_id
      FROM template_bundles WHERE name = ${bundleName} LIMIT 1
    `;
    
    if (!bundleResult || bundleResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Bundle not found'
      });
    }
    
    const bundle = bundleResult[0] as any;
    
    // Get versions with artifact counts
    const versions = await sql`
      SELECT 
        v.id,
        v.semver,
        v.status,
        v.created_at,
        v.updated_at,
        COUNT(a.id) as artifacts_count
      FROM template_bundle_versions v
      LEFT JOIN template_bundle_artifacts a ON v.id = a.template_bundle_version_id
      WHERE v.template_bundle_id = ${bundle.id}
      GROUP BY v.id
      ORDER BY v.semver DESC
    `;
    
    return res.json({
      success: true,
      templateId,
      bundleName,
      defaultVersionId: bundle.default_version_id,
      versions: versions.map((v: any) => ({
        id: v.id,
        semver: v.semver,
        status: v.status,
        artifactsCount: parseInt(v.artifacts_count) || 0,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
        isDefault: v.id === bundle.default_version_id
      }))
    });
  } catch (error) {
    console.error('Error getting template versions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get template versions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/templates/bundles/:bundleName
 * Get bundle details with artifacts
 */
router.get('/:bundleName', authMiddleware, async (req, res) => {
  try {
    const { bundleName } = req.params;
    if (!bundleName) {
      return res.status(400).json({
        success: false,
        error: 'Missing bundle name'
      });
    }
    const sql = getSql();
    
    // Get bundle info
    const bundleResult = await sql`
      SELECT * FROM template_bundles WHERE name = ${bundleName} LIMIT 1
    `;
    
    if (!bundleResult || bundleResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Bundle not found'
      });
    }
    
    const bundle = bundleResult[0];
    
    // Get versions with artifacts
    const versions = await sql`
      SELECT 
        v.*,
        json_agg(
          json_build_object(
            'id', a.id,
            'kind', a.kind,
            'storagePath', a.storage_path,
            'sha256', a.sha256,
            'sizeBytes', a.size_bytes,
            'contentType', a.content_type,
            'locale', a.locale
          )
        ) as artifacts
      FROM template_bundle_versions v
      LEFT JOIN template_bundle_artifacts a ON v.id = a.template_bundle_version_id
      WHERE v.template_bundle_id = ${(bundle as any)['id']}
      GROUP BY v.id
      ORDER BY v.semver DESC
    `;
    
    return res.json({
      success: true,
      bundle: {
        ...bundle,
        versions: versions.map((v: any) => ({
          ...v,
          artifacts: v.artifacts[0].id ? v.artifacts : []
        }))
      }
    });
  } catch (error) {
    console.error('Error getting bundle:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get bundle',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/templates/bundles/:bundleName/:version
 * Delete a specific version (and its artifacts from Storage)
 */
router.delete('/:bundleName/:version', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  
  try {
    const { bundleName, version } = req.params;
    if (!bundleName || !version) {
      return res.status(400).json({
        success: false,
        error: 'Missing bundle name or version'
      });
    }
    const sql = getSql();
    
    // Get bundle and version
    const versionResult = await sql`
      SELECT v.id, v.semver
      FROM template_bundle_versions v
      JOIN template_bundles b ON v.template_bundle_id = b.id
      WHERE b.name = ${bundleName} AND v.semver = ${version}
      LIMIT 1
    `;
    
    if (!versionResult || versionResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Version not found'
      });
    }
    
    const versionId = (versionResult[0] as any)['id'];
    
    // Get artifacts to delete from Storage
    const artifacts = await sql`
      SELECT storage_path FROM template_bundle_artifacts
      WHERE template_bundle_version_id = ${versionId}
    `;
    
    // Delete from Storage
    const supabase = getSupabaseStorageClient();
    if (supabase) {
      for (const artifact of artifacts) {
        await supabase.storage
          .from('template-artifacts')
          .remove([(artifact as any)['storage_path']]);
      }
    }
    
    // Delete from Postgres (cascade will delete artifacts)
    await sql`
      DELETE FROM template_bundle_versions WHERE id = ${versionId}
    `;
    
    // Audit logging
    logger.info('Bundle version deleted', {
      userId: user?.user_id,
      userEmail: user?.email,
      bundleName,
      version,
      artifactsDeleted: artifacts.length
    });
    
    return res.json({
      success: true,
      message: `Version ${version} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting version:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete version',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/templates/bundles/:bundleName/default-version
 * Set the default version for a bundle
 */
router.put('/:bundleName/default-version', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  
  try {
    const { bundleName } = req.params;
    const { versionId } = req.body;
    
    if (!bundleName) {
      return res.status(400).json({
        success: false,
        error: 'Missing bundle name'
      });
    }
    
    if (!versionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing versionId in request body'
      });
    }
    
    // Audit logging
    logger.info('Set default version requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      bundleName,
      versionId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    const sql = getSql();
    
    // Verify bundle exists
    const bundleResult = await sql`
      SELECT id FROM template_bundles WHERE name = ${bundleName} LIMIT 1
    `;
    
    if (!bundleResult || bundleResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Bundle not found'
      });
    }
    
    const bundle = bundleResult[0] as { id: string };
    
    // Verify version exists and belongs to this bundle
    const versionResult = await sql`
      SELECT id, semver, status
      FROM template_bundle_versions
      WHERE id = ${versionId} AND template_bundle_id = ${bundle.id}
      LIMIT 1
    `;
    
    if (!versionResult || versionResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Version not found or does not belong to this bundle'
      });
    }
    
    const version = versionResult[0] as { id: string; semver: string; status: string };
    
    // Update default version
    await sql`
      UPDATE template_bundles
      SET default_version_id = ${version.id}, updated_at = now()
      WHERE id = ${bundle.id}
    `;
    
    logger.info('Default version set successfully', {
      userId: user?.user_id,
      userEmail: user?.email,
      bundleName,
      versionId: version.id,
      semver: version.semver,
      status: version.status
    });
    
    return res.json({
      success: true,
      message: 'Default version set successfully',
      bundle: {
        name: bundleName,
        defaultVersion: {
          id: version.id,
          semver: version.semver,
          status: version.status
        }
      }
    });
  } catch (error) {
    console.error('Error setting default version:', error);
    
    logger.error('Error setting default version', {
      userId: user?.user_id,
      userEmail: user?.email,
      bundleName: req.params['bundleName'],
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to set default version',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

