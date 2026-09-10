import React from 'react'
import { useState } from 'react'
import type { Role } from '../types'

export default function AuthModal({ mode, onClose, onAuth }: { mode: 'login' | 'signup'; onClose: () => void; onAuth: (role: Role, name: string) => void }) {
  const [tab, setTab] = useState(mode)
  const [role, setRole] = useState<Role>('student')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [studentId, setStudentId] = useState('')
  const [forgotView, setForgotView] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotEmailError, setForgotEmailError] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  const roleOptions: { id: Role; label: string; icon: string }[] = [
    { id: 'student', label: 'Student', icon: '🎓' },
    { id: 'landlord', label: 'Landlord', icon: '🏘️' },
    { id: 'admin', label: 'Admin', icon: '🛡️' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const displayName = name || (tab === 'login' ? (role === 'admin' ? 'Admin User' : role === 'landlord' ? 'Rahman Faruk' : 'Tanvir Ahmed') : name)
    onAuth(role, displayName || 'User')
  }

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) { setForgotEmailError('Please enter your email address.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) { setForgotEmailError('Please enter a valid email address.'); return }
    setForgotEmailError('')
    setForgotSent(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Forgot Password overlay */}
        {forgotView && (
          <div className="flex flex-col">
            <div className="bg-[#1a1a18] px-8 pt-8 pb-6 text-white">
              <button onClick={() => { setForgotView(false); setForgotSent(false); setForgotEmail(''); setForgotEmailError('') }} className="text-white/60 hover:text-white text-sm flex items-center gap-1 mb-4 transition-colors">← Back to Sign In</button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"><span className="font-bold text-base">U</span></div>
                <div><div className="font-bold text-base">Reset Password</div><div className="text-xs text-white/60">UIU Rental System</div></div>
              </div>
            </div>
            <div className="px-8 py-6">
              {forgotSent
                ? <div className="text-center py-4">
                    <div className="text-4xl mb-4">📧</div>
                    <div className="font-bold text-[#111827] text-lg mb-2">Reset link sent!</div>
                    <p className="text-sm text-gray-500 mb-1">Password-reset instructions have been sent to:</p>
                    <p className="text-sm font-semibold text-[#111827] mb-6">{forgotEmail}</p>
                    <p className="text-xs text-gray-400 mb-6">Check your inbox and follow the link to reset your password. If you don't see it, check your spam folder.</p>
                    <button onClick={() => { setForgotView(false); setForgotSent(false); setForgotEmail('') }} className="text-sm text-[#1a1a18] font-semibold hover:underline">← Return to Sign In</button>
                  </div>
                : <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <p className="text-sm text-gray-500">Enter your registered email address and we'll send you a link to reset your password.</p>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={e => { setForgotEmail(e.target.value); setForgotEmailError('') }}
                        placeholder="you@uiu.ac.bd"
                        className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all ${forgotEmailError ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-[#1a1a18]'}`}
                      />
                      {forgotEmailError && <p className="text-xs text-red-500 mt-1">{forgotEmailError}</p>}
                    </div>
                    <button type="submit" className="w-full bg-[#1a1a18] text-white font-semibold py-3 rounded-xl hover:bg-[#333] transition-colors text-sm">Send Reset Link</button>
                  </form>
              }
            </div>
          </div>
        )}
        {/* Normal sign-in / sign-up view */}
        {!forgotView && (<>
        {/* Header */}
        <div className="bg-[#1a1a18] px-8 pt-8 pb-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white text-xl leading-none transition-colors">×</button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="font-bold text-base">U</span>
            </div>
            <div>
              <div className="font-bold text-base">UIU Rental System</div>
              <div className="text-xs text-white/60">United International University</div>
            </div>
          </div>
          <div className="flex gap-1 bg-white/10 rounded-xl p-1">
            {(['login', 'signup'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 text-sm font-medium py-1.5 rounded-lg transition-all ${tab === t ? 'bg-white text-[#1a1a18]' : 'text-white/70 hover:text-white'}`}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {/* Role picker */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">I am a</label>
            <div className="grid grid-cols-3 gap-2">
              {roleOptions.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-medium transition-all ${
                    role === r.id ? 'border-[#1a1a18] bg-gray-100 text-[#1a1a18]' : 'border-gray-200 text-gray-500 hover:border-[#1a1a18]/40'
                  }`}
                >
                  <span className="text-xl">{r.icon}</span>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {tab === 'signup' && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Full Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="e.g. Tanvir Ahmed"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18] focus:ring-2 focus:ring-[#1a1a18]/10 transition-all"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@uiu.ac.bd"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18] focus:ring-2 focus:ring-[#1a1a18]/10 transition-all"
            />
          </div>

          {tab === 'signup' && role === 'student' && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Student ID</label>
              <input
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                placeholder="e.g. 2023-CSE-104"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#1a1a18] focus:ring-2 focus:ring-[#1a1a18]/10 transition-all"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a18] focus:ring-2 focus:ring-[#1a1a18]/10 transition-all"
            />
          </div>

          {tab === 'login' && (
            <div className="text-right">
              <button type="button" onClick={() => setForgotView(true)} className="text-xs text-[#1a1a18] hover:underline">Forgot password?</button>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#1a1a18] text-white font-semibold py-3 rounded-xl hover:bg-[#333] active:bg-[#222] transition-colors text-sm shadow-sm"
          >
            {tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <p className="text-center text-xs text-gray-500">
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => setTab(tab === 'login' ? 'signup' : 'login')} className="text-[#1a1a18] font-semibold hover:underline">
              {tab === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </form>
      </>)}
      </div>
    </div>
  )
}
