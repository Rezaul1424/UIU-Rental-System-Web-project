import type { ChatMsg, TenantContact } from './types'

type ChatPageProps = {
  currentTenants: TenantContact[]
  potentialTenants: TenantContact[]
  activeChatName: string
  setActiveChatName: (name: string) => void
  chatThreads: Record<string, ChatMsg[]>
  chatInput: string
  setChatInput: (value: string) => void
  sendChat: () => void
}

export default function ChatPage({ currentTenants, potentialTenants, activeChatName, setActiveChatName, chatThreads, chatInput, setChatInput, sendChat }: ChatPageProps) {
  const allTenants = [...currentTenants, ...potentialTenants]
  const activeMsgs = chatThreads[activeChatName] ?? []
  const activeTenantMeta = allTenants.find(t => t.name === activeChatName)

  return (
    <div className="flex gap-0 -mx-6 -mb-6" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="font-semibold text-[#111827] text-base mb-2">Chat with Tenants</div>
          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#111827]"
            placeholder="Search tenants…"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {([['Current Tenants', currentTenants], ['Potential Tenants', potentialTenants]] as const).map(([label, group]) => (
            <div key={label}>
              <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100 sticky top-0">{label}</div>
              {(group as typeof currentTenants).map(t => {
                const thread = chatThreads[t.name] ?? []
                const lastMsg = thread[thread.length - 1]
                const isActive = activeChatName === t.name
                return (
                  <button
                    key={t.name}
                    onClick={() => setActiveChatName(t.name)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left border-b border-gray-50 transition-colors ${isActive ? 'bg-[#111827]' : 'hover:bg-gray-50'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isActive ? 'bg-white/20 text-white' : t.category === 'current' ? 'bg-[#111827] text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {t.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-[#111827]'}`}>{t.name}</div>
                      <div className={`text-xs truncate mt-0.5 ${isActive ? 'text-white/60' : 'text-gray-400'}`}>{lastMsg ? lastMsg.text : t.listing}</div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : t.category === 'current' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {t.category === 'current' ? 'Current' : 'Applicant'}
                      </span>
                      {thread.length > 0 && !isActive && <div className="w-2 h-2 bg-emerald-400 rounded-full" />}
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#f8fafc] min-w-0">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 bg-white">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${activeTenantMeta?.category === 'current' ? 'bg-[#111827] text-white' : 'bg-gray-200 text-gray-600'}`}>
            {activeChatName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[#111827]">{activeChatName}</div>
            <div className="text-xs text-gray-400 truncate">{activeTenantMeta?.listing}</div>
          </div>
          <div className="flex items-center gap-3">
            {activeTenantMeta && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${activeTenantMeta.category === 'current' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {activeTenantMeta.category === 'current' ? 'Current Tenant' : 'Potential Tenant'}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-xs text-gray-500">Online</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          {activeMsgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 pb-16">
              <div className="text-5xl mb-3">💬</div>
              <div className="text-base font-medium text-gray-500 mb-1">No messages yet</div>
              <div className="text-sm">Say hello to {activeChatName.split(' ')[0]} to get the conversation started.</div>
            </div>
          ) : (
            activeMsgs.map((msg, index) => (
              <div key={index} className={`flex items-end gap-2 ${msg.from === 'landlord' ? 'justify-end' : 'justify-start'}`}>
                {msg.from !== 'landlord' && (
                  <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0 mb-0.5">{activeChatName[0]}</div>
                )}
                <div className={`text-sm px-4 py-2.5 rounded-2xl max-w-[65%] ${msg.from === 'landlord' ? 'bg-[#111827] text-white rounded-br-sm' : 'bg-white text-[#111827] border border-gray-200 shadow-sm rounded-bl-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-200 bg-white">
          <div className="flex gap-3 items-center">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#111827] bg-gray-50 focus:bg-white transition-colors"
              placeholder={`Message ${activeChatName.split(' ')[0]}…`}
            />
            <button onClick={sendChat} className="bg-[#111827] text-white text-sm font-semibold px-5 py-3 rounded-2xl hover:bg-[#1f2937] transition-colors flex-shrink-0">Send</button>
          </div>
        </div>
      </div>
    </div>
  )
}
