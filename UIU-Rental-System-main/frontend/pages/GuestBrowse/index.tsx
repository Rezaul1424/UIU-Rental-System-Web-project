import { useState } from 'react'
import type { Modal, Listing } from '../../types'
import { listings } from '../../data'
import { Badge } from '../../components/ui'
import ListingDetailPage from '../../components/ListingDetail'
import { CampusMap } from '../../components/Map'

export default function GuestBrowse({ onModal }: { onModal: (m: Modal) => void }) {
  const [typeFilter, setTypeFilter] = useState<'all' | 'Single' | 'Mess' | 'Shared' | 'Sublet'>('all')
  const [viewListing, setViewListing] = useState<Listing | null>(null)
  const [distFilter, setDistFilter] = useState<'all' | '0.5' | '1' | '2'>('all')
  const [maxPrice, setMaxPrice] = useState(8000)
  const [additionalFilters, setAdditionalFilters] = useState<string[]>([])
  const [bedroomFilter, setBedroomFilter] = useState<'any' | '1' | '2' | '3' | '4+'>('any')
  const [roommateFilter, setRoommateFilter] = useState<'any' | '1' | '2' | '3' | '4+'>('any')

  const toggleAdditional = (f: string) =>
    setAdditionalFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])

  const filtered = listings.filter(l => {
    if (typeFilter !== 'all' && l.type !== typeFilter) return false
    if (distFilter !== 'all' && parseFloat(l.distance) > parseFloat(distFilter)) return false
    if (l.price > maxPrice) return false
    if (additionalFilters.includes('AC') && !l.facilities.includes('AC')) return false
    if (additionalFilters.includes('WiFi') && !l.facilities.includes('WiFi')) return false
    if (additionalFilters.includes('Parking') && !l.facilities.includes('Parking')) return false
    if (bedroomFilter !== 'any') {
      const beds = l.rooms?.bedroom ?? 0
      if (bedroomFilter === '4+' && beds < 4) return false
      else if (bedroomFilter !== '4+' && beds !== parseInt(bedroomFilter)) return false
    }
    if (roommateFilter !== 'any') {
      const cap = l.roommateCapacity ?? 0
      if (roommateFilter === '4+' && cap < 4) return false
      else if (roommateFilter !== '4+' && cap !== parseInt(roommateFilter)) return false
    }
    return true
  })

  if (viewListing) {
    return (
      <ListingDetailPage
        listing={viewListing}
        onBack={() => setViewListing(null)}
        backLabel="← Back to Listings"
        actions={
          <button onClick={() => onModal('signup')} className="w-full bg-[#111827] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#1f2937] transition-colors">
            Sign up to apply
          </button>
        }
      />
    )
  }

  // Pin positions on the map for each listing
  const pinPositions: Record<number, { x: number; y: number }> = {
    1: { x: 42, y: 38 }, 2: { x: 57, y: 43 }, 3: { x: 65, y: 30 },
    4: { x: 36, y: 58 }, 5: { x: 72, y: 52 }, 6: { x: 48, y: 62 },
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-gray-50">

      {/* ── Left: Filter Sidebar ── */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto p-5 space-y-6">
        <div className="font-bold text-[#1a1a18] text-base">Filters</div>

        {/* Property type */}
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Property type</div>
          <div className="grid grid-cols-2 gap-2">
            {(['Single', 'Shared', 'Mess', 'Sublet'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-semibold transition-all ${typeFilter === t ? 'border-[#1a1a18] bg-[#1a1a18] text-white' : 'border-gray-200 text-gray-600 hover:border-[#1a1a18]/40'}`}
              >
                <span className="text-lg">{t === 'Single' ? '🏠' : t === 'Shared' ? '🏘' : t === 'Mess' ? '🏢' : '🔑'}</span>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Max distance */}
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Max Distance from UIU</div>
          <div className="space-y-1.5">
            {([['all', 'Any distance'], ['0.5', '≤ 0.5 km'], ['1', '≤ 1 km'], ['2', '≤ 2 km']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setDistFilter(val)}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg border font-medium transition-all ${distFilter === val ? 'bg-[#1a1a18] text-white border-[#1a1a18]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1a1a18]/40'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Price range */}
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Max Price / month</div>
          <input
            type="range" min={2000} max={12000} step={500}
            value={maxPrice}
            onChange={e => setMaxPrice(Number(e.target.value))}
            className="w-full accent-[#1a1a18]"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>৳2,000</span>
            <span className="font-semibold text-[#1a1a18]">৳{maxPrice.toLocaleString()}</span>
            <span>৳12,000</span>
          </div>
        </div>

        {/* Additional conveniences */}
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Additional conveniences</div>
          <div className="space-y-2">
            {['AC', 'WiFi', 'Parking'].map(f => (
              <label key={f} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={additionalFilters.includes(f)}
                  onChange={() => toggleAdditional(f)}
                  className="w-4 h-4 accent-[#1a1a18] rounded"
                />
                <span className="text-sm text-gray-600">{f === 'Parking' ? 'Parking slot' : f}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Bedrooms */}
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Bedrooms</div>
          <div className="space-y-1.5">
            {([['any', 'Any'], ['1', '1 Bedroom'], ['2', '2 Bedrooms'], ['3', '3 Bedrooms'], ['4+', '4+ Bedrooms']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setBedroomFilter(val)}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg border font-medium transition-all ${bedroomFilter === val ? 'bg-[#1a1a18] text-white border-[#1a1a18]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1a1a18]/40'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tenant capacity */}
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tenant Capacity</div>
          <div className="space-y-1.5">
            {([['any', 'Any'], ['1', '1 Person'], ['2', '2 People'], ['3', '3 People'], ['4+', '4+ People']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setRoommateFilter(val)}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg border font-medium transition-all ${roommateFilter === val ? 'bg-[#1a1a18] text-white border-[#1a1a18]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1a1a18]/40'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={() => { setTypeFilter('all'); setDistFilter('all'); setMaxPrice(8000); setAdditionalFilters([]); setBedroomFilter('any'); setRoommateFilter('any') }}
          className="w-full text-xs text-gray-500 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Reset filters
        </button>
      </aside>

      {/* ── Center: Results list ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between z-10">
          <div className="text-sm font-semibold text-[#1a1a18]">
            Search results <span className="text-gray-400 font-normal">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2">
          </div>
        </div>

        {/* Listing rows */}
        <div className="p-4 space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-3">🔍</div>
              <div className="font-semibold text-gray-500">No listings match your filters</div>
              <div className="text-sm mt-1">Try adjusting the filters on the left</div>
            </div>
          )}
          {filtered.map(l => (
            <div
              key={l.id}
              onClick={() => setViewListing(l)}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden flex gap-0 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group"
            >
              {/* Photo */}
              <div className="w-44 flex-shrink-0 h-36 overflow-hidden">
                <img src={l.image} alt={l.title} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300" />
              </div>
              {/* Info */}
              <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-[#1a1a18] text-sm leading-snug truncate">{l.title}</div>
                    <Badge variant={l.status === 'available' ? 'success' : 'warning'}>{l.status}</Badge>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 1C4.07 1 2.5 2.57 2.5 4.5c0 2.81 3.5 6.5 3.5 6.5S9.5 7.31 9.5 4.5C9.5 2.57 7.93 1 6 1zm0 4.88a1.38 1.38 0 1 1 0-2.76 1.38 1.38 0 0 1 0 2.76z" fill="#9ca3af"/></svg>
                    {l.distance} from UIU campus
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{l.type}</span>
                    {l.facilities.slice(0, 3).map(f => (
                      <span key={f} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{f}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-base font-bold text-[#1a1a18]">৳{l.price.toLocaleString()}<span className="text-xs font-normal text-gray-400">/month</span></span>
                  <button
                    onClick={e => { e.stopPropagation(); onModal('signup') }}
                    className="text-xs font-semibold bg-[#1a1a18] text-white px-3 py-1.5 rounded-lg hover:bg-[#333] transition-colors"
                  >
                    Sign up to apply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Map ── */}
      <div className="w-80 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Map View — UIU Area</div>
        </div>
        <div className="flex-1 relative p-3">
          <div className="w-full h-full rounded-xl overflow-hidden relative" style={{ minHeight: 420 }}>
            <CampusMap pinX={50} pinY={45} label="UIU" color="#1a1a18" />
            {/* Overlay listing pins */}
            {filtered.map(l => {
              const pin = pinPositions[l.id] ?? { x: 50, y: 50 }
              return (
                <div
                  key={l.id}
                  onClick={() => setViewListing(l)}
                  className="absolute cursor-pointer group"
                  style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%,-100%)' }}
                >
                  <div className="bg-white border-2 border-[#1a1a18] rounded-lg px-2 py-0.5 text-[10px] font-bold text-[#1a1a18] whitespace-nowrap shadow-md group-hover:bg-[#1a1a18] group-hover:text-white transition-colors">
                    ৳{(l.price / 1000).toFixed(1)}k
                  </div>
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#1a1a18] mx-auto" />
                </div>
              )
            })}
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button onClick={() => onModal('signup')} className="w-full bg-[#111827] text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-[#1f2937] transition-colors">
            Create Account to Apply
          </button>
        </div>
      </div>

    </div>
  )
}
