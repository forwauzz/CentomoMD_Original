/**
 * Template Usage Statistics Component
 * Displays template usage and feedback statistics for users
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Star, TrendingUp, Users, Loader2 } from 'lucide-react';
import { apiJSON } from '@/lib/api';
import { useTemplates } from '@/contexts/TemplateContext';

interface TemplateStats {
  templateId: string;
  templateName: string;
  usage: {
    totalUsage: number;
    uniqueUsers: number;
    lastUsedAt: Date | null;
  };
  feedback: {
    avgRating: number;
    ratingCount: number;
    successCount: number;
    dismissalCount: number;
  };
}

export const TemplateUsageStats: React.FC = () => {
  const { templates } = useTemplates();
  const [stats, setStats] = useState<TemplateStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch stats for all templates
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch stats for all active templates
        const statsPromises = templates.slice(0, 5).map(async (template) => {
          try {
            const response = await apiJSON<{
              success: boolean;
              data: {
                usage: {
                  totalUsage: number;
                  uniqueUsers: number;
                  lastUsedAt: string | null;
                };
                feedback: {
                  avgRating: number;
                  ratingCount: number;
                  successCount: number;
                  dismissalCount: number;
                };
              };
            }>(`/api/templates/${template.id}/summary`);

            if (response.success && response.data) {
              return {
                templateId: template.id,
                templateName: template.name || template.nameFr || template.id,
                usage: {
                  ...response.data.usage,
                  lastUsedAt: response.data.usage.lastUsedAt
                    ? new Date(response.data.usage.lastUsedAt)
                    : null,
                },
                feedback: response.data.feedback,
              };
            }
            return null;
          } catch (err) {
            // Skip templates that fail (user may not have permission or template may not exist)
            console.warn(`Failed to fetch stats for template ${template.id}:`, err);
            return null;
          }
        });

        const results = await Promise.all(statsPromises);
        const validStats = results.filter(
          (stat): stat is TemplateStats => stat !== null
        );

        // Sort by total usage (most used first)
        validStats.sort((a, b) => b.usage.totalUsage - a.usage.totalUsage);

        setStats(validStats);
      } catch (err) {
        console.error('Failed to fetch template stats:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    if (templates.length > 0) {
      fetchStats();
    }
  }, [templates]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Template Usage Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Loading statistics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Template Usage Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Template Usage Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No statistics available yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Statistics will appear after templates are used.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Template Usage Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat) => (
          <div
            key={stat.templateId}
            className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 transition-colors"
          >
            {/* Template Name */}
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-gray-900">
                {stat.templateName}
              </h4>
              {stat.feedback.avgRating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-medium text-gray-700">
                    {stat.feedback.avgRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({stat.feedback.ratingCount})
                  </span>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              {/* Total Usage */}
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Total Uses</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {stat.usage.totalUsage}
                  </p>
                </div>
              </div>

              {/* Unique Users */}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">Users</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {stat.usage.uniqueUsers}
                  </p>
                </div>
              </div>

              {/* Rating Count */}
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-xs text-gray-500">Ratings</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {stat.feedback.ratingCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Success Rate */}
            {stat.feedback.ratingCount > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Success Rate</span>
                  <span className="text-xs font-medium text-gray-700">
                    {stat.feedback.successCount > 0
                      ? Math.round(
                          (stat.feedback.successCount / stat.feedback.ratingCount) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}

        {stats.length >= 5 && (
          <p className="text-xs text-gray-500 text-center pt-2">
            Showing top {stats.length} templates
          </p>
        )}
      </CardContent>
    </Card>
  );
};

