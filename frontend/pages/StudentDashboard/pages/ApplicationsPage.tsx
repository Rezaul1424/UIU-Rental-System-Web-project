import type { ReactElement } from 'react'
import type { Listing } from '../../../types'
import type { Application, AppStatus, StudentPage } from '../types'

type ApplicationsPageProps = {
  applications: Application[]
  listings: Listing[]
  statusBadge: (status: AppStatus) => ReactElement
  cancelApplication: (app: Application) => void
  onReApply: (app: Application) => void
  onViewListing?: (app: Application) => void
  setPage: (page: StudentPage) => void
}

export default function ApplicationsPage({ applications, listings, statusBadge, cancelApplication, onReApply, onViewListing, setPage }: ApplicationsPageProps) {
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
          {applications.map((app, idx) => {
            const l = listings.find(l => l.id === app.listingId || String(l.id) === app.propertyId || l.propertyId === app.propertyId)
            const rawTitle = app.propertyTitle || l?.title || (app.propertyId ? (/^property\b/i.test(app.propertyId) ? app.propertyId : `Property ${app.propertyId}`) : `Application #${app.id ?? idx + 1}`)
            const displayTitle = rawTitle.replace(/^(Property\s+)+/i, 'Property ')
            const displayImage = l?.image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=380&fit=crop&auto=format'
            const displayLandlord = l?.landlord || 'Landlord'
            const displayPrice = l?.price ?? 0
            return (
              <div key={app.id || `${app.listingId}-${app.propertyId}-${idx}`} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => onViewListing?.(app)}
                    className="w-16 h-14 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <img src={displayImage} alt={displayTitle} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      onClick={() => onViewListing?.(app)}
                      className="font-semibold text-[#1a1a18] text-sm cursor-pointer hover:text-sky-700 transition-colors truncate"
                    >
                      {displayTitle}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{displayLandlord}{displayPrice > 0 ? ` · ৳${displayPrice.toLocaleString()}/mo` : ''} · Applied {app.date}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {statusBadge(app.status)}
                    {app.status === 'under-review' && (
                      <button onClick={() => cancelApplication(app)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">Cancel</button>
                    )}
                    {app.status === 'cancelled' && (
                      <button onClick={() => onReApply(app)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#111827] text-[#111827] hover:bg-gray-50 transition-colors">Re-apply</button>
                    )}
                  </div>
                </div>
                {app.status === 'cancelled' && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-1.5">
                    <span>⚠</span> Application withdrawn — click Re-apply to submit a new application.
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
