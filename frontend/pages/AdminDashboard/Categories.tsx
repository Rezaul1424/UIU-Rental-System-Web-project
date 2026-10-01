import { Badge } from '../../components/ui'
import type { AdminCategory, AdminListing, AdminModerationStatus } from '../../api/admin'

type CategoriesPageProps = {
  listings: AdminListing[]
  categories: AdminCategory[]
  newCat: string
  setNewCat: React.Dispatch<React.SetStateAction<string>>
  isLoading: boolean
  onCreateCategory: (name: string) => Promise<void>
  onRenameCategory: (id: string, name: string) => Promise<void>
  onDeleteCategory: (id: string) => Promise<void>
  onAssignCategory: (identifier: string, categoryId: number | null) => Promise<void>
  onModerateListing: (identifier: string, status: AdminModerationStatus) => Promise<void>
  catSearch: string
  setCatSearch: React.Dispatch<React.SetStateAction<string>>
  catFilter: string
  setCatFilter: React.Dispatch<React.SetStateAction<string>>
  catSort: 'title' | 'price' | 'status'
  setCatSort: React.Dispatch<React.SetStateAction<'title' | 'price' | 'status'>>
  openAdminListing: (listing: AdminListing) => void
}

const moderationActions: Record<AdminModerationStatus, { label: string; status: AdminModerationStatus }[]> = {
  draft: [{ label: 'Submit for review', status: 'pending' }, { label: 'Archive', status: 'archived' }],
  pending: [{ label: 'Approve', status: 'approved' }, { label: 'Reject', status: 'rejected' }, { label: 'Archive', status: 'archived' }],
  approved: [{ label: 'Suspend', status: 'suspended' }, { label: 'Archive', status: 'archived' }],
  rejected: [{ label: 'Resubmit', status: 'pending' }, { label: 'Archive', status: 'archived' }],
  suspended: [{ label: 'Restore', status: 'approved' }, { label: 'Archive', status: 'archived' }],
  archived: [],
}

export default function CategoriesPage({ listings, categories, newCat, setNewCat, isLoading, onCreateCategory, onRenameCategory, onDeleteCategory, onAssignCategory, onModerateListing, catSearch, setCatSearch, catFilter, setCatFilter, catSort, setCatSort, openAdminListing }: CategoriesPageProps) {
  const submitCategory = () => {
    const name = newCat.trim()
    if (!name) return
    void onCreateCategory(name)
  }
  const filteredListings = listings
    .filter(listing => catFilter === 'all' || String(listing.categoryId ?? '') === catFilter || categories.find(category => category.id === catFilter)?.name.toLowerCase() === listing.categoryName?.toLowerCase())
    .filter(listing => !catSearch || `${listing.title} ${listing.landlordName} ${listing.propertyCode}`.toLowerCase().includes(catSearch.toLowerCase()))
    .sort((a, b) => catSort === 'price' ? a.priceBDT - b.priceBDT : catSort === 'status' ? a.moderationStatus.localeCompare(b.moderationStatus) : a.title.localeCompare(b.title))

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Property Categories</h1>
        <p className="text-sm text-gray-500 mt-0.5">Add or remove room/property types used across all listings</p>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex gap-3 mb-6">
          <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submitCategory() }} placeholder="New category name…" className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18]" />
          <button onClick={submitCategory} disabled={!newCat.trim()} className="bg-[#111827] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1f2937] disabled:opacity-50 transition-colors">Add Category</button>
        </div>
        <div className="space-y-2">
          {categories.map(category => {
            const count = listings.filter(listing => listing.categoryId === Number(category.id) || listing.categoryName?.toLowerCase() === category.name.toLowerCase()).length
            return (
              <div key={category.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#1a1a18] rounded-full" />
                  <span className="font-medium text-sm text-[#1a1a18]">{category.name}</span>
                  <span className="text-xs text-gray-500">{count} listing{count !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { const name = window.prompt('Enter the new category name:', category.name); if (name?.trim()) void onRenameCategory(category.id, name.trim()) }} className="text-xs text-gray-600 hover:bg-gray-200 px-2 py-1 rounded transition-colors">Rename</button>
                  <button onClick={() => { if (window.confirm(`Delete category “${category.name}”?`)) void onDeleteCategory(category.id) }} className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors">Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="font-semibold text-[#1a1a18]">All Listings</div>
          <div className="flex-1" />
          <input value={catSearch} onChange={e => setCatSearch(e.target.value)} placeholder="Search listings…" className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#1a1a18] w-48" />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18] bg-white">
            <option value="all">All types</option>
            {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <select value={catSort} onChange={e => setCatSort(e.target.value as 'title' | 'price' | 'status')} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18] bg-white">
            <option value="title">Sort: Title</option>
            <option value="price">Sort: Price</option>
            <option value="status">Sort: Status</option>
          </select>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Property ID</th>
              <th className="text-left px-5 py-3">Title</th>
              <th className="text-left px-5 py-3">Landlord</th>
              <th className="text-left px-5 py-3">Category</th>
              <th className="text-left px-5 py-3">Availability</th>
              <th className="text-left px-5 py-3">Price</th>
              <th className="text-left px-5 py-3">Moderation</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-gray-500">Loading categories and listings…</td></tr>}
            {!isLoading && filteredListings.length === 0 && <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-gray-400">No listings match the filters</td></tr>}
            {!isLoading && filteredListings.map(listing => (
                <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-gray-400">{listing.propertyCode}</td>
                  <td className="px-5 py-3 font-medium text-[#1a1a18] max-w-[180px] truncate">{listing.title}</td>
                  <td className="px-5 py-3 text-gray-600">{listing.landlordName}</td>
                  <td className="px-5 py-3">
                    <select
                      aria-label={`Category for ${listing.title}`}
                      value={listing.categoryId == null ? '' : String(listing.categoryId)}
                      onChange={event => void onAssignCategory(listing.propertyCode, event.target.value ? Number(event.target.value) : null)}
                      className="max-w-36 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs"
                    >
                      <option value="">Uncategorized</option>
                      {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3"><Badge variant={listing.availabilityStatus === 'available' ? 'success' : 'warning'}>{listing.availabilityStatus}</Badge></td>
                  <td className="px-5 py-3 font-mono text-sm font-semibold text-[#1a1a18]">৳{listing.priceBDT.toLocaleString()}</td>
                  <td className="px-5 py-3"><Badge variant={listing.moderationStatus === 'approved' ? 'success' : listing.moderationStatus === 'pending' ? 'warning' : 'danger'}>{listing.moderationStatus}</Badge></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openAdminListing(listing)} className="text-xs font-semibold text-[#111827] hover:underline">View</button>
                      {moderationActions[listing.moderationStatus].map(action => <button key={action.status} onClick={() => void onModerateListing(listing.propertyCode, action.status)} className="text-xs font-semibold text-[#111827] hover:underline">{action.label}</button>)}
                    </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
