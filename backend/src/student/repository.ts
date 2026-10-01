import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';
import { AppError } from '../errors/AppError.js';
import type {
  FavoriteListing,
  StudentApplicationPayload,
  StudentFavoritePayload,
  StudentLeaseSummary,
  StudentMaintenanceRequest,
  StudentProfile,
  StudentReceiptSummary,
  StudentRentSummary,
} from '../contracts/student.js';
import { findTestListing, testApplications } from '../landlord/repository.js';

export const testStudentReviews = new Map<string, any[]>();
export const testStudentComplaints = new Map<string, any[]>();

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uiu_rental_system',
  port: Number(process.env.DB_PORT || 3306),
  connectionLimit: 10,
});

export interface StudentRepository {
  getProfile(userId: string): Promise<StudentProfile | null>;
  getFavorites(studentId: string): Promise<FavoriteListing[]>;
  addFavorite(studentId: string, payload: StudentFavoritePayload): Promise<FavoriteListing>;
  removeFavorite(studentId: string, listingId: string): Promise<boolean>;
  getApplications(studentId: string): Promise<Array<StudentApplicationPayload & { id: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; createdAt: string }>>;
  submitApplication(studentId: string, payload: StudentApplicationPayload): Promise<StudentApplicationPayload & { id: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; createdAt: string }>;
  cancelApplication(studentId: string, applicationId: string): Promise<boolean>;
  getLeases(studentId: string): Promise<StudentLeaseSummary[]>;
  getRentSummary(studentId: string): Promise<StudentRentSummary[]>;
  getReceipts(studentId: string): Promise<StudentReceiptSummary[]>;
  getMaintenanceRequests(studentId: string): Promise<StudentMaintenanceRequest[]>;
  submitMaintenanceRequest(studentId: string, payload: Omit<StudentMaintenanceRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<StudentMaintenanceRequest>;
  getMaintenanceComments(studentId: string, requestId: string): Promise<any[]>;
  addMaintenanceComment(studentId: string, requestId: string, message: string): Promise<any>;
  updateProfile(userId: string, payload: { name?: string; phone?: string; studentId?: string }): Promise<StudentProfile | null>;
  payRentObligation(studentId: string, obligationId: string, method?: string): Promise<{ receiptNumber: string; paidAt: string }>;
  getReviews(studentId: string): Promise<any[]>;
  submitReview(studentId: string, payload: { propertyId: string; landlordId?: string; landlordStars: number; propertyStars: number; comment?: string }): Promise<any>;
  getComplaints(studentId: string): Promise<any[]>;
  submitComplaint(studentId: string, payload: { against?: string; property?: string; propertyId?: string; category: string; subject: string; description: string }): Promise<any>;
}

type StudentUserRow = RowDataPacket & {
  id: number;
  role: 'student' | 'admin' | 'landlord' | 'guest';
  name: string;
  email: string;
  student_id?: string | null;
  phone?: string | null;
  status: 'active' | 'pending' | 'suspended' | 'deactivated';
};

type FavoriteRow = RowDataPacket & {
  student_id: number;
  property_id: number;
  created_at: Date;
  property_code: string;
  title: string;
  price: number | string;
  landlord_name?: string | null;
};

type ApplicationRow = RowDataPacket & {
  id: number;
  property_id: number;
  student_id: number;
  landlord_id: number;
  student_card_no?: string | null;
  contact_phone?: string | null;
  move_in_date: Date;
  employment?: string | null;
  message?: string | null;
  status: 'under-review' | 'accepted' | 'rejected' | 'cancelled';
  created_at: Date;
  property_code?: string;
  property_title?: string;
};

type LeaseRow = RowDataPacket & {
  id: number;
  property_id: number;
  student_id: number;
  landlord_id: number;
  status: 'pending' | 'active' | 'ended' | 'terminated';
  start_date: Date;
  end_date?: Date | null;
  monthly_rent: number | string;
  created_at: Date;
  updated_at: Date;
  property_code?: string;
  property_title?: string;
  landlord_name?: string;
};

type RentRow = RowDataPacket & {
  id: number;
  lease_id: number;
  month_year: string;
  amount: number | string;
  due_date: Date;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'disputed';
};

type ReceiptRow = RowDataPacket & {
  id: number;
  rent_obligation_id: number;
  receipt_number: string;
  amount: number | string;
  issued_at: Date;
};

type MaintenanceRow = RowDataPacket & {
  id: number;
  property_id: number;
  student_id: number;
  landlord_id: number;
  issue: string;
  description?: string | null;
  priority: 'Low' | 'Medium' | 'High';
  status: 'open' | 'in-progress' | 'resolved';
  progress_stage: number;
  category?: string | null;
  created_at: Date;
  updated_at: Date;
  attachments?: string | null;
};

const toStudentProfile = (row: StudentUserRow): StudentProfile => ({
  id: String(row.id),
  name: row.name,
  email: row.email,
  studentId: row.student_id ?? undefined,
  phone: row.phone ?? undefined,
  role: row.role,
  status: row.status,
});

function useFixtures(): boolean {
  return process.env.NODE_ENV === 'test';
}

const testFavorites = new Map<string, FavoriteListing[]>();
const testMaintenanceRequests = new Map<string, StudentMaintenanceRequest[]>();

async function resolvePropertyId(identifier: string): Promise<number> {
  const value = identifier.trim();
  if (!value) throw new AppError(400, 'INVALID_PROPERTY_ID', 'Listing identifier is required');

  if (useFixtures()) {
    const testListing = findTestListing(value);
    if (testListing) return 1;
  }

  const numericId = Number(value);
  if (Number.isFinite(numericId) && numericId > 0) {
    const [rows] = await db.query<RowDataPacket[]>('SELECT id FROM properties WHERE id = ? LIMIT 1', [numericId]);
    if (rows[0]) return numericId;
  }

  const [rows] = await db.query<RowDataPacket[]>('SELECT id FROM properties WHERE property_code = ? LIMIT 1', [value]);
  if (!rows[0]) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing does not exist');

  return Number(rows[0].id);
}

export const studentRepository: StudentRepository = {
  async getProfile(userId: string): Promise<StudentProfile | null> {
    const studentId = Number(userId);
    if (!Number.isFinite(studentId)) return null;

    const [rows] = await db.query<StudentUserRow[]>('SELECT id, role, name, email, student_id, phone, status FROM users WHERE id = ? AND role = ? LIMIT 1', [studentId, 'student']);
    return rows[0] ? toStudentProfile(rows[0]) : null;
  },

  async updateProfile(userId: string, payload: { name?: string; phone?: string; studentId?: string }): Promise<StudentProfile | null> {
    const studentId = Number(userId);
    if (!Number.isFinite(studentId)) return null;

    if (useFixtures()) {
      return {
        id: userId,
        name: payload.name ?? 'Student',
        email: 'student@uiu.ac.bd',
        studentId: payload.studentId ?? '01124000001',
        phone: payload.phone ?? '+8801700000000',
        role: 'student',
        status: 'active',
      };
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];
    if (payload.name) { updates.push('name = ?'); values.push(payload.name); }
    if (payload.phone) { updates.push('phone = ?'); values.push(payload.phone); }
    if (payload.studentId) { updates.push('student_id = ?'); values.push(payload.studentId); }

    if (updates.length > 0) {
      values.push(studentId);
      await db.execute(`UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ? AND role = 'student'`, values);
    }

    return this.getProfile(userId);
  },

  async getFavorites(studentId: string): Promise<FavoriteListing[]> {
    if (useFixtures()) {
      return testFavorites.get(studentId) ?? [];
    }

    const userId = Number(studentId);
    if (!Number.isFinite(userId)) return [];

    const [rows] = await db.query<FavoriteRow[]>(`SELECT f.student_id, f.property_id, f.created_at, p.property_code, p.title, p.price, u.name AS landlord_name
      FROM favorites f
      JOIN properties p ON p.id = f.property_id
      LEFT JOIN users u ON u.id = p.landlord_id
      WHERE f.student_id = ?
      ORDER BY f.created_at DESC`, [userId]);

    return rows.map((row) => ({
      id: `${row.student_id}-${row.property_id}`,
      studentId: String(row.student_id),
      listingId: String(row.property_code ?? row.property_id),
      createdAt: row.created_at.toISOString(),
      listing: {
        id: String(row.property_code ?? row.property_id),
        title: row.title,
        priceBDT: Number(row.price),
        landlordName: row.landlord_name ?? undefined,
      },
    }));
  },

  async addFavorite(studentId: string, payload: StudentFavoritePayload): Promise<FavoriteListing> {
    if (useFixtures()) {
      const list = testFavorites.get(studentId) ?? [];
      const listingId = payload.listingId;
      if (list.some((favorite) => favorite.listingId === listingId || favorite.listing?.id === listingId)) {
        throw new AppError(409, 'DUPLICATE_FAVORITE', 'You already saved this listing');
      }
      const favorite: FavoriteListing = {
        id: `${studentId}-${listingId}`,
        studentId,
        listingId,
        createdAt: new Date().toISOString(),
        listing: {
          id: listingId,
          title: 'Studio near Gate 3',
          priceBDT: 4200,
          landlordName: 'Rahman Faruk',
        },
      };
      list.unshift(favorite);
      testFavorites.set(studentId, list);
      return favorite;
    }

    const userId = Number(studentId);
    if (!Number.isFinite(userId)) {
      throw new AppError(400, 'INVALID_FAVORITE', 'Favorite listing is invalid');
    }

    const propertyId = await resolvePropertyId(payload.listingId);
    const [existing] = await db.query<RowDataPacket[]>('SELECT 1 FROM favorites WHERE student_id = ? AND property_id = ? LIMIT 1', [userId, propertyId]);
    if (existing?.[0]) throw new AppError(409, 'DUPLICATE_FAVORITE', 'You already saved this listing');

    await db.execute('INSERT INTO favorites (student_id, property_id) VALUES (?, ?)', [userId, propertyId]);

    const [property] = await db.query<RowDataPacket[]>('SELECT p.property_code, p.title, p.price, u.name AS landlord_name FROM properties p LEFT JOIN users u ON u.id = p.landlord_id WHERE p.id = ? LIMIT 1', [propertyId]);
    const row = property[0];

    return {
      id: `${userId}-${propertyId}`,
      studentId: String(userId),
      listingId: String(row?.property_code ?? payload.listingId),
      createdAt: new Date().toISOString(),
      listing: {
        id: String(row?.property_code ?? payload.listingId),
        title: row?.title ?? 'Listing',
        priceBDT: Number(row?.price ?? 0),
        landlordName: row?.landlord_name ?? undefined,
      },
    };
  },

  async removeFavorite(studentId: string, listingId: string): Promise<boolean> {
    if (useFixtures()) {
      const list = testFavorites.get(studentId) ?? [];
      const next = list.filter((favorite) => favorite.listingId !== listingId && favorite.listing?.id !== listingId);
      if (next.length === list.length) return false;
      testFavorites.set(studentId, next);
      return true;
    }

    const userId = Number(studentId);
    if (!Number.isFinite(userId)) return false;

    const propertyId = await resolvePropertyId(listingId);
    const [result] = await db.execute('DELETE FROM favorites WHERE student_id = ? AND property_id = ?', [userId, propertyId]);
    return (result as { affectedRows?: number }).affectedRows !== undefined && (result as { affectedRows: number }).affectedRows > 0;
  },

  async getApplications(studentId: string): Promise<Array<StudentApplicationPayload & { id: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; createdAt: string }>> {
    if (useFixtures()) {
      const list = testApplications.get(studentId) ?? [];
      return list.map((application) => ({
        id: application.id,
        propertyId: application.propertyId,
        landlordId: application.landlordId,
        moveInDate: application.moveInDate ?? new Date().toISOString().slice(0, 10),
        employment: application.employment ?? 'Student',
        studentCardNo: application.studentCardNo,
        contactPhone: application.contactPhone,
        message: application.message,
        status: application.status,
        createdAt: application.createdAt,
      }));
    }

    const userId = Number(studentId);
    if (!Number.isFinite(userId)) return [];

    const [rows] = await db.query<ApplicationRow[]>(`SELECT a.id, a.property_id, a.student_id, a.landlord_id, a.student_card_no, a.contact_phone, a.move_in_date, a.employment, a.message, a.status, a.created_at, p.property_code, p.title AS property_title
      FROM applications a
      JOIN properties p ON p.id = a.property_id
      WHERE a.student_id = ?
      ORDER BY a.created_at DESC`, [userId]);

    return rows.map((row) => ({
      id: String(row.id),
      propertyId: String(row.property_id),
      listingId: String(row.property_code),
      propertyTitle: row.property_title ?? undefined,
      landlordId: String(row.landlord_id),
      studentCardNo: row.student_card_no ?? undefined,
      contactPhone: row.contact_phone ?? undefined,
      moveInDate: row.move_in_date.toISOString().slice(0, 10),
      employment: row.employment ?? 'Student',
      message: row.message ?? undefined,
      status: row.status,
      stage: Number(row.progress_stage),
      createdAt: row.created_at.toISOString(),
    }));
  },

  async submitApplication(studentId: string, payload: StudentApplicationPayload): Promise<StudentApplicationPayload & { id: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; createdAt: string }> {
    if (useFixtures()) {
      const list = testApplications.get(studentId) ?? [];
      if (list.some((application) => application.propertyId === payload.propertyId && application.status !== 'cancelled')) {
        throw new AppError(409, 'DUPLICATE_APPLICATION', 'You already submitted an application for this property');
      }
      const testListing = findTestListing(payload.propertyId);
      const landlordId = testListing?.landlordId || payload.landlordId || '2';
      const application = {
        id: `${studentId}-${payload.propertyId}`,
        propertyId: testListing?.id || payload.propertyId,
        studentId,
        landlordId,
        studentCardNo: payload.studentCardNo,
        contactPhone: payload.contactPhone,
        moveInDate: payload.moveInDate,
        employment: payload.employment ?? 'Student',
        message: payload.message,
        status: 'under-review' as const,
        createdAt: new Date().toISOString(),
      };
      list.unshift(application);
      testApplications.set(studentId, list);
      return application;
    }

    const userId = Number(studentId);
    if (!Number.isFinite(userId)) {
      throw new AppError(400, 'INVALID_APPLICATION', 'Application data is invalid');
    }

    const propertyId = await resolvePropertyId(payload.propertyId);
    const [propertyRows] = await db.query<RowDataPacket[]>('SELECT landlord_id FROM properties WHERE id = ? LIMIT 1', [propertyId]);
    const property = propertyRows[0];
    if (!property) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing does not exist');

    const [existingRows] = await db.query<RowDataPacket[]>('SELECT id FROM applications WHERE student_id = ? AND property_id = ? AND status != ? LIMIT 1', [userId, propertyId, 'cancelled']);
    const existing = existingRows[0] as RowDataPacket | undefined;
    if (existing?.id) throw new AppError(409, 'DUPLICATE_APPLICATION', 'You already submitted an application for this property');

    const [result] = await db.execute('INSERT INTO applications (property_id, student_id, landlord_id, student_card_no, contact_phone, move_in_date, employment, message, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [propertyId, userId, property.landlord_id, payload.studentCardNo ?? null, payload.contactPhone ?? null, payload.moveInDate, payload.employment ?? 'Student', payload.message ?? null, 'under-review']);
    const insertId = Number((result as { insertId?: number }).insertId ?? 0);

    return {
      id: String(insertId),
      propertyId: payload.propertyId,
      landlordId: String(property.landlord_id),
      studentCardNo: payload.studentCardNo,
      contactPhone: payload.contactPhone,
      moveInDate: payload.moveInDate,
      employment: payload.employment ?? 'Student',
      message: payload.message,
      status: 'under-review',
      createdAt: new Date().toISOString(),
    };
  },

  async cancelApplication(studentId: string, applicationId: string): Promise<boolean> {
    if (useFixtures()) {
      const list = testApplications.get(studentId) ?? [];
      const app = list.find((a) => a.id === applicationId || a.propertyId === applicationId);
      if (app) {
        app.status = 'cancelled';
        return true;
      }
      return false;
    }

    const userId = Number(studentId);
    if (!Number.isFinite(userId)) return false;

    const appId = Number(applicationId);
    if (Number.isFinite(appId) && appId > 0) {
      const [res] = await db.execute("UPDATE applications SET status = 'cancelled' WHERE id = ? AND student_id = ?", [appId, userId]);
      if ((res as { affectedRows?: number }).affectedRows && (res as { affectedRows: number }).affectedRows > 0) {
        return true;
      }

      const [resProp] = await db.execute("UPDATE applications SET status = 'cancelled' WHERE property_id = ? AND student_id = ? AND status != 'cancelled'", [appId, userId]);
      if ((resProp as { affectedRows?: number }).affectedRows && (resProp as { affectedRows: number }).affectedRows > 0) {
        return true;
      }
    }

    try {
      const resolvedId = await resolvePropertyId(applicationId);
      const [resCode] = await db.execute("UPDATE applications SET status = 'cancelled' WHERE property_id = ? AND student_id = ? AND status != 'cancelled'", [resolvedId, userId]);
      if ((resCode as { affectedRows?: number }).affectedRows && (resCode as { affectedRows: number }).affectedRows > 0) {
        return true;
      }
    } catch {
      // not a property code
    }

    return false;
  },

  async getLeases(studentId: string): Promise<StudentLeaseSummary[]> {
    if (useFixtures()) return [];
    const userId = Number(studentId);
    if (!Number.isFinite(userId)) return [];

    const [rows] = await db.query<LeaseRow[]>(`SELECT l.id, l.property_id, l.student_id, l.landlord_id, l.status, l.start_date, l.end_date, l.monthly_rent, l.created_at, l.updated_at, p.property_code, p.title AS property_title, u.name AS landlord_name
      FROM leases l
      JOIN properties p ON p.id = l.property_id
      JOIN users u ON u.id = l.landlord_id
      WHERE l.student_id = ?
      ORDER BY l.updated_at DESC`, [userId]);

    return rows.map((row) => ({
      id: String(row.id),
      propertyId: String(row.property_id),
      propertyTitle: row.property_title ?? undefined,
      propertyCode: row.property_code ?? undefined,
      studentId: String(row.student_id),
      landlordId: String(row.landlord_id),
      landlordName: row.landlord_name ?? undefined,
      status: row.status,
      startDate: row.start_date.toISOString().slice(0, 10),
      endDate: row.end_date ? row.end_date.toISOString().slice(0, 10) : undefined,
      monthlyRent: Number(row.monthly_rent),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));
  },

  async getRentSummary(studentId: string): Promise<StudentRentSummary[]> {
    if (useFixtures()) return [];
    const userId = Number(studentId);
    if (!Number.isFinite(userId)) return [];

    const [rows] = await db.query<RentRow[]>(`SELECT ro.id, ro.lease_id, ro.month_year, ro.amount, ro.due_date, ro.status
      FROM rent_obligations ro
      JOIN leases l ON l.id = ro.lease_id
      WHERE l.student_id = ?
      ORDER BY ro.due_date DESC`, [userId]);

    return rows.map((row) => ({
      id: String(row.id),
      leaseId: String(row.lease_id),
      month: row.month_year,
      amount: Number(row.amount),
      dueDate: row.due_date.toISOString().slice(0, 10),
      status: row.status,
    }));
  },

  async getReceipts(studentId: string): Promise<StudentReceiptSummary[]> {
    if (useFixtures()) return [];
    const userId = Number(studentId);
    if (!Number.isFinite(userId)) return [];

    const [rows] = await db.query<ReceiptRow[]>(`SELECT pr.id, pr.rent_obligation_id, pr.receipt_number, ro.amount, pr.issued_at
      FROM payment_receipts pr
      JOIN rent_obligations ro ON ro.id = pr.rent_obligation_id
      JOIN leases l ON l.id = ro.lease_id
      WHERE l.student_id = ?
      ORDER BY pr.issued_at DESC`, [userId]);

    return rows.map((row) => ({
      id: String(row.id),
      receiptNumber: row.receipt_number,
      obligationId: String(row.rent_obligation_id),
      amount: Number(row.amount),
      issuedAt: row.issued_at.toISOString(),
    }));
  },

  async payRentObligation(studentId: string, obligationId: string, _method?: string): Promise<{ receiptNumber: string; paidAt: string }> {
    const userId = Number(studentId);
    const oblId = Number(obligationId);
    if (!Number.isFinite(userId) || !Number.isFinite(oblId)) {
      throw new AppError(400, 'INVALID_PAYMENT', 'Invalid obligation or student ID');
    }

    if (useFixtures()) {
      const receiptNumber = `REC-${Date.now()}`;
      const paidAt = new Date().toISOString();
      return { receiptNumber, paidAt };
    }

    // Verify obligation belongs to this student and is payable
    const [oblRows] = await db.query<RowDataPacket[]>(
      `SELECT ro.id, ro.status FROM rent_obligations ro
       JOIN leases l ON l.id = ro.lease_id
       WHERE ro.id = ? AND l.student_id = ? LIMIT 1`,
      [oblId, userId],
    );
    const obl = oblRows[0];
    if (!obl) throw new AppError(404, 'OBLIGATION_NOT_FOUND', 'Rent obligation not found');
    if (obl.status === 'paid') throw new AppError(409, 'ALREADY_PAID', 'This obligation has already been paid');
    if (!['pending', 'processing'].includes(obl.status)) {
      throw new AppError(400, 'INVALID_STATUS', 'Obligation cannot be paid in its current state');
    }

    // Mark obligation as paid
    await db.execute(`UPDATE rent_obligations SET status = 'paid' WHERE id = ?`, [oblId]);

    // Insert payment receipt (ignore if duplicate race)
    const receiptNumber = `REC-${Date.now()}`;
    const paidAt = new Date().toISOString();
    await db.execute(
      `INSERT IGNORE INTO payment_receipts (rent_obligation_id, receipt_number, issued_at) VALUES (?, ?, ?)`,
      [oblId, receiptNumber, new Date(paidAt)],
    );

    return { receiptNumber, paidAt };
  },

  async getMaintenanceRequests(studentId: string): Promise<StudentMaintenanceRequest[]> {
    if (useFixtures()) {
      return testMaintenanceRequests.get(studentId) ?? [];
    }
    const userId = Number(studentId);
    if (!Number.isFinite(userId)) return [];

    const [rows] = await db.query<MaintenanceRow[]>(`SELECT m.id, m.property_id, m.student_id, m.landlord_id, m.issue, m.description, m.priority, m.status, m.progress_stage, m.created_at, m.updated_at
      FROM maintenance_requests m
      WHERE m.student_id = ?
      ORDER BY m.created_at DESC`, [userId]);

    return rows.map((row) => ({
      id: String(row.id),
      propertyId: String(row.property_id),
      landlordId: String(row.landlord_id),
      category: row.category ?? undefined,
      issue: row.issue,
      description: row.description ?? undefined,
      priority: row.priority,
      status: row.status,
      attachments: undefined,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));
  },

  async submitMaintenanceRequest(studentId: string, payload: Omit<StudentMaintenanceRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<StudentMaintenanceRequest> {
    const userId = Number(studentId);
    const landlordId = Number(payload.landlordId);
    if (!Number.isFinite(userId) || !Number.isFinite(landlordId)) {
      throw new AppError(400, 'INVALID_MAINTENANCE_REQUEST', 'Maintenance request is invalid');
    }

    if (useFixtures()) {
      const listing = findTestListing(payload.propertyId);
      if (!listing) {
        throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing does not exist');
      }
      if (Number(listing.landlordId) !== landlordId) {
        throw new AppError(400, 'INVALID_LANDLORD', 'The selected landlord does not own this property');
      }

      const newReq: StudentMaintenanceRequest = {
        id: `maint_${Date.now()}`,
        propertyId: payload.propertyId,
        landlordId: payload.landlordId,
        category: payload.category,
        issue: payload.issue,
        description: payload.description,
        priority: payload.priority,
        status: 'open',
        stage: 1,
        attachments: payload.attachments,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const list = testMaintenanceRequests.get(studentId) ?? [];
      list.unshift(newReq);
      testMaintenanceRequests.set(studentId, list);
      return newReq;
    }

    const propertyId = await resolvePropertyId(payload.propertyId);
    const [propertyRows] = await db.query<RowDataPacket[]>('SELECT landlord_id FROM properties WHERE id = ? LIMIT 1', [propertyId]);
    const property = propertyRows[0];
    if (!property) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing does not exist');

    if (Number(property.landlord_id) !== landlordId) {
      throw new AppError(400, 'INVALID_LANDLORD', 'The selected landlord does not own this property');
    }

    const [result] = await db.execute('INSERT INTO maintenance_requests (property_id, student_id, landlord_id, issue, description, priority, status, progress_stage) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [propertyId, userId, landlordId, payload.issue, payload.description ?? null, payload.priority, 'open', 1]);
    const insertId = Number((result as { insertId?: number }).insertId ?? 0);

    return {
      id: String(insertId),
      propertyId: payload.propertyId,
      landlordId: payload.landlordId,
      category: payload.category,
      issue: payload.issue,
      description: payload.description,
      priority: payload.priority,
      status: 'open',
      stage: 1,
      attachments: payload.attachments,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async getMaintenanceComments(studentId: string, requestId: string): Promise<any[]> {
    const studentNumericId = Number(studentId);
    const numericRequestId = Number(requestId);
    if (!Number.isFinite(studentNumericId) || !Number.isFinite(numericRequestId)) return [];

    if (useFixtures()) return [];

    // Verify student owns this request
    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT id FROM maintenance_requests WHERE id = ? AND student_id = ? LIMIT 1',
      [numericRequestId, studentNumericId],
    );
    if (!existing[0]) return [];

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT mc.id, mc.maintenance_request_id, mc.author_id, mc.message, mc.created_at,
              u.name AS author_name, u.role AS author_role
       FROM maintenance_comments mc
       JOIN users u ON u.id = mc.author_id
       WHERE mc.maintenance_request_id = ?
       ORDER BY mc.created_at ASC`,
      [numericRequestId],
    );

    return rows.map((row) => ({
      id: Number(row.id),
      requestId: String(row.maintenance_request_id),
      authorId: String(row.author_id),
      authorName: row.author_name || 'Unknown',
      from: row.author_role === 'landlord' ? 'landlord' : 'student',
      text: row.message,
      date: new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      createdAt: row.created_at.toISOString(),
    }));
  },

  async addMaintenanceComment(studentId: string, requestId: string, message: string): Promise<any> {
    const studentNumericId = Number(studentId);
    const numericRequestId = Number(requestId);
    if (!Number.isFinite(studentNumericId) || !Number.isFinite(numericRequestId)) {
      throw new AppError(400, 'INVALID_IDS', 'Invalid IDs');
    }

    if (useFixtures()) {
      return { id: Date.now(), requestId, authorId: studentId, from: 'student', text: message, date: 'Now', createdAt: new Date().toISOString() };
    }

    // Verify student owns this request
    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT id FROM maintenance_requests WHERE id = ? AND student_id = ? LIMIT 1',
      [numericRequestId, studentNumericId],
    );
    if (!existing[0]) throw new AppError(403, 'FORBIDDEN', 'You do not own this maintenance request');

    const [result] = await db.execute(
      'INSERT INTO maintenance_comments (maintenance_request_id, author_id, message) VALUES (?, ?, ?)',
      [numericRequestId, studentNumericId, message],
    );
    const insertId = Number((result as { insertId?: number }).insertId ?? 0);

    const [authorRows] = await db.query<RowDataPacket[]>('SELECT name FROM users WHERE id = ? LIMIT 1', [studentNumericId]);
    const createdAt = new Date();
    return {
      id: insertId,
      requestId,
      authorId: studentId,
      authorName: authorRows[0]?.name || 'Student',
      from: 'student',
      text: message,
      date: createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      createdAt: createdAt.toISOString(),
    };
  },

  async getReviews(studentId: string): Promise<any[]> {
    if (useFixtures()) {
      return testStudentReviews.get(studentId) ?? [];
    }
    const userId = Number(studentId);
    if (!Number.isFinite(userId)) return [];

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT r.id, r.property_id, p.property_code, r.student_id, r.landlord_id, r.landlord_stars, r.property_stars, r.comment, r.created_at,
              p.title AS property_title, p.property_code, u.name AS landlord_name
       FROM reviews r
       JOIN properties p ON p.id = r.property_id
       JOIN users u ON u.id = r.landlord_id
       WHERE r.student_id = ?
       ORDER BY r.created_at DESC`,
      [userId],
    );

    return rows.map((row) => ({
      id: Number(row.id),
      propertyId: String(row.property_code || row.property_id),
      property: row.property_title || row.property_code,
      landlordId: String(row.landlord_id),
      landlord: row.landlord_name || 'Landlord',
      landlordStars: Number(row.landlord_stars),
      propStars: Number(row.property_stars),
      text: row.comment || '',
      date: new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      createdAt: row.created_at.toISOString(),
    }));
  },

  async submitReview(studentId: string, payload: { propertyId: string; landlordId?: string; landlordStars: number; propertyStars: number; comment?: string }): Promise<any> {
    const userId = Number(studentId);
    if (!Number.isFinite(userId)) throw new AppError(400, 'INVALID_USER', 'Invalid student ID');

    if (useFixtures()) {
      const listing = findTestListing(payload.propertyId);
      const review = {
        id: Date.now(),
        propertyId: listing?.propertyCode || payload.propertyId,
        property: `Property ${payload.propertyId}`,
        landlordId: listing?.landlordId || payload.landlordId || '1',
        landlord: 'Landlord',
        landlordStars: payload.landlordStars,
        propStars: payload.propertyStars,
        text: payload.comment || '',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        createdAt: new Date().toISOString(),
      };
      const list = testStudentReviews.get(studentId) ?? [];
      list.unshift(review);
      testStudentReviews.set(studentId, list);
      return review;
    }

    const propId = await resolvePropertyId(payload.propertyId);
    const [propertyRows] = await db.query<RowDataPacket[]>('SELECT landlord_id, title, property_code FROM properties WHERE id = ? LIMIT 1', [propId]);
    const property = propertyRows[0];
    if (!property) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing does not exist');
    const landlordId = Number(property.landlord_id);
    if (!Number.isFinite(landlordId)) throw new AppError(500, 'INVALID_LISTING_LANDLORD', 'The listing has no valid landlord');

    const [result] = await db.execute(
      `INSERT INTO reviews (property_id, student_id, landlord_id, landlord_stars, property_stars, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [propId, userId, landlordId, payload.landlordStars, payload.propertyStars, payload.comment ?? null],
    );
    const insertId = Number((result as { insertId?: number }).insertId ?? Date.now());

    const [userRows] = await db.query<RowDataPacket[]>('SELECT name FROM users WHERE id = ? LIMIT 1', [landlordId]);

    return {
      id: insertId,
      propertyId: String(property.property_code || propId),
      property: property.title || property.property_code || `Property ${propId}`,
      landlordId: String(landlordId),
      landlord: userRows[0]?.name || 'Landlord',
      landlordStars: payload.landlordStars,
      propStars: payload.propertyStars,
      text: payload.comment || '',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      createdAt: new Date().toISOString(),
    };
  },

  async getComplaints(studentId: string): Promise<any[]> {
    if (useFixtures()) {
      return testStudentComplaints.get(studentId) ?? [];
    }
    const userId = Number(studentId);
    if (!Number.isFinite(userId)) return [];

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT c.id, c.complainant_id, c.accused_id, c.property_id, c.category, c.description, c.status, c.created_at,
              u.name AS accused_name, p.title AS property_title, p.property_code
       FROM complaints c
       LEFT JOIN users u ON u.id = c.accused_id
       LEFT JOIN properties p ON p.id = c.property_id
       WHERE c.complainant_id = ?
       ORDER BY c.created_at DESC`,
      [userId],
    );

    return rows.map((row) => ({
      id: row.id,
      against: row.accused_name || 'Landlord / User',
      property: row.property_title || row.property_code || '',
      category: row.category,
      subject: row.description.includes(' — ') ? row.description.split(' — ')[0] : row.category,
      description: row.description.includes(' — ') ? row.description.split(' — ').slice(1).join(' — ') : row.description,
      date: new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: row.status,
      createdAt: row.created_at.toISOString(),
    }));
  },

  async submitComplaint(studentId: string, payload: { against?: string; property?: string; propertyId?: string; category: string; subject: string; description: string }): Promise<any> {
    const userId = Number(studentId);
    if (!Number.isFinite(userId)) throw new AppError(400, 'INVALID_USER', 'Invalid student ID');

    const complaintId = `CMP-${Date.now().toString().slice(-6)}`;
    const fullDesc = payload.subject ? `${payload.subject} — ${payload.description}` : payload.description;

    if (useFixtures()) {
      const complaint = {
        id: complaintId,
        against: payload.against || 'Support / Admin',
        property: payload.property || '',
        category: payload.category,
        subject: payload.subject,
        description: payload.description,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        status: 'Submitted',
        createdAt: new Date().toISOString(),
      };
      const list = testStudentComplaints.get(studentId) ?? [];
      list.unshift(complaint);
      testStudentComplaints.set(studentId, list);
      return complaint;
    }

    let accusedId = 1; // Default to admin
    if (payload.against?.trim()) {
      const [userRows] = await db.query<RowDataPacket[]>('SELECT id FROM users WHERE name LIKE ? LIMIT 1', [`%${payload.against.trim()}%`]);
      if (userRows[0]?.id) accusedId = Number(userRows[0].id);
    }

    let propId: number | null = null;
    if (payload.propertyId) {
      propId = await resolvePropertyId(payload.propertyId).catch(() => null);
    } else if (payload.property) {
      const [propRows] = await db.query<RowDataPacket[]>('SELECT id FROM properties WHERE title LIKE ? OR property_code = ? LIMIT 1', [`%${payload.property.trim()}%`, payload.property.trim()]);
      if (propRows[0]?.id) propId = Number(propRows[0].id);
    }

    await db.execute(
      `INSERT INTO complaints (id, complainant_id, accused_id, property_id, category, description, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Submitted')`,
      [complaintId, userId, accusedId, propId, payload.category, fullDesc],
    );

    return {
      id: complaintId,
      against: payload.against || 'Landlord',
      property: payload.property || '',
      category: payload.category,
      subject: payload.subject,
      description: payload.description,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };
  },
};
