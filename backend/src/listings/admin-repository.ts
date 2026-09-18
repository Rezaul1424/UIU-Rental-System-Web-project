import mysql from 'mysql2/promise';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import type { ListingStatusType } from '../contracts/api.js';

export type ModerationStatus = Exclude<ListingStatusType, 'occupied'>;
export type AvailabilityStatus = 'available' | 'occupied' | 'maintenance';

export type AdminListing = {
  id: string;
  propertyId?: number;
  propertyCode: string;
  title: string;
  landlordId: string;
  landlordName: string;
  categoryId?: number;
  categoryName?: string;
  moderationStatus: ModerationStatus;
  availabilityStatus: AvailabilityStatus;
  priceBDT: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminCategory = {
  id: string;
  name: string;
  createdAt: string;
};

const persistentAdmin = process.env.NODE_ENV !== 'test';
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uiu_rental_system',
  port: Number(process.env.DB_PORT || 3306),
  connectionLimit: 10,
});

let fixtureListings: AdminListing[] = [
  {
    id: 'UIU-1001',
    propertyCode: 'UIU-1001',
    title: 'Studio near Gate 3',
    landlordId: 'landlord-1',
    landlordName: 'Rahman Faruk',
    moderationStatus: 'approved',
    availabilityStatus: 'available',
    priceBDT: 4200,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'UIU-1002',
    propertyCode: 'UIU-1002',
    title: 'Shared Mess - South Campus',
    landlordId: 'landlord-2',
    landlordName: 'Nusrat Jahan',
    moderationStatus: 'pending',
    availabilityStatus: 'available',
    priceBDT: 2800,
    createdAt: '2026-09-02T00:00:00.000Z',
    updatedAt: '2026-09-02T00:00:00.000Z',
  },
];

let fixtureCategories: AdminCategory[] = [
  { id: '1', name: 'Apartment', createdAt: '2026-09-01T00:00:00.000Z' },
  { id: '2', name: 'Room', createdAt: '2026-09-01T00:00:00.000Z' },
  { id: '3', name: 'Mess', createdAt: '2026-09-01T00:00:00.000Z' },
  { id: '4', name: 'Sublet', createdAt: '2026-09-01T00:00:00.000Z' },
];

function toDate(value: Date | string): string {
  return new Date(value).toISOString();
}

export async function listAdminListings(options: {
  page: number;
  limit: number;
  q?: string;
  moderationStatus?: ModerationStatus;
  availabilityStatus?: AvailabilityStatus;
  categoryId?: number;
}) {
  if (!persistentAdmin) {
    const query = options.q?.toLowerCase();
    const filtered = fixtureListings.filter((listing) =>
      (!query || `${listing.title} ${listing.propertyCode} ${listing.landlordName}`.toLowerCase().includes(query)) &&
      (!options.moderationStatus || listing.moderationStatus === options.moderationStatus) &&
      (!options.availabilityStatus || listing.availabilityStatus === options.availabilityStatus) &&
      (!options.categoryId || listing.categoryId === options.categoryId),
    );
    const start = (options.page - 1) * options.limit;
    return { data: filtered.slice(start, start + options.limit), totalItems: filtered.length };
  }

  const clauses: string[] = [];
  const params: unknown[] = [];
  if (options.q) {
    clauses.push('(p.title LIKE CONCAT(\'%\', ?, \'%\') OR p.property_code LIKE CONCAT(\'%\', ?, \'%\') OR u.name LIKE CONCAT(\'%\', ?, \'%\'))');
    params.push(options.q, options.q, options.q);
  }
  if (options.moderationStatus) { clauses.push('p.moderation_status = ?'); params.push(options.moderationStatus); }
  if (options.availabilityStatus) { clauses.push('p.status = ?'); params.push(options.availabilityStatus); }
  if (options.categoryId) { clauses.push('p.category_id = ?'); params.push(options.categoryId); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [countRows] = await db.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM properties p JOIN users u ON u.id = p.landlord_id ${where}`, params);
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT p.id, p.property_code, p.title, p.landlord_id, p.price, p.status, p.moderation_status,
      p.category_id, c.name AS category_name, u.name AS landlord_name, p.created_at, p.updated_at
     FROM properties p JOIN users u ON u.id = p.landlord_id LEFT JOIN listing_categories c ON c.id = p.category_id
     ${where} ORDER BY p.updated_at DESC, p.id ASC LIMIT ? OFFSET ?`,
    [...params, options.limit, (options.page - 1) * options.limit],
  );
  return { data: rows.map(mapRow), totalItems: Number(countRows[0]?.total ?? 0) };
}

