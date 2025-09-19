/**
 * Review Tab
 * List and manage saved feedback items
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Trash2, Download, Filter, CheckCircle, Clock, Eye } from 'lucide-react';
import { useFeedbackStore } from '@/stores/feedbackStore';
import { FEEDBACK_STRINGS, FeedbackItem } from '@/types/feedback';
import { FeedbackPreviewModal } from './FeedbackPreviewModal';

export const ReviewTab: React.FC = () => {
  const { 
    items, 
    filters, 
    setFilters, 
    deleteItem, 
    updateItem, 
    exportAll, 
    nukeAll, 
    pruneExpiredNow,
    isLoading 
  } = useFeedbackStore();
  
  // Force refresh when component mounts
  React.useEffect(() => {
    // This will trigger a re-render when items change
  }, [items]);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isNuking, setIsNuking] = useState(false);
  const [previewItem, setPreviewItem] = useState<FeedbackItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const strings = FEEDBACK_STRINGS['en-CA']; // TODO: Use proper i18n

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { json, files } = await exportAll();
      
      // Create ZIP file
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Add JSON data
      zip.file('feedback/data.json', json);
      
      // Add files
      const filesFolder = zip.folder('feedback/files');
      files.forEach(({ key, blob }) => {
        filesFolder?.file(key, blob);
      });
      
      // Generate and download
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feedback-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleNuke = async () => {
    if (!confirm('Are you sure you want to delete ALL feedback data? This cannot be undone.')) {
      return;
    }
    
    setIsNuking(true);
    try {
      await nukeAll();
    } catch (error) {
      console.error('Nuke failed:', error);
    } finally {
      setIsNuking(false);
    }
  };

  const handlePrune = async () => {
    try {
      await pruneExpiredNow();
    } catch (error) {
      console.error('Prune failed:', error);
    }
  };

  const handlePreview = (item: FeedbackItem) => {
    setPreviewItem(item);
    setShowPreview(true);
  };

  const getDaysRemaining = (createdAt: string, ttlDays: number = 30) => {
    const created = new Date(createdAt);
    const expiry = new Date(created.getTime() + (ttlDays * 24 * 60 * 60 * 1000));
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'triaged':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const filteredItems = items.filter(item => {
    if (filters.mode && item.meta.mode !== filters.mode) return false;
    if (filters.template && !item.meta.template_name?.includes(filters.template)) return false;
    if (filters.category && !item.ratings[filters.category as keyof typeof item.ratings]) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">Feedback Items ({filteredItems.length})</h3>
          <Badge variant="outline">
            {items.filter(i => i.status === 'open').length} open
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrune}
            disabled={isLoading}
          >
            <Filter className="h-4 w-4 mr-2" />
            Prune Expired
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export All'}
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleNuke}
            disabled={isNuking || isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isNuking ? 'Deleting...' : 'Nuke All'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by template name..."
            value={filters.template || ''}
            onChange={(e) => setFilters({ template: e.target.value })}
          />
        </div>
        
        <Select
          value={filters.mode || null}
          onValueChange={(value) => setFilters({ mode: value || undefined })}
          items={[
            { value: '', label: 'All Modes' },
            { value: 'smart', label: 'Smart' },
            { value: 'word-for-word', label: 'Word-for-Word' },
            { value: 'ambient', label: 'Ambient' },
          ]}
          className="w-[180px]"
        />
        
        <Select
          value={filters.category || null}
          onValueChange={(value) => setFilters({ category: value || undefined })}
          items={[
            { value: '', label: 'All Categories' },
            { value: 'dictation', label: 'Dictation' },
            { value: 'transcription', label: 'Transcription' },
            { value: 'hallucination', label: 'Hallucination' },
            { value: 'context', label: 'Context' },
            { value: 'structure', label: 'Structure' },
            { value: 'overall', label: 'Overall' },
          ]}
          className="w-[180px]"
        />
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              {strings.noItems}
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(item.status)}
                      <span className="text-sm font-medium">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {item.meta.mode}
                      </Badge>
                      {item.meta.template_name && (
                        <Badge variant="secondary" className="text-xs">
                          {item.meta.template_name}
                        </Badge>
                      )}
                      {item.meta.contains_phi && (
                        <Badge variant="destructive" className="text-xs">
                          PHI
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(item.ratings).map(([key, value]) => (
                        value && (
                          <Badge
                            key={key}
                            variant={value === 'good' ? 'default' : value === 'meh' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {key}: {value}
                          </Badge>
                        )
                      ))}
                    </div>
                    
                    {item.comment && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {item.comment}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>
                        {getDaysRemaining(item.created_at, item.ttl_days)} {strings.daysLeft}
                      </span>
                      <span>Language: {item.meta.language}</span>
                      {item.meta.diarization && <span>Diarization</span>}
                      {item.meta.custom_vocab && <span>Custom Vocab</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(item)}
                      className="text-blue-600 hover:text-blue-700"
                      title="Preview feedback details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Select
                      value={item.status}
                      onValueChange={(value) => updateItem(item.id, { status: value as any })}
                      items={[
                        { value: 'open', label: 'Open' },
                        { value: 'triaged', label: 'Triaged' },
                        { value: 'resolved', label: 'Resolved' },
                      ]}
                      className="w-[120px] h-8"
                    />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Preview Modal */}
      <FeedbackPreviewModal
        item={previewItem}
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setPreviewItem(null);
        }}
      />
    </div>
  );
};
