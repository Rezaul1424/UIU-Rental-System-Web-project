import React from 'react'
import { useState } from 'react'
import type { Listing } from '../types'
import { Badge } from './ui'
import { CampusMap } from './Map'

export const listingDescriptions: Record<number, string> = {
  1: 'A cosy, self-contained studio unit just a 4-minute walk from UIU Gate 3. The flat features a private bathroom, a kitchenette with gas cooker, and reliable AC. Natural light from east-facing windows makes the space feel open. Ideal for a single student who values privacy and proximity to campus.',
  2: 'A well-managed mess facility catering exclusively to female students. Three daily meals are included. Common areas include a study room and a TV lounge. Security guard on duty 24/7 with CCTV coverage on all floors. Walking distance to UIU via the south entry road.',
  3: 'A furnished sublet in the quiet interior of Bashundhara R/A. The 2-bedroom apartment is shared between two tenants. It comes with split-unit AC in the master bedroom, covered parking for one motorcycle, and a generator for load-shedding hours.',
  4: 'A budget-friendly shared room in Block C suited for cost-conscious students. Two students share the room; bunk beds with individual storage lockers provided. The building has a rooftop garden and 24-hour CCTV. Short rickshaw ride to campus.',
  5: 'A premium bachelor flat on the 4th floor with an elevator. The apartment is fully furnished with a double bed, wardrobe, work desk, and an attached bathroom. High-speed WiFi included in rent. Only a 5-minute walk from the UIU north gate.',
  6: 'A spacious family flat ideal for married students or those who prefer extra room. The unit spans two bedrooms plus a dining area. Located east of campus with easy road access. Dedicated covered parking, backup generator, and a lift in the building.',
}

export const listingPins: Record<number, { x: number; y: number }> = {
  1: { x: 45, y: 44 }, 2: { x: 55, y: 58 }, 3: { x: 62, y: 68 },
  4: { x: 57, y: 52 }, 5: { x: 46, y: 38 }, 6: { x: 70, y: 56 },
}

