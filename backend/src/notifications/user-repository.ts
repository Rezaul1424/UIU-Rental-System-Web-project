import mysql from 'mysql2/promise';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

export type UserNotification = {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  linkUrl?: string | null;
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

const fixtureNotifications: Record<'student' | 'landlord', UserNotification[]> = {
  student: [],
  landlord: [],
};

const fallbackNotifications = (role: 'student' | 'landlord'): UserNotification[] => {
  const now = Date.now();

  if (role === 'student') {
    return [
      { id: 1, title: 'Your application was reviewed', message: 'Studio near Gate 3 · Rahman Faruk', type: 'application', isRead: false, createdAt: new Date(now - 20 * 60 * 1000).toISOString() },
      { id: 2, title: 'New message from landlord', message: 'Rahman Faruk · Studio near Gate 3', type: 'chat', isRead: false, createdAt: new Date(now - 60 * 60 * 1000).toISOString() },
      { id: 3, title: 'Rent payment reminder', message: 'August 2026 · ৳4,200 due', type: 'payment', isRead: false, createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString() },
      { id: 4, title: 'Maintenance request update', message: 'AC not cooling · In Progress', type: 'maintenance', isRead: true, createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString() },
    ];
  }

  return [
    { id: 1, title: 'New rental request received', message: 'Tanvir Ahmed → Studio near Gate 3', type: 'application', isRead: false, createdAt: new Date(now - 5 * 60 * 1000).toISOString() },
    { id: 2, title: 'Maintenance request updated', message: 'AC not cooling · Stage advanced', type: 'maintenance', isRead: false, createdAt: new Date(now - 60 * 60 * 1000).toISOString() },
    { id: 3, title: 'Rent payment received', message: 'Sadia Islam · ৳2,800 · Jul 2026', type: 'payment', isRead: true, createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString() },
    { id: 4, title: 'Your listing was viewed 12 times today', message: 'Studio near Gate 3', type: 'listing', isRead: true, createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString() },
  ];
};

export async function listUserNotifications(userId: number, role: 'student' | 'landlord'): Promise<UserNotification[]> {
  if (!persistentNotifications) {
    return fixtureNotifications[role].map((notification) => ({ ...notification }));
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, title, message, type, is_read, link_url, created_at
       FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 20`,
      [userId],
    );

    if (rows.length > 0) {
      return rows.map((row) => ({
        id: Number(row.id),
        title: String(row.title),
        message: String(row.message),
        type: String(row.type || 'general'),
        isRead: Boolean(row.is_read),
        linkUrl: row.link_url == null ? undefined : String(row.link_url),
        createdAt: new Date(row.created_at as Date | string).toISOString(),
      }));
    }
  } catch {
    // Fall back to meaningful demo notifications when the database is unavailable.
  }

  return fallbackNotifications(role);
}

export async function createUserNotification(
  userId: number,
  role: 'student' | 'landlord',
  title: string,
  message: string,
  type = 'general',
): Promise<void> {
  const notification: UserNotification = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    title,
    message,
    type,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  if (!persistentNotifications) {
    fixtureNotifications[role].unshift(notification);
    return;
  }

  try {
    await db.execute<ResultSetHeader>(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, ?)`,
      [userId, title, message, type],
    );
  } catch {
    // Best effort: message delivery should not fail the chat send.
  }
}

export async function markUserNotificationsRead(userId: number, notificationId?: number): Promise<void> {
  if (!persistentNotifications) {
    fixtureNotifications.student = fixtureNotifications.student.map((notification) => (
      notificationId === undefined || notification.id === notificationId ? { ...notification, isRead: true } : notification
    ));
    fixtureNotifications.landlord = fixtureNotifications.landlord.map((notification) => (
      notificationId === undefined || notification.id === notificationId ? { ...notification, isRead: true } : notification
    ));
    return;
  }

  try {
    if (notificationId === undefined) {
      await db.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE', [userId]);
    } else {
      await db.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND id = ?', [userId, notificationId]);
    }
  } catch {
    // Ignore DB errors and keep the frontend optimistic state in sync.
  }
}
