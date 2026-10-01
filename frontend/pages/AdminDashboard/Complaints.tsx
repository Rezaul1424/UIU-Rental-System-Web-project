import type { AdminComplaint } from './types'
import type { AdminComplaintStatus } from '../../api/admin'

type ComplaintsPageProps = {
  adminComplaints: AdminComplaint[]
  isLoading: boolean
  error: string
  onRetry: () => void
  onSelectComplaint: (complaint: AdminComplaint) => void
  onStatusChange: (id: string, status: AdminComplaintStatus) => void
  onSendReply: (id: string, message: string) => Promise<void>
  selectedComplaint: AdminComplaint | null
  setSelectedComplaint: React.Dispatch<React.SetStateAction<AdminComplaint | null>>
  complaintReply: string
  setComplaintReply: React.Dispatch<React.SetStateAction<string>>
  cStatusFilter: 'all' | 'Submitted' | 'Under Review' | 'Responded' | 'Resolved' | 'Closed'
  setCStatusFilter: React.Dispatch<React.SetStateAction<'all' | 'Submitted' | 'Under Review' | 'Responded' | 'Resolved' | 'Closed'>>
  cSearch: string
  setCSearch: React.Dispatch<React.SetStateAction<string>>
}

export default function ComplaintsPage({ adminComplaints, isLoading, error, onRetry, onSelectComplaint, onStatusChange, onSendReply, selectedComplaint, setSelectedComplaint, complaintReply, setComplaintReply, cStatusFilter, setCStatusFilter, cSearch, setCSearch }: ComplaintsPageProps) {
  const formatDate = (value: string) => new Date(value).toLocaleDateString()
  const sendReply = () => {
    const message = complaintReply.trim()
    if (!message || !selectedComplaint) return
    void onSendReply(selectedComplaint.id, message)
      .then(() => setComplaintReply(''))
      .catch(() => {})
  }
  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Complaints</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage complaints submitted by students and landlords</p>
        </div>
      </div>

      {selectedComplaint ? (
        <div className="space-y-4">
          <button onClick={() => setSelectedComplaint(null)} className="text-sm text-gray-500 hover:text-[#1a1a18] transition-colors">← Back to complaints</button>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-gray-400">{selectedComplaint.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedComplaint.status === 'Resolved' || selectedComplaint.status === 'Closed' ? 'bg-emerald-50 text-emerald-700' : selectedComplaint.status === 'Responded' ? 'bg-sky-50 text-sky-700' : selectedComplaint.status === 'Under Review' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{selectedComplaint.status}</span>
                </div>
                <h2 className="text-lg font-bold text-[#111827]">{selectedComplaint.category}</h2>
                <div className="text-sm text-gray-500 mt-1">From <strong>{selectedComplaint.from}</strong> ({selectedComplaint.fromType}) against <strong>{selectedComplaint.against}</strong></div>
                <div className="text-xs text-gray-400 mt-1">{selectedComplaint.property} · {formatDate(selectedComplaint.createdAt)}</div>
              </div>
              <select
                value={selectedComplaint.status}
                onChange={e => onStatusChange(selectedComplaint.id, e.target.value as AdminComplaintStatus)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18] bg-white"
              >
                {['Submitted', 'Under Review', 'Responded', 'Resolved', 'Closed'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</div>
              <p className="text-sm text-[#1a1a18] leading-relaxed">{selectedComplaint.description}</p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Communication Thread</div>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {selectedComplaint.messages.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-4">No messages yet</div>
                ) : (
                  selectedComplaint.messages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.isAdmin ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${msg.isAdmin ? 'bg-[#111827] text-white' : 'bg-gray-200 text-gray-600'}`}>{msg.from[0]}</div>
                      <div className={`max-w-[70%] ${msg.isAdmin ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${msg.isAdmin ? 'bg-[#111827] text-white rounded-tr-sm' : 'bg-gray-100 text-[#1a1a18] rounded-tl-sm'}`}>{msg.text}</div>
                        <div className="text-[10px] text-gray-400 mt-1">{msg.from} · {formatDate(msg.createdAt)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={complaintReply}
                  onChange={e => setComplaintReply(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() }
                  }}
                  placeholder="Type a response…"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18]"
                />
                <button
                  onClick={sendReply}
                  className="bg-[#111827] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1f2937] transition-colors"
                >Send</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <input value={cSearch} onChange={e => setCSearch(e.target.value)} placeholder="Search complaints…" className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#1a1a18]" />
            <select value={cStatusFilter} onChange={e => setCStatusFilter(e.target.value as typeof cStatusFilter)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a18] bg-white">
              {(['all', 'Submitted', 'Under Review', 'Responded', 'Resolved', 'Closed'] as const).map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
            </select>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3">ID</th>
                <th className="text-left px-5 py-3">Submitted By</th>
                <th className="text-left px-5 py-3">Against</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-left px-5 py-3">Property</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {isLoading && <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-gray-500">Loading complaints…</td></tr>}
                {!isLoading && adminComplaints.length === 0 && <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-gray-400">No complaints found.</td></tr>}
              {adminComplaints
                .filter(c => cStatusFilter === 'all' || c.status === cStatusFilter)
                .filter(c => !cSearch || c.from.toLowerCase().includes(cSearch.toLowerCase()) || c.against.toLowerCase().includes(cSearch.toLowerCase()) || c.category.toLowerCase().includes(cSearch.toLowerCase()))
                .map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">{c.id}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-[#1a1a18]">{c.from}</div>
                      <div className="text-xs text-gray-400">{c.fromType}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{c.against}</td>
                    <td className="px-5 py-3 text-gray-600">{c.category}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs max-w-[150px] truncate">{c.property}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(c.createdAt)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'Resolved' || c.status === 'Closed' ? 'bg-emerald-50 text-emerald-700' : c.status === 'Responded' ? 'bg-sky-50 text-sky-700' : c.status === 'Under Review' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => onSelectComplaint(c)} className="text-xs font-semibold text-[#111827] hover:underline">View</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {error && <div role="alert" className="flex items-center justify-between gap-3 border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><button onClick={onRetry} className="font-semibold underline">Retry</button></div>}
        </div>
      )}
    </>
  )
}
