/**
 * Feedback Preview Modal
 * Shows detailed view of a feedback item
 */

import React from 'react';
import { X, Eye, Calendar, Settings, FileText, MessageSquare, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FeedbackItem, FEEDBACK_STRINGS } from '@/types/feedback';

interface FeedbackPreviewModalProps {
  item: FeedbackItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackPreviewModal: React.FC<FeedbackPreviewModalProps> = ({
  item,
  isOpen,
  onClose
}) => {
  if (!isOpen || !item) return null;

  const strings = FEEDBACK_STRINGS['en-CA'];
  
  // Debug logging
  console.log('Preview modal item:', item);
  console.log('Item ratings:', item.ratings);
  console.log('Ratings entries:', Object.entries(item.ratings));

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'bg-green-100 text-green-800 border-green-200';
      case 'meh': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'bad': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'triaged': return 'bg-yellow-100 text-yellow-800';
      case 'open': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysRemaining = (createdAt: string, ttlDays: number = 30) => {
    const created = new Date(createdAt);
    const expiry = new Date(created.getTime() + (ttlDays * 24 * 60 * 60 * 1000));
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-xl font-semibold">
              Feedback Preview
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[70vh] space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {item.meta.mode} • {item.meta.language}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {getDaysRemaining(item.created_at, item.ttl_days)} days left
              </span>
            </div>
          </div>

          {/* Status and Tags */}
          <div className="flex flex-wrap gap-2">
            <Badge className={getStatusColor(item.status)}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Badge>
            {item.meta.template_name && (
              <Badge variant="outline">
                {item.meta.template_name}
              </Badge>
            )}
            {item.meta.diarization && (
              <Badge variant="secondary">Diarization</Badge>
            )}
            {item.meta.custom_vocab && (
              <Badge variant="secondary">Custom Vocab</Badge>
            )}
            {item.meta.contains_phi && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                PHI
              </Badge>
            )}
          </div>

          {/* Ratings Section */}
          {Object.entries(item.ratings).some(([_, value]) => value) && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Ratings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(item.ratings).map(([key, value]) => (
                  value && (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium capitalize">
                        {strings.categories[key as keyof typeof strings.categories] || key}
                      </span>
                      <Badge className={getRatingColor(value)}>
                        {value}
                      </Badge>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Artifacts Section */}
          {(item.artifacts.raw_text || item.artifacts.templated_text || item.artifacts.final_text) && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Text Artifacts
              </h3>
              <div className="space-y-4">
                {item.artifacts.raw_text && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Raw Transcript</h4>
                    <div className="p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {item.artifacts.raw_text}
                    </div>
                  </div>
                )}
                {item.artifacts.templated_text && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Templated Text {item.artifacts.template_name && `(${item.artifacts.template_name})`}
                    </h4>
                    <div className="p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {item.artifacts.templated_text}
                    </div>
                  </div>
                )}
                {item.artifacts.final_text && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Final Expected Text</h4>
                    <div className="p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {item.artifacts.final_text}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Highlights Section */}
          {item.highlights.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Highlights ({item.highlights.length})</h3>
              <div className="space-y-3">
                {item.highlights.map((highlight) => (
                  <div key={highlight.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {highlight.source}
                      </Badge>
                      {(highlight.start_line || highlight.end_line) && (
                        <span className="text-xs text-gray-500">
                          Lines {highlight.start_line || '?'} - {highlight.end_line || '?'}
                        </span>
                      )}
                    </div>
                    {highlight.note && (
                      <p className="text-sm text-gray-700">{highlight.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comment Section */}
          {item.comment && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Additional Comments</h3>
              <div className="p-3 bg-blue-50 rounded-lg text-sm whitespace-pre-wrap">
                {item.comment}
              </div>
            </div>
          )}

          {/* Attachments Section */}
          {item.attachments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Attachments ({item.attachments.length})</h3>
              <div className="space-y-2">
                {item.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{attachment}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Browser Info */}
          {item.meta.browser && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Browser Information</h3>
              <div className="p-3 bg-gray-50 rounded-lg text-xs font-mono">
                {item.meta.browser.raw}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
