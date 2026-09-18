import type { Listing } from '../types';
import { api } from './api';

const toListingId = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.trim();
    if (!cleaned) return 0;
    const match = cleaned.match(/\d+/);
    return match ? Number(match[0]) : 0;
  }
  return 0;
};

const toDateString = (value?: string | Date | null) => {
  if (!value) return 'N/A';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
};

const normalizeStatus = (status?: unknown): StudentApplication['status'] => {
  const safeStatus = typeof status === 'string' ? status.toLowerCase() : 'under-review';
  return ['under-review', 'accepted', 'rejected', 'cancelled'].includes(safeStatus)
    ? safeStatus as StudentApplication['status']
    : 'under-review';
};

export type StudentProfile = {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  role: 'student' | 'landlord' | 'admin' | 'guest';
  status?: string;
};

export const getProfile = () => api.get<StudentProfile>('/api/v1/student/profile');

export const getFavorites = async (): Promise<number[]> => {
  const payload = await api.get<Array<any> | { data?: Array<any> }>('/api/v1/student/favorites');
  const favorites = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

  return favorites
    .map((favorite) => {
      const listingId =
        toListingId(favorite.listingId ?? favorite.propertyId ?? favorite.id ?? favorite.listing?.id ?? favorite.listing?.propertyId);
      return listingId;
    })
    .filter((id) => id > 0);
};

export const addFavorite = async (listingId: string | number) => {
  const normalizedId = String(listingId);
  return api.post('/api/v1/student/favorites/' + normalizedId);
};

export const removeFavorite = async (listingId: string | number) => {
  const normalizedId = String(listingId);
  return api.delete(`/api/v1/student/favorites/${normalizedId}`);
};

export type StudentApplication = {
  id?: string;
  listingId: number;
  propertyId?: string;
  landlordId?: string;
  status: 'under-review' | 'accepted' | 'rejected' | 'cancelled';
  date: string;
  createdAt?: string;
  message?: string;
  moveInDate?: string;
  employment?: string;
};

export type StudentLeaseSummary = {
  id?: string;
  propertyId: string;
  landlordId?: string;
  status: 'pending' | 'active' | 'ended' | 'terminated';
  startDate?: string;
  endDate?: string;
  monthlyRent?: number;
};

export type StudentRentItem = {
  id: string;
  leaseId: string;
  month: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'disputed';
  paid: boolean;
};

export type StudentReceiptItem = {
  id: string;
  amount: number;
  month: string;
  paid: boolean;
  receiptNumber?: string;
  issuedAt?: string;
};

export type StudentMaintenanceRecord = {
  id?: string | number;
  propertyId?: string;
  landlordId?: string;
  category?: string;
  issue: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'open' | 'in-progress' | 'resolved';
  createdAt?: string;
  updatedAt?: string;
};

export const getApplications = async (): Promise<StudentApplication[]> => {
  const payload = await api.get<Array<any> | { data?: Array<any> }>('/api/v1/student/applications');
  const applications = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

  return applications.map((application) => ({
    id: application.id ?? application.applicationId,
    listingId: toListingId(application.listingId ?? application.propertyId ?? application.listing?.id ?? application.listing?.propertyId),
    propertyId: String(application.propertyId ?? application.listingId ?? application.listing?.id ?? ''),
    landlordId: application.landlordId ?? application.landlord?.id,
    status: normalizeStatus(application.status),
    date: toDateString(application.createdAt ?? application.updatedAt),
    createdAt: application.createdAt ?? application.updatedAt,
    message: application.message,
    moveInDate: application.moveInDate,
    employment: application.employment,
  }));
};

export const getLeases = async (): Promise<StudentLeaseSummary[]> => {
  const payload = await api.get<Array<any> | { data?: Array<any> }>('/api/v1/student/leases');
  const leases = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

  return leases.map((lease) => ({
    id: lease.id,
    propertyId: String(lease.propertyId ?? lease.property_id ?? lease.listingId ?? ''),
    landlordId: lease.landlordId ?? lease.landlord_id,
    status: ['pending', 'active', 'ended', 'terminated'].includes(String(lease.status)) ? lease.status : 'active',
    startDate: lease.startDate ?? lease.start_date,
    endDate: lease.endDate ?? lease.end_date,
    monthlyRent: Number(lease.monthlyRent ?? lease.monthly_rent ?? 0),
  }));
};

export const getRentSummary = async (): Promise<StudentRentItem[]> => {
  const payload = await api.get<Array<any> | { data?: Array<any> }>('/api/v1/student/rent');
  const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

  return items.map((item) => ({
    id: String(item.id ?? item.leaseId ?? item.month),
    leaseId: String(item.leaseId ?? item.lease_id ?? ''),
    month: item.month ?? new Date(item.dueDate ?? item.due_date ?? Date.now()).toLocaleString('en-US', { month: 'short', year: 'numeric' }),
    amount: Number(item.amount ?? 0),
    dueDate: item.dueDate ?? item.due_date ?? '',
    status: ['pending', 'processing', 'paid', 'failed', 'refunded', 'disputed'].includes(String(item.status)) ? item.status : 'pending',
    paid: String(item.status ?? '').toLowerCase() === 'paid',
  }));
};

export const getReceipts = async (): Promise<StudentReceiptItem[]> => {
  const payload = await api.get<Array<any> | { data?: Array<any> }>('/api/v1/student/receipts');
  const receipts = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

  return receipts.map((receipt) => ({
    id: String(receipt.id ?? receipt.receiptNumber ?? receipt.obligationId ?? ''),
    amount: Number(receipt.amount ?? 0),
    month: receipt.month ?? new Date(receipt.issuedAt ?? receipt.issued_at ?? Date.now()).toLocaleString('en-US', { month: 'short', year: 'numeric' }),
    paid: true,
    receiptNumber: receipt.receiptNumber ?? receipt.receipt_number,
    issuedAt: receipt.issuedAt ?? receipt.issued_at,
  }));
};

