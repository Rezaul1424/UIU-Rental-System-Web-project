import UIULogo from '../../components/UIULogo'

type StudentSidebarProps = {
  page: string
  setPage: (page: string) => void
  badgeCount: number
  pendingApplications: number
  chatCount: number
  userName: string
  onSignOut: () => void
}

export default function StudentSidebarNav({ page, setPage, badgeCount, pendingApplications, chatCount, userName, onSignOut }: StudentSidebarProps) {
  const navItems = [
    { id: 'overview',       icon: '🏠', label: 'Overview' },
    { id: 'browse',         icon: '🔍', label: 'Browse Listings' },
    { id: 'favorites',      icon: '❤️', label: 'Saved Properties', badge: badgeCount },
    { id: 'applications',   icon: '📋', label: 'My Applications', badge: pendingApplications },
    { id: 'pay-rent',       icon: '💳', label: 'Pay Rent' },
    { id: 'receipts',       icon: '🧾', label: 'Receipts' },
    { id: 'maintenance',    icon: '🔧', label: 'Maintenance' },
    { id: 'reviews',        icon: '⭐', label: 'Rate & Review' },
    { id: 'chat',           icon: '💬', label: 'Chat with Landlords', badge: chatCount },
    { id: 'settings',       icon: '⚙️', label: 'Settings' },
  ]

  return (
    <aside className="w-60 bg-[#111827] flex-shrink-0 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
        <UIULogo size={36} variant="dark" className="flex-shrink-0" />
        <div>
          <div className="font-bold text-white text-[14px] leading-tight tracking-tight">UIU Rental</div>
          <div className="text-[10px] text-white/30 tracking-wide">Student Panel</div>
        </div>
      </div>

      <nav className="flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
              (page === item.id ||
               ((page === 'apply-form' || page === 'listing-detail') && item.id === 'browse') ||
               (page === 'review-history' && item.id === 'reviews'))
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:bg-white/5 hover:text-white/80'
            }`}
          >
            <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge ? <span className="bg-white/20 text-white text-[10px] rounded-full min-w-[18px] px-1 flex items-center justify-center font-bold">{item.badge}</span> : null}
          </button>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {userName[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white truncate">{userName}</div>
          <div className="text-[10px] text-white/40">Student</div>
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
