import { useEffect, useMemo, useState } from 'react'
import type { Listing } from '../../types'
import { listings } from '../../data'
import ListingDetailPage from '../../components/ListingDetail'
import NotificationBell from '../../components/NotificationBell'
import { createListing, deleteListing, getApplications, getLeases, getMaintenanceRequests, getMyListings, getProfile, reviewApplication, updateListing, updateMaintenanceStatus } from '../../lib/landlordApi'
import { landlordNotifs } from './constants'
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

  const [page, setPage] = useState<LandlordPage>('overview')
  const [landlordView, setLandlordView] = useState<Listing | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState('')
  const [landlordProfile, setLandlordProfile] = useState<{ name?: string; email?: string; propertyCount?: number } | null>(null)
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [leases, setLeases] = useState<Array<{ id?: string; propertyId: string; studentId?: string; status?: string; monthlyRent?: number }>>([])
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [mReqs, setMReqs] = useState<MaintReq[]>([])
  const openLandlordListing = (l: Listing) => { setLandlordView(l); setPage('listing-detail') }

  const formatDisplayDate = (value?: string) => {
    if (!value) return 'N/A'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const mapMaintenanceStatusToStage = (status?: string): MaintStage => {
    switch (status) {
      case 'open': return 1
      case 'in-progress': return 3
      case 'resolved': return 5
      default: return 1
    }
  }

  const mapStageToStatus = (stage: MaintStage): 'open' | 'in-progress' | 'resolved' => {
    if (stage >= 5) return 'resolved'
    if (stage >= 2) return 'in-progress'
    return 'open'
  }

  useEffect(() => {
    let active = true

    const loadLandlordData = async () => {
      setDashboardLoading(true)
      setDashboardError('')

      try {
        const [profileResult, listingsResult, applicationsResult, leasesResult, maintenanceResult] = await Promise.all([
          getProfile().catch(() => null),
          getMyListings().catch(() => []),
          getApplications().catch(() => []),
          getLeases().catch(() => []),
          getMaintenanceRequests().catch(() => []),
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
            student: `Student ${application.studentId}`,
            studentId: String(application.studentId ?? 'N/A'),
            dept: 'UIU Student',
            phone: 'N/A',
            moveIn: 'Flexible',
            employment: 'Student',
            message: application.message ?? 'New application submitted.',
            listing: `Property ${application.propertyId}`,
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
            listing: `Property ${request.propertyId}`,
            tenant: `Student ${request.studentId}`,
            date: request.createdAt ? formatDisplayDate(request.createdAt) : 'N/A',
            priority: ['Low', 'Medium', 'High'].includes(String(request.priority)) ? (request.priority as 'Low' | 'Medium' | 'High') : 'Medium',
            stage: mapMaintenanceStatusToStage(request.status),
            estimatedDate: 'TBD',
            comments: [{ from: 'tenant', text: request.description ?? 'Maintenance request submitted.', date: request.createdAt ? formatDisplayDate(request.createdAt) : 'Today' }],
            hasPhotos: false,
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
  const [editListingId, setEditListingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ title: '', type: 'Single', price: '', distance: '', description: '' })
  const [editFacilities, setEditFacilities] = useState<string[]>([])
  const toggleEditFacility = (f: string) => setEditFacilities(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  const [editAddrForm, setEditAddrForm] = useState({ street: '', area: '', city: 'Dhaka', district: 'Dhaka', postal: '' })
  const [editMapPin, setEditMapPin] = useState<{ x: number; y: number } | null>(null)
  const [editMapKm, setEditMapKm] = useState('')
  const [editAddrSyncing, setEditAddrSyncing] = useState(false)

  const handleEditAddrChange = (field: keyof typeof editAddrForm, value: string) => {
    const next = { ...editAddrForm, [field]: value }
    setEditAddrForm(next)
    if (field === 'street' || field === 'area') {
      const combined = `${next.street} ${next.area}`.toLowerCase()
      const pin = geocodeAddress(combined)
      if (pin) {
        setEditAddrSyncing(true)
        setTimeout(() => { setEditMapPin(pin); setEditMapKm(pin.km ?? ''); setEditAddrSyncing(false) }, 600)
      }
    }
  }

  const handleEditMapPin = (p: { x: number; y: number }) => {
    const rev = reverseGeocode(p.x, p.y)
    setEditMapPin(p)
    setEditMapKm(rev.km)
    setEditAddrForm({ street: rev.street, area: rev.area, city: rev.city, district: rev.district, postal: rev.postal })
  }

  const openEdit = (id: number) => {
    const l = myListings.find(m => m.id === id)
    if (!l) return
    setEditListingId(id)
    setEditForm({ title: l.title, type: l.type, price: String(l.price), distance: String(l.distance), description: 'Comfortable and well-maintained unit with easy access to UIU campus.' })
    setEditFacilities(l.facilities ?? [])
    setEditAddrForm({ street: '', area: '', city: 'Dhaka', district: 'Dhaka', postal: '' })
    setEditMapPin(null)
    setEditMapKm('')
    setPage('edit-listing')
  }

  // ── Add Listing + Map/Address sync ──────────────────────────────────────────
  // Known landmark anchors (map %, named area, approx km from UIU at 50,50)
  const LANDMARKS = [
    { keys: ['gate 3', 'north', 'gate3'], x: 50, y: 34, area: 'Gate 3 Area, North Campus', km: '0.3' },
    { keys: ['south', 'gate 1', 'gate1'], x: 50, y: 66, area: 'Gate 1 Area, South Campus', km: '0.6' },
    { keys: ['bashundhara', 'bashundha'], x: 57, y: 37, area: 'Bashundhara R/A', km: '1.2' },
    { keys: ['east gate', 'badda', 'east'], x: 67, y: 50, area: 'Badda, East Dhaka', km: '1.8' },
    { keys: ['vatara', 'west', 'gate 4'], x: 34, y: 50, area: 'Vatara, West Area', km: '0.9' },
    { keys: ['north side', 'meradia'], x: 48, y: 30, area: 'Meradia, North Side', km: '0.4' },
  ]

  const geocodeAddress = (street: string): { x: number; y: number; km: string } | null => {
    const q = street.toLowerCase()
    const hit = LANDMARKS.find(lm => lm.keys.some(k => q.includes(k)))
    return hit ? { x: hit.x, y: hit.y, km: hit.km } : null
  }

  const reverseGeocode = (x: number, y: number): { street: string; area: string; city: string; district: string; postal: string; km: string } => {
    // find nearest landmark
    let best = LANDMARKS[0]
    let bestDist = Infinity
    for (const lm of LANDMARKS) {
      const d = Math.hypot(lm.x - x, lm.y - y)
      if (d < bestDist) { bestDist = d; best = lm }
    }
    const dx = x - 50; const dy = y - 50
    const rawKm = Math.hypot(dx, dy) * 0.042
    const km = rawKm.toFixed(1)
    const dirMap: Record<string, string> = { N: 'Road 4, Block B', S: 'Road 7, Block D', E: 'Road 12, Block A', W: 'Road 2, Block C', NE: 'Road 9, Block E', NW: 'Road 1, Block F', SE: 'Road 11, Block G', SW: 'Road 3, Block H' }
    const angle = Math.atan2(dy, dx) * 180 / Math.PI
    const dir = angle < -157.5 ? 'W' : angle < -112.5 ? 'SW' : angle < -67.5 ? 'S' : angle < -22.5 ? 'SE' : angle < 22.5 ? 'E' : angle < 67.5 ? 'NE' : angle < 112.5 ? 'N' : angle < 157.5 ? 'NW' : 'W'
    const postalMap: Record<string, string> = { N: '1212', S: '1219', E: '1213', W: '1216', NE: '1229', NW: '1215', SE: '1230', SW: '1218' }
    return { street: dirMap[dir] ?? 'Road 5, Block A', area: best.area, city: 'Dhaka', district: 'Dhaka', postal: postalMap[dir] ?? '1212', km }
  }

  const [form, setForm] = useState({ title: '', type: 'Single', price: '', description: '' })
  const [addrForm, setAddrForm] = useState({ street: '', area: '', city: 'Dhaka', district: 'Dhaka', postal: '' })
  const [mapPin, setMapPin] = useState<{ x: number; y: number } | null>(null)
  const [mapKm, setMapKm] = useState('')
  const [addrSyncing, setAddrSyncing] = useState(false)
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

  const handleAddListing = async () => {
    if (!form.title.trim() || !form.price || !addrForm.street.trim()) {
      setDashboardError('Please complete the listing title, price, and address before publishing.')
      return
    }

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || 'Available UIU-area rental property.',
        type: (form.type || 'Single').toLowerCase() as 'apartment' | 'house' | 'room' | 'studio' | 'duplex' | 'sublet',
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
          latitude: mapPin?.x ? Number(mapPin.x) / 100 : 23.8148,
          longitude: mapPin?.y ? Number(mapPin.y) / 100 : 90.4256,
        },
        status: 'approved',
      }

      await createListing(payload)
      await refreshMyListings()
      setPage('listings')
      setDashboardError('')
      setForm({ title: '', type: 'Single', price: '', description: '' })
      setAddrForm({ street: '', area: '', city: 'Dhaka', district: 'Dhaka', postal: '' })
      setFacilities([])
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Listing creation failed.')
    }
  }

  const handleUpdateListing = async () => {
    if (editListingId === null) return
    try {
      const payload = {
        title: editForm.title.trim(),
        description: editForm.description.trim() || 'Updated UIU-area rental property.',
        type: (editForm.type || 'Single').toLowerCase() as 'apartment' | 'house' | 'room' | 'studio' | 'duplex' | 'sublet',
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
          latitude: editMapPin?.x ? Number(editMapPin.x) / 100 : 23.8148,
          longitude: editMapPin?.y ? Number(editMapPin.y) / 100 : 90.4256,
        },
        status: 'approved',
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

  // When address field changes → geocode → move pin
  const handleAddrChange = (field: keyof typeof addrForm, value: string) => {
    const next = { ...addrForm, [field]: value }
    setAddrForm(next)
    if (field === 'street' || field === 'area') {
      const combined = `${next.street} ${next.area}`.toLowerCase()
      const geo = geocodeAddress(combined)
      if (geo) {
        setMapPin({ x: geo.x, y: geo.y })
        setMapKm(geo.km)
      }
    }
  }

  // When pin placed on map → reverse geocode → fill address fields
  const handleMapPin = (p: { x: number; y: number }) => {
    setMapPin(p)
    setAddrSyncing(true)
    const rev = reverseGeocode(p.x, p.y)
    setAddrForm({ street: rev.street, area: rev.area, city: rev.city, district: rev.district, postal: rev.postal })
    setMapKm(rev.km)
    setTimeout(() => setAddrSyncing(false), 600)
  }

  // ── Rental requests ──────────────────────────────────────────────────────────
  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(null)
  const pendingRequests = requests.filter(r => r.status === 'pending').length
  const activeTenantCount = leases.filter((lease) => lease.status === 'active').length
  const monthlyRevenue = leases.reduce((sum, lease) => sum + Number(lease.monthlyRent ?? 0), 0)
  const liveLeaseTransactions = leases.map((lease) => ({
    id: Number(lease.id ?? lease.propertyId ?? Date.now()),
    tenant: lease.studentId ? `Student ${lease.studentId}` : 'Tenant',
    listing: lease.propertyId ? `Property ${lease.propertyId}` : 'Lease',
    amount: Number(lease.monthlyRent ?? 0),
    month: 'Current cycle',
    paid: lease.status === 'active',
  }))
  const approveRequest = async (id: number) => {
    try {
      await reviewApplication(id, { status: 'accepted' })
      setRequests(rs => rs.map(r => r.id === id ? { ...r, status: 'approved' } : r))
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
      await updateMaintenanceStatus(id, { status: mapStageToStatus(nextStage) })
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
      await updateMaintenanceStatus(id, { status: mapStageToStatus(nextStage) })
      setMReqs(ms => ms.map(m => m.id === id ? { ...m, stage: nextStage } : m))
      setDashboardError('')
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Unable to revert maintenance request status.')
    }
  }

  const addComment = (id: number) => {
    const text = newComment[id]?.trim()
    if (!text) return
    setMReqs(ms => ms.map(m => m.id === id
      ? { ...m, comments: [...m.comments, { from: 'landlord', text, date: 'Now' }] }
      : m
    ))
    setNewComment(nc => ({ ...nc, [id]: '' }))
  }


  // ── Chat ─────────────────────────────────────────────────────────────────────
  // Current tenants: active lease; Potential tenants: applicants
  const currentTenants = useMemo(() => {
    const activeLeaseTenants = leases
      .filter((lease) => lease.status === 'active')
      .map((lease) => ({
        name: lease.studentId ? `Student ${lease.studentId}` : 'Active Tenant',
        listing: lease.propertyId ? `Property ${lease.propertyId}` : 'Current listing',
        category: 'current' as const,
      }))

    return activeLeaseTenants.length > 0
      ? activeLeaseTenants
      : [
          { name: 'Tanvir Ahmed', listing: 'Studio near Gate 3', category: 'current' as const },
          { name: 'Sadia Islam', listing: 'Shared Mess – South Campus', category: 'current' as const },
        ]
  }, [leases])

  const potentialTenants = useMemo(() => {
    const applicantContacts = requests
      .filter((request) => request.status === 'pending')
      .map((request) => ({
        name: request.studentId ? `Student ${request.studentId}` : request.student,
        listing: request.listing || 'Pending property',
        category: 'potential' as const,
      }))

    return applicantContacts.length > 0
      ? applicantContacts
      : [
          { name: 'Rifat Hassan', listing: 'Studio near Gate 3', category: 'potential' as const },
          { name: 'Alif Hossain', listing: 'Bachelor Flat – North Side', category: 'potential' as const },
        ]
  }, [requests])

  const [activeChatName, setActiveChatName] = useState(currentTenants[0]?.name ?? 'Tanvir Ahmed')
  const [chatThreads, setChatThreads] = useState<Record<string, ChatMsg[]>>(() => ({
    'Tanvir Ahmed': [
      { from: 'tenant', text: 'Hello! The AC has been making a loud noise lately.' },
      { from: 'landlord', text: "Thanks for letting me know. I'll send a technician tomorrow." },
      { from: 'tenant', text: 'Thank you! Appreciate the quick response.' },
    ],
    'Sadia Islam': [
      { from: 'tenant', text: 'Hi, when will the pipe leak be fixed?' },
      { from: 'landlord', text: "The technician is scheduled for this Friday. I'll confirm the time shortly." },
    ],
    'Rifat Hassan': [
      { from: 'tenant', text: 'I submitted an application for the Studio near Gate 3. Can I schedule a viewing?' },
    ],
    'Alif Hossain': [],
    ...(currentTenants[0] && currentTenants[0].name !== 'Tanvir Ahmed' ? { [currentTenants[0].name]: [{ from: 'tenant', text: 'I am following up on my maintenance request.' }] } : {}),
    ...(potentialTenants[0] && !['Rifat Hassan', 'Alif Hossain'].includes(potentialTenants[0].name) ? { [potentialTenants[0].name]: [{ from: 'tenant', text: 'I would like to ask about viewing availability.' }] } : {}),
  }))

  useEffect(() => {
    if (!currentTenants.some((tenant) => tenant.name === activeChatName) && !potentialTenants.some((tenant) => tenant.name === activeChatName)) {
      setActiveChatName(currentTenants[0]?.name ?? potentialTenants[0]?.name ?? 'Tanvir Ahmed')
    }
  }, [activeChatName, currentTenants, potentialTenants])
  const [chatInput, setChatInput] = useState('')

  const sendChat = () => {
    if (!chatInput.trim()) return
    setChatThreads(t => ({ ...t, [activeChatName]: [...(t[activeChatName] ?? []), { from: 'landlord', text: chatInput }] }))
    setChatInput('')
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

  // Landlord complaints
  type LandlordComplaint = { id: string; against: string; property: string; category: string; subject: string; description: string; date: string; status: 'Submitted' | 'Under Review' | 'Responded' | 'Resolved' | 'Closed' }
  const [landlordComplaints, setLandlordComplaints] = useState<LandlordComplaint[]>([])
  const [showLandlordComplaintForm, setShowLandlordComplaintForm] = useState(false)
  const [lcForm, setLcForm] = useState({ against: '', property: '', category: 'Late Payment', subject: '', description: '' })
  const submitLandlordComplaint = () => {
    if (!lcForm.subject.trim() || !lcForm.against.trim()) return
    setLandlordComplaints(prev => [...prev, {
      id: `CMP-${String(prev.length + 1).padStart(3, '0')}`,
      against: lcForm.against,
      property: lcForm.property,
      category: lcForm.category,
      subject: lcForm.subject,
      description: lcForm.description,
      date: '31 Jul 2026',
      status: 'Submitted',
    }])
    setLcForm({ against: '', property: '', category: 'Late Payment', subject: '', description: '' })
    setShowLandlordComplaintForm(false)
  }

  const isEditDirty = editListingId !== null && (() => {
    const orig = listings.find(l => l.id === editListingId)
    if (!orig) return false
    return editForm.title !== orig.title || editForm.price !== String(orig.price) || editForm.distance !== String(orig.distance) || editForm.type !== orig.type
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
          <NotificationBell notifications={landlordNotifs} />
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
              addrSyncing={addrSyncing}
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
              editAddrSyncing={editAddrSyncing}
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
              setExpandedMaintId={setExpandedMaintId}
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
              myListingsCount={myListings.length}
              landlordComplaints={landlordComplaints}
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
