import { z } from 'zod';

export const LandlordProfileSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(20).optional(),
  companyName: z.string().trim().min(1).optional(),
  propertyCount: z.number().int().nonnegative().default(0),
  isVerified: z.boolean().default(false),
  createdAt: z.string().datetime({ offset: true }).optional(),
  updatedAt: z.string().datetime({ offset: true }).optional(),
});

export const LandlordListingPayloadSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(3000),
  type: z.enum(['apartment', 'house', 'room', 'studio', 'duplex', 'sublet']),
  priceBDT: z.number().int().positive(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  roommateCapacity: z.number().int().min(1).max(20).optional(),
  parkingAvailable: z.boolean().default(false),
  facilities: z.array(z.string().trim().min(1)).default([]),
  address: z.object({
    line1: z.string().trim().min(1),
    area: z.string().trim().min(1).optional(),
    city: z.string().trim().min(1),
    district: z.string().trim().min(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  status: z.enum(['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived', 'occupied']).default('draft'),
});

export const ApplicationReviewPayloadSchema = z.object({
  applicationId: z.string().trim().min(1),
  status: z.enum(['accepted', 'rejected', 'under-review', 'cancelled']),
  decisionNotes: z.string().trim().max(500).optional(),
  reviewedAt: z.string().datetime({ offset: true }).optional(),
});

export const LandlordLeaseSummarySchema = z.object({
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

export const MaintenanceUpdatePayloadSchema = z.object({
  requestId: z.string().trim().min(1),
  status: z.enum(['open', 'in-progress', 'resolved']),
  notes: z.string().trim().max(500).optional(),
  updatedAt: z.string().datetime({ offset: true }).optional(),
});

export type LandlordProfile = z.infer<typeof LandlordProfileSchema>;
export type LandlordListingPayload = z.infer<typeof LandlordListingPayloadSchema>;
export type ApplicationReviewPayload = z.infer<typeof ApplicationReviewPayloadSchema>;
export type LandlordLeaseSummary = z.infer<typeof LandlordLeaseSummarySchema>;
export type MaintenanceUpdatePayload = z.infer<typeof MaintenanceUpdatePayloadSchema>;
