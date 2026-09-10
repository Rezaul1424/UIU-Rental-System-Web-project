import { Badge } from '../../components/ui'
import { DonutChart, BarChartH } from '../../components/Charts'
import type { Listing } from '../../types'
import type { LandlordRow, StudentRow } from '../../data'

type ReportsPageProps = {
  listings: Listing[]
  lRows: LandlordRow[]
  sRows: StudentRow[]
  maintenanceRequests: { id: number; listing: string; tenant: string; issue: string; date: string; status: string }[]
}

export default function ReportsPage({ listings, lRows, sRows, maintenanceRequests }: ReportsPageProps) {
  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform-wide metrics and data visualisations</p>
        </div>
        <button className="text-xs bg-white border border-gray-200 text-[#111827] font-semibold px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">⬇ Export All</button>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="font-semibold text-[#111827]">User Growth</div>
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">↑ 34% YoY</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">New registrations per month (students + landlords)</p>
          {(() => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
            const vals = [3, 5, 6, 7, 9, 11, 14, 17]
            const W = 340, H = 110, PAD = 20
            const max = Math.max(...vals) + 2
            const xs = vals.map((_, i) => PAD + i * ((W - PAD * 2) / (vals.length - 1)))
            const ys = vals.map(v => H - PAD - (v / max) * (H - PAD * 2))
            const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ')
            const area = `${path} L${xs[xs.length - 1]},${H - PAD} L${xs[0]},${H - PAD} Z`
            return (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                <defs><linearGradient id="ug" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#111827" stopOpacity="0.18"/><stop offset="100%" stopColor="#111827" stopOpacity="0"/></linearGradient></defs>
                {[0, 0.5, 1].map(f => <line key={String(f)} x1={PAD} y1={PAD + (1 - f) * (H - PAD * 2)} x2={W - PAD} y2={PAD + (1 - f) * (H - PAD * 2)} stroke="#f3f4f6" strokeWidth="1"/>)}
                <path d={area} fill="url(#ug)"/>
                <path d={path} fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                {xs.map((x, i) => <g key={i}><circle cx={x} cy={ys[i]} r="3" fill="#111827"/><text x={x} y={H - 4} textAnchor="middle" fontSize="8" fill="#9ca3af">{months[i]}</text></g>)}
              </svg>
            )
          })()}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="font-semibold text-[#111827] mb-1">Rent Collection (৳k)</div>
          <p className="text-xs text-gray-400 mb-3">Collected vs. expected — last 6 months</p>
          {(() => {
            const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
            const col = [12, 14, 16, 18.2, 21, 19.5]
            const exp = [15, 15, 18, 21, 21, 22]
            const W = 340, H = 110, PAD = 20
            const maxV = Math.max(...exp) + 2
            const gap = (W - PAD * 2) / months.length
            const bw = 10
            return (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                {[0, 0.5, 1].map(f => <line key={String(f)} x1={PAD} y1={PAD + (1 - f) * (H - PAD * 1.5)} x2={W - PAD} y2={PAD + (1 - f) * (H - PAD * 1.5)} stroke="#f3f4f6" strokeWidth="1"/>)}
                {months.map((m, i) => {
                  const cx = PAD + i * gap + gap / 2
                  const he = (exp[i] / maxV) * (H - PAD * 1.5)
                  const hc = (col[i] / maxV) * (H - PAD * 1.5)
                  return (
                    <g key={m}>
                      <rect x={cx - bw - 1} y={H - PAD * 0.5 - he} width={bw} height={he} fill="#e5e7eb" rx="2"/>
                      <rect x={cx + 1} y={H - PAD * 0.5 - hc} width={bw} height={hc} fill="#111827" rx="2"/>
                      <text x={cx} y={H - 4} textAnchor="middle" fontSize="8" fill="#9ca3af">{m}</text>
                    </g>
                  )
                })}
              </svg>
            )
          })()}
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#111827]"/><span className="text-xs text-gray-500">Collected</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-200"/><span className="text-xs text-gray-500">Expected</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="font-semibold text-[#111827] mb-1">Listing Activity</div>
          <p className="text-xs text-gray-400 mb-3">New listings added vs. occupied per month</p>
          {(() => {
            const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
            const added = [2, 1, 3, 2, 4, 3]
            const occupied = [1, 2, 2, 3, 4, 5]
            const W = 340, H = 110, PAD = 20
            const max = Math.max(...occupied, ...added) + 1
            const xs = added.map((_, i) => PAD + i * ((W - PAD * 2) / (added.length - 1)))
            const ya = added.map(v => H - PAD - (v / max) * (H - PAD * 2))
            const yo = occupied.map(v => H - PAD - (v / max) * (H - PAD * 2))
            const pA = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ya[i]}`).join(' ')
            const pO = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${yo[i]}`).join(' ')
            return (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                {[0, 0.5, 1].map(f => <line key={String(f)} x1={PAD} y1={PAD + (1 - f) * (H - PAD * 2)} x2={W - PAD} y2={PAD + (1 - f) * (H - PAD * 2)} stroke="#f3f4f6" strokeWidth="1"/>)}
                <path d={pO} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d={pA} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2"/>
                {xs.map((x, i) => <g key={i}><circle cx={x} cy={ya[i]} r="3" fill="#3b82f6"/><circle cx={x} cy={yo[i]} r="3" fill="#10b981"/><text x={x} y={H - 4} textAnchor="middle" fontSize="8" fill="#9ca3af">{months[i]}</text></g>)}
              </svg>
            )
          })()}
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 bg-[#3b82f6]"/><span className="text-xs text-gray-500">New Listings</span></div>
            <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 bg-emerald-500"/><span className="text-xs text-gray-500">Occupied</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="font-semibold text-[#111827] mb-1">Maintenance Request Volume</div>
          <p className="text-xs text-gray-400 mb-3">Monthly request count by status</p>
          {(() => {
            const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
            const open = [1, 0, 1, 1, 2, 1]
            const prog = [0, 1, 1, 0, 1, 2]
            const res = [1, 1, 1, 2, 2, 3]
            const W = 340, H = 110, PAD = 20
            const maxV = Math.max(...open.map((_, i) => open[i] + prog[i] + res[i])) + 1
            const gap = (W - PAD * 2) / months.length
            const bw = 16
            return (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                {[0, 0.5, 1].map(f => <line key={String(f)} x1={PAD} y1={PAD + (1 - f) * (H - PAD * 1.5)} x2={W - PAD} y2={PAD + (1 - f) * (H - PAD * 1.5)} stroke="#f3f4f6" strokeWidth="1"/>)}
                {months.map((m, i) => {
                  const cx = PAD + i * gap + gap / 2
                  const base = H - PAD * 0.5
                  const hR = (res[i] / maxV) * (H - PAD * 1.5)
                  const hP = (prog[i] / maxV) * (H - PAD * 1.5)
                  const hO = (open[i] / maxV) * (H - PAD * 1.5)
                  return (
                    <g key={m}>
                      <rect x={cx - bw / 2} y={base - hR} width={bw} height={hR} fill="#10b981" rx="2"/>
                      <rect x={cx - bw / 2} y={base - hR - hP} width={bw} height={hP} fill="#f59e0b"/>
                      <rect x={cx - bw / 2} y={base - hR - hP - hO} width={bw} height={hO} fill="#ef4444" rx="0"/>
                      <text x={cx} y={H - 4} textAnchor="middle" fontSize="8" fill="#9ca3af">{m}</text>
                    </g>
                  )
                })}
              </svg>
            )
          })()}
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500"/><span className="text-xs text-gray-500">Resolved</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-400"/><span className="text-xs text-gray-500">In Progress</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500"/><span className="text-xs text-gray-500">Open</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="font-semibold text-[#111827] mb-1">Occupancy Status</div>
          <p className="text-xs text-gray-400 mb-3">Current across {listings.length} listings</p>
          <DonutChart segments={[
            { label: 'Occupied', value: listings.filter(l => l.status === 'occupied').length, color: '#111827' },
            { label: 'Available', value: listings.filter(l => l.status === 'available').length, color: '#10b981' },
            { label: 'Unavailable', value: listings.filter(l => l.status === 'unavailable').length, color: '#e5e7eb' },
          ]} />
          <div className="mt-3 space-y-1">
            {[{ l: 'Occupied', c: 'bg-[#111827]', v: listings.filter(l => l.status === 'occupied').length }, { l: 'Available', c: 'bg-emerald-500', v: listings.filter(l => l.status === 'available').length }, { l: 'Unavailable', c: 'bg-gray-200', v: listings.filter(l => l.status === 'unavailable').length }].map(s => (
              <div key={s.l} className="flex items-center justify-between text-xs"><div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${s.c}`} /><span className="text-gray-600">{s.l}</span></div><span className="font-bold">{s.v}</span></div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="font-semibold text-[#111827] mb-1">Rent Collection — Aug 2026</div>
          <p className="text-xs text-gray-400 mb-3">Collected vs. pending this month</p>
          <DonutChart segments={[
            { label: 'Collected', value: 19500, color: '#111827' },
            { label: 'Pending', value: 2500, color: '#f59e0b' },
            { label: 'Overdue', value: 1000, color: '#ef4444' },
          ]} />
          <div className="mt-3 space-y-1">
            {[{ l: 'Collected ৳19.5k', c: 'bg-[#111827]' }, { l: 'Pending ৳2.5k', c: 'bg-amber-400' }, { l: 'Overdue ৳1k', c: 'bg-red-500' }].map(s => (
              <div key={s.l} className="flex items-center gap-1.5 text-xs"><div className={`w-2 h-2 rounded-full ${s.c}`} /><span className="text-gray-600">{s.l}</span></div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="font-semibold text-[#111827] mb-1">Account Health</div>
          <p className="text-xs text-gray-400 mb-3">All users by account status</p>
          <DonutChart segments={[
            { label: 'Active', value: lRows.filter(r => r.status === 'active').length + sRows.filter(r => r.status === 'active').length, color: '#10b981' },
            { label: 'Pending', value: lRows.filter(r => r.status === 'pending').length + sRows.filter(r => r.status === 'pending').length, color: '#f59e0b' },
            { label: 'Suspended', value: lRows.filter(r => r.status === 'suspended').length + sRows.filter(r => r.status === 'suspended').length, color: '#ef4444' },
          ]} />
          <div className="mt-3 space-y-1">
            {[{ l: 'Active', c: 'bg-emerald-500' }, { l: 'Pending', c: 'bg-amber-400' }, { l: 'Suspended', c: 'bg-red-500' }].map(s => (
              <div key={s.l} className="flex items-center gap-1.5 text-xs"><div className={`w-2 h-2 rounded-full ${s.c}`} /><span className="text-gray-600">{s.l}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="font-semibold text-[#111827] mb-1">Listings by Property Type</div>
          <p className="text-xs text-gray-400 mb-4">Count of each room type across all landlords</p>
          <BarChartH bars={['Single', 'Shared', 'Mess', 'Sublet'].map(t => ({
            label: t,
            value: listings.filter(l => l.type === t).length,
            color: t === 'Single' ? '#111827' : t === 'Shared' ? '#3b82f6' : t === 'Mess' ? '#10b981' : '#f59e0b',
          }))} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="font-semibold text-[#111827] mb-1">Account Status Breakdown</div>
          <p className="text-xs text-gray-400 mb-4">Landlords vs. students by status</p>
          <div className="space-y-3">
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1.5">Landlords</div>
              <BarChartH bars={[
                { label: 'Active', value: lRows.filter(r => r.status === 'active').length, color: '#10b981' },
                { label: 'Pending', value: lRows.filter(r => r.status === 'pending').length, color: '#f59e0b' },
                { label: 'Suspended', value: lRows.filter(r => r.status === 'suspended').length, color: '#ef4444' },
              ]} />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1.5">Students</div>
              <BarChartH bars={[
                { label: 'Active', value: sRows.filter(r => r.status === 'active').length, color: '#10b981' },
                { label: 'Pending', value: sRows.filter(r => r.status === 'pending').length, color: '#f59e0b' },
                { label: 'Suspended', value: sRows.filter(r => r.status === 'suspended').length, color: '#ef4444' },
              ]} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="font-semibold text-[#111827]">Maintenance Requests Log</div>
          <button className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50">⬇ Export</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">{['Property', 'Tenant', 'Issue', 'Date', 'Status'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {maintenanceRequests.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-500">{r.listing}</td>
                <td className="px-4 py-3 font-medium text-[#111827]">{r.tenant}</td>
                <td className="px-4 py-3 text-sm">{r.issue}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.date}</td>
                <td className="px-4 py-3"><Badge variant={r.status === 'resolved' ? 'success' : r.status === 'in-progress' ? 'info' : 'warning'}>{r.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
