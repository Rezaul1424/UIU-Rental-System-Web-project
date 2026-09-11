import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPublicListing, searchPublicListings } from '../listings/repository.js';
import { AppError } from '../errors/AppError.js';
import { ListingType, SortDirectionSchema } from '../contracts/api.js';

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
  type: ListingType.optional(),
  maxPrice: z.coerce.number().int().positive().max(1_000_000).optional(),
  maxDistance: z.coerce.number().positive().max(50).optional(),
  facilities: z.string().trim().max(500).optional(),
  bedrooms: z.coerce.number().int().min(0).max(20).optional(),
  capacity: z.coerce.number().int().min(1).max(20).optional(),
  sortBy: z.enum(['relevance', 'price', 'distance', 'recency']).default('relevance'),
  sortDirection: SortDirectionSchema.default('desc'),
});

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const query = listQuerySchema.parse(req.query);
  const result = await searchPublicListings({
    ...query,
    facilities: query.facilities ? query.facilities.split(',').map((facility) => facility.trim()).filter(Boolean) : [],
  });
  res.json(result);
}));

router.get('/:identifier', asyncHandler(async (req, res) => {
  const identifier = z.string().trim().min(1).max(80).parse(req.params.identifier);
  const listing = await getPublicListing(identifier);
  if (!listing) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing does not exist');
  res.json({ data: listing });
}));

export { router as listingsRouter };
