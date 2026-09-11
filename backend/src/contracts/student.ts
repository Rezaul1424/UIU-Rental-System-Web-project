import { z } from 'zod';

export const StudentProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  studentId: z.string().trim().min(3).max(30).optional(),
  role: z.enum(['admin', 'landlord', 'student', 'guest']).default('student'),
  status: z.enum(['active', 'pending', 'suspended', 'deactivated']).default('active'),
});

export const StudentFavoritePayloadSchema = z.object({
  listingId: z.string().trim().min(1),
});

export const FavoriteListingSchema = z.object({
  id: z.string().min(1).optional(),
  studentId: z.string().min(1),
  listingId: z.string().trim().min(1),
  createdAt: z.string().datetime({ offset: true }).optional(),
  listing: z.object({
    id: z.string().min(1),
    title: z.string().trim().min(1),
    priceBDT: z.number().int().positive().optional(),
    landlordName: z.string().trim().min(1).optional(),
  }).optional(),
});

export const StudentApplicationPayloadSchema = z.object({
  propertyId: z.string().trim().min(1),
  landlordId: z.string().trim().min(1).optional(),
  studentCardNo: z.string().trim().min(3).max(30).optional(),
  contactPhone: z.string().trim().min(7).max(20).optional(),
  moveInDate: z.string().trim().min(1),
  employment: z.string().trim().min(1).max(50).default('Student'),
  message: z.string().trim().max(500).optional(),
});

export const StudentLeaseSummarySchema = z.object({
  id: z.string().min(1),
  propertyId: z.string().min(1),
  studentId: z.string().min(1),
  landlordId: z.string().min(1),
  status: z.enum(['pending', 'active', 'ended', 'terminated']),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1).optional(),
  monthlyRent: z.number().int().positive(),
  createdAt: z.string().datetime({ offset: true }).optional(),
  updatedAt: z.string().datetime({ offset: true }).optional(),
});

export const StudentMaintenanceRequestSchema = z.object({
  id: z.string().min(1),
  propertyId: z.string().min(1),
  landlordId: z.string().min(1),
  category: z.string().trim().min(1).max(50).optional(),
  issue: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(['Low', 'Medium', 'High']),
  status: z.enum(['open', 'in-progress', 'resolved']),
  attachments: z.array(z.object({
    name: z.string().trim().min(1),
    type: z.string().trim().min(1).optional(),
    sizeBytes: z.number().int().nonnegative().optional(),
  })).optional(),
  createdAt: z.string().datetime({ offset: true }).optional(),
  updatedAt: z.string().datetime({ offset: true }).optional(),
});

export const StudentRentSummarySchema = z.object({
  id: z.string().min(1),
  leaseId: z.string().min(1),
  month: z.string().trim().min(1),
  amount: z.number().int().positive(),
  dueDate: z.string().trim().min(1),
  status: z.enum(['pending', 'processing', 'paid', 'failed', 'refunded', 'disputed']),
});

export const StudentReceiptSummarySchema = z.object({
  id: z.string().min(1),
  receiptNumber: z.string().trim().min(1),
  obligationId: z.string().min(1),
  amount: z.number().int().positive(),
  issuedAt: z.string().datetime({ offset: true }).optional(),
});

export type StudentProfile = z.infer<typeof StudentProfileSchema>;
export type StudentFavoritePayload = z.infer<typeof StudentFavoritePayloadSchema>;
export type FavoriteListing = z.infer<typeof FavoriteListingSchema>;
export type StudentApplicationPayload = z.infer<typeof StudentApplicationPayloadSchema>;
export type StudentLeaseSummary = z.infer<typeof StudentLeaseSummarySchema>;
export type StudentMaintenanceRequest = z.infer<typeof StudentMaintenanceRequestSchema>;
export type StudentRentSummary = z.infer<typeof StudentRentSummarySchema>;
export type StudentReceiptSummary = z.infer<typeof StudentReceiptSummarySchema>;
