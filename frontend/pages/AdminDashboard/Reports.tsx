import { Badge, Stat } from '../../components/ui'
import { BarChartH, DonutChart } from '../../components/Charts'
import type { AdminReportData } from '../../api/admin'
import type { jsPDF } from 'jspdf'

type ReportsPageProps = {
  report: AdminReportData | null
  isLoading: boolean
  error: string
  onRetry: () => void
}

function monthLabel(value: string): string {
  const [year, month] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en', { month: 'short', year: '2-digit', timeZone: 'UTC' })
}

async function downloadReport(report: AdminReportData): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 14
  const landlords = report.accountStatuses.landlords
  const students = report.accountStatuses.students
  const totalUsers = Object.values(landlords).reduce((sum, value) => sum + value, 0)
    + Object.values(students).reduce((sum, value) => sum + value, 0)
  const totalListings = Object.values(report.listingStatuses).reduce((sum, value) => sum + value, 0)
  const currentRent = report.rentCollection.at(-1)
  let cursorY = 47

  pdf.setProperties({ title: 'UIU Rental System Report', subject: 'Reports and analytics' })
  pdf.setFillColor(17, 24, 39)
  pdf.rect(0, 0, pageWidth, 37, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.text('UIU Rental System', margin, 15)
  pdf.setFontSize(11)
  pdf.text('Reports & Analytics', margin, 23)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text(`Generated ${new Date(report.generatedAt).toLocaleString('en')}`, margin, 30)

  const addTable = (title: string, headers: string[], rows: (string | number)[][]): void => {
    if (cursorY > pageHeight - 34) {
      pdf.addPage()
      cursorY = 18
    }

    pdf.setTextColor(17, 24, 39)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.text(title, margin, cursorY)
    cursorY += 3

    autoTable(pdf, {
      startY: cursorY,
      head: [headers],
      body: rows.length > 0 ? rows : [['No records', ...headers.slice(1).map(() => '')]],
      margin: { left: margin, right: margin, bottom: 16 },
      styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [17, 24, 39], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 249] },
      showHead: 'everyPage',
    })
    cursorY = (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cursorY
    cursorY += 9
  }

  const accountRows = (status: Record<'active' | 'pending' | 'suspended' | 'deactivated', number>) => [
    status.active,
    status.pending,
    status.suspended,
    status.deactivated,
  ]

  addTable('Summary', ['Metric', 'Value'], [
    ['Total users', totalUsers],
    ['Landlords', Object.values(landlords).reduce((sum, value) => sum + value, 0)],
    ['Students', Object.values(students).reduce((sum, value) => sum + value, 0)],
    ['Total listings', totalListings],
    ['Active leases', report.activeLeases],
    ['Open complaints', report.openComplaints],
    ['Maintenance requests', report.maintenanceRequests.length],
    ['Rent collected in latest period', `BDT ${(currentRent?.collected ?? 0).toLocaleString('en')}`],
  ])
  addTable('User Growth', ['Month', 'Students', 'Landlords', 'Total'], report.userGrowth.map(item => [
    monthLabel(item.month), item.students, item.landlords, item.students + item.landlords,
  ]))
  addTable('Rent Collection', ['Month', 'Expected (BDT)', 'Collected (BDT)', 'Pending (BDT)', 'Overdue (BDT)'], report.rentCollection.map(item => [
    monthLabel(item.month), item.expected.toLocaleString('en'), item.collected.toLocaleString('en'),
    item.pending.toLocaleString('en'), item.overdue.toLocaleString('en'),
  ]))
  addTable('Listing Activity', ['Month', 'New listings'], report.listingActivity.map(item => [monthLabel(item.month), item.newListings]))
  addTable('Listing Status', ['Status', 'Listings'], [
    ['Available', report.listingStatuses.available],
    ['Occupied', report.listingStatuses.occupied],
    ['Maintenance', report.listingStatuses.maintenance],
  ])
  addTable('Listings by Property Type', ['Type', 'Listings'], report.listingTypes.map(item => [item.type, item.count]))
  addTable('Account Status', ['Role', 'Active', 'Pending', 'Suspended', 'Deactivated'], [
    ['Landlords', ...accountRows(landlords)],
    ['Students', ...accountRows(students)],
  ])
  addTable('Maintenance by Month', ['Month', 'Open', 'In progress', 'Resolved'], report.maintenanceByMonth.map(item => [
    monthLabel(item.month), item.open, item.inProgress, item.resolved,
  ]))
  addTable('Recent Activity', ['Date', 'Type', 'Details'], report.recentActivity.map(item => [
    new Date(item.createdAt).toLocaleDateString('en'), item.type, item.text,
  ]))
  addTable('Maintenance Requests', ['ID', 'Date', 'Issue', 'Property', 'Tenant', 'Status'], report.maintenanceRequests.map(item => [
    item.id, new Date(item.createdAt).toLocaleDateString('en'), item.issue, item.property, item.tenant, item.status,
  ]))

  const pageCount = pdf.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page)
    pdf.setTextColor(120, 120, 120)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text('UIU Rental System - Confidential', margin, pageHeight - 8)
    pdf.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
  }

  pdf.save(`uiu-rental-report-${new Date().toISOString().slice(0, 10)}.pdf`)
}

