import type { Listing } from '../types'
import { parseUiuCoordinates } from '../lib/geo';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export type PublicListingSearch = {
  query?: string
  type?: string
  maxPrice?: number
  maxDistance?: number
  facilities?: string[]
}

type ApiListing = {
  id: string
  title: string
  landlordName?: string
  type: string
  description: string
  priceBDT: number
  status: string
  bedrooms?: number
  totalSizeSqFt?: number
  roommateCapacity?: number
  parkingAvailable: boolean
  facilities: string[]
  images: { id: string; url: string; isPrimary: boolean }[]
  address: { line1: string; area?: string; city: string; latitude?: number | string | null; longitude?: number | string | null }
  distanceKm?: number
}

type ListingResponse = { data: ApiListing[] }

const apiTypeToUiType: Record<string, string> = {
  apartment: 'Mess',
  house: 'Single',
  room: 'Shared',
  studio: 'Single',
  duplex: 'Single',
  sublet: 'Sublet',
}

const uiTypeToApiType: Record<string, string> = {
  Single: 'studio',
  Shared: 'room',
  Mess: 'apartment',
  Sublet: 'sublet',
}

const fallbackImage = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=380&fit=crop&auto=format'

function numericListingId(identifier: string): number {
  const suffix = identifier.match(/(\d+)$/)?.[1]
  if (suffix) return Number(suffix)
  return [...identifier].reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 0)
}

function mapListing(listing: ApiListing): Listing {
  const sortedImages = [...listing.images].sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary))
  const images = sortedImages.map((image) => ({ room: 'Property', url: image.url }))
  const primaryImage = images[0]?.url ?? fallbackImage

  return {
    id: numericListingId(listing.id),
    propertyId: listing.id,
    title: listing.title,
    landlord: listing.landlordName || 'Verified landlord',
    type: apiTypeToUiType[listing.type] ?? listing.type,
    distance: `${listing.distanceKm ?? 0} km`,
    price: listing.priceBDT,
    status: 'available',
    facilities: listing.facilities,
    image: primaryImage,
    mapPin: parseUiuCoordinates(listing.address.latitude, listing.address.longitude),
    rooms: {
      bedroom: listing.bedrooms ?? 0,
      living: 0,
      bathroom: 0,
      kitchen: 0,
      veranda: 0,
    },
    totalSize: listing.totalSizeSqFt,
    roommateCapacity: listing.roommateCapacity,
    parking: listing.parkingAvailable ? 'Available' : 'Not Available',
    images: images.length > 0 ? images : [{ room: 'Property', url: fallbackImage }],
    description: listing.description,
  }
}

export async function fetchPublicListings(
  search: PublicListingSearch = {},
  signal?: AbortSignal,
): Promise<Listing[]> {
  const params = new URLSearchParams({ page: '1', limit: '100' })
  if (search.query?.trim()) params.set('q', search.query.trim())
  if (search.type && uiTypeToApiType[search.type]) params.set('type', uiTypeToApiType[search.type])
  if (search.maxPrice !== undefined) params.set('maxPrice', String(search.maxPrice))
  if (search.maxDistance !== undefined) params.set('maxDistance', String(search.maxDistance))
  if (search.facilities?.length) params.set('facilities', search.facilities.join(','))

  const response = await fetch(`${API_BASE_URL}/api/v1/listings?${params}`, { signal })
  const result = await response.json() as ListingResponse | { error?: { message?: string } }
  if (!response.ok) {
    const message = 'error' in result ? result.error?.message : undefined
    throw new Error(message || 'Could not load listings. Please try again.')
  }

  if (!('data' in result) || !Array.isArray(result.data)) {
    throw new Error('The listings service returned an unexpected response.')
  }
  return result.data.map(mapListing)
}
