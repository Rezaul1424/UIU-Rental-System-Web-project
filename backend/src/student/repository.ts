import { AppError } from '../errors/AppError.js';
import type {
  FavoriteListing,
  StudentApplicationPayload,
  StudentFavoritePayload,
  StudentLeaseSummary,
  StudentMaintenanceRequest,
  StudentProfile,
  StudentReceiptSummary,
  StudentRentSummary,
} from '../contracts/student.js';

export interface StudentRepository {
  getProfile(userId: string): Promise<StudentProfile | null>;
  getFavorites(studentId: string): Promise<FavoriteListing[]>;
  addFavorite(studentId: string, payload: StudentFavoritePayload): Promise<FavoriteListing>;
  removeFavorite(studentId: string, listingId: string): Promise<boolean>;
  getApplications(studentId: string): Promise<Array<StudentApplicationPayload & { id: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; createdAt: string }>>;
  submitApplication(studentId: string, payload: StudentApplicationPayload): Promise<StudentApplicationPayload & { id: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; createdAt: string }>;
  getLeases(studentId: string): Promise<StudentLeaseSummary[]>;
  getRentSummary(studentId: string): Promise<StudentRentSummary[]>;
  getReceipts(studentId: string): Promise<StudentReceiptSummary[]>;
  getMaintenanceRequests(studentId: string): Promise<StudentMaintenanceRequest[]>;
  submitMaintenanceRequest(studentId: string, payload: Omit<StudentMaintenanceRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<StudentMaintenanceRequest>;
}

export const studentRepository: StudentRepository = {
  async getProfile(userId: string): Promise<StudentProfile | null> {
    void userId;
    throw new AppError(501, 'STUDENT_PROFILE_NOT_IMPLEMENTED', 'Student profile repository is not implemented in this session.');
  },
  async getFavorites(studentId: string): Promise<FavoriteListing[]> {
    void studentId;
    throw new AppError(501, 'STUDENT_FAVORITES_NOT_IMPLEMENTED', 'Student favorites repository is not implemented in this session.');
  },
  async addFavorite(studentId: string, payload: StudentFavoritePayload): Promise<FavoriteListing> {
    void studentId; void payload;
    throw new AppError(501, 'STUDENT_FAVORITES_NOT_IMPLEMENTED', 'Student favorites repository is not implemented in this session.');
  },
  async removeFavorite(studentId: string, listingId: string): Promise<boolean> {
    void studentId; void listingId;
    throw new AppError(501, 'STUDENT_FAVORITES_NOT_IMPLEMENTED', 'Student favorites repository is not implemented in this session.');
  },
  async getApplications(studentId: string): Promise<Array<StudentApplicationPayload & { id: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; createdAt: string }>> {
    void studentId;
    throw new AppError(501, 'STUDENT_APPLICATIONS_NOT_IMPLEMENTED', 'Student application repository is not implemented in this session.');
  },
  async submitApplication(studentId: string, payload: StudentApplicationPayload): Promise<StudentApplicationPayload & { id: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; createdAt: string }> {
    void studentId; void payload;
    throw new AppError(501, 'STUDENT_APPLICATIONS_NOT_IMPLEMENTED', 'Student application repository is not implemented in this session.');
  },
  async getLeases(studentId: string): Promise<StudentLeaseSummary[]> {
    void studentId;
    throw new AppError(501, 'STUDENT_LEASES_NOT_IMPLEMENTED', 'Student lease repository is not implemented in this session.');
  },
  async getRentSummary(studentId: string): Promise<StudentRentSummary[]> {
    void studentId;
    throw new AppError(501, 'STUDENT_RENT_NOT_IMPLEMENTED', 'Student rent summary repository is not implemented in this session.');
  },
  async getReceipts(studentId: string): Promise<StudentReceiptSummary[]> {
    void studentId;
    throw new AppError(501, 'STUDENT_RECEIPTS_NOT_IMPLEMENTED', 'Student receipt repository is not implemented in this session.');
  },
  async getMaintenanceRequests(studentId: string): Promise<StudentMaintenanceRequest[]> {
    void studentId;
    throw new AppError(501, 'STUDENT_MAINTENANCE_NOT_IMPLEMENTED', 'Student maintenance repository is not implemented in this session.');
  },
  async submitMaintenanceRequest(studentId: string, payload: Omit<StudentMaintenanceRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<StudentMaintenanceRequest> {
    void studentId; void payload;
    throw new AppError(501, 'STUDENT_MAINTENANCE_NOT_IMPLEMENTED', 'Student maintenance repository is not implemented in this session.');
  },
};
