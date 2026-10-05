import { useEffect, useState } from 'react'
import type { Listing } from '../../types'
import { listings } from '../../data'
import type { LandlordRow, StudentRow, SortDir } from '../../data'
import {
  createAdminCategory,
  deleteAdminCategory,
  fetchAdminAccounts,
  fetchAdminComplaint,
  fetchAdminComplaints,
  fetchAdminCategories,
  fetchAdminConversations,
  fetchAdminListings,
  fetchAdminNotifications,
  fetchAdminReportData,
  renameAdminCategory,
  replyToAdminComplaint,
  setAdminAccountStatus,
  setAdminListingCategory,
  setAdminListingModerationStatus,
  markAdminNotificationsRead,
  updateAdminComplaintStatus,
  type AdminAccount,
  type AdminAccountStatus,
  type AdminCategory,
  type AdminComplaintStatus,
  type AdminConversation,
  type AdminListing,
  type AdminModerationStatus,
  type AdminNotification,
  type AdminReportData,
} from '../../api/admin'
import ListingDetailPage from '../../components/ListingDetail'
import NotificationBell from '../../components/NotificationBell'
import AdminSidebarNav, { type AdminPage } from './Sidebar'
import OverviewPage from './Overview'
import LandlordsPage from './Landlords'
import StudentsPage from './Students'
import CategoriesPage from './Categories'
import ReportsPage from './Reports'
import ChatMonitorPage from './ChatMonitor'
import ComplaintsPage from './Complaints'
import SettingsPage from './Settings'
import type { AdminComplaint } from './types'

function registrationDate(value?: string): string {
  return value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}

function toLandlordRow(account: AdminAccount): LandlordRow {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    phone: '—',
    address: '—',
    properties: account.propertyCount ?? 0,
    status: account.status,
    regDate: registrationDate(account.createdAt),
  }
}

function toStudentRow(account: AdminAccount): StudentRow {
  const applicationCount = account.applicationCount ?? 0
  return {
    id: account.id,
    name: account.name,
    university: 'UIU',
    email: account.email,
    phone: '—',
    rentalStatus: applicationCount > 0 ? 'Searching' : 'No Application',
    applications: applicationCount,
    status: account.status,
    regDate: registrationDate(account.createdAt),
  }
}

