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
