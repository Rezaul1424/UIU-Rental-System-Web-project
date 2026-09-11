import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';
import { AppError } from '../errors/AppError.js';
import type {
  ApplicationReviewPayload,
  LandlordLeaseSummary,
  LandlordListingPayload,
  LandlordProfile,
  MaintenanceUpdatePayload,
} from '../contracts/landlord.js';

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uiu_rental_system',
  port: Number(process.env.DB_PORT || 3306),
  connectionLimit: 10,
});

type DbPropertyRow = RowDataPacket & {
  id: number;
  property_code: string;
  title: string;
  description?: string | null;
  type: string;
  price: number | string;
  status: string;
  distance_km: number | string;
  bedroom_count?: number | null;
  roommate_capacity?: number | null;
  parking?: string | null;
  address_street?: string | null;
  address_area?: string | null;
  address_city?: string | null;
  created_at: Date;
  updated_at: Date;
};

type DbAmenityRow = RowDataPacket & {
  property_id: number;
  name: string;
};

type DbApplicationRow = RowDataPacket & {
  id: number;
  property_id: number;
  student_id: number;
  landlord_id: number;
  status: 'under-review' | 'accepted' | 'rejected' | 'cancelled';
  created_at: Date;
};

type DbLeaseRow = RowDataPacket & {
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
};

type DbMaintenanceRow = RowDataPacket & {
  id: number;
  property_id: number;
  student_id: number;
  landlord_id: number;
  issue: string;
  description?: string | null;
  priority: 'Low' | 'Medium' | 'High';
  status: 'open' | 'in-progress' | 'resolved';
  created_at: Date;
  updated_at: Date;
};

type TestListingRecord = LandlordListingPayload & {
  id: string;
  landlordId: string;
  propertyCode: string;
  createdAt: string;
  updatedAt: string;
};

type TestApplicationRecord = {
  id: string;
  propertyId: string;
  studentId: string;
  landlordId: string;
  status: 'under-review' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
};

type TestMaintenanceRecord = {
  id: string;
  propertyId: string;
  studentId: string;
  landlordId: string;
  issue: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
  updatedAt: string;
};

type TestLeaseRecord = LandlordLeaseSummary & {
  landlordId: string;
};

const testListings = new Map<string, TestListingRecord[]>();
const testApplications = new Map<string, TestApplicationRecord[]>();
const testMaintenanceRequests = new Map<string, TestMaintenanceRecord[]>();
const testLeases = new Map<string, TestLeaseRecord[]>();

function useFixtures(): boolean {
  return process.env.NODE_ENV === 'test';
}

function toListType(value: string): LandlordListingPayload['type'] {
  const normalized = value.toLowerCase();
  if (normalized.includes('studio')) return 'studio';
  if (normalized.includes('duplex')) return 'duplex';
  if (normalized.includes('sublet')) return 'sublet';
  if (normalized.includes('house')) return 'house';
  if (normalized.includes('room')) return 'room';
  return 'apartment';
}

function toDbListingType(value: LandlordListingPayload['type']): string {
  switch (value) {
    case 'apartment': return 'Single';
    case 'room': return 'Shared';
    case 'studio': return 'Single';
    case 'duplex': return 'Single';
    case 'sublet': return 'Sublet';
    case 'house': return 'Single';
    default: return 'Single';
  }
}

function toListingStatus(value?: string): LandlordListingPayload['status'] {
  const status = value?.toLowerCase();
  if (status === 'pending' || status === 'approved' || status === 'rejected' || status === 'suspended' || status === 'archived' || status === 'occupied') {
    return status;
  }
  if (status === 'available') return 'approved';
  if (status === 'maintenance') return 'suspended';
  return 'draft';
}

function toDbListingStatus(value: LandlordListingPayload['status']): string {
  switch (value) {
    case 'approved': return 'available';
    case 'suspended': return 'maintenance';
    case 'archived': return 'maintenance';
    default: return 'available';
  }
}

async function getAmenitiesForProperties(propertyIds: number[]): Promise<Map<number, string[]>> {
  if (propertyIds.length === 0) return new Map();

  const [rows] = await db.query<DbAmenityRow[]>(`SELECT pa.property_id, a.name
    FROM property_amenities pa
    JOIN amenities a ON a.id = pa.amenity_id
    WHERE pa.property_id IN (?)`, [propertyIds]);

  const map = new Map<number, string[]>();
  for (const row of rows) {
    const current = map.get(row.property_id) ?? [];
    current.push(row.name);
    map.set(row.property_id, current);
  }
  return map;
}

