import { AppError } from '../errors/AppError.js';
import type {
  ApplicationReviewPayload,
  LandlordLeaseSummary,
  LandlordListingPayload,
  LandlordProfile,
  MaintenanceUpdatePayload,
} from '../contracts/landlord.js';

export interface LandlordRepository {
  getProfile(userId: string): Promise<LandlordProfile | null>;
  getMyListings(landlordId: string): Promise<LandlordListingPayload[]>;
  createListing(landlordId: string, payload: LandlordListingPayload): Promise<LandlordListingPayload & { id: string; createdAt: string; updatedAt: string }>;
  updateListing(landlordId: string, listingId: string, payload: Partial<LandlordListingPayload>): Promise<LandlordListingPayload & { id: string; createdAt: string; updatedAt: string }>;
  getApplications(landlordId: string): Promise<Array<{ id: string; propertyId: string; studentId: string; landlordId: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; createdAt: string }>>;
  reviewApplication(landlordId: string, applicationId: string, payload: ApplicationReviewPayload): Promise<{ id: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; reviewedAt: string }>;
  getLeases(landlordId: string): Promise<LandlordLeaseSummary[]>;
  getMaintenanceRequests(landlordId: string): Promise<Array<{ id: string; propertyId: string; studentId: string; landlordId: string; issue: string; priority: 'Low' | 'Medium' | 'High'; status: 'open' | 'in-progress' | 'resolved'; createdAt: string }>>;
  updateMaintenanceStatus(landlordId: string, requestId: string, payload: MaintenanceUpdatePayload): Promise<{ id: string; status: 'open' | 'in-progress' | 'resolved'; updatedAt: string }>;
}

export const landlordRepository: LandlordRepository = {
  async getProfile(userId: string): Promise<LandlordProfile | null> {
    void userId;
    throw new AppError(501, 'LANDLORD_PROFILE_NOT_IMPLEMENTED', 'Landlord profile repository is not implemented in this session.');
  },
  async getMyListings(landlordId: string): Promise<LandlordListingPayload[]> {
    void landlordId;
    throw new AppError(501, 'LANDLORD_LISTINGS_NOT_IMPLEMENTED', 'Landlord listings repository is not implemented in this session.');
  },
  async createListing(landlordId: string, payload: LandlordListingPayload): Promise<LandlordListingPayload & { id: string; createdAt: string; updatedAt: string }> {
    void landlordId; void payload;
    throw new AppError(501, 'LANDLORD_LISTINGS_NOT_IMPLEMENTED', 'Landlord listings repository is not implemented in this session.');
  },
  async updateListing(landlordId: string, listingId: string, payload: Partial<LandlordListingPayload>): Promise<LandlordListingPayload & { id: string; createdAt: string; updatedAt: string }> {
    void landlordId; void listingId; void payload;
    throw new AppError(501, 'LANDLORD_LISTINGS_NOT_IMPLEMENTED', 'Landlord listings repository is not implemented in this session.');
  },
  async getApplications(landlordId: string): Promise<Array<{ id: string; propertyId: string; studentId: string; landlordId: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; createdAt: string }>> {
    void landlordId;
    throw new AppError(501, 'LANDLORD_APPLICATIONS_NOT_IMPLEMENTED', 'Landlord applications repository is not implemented in this session.');
  },
  async reviewApplication(landlordId: string, applicationId: string, payload: ApplicationReviewPayload): Promise<{ id: string; status: 'under-review' | 'accepted' | 'rejected' | 'cancelled'; reviewedAt: string }> {
    void landlordId; void applicationId; void payload;
    throw new AppError(501, 'LANDLORD_APPLICATIONS_NOT_IMPLEMENTED', 'Landlord application review repository is not implemented in this session.');
  },
  async getLeases(landlordId: string): Promise<LandlordLeaseSummary[]> {
    void landlordId;
    throw new AppError(501, 'LANDLORD_LEASES_NOT_IMPLEMENTED', 'Landlord lease repository is not implemented in this session.');
  },
  async getMaintenanceRequests(landlordId: string): Promise<Array<{ id: string; propertyId: string; studentId: string; landlordId: string; issue: string; priority: 'Low' | 'Medium' | 'High'; status: 'open' | 'in-progress' | 'resolved'; createdAt: string }>> {
    void landlordId;
    throw new AppError(501, 'LANDLORD_MAINTENANCE_NOT_IMPLEMENTED', 'Landlord maintenance repository is not implemented in this session.');
  },
  async updateMaintenanceStatus(landlordId: string, requestId: string, payload: MaintenanceUpdatePayload): Promise<{ id: string; status: 'open' | 'in-progress' | 'resolved'; updatedAt: string }> {
    void landlordId; void requestId; void payload;
    throw new AppError(501, 'LANDLORD_MAINTENANCE_NOT_IMPLEMENTED', 'Landlord maintenance status repository is not implemented in this session.');
  },
};
