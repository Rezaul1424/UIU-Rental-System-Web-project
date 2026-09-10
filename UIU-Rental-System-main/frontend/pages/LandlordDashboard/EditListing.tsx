import { InteractiveMap } from '../../components/Map'
import type { Dispatch, SetStateAction } from 'react'
import type { Listing } from '../../types'
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

type EditListingPageProps = {
  editListingId: number | null
  myListings: Listing[]
  editForm: { title: string; type: string; price: string; distance: string; description: string }
  setEditForm: Dispatch<SetStateAction<{ title: string; type: string; price: string; distance: string; description: string }>>
  editFacilities: string[]
  toggleEditFacility: (facility: string) => void
  editAddrForm: AddressForm
  handleEditAddrChange: (field: keyof AddressForm, value: string) => void
  editMapPin: { x: number; y: number } | null
  editMapKm: string
  editAddrSyncing: boolean
  handleEditMapPin: (pin: { x: number; y: number }) => void
  roomCounts: RoomCounts
  roomSizeInputs: Record<string, string[]>
  updateRoomCount: (room: keyof RoomCounts, count: number) => void
  totalSize: string
  setTotalSize: Dispatch<SetStateAction<string>>
  maxTenants: string
  setMaxTenants: Dispatch<SetStateAction<string>>
  parkingAvail: 'none' | 'motorcycle' | 'car' | 'both'
  setParkingAvail: Dispatch<SetStateAction<'none' | 'motorcycle' | 'car' | 'both'>>
  isEditDirty: boolean
  setShowDiscardEditConfirm: Dispatch<SetStateAction<boolean>>
  setShowRemoveListingConfirm: Dispatch<SetStateAction<boolean>>
  setPage: (page: LandlordPage) => void
}

