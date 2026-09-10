import type { Listing } from '../../types'
import { Badge } from '../../components/ui'

type CategoriesPageProps = {
  listings: Listing[]
  categories: string[]
  setCategories: React.Dispatch<React.SetStateAction<string[]>>
  newCat: string
  setNewCat: React.Dispatch<React.SetStateAction<string>>
  catSearch: string
  setCatSearch: React.Dispatch<React.SetStateAction<string>>
  catFilter: string
  setCatFilter: React.Dispatch<React.SetStateAction<string>>
  catSort: 'title' | 'price' | 'status'
  setCatSort: React.Dispatch<React.SetStateAction<'title' | 'price' | 'status'>>
  openAdminListing: (listing: Listing) => void
}

export default function CategoriesPage({ listings, categories, setCategories, newCat, setNewCat, catSearch, setCatSearch, catFilter, setCatFilter, catSort, setCatSort, openAdminListing }: CategoriesPageProps) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Property Categories</h1>
        <p className="text-sm text-gray-500 mt-0.5">Add or remove room/property types used across all listings</p>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex gap-3 mb-6">
          <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newCat.trim()) { setCategories(c => [...c, newCat.trim()]); setNewCat('') } }} placeholder="New category name…" className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18]" />
          <button onClick={() => { if (newCat.trim()) { setCategories(c => [...c, newCat.trim()]); setNewCat('') } }} className="bg-[#111827] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1f2937] transition-colors">Add Category</button>
        </div>
        <div className="space-y-2">
          {categories.map(cat => {
            const count = listings.filter(l => l.type === cat).length
            return (
              <div key={cat} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#1a1a18] rounded-full" />
                  <span className="font-medium text-sm text-[#1a1a18]">{cat}</span>
                  <span className="text-xs text-gray-500">{count} listing{count !== 1 ? 's' : ''}</span>
                </div>
                <button onClick={() => setCategories(cs => cs.filter(c => c !== cat))} className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors">Remove</button>
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
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
              <th className="text-left px-5 py-3">Type</th>
              <th className="text-left px-5 py-3">Beds</th>
              <th className="text-left px-5 py-3">Max Tenants</th>
              <th className="text-left px-5 py-3">Parking</th>
              <th className="text-left px-5 py-3">Price</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {listings
              .filter(l => catFilter === 'all' || l.type === catFilter)
              .filter(l => !catSearch || l.title.toLowerCase().includes(catSearch.toLowerCase()) || l.landlord.toLowerCase().includes(catSearch.toLowerCase()))
              .sort((a, b) => catSort === 'price' ? a.price - b.price : catSort === 'status' ? a.status.localeCompare(b.status) : a.title.localeCompare(b.title))
              .map(l => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-gray-400">{l.propertyId ?? `UIU-${1000 + l.id}`}</td>
                  <td className="px-5 py-3 font-medium text-[#1a1a18] max-w-[180px] truncate">{l.title}</td>
                  <td className="px-5 py-3 text-gray-600">{l.landlord}</td>
                  <td className="px-5 py-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{l.type}</span></td>
                  <td className="px-5 py-3 text-gray-600">{l.rooms?.bedroom ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{l.roommateCapacity ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{l.parking?.startsWith('Available') ? '✓' : '✗'} {l.parking ?? '—'}</td>
                  <td className="px-5 py-3 font-mono text-sm font-semibold text-[#1a1a18]">৳{l.price.toLocaleString()}</td>
                  <td className="px-5 py-3"><Badge variant={l.status === 'available' ? 'success' : 'warning'}>{l.status}</Badge></td>
                  <td className="px-5 py-3">
                    <button onClick={() => openAdminListing(l)} className="text-xs font-semibold text-[#111827] hover:underline">View</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {listings.filter(l => catFilter === 'all' || l.type === catFilter).filter(l => !catSearch || l.title.toLowerCase().includes(catSearch.toLowerCase()) || l.landlord.toLowerCase().includes(catSearch.toLowerCase())).length === 0 && <div className="text-center py-10 text-gray-400 text-sm">No listings match the filters</div>}
      </div>
    </>
  )
}
