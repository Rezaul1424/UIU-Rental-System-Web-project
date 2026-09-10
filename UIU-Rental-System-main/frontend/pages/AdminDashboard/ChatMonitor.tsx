import type { AdminChatConversation } from './types'

type ChatMonitorPageProps = {
  chatConversations: AdminChatConversation[]
  selectedChat: AdminChatConversation | null
  setSelectedChat: React.Dispatch<React.SetStateAction<AdminChatConversation | null>>
  chatMonitorSearch: string
  setChatMonitorSearch: React.Dispatch<React.SetStateAction<string>>
}

export default function ChatMonitorPage({ chatConversations, selectedChat, setSelectedChat, chatMonitorSearch, setChatMonitorSearch }: ChatMonitorPageProps) {
  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Chat Monitoring</h1>
          <p className="text-sm text-gray-500 mt-0.5">View conversations between students and landlords</p>
        </div>
      </div>

      {selectedChat ? (
        <div className="space-y-4">
          <button onClick={() => setSelectedChat(null)} className="text-sm text-gray-500 hover:text-[#1a1a18] transition-colors">← Back to conversations</button>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-[#111827]">{selectedChat.student} ↔ {selectedChat.landlord}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{selectedChat.property} · <span className="font-mono">{selectedChat.propertyId}</span></div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${selectedChat.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{selectedChat.status}</span>
              </div>
            </div>
            <div className="p-5 space-y-3 max-h-96 overflow-y-auto bg-gray-50">
              {selectedChat.msgs.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.from === 'landlord' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.from === 'landlord' ? 'bg-amber-500 text-white' : 'bg-sky-500 text-white'}`}>{m.from === 'landlord' ? 'L' : 'S'}</div>
                  <div className={`max-w-[70%] flex flex-col ${m.from === 'landlord' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${m.from === 'landlord' ? 'bg-amber-50 text-[#1a1a18] rounded-tr-sm' : 'bg-white text-[#1a1a18] rounded-tl-sm shadow-sm'}`}>{m.text}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{m.from === 'landlord' ? selectedChat.landlord : selectedChat.student} · {m.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>🔒</span>
                <span>Read-only monitoring view. Admins cannot send messages in user conversations.</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <input value={chatMonitorSearch} onChange={e => setChatMonitorSearch(e.target.value)} placeholder="Search by student, landlord, or property…" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#1a1a18]" />
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3">ID</th>
                <th className="text-left px-5 py-3">Student</th>
                <th className="text-left px-5 py-3">Landlord</th>
                <th className="text-left px-5 py-3">Property</th>
                <th className="text-left px-5 py-3">Last Message</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chatConversations
                .filter(c => !chatMonitorSearch || [c.student, c.landlord, c.property].some(s => s.toLowerCase().includes(chatMonitorSearch.toLowerCase())))
                .map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">{c.id}</td>
                    <td className="px-5 py-3 font-medium text-[#1a1a18]">{c.student}</td>
                    <td className="px-5 py-3 text-gray-600">{c.landlord}</td>
                    <td className="px-5 py-3">
                      <div className="text-gray-600 text-xs">{c.property}</div>
                      <div className="font-mono text-[10px] text-gray-400">{c.propertyId}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{c.lastMsg}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => setSelectedChat(c)} className="text-xs font-semibold text-[#111827] hover:underline">View</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
