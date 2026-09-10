import { DonutChart, BarChartH } from '../../components/Charts'
import { Stat } from '../../components/ui'
import type { Listing } from '../../types'
import type { LandlordRow, StudentRow } from '../../data'
import type { AdminPage } from './Sidebar'

type OverviewPageProps = {
  listings: Listing[]
  lRows: LandlordRow[]
  sRows: StudentRow[]
  pendingLandlords: number
  pendingStudents: number
  setPage: (page: AdminPage) => void
}

export default function OverviewPage({ listings, lRows, sRows, pendingLandlords, pendingStudents, setPage }: OverviewPageProps) {
  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium mb-0.5">Welcome back 👋</p>
          <h1 className="text-2xl font-bold text-[#111827]">Admin Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">UIU Rental — platform health at a glance</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 bg-emerald-400 rounded-full" />
          All systems operational
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: 'Total Users', value: lRows.length + sRows.length, sub: `${lRows.length} landlords · ${sRows.length} students`, icon: '👥' },
          { label: 'Total Listings', value: listings.length, sub: `${listings.filter(l => l.status === 'available').length} available`, icon: '🏠' },
          { label: 'Occupied Rooms', value: listings.filter(l => l.status === 'occupied').length, sub: '68% occupancy rate', icon: '🔑' },
          { label: 'Pending Approvals', value: pendingLandlords + pendingStudents, sub: 'Needs review', icon: '⏳' },
          { label: 'Active Leases', value: 4, sub: 'This month', icon: '📄' },
          { label: 'Reported Issues', value: 2, sub: 'Awaiting action', icon: '🚨' },
        ].map(s => <Stat key={s.label} label={s.label} value={s.value} sub={s.sub} icon={s.icon} />)}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-[#111827]">User Registrations — Last 6 Months</div>
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">↑ 28% vs prev period</span>
            </div>
            {(() => {
              const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
              const landlords = [1, 1, 2, 2, 3, 3]
              const students = [2, 3, 4, 5, 6, 8]
              const W = 500, H = 120, PAD = 24
              const maxV = Math.max(...students) + 1
              const xs = months.map((_, i) => PAD + i * ((W - PAD * 2) / (months.length - 1)))
              const yL = landlords.map(v => H - PAD - (v / maxV) * (H - PAD * 2))
              const yS = students.map(v => H - PAD - (v / maxV) * (H - PAD * 2))
              const pathL = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${yL[i]}`).join(' ')
              const pathS = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${yS[i]}`).join(' ')
              const areaS = `${pathS} L${xs[xs.length - 1]},${H - PAD} L${xs[0]},${H - PAD} Z`
              return (
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#111827" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#111827" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[0, 0.25, 0.5, 0.75, 1].map(f => {
                    const y = PAD + f * (H - PAD * 2)
                    return <line key={String(f)} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#f3f4f6" strokeWidth="1" />
                  })}
                  <path d={areaS} fill="url(#areaGrad)" />
                  <path d={pathS} fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={pathL} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2" />
                  {xs.map((x, i) => (
                    <g key={i}>
                      <circle cx={x} cy={yS[i]} r="3.5" fill="#111827" />
                      <circle cx={x} cy={yL[i]} r="3" fill="#10b981" />
                      <text x={x} y={H - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">{months[i]}</text>
                    </g>
                  ))}
                </svg>
              )
            })()}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 bg-[#111827]" /><span className="text-xs text-gray-500">Students</span></div>
              <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 bg-emerald-500 border-dashed border-b" /><span className="text-xs text-gray-500">Landlords</span></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="font-semibold text-[#111827]">Recent Platform Activity</div>
              <button onClick={() => setPage('reports')} className="text-xs text-gray-400 hover:text-[#111827] transition-colors">View reports →</button>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { icon: '📬', color: 'bg-amber-50 text-amber-600', text: 'Rifat Hassan applied for Studio near Gate 3', time: '2h ago', type: 'Application' },
                { icon: '✅', color: 'bg-emerald-50 text-emerald-600', text: 'Landlord Nusrat Jahan approved', time: '5h ago', type: 'Approval' },
                { icon: '💳', color: 'bg-sky-50 text-sky-600', text: 'Rent payment ৳4,200 received — Tanvir Ahmed', time: '1d ago', type: 'Payment' },
                { icon: '🔧', color: 'bg-purple-50 text-purple-600', text: 'Maintenance request raised — Water leak, Flat 3B', time: '1d ago', type: 'Maintenance' },
                { icon: '⚠️', color: 'bg-red-50 text-red-600', text: 'Listing reported by student: incorrect pricing', time: '2d ago', type: 'Report' },
                { icon: '🎓', color: 'bg-gray-50 text-gray-500', text: 'New student registered: Mitu Rahman', time: '3d ago', type: 'Registration' },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${a.color}`}>{a.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#111827] truncate">{a.text}</div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{a.type}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="font-semibold text-[#111827] mb-1">Monthly Rent Collection (৳k)</div>
            <p className="text-xs text-gray-400 mb-4">Collected vs. expected across all properties</p>
            {(() => {
              const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
              const collected = [12, 14, 16, 18.2, 21, 19.5]
              const expected = [15, 15, 18, 21, 21, 22]
              const maxV = Math.max(...expected) + 2
              const W = 500, H = 110, PAD = 28
              const bw = 28, gap = (W - PAD * 2) / months.length
              return (
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                  {[0, 0.25, 0.5, 0.75, 1].map(f => {
                    const y = PAD + (1 - f) * (H - PAD * 1.5)
                    return <line key={String(f)} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#f3f4f6" strokeWidth="1" />
                  })}
                  {months.map((m, i) => {
                    const cx = PAD + i * gap + gap / 2
                    const he = (expected[i] / maxV) * (H - PAD * 1.5)
                    const hc = (collected[i] / maxV) * (H - PAD * 1.5)
                    const ye = H - PAD * 0.5 - he, yc = H - PAD * 0.5 - hc
                    return (
                      <g key={m}>
                        <rect x={cx - bw / 2 - 2} y={ye} width={bw / 2} height={he} fill="#e5e7eb" rx="3" />
                        <rect x={cx + 2} y={yc} width={bw / 2} height={hc} fill="#111827" rx="3" />
                        <text x={cx} y={H - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">{m}</text>
                      </g>
                    )
                  })}
                </svg>
              )
            })()}
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#111827]" /><span className="text-xs text-gray-500">Collected</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-200" /><span className="text-xs text-gray-500">Expected</span></div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-[#111827]">Pending Approvals</div>
              {(pendingLandlords + pendingStudents) > 0 && (
                <span className="text-[11px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{pendingLandlords + pendingStudents}</span>
              )}
            </div>
            {pendingLandlords > 0 && (
              <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                <div>
                  <div className="text-sm font-medium text-[#111827]">{pendingLandlords} Landlord{pendingLandlords > 1 ? 's' : ''}</div>
                  <div className="text-xs text-gray-400">Awaiting verification</div>
                </div>
                <button onClick={() => setPage('landlords')} className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors">Review →</button>
              </div>
            )}
            {pendingStudents > 0 && (
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <div className="text-sm font-medium text-[#111827]">{pendingStudents} Student{pendingStudents > 1 ? 's' : ''}</div>
                  <div className="text-xs text-gray-400">Awaiting approval</div>
                </div>
                <button onClick={() => setPage('students')} className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors">Review →</button>
              </div>
            )}
            {pendingLandlords === 0 && pendingStudents === 0 && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 py-2">
                <span className="text-base">✓</span> All accounts up to date
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="font-semibold text-[#111827] mb-1">Listing Status</div>
            <p className="text-xs text-gray-400 mb-3">Current across all properties</p>
            <DonutChart segments={[
              { label: 'Occupied', value: listings.filter(l => l.status === 'occupied').length, color: '#111827' },
              { label: 'Available', value: listings.filter(l => l.status === 'available').length, color: '#10b981' },
              { label: 'Unavailable', value: listings.filter(l => l.status === 'unavailable').length, color: '#e5e7eb' },
            ]} />
            <div className="mt-3 space-y-1.5">
              {[
                { label: 'Occupied', color: 'bg-[#111827]', count: listings.filter(l => l.status === 'occupied').length },
                { label: 'Available', color: 'bg-emerald-500', count: listings.filter(l => l.status === 'available').length },
                { label: 'Unavailable', color: 'bg-gray-200', count: listings.filter(l => l.status === 'unavailable').length },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${s.color}`} /><span className="text-gray-600">{s.label}</span></div>
                  <span className="font-bold text-[#111827]">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="font-semibold text-[#111827] mb-3">Maintenance Status</div>
            <BarChartH bars={[
              { label: 'Open', value: 1, color: '#ef4444' },
              { label: 'In Progress', value: 1, color: '#f59e0b' },
              { label: 'Resolved', value: 1, color: '#10b981' },
            ]} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="font-semibold text-[#111827] mb-3">Quick Actions</div>
            <div className="space-y-1">
              {[
                { label: '🏘️ Landlord Accounts', page: 'landlords' as const },
                { label: '🎓 Student Accounts', page: 'students' as const },
                { label: '🏷️ Manage Categories', page: 'categories' as const },
                { label: '📊 View Reports', page: 'reports' as const },
              ].map(a => (
                <button key={a.label} onClick={() => setPage(a.page)} className="w-full flex items-center gap-2 text-sm text-left px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-[#111827]">{a.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
