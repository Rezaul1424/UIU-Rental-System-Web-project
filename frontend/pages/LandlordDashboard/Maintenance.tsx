import type { MaintReq, Priority } from './types'

type MaintenancePageProps = {
  mReqs: MaintReq[]
  expandedMaintId: number | null
  setExpandedMaintId: (id: number | null) => void
  advanceStage: (id: number) => void
  revertStage: (id: number) => void
  addComment: (id: number) => void
  newComment: Record<number, string>
  setNewComment: (value: Record<number, string>) => void
}

const stageColor = (stage: number): string => {
  if (stage <= 1) return 'bg-amber-500'
  if (stage <= 3) return 'bg-sky-500'
  if (stage === 4) return 'bg-violet-500'
  if (stage === 5) return 'bg-emerald-500'
  return 'bg-gray-400'
}

const priorityColor: Record<Priority, string> = {
  Low: 'text-gray-600 bg-gray-100',
  Medium: 'text-amber-700 bg-amber-50',
  High: 'text-orange-700 bg-orange-50',
  Urgent: 'text-red-700 bg-red-50',
}

export default function MaintenancePage({ mReqs, expandedMaintId, setExpandedMaintId, advanceStage, revertStage, addComment, newComment, setNewComment }: MaintenancePageProps) {
  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Maintenance Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track, update, and resolve tenant maintenance issues</p>
        </div>
        <div className="flex gap-2">
          {(['Low', 'Medium', 'High', 'Urgent'] as Priority[]).map(priority => (
            <span key={priority} className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[priority]}`}>{priority}</span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {mReqs.map(req => {
          const isOpen = expandedMaintId === req.id
          const pct = Math.round((req.stage / 6) * 100)
          return (
            <div key={req.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 flex items-start gap-4">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${stageColor(req.stage)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#1a1a18]">{req.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[req.priority]}`}>{req.priority}</span>
                    {req.hasPhotos && <span className="text-xs text-gray-400">📷 photos</span>}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{req.listing} · {req.tenant} · Submitted {req.date}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Est. completion: {req.estimatedDate}</div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[#1a1a18]">{req.stage <= 0 ? 'Submitted' : req.stage === 1 ? 'Under Review' : req.stage === 2 ? 'Approved' : req.stage === 3 ? 'Technician Assigned' : req.stage === 4 ? 'In Progress' : req.stage === 5 ? 'Completed' : 'Closed'}</span>
                      <span className="text-xs text-gray-400">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${stageColor(req.stage)}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between mt-2 text-[8px] text-gray-400">
                      {['Submitted', 'Review', 'Approved', 'Assigned', 'Progress', 'Completed', 'Closed'].map(step => (
                        <div key={step} className="text-center" style={{ flex: 1 }}>{step}</div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setExpandedMaintId(isOpen ? null : req.id)} className="text-xs border border-gray-200 text-gray-500 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors font-medium">{isOpen ? 'Close ▲' : 'Details ▼'}</button>
                  <button disabled={req.stage === 0} onClick={() => revertStage(req.id)} className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed">← Revert</button>
                  <button disabled={req.stage >= 6} onClick={() => advanceStage(req.id)} className="text-xs bg-[#1a1a18] text-white px-3 py-1.5 rounded-lg hover:bg-[#333] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed">{req.stage === 5 ? 'Close' : 'Advance →'}</button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-gray-100">
                  <div className="px-5 py-4 bg-gray-50 space-y-3 border-b border-gray-100">
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Issue Description</div>
                      <p className="text-xs text-[#1a1a18] leading-relaxed">{req.description}</p>
                    </div>
                    {req.hasPhotos && (
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Attachments</div>
                        <div className="flex gap-2">
                          {['Before', 'After'].map(label => (
                            <div key={label} className="w-20 h-16 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center text-xs text-gray-400 cursor-pointer hover:bg-gray-300 transition-colors">
                              📷 {label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Updates & Comments</div>
                    {req.comments.map((comment, index) => (
                      <div key={index} className={`flex gap-3 ${comment.from === 'landlord' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${comment.from === 'landlord' ? 'bg-[#1a1a18] text-white' : 'bg-gray-200 text-gray-600'}`}>{comment.from === 'landlord' ? 'L' : req.tenant[0]}</div>
                        <div className={`max-w-[75%] space-y-0.5 ${comment.from === 'landlord' ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className={`text-xs px-3 py-2.5 rounded-xl ${comment.from === 'landlord' ? 'bg-[#1a1a18] text-white rounded-br-sm' : 'bg-gray-100 text-[#1a1a18] rounded-bl-sm'}`}>{comment.text}</div>
                          <span className="text-[10px] text-gray-400">{comment.from === 'landlord' ? 'You' : req.tenant} · {comment.date}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <input
                        value={newComment[req.id] ?? ''}
                        onChange={e => setNewComment({ ...newComment, [req.id]: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && addComment(req.id)}
                        placeholder="Add an update or comment…"
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#1a1a18]"
                      />
                      <button onClick={() => addComment(req.id)} className="bg-[#111827] text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-[#1f2937] transition-colors">Post</button>
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
