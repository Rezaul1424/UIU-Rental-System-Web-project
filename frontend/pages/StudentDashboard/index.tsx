import { useEffect, useMemo, useState } from 'react'
import type { Listing } from '../../types'
import { listings } from '../../data'
import { Badge } from '../../components/ui'
import NotificationBell from '../../components/NotificationBell'
import { addFavorite, addMaintenanceComment, cancelApplication as cancelStudentApplication, fetchPublicListings, getApplications, getFavorites, getLeases, getMaintenanceComments, getMaintenanceRequests, getProfile, getReceipts, getRentSummary, getStudentComplaints, getStudentReviews, payRent, removeFavorite, submitApplication as submitStudentApplication, submitMaintenanceRequest, submitStudentComplaint, submitStudentReview, updateProfile as updateStudentProfile, type StudentApplication } from '../../lib/studentApi'
import { studentNotifs } from './constants'
import StudentSidebarNav from './Sidebar'
import OverviewPage from './pages/OverviewPage'
import BrowsePage from './pages/BrowsePage'
import ListingDetailViewPage from './pages/ListingDetailViewPage'
import ApplyFormPage from './pages/ApplyFormPage'
import ApplicationsPage from './pages/ApplicationsPage'
import PayRentPage from './pages/PayRentPage'
import ReceiptsPage from './pages/ReceiptsPage'
import MaintenancePage from './pages/MaintenancePage'
import ReviewsPage from './pages/ReviewsPage'
import ChatPage from './pages/ChatPage'
import FavoritesPage from './pages/FavoritesPage'
import SettingsPage from './pages/SettingsPage'
import type { StudentPage } from './types'

