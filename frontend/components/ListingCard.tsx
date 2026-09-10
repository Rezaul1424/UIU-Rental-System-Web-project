import React from 'react'
import type { Listing } from '../types'
import { Badge } from './ui'

export default function ListingCard({ listing, actions, onView, isFavorited, onToggleFavorite }: { listing: Listing; actions?: React.ReactNode; onView?: () => void; isFavorited?: boolean; onToggleFavorite?: (e: React.MouseEvent) => void }) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 group ${onView ? 'cursor-pointer' : ''}`}
      onClick={onView}
    >
      <div className="h-44 overflow-hidden bg-gray-100 relative">
        <img src={listing.image} alt={listing.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
        <div className="absolute top-3 left-3">
          <Badge variant={listing.status === 'available' ? 'success' : 'warning'}>{listing.status}</Badge>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${isFavorited ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-400 hover:text-red-400'}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          )}
          <div className="bg-white/90 backdrop-blur-sm text-xs font-mono font-semibold text-[#1a1a18] px-2 py-1 rounded-lg">
            ৳{listing.price.toLocaleString()}/mo
          </div>
        </div>
        {onView && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 text-[#1a1a18] text-xs font-semibold px-3 py-1.5 rounded-full shadow">View details</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="font-semibold text-[#1a1a18] text-[15px] leading-snug mb-1">{listing.title}</div>
        <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
          <span className="bg-gray-50 px-2 py-0.5 rounded">{listing.type}</span>
          <span>·</span>
          <span>{listing.distance} from campus</span>
        </div>
        <div className="flex flex-wrap gap-1 mb-4">
          {listing.facilities.map(f => (
            <span key={f} className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md text-xs">{f}</span>
          ))}
        </div>
        <div
          className="flex items-center justify-between pt-3 border-t border-gray-100"
          onClick={e => e.stopPropagation()}
        >
          <span className="text-xs text-gray-500">by {listing.landlord}</span>
          {actions}
        </div>
      </div>
    </div>
  )
}
