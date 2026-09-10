import type { Listing } from '../../../types'
import type { ChatMsg, StudentPage } from '../types'

type ChatPageProps = {
  allLandlords: Listing[]
  activeChatLandlord: string
  setActiveChatLandlord: (value: string) => void
  chatThreads: Record<string, ChatMsg[]>
  chatInput: string
  setChatInput: (value: string) => void
  sendChat: () => void
  openChatWith: (landlordName: string) => void
  chatCategoryTab: 'current' | 'previous' | 'potential'
  setChatCategoryTab: (value: 'current' | 'previous' | 'potential') => void
  activeMsgs: ChatMsg[]
  activeLandlordListing: Listing | undefined
  setViewListing: (listing: Listing | null) => void
  setPage: (page: StudentPage) => void
}

export default function ChatPage({ allLandlords, activeChatLandlord, setActiveChatLandlord, chatThreads, chatInput, setChatInput, sendChat, openChatWith, chatCategoryTab, setChatCategoryTab, activeMsgs, activeLandlordListing, setViewListing, setPage }: ChatPageProps) {
  const currentLandlord = { name: 'Rahman Faruk', listing: 'Studio near Gate 3', category: 'current' }
  const previousLandlord = { name: 'Nusrat Jahan', listing: 'Shared Mess – South Campus', category: 'previous' }
  const potentialLandlords = allLandlords.filter(l => l.landlord !== 'Rahman Faruk' && l.landlord !== 'Nusrat Jahan')
  const tabLandlords = chatCategoryTab === 'current' ? [currentLandlord] : chatCategoryTab === 'previous' ? [previousLandlord] : potentialLandlords.map(l => ({ name: l.landlord, listing: l.title, category: 'potential' }))

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Chat with Landlords</h1>
        <p className="text-sm text-gray-500 mt-0.5">Message any landlord — before or after applying</p>
      </div>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ height: 520 }}>
        <div className="flex h-full">
          <div className="w-64 border-r border-gray-200 flex-shrink-0 flex flex-col">
            <div className="p-2 border-b border-gray-100 space-y-1">
              {([['current', 'Current Landlord'], ['previous', 'Previous Landlord'], ['potential', 'Potential Landlords']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setChatCategoryTab(id)} className={`w-full text-left text-xs font-medium px-3 py-2 rounded-lg transition-all ${chatCategoryTab === id ? 'bg-[#111827] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                  {id === 'current' ? '🏠' : id === 'previous' ? '🕐' : '🔍'} {label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {tabLandlords.map(l => {
                const thread = chatThreads[l.name] ?? []
                const lastMsg = thread[thread.length - 1]
                const hasThread = !!chatThreads[l.name]
                return (
                  <button key={l.name} onClick={() => { setActiveChatLandlord(l.name); openChatWith(l.name) }} className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-50 transition-colors ${activeChatLandlord === l.name ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                    <div className="w-9 h-9 bg-[#111827] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 relative">
                      {l.name[0]}
                      {hasThread && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#1a1a18] truncate">{l.name}</div>
                      <div className="text-xs text-gray-400 truncate">{lastMsg ? lastMsg.text : l.listing}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="w-8 h-8 bg-[#111827] rounded-full flex items-center justify-center text-white text-xs font-bold">{activeChatLandlord[0]}</div>
              <div>
                <div className="font-semibold text-sm text-[#1a1a18]">{activeChatLandlord}
                  {activeLandlordListing && (
                    <button onClick={() => { setViewListing(activeLandlordListing); setPage('listing-detail') }} className="text-xs font-mono text-gray-400 hover:text-[#1a1a18] hover:underline transition-colors ml-1">{activeLandlordListing.propertyId}</button>
                  )}
                </div>
                <div className="text-xs text-gray-500">{activeLandlordListing?.title ?? 'UIU Rental'}</div>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                <span className="text-xs text-gray-500">Online</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {activeMsgs.length === 0 && (
                <div className="text-center pt-12 text-gray-400">
                  <div className="text-3xl mb-2">💬</div>
                  <div className="text-sm">Start a conversation with {activeChatLandlord.split(' ')[0]}</div>
                </div>
              )}
              {activeMsgs.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'student' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`text-sm px-4 py-2.5 rounded-xl max-w-[75%] ${m.from === 'student' ? 'bg-[#1a1a18] text-white rounded-br-sm' : 'bg-white text-[#1a1a18] border border-gray-200 rounded-bl-sm'}`}>{m.text}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 p-3 border-t border-gray-200">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18]" placeholder={`Message ${activeChatLandlord.split(' ')[0]}…`} />
              <button onClick={sendChat} className="bg-[#111827] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1f2937] transition-colors">Send</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
