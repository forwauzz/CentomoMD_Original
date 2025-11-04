/**
 * Simple Bundle List Component
 * Displays all uploaded template bundles with filtering
 */

import React, { useState, useEffect } from 'react';
import { Package, Trash2, ChevronDown, ChevronRight, Search, Filter, X, Star, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';

interface Bundle {
  id: string;
  name: string;
  enabled: boolean;
  defaultVersionId: string | null;
  versions: Version[];
}

interface Version {
  id: string;
  semver: string;
  status: string;
  artifactsCount: number;
  createdAt: string;
  updatedAt: string;
}

export const BundleList: React.FC = () => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedBundles, setExpandedBundles] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  
  // Filtering state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterBundle, setFilterBundle] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadBundles();
  }, []);

  const loadBundles = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/templates/bundles');

      console.log('Bundle API response:', data); // Debug log

      if (!data.success) {
        throw new Error(data.error || 'Failed to load bundles');
      }

      setBundles(data.bundles || []);
    } catch (error) {
      console.error('Error loading bundles:', error);
      // Show error message to user
      alert(`Failed to load bundles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (bundleName: string) => {
    const newExpanded = new Set(expandedBundles);
    if (newExpanded.has(bundleName)) {
      newExpanded.delete(bundleName);
    } else {
      newExpanded.add(bundleName);
    }
    setExpandedBundles(newExpanded);
  };

  // Filter bundles based on search and filters
  const filteredBundles = bundles.filter((bundle) => {
    // Search filter (bundle name or version)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        bundle.name.toLowerCase().includes(searchLower) ||
        bundle.versions.some(v => 
          v.semver.toLowerCase().includes(searchLower) ||
          v.status.toLowerCase().includes(searchLower)
        );
      if (!matchesSearch) return false;
    }
    
    // Bundle name filter
    if (filterBundle !== 'all' && bundle.name !== filterBundle) {
      return false;
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      const hasMatchingStatus = bundle.versions.some(v => v.status === filterStatus);
      if (!hasMatchingStatus) return false;
    }
    
    return true;
  });

  // Get unique bundle names for filter
  const bundleNames = Array.from(new Set(bundles.map(b => b.name))).sort();
  
  // Expand all or collapse all
  const expandAll = () => {
    setExpandedBundles(new Set(filteredBundles.map(b => b.name)));
  };
  
  const collapseAll = () => {
    setExpandedBundles(new Set());
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setFilterBundle('all');
    setFilterStatus('all');
  };

  const handleDelete = async (bundleName: string, version: string) => {
    if (!confirm(`Delete version ${version} of ${bundleName}?`)) {
      return;
    }

    try {
      setDeleting(`${bundleName}-${version}`);
      const data = await apiFetch(`/api/templates/bundles/${bundleName}/${version}`, {
        method: 'DELETE',
      });

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete version');
      }

      // Reload bundles
      await loadBundles();
    } catch (error) {
      console.error('Error deleting version:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete version');
    } finally {
      setDeleting(null);
    }
  };

  const handleSetDefault = async (bundleName: string, versionId: string, versionSemver: string, isRollback: boolean = false) => {
    const message = isRollback 
      ? `Rollback ${bundleName} to version ${versionSemver}? This will set it as the default version.`
      : `Set version ${versionSemver} as the default for ${bundleName}?`;
    
    if (!confirm(message)) {
      return;
    }

    try {
      setSettingDefault(`${bundleName}-${versionId}`);
      const data = await apiFetch(`/api/templates/bundles/${bundleName}/default-version`, {
        method: 'PUT',
        body: JSON.stringify({ versionId }),
      });

      if (!data.success) {
        throw new Error(data.error || 'Failed to set default version');
      }

      // Reload bundles to reflect the change
      await loadBundles();
    } catch (error) {
      console.error('Error setting default version:', error);
      alert(error instanceof Error ? error.message : 'Failed to set default version');
    } finally {
      setSettingDefault(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-gray-600">Loading bundles...</p>
        </CardContent>
      </Card>
    );
  }

  if (bundles.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-gray-600">No bundles uploaded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </CardTitle>
            {(searchTerm || filterBundle !== 'all' || filterStatus !== 'all') && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div>
            <Label htmlFor="bundle-search">Search</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="bundle-search"
                type="text"
                placeholder="Search bundles or versions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="filter-bundle">Bundle Name</Label>
              <Select
                id="filter-bundle"
                value={filterBundle}
                onValueChange={setFilterBundle}
                items={[
                  { label: 'All Bundles', value: 'all' },
                  ...bundleNames.map(name => ({ label: name, value: name }))
                ]}
              />
            </div>
            <div>
              <Label htmlFor="filter-status">Status</Label>
              <Select
                id="filter-status"
                value={filterStatus}
                onValueChange={setFilterStatus}
                items={[
                  { label: 'All Statuses', value: 'all' },
                  { label: 'Stable', value: 'stable' },
                  { label: 'Draft', value: 'draft' },
                  { label: 'Deprecated', value: 'deprecated' }
                ]}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-gray-600">
              Showing {filteredBundles.length} of {bundles.length} bundle(s)
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="ghost" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bundle List */}
      {filteredBundles.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">No bundles match your filters.</p>
          </CardContent>
        </Card>
      ) : (
        filteredBundles.map((bundle) => (
        <Card key={bundle.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(bundle.name)}
                  className="p-0"
                >
                  {expandedBundles.has(bundle.name) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
                <Package className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <CardTitle className="text-lg">{bundle.name}</CardTitle>
                  <p className="text-xs text-gray-500 mt-1">
                    {bundle.versions.length} version(s) • {bundle.versions.reduce((sum, v) => sum + v.artifactsCount, 0)} total artifact(s)
                    {bundle.defaultVersionId && (
                      <> • Default: v{bundle.versions.find(v => v.id === bundle.defaultVersionId)?.semver || 'unknown'}</>
                    )}
                  </p>
                </div>
                {bundle.enabled && (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Enabled
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          {expandedBundles.has(bundle.name) && (
            <CardContent>
              <div className="space-y-3">
                {bundle.versions.length === 0 ? (
                  <p className="text-sm text-gray-500">No versions</p>
                ) : (
                  bundle.versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        {version.id === bundle.defaultVersionId && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                            Default
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={
                            version.status === 'stable' ? 'bg-blue-50 text-blue-700' :
                            version.status === 'draft' ? 'bg-gray-50 text-gray-700' :
                            'bg-red-50 text-red-700'
                          }
                        >
                          {version.status}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium text-sm">v{version.semver}</p>
                          <p className="text-xs text-gray-500">
                            {version.artifactsCount} artifact(s) • Created {new Date(version.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {version.id !== bundle.defaultVersionId && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefault(bundle.name, version.id, version.semver, true)}
                              disabled={settingDefault === `${bundle.name}-${version.id}`}
                              title="Rollback to this version"
                              className="text-orange-600 hover:text-orange-700 border-orange-300 hover:bg-orange-50"
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Rollback
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(bundle.name, version.id, version.semver)}
                              disabled={settingDefault === `${bundle.name}-${version.id}`}
                              title="Set as default version"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Star className="w-4 h-4 mr-1" />
                              Set Default
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(bundle.name, version.semver)}
                          disabled={deleting === `${bundle.name}-${version.semver}`}
                          title="Delete version"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          )}
        </Card>
        ))
      )}
    </div>
  );
};

