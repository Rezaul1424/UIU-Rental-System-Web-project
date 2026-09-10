import type { Listing } from '../../types'
import type { LandlordPage } from './Sidebar'
import type { MaintReq, RequestItem } from './types'
import { Stat } from '../../components/ui'

type OverviewPageProps = {
  userName: string
  myListings: Listing[]
  mReqs: MaintReq[]
  pendingRequests: number
  requests: RequestItem[]
  setPage: (page: LandlordPage) => void
  openLandlordListing: (listing: Listing) => void
}

export default function OverviewPage({ userName, myListings, mReqs, pendingRequests, requests, setPage, openLandlordListing }: OverviewPageProps) {
  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium mb-0.5">Welcome back 👋</p>
          <h1 className="text-2xl font-bold text-[#111827]">{userName}'s Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Here's what's happening across your properties today</p>
        </div>
        <button onClick={() => setPage('add-listing')} className="bg-[#111827] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1f2937] transition-colors shadow-sm">+ Add Listing</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Total Properties" value={myListings.length} sub={`${myListings.filter(l => l.status === 'available').length} available`} icon="🏠" />
        <Stat label="Active Tenants" value={2} sub="All rent current" icon="👥" />
        <Stat label="Monthly Revenue" value="৳12,500" sub="Aug 2026 projected" icon="💰" />
        <Stat label="Open Maintenance" value={mReqs.filter(m => m.stage < 5).length} sub="Needs attention" icon="🔧" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="font-semibold text-[#111827]">My Properties</div>
              <button onClick={() => setPage('listings')} className="text-xs text-gray-400 hover:text-[#111827] transition-colors">View all →</button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-2.5 text-left font-semibold">Property</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Type</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Rent</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Status</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Tenant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {myListings.map((listing, index) => (
                  <tr key={listing.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openLandlordListing(listing)}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-[#111827] truncate max-w-[180px]">{listing.title}</div>
                      <div className="text-xs text-gray-400">{listing.distance} from UIU</div>
                    </td>
                    <td className="px-3 py-3 text-gray-500">{listing.type}</td>
                    <td className="px-3 py-3 font-semibold text-[#111827]">৳{listing.price.toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${listing.status === 'occupied' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {listing.status === 'occupied' ? 'Occupied' : 'Available'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-400 text-xs">{index === 0 ? 'Tanvir Ahmed' : index === 1 ? 'Sumaiya Islam' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-[#111827]">Rent Collection — Aug 2026</div>
              <button onClick={() => setPage('rent')} className="text-xs text-gray-400 hover:text-[#111827] transition-colors">View tracker →</button>
            </div>
            <div className="space-y-3">
              {[
                { tenant: 'Tanvir Ahmed', property: 'Studio near Gate 3', amount: 4200, status: 'paid', date: '1 Aug' },
                { tenant: 'Sadia Islam', property: '2BR Flat — South Campus', amount: 6500, status: 'paid', date: '2 Aug' },
                { tenant: 'Pending', property: 'Shared Mess — North Block', amount: 2800, status: 'pending', date: 'Due 5 Aug' },
              ].map(r => (
                <div key={r.tenant} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.status === 'paid' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#111827] truncate">{r.tenant}</div>
                    <div className="text-xs text-gray-400 truncate">{r.property}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-[#111827]">৳{r.amount.toLocaleString()}</div>
                    <div className={`text-[10px] font-semibold ${r.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{r.date}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">Total collected</span>
              <span className="font-bold text-[#111827]">৳10,700 <span className="text-xs font-normal text-gray-400">/ ৳13,500</span></span>
            </div>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: '79%' }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="font-semibold text-[#111827] mb-4">Recent Activity</div>
            <div className="space-y-0">
              {[
                { date: '9 Aug', icon: '📬', text: 'Rifat Hassan applied for Studio near Gate 3', color: 'bg-amber-50 text-amber-600' },
                { date: '7 Aug', icon: '💳', text: 'Rent received from Sadiya Islam — ৳6,500', color: 'bg-emerald-50 text-emerald-600' },
                { date: '5 Aug', icon: '🔧', text: 'Maintenance request: Water leak in bathroom', color: 'bg-sky-50 text-sky-600' },
                { date: '1 Aug', icon: '💳', text: 'Rent received from Tanvir Ahmed — ৳4,200', color: 'bg-emerald-50 text-emerald-600' },
                { date: '28 Jul', icon: '✅', text: 'Listing "2BR Flat — South Campus" marked occupied', color: 'bg-gray-50 text-gray-500' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${activity.color}`}>{activity.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#111827]">{activity.text}</div>
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{activity.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-[#111827]">Rental Requests</div>
              {pendingRequests > 0 && <span className="text-[11px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{pendingRequests} pending</span>}
            </div>
            <div className="space-y-2.5">
              {requests.slice(0, 3).map(req => (
                <div key={req.id} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">{req.student[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#111827] truncate">{req.student}</div>
                    <div className="text-xs text-gray-400 truncate">{req.listing}</div>
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${req.status === 'pending' ? 'bg-amber-100 text-amber-700' : req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>{req.status}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setPage('requests')} className="mt-3 w-full text-xs text-center text-gray-400 hover:text-[#111827] py-1 transition-colors">View all requests →</button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-[#111827]">Maintenance</div>
              <button onClick={() => setPage('maintenance')} className="text-xs text-gray-400 hover:text-[#111827] transition-colors">View all →</button>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Open', count: mReqs.filter(m => m.stage === 0).length, color: 'bg-red-400' },
                { label: 'In Progress', count: mReqs.filter(m => m.stage > 0 && m.stage < 5).length, color: 'bg-amber-400' },
                { label: 'Completed', count: mReqs.filter(m => m.stage >= 5).length, color: 'bg-emerald-400' },
              ].map(summary => (
                <div key={summary.label} className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${summary.color}`} />
                  <div className="flex-1 text-sm text-gray-600">{summary.label}</div>
                  <div className="font-bold text-[#111827] text-sm">{summary.count}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
              {mReqs.length > 0 && (
                <>
                  <div className="h-full bg-red-400 rounded-l-full" style={{ width: `${(mReqs.filter(m => m.stage === 0).length / mReqs.length) * 100}%` }} />
                  <div className="h-full bg-amber-400" style={{ width: `${(mReqs.filter(m => m.stage > 0 && m.stage < 5).length / mReqs.length) * 100}%` }} />
                  <div className="h-full bg-emerald-400 rounded-r-full" style={{ width: `${(mReqs.filter(m => m.stage >= 5).length / mReqs.length) * 100}%` }} />
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="font-semibold text-[#111827] mb-3">Quick Actions</div>
            <div className="space-y-1">
              {[
                { label: '➕ Add new listing', action: () => setPage('add-listing') },
                { label: '📬 Review requests', action: () => setPage('requests'), badge: pendingRequests },
                { label: '💳 Rent tracker', action: () => setPage('rent') },
                { label: '🔧 Maintenance', action: () => setPage('maintenance'), badge: mReqs.filter(m => m.stage < 5).length },
                { label: '💬 Chat with tenants', action: () => setPage('chat') },
              ].map(item => (
                <button key={item.label} onClick={item.action} className="w-full flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-gray-50 text-sm text-left transition-colors text-[#1a1a18]">
                  <span className="flex-1">{item.label}</span>
                  {'badge' in item && item.badge ? <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{item.badge}</span> : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
