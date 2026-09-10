import { InteractiveMap } from '../../components/Map'
import type { Dispatch, SetStateAction } from 'react'
import type { LandlordPage } from './Sidebar'

type AddressForm = {
  street: string
  area: string
  city: string
  district: string
  postal: string
}

type RoomCounts = {
  bedroom: number
  living: number
  bathroom: number
  kitchen: number
  veranda: number
}

type AddListingPageProps = {
  form: { title: string; type: string; price: string; description: string }
  setForm: Dispatch<SetStateAction<{ title: string; type: string; price: string; description: string }>>
  addrForm: AddressForm
  handleAddrChange: (field: keyof AddressForm, value: string) => void
  mapPin: { x: number; y: number } | null
  mapKm: string
  addrSyncing: boolean
  facilities: string[]
  toggleFacility: (facility: string) => void
  roomCounts: RoomCounts
  roomSizeInputs: Record<string, string[]>
  updateRoomCount: (room: keyof RoomCounts, count: number) => void
  totalSize: string
  setTotalSize: Dispatch<SetStateAction<string>>
  maxTenants: string
  setMaxTenants: Dispatch<SetStateAction<string>>
  parkingAvail: 'none' | 'motorcycle' | 'car' | 'both'
  setParkingAvail: Dispatch<SetStateAction<'none' | 'motorcycle' | 'car' | 'both'>>
  isAddDirty: boolean
  setShowDiscardAddConfirm: Dispatch<SetStateAction<boolean>>
  setPage: (page: LandlordPage) => void
  onPin: (pin: { x: number; y: number }) => void
}