function notificationAge(value: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000))
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) === 1 ? '' : 's'} ago`
}

function mapAdminNotification(notification: AdminNotification) {
  return {
    id: notification.id,
    text: notification.title,
    sub: notification.message,
    time: notificationAge(notification.createdAt),
    read: notification.isRead,
  }
}

export default function AdminDashboard({ userName, onSignOut }: { userName: string; onSignOut: () => void }) {
  const [page, setPage] = useState<AdminPage>('overview')
  const [adminSignOutConfirm, setAdminSignOutConfirm] = useState(false)
  const [adminListingView, setAdminListingView] = useState<Listing | null>(null)
  const openAdminListing = (listing: AdminListing) => {
    const numericId = Number(listing.propertyCode.match(/\d+$/)?.[0] ?? 0)
    setAdminListingView({
      id: numericId,
      propertyId: listing.propertyCode,
      title: listing.title,
      landlord: listing.landlordName,
      type: listing.categoryName ?? 'Property',
      distance: '—',
      price: listing.priceBDT,
      status: listing.availabilityStatus,
      facilities: [],
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop&auto=format',
      parking: 'Not Available',
      description: `Moderation status: ${listing.moderationStatus}`,
    })
    setPage('listing-detail')
  }

  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [adminListings, setAdminListings] = useState<AdminListing[]>([])
  const [newCat, setNewCat] = useState('')
  const [notifications, setNotifications] = useState<AdminNotification[]>([])

  const [adminComplaints, setAdminComplaints] = useState<AdminComplaint[]>([])
  const [selectedComplaint, setSelectedComplaint] = useState<AdminComplaint | null>(null)
  const [complaintReply, setComplaintReply] = useState('')
  const [complaintsError, setComplaintsError] = useState('')
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false)
  const [complaintsRetry, setComplaintsRetry] = useState(0)
  const [cStatusFilter, setCStatusFilter] = useState<'all' | 'Submitted' | 'Under Review' | 'Responded' | 'Resolved' | 'Closed'>('all')
  const [cSearch, setCSearch] = useState('')

  const [chatConversations, setChatConversations] = useState<AdminConversation[]>([])
  const [selectedChat, setSelectedChat] = useState<AdminConversation | null>(null)
  const [chatMonitorSearch, setChatMonitorSearch] = useState('')
  const [chatMonitorError, setChatMonitorError] = useState('')
  const [isLoadingChats, setIsLoadingChats] = useState(false)
  const [chatMonitorRetry, setChatMonitorRetry] = useState(0)

  const [catFilter, setCatFilter] = useState('all')
  const [catSearch, setCatSearch] = useState('')
  const [catSort, setCatSort] = useState<'title' | 'price' | 'status'>('title')

  const [lRows, setLRows] = useState<LandlordRow[]>([])
  const [lSearch, setLSearch] = useState('')
  const [lFilter, setLFilter] = useState<'all' | 'active' | 'pending' | 'suspended' | 'deactivated'>('all')
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

  const [adminError, setAdminError] = useState('')
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [reports, setReports] = useState<AdminReportData | null>(null)
  const [reportsError, setReportsError] = useState('')
  const [isLoadingReports, setIsLoadingReports] = useState(false)
  const [reportsRetry, setReportsRetry] = useState(0)

  useEffect(() => {
    let mounted = true
    Promise.all([
      fetchAdminAccounts('landlord'),
      fetchAdminAccounts('student'),
      fetchAdminCategories(),
      fetchAdminListings(),
    ])
      .then(([landlords, students, loadedCategories, loadedListings]) => {
        if (!mounted) return
        setLRows(landlords.map(toLandlordRow))
        setSRows(students.map(toStudentRow))
        setCategories(loadedCategories)
        setAdminListings(loadedListings)
      })
      .catch((error: unknown) => {
        if (mounted) setAdminError(error instanceof Error ? error.message : 'Could not load administrator data.')
      })
      .finally(() => {
        if (mounted) setIsLoadingAccounts(false)
      })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    const loadNotifications = () => {
      fetchAdminNotifications()
        .then(data => { if (mounted) setNotifications(data) })
        .catch((error: unknown) => {
          if (mounted) setAdminError(error instanceof Error ? error.message : 'Could not load notifications.')
        })
    }
    loadNotifications()
    const interval = window.setInterval(loadNotifications, 30_000)
    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [])

  const markNotificationRead = async (id: number) => {
    setNotifications(items => items.map(item => item.id === id ? { ...item, isRead: true } : item))
    try {
      await markAdminNotificationsRead(id)
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Could not mark notification as read.')
    }
  }

  const markAllNotificationsRead = async () => {
    setNotifications(items => items.map(item => ({ ...item, isRead: true })))
    try {
      await markAdminNotificationsRead()
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Could not mark notifications as read.')
    }
  }

  useEffect(() => {
    if (page !== 'reports' && page !== 'overview') return
    let mounted = true
    setIsLoadingReports(true)
    setReportsError('')
    fetchAdminReportData()
      .then(data => { if (mounted) setReports(data) })
      .catch((error: unknown) => {
        if (mounted) setReportsError(error instanceof Error ? error.message : 'Could not load reports.')
      })
      .finally(() => { if (mounted) setIsLoadingReports(false) })
    return () => { mounted = false }
  }, [page, reportsRetry])

  useEffect(() => {
    if (page !== 'complaints') return
    let mounted = true
    let initialLoad = true
    const loadComplaints = () => {
      if (initialLoad) setIsLoadingComplaints(true)
      fetchAdminComplaints()
        .then(data => {
          if (!mounted) return
          setAdminComplaints(data)
          setComplaintsError('')
        })
        .catch((error: unknown) => {
          if (mounted) setComplaintsError(error instanceof Error ? error.message : 'Could not load complaints.')
        })
        .finally(() => {
          if (mounted && initialLoad) {
            initialLoad = false
            setIsLoadingComplaints(false)
          }
        })
    }
    loadComplaints()
    const interval = window.setInterval(loadComplaints, 30_000)
    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [page, complaintsRetry])

  useEffect(() => {
    if (page !== 'chat-monitor') return
    let mounted = true
    setIsLoadingChats(true)
    setChatMonitorError('')
    fetchAdminConversations(chatMonitorSearch)
      .then(data => { if (mounted) setChatConversations(data) })
      .catch((error: unknown) => {
        if (mounted) setChatMonitorError(error instanceof Error ? error.message : 'Could not load conversations.')
      })
      .finally(() => { if (mounted) setIsLoadingChats(false) })
    return () => { mounted = false }
  }, [page, chatMonitorSearch, chatMonitorRetry])

  const selectComplaint = async (complaint: AdminComplaint) => {
    try {
      setComplaintsError('')
      setSelectedComplaint(await fetchAdminComplaint(complaint.id))
    } catch (error) {
      setComplaintsError(error instanceof Error ? error.message : 'Could not load the complaint thread.')
    }
  }

  const changeComplaintStatus = async (id: string, status: AdminComplaintStatus) => {
    try {
      setComplaintsError('')
      const updated = await updateAdminComplaintStatus(id, status)
      setAdminComplaints(items => items.map(item => item.id === id ? updated : item))
      setSelectedComplaint(current => current?.id === id ? updated : current)
    } catch (error) {
      setComplaintsError(error instanceof Error ? error.message : 'Could not update the complaint status.')
    }
  }

  const sendComplaintReply = async (id: string, message: string) => {
    try {
      setComplaintsError('')
      const updated = await replyToAdminComplaint(id, message)
      setAdminComplaints(items => items.map(item => item.id === id ? updated : item))
      setSelectedComplaint(updated)
    } catch (error) {
      setComplaintsError(error instanceof Error ? error.message : 'Could not send the complaint reply.')
      throw error
    }
  }

  const changeAccountStatus = async (id: string, status: AdminAccountStatus) => {
    const reason = window.prompt(`Enter a reason for changing this account to ${status}:`)
    if (reason === null) return
    if (reason.trim().length < 3) {
      setAdminError('Please provide a reason with at least 3 characters.')
      return
    }
    setAdminError('')
    try {
      const account = await setAdminAccountStatus(id, status, reason.trim())
      setLRows(rows => rows.map(row => row.id === id ? { ...row, status: account.status } : row))
      setSRows(rows => rows.map(row => row.id === id ? { ...row, status: account.status } : row))
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Could not update this account.')
    }
  }

  const approveLandlordRow = (id: string) => changeAccountStatus(id, 'active')
  const suspendLandlordRow = (id: string) => changeAccountStatus(id, 'suspended')
  const removeLandlordRow = (id: string) => changeAccountStatus(id, 'deactivated')

  const addCategory = async (name: string) => {
    try {
      setAdminError('')
      const category = await createAdminCategory(name)
      setCategories(current => [...current, category].sort((left, right) => left.name.localeCompare(right.name)))
      setNewCat('')
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Could not create this category.')
    }
  }

  const editCategory = async (id: string, name: string) => {
    try {
      setAdminError('')
      const category = await renameAdminCategory(id, name)
      setCategories(current => current.map(item => item.id === id ? category : item).sort((left, right) => left.name.localeCompare(right.name)))
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Could not rename this category.')
    }
  }

  const removeCategory = async (id: string) => {
    try {
      setAdminError('')
      await deleteAdminCategory(id)
      setCategories(current => current.filter(category => category.id !== id))
      setAdminListings(current => current.map(listing => listing.categoryId === Number(id)
        ? { ...listing, categoryId: undefined, categoryName: undefined }
        : listing))
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Could not delete this category.')
    }
  }

  const moderateListing = async (identifier: string, status: AdminModerationStatus) => {
    const reason = window.prompt(`Enter a reason for changing this listing to ${status}:`)
    if (reason === null) return
    if (reason.trim().length < 3) {
      setAdminError('Please provide a reason with at least 3 characters.')
      return
    }
    try {
      setAdminError('')
      const updated = await setAdminListingModerationStatus(identifier, status, reason.trim())
      setAdminListings(current => current.map(listing => listing.propertyCode === identifier ? updated : listing))
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Could not update this listing.')
    }
  }

  const assignListingCategory = async (identifier: string, categoryId: number | null) => {
    try {
      setAdminError('')
      const updated = await setAdminListingCategory(identifier, categoryId)
      setAdminListings(current => current.map(listing => listing.propertyCode === identifier ? updated : listing))
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Could not assign this category.')
    }
  }

  const [sRows, setSRows] = useState<StudentRow[]>([])
  const [sSearch, setSSearch] = useState('')
  const [sFilter, setSFilter] = useState<'all' | 'active' | 'pending' | 'suspended' | 'deactivated'>('all')
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

  const approveStudentRow = (id: string) => changeAccountStatus(id, 'active')
  const suspendStudentRow = (id: string) => changeAccountStatus(id, 'suspended')
  const removeStudentRow = (id: string) => changeAccountStatus(id, 'deactivated')

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
          <NotificationBell
            notifications={notifications.map(mapAdminNotification)}
            onMarkRead={markNotificationRead}
            onMarkAllRead={markAllNotificationsRead}
          />
        </div>

        <div className="px-6 pb-6 max-w-6xl mx-auto space-y-6">
          {adminError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{adminError}</div>}
          {isLoadingAccounts && <div role="status" className="rounded-xl bg-white px-4 py-3 text-sm text-gray-500">Loading users from the database…</div>}
          {page === 'overview' && (
            <OverviewPage
              report={reports}
              reportError={reportsError}
              isLoadingReport={isLoadingReports}
              onRetryReport={() => setReportsRetry(value => value + 1)}
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
              listings={adminListings}
              categories={categories}
              newCat={newCat}
              setNewCat={setNewCat}
              isLoading={isLoadingAccounts}
              onCreateCategory={addCategory}
              onRenameCategory={editCategory}
              onDeleteCategory={removeCategory}
              onAssignCategory={assignListingCategory}
              onModerateListing={moderateListing}
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
              report={reports}
              isLoading={isLoadingReports}
              error={reportsError}
              onRetry={() => setReportsRetry(value => value + 1)}
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
              isLoading={isLoadingChats}
              error={chatMonitorError}
              onRetry={() => setChatMonitorRetry(value => value + 1)}
            />
          )}

          {page === 'complaints' && (
            <ComplaintsPage
              adminComplaints={adminComplaints}
              isLoading={isLoadingComplaints}
              error={complaintsError}
              onRetry={() => setComplaintsRetry(value => value + 1)}
              onSelectComplaint={selectComplaint}
              onStatusChange={changeComplaintStatus}
              onSendReply={sendComplaintReply}
              selectedComplaint={selectedComplaint}
              setSelectedComplaint={setSelectedComplaint}
              complaintReply={complaintReply}
              setComplaintReply={setComplaintReply}
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