const formatMoney = (value: number) => `৳${value.toLocaleString()}`

export default function ReportsPage({ report, isLoading, error, onRetry }: ReportsPageProps) {
  if (isLoading && !report) {
    return <div role="status" className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500">Loading reports from the database…</div>
  }

  if (error && !report) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <p>{error}</p>
        <button onClick={onRetry} className="mt-3 rounded-lg bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800">Retry</button>
      </div>
    )
  }

  if (!report) return null

  const landlords = report.accountStatuses.landlords
  const students = report.accountStatuses.students
  const currentRent = report.rentCollection.at(-1)
  const totalUsers = Object.values(landlords).reduce((sum, value) => sum + value, 0)
    + Object.values(students).reduce((sum, value) => sum + value, 0)
  const totalListings = Object.values(report.listingStatuses).reduce((sum, value) => sum + value, 0)

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Reports &amp; Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform metrics from your database · refreshed {new Date(report.generatedAt).toLocaleString()}</p>
        </div>
        <button onClick={() => void downloadReport(report)} className="text-xs bg-white border border-gray-200 text-[#111827] font-semibold px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">⬇ Download report PDF</button>
      </div>
      {error && <div role="alert" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Could not refresh reports: {error}</div>}
      {isLoading && <div role="status" className="text-xs text-gray-400">Refreshing report data…</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Users" value={totalUsers} sub={`${landlords.active + landlords.pending + landlords.suspended + landlords.deactivated} landlords · ${students.active + students.pending + students.suspended + students.deactivated} students`} icon="👥" />
        <Stat label="Listings" value={totalListings} sub={`${report.listingStatuses.available} available · ${report.listingStatuses.occupied} occupied`} icon="🏠" />
        <Stat label="Rent collected" value={formatMoney(currentRent?.collected ?? 0)} sub={`${currentRent ? monthLabel(currentRent.month) : 'Current period'}`} icon="💳" />
        <Stat label="Maintenance requests" value={report.maintenanceRequests.length} sub="Most recent 100 records" icon="🔧" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-[#111827] mb-1">User Growth</h2>
          <p className="text-xs text-gray-400 mb-4">New student and landlord registrations by month · last 8 months</p>
          <BarChartH bars={report.userGrowth.flatMap(item => [
            { label: `${monthLabel(item.month)} · Students`, value: item.students, color: '#111827' },
            { label: `${monthLabel(item.month)} · Landlords`, value: item.landlords, color: '#10b981' },
          ])} />
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-[#111827] mb-1">Rent Collection</h2>
          <p className="text-xs text-gray-400 mb-4">Recorded paid, pending and overdue rent · last 6 months</p>
          <div className="space-y-4">
            {report.rentCollection.map(item => (
              <div key={item.month}>
                <div className="flex justify-between text-xs mb-1"><span className="font-medium text-gray-600">{monthLabel(item.month)}</span><span className="text-gray-400">Expected {formatMoney(item.expected)}</span></div>
                <div className="flex h-3 overflow-hidden rounded-full bg-gray-100" title={`Collected ${formatMoney(item.collected)}, pending ${formatMoney(item.pending)}, overdue ${formatMoney(item.overdue)}`}>
                  {item.expected > 0 && <>
                    <div className="bg-[#111827]" style={{ width: `${Math.min(100, item.collected / item.expected * 100)}%` }} />
                    <div className="bg-amber-400" style={{ width: `${Math.min(100, item.pending / item.expected * 100)}%` }} />
                    <div className="bg-red-500" style={{ width: `${Math.min(100, item.overdue / item.expected * 100)}%` }} />
                  </>}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">Collected {formatMoney(item.collected)} · Pending {formatMoney(item.pending)} · Overdue {formatMoney(item.overdue)}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-[#111827] mb-1">Listing Activity</h2>
          <p className="text-xs text-gray-400 mb-4">Listings created by month · last 6 months</p>
          <BarChartH bars={report.listingActivity.map(item => ({ label: monthLabel(item.month), value: item.newListings, color: '#3b82f6' }))} />
        </section>
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-[#111827] mb-1">Maintenance Request Volume</h2>
          <p className="text-xs text-gray-400 mb-4">Current request statuses by creation month · last 6 months</p>
          <BarChartH bars={report.maintenanceByMonth.flatMap(item => [
            { label: `${monthLabel(item.month)} · Open`, value: item.open, color: '#ef4444' },
            { label: `${monthLabel(item.month)} · In progress`, value: item.inProgress, color: '#f59e0b' },
            { label: `${monthLabel(item.month)} · Resolved`, value: item.resolved, color: '#10b981' },
          ])} />
        </section>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-[#111827] mb-1">Occupancy Status</h2>
          <p className="text-xs text-gray-400 mb-3">Current across {totalListings} listings</p>
          <DonutChart segments={[
            { label: 'Occupied', value: report.listingStatuses.occupied, color: '#111827' },
            { label: 'Available', value: report.listingStatuses.available, color: '#10b981' },
            { label: 'Maintenance', value: report.listingStatuses.maintenance, color: '#f59e0b' },
          ]} />
        </section>
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-[#111827] mb-1">Rent Status</h2>
          <p className="text-xs text-gray-400 mb-3">{currentRent ? monthLabel(currentRent.month) : 'Latest month with records'}</p>
          <DonutChart segments={[
            { label: 'Collected', value: currentRent?.collected ?? 0, color: '#111827' },
            { label: 'Pending', value: currentRent?.pending ?? 0, color: '#f59e0b' },
            { label: 'Overdue', value: currentRent?.overdue ?? 0, color: '#ef4444' },
          ]} />
        </section>
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-[#111827] mb-1">Account Health</h2>
          <p className="text-xs text-gray-400 mb-3">All landlord and student accounts</p>
          <DonutChart segments={[
            { label: 'Active', value: landlords.active + students.active, color: '#10b981' },
            { label: 'Pending', value: landlords.pending + students.pending, color: '#f59e0b' },
            { label: 'Suspended', value: landlords.suspended + students.suspended, color: '#ef4444' },
            { label: 'Deactivated', value: landlords.deactivated + students.deactivated, color: '#9ca3af' },
          ]} />
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-[#111827] mb-1">Listings by Property Type</h2>
          <p className="text-xs text-gray-400 mb-4">Current property counts by type</p>
          <BarChartH bars={report.listingTypes.map(item => ({
            label: item.type,
            value: item.count,
            color: item.type === 'Single' ? '#111827' : item.type === 'Shared' ? '#3b82f6' : item.type === 'Mess' ? '#10b981' : '#f59e0b',
          }))} />
        </section>
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-[#111827] mb-3">Account Status Breakdown</h2>
          <div className="space-y-4">
            {(['landlords', 'students'] as const).map(role => (
              <div key={role}>
                <h3 className="text-xs font-semibold text-gray-500 capitalize mb-2">{role}</h3>
                <BarChartH bars={Object.entries(report.accountStatuses[role]).map(([status, value]) => ({
                  label: status,
                  value,
                  color: status === 'active' ? '#10b981' : status === 'pending' ? '#f59e0b' : status === 'suspended' ? '#ef4444' : '#9ca3af',
                }))} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[#111827]">Maintenance Requests Log</h2>
            <p className="text-xs text-gray-400 mt-0.5">Most recent 100 database records</p>
          </div>
          <Badge variant="info">{report.maintenanceRequests.length} records</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">{['Property', 'Tenant', 'Issue', 'Date', 'Status'].map(heading => <th key={heading} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {report.maintenanceRequests.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No maintenance requests found.</td></tr>}
              {report.maintenanceRequests.map(request => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500">{request.property}</td>
                  <td className="px-4 py-3 font-medium text-[#111827]">{request.tenant}</td>
                  <td className="px-4 py-3">{request.issue}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{new Date(request.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><Badge variant={request.status === 'resolved' ? 'success' : request.status === 'in-progress' ? 'warning' : 'danger'}>{request.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
