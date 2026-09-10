import type { ReactElement } from 'react'
import type { Listing } from '../../../types'
import type { Application, AppStatus, StudentPage } from '../types'

type ApplicationsPageProps = {
  applications: Application[]
  listings: Listing[]
  statusBadge: (status: AppStatus) => ReactElement
  cancelApplication: (listingId: number) => void
  setPage: (page: StudentPage) => void
}

export default function ApplicationsPage({ applications, listings, statusBadge, cancelApplication, setPage }: ApplicationsPageProps) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">My Applications</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track and manage your rental applications</p>
      </div>
      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 px-6 text-center shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-3xl">📋</div>
          <div className="text-lg font-semibold text-[#1a1a18]">No applications yet</div>
          <div className="mt-1 max-w-sm text-sm text-gray-500">Browse listings and apply to get started with your rental journey.</div>
          <button onClick={() => setPage('browse')} className="mt-5 rounded-xl bg-[#1a1a18] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#333]">Browse Listings</button>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => {
            const l = listings.find(l => l.id === app.listingId)
            if (!l) return null
            return (
              <div key={app.listingId} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-14 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={l.image} alt={l.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#1a1a18] text-sm">{l.title}</div>
                    <div className="text-xs text-gray-500">{l.landlord} · ৳{l.price.toLocaleString()}/mo · Applied {app.date}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {statusBadge(app.status)}
                    {app.status === 'under-review' && (
                      <button onClick={() => cancelApplication(app.listingId)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">Cancel</button>
                    )}
                  </div>
                </div>
                {app.status === 'cancelled' && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-1.5">
                    <span>⚠</span> Application withdrawn — you may re-apply to this listing.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