export const getMaintenanceRequests = async (): Promise<StudentMaintenanceRecord[]> => {
  const payload = await api.get<Array<any> | { data?: Array<any> }>('/api/v1/student/maintenance');
  const requests = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

  return requests.map((request) => ({
    id: request.id,
    propertyId: String(request.propertyId ?? request.property_id ?? ''),
    landlordId: request.landlordId ?? request.landlord_id,
    category: request.category,
    issue: request.issue,
    description: request.description,
    priority: ['Low', 'Medium', 'High'].includes(String(request.priority)) ? request.priority : 'Medium',
    status: ['open', 'in-progress', 'resolved'].includes(String(request.status)) ? request.status : 'open',
    createdAt: request.createdAt ?? request.created_at,
    updatedAt: request.updatedAt ?? request.updated_at,
  }));
};

export const submitApplication = async (payload: {
  propertyId: string;
  landlordId?: string;
  studentCardNo?: string;
  contactPhone?: string;
  moveInDate: string;
  employment?: string;
  message?: string;
}) => api.post('/api/v1/student/applications', payload);

export const submitMaintenanceRequest = async (payload: {
  propertyId: string;
  landlordId: string;
  category?: string;
  issue: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High';
}) => api.post('/api/v1/student/maintenance', payload);

export const normalizeBackendListing = (item: any): Listing => {
  const numericId = toListingId(item.id ?? item.propertyId ?? item.listingId);
  const primaryImg =
    item.images?.find((img: any) => img.isPrimary)?.url ||
    item.images?.[0]?.url ||
    item.image ||
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=380&fit=crop&auto=format';

  const typeMap: Record<string, string> = {
    studio: 'Single',
    room: 'Shared',
    apartment: 'Mess',
    sublet: 'Sublet',
    house: 'Single',
    duplex: 'Single',
    single: 'Single',
    shared: 'Shared',
    mess: 'Mess',
  };
  const rawType = String(item.type || '').toLowerCase();
  const normalizedType = typeMap[rawType] || item.type || 'Single';

  let resolvedNumericId = numericId;
  if (resolvedNumericId <= 0) {
    if (typeof item.id === 'string') {
      const match = item.id.match(/\d+/);
      resolvedNumericId = match ? parseInt(match[0], 10) : 1;
    } else {
      resolvedNumericId = 1;
    }
  }

  return {
    id: resolvedNumericId,
    title: item.title || 'Studio near Gate 3',
    landlord: item.landlordName || item.landlord || 'Landlord',
    type: normalizedType,
    distance: item.distanceKm != null ? `${item.distanceKm} km` : (item.distance || '0.5 km'),
    price: Number(item.priceBDT ?? item.price ?? 0),
    status: item.status || 'available',
    facilities: Array.isArray(item.facilities) ? item.facilities : [],
    image: primaryImg,
    propertyId: String(item.propertyCode || item.propertyId || item.id || `UIU-${resolvedNumericId}`),
    rooms: item.rooms || {
      bedroom: item.bedrooms ?? 1,
      living: 0,
      bathroom: 1,
      kitchen: 1,
      veranda: 0,
    },
    roomSizes: item.roomSizes || (Array.isArray(item.roomSizesSqFt) ? { bedroom: item.roomSizesSqFt[0] ?? 120 } : undefined),
    totalSize: item.totalSizeSqFt ?? item.totalSize ?? 280,
    roommateCapacity: item.roommateCapacity ?? 1,
    parking: item.parkingAvailable ? 'Available' : (item.parking || 'Not Available'),
    images: Array.isArray(item.images)
      ? item.images.map((img: any) => ({
          room: img.room || (img.isPrimary ? 'Main Room' : 'Room'),
          url: typeof img === 'string' ? img : (img.url || primaryImg),
        }))
      : undefined,
  };
};

export const fetchPublicListings = async (query?: {
  type?: string;
  maxPrice?: number;
  maxDistance?: number;
  facilities?: string[];
  bedrooms?: number;
  capacity?: number;
  q?: string;
}): Promise<Listing[]> => {
  const params = new URLSearchParams();
  if (query?.type && query.type !== 'all') {
    const apiTypeMap: Record<string, string> = {
      Single: 'studio',
      Shared: 'room',
      Mess: 'apartment',
      Sublet: 'sublet',
    };
    params.set('type', apiTypeMap[query.type] || query.type.toLowerCase());
  }
  if (query?.maxPrice) params.set('maxPrice', String(query.maxPrice));
  if (query?.maxDistance) params.set('maxDistance', String(query.maxDistance));
  if (query?.facilities?.length) params.set('facilities', query.facilities.join(','));
  if (query?.bedrooms) params.set('bedrooms', String(query.bedrooms));
  if (query?.capacity) params.set('capacity', String(query.capacity));
  if (query?.q) params.set('q', query.q);

  const qs = params.toString();
  const path = qs ? `/api/v1/listings?${qs}` : '/api/v1/listings';
  const response = await api.get<{ data?: Array<any> } | Array<any>>(path);
  const items = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
  return items.map(normalizeBackendListing);
};

export const cancelApplication = async (applicationId: string | number) => {
  return api.patch(`/api/v1/student/applications/${applicationId}/cancel`, {});
};