const normalizeListing = (row: DbPropertyRow, facilities: string[] = []): LandlordListingPayload & { id: string; createdAt: string; updatedAt: string } => ({
  id: String(row.id),
  title: row.title,
  description: row.description ?? '',
  type: toListType(row.type),
  priceBDT: Number(row.price),
  bedrooms: row.bedroom_count ?? undefined,
  roommateCapacity: row.roommate_capacity ?? undefined,
  parkingAvailable: String(row.parking ?? 'Not Available').toLowerCase() !== 'not available',
  facilities,
  address: {
    line1: row.address_street ?? row.address_area ?? row.address_city ?? 'UIU Area',
    area: row.address_area ?? undefined,
    city: row.address_city ?? 'Dhaka',
    district: row.address_area ?? row.address_city ?? 'Dhaka',
    latitude: 23.8148,
    longitude: 90.4256,
  },
  status: toListingStatus(row.status),
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

export interface LandlordRepository {
  getProfile(userId: string): Promise<LandlordProfile | null>;
  getMyListings(landlordId: string): Promise<LandlordListingPayload[]>;
  createListing(landlordId: string, payload: LandlordListingPayload): Promise<LandlordListingPayload & { id: string; createdAt: string; updatedAt: string }>;
  updateListing(landlordId: string, listingId: string, payload: Partial<LandlordListingPayload>): Promise<LandlordListingPayload & { id: string; createdAt: string; updatedAt: string }>;
  deleteListing(landlordId: string, listingId: string): Promise<boolean>;
  getApplications(landlordId: string): Promise<Array<{ id: string; propertyId: string; studentId: string; landlordId: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; createdAt: string }>>;
  reviewApplication(landlordId: string, applicationId: string, payload: ApplicationReviewPayload): Promise<{ id: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; reviewedAt: string }>;
  getLeases(landlordId: string): Promise<LandlordLeaseSummary[]>;
  getMaintenanceRequests(landlordId: string): Promise<Array<{ id: string; propertyId: string; studentId: string; landlordId: string; issue: string; priority: 'Low' | 'Medium' | 'High'; status: 'open' | 'in-progress' | 'resolved'; createdAt: string }>>;
  updateMaintenanceStatus(landlordId: string, requestId: string, payload: MaintenanceUpdatePayload): Promise<{ id: string; status: 'open' | 'in-progress' | 'resolved'; updatedAt: string }>;
}

export const landlordRepository: LandlordRepository = {
  async getProfile(userId: string): Promise<LandlordProfile | null> {
    if (useFixtures()) return null;
    const userNumericId = Number(userId);
    if (!Number.isFinite(userNumericId) || userNumericId <= 0) return null;

    const [rows] = await db.query<RowDataPacket[]>(`SELECT u.id, u.name, u.email, u.phone, u.is_verified, u.created_at, u.updated_at,
      COUNT(p.id) AS property_count
      FROM users u
      LEFT JOIN properties p ON p.landlord_id = u.id
      WHERE u.id = ? AND u.role = 'landlord'
      GROUP BY u.id`, [userNumericId]);

    const row = rows[0] as (RowDataPacket & { id: number; name: string; email: string; phone?: string | null; is_verified: number; property_count: number; created_at: Date; updated_at: Date }) | undefined;
    if (!row) return null;

    return {
      id: String(row.id),
      userId: String(row.id),
      name: row.name,
      email: row.email,
      phone: row.phone ?? undefined,
      companyName: undefined,
      propertyCount: Number(row.property_count ?? 0),
      isVerified: Boolean(row.is_verified),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  },

  async getMyListings(landlordId: string): Promise<LandlordListingPayload[]> {
    if (useFixtures()) {
      return (testListings.get(landlordId) ?? []).map((listing) => ({
        title: listing.title,
        description: listing.description,
        type: listing.type,
        priceBDT: listing.priceBDT,
        bedrooms: listing.bedrooms,
        roommateCapacity: listing.roommateCapacity,
        parkingAvailable: listing.parkingAvailable,
        facilities: listing.facilities,
        address: listing.address,
        status: listing.status,
      }));
    }

    const landlordNumericId = Number(landlordId);
    if (!Number.isFinite(landlordNumericId) || landlordNumericId <= 0) return [];

    const [rows] = await db.query<DbPropertyRow[]>(`SELECT p.*
      FROM properties p
      WHERE p.landlord_id = ?
      ORDER BY p.created_at DESC`, [landlordNumericId]);

    const propertyIds = rows.map((row) => row.id);
    const amenities = await getAmenitiesForProperties(propertyIds);

    return rows.map((row) => normalizeListing(row, amenities.get(row.id) ?? []));
  },

  async createListing(landlordId: string, payload: LandlordListingPayload): Promise<LandlordListingPayload & { id: string; createdAt: string; updatedAt: string }> {
    if (useFixtures()) {
      const list = testListings.get(landlordId) ?? [];
      const now = new Date().toISOString();
      const propertyCode = `UIU-${String(list.length + 1).padStart(4, '0')}`;
      const record: TestListingRecord = {
        ...payload,
        id: `LIST-${Date.now()}`,
        landlordId,
        propertyCode,
        createdAt: now,
        updatedAt: now,
      };
      list.unshift(record);
      testListings.set(landlordId, list);
      return {
        ...payload,
        id: record.id,
        createdAt: now,
        updatedAt: now,
      };
    }

    const landlordNumericId = Number(landlordId);
    if (!Number.isFinite(landlordNumericId) || landlordNumericId <= 0) {
      throw new AppError(400, 'INVALID_LANDLORD_ID', 'Landlord identifier is invalid');
    }

    const propertyCode = `UIU-${Date.now() % 9000 + 1000}`;
    const now = new Date();
    const [result] = await db.execute('INSERT INTO properties (property_code, landlord_id, title, description, type, price, distance_km, status, total_size_sqft, roommate_capacity, parking, bedroom_count, living_count, bathroom_count, kitchen_count, veranda_count, room_sizes_json, address_street, address_area, address_city, map_pin_x, map_pin_y, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
      propertyCode,
      landlordNumericId,
      payload.title,
      payload.description,
      toDbListingType(payload.type),
      payload.priceBDT,
      0.3,
      toDbListingStatus(payload.status),
      280,
      payload.roommateCapacity ?? 1,
      payload.parkingAvailable ? 'Available' : 'Not Available',
      payload.bedrooms ?? 1,
      0,
      payload.bedrooms ?? 1,
      1,
      0,
      JSON.stringify({}),
      payload.address.line1,
      payload.address.area ?? payload.address.city,
      payload.address.city,
      payload.address.latitude,
      payload.address.longitude,
      now,
      now,
    ]);
    const insertedId = Number((result as { insertId?: number }).insertId ?? 0);
    if (!insertedId) throw new AppError(500, 'LISTING_CREATE_FAILED', 'Failed to create listing');

    if (payload.facilities.length > 0) {
      for (const facility of payload.facilities) {
        const [facilityRow] = await db.query<RowDataPacket[]>('SELECT id FROM amenities WHERE LOWER(name) = LOWER(?) LIMIT 1', [facility]);
        let amenityId = Number((facilityRow as RowDataPacket[])[0]?.id ?? 0);
        if (!amenityId) {
          const [newRow] = await db.execute('INSERT INTO amenities (name) VALUES (?)', [facility]);
          amenityId = Number((newRow as { insertId?: number }).insertId ?? 0);
        }
        if (amenityId) {
          await db.execute('INSERT IGNORE INTO property_amenities (property_id, amenity_id) VALUES (?, ?)', [insertedId, amenityId]);
        }
      }
    }

    return {
      ...payload,
      id: String(insertedId),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  },

  async updateListing(landlordId: string, listingId: string, payload: Partial<LandlordListingPayload>): Promise<LandlordListingPayload & { id: string; createdAt: string; updatedAt: string }> {
    if (useFixtures()) {
      const list = testListings.get(landlordId) ?? [];
      const index = list.findIndex((listing) => listing.id === listingId);
      if (index === -1) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing does not exist');

      const current = list[index];
      const updated = { ...current, ...payload, updatedAt: new Date().toISOString() };
      list[index] = updated;
      testListings.set(landlordId, list);
      return {
        ...updated,
        id: updated.id,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    }

    const landlordNumericId = Number(landlordId);
    const numericListingId = Number(listingId);
    if (!Number.isFinite(landlordNumericId) || landlordNumericId <= 0 || !Number.isFinite(numericListingId)) {
      throw new AppError(400, 'INVALID_LISTING', 'Listing identifier is invalid');
    }

    const [existing] = await db.query<RowDataPacket[]>('SELECT id, landlord_id FROM properties WHERE id = ? AND landlord_id = ? LIMIT 1', [numericListingId, landlordNumericId]);
    if (!existing[0]) throw new AppError(403, 'FORBIDDEN', 'You do not own this listing');

    const updates: string[] = [];
    const values: Array<string | number | null> = [];
    if (payload.title !== undefined) { updates.push('title = ?'); values.push(payload.title); }
    if (payload.description !== undefined) { updates.push('description = ?'); values.push(payload.description); }
    if (payload.type !== undefined) { updates.push('type = ?'); values.push(toDbListingType(payload.type)); }
    if (payload.priceBDT !== undefined) { updates.push('price = ?'); values.push(payload.priceBDT); }
    if (payload.status !== undefined) { updates.push('status = ?'); values.push(toDbListingStatus(payload.status)); }
    if (payload.bedrooms !== undefined) { updates.push('bedroom_count = ?'); values.push(payload.bedrooms); }
    if (payload.roommateCapacity !== undefined) { updates.push('roommate_capacity = ?'); values.push(payload.roommateCapacity); }
    if (payload.parkingAvailable !== undefined) { updates.push('parking = ?'); values.push(payload.parkingAvailable ? 'Available' : 'Not Available'); }
    if (payload.address !== undefined) {
      updates.push('address_street = ?'); values.push(payload.address.line1);
      updates.push('address_area = ?'); values.push(payload.address.area ?? payload.address.city);
      updates.push('address_city = ?'); values.push(payload.address.city);
      updates.push('map_pin_x = ?'); values.push(payload.address.latitude);
      updates.push('map_pin_y = ?'); values.push(payload.address.longitude);
    }
    if (updates.length === 0) {
      const [rows] = await db.query<DbPropertyRow[]>('SELECT * FROM properties WHERE id = ? AND landlord_id = ? LIMIT 1', [numericListingId, landlordNumericId]);
      const row = rows[0];
      if (!row) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing does not exist');

      return normalizeListing(row, await getAmenitiesForProperties([row.id]).then((facilityMap) => facilityMap.get(row.id) ?? []));
    }

    values.push(numericListingId, landlordNumericId);
    await db.execute(`UPDATE properties SET ${updates.join(', ')} WHERE id = ? AND landlord_id = ?`, values);

    const [rows] = await db.query<DbPropertyRow[]>('SELECT * FROM properties WHERE id = ? AND landlord_id = ? LIMIT 1', [numericListingId, landlordNumericId]);
    const row = rows[0];
    if (!row) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing does not exist');

    return normalizeListing(row, await getAmenitiesForProperties([row.id]).then((facilityMap) => facilityMap.get(row.id) ?? []));
  },

  async deleteListing(landlordId: string, listingId: string): Promise<boolean> {
    if (useFixtures()) {
      const list = testListings.get(landlordId) ?? [];
      const next = list.filter((listing) => listing.id !== listingId);
      if (next.length === list.length) return false;
      testListings.set(landlordId, next);
      return true;
    }

    const landlordNumericId = Number(landlordId);
    const numericListingId = Number(listingId);
    if (!Number.isFinite(landlordNumericId) || landlordNumericId <= 0 || !Number.isFinite(numericListingId)) {
      return false;
    }

    const [result] = await db.execute('DELETE FROM properties WHERE id = ? AND landlord_id = ?', [numericListingId, landlordNumericId]);
    return (result as { affectedRows?: number }).affectedRows !== undefined && (result as { affectedRows: number }).affectedRows > 0;
  },

  async getApplications(landlordId: string): Promise<Array<{ id: string; propertyId: string; studentId: string; landlordId: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; createdAt: string }>> {
    if (useFixtures()) {
      const owned = new Set((testListings.get(landlordId) ?? []).map((listing) => listing.id));
      const entries: Array<{ id: string; propertyId: string; studentId: string; landlordId: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; createdAt: string }> = [];
      for (const list of testApplications.values()) {
        for (const application of list) {
          if (owned.has(application.propertyId)) {
            entries.push({
              id: application.id,
              propertyId: application.propertyId,
              studentId: application.studentId,
              landlordId: landlordId,
              status: application.status,
              createdAt: application.createdAt,
            });
          }
        }
      }
      return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    const landlordNumericId = Number(landlordId);
    if (!Number.isFinite(landlordNumericId) || landlordNumericId <= 0) return [];

    const [rows] = await db.query<DbApplicationRow[]>(`SELECT a.id, a.property_id, a.student_id, a.landlord_id, a.status, a.created_at
      FROM applications a
      JOIN properties p ON p.id = a.property_id
      WHERE p.landlord_id = ?
      ORDER BY a.created_at DESC`, [landlordNumericId]);

    return rows.map((row) => ({
      id: String(row.id),
      propertyId: String(row.property_id),
      studentId: String(row.student_id),
      landlordId: String(row.landlord_id),
      status: row.status,
      createdAt: row.created_at.toISOString(),
    }));
  },

  async reviewApplication(landlordId: string, applicationId: string, payload: ApplicationReviewPayload): Promise<{ id: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; reviewedAt: string }> {
    if (useFixtures()) {
      const owned = new Set((testListings.get(landlordId) ?? []).map((listing) => listing.id));
      for (const list of testApplications.values()) {
        const index = list.findIndex((application) => application.id === applicationId && owned.has(application.propertyId));
        if (index !== -1) {
          const current = list[index];
          const status = payload.status === 'under-review' || payload.status === 'accepted' || payload.status === 'rejected' || payload.status === 'cancelled' ? payload.status : current.status;
          list[index] = { ...current, status };
          return { id: current.id, status, reviewedAt: new Date().toISOString() };
        }
      }
      throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Application does not exist for your listings');
    }

    const landlordNumericId = Number(landlordId);
    const applicationNumericId = Number(applicationId);
    if (!Number.isFinite(landlordNumericId) || landlordNumericId <= 0 || !Number.isFinite(applicationNumericId)) {
      throw new AppError(400, 'INVALID_APPLICATION', 'Application identifier is invalid');
    }

    const [existing] = await db.query<RowDataPacket[]>(`SELECT a.id, a.status, p.landlord_id
      FROM applications a
      JOIN properties p ON p.id = a.property_id
      WHERE a.id = ? AND p.landlord_id = ? LIMIT 1`, [applicationNumericId, landlordNumericId]);
    if (!existing[0]) throw new AppError(403, 'FORBIDDEN', 'You do not own this application');

    const status = payload.status === 'accepted' || payload.status === 'rejected' || payload.status === 'cancelled' || payload.status === 'under-review' ? payload.status : existing[0].status;
    await db.execute('UPDATE applications SET status = ?, updated_at = NOW() WHERE id = ?', [status, applicationNumericId]);
    return { id: String(applicationNumericId), status, reviewedAt: new Date().toISOString() };
  },

  async getLeases(landlordId: string): Promise<LandlordLeaseSummary[]> {
    if (useFixtures()) {
      return (testLeases.get(landlordId) ?? []).map((lease) => ({
        id: lease.id,
        propertyId: lease.propertyId,
        studentId: lease.studentId,
        landlordId: lease.landlordId,
        status: lease.status,
        startDate: lease.startDate,
        endDate: lease.endDate,
        monthlyRent: lease.monthlyRent,
        createdAt: lease.createdAt,
        updatedAt: lease.updatedAt,
      }));
    }

    const landlordNumericId = Number(landlordId);
    if (!Number.isFinite(landlordNumericId) || landlordNumericId <= 0) return [];

    const [rows] = await db.query<DbLeaseRow[]>(`SELECT l.*
      FROM leases l
      WHERE l.landlord_id = ?
      ORDER BY l.updated_at DESC`, [landlordNumericId]);

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

  async getMaintenanceRequests(landlordId: string): Promise<Array<{ id: string; propertyId: string; studentId: string; landlordId: string; issue: string; priority: 'Low' | 'Medium' | 'High'; status: 'open' | 'in-progress' | 'resolved'; createdAt: string }>> {
    if (useFixtures()) {
      const entries: Array<{ id: string; propertyId: string; studentId: string; landlordId: string; issue: string; priority: 'Low' | 'Medium' | 'High'; status: 'open' | 'in-progress' | 'resolved'; createdAt: string }> = [];
      for (const list of testMaintenanceRequests.values()) {
        for (const request of list) {
          if (request.landlordId === landlordId) {
            entries.push({
              id: request.id,
              propertyId: request.propertyId,
              studentId: request.studentId,
              landlordId: request.landlordId,
              issue: request.issue,
              priority: request.priority,
              status: request.status,
              createdAt: request.createdAt,
            });
          }
        }
      }
      return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    const landlordNumericId = Number(landlordId);
    if (!Number.isFinite(landlordNumericId) || landlordNumericId <= 0) return [];

    const [rows] = await db.query<DbMaintenanceRow[]>(`SELECT *
      FROM maintenance_requests
      WHERE landlord_id = ?
      ORDER BY created_at DESC`, [landlordNumericId]);

    return rows.map((row) => ({
      id: String(row.id),
      propertyId: String(row.property_id),
      studentId: String(row.student_id),
      landlordId: String(row.landlord_id),
      issue: row.issue,
      priority: row.priority,
      status: row.status,
      createdAt: row.created_at.toISOString(),
    }));
  },

  async updateMaintenanceStatus(landlordId: string, requestId: string, payload: MaintenanceUpdatePayload): Promise<{ id: string; status: 'open' | 'in-progress' | 'resolved'; updatedAt: string }> {
    if (useFixtures()) {
      for (const list of testMaintenanceRequests.values()) {
        const index = list.findIndex((request) => request.id === requestId && request.landlordId === landlordId);
        if (index !== -1) {
          const current = list[index];
          const status = payload.status === 'open' || payload.status === 'in-progress' || payload.status === 'resolved' ? payload.status : current.status;
          list[index] = { ...current, status, updatedAt: new Date().toISOString() };
          return { id: current.id, status, updatedAt: list[index].updatedAt };
        }
      }
      throw new AppError(404, 'MAINTENANCE_REQUEST_NOT_FOUND', 'Maintenance request does not exist for your properties');
    }

    const landlordNumericId = Number(landlordId);
    const numericRequestId = Number(requestId);
    if (!Number.isFinite(landlordNumericId) || landlordNumericId <= 0 || !Number.isFinite(numericRequestId)) {
      throw new AppError(400, 'INVALID_MAINTENANCE_REQUEST', 'Maintenance request identifier is invalid');
    }

    const [existing] = await db.query<RowDataPacket[]>(`SELECT id FROM maintenance_requests WHERE id = ? AND landlord_id = ? LIMIT 1`, [numericRequestId, landlordNumericId]);
    if (!existing[0]) throw new AppError(403, 'FORBIDDEN', 'You do not own this maintenance request');

    const status = payload.status === 'open' || payload.status === 'in-progress' || payload.status === 'resolved' ? payload.status : 'open';
    await db.execute('UPDATE maintenance_requests SET status = ?, updated_at = NOW() WHERE id = ? AND landlord_id = ?', [status, numericRequestId, landlordNumericId]);
    return { id: String(numericRequestId), status, updatedAt: new Date().toISOString() };
  },
};

export function seedFixtureLandlordState(landlordId: string, listingId: string, testApplicationId?: string): void {
  const listings = testListings.get(landlordId) ?? [];
  if (!listings.some((listing) => listing.id === listingId)) {
    listings.push({
      id: listingId,
      landlordId,
      propertyCode: 'UIU-2001',
      title: 'Fixture landlord listing',
      description: 'Seeded fixture listing for landlord workflow tests.',
      type: 'apartment',
      priceBDT: 4200,
      bedrooms: 1,
      roommateCapacity: 1,
      parkingAvailable: false,
      facilities: ['WiFi'],
      address: {
        line1: 'Seed Street',
        area: 'UIU Campus',
        city: 'Dhaka',
        district: 'Dhaka',
        latitude: 23.81,
        longitude: 90.42,
      },
      status: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    testListings.set(landlordId, listings);
  }

  if (testApplicationId) {
    const applications = testApplications.get(landlordId) ?? [];
    const nextApplications = applications.filter((application) => application.id !== testApplicationId);
    nextApplications.push({
      id: testApplicationId,
      propertyId: listingId,
      studentId: 'student-fixture',
      landlordId,
      status: 'under-review',
      createdAt: new Date().toISOString(),
    });
    testApplications.set(landlordId, nextApplications);
  }
}

export function seedFixtureMaintenanceRequest(landlordId: string, requestId: string): void {
  const requests = testMaintenanceRequests.get(landlordId) ?? [];
  if (!requests.some((request) => request.id === requestId)) {
    requests.push({
      id: requestId,
      propertyId: 'LIST-fixture',
      studentId: 'student-fixture',
      landlordId,
      issue: 'Fixture maintenance issue',
      priority: 'High',
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    testMaintenanceRequests.set(landlordId, requests);
  }
}

