import { api } from './api';

const toListingId = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const match = value.match(/\d+/);
    return match ? Number(match[0]) : 0;
  }
  return 0;
};

export type StudentProfile = {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  role: 'student' | 'landlord' | 'admin' | 'guest';
  status: string;
};

export const getProfile = () => api.get<StudentProfile>('/api/v1/student/profile');

export const getFavorites = async (): Promise<number[]> => {
  const favorites = await api.get<Array<{ listingId?: string | number; id?: string | number; listing?: { id?: string | number } }>>('/api/v1/student/favorites');
  if (!Array.isArray(favorites)) return [];

  return favorites
    .map((favorite) => toListingId(favorite.listingId ?? favorite.id ?? favorite.listing?.id))
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
  const applications = await api.get<Array<any>>('/api/v1/student/applications');

  if (!Array.isArray(applications)) return [];

  return applications.map((application) => ({
    id: application.id ?? application.applicationId,
    listingId: toListingId(application.propertyId ?? application.listingId ?? application.listing?.id),
    propertyId: application.propertyId ?? application.listingId,
    landlordId: application.landlordId,
    status: application.status ?? 'under-review',
    date: application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 'N/A',
    createdAt: application.createdAt,
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
