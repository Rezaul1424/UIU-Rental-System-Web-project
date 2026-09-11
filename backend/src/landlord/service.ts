import { landlordRepository } from './repository.js';
import type {
  ApplicationReviewPayload,
  LandlordLeaseSummary,
  LandlordListingPayload,
  LandlordProfile,
  MaintenanceUpdatePayload,
} from '../contracts/landlord.js';

export const landlordService = {
  async getProfile(userId: string): Promise<LandlordProfile | null> {
    return landlordRepository.getProfile(userId);
  },
  async getMyListings(landlordId: string): Promise<LandlordListingPayload[]> {
    return landlordRepository.getMyListings(landlordId);
  },
  async createListing(landlordId: string, payload: LandlordListingPayload): Promise<LandlordListingPayload & { id: string; createdAt: string; updatedAt: string }> {
    return landlordRepository.createListing(landlordId, payload);
  },
  async updateListing(landlordId: string, listingId: string, payload: Partial<LandlordListingPayload>): Promise<LandlordListingPayload & { id: string; createdAt: string; updatedAt: string }> {
    return landlordRepository.updateListing(landlordId, listingId, payload);
  },
  async deleteListing(landlordId: string, listingId: string): Promise<boolean> {
    return landlordRepository.deleteListing(landlordId, listingId);
  },
  async getApplications(landlordId: string): Promise<Array<{ id: string; propertyId: string; studentId: string; landlordId: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; createdAt: string }>> {
    return landlordRepository.getApplications(landlordId);
  },
  async reviewApplication(landlordId: string, applicationId: string, payload: ApplicationReviewPayload): Promise<{ id: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; reviewedAt: string }> {
    return landlordRepository.reviewApplication(landlordId, applicationId, payload);
  },
  async getLeases(landlordId: string): Promise<LandlordLeaseSummary[]> {
    return landlordRepository.getLeases(landlordId);
  },
  async getMaintenanceRequests(landlordId: string): Promise<Array<{ id: string; propertyId: string; studentId: string; landlordId: string; issue: string; priority: 'Low' | 'Medium' | 'High'; status: 'open' | 'in-progress' | 'resolved'; createdAt: string }>> {
    return landlordRepository.getMaintenanceRequests(landlordId);
  },
  async updateMaintenanceStatus(landlordId: string, requestId: string, payload: MaintenanceUpdatePayload): Promise<{ id: string; status: 'open' | 'in-progress' | 'resolved'; updatedAt: string }> {
    return landlordRepository.updateMaintenanceStatus(landlordId, requestId, payload);
  },
};
