import { DonutChart, BarChartH } from '../../components/Charts'
import { Stat } from '../../components/ui'
import type { AdminReportData } from '../../api/admin'
import type { LandlordRow, StudentRow } from '../../data'
import type { AdminPage } from './Sidebar'

type OverviewPageProps = {
  report: AdminReportData | null
  reportError: string
  isLoadingReport: boolean
  onRetryReport: () => void
  lRows: LandlordRow[]
  sRows: StudentRow[]
  pendingLandlords: number
  pendingStudents: number
  setPage: (page: AdminPage) => void
}

function monthLabel(value: string): string {
  const [year, month] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en', { month: 'short', timeZone: 'UTC' })
}

function timeAgo(value: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function OverviewPage({ report, reportError, isLoadingReport, onRetryReport, lRows, sRows, pendingLandlords, pendingStudents, setPage }: OverviewPageProps) {
  const statuses = report?.listingStatuses
  const registrations = report?.userGrowth.slice(-6) ?? []
  const rent = report?.rentCollection ?? []
  const expectedRent = rent.reduce((sum, item) => sum + item.expected, 0)
  const collectedRent = rent.reduce((sum, item) => sum + item.collected, 0)
  const openMaintenance = report?.maintenanceByMonth.at(-1)
  const activityIcons: Record<string, string> = { Registration: '🎓', Application: '📬', Payment: '💳', Maintenance: '🔧', Complaint: '⚠️' }
  const activityColors: Record<string, string> = {
    Registration: 'bg-gray-50 text-gray-500', Application: 'bg-amber-50 text-amber-600', Payment: 'bg-sky-50 text-sky-600',
    Maintenance: 'bg-purple-50 text-purple-600', Complaint: 'bg-red-50 text-red-600',
  }

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium mb-0.5">Welcome back 👋</p>
          <h1 className="text-2xl font-bold text-[#111827]">Admin Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">UIU Rental — live platform metrics</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400"><div className="w-2 h-2 bg-emerald-400 rounded-full" /> Database connected</div>
      </div>

      {isLoadingReport && !report && <div role="status" className="rounded-xl bg-white p-4 text-sm text-gray-500">Loading dashboard data…</div>}
      {reportError && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><span>{reportError}</span><button onClick={onRetryReport} className="font-semibold underline">Retry</button></div>}

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: 'Total Users', value: lRows.length + sRows.length, sub: `${lRows.length} landlords · ${sRows.length} students`, icon: '👥' },
          { label: 'Total Listings', value: statuses ? statuses.available + statuses.occupied + statuses.maintenance : 0, sub: `${statuses?.available ?? 0} available`, icon: '🏠' },
          { label: 'Occupied Rooms', value: statuses?.occupied ?? 0, sub: `${statuses ? Math.round(statuses.occupied / Math.max(1, statuses.available + statuses.occupied + statuses.maintenance) * 100) : 0}% occupancy`, icon: '🔑' },
          { label: 'Pending Approvals', value: pendingLandlords + pendingStudents, sub: 'Needs review', icon: '⏳' },
          { label: 'Active Leases', value: report?.activeLeases ?? 0, sub: 'Current database total', icon: '📄' },
          { label: 'Reported Issues', value: report?.openComplaints ?? 0, sub: 'Awaiting action', icon: '🚨' },
        ].map(item => <Stat key={item.label} label={item.label} value={item.value} sub={item.sub} icon={item.icon} />)}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <section className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4"><div className="font-semibold text-[#111827]">User Registrations — Last 6 Months</div><span className="text-xs text-gray-400">From database</span></div>
            <BarChartH bars={registrations.flatMap(item => [
              { label: `${monthLabel(item.month)} Students`, value: item.students, color: '#111827' },
              { label: `${monthLabel(item.month)} Landlords`, value: item.landlords, color: '#10b981' },
            ])} />
          </section>

          <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between"><div className="font-semibold text-[#111827]">Recent Platform Activity</div><button onClick={() => setPage('reports')} className="text-xs text-gray-400 hover:text-[#111827]">View reports →</button></div>
            <div className="divide-y divide-gray-50">
              {(report?.recentActivity ?? []).length === 0 && <div className="px-5 py-6 text-sm text-gray-400">No recent activity recorded.</div>}
              {(report?.recentActivity ?? []).map(activity => (
                <div key={activity.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${activityColors[activity.type] ?? 'bg-gray-50 text-gray-500'}`}>{activityIcons[activity.type] ?? '•'}</div>
                  <div className="flex-1 min-w-0 text-sm text-[#111827] truncate">{activity.text}</div>
                  <div className="flex-shrink-0 text-right"><div className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{activity.type}</div><div className="text-[10px] text-gray-400 mt-0.5">{timeAgo(activity.createdAt)}</div></div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm p-5">
            <div className="font-semibold text-[#111827] mb-1">Monthly Rent Collection</div><p className="text-xs text-gray-400 mb-4">Collected vs expected · last 6 months</p>
            <BarChartH bars={rent.slice(-6).flatMap(item => [
              { label: `${monthLabel(item.month)} Collected`, value: item.collected, color: '#111827' },
              { label: `${monthLabel(item.month)} Expected`, value: item.expected, color: '#d1d5db' },
            ])} />
          </section>
        </div>

        <div className="space-y-4">
          <section className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3"><div className="font-semibold text-[#111827]">Pending Approvals</div>{(pendingLandlords + pendingStudents) > 0 && <span className="text-[11px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{pendingLandlords + pendingStudents}</span>}</div>
            {pendingLandlords > 0 && <div className="flex items-center justify-between py-2.5 border-b border-gray-50"><div><div className="text-sm font-medium text-[#111827]">{pendingLandlords} Landlord{pendingLandlords > 1 ? 's' : ''}</div><div className="text-xs text-gray-400">Awaiting verification</div></div><button onClick={() => setPage('landlords')} className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-lg">Review →</button></div>}
            {pendingStudents > 0 && <div className="flex items-center justify-between py-2.5"><div><div className="text-sm font-medium text-[#111827]">{pendingStudents} Student{pendingStudents > 1 ? 's' : ''}</div><div className="text-xs text-gray-400">Awaiting approval</div></div><button onClick={() => setPage('students')} className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-lg">Review →</button></div>}
            {pendingLandlords === 0 && pendingStudents === 0 && <div className="flex items-center gap-2 text-sm text-emerald-600 py-2">✓ All accounts up to date</div>}
          </section>

          <section className="bg-white rounded-2xl shadow-sm p-5">
            <div className="font-semibold text-[#111827] mb-1">Listing Status</div><p className="text-xs text-gray-400 mb-3">Current across all properties</p>
            <DonutChart segments={[
              { label: 'Occupied', value: statuses?.occupied ?? 0, color: '#111827' },
              { label: 'Available', value: statuses?.available ?? 0, color: '#10b981' },
              { label: 'Maintenance', value: statuses?.maintenance ?? 0, color: '#e5e7eb' },
            ]} />
          </section>

          <section className="bg-white rounded-2xl shadow-sm p-5">
            <div className="font-semibold text-[#111827] mb-3">Maintenance Status</div>
            <BarChartH bars={[
              { label: 'Open', value: openMaintenance?.open ?? 0, color: '#ef4444' },
              { label: 'In Progress', value: openMaintenance?.inProgress ?? 0, color: '#f59e0b' },
              { label: 'Resolved', value: openMaintenance?.resolved ?? 0, color: '#10b981' },
            ]} />
          </section>

          <section className="bg-white rounded-2xl shadow-sm p-5">
            <div className="font-semibold text-[#111827] mb-3">Quick Actions</div><div className="space-y-1">
              {[
                { label: '🏘️ Landlord Accounts', page: 'landlords' as const }, { label: '🎓 Student Accounts', page: 'students' as const },
                { label: '🏷️ Manage Categories', page: 'categories' as const }, { label: '📊 View Reports', page: 'reports' as const },
              ].map(action => <button key={action.label} onClick={() => setPage(action.page)} className="w-full flex items-center gap-2 text-sm text-left px-3 py-2 rounded-xl hover:bg-gray-50 text-[#111827]">{action.label}</button>)}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
