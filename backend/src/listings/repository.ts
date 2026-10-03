import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';
import type { Listing, ListingTypeType } from '../contracts/api.js';
import { databasePropertyTypeToApiType } from '../contracts/api.js';

export type ListingSearch = {
  page: number;
  limit: number;
  q?: string;
  type?: ListingTypeType;
  maxPrice?: number;
  maxDistance?: number;
  facilities: string[];
  bedrooms?: number;
  capacity?: number;
  sortBy: 'relevance' | 'price' | 'distance' | 'recency';
  sortDirection: 'asc' | 'desc';
};

type PropertyRow = RowDataPacket & {
  id: number;
  property_code: string;
  title: string;
  description: string | null;
  type: keyof typeof databasePropertyTypeToApiType;
  price: number | string;
  distance_km: number | string;
  total_size_sqft: number | null;
  roommate_capacity: number | null;
  parking: string;
  bedroom_count: number | null;
  living_count: number | null;
  bathroom_count: number | null;
  kitchen_count: number | null;
  veranda_count: number | null;
  room_sizes_json: Record<string, number> | null;
  address_street: string | null;
  address_area: string | null;
  address_city: string;
  address_postal: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  landlord_name: string;
  created_at: Date;
  updated_at: Date;
  moderation_status: 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended' | 'archived';
};

type ImageRow = RowDataPacket & {
  property_id: number;
  id: number;
  image_url: string;
  is_primary: number;
};

type AmenityRow = RowDataPacket & {
  property_id: number;
  name: string;
};

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uiu_rental_system',
  port: Number(process.env.DB_PORT || 3306),
  connectionLimit: 10,
});

