/**
 * Feedback Navigation Item
 * Left sidebar navigation item for feedback module
 */

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFeatureFlags } from '@/lib/featureFlags';
import { FEEDBACK_STRINGS } from '@/types/feedback';

interface FeedbackNavItemProps {
  isActive?: boolean;
  isCollapsed?: boolean;
  onClick: () => void;
}

export const FeedbackNavItem: React.FC<FeedbackNavItemProps> = ({
  isActive = false,
  isCollapsed = false,
  onClick
}) => {
  const featureFlags = useFeatureFlags();
  
  // Don't render if feature flag is disabled
  if (!featureFlags.feedbackModule) {
    return null;
  }

  const strings = FEEDBACK_STRINGS['en-CA']; // TODO: Use proper i18n

  const itemContent = (
    <Button
      variant={isActive ? 'default' : 'ghost'}
      size="sm"
      className={cn(
        'w-full justify-start gap-3 h-10',
        isActive && 'bg-blue-600 text-white hover:bg-blue-700',
        !isActive && 'hover:bg-blue-50 text-slate-700'
      )}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      aria-label={isCollapsed ? strings.navItem : undefined}
    >
      <MessageSquare className="h-4 w-4 flex-shrink-0" />
      {!isCollapsed && (
        <span className="truncate">{strings.navItem}</span>
      )}
    </Button>
  );

  return itemContent;
};
