import mysql from 'mysql2/promise';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export type ComplaintStatus = 'Submitted' | 'Under Review' | 'Responded' | 'Resolved' | 'Closed';

export type AdminComplaintMessage = {
  id: string;
  from: string;
  isAdmin: boolean;
  text: string;
  createdAt: string;
};

export type AdminComplaint = {
  id: string;
  from: string;
  fromType: 'Student' | 'Landlord';
  against: string;
  property: string;
  category: string;
  createdAt: string;
  status: ComplaintStatus;
  description: string;
  messages: AdminComplaintMessage[];
};

const persistentComplaints = process.env.NODE_ENV !== 'test';
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uiu_rental_system',
  port: Number(process.env.DB_PORT || 3306),
  connectionLimit: 5,
});

const initialFixtures: AdminComplaint[] = [
  {
    id: 'CMP-001', from: 'Tanvir Ahmed', fromType: 'Student', against: 'Rahman Faruk', property: 'Studio near Gate 3',
    category: 'Maintenance Neglect', createdAt: '2026-09-22T09:00:00.000Z', status: 'Under Review',
    description: 'Reported the AC cooling issue but no response received from the landlord.',
    messages: [{ id: 'seed-1', from: 'Admin', isAdmin: true, text: 'We are reviewing your complaint.', createdAt: '2026-09-23T09:00:00.000Z' }],
  },
  {
    id: 'CMP-002', from: 'Rahman Faruk', fromType: 'Landlord', against: 'Sadia Islam', property: 'Shared Mess – South Campus',
    category: 'Late Payment', createdAt: '2026-09-18T09:00:00.000Z', status: 'Submitted',
    description: 'Rent payment is overdue despite reminders.', messages: [],
  },
];
let fixtures = cloneFixtures();

function cloneFixtures(): AdminComplaint[] {
  return initialFixtures.map((item) => ({ ...item, messages: item.messages.map((message) => ({ ...message })) }));
}

export function resetAdminComplaintFixtures(): void {
  fixtures = cloneFixtures();
}

function mapStatus(value: unknown): ComplaintStatus {
  return value as ComplaintStatus;
}

export async function listAdminComplaints(options: { status?: ComplaintStatus; q?: string }): Promise<AdminComplaint[]> {
  if (!persistentComplaints) {
    const query = options.q?.toLowerCase();
    return fixtures.filter((item) => (!options.status || item.status === options.status)
      && (!query || `${item.id} ${item.from} ${item.against} ${item.category} ${item.property}`.toLowerCase().includes(query)))
      .map((item) => ({ ...item, messages: [...item.messages] }));
  }

  const where: string[] = [];
  const params: unknown[] = [];
  if (options.status) { where.push('c.status = ?'); params.push(options.status); }
  if (options.q) {
    where.push('(c.id LIKE CONCAT(\'%\', ?, \'%\') OR c.category LIKE CONCAT(\'%\', ?, \'%\') OR c.description LIKE CONCAT(\'%\', ?, \'%\') OR complainant.name LIKE CONCAT(\'%\', ?, \'%\') OR accused.name LIKE CONCAT(\'%\', ?, \'%\') OR p.title LIKE CONCAT(\'%\', ?, \'%\'))');
    params.push(options.q, options.q, options.q, options.q, options.q, options.q);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT c.id, c.category, c.description, c.status, c.created_at,
      complainant.name AS complainant_name, complainant.role AS complainant_role,
      accused.name AS accused_name, p.title AS property_title
     FROM complaints c
     JOIN users complainant ON complainant.id = c.complainant_id
     JOIN users accused ON accused.id = c.accused_id
     LEFT JOIN properties p ON p.id = c.property_id
     ${clause} ORDER BY c.created_at DESC, c.id ASC`, params,
  );
  return rows.map((row) => mapComplaintRow(row, []));
}

export async function getAdminComplaint(id: string): Promise<AdminComplaint | undefined> {
  if (!persistentComplaints) return fixtures.find((item) => item.id === id);
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT c.id, c.category, c.description, c.status, c.created_at,
      complainant.name AS complainant_name, complainant.role AS complainant_role,
      accused.name AS accused_name, p.title AS property_title
     FROM complaints c
     JOIN users complainant ON complainant.id = c.complainant_id
     JOIN users accused ON accused.id = c.accused_id
     LEFT JOIN properties p ON p.id = c.property_id
     WHERE c.id = ? LIMIT 1`, [id],
  );
  return rows[0] ? mapComplaintRow(rows[0], await getComplaintMessages(id)) : undefined;
}

export async function updateAdminComplaintStatus(id: string, status: ComplaintStatus): Promise<AdminComplaint | undefined> {
  if (!persistentComplaints) {
    const complaint = fixtures.find((item) => item.id === id);
    if (!complaint) return undefined;
    complaint.status = status;
    return { ...complaint, messages: [...complaint.messages] };
  }
  await db.execute('UPDATE complaints SET status = ? WHERE id = ?', [status, id]);
  return getAdminComplaint(id);
}

export async function addAdminComplaintReply(id: string, adminId: string, message: string): Promise<AdminComplaint | undefined> {
  if (!persistentComplaints) {
    const complaint = fixtures.find((item) => item.id === id);
    if (!complaint) return undefined;
    complaint.messages.push({ id: `reply-${Date.now()}`, from: 'Admin', isAdmin: true, text: message, createdAt: new Date().toISOString() });
    if (complaint.status === 'Submitted' || complaint.status === 'Under Review') complaint.status = 'Responded';
    return { ...complaint, messages: [...complaint.messages] };
  }
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute<ResultSetHeader>(
      'INSERT INTO complaint_replies (complaint_id, sender_id, message_text) SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM complaints WHERE id = ?)',
      [id, Number(adminId), message, id],
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return undefined;
    }
    await connection.execute("UPDATE complaints SET status = CASE WHEN status IN ('Submitted', 'Under Review') THEN 'Responded' ELSE status END WHERE id = ?", [id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return getAdminComplaint(id);
}

async function getComplaintMessages(id: string): Promise<AdminComplaintMessage[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT r.id, r.message_text, r.created_at, u.name AS sender_name, u.role AS sender_role
     FROM complaint_replies r JOIN users u ON u.id = r.sender_id
     WHERE r.complaint_id = ? ORDER BY r.created_at ASC, r.id ASC`, [id],
  );
  return rows.map((row) => ({
    id: String(row.id),
    from: String(row.sender_name),
    isAdmin: row.sender_role === 'admin',
    text: String(row.message_text),
    createdAt: new Date(row.created_at as Date).toISOString(),
  }));
}

function mapComplaintRow(row: RowDataPacket, messages: AdminComplaintMessage[]): AdminComplaint {
  return {
    id: String(row.id),
    from: String(row.complainant_name),
    fromType: row.complainant_role === 'landlord' ? 'Landlord' : 'Student',
    against: String(row.accused_name),
    property: row.property_title == null ? '—' : String(row.property_title),
    category: String(row.category),
    createdAt: new Date(row.created_at as Date).toISOString(),
    status: mapStatus(row.status),
    description: String(row.description),
    messages,
  };
}