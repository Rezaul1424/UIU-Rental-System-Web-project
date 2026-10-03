import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';

export type AdminConversationMessage = {
  id: string;
  from: 'student' | 'landlord';
  senderName: string;
  text: string;
  createdAt: string;
};

export type AdminConversation = {
  id: string;
  student: string;
  landlord: string;
  property: string;
  propertyId: string;
  lastMessageAt: string;
  status: 'Active' | 'Inactive';
  messages: AdminConversationMessage[];
};

const persistentChat = process.env.NODE_ENV !== 'test';
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uiu_rental_system',
  port: Number(process.env.DB_PORT || 3306),
  connectionLimit: 5,
});

const fixtureConversations: AdminConversation[] = [{
  id: '1',
  student: 'Tanvir Ahmed',
  landlord: 'Rahman Faruk',
  property: 'Occupied Campus Apartment',
  propertyId: 'UIU-1004',
  lastMessageAt: '2026-10-01T10:00:00.000Z',
  status: 'Active',
  messages: [{
    id: '1', from: 'student', senderName: 'Tanvir Ahmed', text: 'Development fixture message.',
    createdAt: '2026-10-01T10:00:00.000Z',
  }],
}];

export async function listAdminConversations(query?: string): Promise<AdminConversation[]> {
  if (!persistentChat) {
    const normalized = query?.trim().toLowerCase();
    return fixtureConversations
      .filter((conversation) => !normalized || `${conversation.student} ${conversation.landlord} ${conversation.property} ${conversation.propertyId}`.toLowerCase().includes(normalized))
      .map((conversation) => ({ ...conversation, messages: conversation.messages.map((message) => ({ ...message })) }));
  }

  const search = query?.trim();
  const where = search
    ? 'WHERE student.name LIKE CONCAT(\'%\', ?, \'%\') OR landlord.name LIKE CONCAT(\'%\', ?, \'%\') OR p.title LIKE CONCAT(\'%\', ?, \'%\') OR p.property_code LIKE CONCAT(\'%\', ?, \'%\')'
    : '';
  const params = search ? [search, search, search, search] : [];
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT c.id, c.status AS conversation_status, c.last_message_at,
      student.name AS student_name, landlord.name AS landlord_name,
      p.title AS property_title, p.property_code
     FROM conversations c
     JOIN users student ON student.id = c.student_id
     JOIN users landlord ON landlord.id = c.landlord_id
     JOIN properties p ON p.id = c.property_id
     ${where}
     ORDER BY c.last_message_at DESC, c.id DESC LIMIT 100`, params,
  );
  const conversations = await Promise.all(rows.map(async (row) => {
    const [messages] = await db.query<RowDataPacket[]>(
      `SELECT m.id, m.sender_id, m.message_text, m.created_at, sender.role AS sender_role, sender.name AS sender_name
       FROM chat_messages m JOIN users sender ON sender.id = m.sender_id
       WHERE m.conversation_id = ? ORDER BY m.created_at ASC, m.id ASC`, [row.id],
    );
    const lastMessageAt = new Date(row.last_message_at as Date).toISOString();
    const activeRecently = Date.now() - new Date(lastMessageAt).getTime() <= 30 * 24 * 60 * 60 * 1000;
    return {
      id: String(row.id),
      student: String(row.student_name),
      landlord: String(row.landlord_name),
      property: String(row.property_title),
      propertyId: String(row.property_code),
      lastMessageAt,
      status: row.conversation_status === 'active' && activeRecently ? 'Active' as const : 'Inactive' as const,
      messages: messages.map((message) => ({
        id: String(message.id),
        from: message.sender_role === 'landlord' ? 'landlord' as const : 'student' as const,
        senderName: String(message.sender_name),
        text: String(message.message_text),
        createdAt: new Date(message.created_at as Date).toISOString(),
      })),
    };
  }));
  return conversations;
}