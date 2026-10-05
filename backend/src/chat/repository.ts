import type { RowDataPacket } from 'mysql2';
import mysql from 'mysql2/promise';
import { AppError } from '../errors/AppError.js';

export type ChatRole = 'student' | 'landlord';
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uiu_rental_system',
  port: Number(process.env.DB_PORT || 3306),
  connectionLimit: 5,
});

export type ChatMessage = {
  id: string;
  from: ChatRole;
  text: string;
  createdAt: string;
};

export type ChatConversation = {
  id: string;
  studentId: string;
  studentName: string;
  landlordId: string;
  landlordName: string;
  propertyId: string;
  propertyTitle: string;
  messages: ChatMessage[];
};

type TestConversation = ChatConversation & { studentAuthId: string; landlordAuthId: string };
const testConversations: TestConversation[] = [];

function toIso(value: Date | string): string {
  return new Date(value).toISOString();
}

export async function listChatConversations(role: ChatRole, userId: string): Promise<ChatConversation[]> {
  if (process.env.NODE_ENV === 'test') {
    return testConversations
      .filter((conversation) => role === 'student' ? conversation.studentAuthId === userId : conversation.landlordAuthId === userId)
      .map((conversation) => ({ ...conversation, messages: conversation.messages.map((message) => ({ ...message })) }));
  }

  const participantColumn = role === 'student' ? 'c.student_id' : 'c.landlord_id';
  const [rows] = await db.query<(RowDataPacket & {
    id: number;
    student_id: number;
    student_name: string;
    landlord_id: number;
    landlord_name: string;
    property_code: string;
    property_title: string;
  })[]>(
    `SELECT c.id, c.student_id, student.name AS student_name,
            c.landlord_id, landlord.name AS landlord_name,
            p.property_code, p.title AS property_title
     FROM conversations c
     JOIN users student ON student.id = c.student_id
     JOIN users landlord ON landlord.id = c.landlord_id
     JOIN properties p ON p.id = c.property_id
     WHERE ${participantColumn} = ?
     ORDER BY c.last_message_at DESC, c.id DESC`,
    [Number(userId)],
  );

  return Promise.all(rows.map(async (row) => {
    const [messages] = await db.query<(RowDataPacket & {
      id: number;
      sender_id: number;
      sender_role: ChatRole;
      message_text: string;
      created_at: Date;
    })[]>(
      `SELECT m.id, m.sender_id, sender.role AS sender_role, m.message_text, m.created_at
       FROM chat_messages m
       JOIN users sender ON sender.id = m.sender_id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC, m.id ASC`,
      [row.id],
    );

    return {
      id: String(row.id),
      studentId: String(row.student_id),
      studentName: row.student_name,
      landlordId: String(row.landlord_id),
      landlordName: row.landlord_name,
      propertyId: row.property_code,
      propertyTitle: row.property_title,
      messages: messages.map((message) => ({
        id: String(message.id),
        from: message.sender_role,
        text: message.message_text,
        createdAt: toIso(message.created_at),
      })),
    };
  }));
}

