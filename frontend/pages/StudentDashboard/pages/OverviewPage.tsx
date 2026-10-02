import { Badge, Stat } from '../../../components/ui'
import type { MaintenanceRequest, StudentPage, Application } from '../types'

type LeaseInfo = {
  id?: string
  propertyId: string
  propertyTitle?: string
  propertyCode?: string
  landlordId?: string
  landlordName?: string
  status: string
  startDate?: string
  endDate?: string
  monthlyRent?: number
}

type RentItem = {
  id: string
  leaseId: string
  month: string
  amount: number
  dueDate: string
  status: string
  paid: boolean
}

type OverviewPageProps = {
  userName: string
  applications: Application[]
  myRequests: MaintenanceRequest[]
  onNavigate: (page: StudentPage) => void
  openChatWith: (landlordName: string) => void
  setShowNewReq: (value: boolean | ((prev: boolean) => boolean)) => void
  leases?: LeaseInfo[]
  rentSummary?: RentItem[]
}

export default function OverviewPage({
  userName,
  applications,
  myRequests,
  onNavigate,
  openChatWith,
  setShowNewReq,
  leases = [],
  rentSummary = [],
}: OverviewPageProps) {
  const activeLease = leases.find((l) => l.status === 'active') ?? leases[0]
  const pendingApplicationCount = applications.filter((application) => application.status === 'under-review').length
  const pendingRent = rentSummary.find((r) => !r.paid && r.status !== 'paid') ?? rentSummary[0]

  const propertyName = activeLease?.propertyTitle || (activeLease?.propertyCode ? activeLease.propertyCode : (activeLease ? `Property ${activeLease.propertyId}` : ''))
  const currentRentValue = activeLease ? `৳${(activeLease.monthlyRent ?? pendingRent?.amount ?? 0).toLocaleString()}` : '—'
  const currentRentSub = propertyName || 'No active lease'

  const dueDateFormatted = pendingRent?.dueDate
    ? new Date(pendingRent.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : (activeLease ? '1st of month' : '—')
  const rentDueSub = pendingRent?.month || (activeLease ? 'Next month' : 'No dues')

  return (
    <>
      <div>
        <p className="text-xs text-gray-400 font-medium mb-0.5">Hi, {(userName || 'Student').split(' ')[0]} 👋</p>
        <h1 className="text-2xl font-bold text-[#111827]">Student Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Your housing at a glance</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Applications" value={pendingApplicationCount} sub="Under review" icon="📋" />
        <Stat label="Current Rent" value={currentRentValue} sub={currentRentSub} icon="🏠" />
        <Stat label="Rent Due" value={dueDateFormatted} sub={rentDueSub} icon="📅" />
        <Stat label="Maintenance" value={myRequests.filter(r => r.status !== 'resolved').length} sub="Open requests" icon="🔧" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="font-semibold text-[#111827] mb-4">Recent Activity</div>
            <div className="space-y-4">
              {[
                { date: 'In progress', icon: '📋', text: `You have ${pendingApplicationCount} housing application(s) under review` },
                { date: 'Active', icon: '🔧', text: `${myRequests.filter(r => r.status !== 'resolved').length} pending maintenance issue(s)` },
                { date: 'Status', icon: '🏠', text: activeLease ? `Active tenancy at ${propertyName}` : 'No active lease registered yet' },
              ].map((entry, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">{entry.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#111827] leading-snug">{entry.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{entry.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="font-semibold text-[#111827] mb-3">Your Current Property</div>
            {activeLease ? (
              <>
                <div className="rounded-xl overflow-hidden mb-3">
                  <img
                    src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=240&fit=crop&auto=format"
                    alt={propertyName}
                    className="w-full h-36 object-cover"
                  />
                </div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-semibold text-[#1a1a18]">{propertyName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{activeLease.landlordName || 'Landlord'} · Near UIU</div>
                  </div>
                  <Badge variant={activeLease.status === 'active' ? 'success' : 'default'}>
                    {activeLease.status === 'active' ? 'Active Lease' : activeLease.status}
                  </Badge>
                </div>
                <div className="text-xs text-gray-400 mb-3">
                  {activeLease.startDate ? `Lease started ${new Date(activeLease.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}` : 'Active Tenancy'}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onNavigate('pay-rent')} className="flex-1 text-xs bg-[#111827] text-white py-2 rounded-lg font-semibold hover:bg-[#1f2937] transition-colors">💳 Pay Rent</button>
                  <button onClick={() => { onNavigate('maintenance'); setShowNewReq(true) }} className="flex-1 text-xs border border-gray-200 text-gray-600 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors">🔧 Maintenance</button>
                  <button onClick={() => openChatWith(activeLease.landlordName || 'Landlord')} className="flex-1 text-xs border border-gray-200 text-gray-600 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors">💬 Chat</button>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center text-xl mx-auto mb-3">🏠</div>
                <div className="font-semibold text-[#111827] mb-1">No Active Lease</div>
                <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
                  You don't have an active tenancy yet. Explore available properties near UIU and submit your application.
                </p>
                <button
                  onClick={() => onNavigate('browse')}
                  className="text-xs bg-[#111827] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#1f2937] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>🔍</span> Browse Listings
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Next Rent Due</div>
            {activeLease ? (
              <div className="text-center py-2">
                <div className="text-3xl font-black text-[#111827]">
                  ৳{(pendingRent?.amount ?? activeLease.monthlyRent ?? 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Due on <span className="font-semibold text-[#111827]">
                    {pendingRent?.dueDate ? new Date(pendingRent.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '1st of next month'}
                  </span>
                </div>
                {pendingRent && !pendingRent.paid && pendingRent.status !== 'paid' ? (
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                    ⏰ Payment Pending
                  </div>
                ) : (
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                    ✅ All Caught Up
                  </div>
                )}
                <button
                  onClick={() => onNavigate('pay-rent')}
                  className="w-full mt-3 bg-[#111827] text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-[#1f2937] transition-colors"
                >
                  {pendingRent && !pendingRent.paid ? 'Pay Now' : 'View Rent History'}
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-2xl font-black text-gray-400">—</div>
                <p className="text-xs text-gray-400 mt-1 mb-3">No pending rent dues</p>
                <button
                  onClick={() => onNavigate('browse')}
                  className="w-full bg-gray-100 text-gray-700 text-xs font-semibold py-2.5 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Explore Listings
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Maintenance Summary</div>
            <div className="space-y-2">
              {[
                { label: 'Open', count: myRequests.filter(r => r.status === 'open').length, color: 'bg-amber-500' },
                { label: 'In Progress', count: myRequests.filter(r => r.status === 'in-progress').length, color: 'bg-sky-500' },
                { label: 'Resolved', count: myRequests.filter(r => r.status === 'resolved').length, color: 'bg-emerald-500' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="text-xs text-gray-500 w-20">{item.label}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${Math.min(100, item.count * 33)}%` }} />
                  </div>
                  <div className="text-xs font-semibold text-[#111827] w-4 text-right">{item.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Navigate</div>
            <div className="space-y-1">
              {([
                ['🔍 Browse Listings', 'browse'],
                ['📋 My Applications', 'applications'],
                ['🧾 Receipts', 'receipts'],
                ['⭐ Rate & Review', 'reviews'],
                ['⚙️ Settings', 'settings'],
              ] as const).map(([label, target]) => (
                <button key={label} onClick={() => onNavigate(target)} className="w-full text-left text-sm px-3 py-2 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors">{label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
