import type { Listing } from '../../types'
import type { LandlordPage } from './Sidebar'
import ListingCard from '../../components/ListingCard'

type ListingsPageProps = {
  myListings: Listing[]
  openLandlordListing: (listing: Listing) => void
  openEdit: (id: number) => void
  setPage: (page: LandlordPage) => void
}

export default function ListingsPage({ myListings, openLandlordListing, openEdit, setPage }: ListingsPageProps) {
  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">My Listings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your active properties</p>
        </div>
        <button onClick={() => setPage('add-listing')} className="bg-[#111827] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1f2937] transition-colors shadow-sm">+ Add Listing</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {myListings.map(listing => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onView={() => openLandlordListing(listing)}
            actions={<button onClick={() => openEdit(listing.id)} className="text-xs text-[#1a1a18] font-semibold hover:underline">Edit</button>}
          />
        ))}
      </div>
    </>
  )
}