const testListings: Listing[] = [
  {
    id: 'UIU-1001', title: 'Studio near Gate 3', landlordName: 'Rahman Faruk', type: 'studio',
    description: 'Cozy modern studio apartment walking distance to UIU campus Gate 3.', priceBDT: 4200,
    currency: 'BDT', status: 'approved', bedrooms: 1, rooms: 3, roomSizesSqFt: [120, 45, 60],
    totalSizeSqFt: 280, roommateCapacity: 1, parkingAvailable: false, facilities: ['AC', 'WiFi', 'Laundry'],
    images: [{ id: '1', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=380&fit=crop&auto=format', isPrimary: true }],
    address: { line1: 'Road 4, House 12', area: 'Gate 3 Area, North Campus', city: 'Dhaka', district: 'Dhaka', latitude: 23.8148, longitude: 90.4256 },
    distanceKm: 0.3, createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'UIU-1002', title: 'Shared Mess - South Campus', landlordName: 'Nusrat Jahan', type: 'apartment',
    description: 'Spacious bachelor mess with meals and CCTV surveillance.', priceBDT: 2800,
    currency: 'BDT', status: 'approved', bedrooms: 2, rooms: 4, roomSizesSqFt: [100, 150, 40, 70],
    totalSizeSqFt: 460, roommateCapacity: 4, parkingAvailable: false, facilities: ['Meals', 'WiFi', 'CCTV'],
    images: [{ id: '2', url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&h=380&fit=crop&auto=format', isPrimary: true }],
    address: { line1: 'South Avenue, Block B', area: 'Gate 1 Area, South Campus', city: 'Dhaka', district: 'Dhaka', latitude: 23.8125, longitude: 90.4217 },
    distanceKm: 0.6, createdAt: '2026-09-02T00:00:00.000Z', updatedAt: '2026-09-02T00:00:00.000Z',
  },
];

function useFixtures(): boolean {
  return process.env.NODE_ENV === 'test';
}

function pageMeta(page: number, limit: number, totalItems: number) {
  const totalPages = Math.ceil(totalItems / limit);
  return { page, limit, totalItems, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 && totalPages > 0 };
}

function sortFixtures(items: Listing[], search: ListingSearch): Listing[] {
  return [...items].sort((left, right) => {
    const direction = search.sortDirection === 'asc' ? 1 : -1;
    if (search.sortBy === 'price') return (left.priceBDT - right.priceBDT) * direction;
    if (search.sortBy === 'distance') return ((left.distanceKm ?? 0) - (right.distanceKm ?? 0)) * direction;
    if (search.sortBy === 'recency') return (left.createdAt.localeCompare(right.createdAt)) * direction;
    return left.id.localeCompare(right.id) * direction;
  });
}

function filterFixtures(search: ListingSearch): Listing[] {
  const query = search.q?.toLowerCase();
  return testListings.filter((listing) => {
    if (query && !`${listing.title} ${listing.description} ${listing.address.area ?? ''}`.toLowerCase().includes(query)) return false;
    if (search.type && listing.type !== search.type) return false;
    if (search.maxPrice !== undefined && listing.priceBDT > search.maxPrice) return false;
    if (search.maxDistance !== undefined && (listing.distanceKm ?? Infinity) > search.maxDistance) return false;
    if (search.bedrooms !== undefined && (listing.bedrooms ?? 0) < search.bedrooms) return false;
    if (search.capacity !== undefined && (listing.roommateCapacity ?? 0) < search.capacity) return false;
    if (search.facilities.some((facility) => !listing.facilities.some((value) => value.toLowerCase() === facility.toLowerCase()))) return false;
    return true;
  });
}

function mapListing(row: PropertyRow, images: ImageRow[], amenities: AmenityRow[]): Listing {
  const roomSizes = row.room_sizes_json ?? {};
  const addressLine = row.address_street ?? row.address_area ?? row.address_city;
  return {
    id: row.property_code,
    title: row.title,
    landlordName: row.landlord_name,
    type: databasePropertyTypeToApiType[row.type],
    description: row.description ?? 'Rental property near UIU.',
    priceBDT: Math.round(Number(row.price)),
    currency: 'BDT',
    status: row.moderation_status,
    bedrooms: row.bedroom_count ?? undefined,
    rooms: (row.bedroom_count ?? 0) + (row.living_count ?? 0) + (row.bathroom_count ?? 0) + (row.kitchen_count ?? 0) + (row.veranda_count ?? 0),
    roomSizesSqFt: Object.values(roomSizes).map(Number).filter((value) => value > 0),
    totalSizeSqFt: row.total_size_sqft ?? undefined,
    roommateCapacity: row.roommate_capacity ?? undefined,
    parkingAvailable: row.parking.toLowerCase() !== 'not available',
    facilities: amenities.filter((amenity) => amenity.property_id === row.id).map((amenity) => amenity.name),
    images: images.filter((image) => image.property_id === row.id).map((image) => ({ id: String(image.id), url: image.image_url, isPrimary: Boolean(image.is_primary) })),
    address: {
      line1: addressLine,
      area: row.address_area ?? undefined,
      city: row.address_city,
      district: row.address_area ?? row.address_city,
      latitude: Number(row.latitude ?? 23.8148),
      longitude: Number(row.longitude ?? 90.4256),
    },
    distanceKm: Number(row.distance_km),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function buildWhere(search: ListingSearch): { sql: string; params: unknown[] } {
  const clauses = ["p.status = 'available'", "p.moderation_status = 'approved'"];
  const params: unknown[] = [];
  if (search.q) {
    clauses.push('(p.title LIKE CONCAT(\'%\', ?, \'%\') OR p.description LIKE CONCAT(\'%\', ?, \'%\') OR p.address_area LIKE CONCAT(\'%\', ?, \'%\'))');
    params.push(search.q, search.q, search.q);
  }
  if (search.type) {
    const dbType = Object.entries(databasePropertyTypeToApiType).find(([, value]) => value === search.type)?.[0];
    if (dbType) { clauses.push('p.type = ?'); params.push(dbType); }
  }
  if (search.maxPrice !== undefined) { clauses.push('p.price <= ?'); params.push(search.maxPrice); }
  if (search.maxDistance !== undefined) { clauses.push('p.distance_km <= ?'); params.push(search.maxDistance); }
  if (search.bedrooms !== undefined) { clauses.push('p.bedroom_count >= ?'); params.push(search.bedrooms); }
  if (search.capacity !== undefined) { clauses.push('p.roommate_capacity >= ?'); params.push(search.capacity); }
  for (const facility of search.facilities) {
    clauses.push('EXISTS (SELECT 1 FROM property_amenities pfa JOIN amenities fa ON fa.id = pfa.amenity_id WHERE pfa.property_id = p.id AND LOWER(fa.name) = LOWER(?))');
    params.push(facility);
  }
  return { sql: clauses.join(' AND '), params };
}

const sortColumns = { price: 'p.price', distance: 'p.distance_km', recency: 'p.created_at', relevance: 'p.created_at' } as const;

export async function searchPublicListings(search: ListingSearch) {
  if (useFixtures()) {
    const filtered = sortFixtures(filterFixtures(search), search);
    const start = (search.page - 1) * search.limit;
    return { data: filtered.slice(start, start + search.limit), meta: pageMeta(search.page, search.limit, filtered.length) };
  }

  const where = buildWhere(search);
  const [countRows] = await db.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM properties p WHERE ${where.sql}`, where.params);
  const total = Number(countRows[0]?.total ?? 0);
  const [rows] = await db.query<PropertyRow[]>(`SELECT p.*, u.name AS landlord_name, a.latitude, a.longitude FROM properties p JOIN users u ON u.id = p.landlord_id LEFT JOIN addresses a ON a.property_id = p.id WHERE ${where.sql} ORDER BY ${sortColumns[search.sortBy]} ${search.sortDirection.toUpperCase()}, p.id ASC LIMIT ? OFFSET ?`, [...where.params, search.limit, (search.page - 1) * search.limit]);
  const [images] = await db.query<ImageRow[]>('SELECT property_id, id, image_url, is_primary FROM property_images WHERE property_id IN (?)', [rows.map((row) => row.id)]);
  const [amenities] = await db.query<AmenityRow[]>('SELECT pa.property_id, a.name FROM property_amenities pa JOIN amenities a ON a.id = pa.amenity_id WHERE pa.property_id IN (?)', [rows.map((row) => row.id)]);
  return { data: rows.map((row) => mapListing(row, images, amenities)), meta: pageMeta(search.page, search.limit, total) };
}

export async function getPublicListing(identifier: string): Promise<Listing | undefined> {
  if (useFixtures()) return testListings.find((listing) => listing.id === identifier);
  const [rows] = await db.query<PropertyRow[]>('SELECT p.*, u.name AS landlord_name, a.latitude, a.longitude FROM properties p JOIN users u ON u.id = p.landlord_id LEFT JOIN addresses a ON a.property_id = p.id WHERE p.status = \'available\' AND p.moderation_status = \'approved\' AND (p.property_code = ? OR CAST(p.id AS CHAR) = ?) LIMIT 1', [identifier, identifier]);
  const row = rows[0];
  if (!row) return undefined;
  const [images] = await db.query<ImageRow[]>('SELECT property_id, id, image_url, is_primary FROM property_images WHERE property_id = ?', [row.id]);
  const [amenities] = await db.query<AmenityRow[]>('SELECT pa.property_id, a.name FROM property_amenities pa JOIN amenities a ON a.id = pa.amenity_id WHERE pa.property_id = ?', [row.id]);
  return mapListing(row, images, amenities);
}
