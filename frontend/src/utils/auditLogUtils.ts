/**
 * Audit Log utilities for managing audit events
 * Uses localStorage for persistence (frontend-only for now)
 */

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO timestamp
  userId: string;
  userName: string;
  userRole: string;
  action: string; // 'create', 'update', 'delete', 'assign', 'submit', 'review', 'export', etc.
  resourceType: string; // 'case', 'assignment', 'document', 'compliance_flag', etc.
  resourceId: string;
  resourceName?: string;
  details?: string; // Additional details or changes
  ipAddress?: string;
  userAgent?: string;
}

const STORAGE_KEY = 'techemd_audit_logs';

/**
 * Get all audit log entries
 */
export const getAllAuditLogs = (): AuditLogEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Initialize with some mock data
      const mockLogs = generateMockAuditLogs();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockLogs));
      return mockLogs;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading audit logs:', error);
    return [];
  }
};

/**
 * Add a new audit log entry
 */
export const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void => {
  try {
    const logs = getAllAuditLogs();
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newEntry); // Add to beginning
    // Keep only last 1000 entries
    const trimmedLogs = logs.slice(0, 1000);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedLogs));
    
    // Dispatch event for real-time updates
    window.dispatchEvent(new Event('auditLogUpdated'));
  } catch (error) {
    console.error('Error adding audit log:', error);
  }
};

/**
 * Filter audit logs
 */
export const filterAuditLogs = (
  logs: AuditLogEntry[],
  filters: {
    userId?: string;
    action?: string;
    resourceType?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): AuditLogEntry[] => {
  return logs.filter((log) => {
    if (filters.userId && log.userId !== filters.userId) return false;
    if (filters.action && log.action !== filters.action) return false;
    if (filters.resourceType && log.resourceType !== filters.resourceType) return false;
    
    if (filters.dateFrom || filters.dateTo) {
      const logDate = new Date(log.timestamp);
      if (filters.dateFrom && logDate < new Date(filters.dateFrom)) return false;
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        if (logDate > toDate) return false;
      }
    }
    
    return true;
  });
};

/**
 * Export audit logs to CSV
 */
export const exportAuditLogsToCSV = (logs: AuditLogEntry[]): string => {
  const headers = ['Timestamp', 'User', 'Role', 'Action', 'Resource Type', 'Resource ID', 'Resource Name', 'Details'];
  const rows = logs.map((log) => [
    log.timestamp,
    log.userName,
    log.userRole,
    log.action,
    log.resourceType,
    log.resourceId,
    log.resourceName || '',
    log.details || '',
  ]);
  
  return [headers, ...rows].map((row) => 
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
};

/**
 * Export audit logs to JSON
 */
export const exportAuditLogsToJSON = (logs: AuditLogEntry[]): string => {
  return JSON.stringify(logs, null, 2);
};

/**
 * Generate mock audit log data for prototype
 */
const generateMockAuditLogs = (): AuditLogEntry[] => {
  const actions = ['create', 'update', 'assign', 'submit', 'review', 'export', 'delete', 'approve', 'reject'];
  const resourceTypes = ['case', 'assignment', 'document', 'compliance_flag', 'user'];
  const users = [
    { id: 'admin-1', name: 'Admin User', role: 'admin' },
    { id: 'doctor-1', name: 'Dr. Harry Durusso', role: 'user' },
    { id: 'doctor-2', name: 'Dr. Marie Dubois', role: 'user' },
    { id: 'qa-1', name: 'QA User', role: 'qa' },
  ];
  
  const logs: AuditLogEntry[] = [];
  const now = new Date();
  
  // Generate logs for the last 30 days
  for (let i = 0; i < 200; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const timestamp = new Date(now);
    timestamp.setDate(timestamp.getDate() - daysAgo);
    timestamp.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
    
    const user = users[Math.floor(Math.random() * users.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    const resourceId = `${resourceType}-${Math.floor(Math.random() * 1000)}`;
    
    let details = '';
    if (action === 'assign') {
      details = `Assigned to ${users[Math.floor(Math.random() * users.length)].name}`;
    } else if (action === 'update') {
      details = 'Updated case status';
    } else if (action === 'submit') {
      details = 'Submitted to CNESST';
    } else if (action === 'review') {
      details = 'Reviewed and approved';
    }
    
    logs.push({
      id: `audit-${i}`,
      timestamp: timestamp.toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      resourceType,
      resourceId,
      resourceName: resourceType === 'case' ? `Case ${resourceId}` : undefined,
      details,
    });
  }
  
  // Sort by timestamp (newest first)
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

