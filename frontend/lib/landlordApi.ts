import type { Listing } from '../types';
import { api } from './api';

const normalizeListingId = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const match = value.match(/\d+/);
    return match ? Number(match[0]) : 0;
  }
  return 0;
};

const normalizeType = (type: string | undefined) => {
  const value = (type || 'room').toLowerCase();
  if (value.includes('studio')) return 'Single';
  if (value.includes('mess')) return 'Mess';
  if (value.includes('sublet')) return 'Sublet';
  if (value.includes('shared')) return 'Shared';
  if (value.includes('apartment')) return 'Single';
  return 'Single';
};

const toListing = (item: any): Listing => ({
  id: normalizeListingId(item.id ?? item.propertyId ?? item.listingId),
  title: item.title || 'Untitled Listing',
  landlord: item.landlordName || item.landlord || 'Landlord',
  type: normalizeType(item.type),
  distance: item.distance || '0.5 km',
  price: Number(item.priceBDT ?? item.price ?? 0),
  status: item.status || 'available',
  facilities: Array.isArray(item.facilities) ? item.facilities : [],
  image: item.image || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=380&fit=crop&auto=format',
  propertyId: item.propertyId || item.id || 'N/A',
  rooms: item.rooms || { bedroom: 1, living: 0, bathroom: 1, kitchen: 1, veranda: 0 },
  totalSize: item.totalSize || 0,
  roommateCapacity: item.roommateCapacity || 1,
  parking: item.parking || 'Not Available',
});

export type LandlordProfile = {
  id: string;
  userId: string;
  name: string;
  email: string;
  companyName?: string;
  propertyCount: number;
  isVerified: boolean;
};

export const getProfile = () => api.get<LandlordProfile>('/api/v1/landlord/profile');

export const getMyListings = async (): Promise<Listing[]> => {
  const payload = await api.get<Array<any>>('/api/v1/landlord/listings');
  if (!Array.isArray(payload)) return [];
  return payload.map(toListing);
};

export const createListing = (payload: Record<string, unknown>) => api.post('/api/v1/landlord/listings', payload);
export const updateListing = (listingId: string | number, payload: Record<string, unknown>) => api.patch(`/api/v1/landlord/listings/${listingId}`, payload);

export type LandlordApplication = {
  id: string;
  propertyId: string;
  studentId: string;
  landlordId: string;
  status: 'under-review' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
  message?: string;
  moveInDate?: string;
  employment?: string;
};

export const getApplications = async (): Promise<LandlordApplication[]> => {
  const payload = await api.get<Array<any>>('/api/v1/landlord/applications');
  if (!Array.isArray(payload)) return [];
  return payload.map((application) => ({
    id: application.id,
    propertyId: application.propertyId,
    studentId: application.studentId,
    landlordId: application.landlordId,
    status: application.status ?? 'under-review',
    createdAt: application.createdAt,
    message: application.message,
    moveInDate: application.moveInDate,
    employment: application.employment,
  }));
};

export const reviewApplication = async (applicationId: string | number, payload: { status: string; decisionNotes?: string }) => api.patch(`/api/v1/landlord/applications/${applicationId}/status`, payload);
