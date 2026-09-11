import { describe, it, expect } from 'vitest';
import {
  AccountStatus,
  ApiErrorSchema,
  ListingSchema,
  PaginationMetaSchema,
  PageQuerySchema,
  ListingStatus,
} from '../src/contracts/api.js';

describe('Module 2 shared API contracts', () => {
  it('accepts valid pagination metadata', () => {
    const parsed = PaginationMetaSchema.parse({
      page: 1,
      limit: 20,
      totalItems: 44,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: false,
    });

    expect(parsed.page).toBe(1);
    expect(parsed.totalItems).toBe(44);
  });

  it('accepts valid page query values and normalizes them', () => {
    const parsed = PageQuerySchema.parse({
      page: '2',
      limit: '10',
      sortBy: 'price',
      sortDirection: 'asc',
      q: 'studio near uiu',
    });

    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(10);
    expect(parsed.sortDirection).toBe('asc');
    expect(parsed.q).toBe('studio near uiu');
  });

  it('accepts a listing payload matching the shared frontend contract', () => {
    const parsed = ListingSchema.parse({
      id: 'listing_123',
      title: 'Cozy room near campus',
      landlordName: 'UIU Housing',
      type: 'room',
      description: 'Comfortable room for a student near UIU.',
      priceBDT: 18000,
      currency: 'BDT',
      status: 'approved',
      bedrooms: 1,
      rooms: 2,
      roomSizesSqFt: [120, 140],
      totalSizeSqFt: 220,
      roommateCapacity: 2,
      parkingAvailable: true,
      facilities: ['wifi', 'generator', 'security'],
      images: [
        { id: 'img_1', url: 'https://example.com/image-1.jpg', isPrimary: true },
      ],
      address: {
        line1: 'Road 8',
        area: 'Bashundhara',
        city: 'Dhaka',
        district: 'Dhaka',
        latitude: 23.81,
        longitude: 90.41,
      },
      distanceKm: 4.2,
      createdAt: '2026-09-11T10:00:00.000Z',
      updatedAt: '2026-09-11T11:00:00.000Z',
    });

    expect(parsed.currency).toBe('BDT');
    expect(parsed.status).toBe('approved');
    expect(parsed.priceBDT).toBe(18000);
    expect(parsed.roomSizesSqFt).toHaveLength(2);
  });

  it('rejects invalid values for account, listing states, and API error payloads', () => {
    expect(() => AccountStatus.parse('unknown')).toThrow();
    expect(() => ListingStatus.parse('invalid')).toThrow();
    expect(() =>
      ApiErrorSchema.parse({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Price is required',
          statusCode: 400,
          details: [{ field: 'priceBDT', message: 'Must be a positive integer' }],
        },
      }),
    ).not.toThrow();
  });
});
