/**
 * Sync Status Indicator Component
 * Shows the current sync status for feedback items
 */

import React from 'react';
import { useFeedbackStore } from '../../stores/feedbackStore';
import { useFeatureFlags } from '../../lib/featureFlags';

interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  className = '',
  showDetails = false,
}) => {
  const { syncStatus } = useFeedbackStore();
  const featureFlags = useFeatureFlags();

  // Don't show if server sync is disabled
  if (!featureFlags.feedbackServerSync) {
    return null;
  }

  const getStatusIcon = () => {
    if (syncStatus.isSyncing) {
      return (
        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
      );
    }

    if (syncStatus.error) {
      return (
        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">!</span>
        </div>
      );
    }

    if (syncStatus.pendingItems > 0) {
      return (
        <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">{syncStatus.pendingItems}</span>
        </div>
      );
    }

    if (syncStatus.failedItems > 0) {
      return (
        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">{syncStatus.failedItems}</span>
        </div>
      );
    }

    if (syncStatus.lastSyncTime) {
      return (
        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      );
    }

    return (
      <div className="w-4 h-4 bg-gray-400 rounded-full" />
    );
  };

  const getStatusText = () => {
    if (syncStatus.isSyncing) {
      return 'Syncing...';
    }

    if (syncStatus.error) {
      return 'Sync Error';
    }

    if (syncStatus.pendingItems > 0) {
      return `${syncStatus.pendingItems} pending`;
    }

    if (syncStatus.failedItems > 0) {
      return `${syncStatus.failedItems} failed`;
    }

    if (syncStatus.lastSyncTime) {
      const lastSync = new Date(syncStatus.lastSyncTime);
      const now = new Date();
      const diffMs = now.getTime() - lastSync.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) {
        return 'Just synced';
      } else if (diffMins < 60) {
        return `Synced ${diffMins}m ago`;
      } else {
        const diffHours = Math.floor(diffMins / 60);
        return `Synced ${diffHours}h ago`;
      }
    }

    return syncStatus.isOnline ? 'Ready to sync' : 'Offline';
  };

  const getTooltipText = () => {
    const parts = [];

    if (syncStatus.isOnline) {
      parts.push('Online');
    } else {
      parts.push('Offline');
    }

    if (syncStatus.pendingItems > 0) {
      parts.push(`${syncStatus.pendingItems} items pending sync`);
    }

    if (syncStatus.failedItems > 0) {
      parts.push(`${syncStatus.failedItems} items failed to sync`);
    }

    if (syncStatus.lastSyncTime) {
      parts.push(`Last sync: ${new Date(syncStatus.lastSyncTime).toLocaleString()}`);
    }

    if (syncStatus.error) {
      parts.push(`Error: ${syncStatus.error}`);
    }

    return parts.join(' • ');
  };

  return (
    <div 
      className={`flex items-center space-x-2 ${className}`}
      title={getTooltipText()}
    >
      {getStatusIcon()}
      {showDetails && (
        <span className="text-sm text-gray-600">
          {getStatusText()}
        </span>
      )}
    </div>
  );
};

/**
 * Compact sync status for use in headers or toolbars
 */
export const SyncStatusCompact: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <SyncStatusIndicator 
      className={className}
      showDetails={false}
    />
  );
};

/**
 * Detailed sync status for use in settings or debug panels
 */
export const SyncStatusDetailed: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { syncStatus, retryFailedSync } = useFeedbackStore();
  const featureFlags = useFeatureFlags();

  if (!featureFlags.feedbackServerSync) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        Server sync disabled
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Sync Status</span>
        <SyncStatusIndicator showDetails={true} />
      </div>
      
      <div className="text-xs text-gray-600 space-y-1">
        <div>Online: {syncStatus.isOnline ? 'Yes' : 'No'}</div>
        <div>Pending: {syncStatus.pendingItems}</div>
        <div>Failed: {syncStatus.failedItems}</div>
        {syncStatus.lastSyncTime && (
          <div>Last sync: {new Date(syncStatus.lastSyncTime).toLocaleString()}</div>
        )}
        {syncStatus.error && (
          <div className="text-red-600">Error: {syncStatus.error}</div>
        )}
      </div>

      {syncStatus.failedItems > 0 && (
        <button
          onClick={retryFailedSync}
          className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
        >
          Retry Failed Sync
        </button>
      )}
    </div>
  );
};
