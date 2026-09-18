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
import { findTestListing } from '../landlord/repository.js';

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
}

type StudentUserRow = RowDataPacket & {
  id: number;
  role: 'student' | 'admin' | 'landlord' | 'guest';
  name: string;
  email: string;
  student_id?: string | null;
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
  role: row.role,
  status: row.status,
});

function useFixtures(): boolean {
  return process.env.NODE_ENV === 'test';
}

const testFavorites = new Map<string, FavoriteListing[]>();
const testApplications = new Map<string, Array<StudentApplicationPayload & { id: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; createdAt: string }>>();
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

    const [rows] = await db.query<StudentUserRow[]>('SELECT id, role, name, email, student_id, status FROM users WHERE id = ? AND role = ? LIMIT 1', [studentId, 'student']);
    return rows[0] ? toStudentProfile(rows[0]) : null;
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
      listingId: String(row.property_id),
      listingId: String(row.property_code),
      createdAt: row.created_at.toISOString(),
      listing: {
        id: String(row.property_id),
        id: String(row.property_code),
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
      return testApplications.get(studentId) ?? [];
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
      landlordId: String(row.landlord_id),
      studentCardNo: row.student_card_no ?? undefined,
      contactPhone: row.contact_phone ?? undefined,
      moveInDate: row.move_in_date.toISOString().slice(0, 10),
      employment: row.employment ?? 'Student',
      message: row.message ?? undefined,
      status: row.status,
      createdAt: row.created_at.toISOString(),
    }));
  },

  async submitApplication(studentId: string, payload: StudentApplicationPayload): Promise<StudentApplicationPayload & { id: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; createdAt: string }> {
    if (useFixtures()) {
      const list = testApplications.get(studentId) ?? [];
      if (list.some((application) => application.propertyId === payload.propertyId && application.status !== 'cancelled')) {
        throw new AppError(409, 'DUPLICATE_APPLICATION', 'You already submitted an application for this property');
      }
      const application = {
        id: `${studentId}-${payload.propertyId}`,
        propertyId: payload.propertyId,
        landlordId: '2',
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
    const appId = Number(applicationId);
    if (!Number.isFinite(userId) || !Number.isFinite(appId)) return false;

    await db.execute("UPDATE applications SET status = 'cancelled' WHERE id = ? AND student_id = ?", [appId, userId]);
    return true;
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
      studentId: String(row.student_id),
      landlordId: String(row.landlord_id),
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

  async getMaintenanceRequests(studentId: string): Promise<StudentMaintenanceRequest[]> {
    if (useFixtures()) {
      return testMaintenanceRequests.get(studentId) ?? [];
    }
    const userId = Number(studentId);
    if (!Number.isFinite(userId)) return [];

    const [rows] = await db.query<MaintenanceRow[]>(`SELECT m.id, m.property_id, m.student_id, m.landlord_id, m.issue, m.description, m.priority, m.status, m.created_at, m.updated_at
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

    const [result] = await db.execute('INSERT INTO maintenance_requests (property_id, student_id, landlord_id, issue, description, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [propertyId, userId, landlordId, payload.issue, payload.description ?? null, payload.priority, 'open']);
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
      attachments: payload.attachments,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
};
