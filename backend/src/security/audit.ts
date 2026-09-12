import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';

export type AuditEventInput = {
  actorId?: string | number;
  action: string;
  resourceType: string;
  resourceId: string;
  previousState?: unknown;
  newState?: unknown;
  requestMetadata?: unknown;
};

export type AuditEvent = AuditEventInput & {
  id: string;
  createdAt: string;
};

const events: AuditEvent[] = [];
const persistentAudit = process.env.NODE_ENV !== 'test';
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uiu_rental_system',
  port: Number(process.env.DB_PORT || 3306),
  connectionLimit: 10,
});

export async function recordAuditEvent(input: AuditEventInput): Promise<AuditEvent> {
  const event: AuditEvent = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };

  if (persistentAudit) {
    await db.execute(
      `INSERT INTO audit_events
        (id, actor_id, action, resource_type, resource_id, previous_state, new_state, request_metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.id,
        input.actorId === undefined ? null : Number(input.actorId),
        event.action,
        event.resourceType,
        event.resourceId,
        input.previousState === undefined ? null : JSON.stringify(input.previousState),
        input.newState === undefined ? null : JSON.stringify(input.newState),
        input.requestMetadata === undefined ? null : JSON.stringify(input.requestMetadata),
      ],
    );
  } else {
    events.push(event);
  }

  return event;
}

export function getAuditEvents(): AuditEvent[] {
  return [...events];
}

export function clearAuditEvents(): void {
  events.length = 0;
}