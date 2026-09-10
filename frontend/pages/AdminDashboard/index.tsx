import { useState } from 'react'
import type { Listing } from '../../types'
import { listings, maintenanceRequests, EXT_LANDLORDS, EXT_STUDENTS } from '../../data'
import type { LandlordRow, StudentRow, SortDir } from '../../data'
import ListingDetailPage from '../../components/ListingDetail'
import NotificationBell from '../../components/NotificationBell'
import { adminNotifs } from './constants'
import AdminSidebarNav, { type AdminPage } from './Sidebar'
import OverviewPage from './Overview'
import LandlordsPage from './Landlords'
import StudentsPage from './Students'
import CategoriesPage from './Categories'
import ReportsPage from './Reports'
import ChatMonitorPage from './ChatMonitor'
import ComplaintsPage from './Complaints'
import SettingsPage from './Settings'
import type { AdminComplaint, AdminComplaintThreadMessage, AdminChatConversation } from './types'

export default function AdminDashboard({ userName, onSignOut }: { userName: string; onSignOut: () => void }) {
  const [page, setPage] = useState<AdminPage>('overview')
  const [adminSignOutConfirm, setAdminSignOutConfirm] = useState(false)
  const [adminListingView, setAdminListingView] = useState<Listing | null>(null)
  const openAdminListing = (l: Listing) => { setAdminListingView(l); setPage('listing-detail') }

  const [categories, setCategories] = useState(['Single', 'Shared', 'Mess', 'Sublet'])
  const [newCat, setNewCat] = useState('')

  const [adminComplaints] = useState<AdminComplaint[]>([
    { id: 'CMP-001', from: 'Tanvir Ahmed', fromType: 'Student', against: 'Rahman Faruk', property: 'Studio near Gate 3', category: 'Maintenance Neglect', date: '22 Jul 2026', status: 'Under Review', description: 'Reported the AC issue on July 10th but no response received from the landlord.' },
    { id: 'CMP-002', from: 'Rahman Faruk', fromType: 'Landlord', against: 'Sadia Islam', property: 'Shared Mess – South Campus', category: 'Late Payment', date: '18 Jul 2026', status: 'Submitted', description: 'Rent for July 2026 has not been paid despite multiple reminders.' },
    { id: 'CMP-003', from: 'Sadia Islam', fromType: 'Student', against: 'Nusrat Jahan', property: 'Shared Mess – South Campus', category: 'Privacy Violation', date: '10 Jul 2026', status: 'Responded', description: 'Landlord entered the room without prior notice on multiple occasions.' },
  ])
  const [selectedComplaint, setSelectedComplaint] = useState<AdminComplaint | null>(null)
  const [complaintReply, setComplaintReply] = useState('')
  const [complaintThreads, setComplaintThreads] = useState<Record<string, AdminComplaintThreadMessage[]>>({
    'CMP-001': [{ from: 'Admin', text: 'We have received your complaint and are reviewing it.', date: '23 Jul 2026' }],
    'CMP-003': [{ from: 'Admin', text: 'We have contacted the landlord regarding this matter.', date: '11 Jul 2026' }, { from: 'Sadia Islam', text: 'Thank you for the quick response.', date: '11 Jul 2026' }],
  })
  const [cStatusFilter, setCStatusFilter] = useState<'all' | 'Submitted' | 'Under Review' | 'Responded' | 'Resolved' | 'Closed'>('all')
  const [cSearch, setCSearch] = useState('')

  const chatConversations: AdminChatConversation[] = [
    { id: 'CH-001', student: 'Tanvir Ahmed', landlord: 'Rahman Faruk', property: 'Studio near Gate 3', propertyId: 'UIU-1001', lastMsg: '31 Jul 2026', status: 'Active', msgs: [{ from: 'student', text: 'Hello! How can I help you today?', time: '10:00' }, { from: 'landlord', text: 'I wanted to ask about the parking availability.', time: '10:05' }, { from: 'landlord', text: 'Yes, we have one parking spot included with your unit.', time: '10:06' }] },
    { id: 'CH-002', student: 'Sadia Islam', landlord: 'Nusrat Jahan', property: 'Shared Mess – South Campus', propertyId: 'UIU-1002', lastMsg: '29 Jul 2026', status: 'Active', msgs: [{ from: 'student', text: 'Is the mess still accepting new students?', time: '09:00' }, { from: 'landlord', text: 'Yes, we have 2 spots available from August.', time: '09:15' }] },
    { id: 'CH-003', student: 'Rifat Hassan', landlord: 'Karim Abdullah', property: 'Sublet – Bashundhara R/A', propertyId: 'UIU-1003', lastMsg: '27 Jul 2026', status: 'Inactive', msgs: [{ from: 'student', text: 'What is the earliest move-in date?', time: '14:00' }, { from: 'landlord', text: 'You can move in from August 1st.', time: '14:30' }] },
  ]
  const [selectedChat, setSelectedChat] = useState<AdminChatConversation | null>(null)
  const [chatMonitorSearch, setChatMonitorSearch] = useState('')

  const [catFilter, setCatFilter] = useState('all')
  const [catSearch, setCatSearch] = useState('')
  const [catSort, setCatSort] = useState<'title' | 'price' | 'status'>('title')

  const [lRows, setLRows] = useState<LandlordRow[]>(EXT_LANDLORDS)
  const [lSearch, setLSearch] = useState('')
  const [lFilter, setLFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all')
  const [lSortKey, setLSortKey] = useState<keyof LandlordRow>('name')
  const [lSortDir, setLSortDir] = useState<SortDir>('asc')
  const [lPage, setLPage] = useState(1)
  const [lProfileId, setLProfileId] = useState<string | null>(null)

  const handleLSort = (key: keyof LandlordRow) => {
    if (key === lSortKey) setLSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setLSortKey(key); setLSortDir('asc') }
    setLPage(1)
  }

  const lFiltered = lRows
    .filter(r => lFilter === 'all' || r.status === lFilter)
    .filter(r => !lSearch || [r.name, r.email, r.phone, r.id, r.address].some(v => v.toLowerCase().includes(lSearch.toLowerCase())))
  const lSorted = [...lFiltered].sort((a, b) => {
    const av = a[lSortKey]
    const bv = b[lSortKey]
    const cmp = typeof av === 'string' ? (av as string).localeCompare(bv as string) : (av as number) - (bv as number)
    return lSortDir === 'asc' ? cmp : -cmp
  })
  const L_PAGE = 5
  const lTotalPages = Math.max(1, Math.ceil(lSorted.length / L_PAGE))
  const lPagedRows = lSorted.slice((lPage - 1) * L_PAGE, lPage * L_PAGE)
  const lProfile = lRows.find(r => r.id === lProfileId)

  const approveLandlordRow = (id: string) => setLRows(rs => rs.map(r => r.id === id ? { ...r, status: 'active' } : r))
  const suspendLandlordRow = (id: string) => setLRows(rs => rs.map(r => r.id === id ? { ...r, status: 'suspended' } : r))
  const removeLandlordRow = (id: string) => { setLRows(rs => rs.filter(r => r.id !== id)); setLProfileId(null) }

  const [sRows, setSRows] = useState<StudentRow[]>(EXT_STUDENTS)
  const [sSearch, setSSearch] = useState('')
  const [sFilter, setSFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all')
  const [sSortKey, setSSortKey] = useState<keyof StudentRow>('name')
  const [sSortDir, setSSortDir] = useState<SortDir>('asc')
  const [sPage, setSPage] = useState(1)
  const [sProfileId, setSProfileId] = useState<string | null>(null)

  const handleSSort = (key: keyof StudentRow) => {
    if (key === sSortKey) setSSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSSortKey(key); setSSortDir('asc') }
    setSPage(1)
  }

  const sFiltered = sRows
    .filter(r => sFilter === 'all' || r.status === sFilter)
    .filter(r => !sSearch || [r.name, r.email, r.phone, r.id].some(v => v.toLowerCase().includes(sSearch.toLowerCase())))
  const sSorted = [...sFiltered].sort((a, b) => {
    const av = a[sSortKey]
    const bv = b[sSortKey]
    const cmp = typeof av === 'string' ? (av as string).localeCompare(bv as string) : (av as number) - (bv as number)
    return sSortDir === 'asc' ? cmp : -cmp
  })
  const S_PAGE = 5
  const sTotalPages = Math.max(1, Math.ceil(sSorted.length / S_PAGE))
  const sPagedRows = sSorted.slice((sPage - 1) * S_PAGE, sPage * S_PAGE)
  const sProfile = sRows.find(r => r.id === sProfileId)

  const approveStudentRow = (id: string) => setSRows(rs => rs.map(r => r.id === id ? { ...r, status: 'active' } : r))
  const suspendStudentRow = (id: string) => setSRows(rs => rs.map(r => r.id === id ? { ...r, status: 'suspended' } : r))
  const removeStudentRow = (id: string) => { setSRows(rs => rs.filter(r => r.id !== id)); setSProfileId(null) }

  const pendingLandlords = lRows.filter(r => r.status === 'pending').length
  const pendingStudents = sRows.filter(r => r.status === 'pending').length

  return (
    <div className="flex min-h-screen">
      <AdminSidebarNav
        page={page}
        setPage={(p: AdminPage) => { setPage(p); setLProfileId(null); setSProfileId(null) }}
        pendingLandlords={pendingLandlords}
        pendingStudents={pendingStudents}
        userName={userName}
        onSignOut={() => setAdminSignOutConfirm(true)}
      />

      <main className="flex-1 overflow-auto bg-[#f8fafc]">
        {adminSignOutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
              <div className="text-2xl mb-3 text-center">👋</div>
              <h2 className="text-lg font-bold text-[#111827] text-center mb-1">Sign out?</h2>
              <p className="text-sm text-gray-500 text-center mb-6">Are you sure you want to sign out of your account?</p>
              <div className="flex gap-3">
                <button onClick={() => setAdminSignOutConfirm(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={onSignOut} className="flex-1 bg-[#111827] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#1f2937] transition-colors">Sign Out</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end px-6 pt-5">
          <NotificationBell notifications={adminNotifs} />
        </div>

        <div className="px-6 pb-6 max-w-6xl mx-auto space-y-6">
          {page === 'overview' && (
            <OverviewPage
              listings={listings}
              lRows={lRows}
              sRows={sRows}
              pendingLandlords={pendingLandlords}
              pendingStudents={pendingStudents}
              setPage={setPage}
            />
          )}

          {page === 'landlords' && (
            <LandlordsPage
              lRows={lRows}
              lSearch={lSearch}
              setLSearch={setLSearch}
              lFilter={lFilter}
              setLFilter={setLFilter}
              lSortKey={lSortKey}
              lSortDir={lSortDir}
              handleLSort={handleLSort}
              lPage={lPage}
              setLPage={setLPage}
              lTotalPages={lTotalPages}
              lPagedRows={lPagedRows}
              lProfile={lProfile}
              setLProfileId={setLProfileId}
              approveLandlordRow={approveLandlordRow}
              suspendLandlordRow={suspendLandlordRow}
              removeLandlordRow={removeLandlordRow}
            />
          )}

          {page === 'students' && (
            <StudentsPage
              sRows={sRows}
              sSearch={sSearch}
              setSSearch={setSSearch}
              sFilter={sFilter}
              setSFilter={setSFilter}
              sSortKey={sSortKey}
              sSortDir={sSortDir}
              handleSSort={handleSSort}
              sPage={sPage}
              setSPage={setSPage}
              sTotalPages={sTotalPages}
              sPagedRows={sPagedRows}
              sProfile={sProfile}
              setSProfileId={setSProfileId}
              approveStudentRow={approveStudentRow}
              suspendStudentRow={suspendStudentRow}
              removeStudentRow={removeStudentRow}
            />
          )}

          {page === 'categories' && (
            <CategoriesPage
              listings={listings}
              categories={categories}
              setCategories={setCategories}
              newCat={newCat}
              setNewCat={setNewCat}
              catSearch={catSearch}
              setCatSearch={setCatSearch}
              catFilter={catFilter}
              setCatFilter={setCatFilter}
              catSort={catSort}
              setCatSort={setCatSort}
              openAdminListing={openAdminListing}
            />
          )}

          {page === 'reports' && (
            <ReportsPage
              listings={listings}
              lRows={lRows}
              sRows={sRows}
              maintenanceRequests={maintenanceRequests}
            />
          )}

          {page === 'listing-detail' && adminListingView && (
            <ListingDetailPage listing={adminListingView} onBack={() => setPage('overview')} backLabel="← Back to Overview" />
          )}

          {page === 'chat-monitor' && (
            <ChatMonitorPage
              chatConversations={chatConversations}
              selectedChat={selectedChat}
              setSelectedChat={setSelectedChat}
              chatMonitorSearch={chatMonitorSearch}
              setChatMonitorSearch={setChatMonitorSearch}
            />
          )}

          {page === 'complaints' && (
            <ComplaintsPage
              adminComplaints={adminComplaints}
              selectedComplaint={selectedComplaint}
              setSelectedComplaint={setSelectedComplaint}
              complaintReply={complaintReply}
              setComplaintReply={setComplaintReply}
              complaintThreads={complaintThreads}
              setComplaintThreads={setComplaintThreads}
              cStatusFilter={cStatusFilter}
              setCStatusFilter={setCStatusFilter}
              cSearch={cSearch}
              setCSearch={setCSearch}
            />
          )}

          {page === 'settings' && (
            <SettingsPage userName={userName} />
          )}
        </div>
      </main>
    </div>
  )
}
