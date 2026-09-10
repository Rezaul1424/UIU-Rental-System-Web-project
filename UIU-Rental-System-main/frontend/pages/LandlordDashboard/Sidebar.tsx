import UIULogo from '../../components/UIULogo'
import type { Dispatch, SetStateAction } from 'react'

export type LandlordPage = 'overview' | 'listings' | 'add-listing' | 'edit-listing' | 'listing-detail' | 'requests' | 'rent' | 'maintenance' | 'chat' | 'settings'

type LandlordSidebarProps = {
  page: LandlordPage
  setPage: Dispatch<SetStateAction<LandlordPage>>
  pendingRequests: number
  maintenanceCount: number
  userName: string
  onSignOut: () => void
}

export default function LandlordSidebarNav({ page, setPage, pendingRequests, maintenanceCount, userName, onSignOut }: LandlordSidebarProps) {
  const items: Array<{ id: LandlordPage; icon: string; label: string; badge?: number }> = [
    { id: 'overview',    icon: '🏠', label: 'Overview' },
    { id: 'listings',    icon: '🏘️', label: 'My Listings' },
    { id: 'requests',    icon: '📬', label: 'Rental Requests', badge: pendingRequests },
    { id: 'rent',        icon: '💳', label: 'Rent Tracker' },
    { id: 'maintenance', icon: '🔧', label: 'Maintenance', badge: maintenanceCount },
    { id: 'chat',        icon: '💬', label: 'Chat with Tenants' },
    { id: 'settings',    icon: '⚙️', label: 'Settings' },
  ]

  return (
    <aside className="w-60 bg-[#111827] flex-shrink-0 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
        <UIULogo size={36} variant="dark" className="flex-shrink-0" />
        <div>
          <div className="font-bold text-white text-[14px] leading-tight tracking-tight">UIU Rental</div>
          <div className="text-[10px] text-white/30 tracking-wide">Landlord Panel</div>
        </div>
      </div>

      <nav className="flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
              page === item.id || ((page === 'add-listing' || page === 'edit-listing' || page === 'listing-detail') && item.id === 'listings')
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:bg-white/5 hover:text-white/80'
            }`}
          >
            <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge ? <span className={`text-white text-[10px] rounded-full min-w-[18px] px-1 flex items-center justify-center font-bold ${item.id === 'requests' ? 'bg-amber-500' : 'bg-sky-500'}`}>{item.badge}</span> : null}
          </button>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {userName[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white truncate">{userName}</div>
          <div className="text-[10px] text-white/40">Landlord</div>
        </div>
        <button
          onClick={onSignOut}
          title="Sign Out"
          className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </aside>
  )
}