export async function getAdminListing(identifier: string): Promise<AdminListing | undefined> {
  if (!persistentAdmin) return fixtureListings.find((listing) => listing.id === identifier || listing.propertyCode === identifier);
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT p.id, p.property_code, p.title, p.landlord_id, p.price, p.status, p.moderation_status,
      p.category_id, c.name AS category_name, u.name AS landlord_name, p.created_at, p.updated_at
     FROM properties p JOIN users u ON u.id = p.landlord_id LEFT JOIN listing_categories c ON c.id = p.category_id
     WHERE p.property_code = ? OR CAST(p.id AS CHAR) = ? LIMIT 1`,
    [identifier, identifier],
  );
  return rows[0] ? mapRow(rows[0]) : undefined;
}

export async function updateAdminListingStatus(identifier: string, status: ModerationStatus): Promise<{ listing: AdminListing; previousStatus: ModerationStatus } | undefined> {
  const current = await getAdminListing(identifier);
  if (!current) return undefined;
  const previousStatus = current.moderationStatus;
  if (persistentAdmin) {
    await db.execute('UPDATE properties SET moderation_status = ? WHERE property_code = ? OR id = ?', [status, identifier, identifier]);
  } else {
    current.moderationStatus = status;
    current.updatedAt = new Date().toISOString();
  }
  const updated = await getAdminListing(identifier);
  return updated ? { listing: updated, previousStatus } : undefined;
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  if (!persistentAdmin) return [...fixtureCategories];
  const [rows] = await db.query<RowDataPacket[]>('SELECT id, name, created_at FROM listing_categories ORDER BY name ASC');
  return rows.map((row) => ({ id: String(row.id), name: row.name as string, createdAt: toDate(row.created_at as Date) }));
}

export async function createAdminCategory(name: string): Promise<AdminCategory> {
  if (!persistentAdmin) {
    const category = { id: String(fixtureCategories.length + 1), name, createdAt: new Date().toISOString() };
    fixtureCategories.push(category);
    return category;
  }
  const [result] = await db.execute<ResultSetHeader>('INSERT INTO listing_categories (name) VALUES (?)', [name]);
  const [rows] = await db.query<RowDataPacket[]>('SELECT id, name, created_at FROM listing_categories WHERE id = ?', [result.insertId]);
  const row = rows[0];
  return { id: String(row.id), name: row.name as string, createdAt: toDate(row.created_at as Date) };
}

export async function updateAdminCategory(id: string, name: string): Promise<AdminCategory | undefined> {
  if (!persistentAdmin) {
    const category = fixtureCategories.find((item) => item.id === id);
    if (!category) return undefined;
    category.name = name;
    return category;
  }
  await db.execute('UPDATE listing_categories SET name = ? WHERE id = ?', [name, id]);
  const [rows] = await db.query<RowDataPacket[]>('SELECT id, name, created_at FROM listing_categories WHERE id = ?', [id]);
  const row = rows[0];
  return row ? { id: String(row.id), name: row.name as string, createdAt: toDate(row.created_at as Date) } : undefined;
}

export async function deleteAdminCategory(id: string): Promise<boolean> {
  if (!persistentAdmin) {
    const originalLength = fixtureCategories.length;
    fixtureCategories = fixtureCategories.filter((item) => item.id !== id);
    return fixtureCategories.length !== originalLength;
  }
  const [result] = await db.execute<ResultSetHeader>('DELETE FROM listing_categories WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export function resetAdminListingFixtures(): void {
  fixtureListings = fixtureListings.map((listing) => ({ ...listing }));
}

function mapRow(row: RowDataPacket): AdminListing {
  return {
    id: String(row.property_code),
    propertyId: Number(row.id),
    propertyCode: String(row.property_code),
    title: String(row.title),
    landlordId: String(row.landlord_id),
    landlordName: String(row.landlord_name),
    categoryId: row.category_id == null ? undefined : Number(row.category_id),
    categoryName: row.category_name == null ? undefined : String(row.category_name),
    moderationStatus: row.moderation_status as ModerationStatus,
    availabilityStatus: row.status as AvailabilityStatus,
    priceBDT: Math.round(Number(row.price)),
    createdAt: toDate(row.created_at as Date),
    updatedAt: toDate(row.updated_at as Date),
  };
}