export default function ListingDetailPage({ listing, onBack, backLabel = '← Back', actions, isFavorited, onToggleFavorite, onPropertyIdClick }: {
  listing: Listing
  onBack: () => void
  backLabel?: string
  actions?: React.ReactNode
  isFavorited?: boolean
  onToggleFavorite?: () => void
  onPropertyIdClick?: () => void
}) {
  const [carouselIdx, setCarouselIdx] = useState(0)
  const [showReviewsModal, setShowReviewsModal] = useState(false)
  const pin = listingPins[listing.id] ?? { x: 50, y: 50 }
  const desc = listingDescriptions[listing.id] ?? 'A verified rental property near UIU campus.'
  const images = listing.images ?? [{ room: 'Property', url: listing.image }]
  const prevImg = () => setCarouselIdx(i => (i - 1 + images.length) % images.length)
  const nextImg = () => setCarouselIdx(i => (i + 1) % images.length)

  const sampleReviews = [
    { name: 'Tanvir Ahmed', stars: 4, comment: 'Great landlord, very responsive. The property is well-maintained.', date: 'Jun 2026', property: listing.title },
    { name: 'Sadia Islam', stars: 5, comment: 'Excellent condition, felt like home immediately. Highly recommend.', date: 'Apr 2026', property: listing.title },
    { name: 'Rifat Hassan', stars: 3, comment: 'Average experience. Some maintenance issues took a while to resolve.', date: 'Feb 2026', property: listing.title },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back nav */}
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-[#1a1a18] transition-colors flex items-center gap-1">
        {backLabel}
      </button>

      {/* Image Carousel */}
      <div className="relative h-80 rounded-2xl overflow-hidden bg-gray-100 group">
        <img
          src={images[carouselIdx].url}
          alt={images[carouselIdx].room}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        {/* Room label */}
        <div className="absolute bottom-4 left-4 flex gap-2 items-center">
          <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">{images[carouselIdx].room}</span>
          <Badge variant={listing.status === 'available' ? 'success' : 'warning'}>{listing.status}</Badge>
        </div>
        {/* Price */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center gap-1">
          {onToggleFavorite && (
            <button onClick={onToggleFavorite} className={`mr-1 transition-colors ${isFavorited ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          )}
          <span className="font-mono font-bold text-[#1a1a18] text-lg">৳{listing.price.toLocaleString()}</span>
          <span className="text-xs text-gray-500 ml-1">/mo</span>
        </div>
        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <button onClick={prevImg} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">‹</button>
            <button onClick={nextImg} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">›</button>
          </>
        )}
        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute top-3 right-4 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setCarouselIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === carouselIdx ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title + property ID */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold text-[#111827] leading-snug">{listing.title}</h1>
              <span
                className={`text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded-lg flex-shrink-0 mt-1 ${onPropertyIdClick ? 'cursor-pointer hover:text-[#1a1a18] hover:bg-gray-200 transition-colors' : ''}`}
                onClick={onPropertyIdClick}
              >
                {listing.propertyId}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-sm text-gray-500">
              <span>📍 {listing.distance} from UIU campus</span>
              <span>·</span>
              <span>Listed by {listing.landlord}</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              ['Room Type', listing.type],
              ['Bedrooms', listing.rooms?.bedroom ?? '—'],
              ['Max Tenants', listing.roommateCapacity ?? '—'],
              ['Total Size', listing.totalSize ? `${listing.totalSize} sq ft` : '—'],
            ].map(([k, v]) => (
              <div key={k} className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{k}</div>
                <div className="text-sm font-semibold text-[#1a1a18] mt-0.5">{v}</div>
              </div>
            ))}
          </div>

          {/* Room breakdown */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Room Breakdown</div>
            <div className="grid grid-cols-2 gap-3">
              {listing.rooms && Object.entries(listing.rooms).filter(([, v]) => v > 0).map(([room, count]) => {
                const sizeMap: Record<string, number | undefined> = listing.roomSizes ?? {}
                const size = sizeMap[room]
                const icons: Record<string, string> = { bedroom: '🛏', living: '🛋', bathroom: '🚿', kitchen: '🍳', veranda: '🌿' }
                const labels: Record<string, string> = { bedroom: 'Bedroom', living: 'Living Room', bathroom: 'Bathroom', kitchen: 'Kitchen', veranda: 'Balcony' }
                return (
                  <div key={room} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <span className="text-xl">{icons[room] ?? '🚪'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#1a1a18]">{labels[room] ?? room}</div>
                      <div className="text-xs text-gray-500">×{count}{size ? ` · ${size} sq ft` : ''}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Parking + roommate capacity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Parking</div>
              <div className={`flex items-center gap-2 text-sm font-semibold ${listing.parking?.startsWith('Available') ? 'text-emerald-600' : 'text-gray-400'}`}>
                <span>{listing.parking?.startsWith('Available') ? '🅿️' : '🚫'}</span>
                {listing.parking ?? 'Not Available'}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Max Tenants</div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1a1a18]">
                <span>👥</span>
                {listing.roommateCapacity ?? '—'} {(listing.roommateCapacity ?? 1) === 1 ? 'person' : 'people'}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">About this property</div>
            <p className="text-sm text-[#1a1a18] leading-relaxed">{desc}</p>
          </div>

          {/* Facilities */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Facilities included</div>
            <div className="flex flex-wrap gap-2">
              {listing.facilities.map(f => (
                <span key={f} className="bg-gray-100 text-[#1a1a18] border border-[#1a1a18]/20 px-3 py-2 rounded-full text-xs font-semibold">{f}</span>
              ))}
            </div>
          </div>

          {/* Map */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Location relative to UIU</div>
            <CampusMap pinX={pin.x} pinY={pin.y} label={listing.title} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Landlord card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Landlord</div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-[#1a1a18] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {listing.landlord[0]}
              </div>
              <div>
                <div className="font-semibold text-[#1a1a18]">{listing.landlord}</div>
                <div className="text-xs text-gray-500">Verified · Since 2022</div>
              </div>
            </div>
            <div className="flex gap-0.5 mb-1">{[1,2,3,4,5].map(s => <span key={s} className={`text-sm ${s <= 4 ? 'text-amber-400' : 'text-gray-200'}`}>★</span>)}</div>
            <div className="text-xs text-gray-500 mb-3">4.0 · 12 reviews</div>
            <button
              onClick={() => setShowReviewsModal(true)}
              className="w-full text-xs font-semibold text-[#1a1a18] border border-gray-200 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              View All Reviews
            </button>
          </div>

          {/* Key details */}
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Key Details</div>
            {[
              ['Property ID', listing.propertyId ?? '—'],
              ['Availability', listing.status === 'available' ? 'Available now' : 'Currently occupied'],
              ['Room type', listing.type],
              ['Distance', listing.distance + ' from UIU'],
              ['Monthly rent', '৳' + listing.price.toLocaleString()],
              ['Deposit', '৳' + (listing.price * 2).toLocaleString() + ' (2 months)'],
              ['Utilities', 'Water included'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-[#1a1a18] text-right">{v}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          {actions && (
            <div className="space-y-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Reviews modal */}
      {showReviewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-[#111827] text-lg">Tenant Reviews</h3>
                <p className="text-xs text-gray-500">{listing.landlord} · {listing.title}</p>
              </div>
              <button onClick={() => setShowReviewsModal(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors">✕</button>
            </div>
            {/* Overall */}
            <div className="flex items-center gap-3 bg-amber-50 rounded-xl p-3 mb-4">
              <div className="text-3xl font-bold text-amber-500">4.0</div>
              <div>
                <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <span key={s} className={`text-sm ${s <= 4 ? 'text-amber-400' : 'text-gray-200'}`}>★</span>)}</div>
                <div className="text-xs text-gray-500 mt-0.5">Overall landlord rating · 12 reviews</div>
              </div>
            </div>
            <div className="overflow-y-auto space-y-3 flex-1">
              {sampleReviews.map((r, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#111827] text-white text-xs font-bold flex items-center justify-center">{r.name[0]}</div>
                      <span className="text-sm font-semibold text-[#1a1a18]">{r.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">{r.date}</span>
                  </div>
                  <div className="flex gap-0.5 mb-2">{[1,2,3,4,5].map(s => <span key={s} className={`text-xs ${s <= r.stars ? 'text-amber-400' : 'text-gray-200'}`}>★</span>)}</div>
                  <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                  <div className="text-xs text-gray-400 mt-1">{r.property}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
