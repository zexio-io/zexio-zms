import { auditLogs, db } from '@zexio/zms-core';

export function logAction(
  orgId: string,
  actorId: string,
  action: string,
  resourceId?: string,
  metadata?: any,
  serviceId?: string
) {
  // PERFORMANCE: Fire and forget to avoid blocking the main secret delivery flow
  db.insert(auditLogs).values({
    organizationId: orgId,
    actorId,
    action,
    resourceId,
    metadata: serviceId ? { ...metadata, serviceId } : metadata,
    createdAt: new Date(),
  }).catch(err => {
    console.error(`[AUDIT_ERROR] Failed to log action ${action}:`, err);
  });
}
