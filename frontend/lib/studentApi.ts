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

export const submitApplication = async (payload: {
  propertyId: string;
  landlordId?: string;
  studentCardNo?: string;
  contactPhone?: string;
  moveInDate: string;
  employment?: string;
  message?: string;
}) => api.post('/api/v1/student/applications', payload);
