import { useEffect, useMemo, useState } from 'react'
import type { Listing } from '../../types'
import { distanceFromCampusKm, type GeoCoordinates } from '../../lib/geo'
import ListingDetailPage from '../../components/ListingDetail'
import NotificationBell from '../../components/NotificationBell'
import { addLandlordMaintenanceComment, createListing, deleteListing, getApplications, getLeases, getLandlordChat, getLandlordComplaints, getLandlordMaintenanceComments, getLandlordNotifications, getMaintenanceRequests, getMyListings, getProfile, markLandlordNotificationsRead, reviewApplication, sendLandlordChat, submitLandlordComplaint as submitLandlordComplaintApi, updateListing, updateMaintenanceStatus, updateProfile as updateLandlordProfile, type LandlordChatConversation } from '../../lib/landlordApi'
import LandlordSidebarNav, { type LandlordPage } from './Sidebar'
import type { MaintReq, RequestItem, ChatMsg, MaintStage } from './types'
import OverviewPage from './Overview'
import ListingsPage from './Listings'
import AddListingPage from './AddListing'
import EditListingPage from './EditListing'
import RequestsPage from './Requests'
import RentPage from './Rent'
import MaintenancePage from './Maintenance'
import ChatPage from './Chat'
import SettingsPage from './Settings'