export default function EditListingPage({
  editListingId,
  myListings,
  editForm,
  setEditForm,
  editFacilities,
  toggleEditFacility,
  editAddrForm,
  handleEditAddrChange,
  editMapPin,
  editMapKm,
  editAddrSyncing,
  handleEditMapPin,
  roomCounts,
  roomSizeInputs,
  updateRoomCount,
  totalSize,
  setTotalSize,
  maxTenants,
  setMaxTenants,
  parkingAvail,
  setParkingAvail,
  isEditDirty,
  setShowDiscardEditConfirm,
  setShowRemoveListingConfirm,
  setPage,
}: EditListingPageProps) {
  const orig = editListingId === null ? null : myListings.find(l => l.id === editListingId)
  if (!orig) return null

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Edit Listing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Update any details for this property</p>
        </div>
        <button onClick={() => (isEditDirty ? setShowDiscardEditConfirm(true) : setPage('listings'))} className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-xl hover:bg-white transition-colors">← Back</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="font-semibold text-[#1a1a18]">Property Details</div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Listing Title</label>
            <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Room Type</label>
            <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18] bg-white">
              {['Single', 'Shared', 'Mess', 'Sublet'].map(type => <option key={type}>{type}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Monthly Rent (৳)</label>
              <input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Distance (km)</label>
              <input type="number" value={editForm.distance} onChange={e => setEditForm(f => ({ ...f, distance: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18] resize-none" />
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</div>
              {editAddrSyncing && <span className="text-xs text-sky-600 font-medium animate-pulse">Syncing…</span>}
              {editMapPin && !editAddrSyncing && <span className="text-xs text-emerald-600 font-medium">✓ Map synced</span>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Street / Road</label>
              <input value={editAddrForm.street} onChange={e => handleEditAddrChange('street', e.target.value)} placeholder="e.g. Road 4, Block B" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Area / Neighbourhood</label>
              <input value={editAddrForm.area} onChange={e => handleEditAddrChange('area', e.target.value)} placeholder="e.g. Badda, Vatara" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18]" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">City</label>
                <input value={editAddrForm.city} onChange={e => handleEditAddrChange('city', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">District</label>
                <input value={editAddrForm.district} onChange={e => handleEditAddrChange('district', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Postal</label>
                <input value={editAddrForm.postal} onChange={e => handleEditAddrChange('postal', e.target.value)} placeholder="1212" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18]" />
              </div>
            </div>
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
                            onChange={e => {
                              const next = roomSizeInputs[room] ? [...roomSizeInputs[room]] : []
                              next[index] = e.target.value
                              setEditForm(f => ({ ...f }))
                            }}
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
                <input type="number" value={totalSize} onChange={e => setTotalSize(e.target.value)} placeholder={orig.totalSize ? String(orig.totalSize) : 'e.g. 450'} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Tenants</label>
                <input type="number" value={maxTenants} onChange={e => setMaxTenants(e.target.value)} placeholder={orig.roommateCapacity ? String(orig.roommateCapacity) : 'e.g. 2'} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18]" />
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
                <button key={facility} type="button" onClick={() => toggleEditFacility(facility)} className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${editFacilities.includes(facility) ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#111827]'}`}>
                  {facility}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Property Images</label>
            <div className="relative rounded-xl overflow-hidden h-28 mb-2">
              <img src={orig.image} alt={orig.title} className="w-full h-full object-cover" />
              <button className="absolute bottom-2 right-2 bg-white/90 text-xs text-[#1a1a18] px-2.5 py-1 rounded-lg shadow text-[11px] font-medium hover:bg-white transition-colors">Replace main photo</button>
            </div>
            <div className="space-y-2">
              {['Bedroom', 'Living Room', 'Bathroom', 'Kitchen', 'Balcony'].map(area => (
                <div key={area} className="flex items-center gap-3 border border-dashed border-gray-200 rounded-xl px-4 py-2.5 hover:border-[#1a1a18] cursor-pointer transition-colors">
                  <span className="text-sm">📸</span>
                  <div className="flex-1 text-xs text-gray-400">{area} — click to replace</div>
                  <span className="text-[10px] text-gray-300">JPG, PNG</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setPage('listings')} className="flex-1 bg-[#111827] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#1f2937] transition-colors shadow-sm">Save Changes</button>
            <button onClick={() => (isEditDirty ? setShowDiscardEditConfirm(true) : setPage('listings'))} className="border border-gray-200 text-gray-500 text-sm font-semibold py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="font-semibold text-[#1a1a18] mb-1">Listing Status</div>
            <div className="space-y-2 mt-3">
              {(['available', 'occupied', 'unavailable'] as const).map(status => (
                <label key={status} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${orig.status === status ? 'border-[#1a1a18]' : 'border-gray-200'}`}>
                    {orig.status === status && <div className="w-2 h-2 bg-[#1a1a18] rounded-full" />}
                  </div>
                  <span className="text-sm capitalize text-[#1a1a18]">{status}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Property ID</div>
            <div className="font-mono text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-xl">{orig.propertyId ?? `UIU-${1000 + orig.id}`}</div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="font-semibold text-[#1a1a18] text-sm">Map Location</div>
            <p className="text-xs text-gray-400">Click the map to pin your property location, or fill in the address above.</p>
            <InteractiveMap onPin={handleEditMapPin} pin={editMapPin} />
            {editMapPin && (
              <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Detected Address</div>
                {[
                  ['Street', editAddrForm.street],
                  ['Area', editAddrForm.area],
                  ['City', editAddrForm.city],
                  ['Postal', editAddrForm.postal],
                  ['Distance', editMapKm],
                ].filter(([, value]) => value).map(([label, value]) => (
                  <div key={label} className="flex justify-between text-xs"><span className="text-gray-400">{label}</span><span className="text-[#1a1a18] font-medium">{value}</span></div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-amber-700 mb-1">Danger Zone</div>
            <p className="text-xs text-amber-600 mb-3">Removing a listing will notify all applicants and cannot be undone.</p>
            <button onClick={() => setShowRemoveListingConfirm(true)} className="text-xs border border-red-300 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors font-medium">Remove listing</button>
          </div>
        </div>
      </div>
    </>
  )
}
