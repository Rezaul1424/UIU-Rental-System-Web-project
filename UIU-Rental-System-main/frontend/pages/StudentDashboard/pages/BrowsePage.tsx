import type { Listing } from '../../../types'
import type { StudentPage } from '../types'

type BrowsePageProps = {
  filteredListings: Listing[]
  favorites: number[]
  typeFilter: 'all' | 'Single' | 'Mess' | 'Shared' | 'Sublet'
  setTypeFilter: (value: 'all' | 'Single' | 'Mess' | 'Shared' | 'Sublet') => void
  distFilter: 'all' | '0.5' | '1' | '2'
  setDistFilter: (value: 'all' | '0.5' | '1' | '2') => void
  maxPrice: number
  setMaxPrice: (value: number) => void
  additionalFilters: string[]
  toggleAdditionalFilter: (f: string) => void
  openStudentListing: (listing: Listing) => void
  openChatWith: (landlordName: string) => void
  toggleFavorite: (id: number) => void
  hasApplied: (id: number) => boolean
  setApplyListing: (listing: Listing | null) => void
  setPage: (page: StudentPage) => void
}

export default function BrowsePage({
  filteredListings,
  favorites,
  typeFilter,
  setTypeFilter,
  distFilter,
  setDistFilter,
  maxPrice,
  setMaxPrice,
  additionalFilters,
  toggleAdditionalFilter,
  openStudentListing,
  openChatWith,
  toggleFavorite,
  hasApplied,
  setApplyListing,
  setPage,
}: BrowsePageProps) {
  return (
    <div className="flex gap-0 -mx-6 -mb-6">
      <aside className="w-64 bg-white border-r border-gray-200 p-5 space-y-5 overflow-y-auto flex-shrink-0">
        <div className="font-bold text-[#1a1a18] text-base">Filters</div>
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Property Type</div>
          <div className="grid grid-cols-2 gap-2">
            {([['Single', '🏠'], ['Shared', '🏘'], ['Mess', '🏢'], ['Sublet', '🔑']] as [string, string][]).map(([t, icon]) => (
              <button key={t} onClick={() => setTypeFilter(typeFilter === t ? 'all' : t as typeof typeFilter)} className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${typeFilter === t ? 'bg-[#111827] text-white border-[#111827]' : 'border-gray-200 text-gray-600 hover:border-[#111827]'}`}>
                <span className="text-lg">{icon}</span>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Max Distance</div>
          <div className="space-y-1.5">
            {([['all', 'Any distance'], ['0.5', '≤ 0.5 km'], ['1', '≤ 1 km'], ['2', '≤ 2 km']] as const).map(([val, label]) => (
              <label key={val} className="flex items-center gap-2.5 cursor-pointer" onClick={() => setDistFilter(val)}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${distFilter === val ? 'border-[#111827]' : 'border-gray-300'}`}>
                  {distFilter === val && <div className="w-2 h-2 bg-[#111827] rounded-full" />}
                </div>
                <span className="text-sm text-gray-600">{label}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Max Price: ৳{maxPrice.toLocaleString()}</div>
          <input type="range" min={2000} max={12000} step={500} value={maxPrice} onChange={e => setMaxPrice(parseInt(e.target.value))} className="w-full accent-[#111827]" />
          <div className="flex justify-between text-xs text-gray-400 mt-1"><span>৳2,000</span><span>৳12,000</span></div>
        </div>
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Conveniences</div>
          <div className="space-y-2">
            {['AC', 'WiFi', 'Parking'].map(f => (
              <label key={f} className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={additionalFilters.includes(f)} onChange={() => toggleAdditionalFilter(f)} className="accent-[#111827]" />
                <span className="text-sm text-gray-600">{f}</span>
              </label>
            ))}
          </div>
        </div>
        <button onClick={() => { setTypeFilter('all'); setDistFilter('all'); setMaxPrice(8000) }} className="w-full text-xs border border-gray-200 text-gray-500 py-2 rounded-xl hover:bg-gray-50 transition-colors">Reset Filters</button>
      </aside>
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3 z-10 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#111827]">{filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''} found</span>
          <span className="text-xs text-gray-400">Near UIU campus</span>
        </div>
        <div className="p-5 space-y-3">
          {filteredListings.map(l => (
            <div key={l.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden flex cursor-pointer hover:shadow-md transition-all group" onClick={() => openStudentListing(l)}>
              <img src={l.image} className="w-40 h-32 object-cover flex-shrink-0 group-hover:scale-[1.03] transition-transform" alt={l.title} />
              <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                <div>
                  <div className="font-semibold text-sm text-[#111827]">{l.title}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">📍 {l.distance} from UIU</div>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{l.type}</span>
                    {l.facilities.slice(0, 3).map(f => <span key={f} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{f}</span>)}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-[#111827]">৳{l.price.toLocaleString()}<span className="text-xs font-normal text-gray-400">/mo</span></span>
                  <div className="flex items-center gap-1.5">
                    <button title="Chat with landlord" onClick={e => { e.stopPropagation(); openChatWith(l.landlord) }} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:border-[#111827] hover:text-[#111827] transition-colors">💬</button>
                    <button title={favorites.includes(l.id) ? 'Remove from saved' : 'Save property'} onClick={e => { e.stopPropagation(); toggleFavorite(l.id) }} className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${favorites.includes(l.id) ? 'bg-red-50 border-red-300 text-red-500' : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400'}`}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill={favorites.includes(l.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                    </button>
                    <button disabled={hasApplied(l.id) || l.status === 'occupied'} onClick={e => { e.stopPropagation(); if (!hasApplied(l.id) && l.status !== 'occupied') { setApplyListing(l); setPage('apply-form') } }} className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${hasApplied(l.id) ? 'bg-emerald-50 text-emerald-700' : l.status === 'occupied' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#111827] text-white hover:bg-[#1f2937]'}`}>
                      {hasApplied(l.id) ? '✓ Applied' : l.status === 'occupied' ? 'Occupied' : 'Apply'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredListings.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">🔍</div>
              <div className="font-semibold">No listings match your filters</div>
              <div className="text-sm mt-1">Try adjusting distance, price, or room type</div>
            </div>
          )}
        </div>
      </div>
      <div className="w-72 border-l border-gray-200 bg-white flex flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Campus Map</div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          {(() => {
            const pinPos: Record<number, { x: number; y: number }> = { 1: { x: 42, y: 38 }, 2: { x: 57, y: 43 }, 3: { x: 65, y: 30 }, 4: { x: 36, y: 58 }, 5: { x: 72, y: 52 }, 6: { x: 48, y: 62 } }
            return (
              <>
                <svg viewBox="0 0 100 100" className="w-full rounded-xl bg-gray-100 border border-gray-200" style={{ minHeight: 220 }}>
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#c8ddd9" strokeWidth="1.5" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#c8ddd9" strokeWidth="1.5" />
                  <line x1="25" y1="0" x2="25" y2="100" stroke="#d8e8e5" strokeWidth="0.6" />
                  <line x1="75" y1="0" x2="75" y2="100" stroke="#d8e8e5" strokeWidth="0.6" />
                  <line x1="0" y1="25" x2="100" y2="25" stroke="#d8e8e5" strokeWidth="0.6" />
                  <line x1="0" y1="75" x2="100" y2="75" stroke="#d8e8e5" strokeWidth="0.6" />
                  <rect x="40" y="40" width="20" height="20" rx="2" fill="#1a1a18" opacity="0.2" />
                  <text x="50" y="52.5" textAnchor="middle" fontSize="3.5" fill="#1a1a18" fontWeight="bold">UIU</text>
                  <circle cx="50" cy="50" r="8" fill="none" stroke="#1a1a18" strokeWidth="0.4" strokeDasharray="2 1" opacity="0.5" />
                  <circle cx="50" cy="50" r="16" fill="none" stroke="#1a1a18" strokeWidth="0.4" strokeDasharray="2 1" opacity="0.35" />
                  <circle cx="50" cy="50" r="24" fill="none" stroke="#1a1a18" strokeWidth="0.4" strokeDasharray="2 1" opacity="0.2" />
                  {filteredListings.map(l => {
                    const pin = pinPos[l.id]
                    if (!pin) return null
                    return (
                      <g key={l.id} className="cursor-pointer" onClick={() => openStudentListing(l)}>
                        <circle cx={pin.x} cy={pin.y} r="5.5" fill="#111827" stroke="white" strokeWidth="1" />
                        <text x={pin.x} y={pin.y + 1.5} textAnchor="middle" fontSize="2.8" fill="white" fontWeight="bold">৳{Math.round(l.price / 1000)}k</text>
                      </g>
                    )
                  })}
                </svg>
                <div className="mt-3 space-y-2">
                  {filteredListings.slice(0, 5).map(l => (
                    <div key={l.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-lg" onClick={() => openStudentListing(l)}>
                      <div className="w-2 h-2 bg-[#111827] rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-[#111827] truncate">{l.title}</div>
                        <div className="text-[10px] text-gray-400">{l.distance} · ৳{l.price.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          })()}
        </div>
        <div className="p-4 border-t border-gray-100">
          <div className="bg-[#111827] text-white text-xs text-center rounded-xl py-2.5 font-semibold">{filteredListings.length} properties near UIU</div>
        </div>
      </div>
    </div>
  )
}
