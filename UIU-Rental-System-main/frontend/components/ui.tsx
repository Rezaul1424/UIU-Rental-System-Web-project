import React from 'react'

export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) {
  const s = { default: 'bg-gray-100 text-gray-600', success: 'bg-emerald-50 text-emerald-700', warning: 'bg-amber-50 text-amber-700', danger: 'bg-red-50 text-red-700', info: 'bg-sky-50 text-sky-700' }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-mono tracking-wide ${s[variant]}`}>{children}</span>
}

export function Stat({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-[#111827] flex items-center justify-center flex-shrink-0 text-white text-xl">
        {icon ?? '📌'}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-gray-400 font-medium mb-0.5 uppercase tracking-wider leading-none">{label}</div>
        <div className="text-2xl font-bold text-[#111827] leading-tight">{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export function SectionHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-xl font-bold text-[#1a1a18]">{title}</h2>
      {action}
    </div>
  )
}