export default function AddListingPage({
  form,
  setForm,
  addrForm,
  handleAddrChange,
  mapPin,
  mapKm,
  addrSyncing,
  facilities,
  toggleFacility,
  roomCounts,
  roomSizeInputs,
  updateRoomCount,
  totalSize,
  setTotalSize,
  maxTenants,
  setMaxTenants,
  parkingAvail,
  setParkingAvail,
  isAddDirty,
  setShowDiscardAddConfirm,
  setPage,
  onPin,
}: AddListingPageProps) {
  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Add New Listing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Enter an address or click the map — both stay in sync</p>
        </div>
        <button onClick={() => (isAddDirty ? setShowDiscardAddConfirm(true) : setPage('listings'))} className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-xl hover:bg-white transition-colors">← Back</button>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="font-semibold text-[#1a1a18]">Property Details</div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Listing Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Studio near Gate 3" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Room Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18] bg-white">
              {['Single', 'Shared', 'Mess', 'Sublet'].map(type => <option key={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Monthly Rent (৳)</label>
            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="4200" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18]" />
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Property Address</div>
              {addrSyncing && <span className="text-xs text-sky-600 font-medium animate-pulse">Syncing…</span>}
              {mapPin && !addrSyncing && <span className="text-xs text-emerald-600 font-medium">✓ Map synced</span>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Street / Road</label>
              <input value={addrForm.street} onChange={e => handleAddrChange('street', e.target.value)} placeholder="e.g. Road 4, Block B" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Area / Locality</label>
              <input value={addrForm.area} onChange={e => handleAddrChange('area', e.target.value)} placeholder="e.g. Badda, Vatara" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18]" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">City</label>
                <input value={addrForm.city} onChange={e => handleAddrChange('city', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">District</label>
                <input value={addrForm.district} onChange={e => handleAddrChange('district', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Postal</label>
                <input value={addrForm.postal} onChange={e => handleAddrChange('postal', e.target.value)} placeholder="1212" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18]" />
              </div>
            </div>
            {mapKm && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>📍</span>
                <span>Approx. <strong className="text-[#1a1a18]">{mapKm} km</strong> from UIU campus</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe the property…" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18] resize-none" />
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Room Breakdown</div>
            {(['bedroom', 'living', 'bathroom', 'kitchen', 'veranda'] as const).map(room => {
              const icons: Record<string, string> = { bedroom: '🛏', living: '🛋', bathroom: '🚿', kitchen: '🍳', veranda: '🌿' }
              const labels: Record<string, string> = { bedroom: 'Bedrooms', living: 'Living Rooms', bathroom: 'Bathrooms', kitchen: 'Kitchens', veranda: 'Balconies' }
              const count = roomCounts[room]
              return (
                <div key={room} className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#1a1a18]">{icons[room]} {labels[room]}</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateRoomCount(room, count - 1)} className="w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-100 text-lg leading-none">−</button>
                      <span className="w-6 text-center text-sm font-semibold">{count}</span>
                      <button type="button" onClick={() => updateRoomCount(room, count + 1)} className="w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-100 text-lg leading-none">+</button>
                    </div>
                  </div>
                  {count > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: count }).map((_, index) => (
                        <div key={index}>
                          <label className="block text-[10px] text-gray-400 mb-0.5">{labels[room].replace(/s$/, '')} {index + 1} size (sq ft)</label>
                          <input
                            type="number"
                            value={roomSizeInputs[room]?.[index] ?? ''}
                            onChange={() => setForm(f => ({ ...f }))}
                            placeholder="e.g. 120"
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#1a1a18]"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Additional Info</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Total Floor Size (sq ft)</label>
                <input type="number" value={totalSize} onChange={e => setTotalSize(e.target.value)} placeholder="e.g. 450" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Tenants</label>
                <input type="number" value={maxTenants} onChange={e => setMaxTenants(e.target.value)} placeholder="e.g. 2" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18]" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Parking</label>
              <div className="grid grid-cols-2 gap-2">
                {([['none', 'No Parking'], ['motorcycle', 'Motorcycle'], ['car', 'Car'], ['both', 'Car + Motorcycle']] as const).map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setParkingAvail(value)} className={`text-xs px-3 py-2 rounded-xl border font-medium transition-all ${parkingAvail === value ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#111827]'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Facilities</label>
            <div className="flex flex-wrap gap-2">
              {['AC', 'WiFi', 'Meals', 'Laundry', 'Parking', 'Generator', 'Lift', 'Gas', 'CCTV'].map(facility => (
                <button key={facility} type="button" onClick={() => toggleFacility(facility)} className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${facilities.includes(facility) ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#111827]'}`}>
                  {facility}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Property Images</label>
            <div className="space-y-2">
              {['Bedroom', 'Living Room', 'Bathroom', 'Kitchen', 'Balcony'].map(area => (
                <div key={area} className="flex items-center gap-3 border border-dashed border-gray-200 rounded-xl px-4 py-3 hover:border-[#1a1a18] cursor-pointer transition-colors">
                  <span className="text-sm">📸</span>
                  <div className="flex-1 text-xs text-gray-400">{area} — click to upload</div>
                  <span className="text-[10px] text-gray-300">JPG, PNG</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setPage('listings')} className="w-full bg-[#111827] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#1f2937] transition-colors shadow-sm">Publish Listing</button>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="font-semibold text-[#1a1a18] mb-1">Location on Map</div>
            <p className="text-xs text-gray-500 mb-3">
              Click to pin your property. The address fields will update automatically.
              Or type an address above to move the pin.
            </p>
            <InteractiveMap onPin={onPin} pin={mapPin} />
            <div className="mt-3 space-y-1">
              {mapPin ? (
                <>
                  <div className="text-xs text-[#1a1a18] font-semibold flex items-center gap-1.5">✓ Location pinned</div>
                  {addrForm.area && <div className="text-xs text-gray-500">{addrForm.area}, {addrForm.city} {addrForm.postal}</div>}
                </>
              ) : (
                <div className="text-xs text-gray-500">Click anywhere on the map to place a pin</div>
              )}
            </div>
          </div>
          {mapPin && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1.5 text-xs">
              <div className="font-semibold text-[#1a1a18] text-xs uppercase tracking-wider mb-2">Detected Address</div>
              {[
                ['Street', addrForm.street],
                ['Area', addrForm.area],
                ['City', addrForm.city],
                ['District', addrForm.district],
                ['Postal Code', addrForm.postal],
                ['Distance', mapKm ? `${mapKm} km from UIU` : '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <span className="text-gray-400 w-20 flex-shrink-0">{label}</span>
                  <span className="text-[#1a1a18] font-medium">{value || '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
