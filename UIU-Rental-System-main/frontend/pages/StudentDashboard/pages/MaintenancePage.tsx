import type { MaintenanceRequest, StudentPage } from '../types'

type MaintenancePageProps = {
  myRequests: MaintenanceRequest[]
  showNewReq: boolean
  setShowNewReq: (value: boolean | ((prev: boolean) => boolean)) => void
  newReq: { issue: string; description: string; priority: string }
  setNewReq: React.Dispatch<React.SetStateAction<{ issue: string; description: string; priority: string }>>
  submitRequest: () => void
  expandedMaintId: number | null
  setExpandedMaintId: (value: number | null) => void
  maintChatThreads: Record<number, { from: 'student' | 'landlord'; text: string }[]>
  maintChatInput: Record<number, string>
  setMaintChatInput: React.Dispatch<React.SetStateAction<Record<number, string>>>
  sendMaintChat: (reqId: number) => void
  setPage: (page: StudentPage) => void
}

export default function MaintenancePage({ myRequests, showNewReq, setShowNewReq, newReq, setNewReq, submitRequest, expandedMaintId, setExpandedMaintId, maintChatThreads, maintChatInput, setMaintChatInput, sendMaintChat }: MaintenancePageProps) {
  const MAINT_STAGES = ['Submitted', 'Under Review', 'Approved', 'Technician Assigned', 'In Progress', 'Completed', 'Closed'] as const
  const sColor = (s: number) => s >= 5 ? 'bg-emerald-500' : s >= 3 ? 'bg-sky-500' : s >= 1 ? 'bg-amber-500' : 'bg-gray-300'
  const sText = (s: number) => s >= 5 ? 'text-emerald-600' : s >= 3 ? 'text-sky-600' : s >= 1 ? 'text-amber-600' : 'text-gray-400'
  const stageFor = (status: string) => status === 'resolved' ? 6 : status === 'in-progress' ? 2 : 0
  const priorityColor: Record<string, string> = { Low: 'bg-gray-100 text-gray-600', Medium: 'bg-blue-50 text-blue-700', High: 'bg-amber-50 text-amber-700', Urgent: 'bg-red-50 text-red-700' }
  const photos: Record<number, { before: string; after: string | null }> = {
    1: { before: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300&q=80', after: null },
    2: { before: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80', after: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300&q=80' },
  }

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Maintenance Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Submit and track property maintenance issues</p>
        </div>
        <button onClick={() => setShowNewReq(r => !r)} className="text-sm bg-[#1a1a18] text-white px-4 py-2.5 rounded-xl hover:bg-[#333] transition-colors font-semibold shadow-sm">
          {showNewReq ? '× Cancel' : '+ New Request'}
        </button>
      </div>
      {showNewReq && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="font-semibold text-[#1a1a18]">New Maintenance Request</div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Issue Title</label>
            <input value={newReq.issue} onChange={e => setNewReq(r => ({ ...r, issue: e.target.value }))} placeholder="e.g. Ceiling fan not working" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={newReq.description} onChange={e => setNewReq(r => ({ ...r, description: e.target.value }))} rows={3} placeholder="Describe the issue in detail…" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18] resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Priority</label>
            <div className="flex gap-2">
              {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                <button key={p} onClick={() => setNewReq(r => ({ ...r, priority: p }))} className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${newReq.priority === p ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#111827]'}`}>{p}</button>
              ))}
            </div>
          </div>
          <button onClick={submitRequest} disabled={!newReq.issue.trim()} className="bg-[#111827] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1f2937] disabled:opacity-50 transition-colors">Submit Request</button>
        </div>
      )}
      <div className="space-y-4">
        {myRequests.map(r => {
          const stage = stageFor(r.status)
          const isExpanded = expandedMaintId === r.id
          const thread = maintChatThreads[r.id] ?? []
          const reqPhotos = photos[r.id]
          return (
            <div key={r.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${sColor(stage)}`} />
                    <span className="font-semibold text-[#1a1a18]">{r.issue}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priorityColor['Medium']}`}>Medium</span>
                    <button onClick={() => setExpandedMaintId(isExpanded ? null : r.id)} className="text-xs text-gray-400 hover:text-[#111827] border border-gray-200 px-2.5 py-1 rounded-lg transition-colors">
                      {isExpanded ? 'Hide ▲' : 'Details ▼'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {MAINT_STAGES.map((_, i) => (
                    <div key={i} className={`flex-1 h-2 rounded-full transition-all ${i <= stage ? sColor(stage) : 'bg-gray-100'}`} />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${sText(stage)}`}>{MAINT_STAGES[stage]}</span>
                  <span className="text-xs text-gray-400">Studio near Gate 3 · {r.date}</span>
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-gray-100">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Progress Timeline</div>
                    <div className="space-y-2">
                      {MAINT_STAGES.map((s, i) => (
                        <div key={i} className={`flex items-center gap-3 text-sm ${i <= stage ? 'text-[#111827]' : 'text-gray-300'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${i < stage ? sColor(stage) + ' text-white' : i === stage ? sColor(stage) + ' text-white ring-4 ring-offset-1 ring-gray-200' : 'bg-gray-100 text-gray-400'}`}>{i + 1}</div>
                          <span className={i === stage ? 'font-semibold' : ''}>{s}</span>
                          {i === stage && <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold ml-auto">Current</span>}
                          {i < stage && <span className="text-[10px] text-gray-400 ml-auto">✓</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  {reqPhotos && (
                    <div className="px-5 py-4 border-b border-gray-100">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Before / After Photos</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-semibold text-gray-500 mb-1.5">Before Repair</div>
                          <div className="rounded-xl overflow-hidden bg-gray-100 aspect-video">
                            <img src={reqPhotos.before} className="w-full h-full object-cover" alt="Before" />
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-500 mb-1.5">After Repair</div>
                          {reqPhotos.after ? (
                            <div className="rounded-xl overflow-hidden bg-gray-100 aspect-video">
                              <img src={reqPhotos.after} className="w-full h-full object-cover" alt="After" />
                            </div>
                          ) : (
                            <div className="rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 aspect-video flex flex-col items-center justify-center text-gray-400">
                              <span className="text-2xl mb-1">📷</span>
                              <span className="text-xs">Not yet uploaded</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="px-5 py-4">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Communication with Landlord</div>
                    <div className="space-y-2 max-h-48 overflow-y-auto mb-3 pr-1">
                      {thread.length === 0 && (
                        <div className="text-center py-6 text-gray-400 text-xs">No messages yet — send a message to your landlord about this request.</div>
                      )}
                      {thread.map((m, i) => (
                        <div key={i} className={`flex items-end gap-2 ${m.from === 'student' ? 'justify-end' : 'justify-start'}`}>
                          {m.from === 'landlord' && <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 flex-shrink-0">L</div>}
                          <div className={`text-xs px-3 py-2 rounded-xl max-w-[75%] ${m.from === 'student' ? 'bg-[#111827] text-white rounded-br-sm' : 'bg-gray-100 text-[#111827] rounded-bl-sm'}`}>{m.text}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={maintChatInput[r.id] ?? ''} onChange={e => setMaintChatInput(c => ({ ...c, [r.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && sendMaintChat(r.id)} placeholder="Message your landlord…" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#111827] bg-gray-50 focus:bg-white" />
                      <button onClick={() => sendMaintChat(r.id)} className="bg-[#111827] text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-[#1f2937] transition-colors flex-shrink-0">Send</button>
                    </div>
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
