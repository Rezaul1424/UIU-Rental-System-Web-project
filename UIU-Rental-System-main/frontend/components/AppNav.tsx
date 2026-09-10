import type { Role, Modal } from '../types'
import UIULogo from './UIULogo'

export default function AppNav({ role, userName, onSignOut, onModal, onBackToHome }: { role: Role; userName: string; onSignOut: () => void; onModal?: (m: Modal) => void; onBackToHome?: () => void }) {
  const roleLabel: Record<Role, string> = { admin: 'Admin', landlord: 'Landlord', student: 'Student', guest: 'Guest' }
  const roleBadge: Record<Role, string> = {
    admin: 'bg-violet-500/10 text-violet-600',
    landlord: 'bg-amber-500/10 text-amber-600',
    student: 'bg-emerald-500/10 text-emerald-600',
    guest: 'bg-gray-100 text-gray-500',
  }
  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#ffffff] rounded-xl flex items-center justify-center shadow-md overflow-hidden">
          <UIULogo size={30} variant="light" />
        </div>
        <div>
          <div className="font-bold text-[#111827] text-[15px] leading-tight tracking-tight">UIU Rental</div>
          <div className="text-xs text-gray-400">Rental Management System</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {role === 'guest' ? (
          <>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-500">Guest</span>
            <button onClick={() => onModal?.('login')} className="text-xs font-medium text-[#111827] border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">Sign In</button>
            <button onClick={() => onModal?.('signup')} className="text-xs font-semibold text-white bg-[#111827] px-3 py-1.5 rounded-lg hover:bg-[#1f2937] transition-colors">Sign Up</button>
            <button onClick={onBackToHome} className="text-xs text-gray-400 hover:text-[#111827] transition-colors border border-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1">
              ← Back to Home
            </button>
          </>
        ) : (
          <>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${roleBadge[role]}`}>{roleLabel[role]}</span>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5">
              <div className="w-7 h-7 bg-[#111827] rounded-full flex items-center justify-center text-white text-xs font-bold">
                {userName[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium text-[#111827] hidden sm:block">{userName}</span>
            </div>
            <button onClick={onSignOut} className="text-xs text-gray-400 hover:text-[#111827] transition-colors border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-300">
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  )
}
