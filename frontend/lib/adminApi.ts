import { api } from './api';
import type { LandlordRow, StudentRow } from '../data';
import type { AdminComplaint, AdminComplaintThreadMessage } from '../pages/AdminDashboard/types';

export interface AdminOverviewMetrics {
  totalUsers: number;
  totalStudents: number;
  totalLandlords: number;
  activeListings: number;
  occupiedRooms: number;
  pendingApprovals: number;
  activeLeases: number;
  openComplaints: number;
  monthlyVolume: number;
}

export const getAdminOverview = async (): Promise<AdminOverviewMetrics | null> => {
  const payload = await api.get<{ data?: AdminOverviewMetrics } | AdminOverviewMetrics>('/api/v1/admin/overview');
  return (payload as any)?.data ?? payload ?? null;
};

export const getAdminUsers = async (params?: {
  role?: string;
  status?: string;
  search?: string;
}): Promise<{ students: StudentRow[]; landlords: LandlordRow[]; total: number }> => {
  const query = new URLSearchParams();
  if (params?.role) query.set('role', params.role);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);

  const queryString = query.toString();
  const url = `/api/v1/admin/users${queryString ? `?${queryString}` : ''}`;
  const payload = await api.get<{ data?: { students: StudentRow[]; landlords: LandlordRow[]; total: number } }>(url);
  const data = (payload as any)?.data ?? payload;

  return {
    students: Array.isArray(data?.students) ? data.students : [],
    landlords: Array.isArray(data?.landlords) ? data.landlords : [],
    total: Number(data?.total ?? 0),
  };
};

export const updateAdminUserStatus = async (
  userId: string | number,
  status: 'active' | 'pending' | 'suspended' | 'deactivated'
) => {
  return api.patch(`/api/v1/admin/users/${userId}/status`, { status });
};

export const deleteAdminUser = async (userId: string | number) => {
  return api.delete(`/api/v1/admin/users/${userId}`);
};

export const getAdminComplaints = async (): Promise<{
  complaints: AdminComplaint[];
  threads: Record<string, AdminComplaintThreadMessage[]>;
}> => {
  const payload = await api.get<{
    data?: {
      complaints: AdminComplaint[];
      threads: Record<string, AdminComplaintThreadMessage[]>;
    };
  }>('/api/v1/admin/complaints');

  const data = (payload as any)?.data ?? payload;
  return {
    complaints: Array.isArray(data?.complaints) ? data.complaints : [],
    threads: data?.threads && typeof data.threads === 'object' ? data.threads : {},
  };
};

export const updateAdminComplaintStatus = async (
  complaintId: string,
  status: 'Submitted' | 'Under Review' | 'Responded' | 'Resolved' | 'Closed',
  reply?: string
) => {
  return api.patch(`/api/v1/admin/complaints/${complaintId}/status`, { status, reply });
};

export const replyToAdminComplaint = async (
  complaintId: string,
  message: string
): Promise<{ success: boolean; reply: AdminComplaintThreadMessage }> => {
  const payload = await api.post<{ data?: { success: boolean; reply: AdminComplaintThreadMessage } }>(
    `/api/v1/admin/complaints/${complaintId}/reply`,
    { message }
  );
  return (payload as any)?.data ?? payload;
};