export default function StudentDashboard({ userName, onSignOut }: { userName: string; onSignOut: () => void }) {
  type AppStatus = 'under-review' | 'accepted' | 'rejected' | 'cancelled'
  type Application = StudentApplication & { status: AppStatus }
  type Review = { id: number; landlord: string; property: string; listingId: number; landlordStars: number; propStars: number; text: string; date: string }
  type ChatMsg = { from: 'student' | 'landlord'; text: string }

  const [page, setPage] = useState<StudentPage>('overview')
  const [applyListing, setApplyListing] = useState<Listing | null>(null)
  const [viewListing, setViewListing] = useState<Listing | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState('')
  const [studentProfile, setStudentProfile] = useState<{ name?: string; email?: string; studentId?: string } | null>(null)
  const openStudentListing = (l: Listing) => { setViewListing(l); setPage('listing-detail') }
  const [allListings, setAllListings] = useState<Listing[]>([])

  useEffect(() => {
    let active = true

    const loadStudentData = async () => {
      setDashboardLoading(true)
      setDashboardError('')

      try {
        const [profileResult, favoriteResult, applicationResult, rentResult, receiptResult, leaseResult, maintenanceResult, listingsResult, reviewsResult, complaintsResult] = await Promise.all([
          getProfile().catch(() => null),
          getFavorites().catch(() => []),
          getApplications().catch(() => []),
          getRentSummary().catch(() => []),
          getReceipts().catch(() => []),
          getLeases().catch(() => []),
          getMaintenanceRequests().catch(() => []),
          fetchPublicListings().catch(() => []),
          getStudentReviews().catch(() => []),
          getStudentComplaints().catch(() => []),
        ])

        if (!active) return

        if (profileResult) {
          setStudentProfile(profileResult)
        }
        setFavorites(Array.isArray(favoriteResult) ? favoriteResult : [])
        setApplications(Array.isArray(applicationResult) ? applicationResult : [])
        setRentSummary(Array.isArray(rentResult) ? rentResult : [])
        setReceipts(Array.isArray(receiptResult) ? receiptResult : [])
        const leasesList = Array.isArray(leaseResult) ? leaseResult : []
        setLeases(leasesList)
        setAllListings(Array.isArray(listingsResult) ? listingsResult : [])
        setMyRequests(Array.isArray(maintenanceResult) ? maintenanceResult.map((request) => ({
          id: Number(request.id ?? Date.now()),
          issue: request.issue,
          priority: request.priority,
          description: request.description,
          property: leasesList.find(l => l.propertyId === request.propertyId)?.propertyTitle || (leasesList[0]?.propertyTitle ?? 'Rental Unit'),
          status: request.status,
          date: request.createdAt ? new Date(request.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
        })) : [])
        if (Array.isArray(reviewsResult)) {
          setReviewHistory(reviewsResult.map((r: any) => ({
            id: Number(r.id ?? Date.now()),
            landlord: r.landlord || r.landlordName || 'Landlord',
            property: r.property || r.propertyTitle || 'Property',
            listingId: Number(r.propertyId ?? r.listingId ?? 0),
            landlordStars: Number(r.landlordStars ?? 0),
            propStars: Number(r.propStars ?? r.propertyStars ?? 0),
            text: r.text || r.comment || '',
            date: r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''),
          })))
        }
        if (Array.isArray(complaintsResult) && complaintsResult.length > 0) {
          setComplaints(complaintsResult.map((c: { id?: string; accusedName?: string; propertyTitle?: string; category?: string; description?: string; createdAt?: string; status?: string }) => ({
            id: c.id ?? `CMP-${Date.now()}`,
            against: c.accusedName ?? '',
            property: c.propertyTitle ?? '',
            category: c.category ?? 'Other',
            subject: c.description?.split(' — ')[0] ?? '',
            description: c.description?.split(' — ').slice(1).join(' — ') ?? c.description ?? '',
            date: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
            status: (['Submitted', 'Under Review', 'Responded', 'Resolved', 'Closed'].includes(c.status ?? '') ? c.status : 'Submitted') as 'Submitted' | 'Under Review' | 'Responded' | 'Resolved' | 'Closed',
          })))
        }
      } catch (error) {
        if (!active) return
        setDashboardError(error instanceof Error ? error.message : 'Unable to load student dashboard data.')
      } finally {
        if (active) setDashboardLoading(false)
      }
    }

    loadStudentData()
    return () => { active = false }
  }, [])

  // Browse filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'Single' | 'Mess' | 'Shared' | 'Sublet'>('all')
  const [distFilter, setDistFilter] = useState<'all' | '0.5' | '1' | '2'>('all')
  const [maxPrice, setMaxPrice] = useState(8000)
  const [additionalFilters, setAdditionalFilters] = useState<string[]>([])
  const [bedroomFilter] = useState<'any' | '1' | '2' | '3' | '4+'>('any')
  const [roommateFilter] = useState<'any' | '1' | '2' | '3' | '4+'>('any')
  const toggleAdditionalFilter = (f: string) =>
    setAdditionalFilters(a => a.includes(f) ? a.filter(x => x !== f) : [...a, f])

  // Favorites
  const [favorites, setFavorites] = useState<number[]>([])
  const toggleFavorite = async (id: number) => {
    const isFavorite = favorites.includes(id)
    const nextFavorites = isFavorite ? favorites.filter(f => f !== id) : [...favorites, id]
    setFavorites(nextFavorites)

    try {
      if (isFavorite) {
        await removeFavorite(id)
      } else {
        await addFavorite(id)
      }
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Could not update favorite.')
      setFavorites(favorites)
    }
  }

  // Browse listings – live from API
  const [browseListings, setBrowseListings] = useState<Listing[]>([])
  const [browseLoading, setBrowseLoading] = useState(false)

  useEffect(() => {
    if (page !== 'browse') return
    let active = true
    const load = async () => {
      setBrowseLoading(true)
      try {
        const results = await fetchPublicListings({
          type: typeFilter === 'all' ? undefined : typeFilter,
          maxPrice,
          maxDistance: distFilter === 'all' ? undefined : parseFloat(distFilter),
          facilities: additionalFilters.length ? additionalFilters : undefined,
        })
        if (active) setBrowseListings(results)
      } catch {
        // keep previous listings on error
      } finally {
        if (active) setBrowseLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [page, typeFilter, distFilter, maxPrice, additionalFilters])

  const filteredListings = browseListings.filter(l => {
    if (bedroomFilter !== 'any') {
      const beds = l.rooms?.bedroom ?? 0
      if (bedroomFilter === '4+' && beds < 4) return false
      else if (bedroomFilter !== '4+' && beds !== parseInt(bedroomFilter)) return false
    }
    if (roommateFilter !== 'any') {
      const cap = l.roommateCapacity ?? 0
      if (roommateFilter === '4+' && cap < 4) return false
      else if (roommateFilter !== '4+' && cap !== parseInt(roommateFilter)) return false
    }
    return true
  })

  // ── Applications ────────────────────────────────────────────────────────────
  const [applications, setApplications] = useState<Application[]>([])
  const hasApplied = (id: number) => applications.some(a => (a.listingId === id || Number(a.propertyId) === id) && a.status !== 'cancelled')
  const openApplicationListing = (app: Application) => {
    const matched = allListings.find(l => l.id === app.listingId || String(l.id) === app.propertyId || l.propertyId === app.propertyId)
      ?? listings.find(l => l.id === app.listingId)
    if (matched) {
      setViewListing(matched)
      setPage('listing-detail')
    } else {
      const fallbackListing: Listing = {
        id: app.listingId || 1,
        title: app.propertyTitle || (app.propertyId ? `Property ${app.propertyId}` : 'UIU Rental Property'),
        landlord: 'UIU Landlord',
        type: 'Single',
        distance: '0.5 km',
        price: 5000,
        status: 'available',
        facilities: ['WiFi', 'Water'],
        image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=380&fit=crop&auto=format',
        propertyId: app.propertyId || `UIU-${app.listingId}`,
      }
      setViewListing(fallbackListing)
      setPage('listing-detail')
    }
  }
  const onReApply = (app: Application) => {
    // Find matching listing from allListings or construct a minimal listing object
    const matchedListing = allListings.find(l => l.id === app.listingId || String(l.id) === app.propertyId || l.propertyId === app.propertyId)
      ?? listings.find(l => l.id === app.listingId)
    if (matchedListing) {
      setApplyListing(matchedListing)
      setPage('apply-form')
    } else {
      const fallbackListing: Listing = {
        id: app.listingId || 1,
        title: app.propertyTitle || (app.propertyId ? `Property ${app.propertyId}` : 'UIU Rental Property'),
        landlord: 'UIU Landlord',
        type: 'Single',
        distance: '0.5 km',
        price: 5000,
        status: 'available',
        facilities: ['WiFi', 'Water'],
        image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=380&fit=crop&auto=format',
        propertyId: app.propertyId || `UIU-${app.listingId}`,
      }
      setApplyListing(fallbackListing)
      setPage('apply-form')
    }
  }
  const cancelApplication = async (app: Application) => {
    const targetId = app.id || app.propertyId || String(app.listingId)
    if (!targetId) return
    // Optimistic update
    setApplications(prev => prev.map(a => (a.id === app.id || a.propertyId === app.propertyId) ? { ...a, status: 'cancelled' } : a))
    try {
      await cancelStudentApplication(targetId)
      const refreshed = await getApplications().catch(() => [] as Application[])
      setApplications(refreshed)
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Could not cancel application.')
      const refreshed = await getApplications().catch(() => [] as Application[])
      setApplications(refreshed)
    }
  }

  const [appForm, setAppForm] = useState({ studentId: '', phone: '', moveIn: '', message: '', employment: 'Student' })
  const handleSubmitApplication = async () => {
    if (!applyListing) return

    if (hasApplied(applyListing.id)) {
      setDashboardError('You already submitted an application for this listing.')
      return
    }

    try {
      await submitStudentApplication({
        propertyId: String(applyListing.propertyId || applyListing.id),
        studentCardNo: appForm.studentId || undefined,
        contactPhone: appForm.phone || undefined,
        moveInDate: appForm.moveIn || new Date().toISOString().slice(0, 10),
        employment: appForm.employment || 'Student',
        message: appForm.message || undefined,
      })

      const refreshedApplications = await getApplications().catch(() => [])
      setApplications(refreshedApplications)
      setPage('applications')
      setApplyListing(null)
      setAppForm({ studentId: '', phone: '', moveIn: '', message: '', employment: 'Student' })
      setDashboardError('')
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Application submission failed.')
    }
  }

  // ── Lease and rent data ─────────────────────────────────────────────────────
  const [rentSummary, setRentSummary] = useState<Array<{ id: string; leaseId: string; month: string; amount: number; dueDate: string; status: string; paid: boolean }>>([])
  const [receipts, setReceipts] = useState<Array<{ month: string; amount: number; paid: boolean }>>([])
  const [leases, setLeases] = useState<Array<{ id?: string; propertyId: string; propertyTitle?: string; propertyCode?: string; landlordId?: string; landlordName?: string; status: string; startDate?: string; endDate?: string; monthlyRent?: number }>>([])

  // ── Maintenance ─────────────────────────────────────────────────────────────
  const [myRequests, setMyRequests] = useState<Array<{ id: number; issue: string; status: string; date: string }>>([])
  const [showNewReq, setShowNewReq] = useState(false)
  const [newReq, setNewReq] = useState({ issue: '', description: '', priority: 'Medium' })
  const submitRequest = async () => {
    if (!newReq.issue.trim()) return
    if (!leases.length) {
      setDashboardError('You need an active lease before creating a maintenance request.')
      return
    }

    const primaryLease = leases.find((l) => l.status === 'active') ?? leases[0]
    try {
      await submitMaintenanceRequest({
        propertyId: primaryLease.propertyId,
        landlordId: primaryLease.landlordId || '',
        issue: newReq.issue,
        description: newReq.description,
        priority: (newReq.priority as 'Low' | 'Medium' | 'High') || 'Medium',
        category: 'General',
      })

      const refreshed = await getMaintenanceRequests().catch(() => [])
      setMyRequests(Array.isArray(refreshed) ? refreshed.map((request) => ({
        id: Number(request.id ?? Date.now()),
        issue: request.issue,
        priority: request.priority,
        description: request.description,
        property: primaryLease.propertyTitle || 'Rental Unit',
        status: request.status,
        date: request.createdAt ? new Date(request.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
      })) : [])
      setNewReq({ issue: '', description: '', priority: 'Medium' })
      setShowNewReq(false)
      setDashboardError('')
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Maintenance request submission failed.')
    }
  }

  const handleUpdateStudentProfile = async (data: { name?: string; phone?: string; studentId?: string }): Promise<boolean> => {
    try {
      const updated = await updateStudentProfile(data)
      const res = updated && 'data' in updated ? (updated as any).data : updated
      setStudentProfile(prev => ({ ...prev, ...res }))
      setDashboardError('')
      return true
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Unable to update profile.')
      return false
    }
  }

  // ── Pay rent ─────────────────────────────────────────────────────────────────
  const [payStep, setPayStep] = useState<'form' | 'success'>('form')
  const [payForm, setPayForm] = useState({ card: '', expiry: '', cvv: '', name: '' })
  const submitPayment = async () => {
    setPayStep('success')
    const activeLease = leases.find(l => l.status === 'active') ?? leases[0]
    const pendingRent = rentSummary.find(r => !r.paid && r.status !== 'paid') ?? rentSummary[0]
    const rentAmount = pendingRent?.amount ?? activeLease?.monthlyRent ?? 4200
    const currentMonth = pendingRent?.month ?? new Date().toLocaleString('default', { month: 'short', year: 'numeric' })

    setReceipts(prev => {
      if (prev.some(r => r.month === currentMonth)) return prev
      return [{ month: currentMonth, amount: rentAmount, paid: true }, ...prev]
    })
    setRentSummary(prev => prev.map(r => (!pendingRent || r.id === pendingRent.id) ? { ...r, paid: true, status: 'paid' } : r))

    if (pendingRent?.id) {
      try {
        await payRent(pendingRent.id, { method: payMethod })
        const [refreshedRent, refreshedReceipts] = await Promise.all([
          getRentSummary().catch(() => null),
          getReceipts().catch(() => null),
        ])
        if (refreshedRent) setRentSummary(refreshedRent)
        if (refreshedReceipts) setReceipts(refreshedReceipts)
      } catch (err) {
        console.error('Failed to submit rent payment to backend:', err)
      }
    }
  }

  // ── Reviews ──────────────────────────────────────────────────────────────────
  // Landlords the student can review: current + any previously applied
  const reviewableLandlords = useMemo(() => {
    const sourceListings = allListings.length > 0 ? allListings : listings
    const derived = sourceListings
      .filter((listing) => listing.landlord && listing.title)
      .map((listing) => ({
        landlord: listing.landlord,
        property: listing.title,
        listingId: listing.id,
      }))

    if (derived.length > 0) return derived

    return [
      { landlord: 'Rahman Faruk', property: 'Studio near Gate 3', listingId: 1 },
      { landlord: 'Nusrat Jahan', property: 'Shared Mess – South Campus', listingId: 2 },
    ]
  }, [allListings])

  const [reviewTarget, setReviewTarget] = useState(reviewableLandlords[0])
  useEffect(() => {
    if (!reviewableLandlords.some((entry) => entry.listingId === reviewTarget.listingId)) {
      setReviewTarget(reviewableLandlords[0])
    }
  }, [reviewTarget.listingId, reviewableLandlords])

  const [landlordStars, setLandlordStars] = useState(0)
  const [propStars, setPropStars] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewHistory, setReviewHistory] = useState<Review[]>([])
  const submitReview = async () => {
    const calculatedPropStars = Math.min(5, Math.max(1, Math.round((questionAnswers[0] + questionAnswers[3] + questionAnswers[4]) / 3))) || 5
    const calculatedLandlordStars = Math.min(5, Math.max(1, Math.round((questionAnswers[1] + questionAnswers[2]) / 2))) || 5
    if (!reviewText.trim()) return

    const optimistic: Review = {
      id: Date.now(),
      landlord: reviewTarget.landlord,
      property: reviewTarget.property,
      listingId: reviewTarget.listingId,
      landlordStars: calculatedLandlordStars,
      propStars: calculatedPropStars,
      text: reviewText,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    }
    setReviewHistory(h => [optimistic, ...h.filter(r => r.listingId !== reviewTarget.listingId)])
    setLandlordStars(0)
    setPropStars(0)
    setQuestionAnswers([0, 0, 0, 0, 0])
    setWouldRecommend('')
    setReviewText('')
    setPage('review-history')
    try {
      await submitStudentReview({
        propertyId: String(reviewTarget.listingId),
        landlordStars: calculatedLandlordStars,
        propertyStars: calculatedPropStars,
        comment: reviewText,
      })
    } catch (err) {
      console.error('Failed to submit review to backend:', err)
    }
  }
  const alreadyReviewed = (listingId: number) => reviewHistory.some(r => r.listingId === listingId)

  // ── Chat ─────────────────────────────────────────────────────────────────────
  // All landlords from listings are available to chat with
  const allLandlords = useMemo(
    () => Array.from(new Map(listings.map((listing) => [listing.landlord, listing])).values()),
    [],
  )

  const [activeChatLandlord, setActiveChatLandlord] = useState<string>(allLandlords[0]?.landlord ?? 'Rahman Faruk')
  const [chatThreads, setChatThreads] = useState<Record<string, ChatMsg[]>>(() => ({
    'Rahman Faruk': [
      { from: 'landlord', text: 'Hello! How can I help you today?' },
      { from: 'student', text: 'I wanted to ask about the parking availability.' },
      { from: 'landlord', text: 'Yes, we have one parking spot included with your unit.' },
    ],
    ...(allLandlords[0] && allLandlords[0].landlord !== 'Rahman Faruk'
      ? { [allLandlords[0].landlord]: [{ from: 'landlord', text: `Hello! I can help with ${allLandlords[0].title}.` }] }
      : {}),
  }))

  useEffect(() => {
    if (!allLandlords.some((listing) => listing.landlord === activeChatLandlord) && allLandlords[0]) {
      setActiveChatLandlord(allLandlords[0].landlord)
    }
  }, [activeChatLandlord, allLandlords])
  const [chatInput, setChatInput] = useState('')

  const openChatWith = (landlordName: string) => {
    if (!chatThreads[landlordName]) {
      setChatThreads(t => ({ ...t, [landlordName]: [] }))
    }
    setActiveChatLandlord(landlordName)
    setPage('chat')
  }

  const sendChat = () => {
    if (!chatInput.trim()) return
    const msg: ChatMsg = { from: 'student', text: chatInput }
    setChatThreads(t => ({ ...t, [activeChatLandlord]: [...(t[activeChatLandlord] ?? []), msg] }))
    setChatInput('')
    setTimeout(() => {
      setChatThreads(t => ({
        ...t,
        [activeChatLandlord]: [...(t[activeChatLandlord] ?? []), { from: 'landlord', text: "Thanks for your message! I'll get back to you shortly." }],
      }))
    }, 900)
  }

  const activeMsgs = chatThreads[activeChatLandlord] ?? []
  const activeLandlordListing = listings.find(l => l.landlord === activeChatLandlord)

  // ── Additional UI state ──────────────────────────────────────────────────────
  const [payMethod, setPayMethod] = useState<'card'|'mobile'|'bank'>('card')
  const [chatCategoryTab, setChatCategoryTab] = useState<'current'|'previous'|'potential'>('current')
  const [expandedMaintId, setExpandedMaintId] = useState<number|null>(null)
  const [reviewStep, setReviewStep] = useState(0)
  const [questionAnswers, setQuestionAnswers] = useState<number[]>([0,0,0,0,0])
  const [wouldRecommend, setWouldRecommend] = useState<'yes'|'no'|'maybe'|''>('')
  // Confirmation overlays
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const [deactivateInput, setDeactivateInput] = useState('')
  // Complaints
  type Complaint = { id: string; against: string; property: string; category: string; subject: string; description: string; date: string; status: 'Submitted' | 'Under Review' | 'Responded' | 'Resolved' | 'Closed' }
  const [complaints, setComplaints] = useState<Complaint[]>([
    { id: 'CMP-001', against: 'Rahman Faruk', property: 'Studio near Gate 3', category: 'Maintenance Neglect', subject: 'AC repair ignored for 2 weeks', description: 'Reported the AC issue on July 10th but no response received.', date: '22 Jul 2026', status: 'Under Review' },
  ])
  const [showComplaintForm, setShowComplaintForm] = useState(false)
  const [cForm, setCForm] = useState({ against: '', property: '', category: 'Maintenance Neglect', subject: '', description: '' })
  const submitComplaint = async () => {
    if (!cForm.subject.trim() || !cForm.against.trim()) return
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    setComplaints(prev => [...prev, {
      id: `CMP-${String(prev.length + 1).padStart(3, '0')}`,
      against: cForm.against,
      property: cForm.property,
      category: cForm.category,
      subject: cForm.subject,
      description: cForm.description,
      date: today,
      status: 'Submitted',
    }])
    setCForm({ against: '', property: '', category: 'Maintenance Neglect', subject: '', description: '' })
    setShowComplaintForm(false)
    try {
      await submitStudentComplaint({
        against: cForm.against,
        property: cForm.property,
        category: cForm.category,
        subject: cForm.subject,
        description: cForm.description,
      })
    } catch (err) {
      console.error('Failed to submit complaint to backend:', err)
    }
  }
  // Maintenance chat (per request) — backed by maintenance_comments API
  const [maintChatThreads, setMaintChatThreads] = useState<Record<number, {from:'student'|'landlord';text:string}[]>>({})
  const [maintChatInput, setMaintChatInput] = useState<Record<number,string>>({})
  const sendMaintChat = async (reqId: number) => {
    const text = (maintChatInput[reqId] ?? '').trim()
    if (!text) return
    // Optimistic update
    setMaintChatThreads(t => ({ ...t, [reqId]: [...(t[reqId]??[]), { from: 'student', text }] }))
    setMaintChatInput(c => ({ ...c, [reqId]: '' }))
    try {
      await addMaintenanceComment(reqId, text)
    } catch (err) {
      console.error('Failed to send maintenance comment:', err)
    }
  }
  // Load comments when a request is expanded
  const loadMaintComments = async (reqId: number) => {
    try {
      const comments = await getMaintenanceComments(reqId)
      setMaintChatThreads(t => ({
        ...t,
        [reqId]: comments.map((c: any) => ({
          from: (c.from === 'landlord' ? 'landlord' : 'student') as 'student' | 'landlord',
          text: c.text ?? c.message ?? '',
        })),
      }))
    } catch (err) {
      console.error('Failed to load maintenance comments:', err)
    }
  }

  useEffect(() => {
    if (!rentSummary.length) return
    const nextReceipts = rentSummary
      .map((item) => ({
        month: item.month,
        amount: item.amount,
        paid: item.paid || item.status === 'paid',
      }))
      .filter((item) => item.amount > 0)
    setReceipts(nextReceipts.length ? nextReceipts : [])
  }, [rentSummary])

  const statusBadge = (status: AppStatus) => {
    if (status === 'under-review') return <Badge variant="warning">Under Review</Badge>
    if (status === 'accepted')    return <Badge variant="success">Accepted</Badge>
    if (status === 'rejected')    return <Badge variant="danger">Rejected</Badge>
    return <Badge variant="default">Cancelled</Badge>
  }

  return (
    <div className="flex min-h-screen">
      <StudentSidebarNav
        page={page}
        setPage={(nextPage: string) => setPage(nextPage as StudentPage)}
        badgeCount={favorites.length}
        pendingApplications={applications.filter(a => a.status === 'under-review').length}
        chatCount={Object.keys(chatThreads).length}
        userName={studentProfile?.name || userName}
        onSignOut={() => setShowSignOutConfirm(true)}
      />

      <main className="flex-1 overflow-auto bg-[#f8fafc]">
        {dashboardLoading && (
          <div className="px-6 pt-6">
            <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">Loading your student dashboard...</div>
          </div>
        )}
        {dashboardError && (
          <div className="px-6 pt-6">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{dashboardError}</div>
          </div>
        )}
        {showSignOutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
              <div className="text-2xl mb-3 text-center">👋</div>
              <h2 className="text-lg font-bold text-[#111827] text-center mb-1">Sign out?</h2>
              <p className="text-sm text-gray-500 text-center mb-6">Are you sure you want to sign out of your account?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowSignOutConfirm(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={onSignOut} className="flex-1 bg-[#111827] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#1f2937] transition-colors">Sign Out</button>
              </div>
            </div>
          </div>
        )}
        {showDeactivateConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <h2 className="text-lg font-bold text-[#111827] text-center mb-1">Deactivate Account?</h2>
              <p className="text-sm text-gray-500 text-center mb-4">This will permanently remove your profile, applications, and all associated data. <span className="font-semibold text-red-600">This cannot be undone.</span></p>
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5">
                <p className="text-xs text-red-700 font-medium mb-2">Type <span className="font-bold">CONFIRM</span> to continue:</p>
                <input
                  value={deactivateInput}
                  onChange={e => setDeactivateInput(e.target.value)}
                  placeholder="Type CONFIRM here"
                  className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 bg-white font-mono tracking-wider"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowDeactivateConfirm(false); setDeactivateInput('') }} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button disabled={deactivateInput !== 'CONFIRM'} onClick={onSignOut} className="flex-1 bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Deactivate</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end px-6 pt-5">
          <NotificationBell notifications={studentNotifs} />
        </div>
        <div className="px-6 pb-6 max-w-5xl mx-auto space-y-6">
          {page === 'overview' && (
            <OverviewPage
              userName={userName}
              applications={applications}
              myRequests={myRequests}
              onNavigate={setPage}
              openChatWith={openChatWith}
              setShowNewReq={setShowNewReq}
              leases={leases}
              rentSummary={rentSummary}
            />
          )}

          {page === 'browse' && (
            <BrowsePage
              filteredListings={filteredListings}
              favorites={favorites}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              distFilter={distFilter}
              setDistFilter={setDistFilter}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              additionalFilters={additionalFilters}
              toggleAdditionalFilter={toggleAdditionalFilter}
              openStudentListing={openStudentListing}
              openChatWith={openChatWith}
              toggleFavorite={toggleFavorite}
              hasApplied={hasApplied}
              setApplyListing={setApplyListing}
              setPage={setPage}
            />
          )}

          {page === 'listing-detail' && (
            viewListing ? (
              <ListingDetailViewPage
                listing={viewListing}
                onBack={() => setPage('browse')}
                isFavorited={favorites.includes(viewListing.id)}
                onToggleFavorite={() => toggleFavorite(viewListing.id)}
                actions={
                  <>
                    <button
                      onClick={() => { setApplyListing(viewListing); setPage('apply-form') }}
                      disabled={hasApplied(viewListing.id) || viewListing.status === 'occupied'}
                      className={`w-full text-sm font-semibold py-3 rounded-xl transition-colors ${hasApplied(viewListing.id) ? 'bg-emerald-50 text-emerald-700 cursor-default' : viewListing.status === 'occupied' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#1a1a18] text-white hover:bg-[#333]'}`}
                    >
                      {hasApplied(viewListing.id) ? '✓ Already Applied' : viewListing.status === 'occupied' ? 'Unit Occupied' : 'Apply for this Property'}
                    </button>
                    <button onClick={() => openChatWith(viewListing.landlord || 'Landlord')} className="w-full border border-gray-200 text-[#1a1a18] text-sm font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                      💬 Chat with {(viewListing.landlord || 'Landlord').split(' ')[0]}
                    </button>
                    <button onClick={() => setPage('browse')} className="w-full border border-gray-200 text-gray-500 text-sm font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors">Back to Browse</button>
                  </>
                }
              />
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm my-6 max-w-lg mx-auto">
                <div className="text-3xl mb-2">🏠</div>
                <div className="text-base font-semibold text-[#111827]">Property Details</div>
                <div className="text-sm text-gray-500 mt-1 mb-4">Please select a property from browse to view full details.</div>
                <button onClick={() => setPage('browse')} className="bg-[#111827] text-white text-sm font-semibold px-4 py-2 rounded-xl">Browse Listings</button>
              </div>
            )
          )}

          {page === 'apply-form' && applyListing && (
            <ApplyFormPage
              userName={userName}
              applyListing={applyListing}
              appForm={appForm}
              setAppForm={setAppForm}
              submitApplication={handleSubmitApplication}
              onBack={setPage}
            />
          )}

          {page === 'applications' && (
            <ApplicationsPage
              applications={applications}
              listings={allListings}
              statusBadge={statusBadge}
              cancelApplication={cancelApplication}
              onReApply={onReApply}
              onViewListing={openApplicationListing}
              setPage={setPage}
            />
          )}

          {page === 'pay-rent' && (
            <PayRentPage
              payStep={payStep}
              payMethod={payMethod}
              setPayMethod={setPayMethod}
              payForm={payForm}
              setPayForm={setPayForm}
              submitPayment={submitPayment}
              setPage={setPage}
              setPayStep={setPayStep}
              leases={leases}
              rentSummary={rentSummary}
            />
          )}

          {page === 'receipts' && <ReceiptsPage receipts={receipts} leases={leases} userName={userName} setPage={setPage} />}

          {page === 'maintenance' && (
            <MaintenancePage
              myRequests={myRequests}
              showNewReq={showNewReq}
              setShowNewReq={setShowNewReq}
              newReq={newReq}
              setNewReq={setNewReq}
              submitRequest={submitRequest}
              expandedMaintId={expandedMaintId}
              setExpandedMaintId={(id) => {
                setExpandedMaintId(id)
                if (id !== null) loadMaintComments(id)
              }}
              maintChatThreads={maintChatThreads}
              maintChatInput={maintChatInput}
              setMaintChatInput={setMaintChatInput}
              sendMaintChat={sendMaintChat}
              setPage={setPage}
            />
          )}

          {(page === 'reviews' || page === 'review-history') && (
            <ReviewsPage
              page={page}
              reviewHistory={reviewHistory}
              reviewableLandlords={reviewableLandlords}
              reviewTarget={reviewTarget}
              setReviewTarget={setReviewTarget}
              reviewText={reviewText}
              setReviewText={setReviewText}
              questionAnswers={questionAnswers}
              setQuestionAnswers={setQuestionAnswers}
              wouldRecommend={wouldRecommend}
              setWouldRecommend={setWouldRecommend}
              reviewStep={reviewStep}
              setReviewStep={setReviewStep}
              submitReview={submitReview}
              setPage={setPage}
              alreadyReviewed={alreadyReviewed}
            />
          )}

          {page === 'chat' && (
            <ChatPage
              allLandlords={allLandlords}
              activeChatLandlord={activeChatLandlord}
              setActiveChatLandlord={setActiveChatLandlord}
              chatThreads={chatThreads}
              chatInput={chatInput}
              setChatInput={setChatInput}
              sendChat={sendChat}
              openChatWith={openChatWith}
              chatCategoryTab={chatCategoryTab}
              setChatCategoryTab={setChatCategoryTab}
              activeMsgs={activeMsgs}
              activeLandlordListing={activeLandlordListing}
              setViewListing={setViewListing}
              setPage={setPage}
            />
          )}

          {page === 'favorites' && (
            <FavoritesPage
              favorites={favorites}
              listings={listings}
              openStudentListing={openStudentListing}
              toggleFavorite={toggleFavorite}
              setPage={setPage}
            />
          )}

          {page === 'settings' && (
            <SettingsPage
              userName={userName}
              profile={studentProfile}
              onSaveProfile={handleUpdateStudentProfile}
              applications={applications}
              reviewHistory={reviewHistory}
              complaints={complaints}
              showComplaintForm={showComplaintForm}
              setShowComplaintForm={setShowComplaintForm}
              cForm={cForm}
              setCForm={setCForm}
              submitComplaint={submitComplaint}
              setShowDeactivateConfirm={setShowDeactivateConfirm}
            />
          )}
        </div>
      </main>
    </div>
  )
}
