import mysql from 'mysql2/promise';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

export type AdminNotification = {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

const persistentNotifications = process.env.NODE_ENV !== 'test';
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uiu_rental_system',
  port: Number(process.env.DB_PORT || 3306),
  connectionLimit: 5,
});

let fixtureNotifications: AdminNotification[] = [];

export async function listAdminNotifications(userId: string): Promise<AdminNotification[]> {
  if (!persistentNotifications) return fixtureNotifications.map((notification) => ({ ...notification }));
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, title, message, type, is_read, created_at
     FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50`,
    [Number(userId)],
  );
  return rows.map(mapNotification);
}

export async function markAdminNotificationsRead(userId: string, notificationId?: number): Promise<void> {
  if (!persistentNotifications) {
    fixtureNotifications = fixtureNotifications.map((notification) =>
      notificationId === undefined || notification.id === notificationId ? { ...notification, isRead: true } : notification,
    );
    return;
  }
  if (notificationId === undefined) {
    await db.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE', [Number(userId)]);
  } else {
    await db.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND id = ?', [Number(userId), notificationId]);
  }
}

export async function notifyAdminsAboutPendingLandlord(name: string, userId?: string): Promise<void> {
  const title = 'New landlord registration pending approval';
  const message = `${name}${userId ? ` · User ${userId}` : ''}`;
  if (!persistentNotifications) {
    fixtureNotifications.push({ id: Date.now(), title, message, type: 'account', isRead: false, createdAt: new Date().toISOString() });
    return;
  }
  await db.execute<ResultSetHeader>(
    `INSERT INTO notifications (user_id, title, message, type)
     SELECT id, ?, ?, 'account' FROM users WHERE role = 'admin'`,
    [title, message],
  );
}

export function resetAdminNotificationFixtures(): void {
  fixtureNotifications = [];
}

function mapNotification(row: RowDataPacket): AdminNotification {
  return {
    id: Number(row.id),
    title: String(row.title),
    message: String(row.message),
    type: String(row.type),
    isRead: Boolean(row.is_read),
    createdAt: new Date(row.created_at as Date).toISOString(),
  };
}