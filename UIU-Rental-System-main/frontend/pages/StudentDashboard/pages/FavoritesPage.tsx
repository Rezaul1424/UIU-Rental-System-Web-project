import { Badge } from '../../../components/ui'
import type { Listing } from '../../../types'
import type { StudentPage } from '../types'

type FavoritesPageProps = {
  favorites: number[]
  listings: Listing[]
  openStudentListing: (listing: Listing) => void
  toggleFavorite: (id: number) => void
  setPage: (page: StudentPage) => void
}

export default function FavoritesPage({ favorites, listings, openStudentListing, toggleFavorite, setPage }: FavoritesPageProps) {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Saved Properties</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your bookmarked listings</p>
        </div>
        <span className="text-sm text-gray-500">{favorites.length} saved</span>
      </div>
      {favorites.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">❤️</div>
          <div className="font-semibold text-gray-500 text-lg">No saved properties yet</div>
          <div className="text-sm mt-2">Browse listings and tap the heart to save properties here</div>
          <button onClick={() => setPage('browse')} className="mt-6 bg-[#111827] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#1f2937] transition-colors">Browse Listings</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.filter(l => favorites.includes(l.id)).map(l => (
            <div key={l.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all group cursor-pointer" onClick={() => openStudentListing(l)}>
              <div className="h-44 overflow-hidden bg-gray-100 relative">
                <img src={l.image} alt={l.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                <button onClick={e => { e.stopPropagation(); toggleFavorite(l.id) }} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                </button>
                <div className="absolute top-3 left-3">
                  <Badge variant={l.status === 'available' ? 'success' : 'warning'}>{l.status}</Badge>
                </div>
              </div>
              <div className="p-4">
                <div className="font-semibold text-[#1a1a18] text-sm leading-snug mb-1">{l.title}</div>
                <div className="text-xs text-gray-500 mb-1">📍 {l.distance} from UIU</div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <span>🛏 {l.rooms?.bedroom ?? '—'} bed</span>
                  <span>·</span>
                  <span>👥 max {l.roommateCapacity ?? '—'} tenants</span>
                  <span>·</span>
                  <span className="font-mono text-gray-400">{l.propertyId}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="font-bold text-[#1a1a18]">৳{l.price.toLocaleString()}<span className="text-xs font-normal text-gray-400">/mo</span></span>
                  <button onClick={e => { e.stopPropagation(); toggleFavorite(l.id) }} className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
