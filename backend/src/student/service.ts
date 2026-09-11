import { studentRepository } from './repository.js';
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

export const studentService = {
  async getProfile(userId: string): Promise<StudentProfile | null> {
    return studentRepository.getProfile(userId);
  },
  async getFavorites(studentId: string): Promise<FavoriteListing[]> {
    return studentRepository.getFavorites(studentId);
  },
  async addFavorite(studentId: string, payload: StudentFavoritePayload): Promise<FavoriteListing> {
    return studentRepository.addFavorite(studentId, payload);
  },
  async removeFavorite(studentId: string, listingId: string): Promise<boolean> {
    return studentRepository.removeFavorite(studentId, listingId);
  },
  async getApplications(studentId: string): Promise<Array<StudentApplicationPayload & { id: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; createdAt: string }>> {
    return studentRepository.getApplications(studentId);
  },
  async submitApplication(studentId: string, payload: StudentApplicationPayload): Promise<StudentApplicationPayload & { id: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; createdAt: string }> {
    return studentRepository.submitApplication(studentId, payload);
  },
  async getLeases(studentId: string): Promise<StudentLeaseSummary[]> {
    return studentRepository.getLeases(studentId);
  },
  async getRentSummary(studentId: string): Promise<StudentRentSummary[]> {
    return studentRepository.getRentSummary(studentId);
  },
  async getReceipts(studentId: string): Promise<StudentReceiptSummary[]> {
    return studentRepository.getReceipts(studentId);
  },
  async getMaintenanceRequests(studentId: string): Promise<StudentMaintenanceRequest[]> {
    return studentRepository.getMaintenanceRequests(studentId);
  },
  async submitMaintenanceRequest(studentId: string, payload: Omit<StudentMaintenanceRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<StudentMaintenanceRequest> {
    return studentRepository.submitMaintenanceRequest(studentId, payload);
  },
};
