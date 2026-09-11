import { z } from 'zod';

export const RoleSchema = z.enum(['admin', 'landlord', 'student', 'guest']);
export const AccountStatus = z.enum(['active', 'pending', 'suspended', 'deactivated']);
export const ListingType = z.enum(['apartment', 'house', 'room', 'studio', 'duplex', 'sublet']);
export const ListingStatus = z.enum([
  'draft',
  'pending',
  'approved',
  'rejected',
  'suspended',
  'archived',
  'occupied',
]);
export const SortDirectionSchema = z.enum(['asc', 'desc']);

export const PaginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive().max(100),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

export const PageQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().trim().min(1).optional(),
  sortDirection: SortDirectionSchema.default('desc'),
  q: z.string().trim().max(200).optional(),
});

export const ApiErrorDetailSchema = z.object({
  field: z.string().min(1).optional(),
  message: z.string().min(1),
  code: z.string().min(1).optional(),
});

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    statusCode: z.number().int().positive(),
    details: z.array(ApiErrorDetailSchema).optional(),
  }),
});

export const ListingImageSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  isPrimary: z.boolean().default(false),
});

export const AddressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().min(1).optional(),
  area: z.string().min(1).optional(),
  city: z.string().min(1),
  district: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const ListingSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  landlordName: z.string().min(1).optional(),
  type: ListingType,
  description: z.string().min(1),
  priceBDT: z.number().int().positive(),
  currency: z.literal('BDT'),
  status: ListingStatus,
  bedrooms: z.number().int().min(0).max(20).optional(),
  rooms: z.number().int().min(0).max(20).optional(),
  roomSizesSqFt: z.array(z.number().int().positive()).default([]),
  totalSizeSqFt: z.number().int().positive().optional(),
  roommateCapacity: z.number().int().min(1).max(20).optional(),
  parkingAvailable: z.boolean().default(false),
  facilities: z.array(z.string().min(1)).default([]),
  images: z.array(ListingImageSchema).default([]),
  address: AddressSchema,
  distanceKm: z.number().min(0).max(50).optional(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export function createPagedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });
}

export type Role = z.infer<typeof RoleSchema>;
export type AccountStatusType = z.infer<typeof AccountStatus>;
export type ListingTypeType = z.infer<typeof ListingType>;
export type ListingStatusType = z.infer<typeof ListingStatus>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type PageQuery = z.infer<typeof PageQuerySchema>;
export type Listing = z.infer<typeof ListingSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
