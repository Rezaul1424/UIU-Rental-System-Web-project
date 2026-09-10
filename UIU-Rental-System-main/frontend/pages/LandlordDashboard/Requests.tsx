import { Badge } from '../../components/ui'
import type { RequestItem } from './types'

type RequestsPageProps = {
  requests: RequestItem[]
  expandedRequestId: number | null
  setExpandedRequestId: (id: number | null) => void
  approveRequest: (id: number) => void
  rejectRequest: (id: number) => void
}

export default function RequestsPage({ requests, expandedRequestId, setExpandedRequestId, approveRequest, rejectRequest }: RequestsPageProps) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Rental Requests</h1>
        <p className="text-sm text-gray-500 mt-0.5">Approve or reject student applications for your properties</p>
      </div>
      <div className="space-y-3">
        {requests.map(request => {
          const isExpanded = expandedRequestId === request.id
          return (
            <div key={request.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-[#1a1a18] flex-shrink-0 text-sm">{request.student[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1a1a18]">{request.student}</span>
                    <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{request.studentId}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{request.dept} · Applied {request.date}</div>
                  <div className="text-xs text-gray-500 mt-0.5">For: <span className="text-[#1a1a18] font-medium">{request.listing}</span></div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={request.status === 'approved' ? 'success' : request.status === 'rejected' ? 'danger' : 'warning'}>{request.status}</Badge>
                  <button onClick={() => setExpandedRequestId(isExpanded ? null : request.id)} className="text-xs border border-gray-200 text-gray-500 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                    {isExpanded ? 'Hide ▲' : 'Details ▼'}
                  </button>
                  {request.status === 'pending' && (
                    <>
                      <button onClick={() => approveRequest(request.id)} className="text-xs bg-[#111827] text-white px-3 py-1.5 rounded-lg hover:bg-[#1f2937] transition-colors font-medium">Approve</button>
                      <button onClick={() => rejectRequest(request.id)} className="text-xs bg-white border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:border-red-300 hover:text-red-600 transition-colors">Reject</button>
                    </>
                  )}
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[['Full Name', request.student], ['Student ID', request.studentId], ['Department', request.dept], ['Phone', request.phone], ['Preferred Move-in', request.moveIn], ['Financial Status', request.employment]].map(([label, value]) => (
                      <div key={label} className="bg-white border border-gray-200 rounded-xl p-3">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">{label}</div>
                        <div className="text-xs font-medium text-[#1a1a18]">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-3">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Message to Landlord</div>
                    <p className="text-xs text-[#1a1a18] leading-relaxed">{request.message}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
