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

export type LandlordLeaseSummary = {
  id: string;
  propertyId: string;
  studentId: string;
  landlordId: string;
  status: 'pending' | 'active' | 'ended' | 'terminated';
  startDate?: string;
  endDate?: string;
  monthlyRent?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type LandlordMaintenanceRequest = {
  id: string;
  propertyId: string;
  studentId: string;
  landlordId: string;
  issue: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'open' | 'in-progress' | 'resolved';
  category?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const getApplications = async (): Promise<LandlordApplication[]> => {
  const payload = await api.get<Array<any> | { data?: Array<any> }>('/api/v1/landlord/applications');
  const applications = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  return applications.map((application) => ({
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

export const getLeases = async (): Promise<LandlordLeaseSummary[]> => {
  const payload = await api.get<Array<any> | { data?: Array<any> }>('/api/v1/landlord/leases');
  const leases = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

  return leases.map((lease) => ({
    id: String(lease.id ?? lease.leaseId ?? ''),
    propertyId: String(lease.propertyId ?? lease.property_id ?? lease.listingId ?? ''),
    studentId: String(lease.studentId ?? lease.student_id ?? ''),
    landlordId: String(lease.landlordId ?? lease.landlord_id ?? ''),
    status: ['pending', 'active', 'ended', 'terminated'].includes(String(lease.status)) ? lease.status : 'active',
    startDate: lease.startDate ?? lease.start_date,
    endDate: lease.endDate ?? lease.end_date,
    monthlyRent: Number(lease.monthlyRent ?? lease.monthly_rent ?? 0),
    createdAt: lease.createdAt ?? lease.created_at,
    updatedAt: lease.updatedAt ?? lease.updated_at,
  }));
};

export const getMaintenanceRequests = async (): Promise<LandlordMaintenanceRequest[]> => {
  const payload = await api.get<Array<any> | { data?: Array<any> }>('/api/v1/landlord/maintenance');
  const requests = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

  return requests.map((request) => ({
    id: String(request.id ?? request.requestId ?? ''),
    propertyId: String(request.propertyId ?? request.property_id ?? ''),
    studentId: String(request.studentId ?? request.student_id ?? ''),
    landlordId: String(request.landlordId ?? request.landlord_id ?? ''),
    issue: request.issue ?? 'Maintenance request',
    description: request.description,
    priority: ['Low', 'Medium', 'High'].includes(String(request.priority)) ? request.priority : 'Medium',
    status: ['open', 'in-progress', 'resolved'].includes(String(request.status)) ? request.status : 'open',
    category: request.category,
    createdAt: request.createdAt ?? request.created_at,
    updatedAt: request.updatedAt ?? request.updated_at,
  }));
};

export const reviewApplication = async (applicationId: string | number, payload: { status: string; decisionNotes?: string }) => api.patch(`/api/v1/landlord/applications/${applicationId}/status`, payload);

export const updateMaintenanceStatus = async (requestId: string | number, payload: { status: 'open' | 'in-progress' | 'resolved'; notes?: string; updatedAt?: string }) =>
  api.patch(`/api/v1/landlord/maintenance/${requestId}/status`, payload);

export const deleteListing = async (listingId: string | number) => api.delete(`/api/v1/landlord/listings/${listingId}`);
