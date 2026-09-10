import { useState } from 'react'

export type Notification = {
  id: number
  text: string
  sub?: string
  time: string
  read: boolean
}

export default function NotificationBell({ notifications }: { notifications: Notification[] }) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>(notifications)
  const unread = notifs.filter(n => !n.read).length

  const markAllRead = () => setNotifs(ns => ns.map(n => ({ ...n, read: true })))

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Panel */}
          <div className="absolute right-0 top-11 z-50 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="font-semibold text-[#111827] text-sm">Notifications</div>
              <div className="flex items-center gap-3">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-gray-400 hover:text-[#111827] transition-colors">
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors text-sm">✕</button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">No notifications</div>
              ) : (
                notifs.map(n => (
                  <div
                    key={n.id}
                    onClick={() => setNotifs(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x))}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read ? 'bg-transparent' : 'bg-blue-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm leading-snug ${n.read ? 'text-gray-600' : 'text-[#111827] font-medium'}`}>{n.text}</div>
                      {n.sub && <div className="text-xs text-gray-400 mt-0.5">{n.sub}</div>}
                      <div className="text-[10px] text-gray-400 mt-1">{n.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