export default function LandlordDashboard({ userName, onSignOut }: { userName: string; onSignOut: () => void }) {

  const [landlordNotifications, setLandlordNotifications] = useState<Array<{ id: number; text: string; sub?: string; time: string; read: boolean }>>([])

  const notificationAge = (value: string) => {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000))
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hr ago`
    return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) === 1 ? '' : 's'} ago`
  }

  const mapLandlordNotification = (notification: { id: number; title: string; message: string; isRead: boolean; createdAt: string }) => ({
    id: notification.id,
    text: notification.title,
    sub: notification.message,
    time: notificationAge(notification.createdAt),
    read: notification.isRead,
  })

  const [page, setPage] = useState<LandlordPage>('overview')
  const [landlordView, setLandlordView] = useState<Listing | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState('')
  const [landlordProfile, setLandlordProfile] = useState<{ name?: string; email?: string; propertyCount?: number } | null>(null)
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [leases, setLeases] = useState<Array<{ id?: string; propertyId: string; propertyTitle?: string; propertyCode?: string; studentId?: string; studentName?: string; status?: string; monthlyRent?: number; startDate?: string; endDate?: string }>>([])
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [mReqs, setMReqs] = useState<MaintReq[]>([])
  const [chatConversations, setChatConversations] = useState<LandlordChatConversation[]>([])
  type LandlordComplaint = { id: string; against: string; property: string; category: string; subject: string; description: string; date: string; status: 'Submitted' | 'Under Review' | 'Responded' | 'Resolved' | 'Closed' }
  const [landlordComplaints, setLandlordComplaints] = useState<LandlordComplaint[]>([])
  const [showLandlordComplaintForm, setShowLandlordComplaintForm] = useState(false)
  const [lcForm, setLcForm] = useState({ against: '', property: '', category: 'Late Payment', subject: '', description: '' })
  const complaintTargets = useMemo(() => {
    const seen = new Set<string>()

    return leases
      .filter((lease) => lease.studentName && (lease.propertyTitle || lease.propertyCode))
      .filter((lease) => ['active', 'ended', 'terminated'].includes(String(lease.status ?? '').toLowerCase()))
      .map((lease) => {
        const studentName = lease.studentName?.trim() ?? ''
        const propertyTitle = lease.propertyTitle?.trim() || lease.propertyCode?.trim() || 'Property'
        const key = `${studentName}::${propertyTitle}`

        if (!studentName || seen.has(key)) return null
        seen.add(key)

        return { studentName, propertyTitle }
      })
      .filter((target): target is { studentName: string; propertyTitle: string } => Boolean(target))
  }, [leases])

  const complaintPropertyOptions = useMemo(() => {
    if (!lcForm.against) return complaintTargets.map((target) => target.propertyTitle)
    return complaintTargets
      .filter((target) => target.studentName === lcForm.against)
      .map((target) => target.propertyTitle)
  }, [complaintTargets, lcForm.against])
  const openLandlordListing = (l: Listing) => { setLandlordView(l); setPage('listing-detail') }

  const formatDisplayDate = (value?: string) => {
    if (!value) return 'N/A'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const markLandlordNotificationRead = async (id: number) => {
    setLandlordNotifications(items => items.map(item => item.id === id ? { ...item, read: true } : item))
    try {
      await markLandlordNotificationsRead(id)
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Could not mark notification as read.')
    }
  }

  const markAllLandlordNotificationsRead = async () => {
    setLandlordNotifications(items => items.map(item => ({ ...item, read: true })))
    try {
      await markLandlordNotificationsRead()
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Could not mark notifications as read.')
    }
  }

  const mapStageToStatus = (stage: MaintStage): 'open' | 'in-progress' | 'resolved' => {
    if (stage >= 5) return 'resolved'
    if (stage >= 2) return 'in-progress'
    return 'open'
  }

  useEffect(() => {
    let active = true

    const loadLandlordNotifications = async () => {
      try {
        const notifications = await getLandlordNotifications()
        if (active) {
          setLandlordNotifications(notifications.map(mapLandlordNotification))
        }
      } catch (error) {
        if (active) {
          setDashboardError(error instanceof Error ? error.message : 'Could not load notifications.')
        }
      }
    }

    loadLandlordNotifications()

    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true

    const loadLandlordData = async () => {
      setDashboardLoading(true)
      setDashboardError('')

      try {
        const [profileResult, listingsResult, applicationsResult, leasesResult, maintenanceResult, landComplaintsResult] = await Promise.all([
          getProfile().catch(() => null),
          getMyListings().catch(() => []),
          getApplications().catch(() => []),
          getLeases().catch(() => []),
          getMaintenanceRequests().catch(() => []),
          getLandlordComplaints().catch((error: unknown) => {
            if (active) setDashboardError(error instanceof Error ? error.message : 'Could not load complaints.')
            return []
          }),
        ])

        if (!active) return

        if (profileResult) {
          setLandlordProfile(profileResult)
        }
        if (Array.isArray(listingsResult)) {
          setMyListings(listingsResult)
        }
        if (Array.isArray(applicationsResult)) {
          setRequests(applicationsResult.map((application) => ({
            id: Number(application.id ?? Date.now()),
            student: application.studentName || `Student ${application.studentId}`,
            studentId: application.studentCardNo || String(application.studentId ?? 'N/A'),
            userId: String(application.studentId ?? ''),
            propertyId: String(application.propertyId ?? ''),
            dept: application.department || 'UIU Student',
            phone: application.contactPhone || 'N/A',
            moveIn: application.moveInDate ? new Date(application.moveInDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Flexible',
            employment: application.employment || 'Student',
            message: application.message ?? 'New application submitted.',
            listing: application.propertyTitle || (application.propertyCode ? `Property ${application.propertyCode}` : `Property ${application.propertyId}`),
            date: application.createdAt ? formatDisplayDate(application.createdAt) : 'N/A',
            status: ['accepted', 'rejected', 'cancelled'].includes(application.status) ? (application.status === 'accepted' ? 'approved' : 'rejected') : 'pending',
          })))
        }
        if (Array.isArray(leasesResult)) {
          setLeases(leasesResult)
        }
        if (Array.isArray(maintenanceResult)) {
          setMReqs(maintenanceResult.map((request) => ({
            id: Number(request.id ?? Date.now()),
            title: request.issue ?? 'Maintenance issue',
            description: request.description ?? 'Maintenance request submitted by the tenant.',
            listing: request.propertyTitle || request.propertyCode || `Property ${request.propertyId}`,
            tenant: request.studentName || `Student ${request.studentId}`,
            date: request.createdAt ? formatDisplayDate(request.createdAt) : 'N/A',
            priority: ['Low', 'Medium', 'High'].includes(String(request.priority)) ? (request.priority as 'Low' | 'Medium' | 'High') : 'Medium',
            stage: request.stage as MaintStage,
            estimatedDate: 'TBD',
            comments: [{ from: 'tenant', text: request.description ?? 'Maintenance request submitted.', date: request.createdAt ? formatDisplayDate(request.createdAt) : 'Today' }],
            hasPhotos: false,
          })))
        }
        if (Array.isArray(landComplaintsResult)) {
          setLandlordComplaints(landComplaintsResult.map((c: any) => ({
            id: c.id ?? `CMP-${Date.now()}`,
            against: c.against ?? c.accusedName ?? '',
            property: c.property ?? c.propertyTitle ?? '',
            category: c.category ?? 'Other',
            subject: c.description?.split(' — ')[0] ?? '',
            description: c.description?.split(' — ').slice(1).join(' — ') ?? c.description ?? '',
            date: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
            status: (['Submitted', 'Under Review', 'Responded', 'Resolved', 'Closed'].includes(c.status ?? '') ? c.status : 'Submitted') as any,
          })))
        }
      } catch (error) {
        if (!active) return
        setDashboardError(error instanceof Error ? error.message : 'Unable to load landlord dashboard data.')
      } finally {
        if (active) setDashboardLoading(false)
      }
    }

    loadLandlordData()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (page !== 'chat') return
    let active = true
    const loadChat = async () => {
      try {
        const conversations = await getLandlordChat()
        if (active) setChatConversations(conversations)
      } catch (error) {
        if (active) setDashboardError(error instanceof Error ? error.message : 'Unable to load chat messages.')
      }
    }
    void loadChat()
    const timer = window.setInterval(() => { void loadChat() }, 3000)
    return () => { active = false; window.clearInterval(timer) }
  }, [page])

  const handleUpdateLandlordProfile = async (data: { name?: string; phone?: string; companyName?: string }): Promise<boolean> => {
    try {
      const updated = await updateLandlordProfile(data)
      const res = updated && 'data' in updated ? (updated as any).data : updated
      setLandlordProfile(prev => ({ ...prev, ...res }))
      setDashboardError('')
      return true
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Unable to update profile.')
      return false
    }
  }

  const [editListingId, setEditListingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ title: '', type: 'Single', price: '', description: '', status: 'approved' })
  const [editFacilities, setEditFacilities] = useState<string[]>([])
  const toggleEditFacility = (f: string) => setEditFacilities(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  const [editAddrForm, setEditAddrForm] = useState({ street: '', area: '', city: 'Dhaka', district: 'Dhaka', postal: '' })
  const [editMapPin, setEditMapPin] = useState<GeoCoordinates | null>(null)
  const [editMapKm, setEditMapKm] = useState('')

  const handleEditAddrChange = (field: keyof typeof editAddrForm, value: string) => {
    setEditAddrForm(current => ({ ...current, [field]: value }))
  }

  const handleEditMapPin = (p: GeoCoordinates) => {
    setEditMapPin(p)
    setEditMapKm(distanceFromCampusKm(p).toFixed(1))
  }

  const openEdit = (id: number) => {
    const l = myListings.find(m => m.id === id)
    if (!l) return
    setEditListingId(id)
    setEditForm({ title: l.title, type: l.type, price: String(l.price), description: 'Comfortable and well-maintained unit with easy access to UIU campus.', status: l.status || 'approved' })
    setEditFacilities(l.facilities ?? [])
    // Pre-populate address from listing data if available
    setEditAddrForm({ street: l.street || '', area: l.area || '', city: 'Dhaka', district: 'Dhaka', postal: '' })
    setEditMapPin(l.mapPin ?? null)
    setEditMapKm(l.mapPin ? distanceFromCampusKm(l.mapPin).toFixed(1) : '')
    setPage('edit-listing')
  }

  const [form, setForm] = useState({ title: '', type: 'Single', price: '', description: '' })
  const [addrForm, setAddrForm] = useState({ street: '', area: '', city: 'Dhaka', district: 'Dhaka', postal: '' })
  const [mapPin, setMapPin] = useState<GeoCoordinates | null>(null)
  const [mapKm, setMapKm] = useState('')
  const [facilities, setFacilities] = useState<string[]>([])
  const toggleFacility = (f: string) => setFacilities(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])

  const [roomCounts, setRoomCounts] = useState({ bedroom: 1, living: 1, bathroom: 1, kitchen: 1, veranda: 0 })
  const [roomSizeInputs, setRoomSizeInputs] = useState<Record<string, string[]>>({
    bedroom: [''], living: [''], bathroom: [''], kitchen: [''], veranda: []
  })
  const [totalSize, setTotalSize] = useState('')
  const [maxTenants, setMaxTenants] = useState('')
  const [parkingAvail, setParkingAvail] = useState<'none' | 'motorcycle' | 'car' | 'both'>('none')

  const refreshMyListings = async () => {
    const nextListings = await getMyListings().catch(() => [])
    setMyListings(nextListings)
  }

  const refreshApplications = async () => {
    const nextApplications = await getApplications().catch(() => [])
    setRequests(nextApplications.map((application) => ({
      id: Number(application.id ?? Date.now()),
      student: `Student ${application.studentId}`,
      studentId: String(application.studentId ?? 'N/A'),
      dept: 'UIU Student',
      phone: 'N/A',
      moveIn: 'Flexible',
      employment: 'Student',
      message: application.message ?? 'New application submitted.',
      listing: `Property ${application.propertyId}`,
      date: application.createdAt ? new Date(application.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
      status: ['accepted', 'rejected', 'cancelled'].includes(application.status) ? (application.status === 'accepted' ? 'approved' : 'rejected') : 'pending',
    })))
  }

  const normalizeListingType = (value: string | undefined): 'apartment' | 'house' | 'room' | 'studio' | 'duplex' | 'sublet' => {
    const normalized = (value || 'Single').trim().toLowerCase()

    switch (normalized) {
      case 'single':
        return 'studio'
      case 'shared':
        return 'room'
      case 'mess':
        return 'apartment'
      case 'sublet':
        return 'sublet'
      case 'apartment':
        return 'apartment'
      case 'house':
        return 'house'
      case 'room':
        return 'room'
      case 'studio':
        return 'studio'
      case 'duplex':
        return 'duplex'
      default:
        return 'apartment'
    }
  }

  const handleAddListing = async () => {
    if (!form.title.trim() || !form.price || !addrForm.street.trim()) {
      setDashboardError('Please complete the listing title, price, and address before publishing.')
      return
    }
    if (!mapPin) {
      setDashboardError('Click the map to set the property’s real location before publishing.')
      return
    }

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || 'Available UIU-area rental property.',
        type: normalizeListingType(form.type),
        priceBDT: Number(form.price),
        bedrooms: roomCounts.bedroom || 1,
        roommateCapacity: Number(maxTenants || 1),
        parkingAvailable: parkingAvail !== 'none',
        facilities,
        address: {
          line1: addrForm.street || 'UIU Area',
          area: addrForm.area || 'UIU Area',
          city: addrForm.city || 'Dhaka',
          district: addrForm.district || 'Dhaka',
          latitude: mapPin.latitude,
          longitude: mapPin.longitude,
        },
        status: 'approved',
      }

      await createListing(payload)
      await refreshMyListings()
      setPage('listings')
      setDashboardError('')
      setForm({ title: '', type: 'Single', price: '', description: '' })
      setAddrForm({ street: '', area: '', city: 'Dhaka', district: 'Dhaka', postal: '' })
      setMapPin(null)
      setMapKm('')
      setFacilities([])
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Listing creation failed.')
    }
  }

  const handleUpdateListing = async () => {
    if (editListingId === null) return
    if (!editMapPin) {
      setDashboardError('Click the map to set the property’s real location before saving.')
      return
    }
    try {
      const payload = {
        title: editForm.title.trim(),
        description: editForm.description.trim() || 'Updated UIU-area rental property.',
        type: normalizeListingType(editForm.type),
        priceBDT: Number(editForm.price || 0),
        bedrooms: roomCounts.bedroom || 1,
        roommateCapacity: Number(maxTenants || 1),
        parkingAvailable: parkingAvail !== 'none',
        facilities: editFacilities,
        address: {
          line1: editAddrForm.street || 'UIU Area',
          area: editAddrForm.area || 'UIU Area',
          city: editAddrForm.city || 'Dhaka',
          district: editAddrForm.district || 'Dhaka',
          latitude: editMapPin.latitude,
          longitude: editMapPin.longitude,
        },
        status: editForm.status || 'approved',
      }

      await updateListing(editListingId, payload)
      await refreshMyListings()
      setPage('listings')
      setDashboardError('')
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Listing update failed.')
    }
  }

  const updateRoomCount = (room: string, count: number) => {
    const n = Math.max(0, count)
    setRoomCounts(c => ({ ...c, [room]: n }))
    setRoomSizeInputs(s => ({ ...s, [room]: Array.from({ length: n }, (_, i) => s[room]?.[i] ?? '') }))
  }

  const handleAddrChange = (field: keyof typeof addrForm, value: string) => {
    setAddrForm(current => ({ ...current, [field]: value }))
  }

  const handleMapPin = (p: GeoCoordinates) => {
    setMapPin(p)
    setMapKm(distanceFromCampusKm(p).toFixed(1))
  }

  // ── Rental requests ──────────────────────────────────────────────────────────
  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(null)
  const pendingRequests = requests.filter(r => r.status === 'pending').length
  const activeTenantCount = leases.filter((lease) => lease.status === 'active').length
  const monthlyRevenue = leases.reduce((sum, lease) => sum + Number(lease.monthlyRent ?? 0), 0)
  const liveLeaseTransactions = leases.map((lease) => ({
    id: Number(lease.id ?? lease.propertyId ?? Date.now()),
    tenant: lease.studentName || (lease.studentId ? `Student ${lease.studentId}` : 'Tenant'),
    listing: lease.propertyTitle || (lease.propertyCode ? `${lease.propertyCode}` : (lease.propertyId ? `Property ${lease.propertyId}` : 'Lease')),
    amount: Number(lease.monthlyRent ?? 0),
    month: lease.startDate ? new Date(lease.startDate).toLocaleString('default', { month: 'short', year: 'numeric' }) : 'Current cycle',
    paid: lease.status === 'active',
  }))
  const approveRequest = async (id: number) => {
    try {
      await reviewApplication(id, { status: 'accepted' })
      setRequests(rs => rs.map(r => r.id === id ? { ...r, status: 'approved' } : r))
      const [refreshedLeases, refreshedListings] = await Promise.all([
        getLeases().catch(() => []),
        getMyListings().catch(() => []),
      ])
      if (Array.isArray(refreshedLeases)) setLeases(refreshedLeases)
      if (Array.isArray(refreshedListings)) setMyListings(refreshedListings)
      setDashboardError('')
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Unable to approve this application.')
    }
  }
  const rejectRequest = async (id: number) => {
    try {
      await reviewApplication(id, { status: 'rejected' })
      setRequests(rs => rs.map(r => r.id === id ? { ...r, status: 'rejected' } : r))
      setDashboardError('')
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Unable to reject this application.')
    }
  }

  // ── Maintenance ──────────────────────────────────────────────────────────────
  const [expandedMaintId, setExpandedMaintId] = useState<number | null>(null)
  const [newComment, setNewComment] = useState<Record<number, string>>({})

  const advanceStage = async (id: number) => {
    const current = mReqs.find((item) => item.id === id)
    if (!current || current.stage >= 6) return
    const nextStage = (current.stage + 1) as MaintStage
    try {
      await updateMaintenanceStatus(id, { stage: nextStage, status: mapStageToStatus(nextStage) })
      setMReqs(ms => ms.map(m => m.id === id ? { ...m, stage: nextStage } : m))
      setDashboardError('')
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Unable to update maintenance request status.')
    }
  }
  const revertStage = async (id: number) => {
    const current = mReqs.find((item) => item.id === id)
    if (!current || current.stage <= 0) return
    const nextStage = (current.stage - 1) as MaintStage
    try {
      await updateMaintenanceStatus(id, { stage: nextStage, status: mapStageToStatus(nextStage) })
      setMReqs(ms => ms.map(m => m.id === id ? { ...m, stage: nextStage } : m))
      setDashboardError('')
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Unable to revert maintenance request status.')
    }
  }

  const addComment = async (id: number) => {
    const text = newComment[id]?.trim()
    if (!text) return
    // Optimistic update
    setMReqs(ms => ms.map(m => m.id === id
      ? { ...m, comments: [...m.comments, { from: 'landlord', text, date: 'Now' }] }
      : m
    ))
    setNewComment(nc => ({ ...nc, [id]: '' }))
    try {
      await addLandlordMaintenanceComment(id, text)
    } catch (err) {
      console.error('Failed to send maintenance comment:', err)
    }
  }

  const loadLandlordMaintComments = async (id: number) => {
    try {
      const comments = await getLandlordMaintenanceComments(id)
      setMReqs(ms => ms.map(m => m.id === id
        ? {
            ...m,
            comments: comments.map((c: any) => ({
              from: (c.from === 'landlord' ? 'landlord' : 'tenant') as 'landlord' | 'tenant',
              text: c.text ?? c.message ?? '',
              date: c.date ?? 'N/A',
            })),
          }
        : m
      ))
    } catch (err) {
      console.error('Failed to load maintenance comments:', err)
    }
  }


  // ── Chat ─────────────────────────────────────────────────────────────────────
  const currentTenants = useMemo(() => {
    return leases
      .filter((lease) => lease.status === 'active')
      .map((lease) => ({
        name: lease.studentName || (lease.studentId ? `Student ${lease.studentId}` : 'Active Tenant'),
        listing: lease.propertyTitle || lease.propertyCode || (lease.propertyId ? `Property ${lease.propertyId}` : 'Current listing'),
        category: 'current' as const,
        studentId: lease.studentId,
        propertyId: lease.propertyCode || lease.propertyId,
      }))
  }, [leases])

  const potentialTenants = useMemo(() => {
    const applicantContacts = requests
      .filter((request) => request.status === 'pending')
      .map((request) => ({
        name: request.student || (request.studentId ? `Student ${request.studentId}` : 'Applicant'),
        listing: request.listing || 'Pending property',
        category: 'potential' as const,
        studentId: request.userId,
        propertyId: request.propertyId,
      }))

    const knownNames = new Set([...currentTenants, ...applicantContacts].map((contact) => contact.name))
    const conversationContacts = chatConversations
      .filter((conversation) => !knownNames.has(conversation.studentName))
      .map((conversation) => ({
        name: conversation.studentName,
        listing: conversation.propertyTitle,
        category: 'potential' as const,
        studentId: conversation.studentId,
        propertyId: conversation.propertyId,
      }))
    return [...applicantContacts, ...conversationContacts]
  }, [requests, currentTenants, chatConversations])

  const [activeChatName, setActiveChatName] = useState(currentTenants[0]?.name ?? '')
  const chatThreads = useMemo(() => {
    const threads: Record<string, ChatMsg[]> = {}
    for (const conversation of [...chatConversations].reverse()) {
      threads[conversation.studentName] = [
        ...(threads[conversation.studentName] ?? []),
        ...conversation.messages.map(({ from, text }) => ({ from: from === 'student' ? 'tenant' as const : 'landlord' as const, text })),
      ]
    }
    return threads
  }, [chatConversations])

  useEffect(() => {
    if (!currentTenants.some((tenant) => tenant.name === activeChatName) && !potentialTenants.some((tenant) => tenant.name === activeChatName)) {
      setActiveChatName(currentTenants[0]?.name ?? potentialTenants[0]?.name ?? '')
    }
  }, [activeChatName, currentTenants, potentialTenants])
  const [chatInput, setChatInput] = useState('')

  const sendChat = async () => {
    const message = chatInput.trim()
    const contact = [...currentTenants, ...potentialTenants].find((tenant) => tenant.name === activeChatName)
    const conversation = chatConversations.find((item) => item.studentName === activeChatName)
    const studentId = contact?.studentId || conversation?.studentId
    const propertyId = contact?.propertyId || conversation?.propertyId
    if (!message || !studentId || !propertyId) {
      setDashboardError('Select a tenant or applicant with a linked property before sending a message.')
      return
    }
    try {
      const updated = await sendLandlordChat(studentId, propertyId, message)
      setChatConversations((items) => [...items.filter((item) => item.id !== updated.id), updated])
      setChatInput('')
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Unable to send your message.')
    }
  }

  // ── Confirmation overlay state ───────────────────────────────────────────────
  const [showLandlordSignOutConfirm, setShowLandlordSignOutConfirm] = useState(false)
  const [showLandlordDeactivateConfirm, setShowLandlordDeactivateConfirm] = useState(false)
  const [landlordDeactivateInput, setLandlordDeactivateInput] = useState('')
  const [showRemoveListingConfirm, setShowRemoveListingConfirm] = useState(false)
  const [showDiscardEditConfirm, setShowDiscardEditConfirm] = useState(false)
  const [showDiscardAddConfirm, setShowDiscardAddConfirm] = useState(false)

  const handleRemoveListing = async (listingId: number | null) => {
    if (listingId === null || Number.isNaN(listingId)) return
    try {
      await deleteListing(listingId)
      setMyListings((prev) => prev.filter((item) => item.id !== listingId))
      setShowRemoveListingConfirm(false)
      setPage('listings')
      setDashboardError('')
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Unable to remove this listing.')
    }
  }

  // Landlord complaints submit handler
  const submitLandlordComplaint = async () => {
    if (!lcForm.subject.trim() || !lcForm.against.trim() || !lcForm.property.trim()) return
    const savedForm = { ...lcForm }
    setDashboardError('')
    try {
      const created = await submitLandlordComplaintApi({
        against: savedForm.against,
        property: savedForm.property,
        category: savedForm.category,
        subject: savedForm.subject,
        description: savedForm.description,
      })
      setLandlordComplaints(prev => [{
        id: String(created?.id ?? `CMP-${Date.now()}`),
        against: savedForm.against,
        property: savedForm.property,
        category: savedForm.category,
        subject: savedForm.subject,
        description: savedForm.description,
        date: created?.date ?? new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: 'Submitted',
      }, ...prev])
      setLcForm({ against: '', property: '', category: 'Late Payment', subject: '', description: '' })
      setShowLandlordComplaintForm(false)
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Could not submit complaint.')
    }
  }

  const isEditDirty = editListingId !== null && (() => {
    const orig = myListings.find(l => l.id === editListingId)
    if (!orig) return false
    return editForm.title !== orig.title
      || editForm.price !== String(orig.price)
      || editForm.type !== orig.type
      || editAddrForm.street !== (orig.street ?? '')
      || editAddrForm.area !== (orig.area ?? '')
      || editMapPin?.latitude !== orig.mapPin?.latitude
      || editMapPin?.longitude !== orig.mapPin?.longitude
  })()

  const isAddDirty = form.title.trim() !== '' || form.price !== '' || addrForm.street !== '' || facilities.length > 0

  return (
    <div className="flex min-h-screen">
      <LandlordSidebarNav
        page={page}
        setPage={setPage}
        pendingRequests={pendingRequests}
        maintenanceCount={mReqs.filter(m => m.stage < 5).length}
        userName={landlordProfile?.name || userName}
        onSignOut={() => setShowLandlordSignOutConfirm(true)}
      />

      {/* Main */}
      <main className="flex-1 overflow-auto bg-[#f8fafc]">
        {dashboardLoading && (
          <div className="px-6 pt-6">
            <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">Loading your landlord dashboard...</div>
          </div>
        )}
        {dashboardError && (
          <div className="px-6 pt-6">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{dashboardError}</div>
          </div>
        )}
        {/* Sign-out confirmation overlay */}
        {showLandlordSignOutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
              <div className="text-2xl mb-3 text-center">👋</div>
              <h2 className="text-lg font-bold text-[#111827] text-center mb-1">Sign out?</h2>
              <p className="text-sm text-gray-500 text-center mb-6">Are you sure you want to sign out of your account?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLandlordSignOutConfirm(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={onSignOut} className="flex-1 bg-[#111827] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#1f2937] transition-colors">Sign Out</button>
              </div>
            </div>
          </div>
        )}
        {/* Deactivate confirmation overlay */}
        {showLandlordDeactivateConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-red-600 text-xl">⚠️</span></div>
              <h2 className="text-lg font-bold text-[#111827] text-center mb-1">Deactivate Account?</h2>
              <p className="text-sm text-gray-500 text-center mb-4">This will permanently remove your account and all listings. <span className="font-semibold text-red-600">This cannot be undone.</span></p>
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5">
                <p className="text-xs text-red-700 font-medium mb-2">Type <span className="font-bold">CONFIRM</span> to continue:</p>
                <input value={landlordDeactivateInput} onChange={e => setLandlordDeactivateInput(e.target.value)} placeholder="Type CONFIRM here" className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 bg-white font-mono tracking-wider" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowLandlordDeactivateConfirm(false); setLandlordDeactivateInput('') }} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button disabled={landlordDeactivateInput !== 'CONFIRM'} onClick={onSignOut} className="flex-1 bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Deactivate</button>
              </div>
            </div>
          </div>
        )}
        {/* Remove listing confirmation overlay */}
        {showRemoveListingConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-red-600 text-xl">🗑️</span></div>
              <h2 className="text-lg font-bold text-[#111827] text-center mb-1">Remove Listing?</h2>
              <p className="text-sm text-gray-500 text-center mb-6">Are you sure about removing this listing? All applicants will be notified and this cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowRemoveListingConfirm(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={() => { void handleRemoveListing(editListingId); }} className="flex-1 bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-red-700 transition-colors">Remove Listing</button>
              </div>
            </div>
          </div>
        )}
        {/* Discard changes overlay (edit listing) */}
        {showDiscardEditConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
              <div className="text-2xl mb-3 text-center">⚠️</div>
              <h2 className="text-lg font-bold text-[#111827] text-center mb-1">Discard changes?</h2>
              <p className="text-sm text-gray-500 text-center mb-6">Are you sure you want to discard the changes? Your edits will be lost.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDiscardEditConfirm(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={() => { setShowDiscardEditConfirm(false); setPage('listings') }} className="flex-1 bg-[#111827] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#1f2937] transition-colors">Discard Changes</button>
              </div>
            </div>
          </div>
        )}
        {/* Discard changes overlay (add listing) */}
        {showDiscardAddConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
              <div className="text-2xl mb-3 text-center">⚠️</div>
              <h2 className="text-lg font-bold text-[#111827] text-center mb-1">Discard changes?</h2>
              <p className="text-sm text-gray-500 text-center mb-6">Are you sure you want to discard the changes? The information you've entered will be lost.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDiscardAddConfirm(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={() => { setShowDiscardAddConfirm(false); setPage('listings') }} className="flex-1 bg-[#111827] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#1f2937] transition-colors">Discard Changes</button>
              </div>
            </div>
          </div>
        )}
        {/* Notification bell */}
        <div className="flex justify-end px-6 pt-5">
          <NotificationBell
            notifications={landlordNotifications}
            onMarkRead={markLandlordNotificationRead}
            onMarkAllRead={markAllLandlordNotificationsRead}
          />
        </div>
        <div className="px-6 pb-6 max-w-5xl mx-auto space-y-6">

          {/* ── Overview ── */}
          {page === 'overview' && (
            <OverviewPage
              userName={userName}
              myListings={myListings}
              mReqs={mReqs}
              pendingRequests={pendingRequests}
              requests={requests}
              activeTenants={activeTenantCount}
              monthlyRevenue={monthlyRevenue}
              setPage={setPage}
              openLandlordListing={openLandlordListing}
            />
          )}

          {/* ── My Listings ── */}          {/* ── My Listings ── */}
          {page === 'listings' && (
            <ListingsPage
              myListings={myListings}
              openLandlordListing={openLandlordListing}
              openEdit={openEdit}
              setPage={setPage}
            />
          )}

          {/* ── Listing Detail ── */}
          {page === 'listing-detail' && landlordView && (
            <ListingDetailPage
              listing={landlordView}
              onBack={() => setPage('listings')}
              backLabel="← Back to My Listings"
              currentTenants={leases
                .filter((lease) => lease.status === 'active' && (
                  lease.propertyId === String(landlordView.propertyId || landlordView.id) ||
                  lease.propertyCode === String(landlordView.propertyId || landlordView.id) ||
                  lease.propertyTitle === landlordView.title
                ))
                .map((lease) => ({
                  name: lease.studentName || (lease.studentId ? `Student ${lease.studentId}` : 'Current tenant'),
                  studentId: lease.studentId,
                }))}
              actions={
                <button onClick={() => { openEdit(landlordView.id); setPage('edit-listing') }} className="w-full bg-[#111827] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#1f2937] transition-colors">
                  Edit this listing
                </button>
              }
            />
          )}

          {/* ── Add Listing ── */}
          {page === 'add-listing' && (
            <AddListingPage
              form={form}
              setForm={setForm}
              addrForm={addrForm}
              handleAddrChange={handleAddrChange}
              mapPin={mapPin}
              mapKm={mapKm}
              addrSyncing={false}
              facilities={facilities}
              toggleFacility={toggleFacility}
              roomCounts={roomCounts}
              roomSizeInputs={roomSizeInputs}
              updateRoomCount={updateRoomCount}
              totalSize={totalSize}
              setTotalSize={setTotalSize}
              maxTenants={maxTenants}
              setMaxTenants={setMaxTenants}
              parkingAvail={parkingAvail}
              setParkingAvail={setParkingAvail}
              isAddDirty={isAddDirty}
              setShowDiscardAddConfirm={setShowDiscardAddConfirm}
              setPage={setPage}
              onPin={handleMapPin}
              onSubmit={handleAddListing}
            />
          )}

          {/* ── Edit Listing ── */}
          {page === 'edit-listing' && editListingId !== null && (
            <EditListingPage
              editListingId={editListingId}
              myListings={myListings}
              editForm={editForm}
              setEditForm={setEditForm}
              editFacilities={editFacilities}
              toggleEditFacility={toggleEditFacility}
              editAddrForm={editAddrForm}
              handleEditAddrChange={handleEditAddrChange}
              editMapPin={editMapPin}
              editMapKm={editMapKm}
              editAddrSyncing={false}
              handleEditMapPin={handleEditMapPin}
              roomCounts={roomCounts}
              roomSizeInputs={roomSizeInputs}
              updateRoomCount={updateRoomCount}
              totalSize={totalSize}
              setTotalSize={setTotalSize}
              maxTenants={maxTenants}
              setMaxTenants={setMaxTenants}
              parkingAvail={parkingAvail}
              setParkingAvail={setParkingAvail}
              isEditDirty={isEditDirty}
              setShowDiscardEditConfirm={setShowDiscardEditConfirm}
              setShowRemoveListingConfirm={setShowRemoveListingConfirm}
              setPage={setPage}
              onSubmit={handleUpdateListing}
            />
          )}

          {/* ── Rental Requests ── */}
          {page === 'requests' && (
            <RequestsPage
              requests={requests}
              expandedRequestId={expandedRequestId}
              setExpandedRequestId={setExpandedRequestId}
              approveRequest={approveRequest}
              rejectRequest={rejectRequest}
            />
          )}

          {/* ── Rent Tracker ── */}
          {page === 'rent' && (
            <RentPage rentTransactions={liveLeaseTransactions} />
          )}

          {/* ── Maintenance ── */}
          {page === 'maintenance' && (
            <MaintenancePage
              mReqs={mReqs}
              expandedMaintId={expandedMaintId}
              setExpandedMaintId={(id) => {
                setExpandedMaintId(id)
                if (id !== null) loadLandlordMaintComments(id)
              }}
              advanceStage={advanceStage}
              revertStage={revertStage}
              addComment={addComment}
              newComment={newComment}
              setNewComment={setNewComment}
            />
          )}

          {/* ── Chat with Tenants ── */}
          {page === 'chat' && (
            <ChatPage
              currentTenants={currentTenants}
              potentialTenants={potentialTenants}
              activeChatName={activeChatName}
              setActiveChatName={setActiveChatName}
              chatThreads={chatThreads}
              chatInput={chatInput}
              setChatInput={setChatInput}
              sendChat={sendChat}
            />
          )}

          {/* ── Settings ── */}
          {page === 'settings' && (
            <SettingsPage
              userName={userName}
              profile={landlordProfile}
              onSaveProfile={handleUpdateLandlordProfile}
              myListingsCount={myListings.length}
              landlordComplaints={landlordComplaints}
              complaintTargets={complaintTargets}
              showLandlordComplaintForm={showLandlordComplaintForm}
              setShowLandlordComplaintForm={setShowLandlordComplaintForm}
              lcForm={lcForm}
              setLcForm={setLcForm}
              submitLandlordComplaint={submitLandlordComplaint}
              setShowLandlordDeactivateConfirm={setShowLandlordDeactivateConfirm}
            />
          )}

        </div>
      </main>
    </div>
  )
}