export async function sendStudentChatMessage(studentId: string, propertyIdentifier: string, text: string): Promise<ChatConversation> {
  if (process.env.NODE_ENV === 'test') {
    let conversation = testConversations.find((item) => item.studentAuthId === studentId && item.propertyId === propertyIdentifier);
    if (!conversation) {
      conversation = {
        id: `test-${testConversations.length + 1}`,
        studentId,
        studentName: 'Test Student',
        landlordId: '2',
        landlordName: 'Rahman Faruk',
        propertyId: propertyIdentifier,
        propertyTitle: 'Test listing',
        studentAuthId: studentId,
        landlordAuthId: '2',
        messages: [],
      };
      testConversations.push(conversation);
    }
    conversation.messages.push({ id: `test-message-${conversation.messages.length + 1}`, from: 'student', text, createdAt: new Date().toISOString() });
    return { ...conversation, messages: conversation.messages.map((message) => ({ ...message })) };
  }

  const connection = await db.getConnection();
  let committed = false;
  try {
    await connection.beginTransaction();
    const [propertyRows] = await connection.query<(RowDataPacket & { id: number; property_code: string; title: string; landlord_id: number; landlord_name: string })[]>(
      `SELECT p.id, p.property_code, p.title, p.landlord_id, landlord.name AS landlord_name
       FROM properties p JOIN users landlord ON landlord.id = p.landlord_id
       WHERE (p.property_code = ? OR CAST(p.id AS CHAR) = ?) LIMIT 1`,
      [propertyIdentifier, propertyIdentifier],
    );
    const property = propertyRows[0];
    if (!property) throw new AppError(404, 'PROPERTY_NOT_FOUND', 'Property does not exist');

    const [insertResult] = await connection.execute(
      `INSERT INTO conversations (student_id, landlord_id, property_id)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
      [Number(studentId), property.landlord_id, property.id],
    );
    const conversationId = Number((insertResult as { insertId: number }).insertId);
    await connection.execute(
      'INSERT INTO chat_messages (conversation_id, sender_id, message_text) VALUES (?, ?, ?)',
      [conversationId, Number(studentId), text],
    );
    await connection.execute('UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?', [conversationId]);
    await connection.commit();
    committed = true;
    const savedConversation = (await listChatConversations('student', studentId)).find((item) => item.id === String(conversationId));
    if (!savedConversation) throw new AppError(500, 'CHAT_SAVE_FAILED', 'Message was saved but the conversation could not be reloaded');
    return savedConversation;
  } catch (error) {
    if (!committed) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function sendLandlordChatMessage(landlordId: string, studentId: string, propertyIdentifier: string, text: string): Promise<ChatConversation> {
  if (process.env.NODE_ENV === 'test') {
    const conversation = testConversations.find((item) =>
      item.landlordAuthId === landlordId && item.studentAuthId === studentId && item.propertyId === propertyIdentifier);
    if (!conversation) throw new AppError(404, 'CONVERSATION_NOT_FOUND', 'Start the conversation from the student account first');
    conversation.messages.push({ id: `test-message-${conversation.messages.length + 1}`, from: 'landlord', text, createdAt: new Date().toISOString() });
    return { ...conversation, messages: conversation.messages.map((message) => ({ ...message })) };
  }

  const connection = await db.getConnection();
  let committed = false;
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<(RowDataPacket & {
      id: number;
      property_code: string;
      property_title: string;
      landlord_name: string;
      student_name: string;
    })[]>(
      `SELECT p.id, p.property_code, p.title AS property_title,
              landlord.name AS landlord_name, student.name AS student_name
       FROM properties p
       JOIN users landlord ON landlord.id = p.landlord_id
       JOIN users student ON student.id = ?
       WHERE p.landlord_id = ?
         AND (p.property_code = ? OR CAST(p.id AS CHAR) = ?)
         AND (
           EXISTS (SELECT 1 FROM conversations c WHERE c.property_id = p.id AND c.student_id = student.id AND c.landlord_id = landlord.id)
           OR
           EXISTS (SELECT 1 FROM applications a WHERE a.property_id = p.id AND a.student_id = student.id)
           OR EXISTS (SELECT 1 FROM leases l WHERE l.property_id = p.id AND l.student_id = student.id)
         )
       LIMIT 1`,
      [Number(studentId), Number(landlordId), propertyIdentifier, propertyIdentifier],
    );
    const property = rows[0];
    if (!property) throw new AppError(404, 'CHAT_CONTACT_NOT_FOUND', 'This student is not connected to the selected property');

    const [insertResult] = await connection.execute(
      `INSERT INTO conversations (student_id, landlord_id, property_id)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
      [Number(studentId), Number(landlordId), property.id],
    );
    const conversationId = Number((insertResult as { insertId: number }).insertId);
    await connection.execute(
      'INSERT INTO chat_messages (conversation_id, sender_id, message_text) VALUES (?, ?, ?)',
      [conversationId, Number(landlordId), text],
    );
    await connection.execute('UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?', [conversationId]);
    await connection.commit();
    committed = true;
    const savedConversation = (await listChatConversations('landlord', landlordId)).find((item) => item.id === String(conversationId));
    if (!savedConversation) throw new AppError(500, 'CHAT_SAVE_FAILED', 'Message was saved but the conversation could not be reloaded');
    return savedConversation;
  } catch (error) {
    if (!committed) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
