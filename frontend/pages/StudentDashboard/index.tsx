import { useEffect, useMemo, useState } from 'react'
import type { Listing } from '../../types'
import { listings } from '../../data'
import { Badge } from '../../components/ui'
import NotificationBell from '../../components/NotificationBell'
import { addFavorite, addMaintenanceComment, cancelApplication as cancelStudentApplication, fetchPublicListings, getApplications, getFavorites, getLeases, getMaintenanceComments, getMaintenanceRequests, getProfile, getReceipts, getRentSummary, getStudentChat, getStudentComplaints, getStudentNotifications, getStudentReviews, markStudentNotificationsRead, payRent, removeFavorite, sendStudentChat, submitApplication as submitStudentApplication, submitMaintenanceRequest, submitStudentComplaint, submitStudentReview, updateProfile as updateStudentProfile, type StudentApplication } from '../../lib/studentApi'
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
  type Review = { id: number; landlord: string; property: string; listingId: string; landlordStars: number; propStars: number; text: string; date: string }
  type ChatMsg = { from: 'student' | 'landlord'; text: string }

  const [studentNotifications, setStudentNotifications] = useState<Array<{ id: number; text: string; sub?: string; time: string; read: boolean }>>([])

  const notificationAge = (value: string) => {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000))
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hr ago`
    return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) === 1 ? '' : 's'} ago`
  }

  const mapStudentNotification = (notification: { id: number; title: string; message: string; isRead: boolean; createdAt: string }) => ({
    id: notification.id,
    text: notification.title,
    sub: notification.message,
    time: notificationAge(notification.createdAt),
    read: notification.isRead,
  })

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

    const loadStudentNotifications = async () => {
      try {
        const notifications = await getStudentNotifications()
        if (active) {
          setStudentNotifications(notifications.map(mapStudentNotification))
        }
      } catch (error) {
        if (active) {
          setDashboardError(error instanceof Error ? error.message : 'Could not load notifications.')
        }
      }
    }

    loadStudentNotifications()

    return () => { active = false }
  }, [])

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
          getStudentComplaints().catch((error: unknown) => {
            if (active) setDashboardError(error instanceof Error ? error.message : 'Could not load complaints.')
            return []
          }),
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
          stage: request.stage,
          date: request.createdAt ? new Date(request.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
        })) : [])
        if (Array.isArray(reviewsResult)) {
          setReviewHistory(reviewsResult.map((r: any) => ({
            id: Number(r.id ?? Date.now()),
            landlord: r.landlord || r.landlordName || 'Landlord',
            property: r.property || r.propertyTitle || 'Property',
            listingId: String(r.propertyId ?? r.listingId ?? ''),
            landlordStars: Number(r.landlordStars ?? 0),
            propStars: Number(r.propStars ?? r.propertyStars ?? 0),
            text: r.text || r.comment || '',
            date: r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''),
          })))
        }
        if (Array.isArray(complaintsResult)) {
          setComplaints(complaintsResult.map((c: { id?: string; against?: string; accusedName?: string; property?: string; propertyTitle?: string; category?: string; description?: string; createdAt?: string; date?: string; status?: string }) => ({
            id: c.id ?? `CMP-${Date.now()}`,
            against: c.against ?? c.accusedName ?? '',
            property: c.property ?? c.propertyTitle ?? '',
            category: c.category ?? 'Other',
            subject: c.description?.split(' — ')[0] ?? '',
            description: c.description?.split(' — ').slice(1).join(' — ') ?? c.description ?? '',
            date: c.date ?? (c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''),
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

  const markStudentNotificationRead = async (id: number) => {
    setStudentNotifications(items => items.map(item => item.id === id ? { ...item, read: true } : item))
    try {
      await markStudentNotificationsRead(id)
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Could not mark notification as read.')
    }
  }

  const markAllStudentNotificationsRead = async () => {
    setStudentNotifications(items => items.map(item => ({ ...item, read: true })))
    try {
      await markStudentNotificationsRead()
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Could not mark notifications as read.')
    }
  }

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
  const toggleFavorite = async (id: number, propertyId?: string) => {
    const isFavorite = favorites.includes(id)
    const nextFavorites = isFavorite ? favorites.filter(f => f !== id) : [...favorites, id]
    setFavorites(nextFavorites)

    try {
      if (isFavorite) {
        await removeFavorite(propertyId || String(id))
      } else {
        await addFavorite(propertyId || String(id))
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

  useEffect(() => {
    let active = true
    const refreshApplications = async () => {
      if (document.visibilityState !== 'visible') return
      const refreshed = await getApplications().catch(() => null)
      if (active && refreshed) setApplications(refreshed)
    }

    let refreshTimer: ReturnType<typeof setInterval> | undefined
    if (page === 'browse') {
      void refreshApplications()
      refreshTimer = setInterval(() => { void refreshApplications() }, 10000)
    }
    window.addEventListener('focus', refreshApplications)
    document.addEventListener('visibilitychange', refreshApplications)
    return () => {
      active = false
      if (refreshTimer) clearInterval(refreshTimer)
      window.removeEventListener('focus', refreshApplications)
      document.removeEventListener('visibilitychange', refreshApplications)
    }
  }, [page])

  const hasApplied = (id: number) => applications.some(a => a.listingId === id && a.status === 'under-review')
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
  // Reviews are available for landlords tied to the student's active leases.
  const reviewableLandlords = useMemo(() => {
    const activeLeases = leases.filter((lease) => lease.status === 'active' && lease.landlordId && lease.propertyId)
    const byProperty = new Map(activeLeases.map((lease) => [lease.propertyCode || lease.propertyId, {
      landlord: lease.landlordName || 'Landlord',
      property: lease.propertyTitle || lease.propertyCode || `Property ${lease.propertyId}`,
      listingId: lease.propertyCode || lease.propertyId,
    }]))
    return [...byProperty.values()]
  }, [leases])

  const [reviewTarget, setReviewTarget] = useState(() => reviewableLandlords[0] ?? { landlord: '', property: '', listingId: '' })
  useEffect(() => {
    const currentTarget = reviewableLandlords.find((entry) => entry.listingId === reviewTarget.listingId)
    const nextTarget = currentTarget ?? reviewableLandlords[0] ?? { landlord: '', property: '', listingId: '' }
    if (nextTarget.landlord !== reviewTarget.landlord || nextTarget.property !== reviewTarget.property || nextTarget.listingId !== reviewTarget.listingId) {
      setReviewTarget(nextTarget)
    }
  }, [reviewTarget, reviewableLandlords])

  const [reviewText, setReviewText] = useState('')
  const [reviewHistory, setReviewHistory] = useState<Review[]>([])
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const submitReview = async () => {
    const calculatedLandlordStars = Math.round((questionAnswers[0] + questionAnswers[1]) / 2)
    const calculatedPropStars = Math.round((questionAnswers[2] + questionAnswers[3]) / 2)
    const comment = reviewText.trim()
    if (!reviewTarget.listingId || !comment || reviewSubmitting) return

    setReviewSubmitting(true)
    setReviewError('')
    try {
      const saved = await submitStudentReview({
        propertyId: String(reviewTarget.listingId),
        landlordStars: calculatedLandlordStars,
        propertyStars: calculatedPropStars,
        comment,
      })
      const savedReview = saved as any
      setReviewHistory(history => [{
        id: Number(savedReview.id ?? Date.now()),
        landlord: savedReview.landlord || reviewTarget.landlord,
        property: savedReview.property || reviewTarget.property,
        listingId: String(savedReview.propertyId ?? reviewTarget.listingId),
        landlordStars: Number(savedReview.landlordStars ?? calculatedLandlordStars),
        propStars: Number(savedReview.propStars ?? savedReview.propertyStars ?? calculatedPropStars),
        text: savedReview.text ?? savedReview.comment ?? comment,
        date: savedReview.date || (savedReview.createdAt ? new Date(savedReview.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })),
      }, ...history])
      setQuestionAnswers([0, 0, 0, 0, 0])
      setWouldRecommend('')
      setReviewText('')
      setReviewStep(7)
    } catch (err) {
      console.error('Failed to submit review to backend:', err)
      setReviewError(err instanceof Error ? err.message : 'Unable to save your review. Please try again.')
    } finally {
      setReviewSubmitting(false)
    }
  }
  const alreadyReviewed = (listingId: string) => Boolean(listingId) && reviewHistory.some(r => r.listingId === listingId)

  // ── Chat ─────────────────────────────────────────────────────────────────────
  // All landlords from listings are available to chat with
  const allLandlords = useMemo(
    () => Array.from(new Map(allListings.map((listing) => [listing.landlord, listing])).values()),
    [allListings],
  )

  const [activeChatLandlord, setActiveChatLandlord] = useState<string>(allLandlords[0]?.landlord ?? 'Rahman Faruk')
  const [chatThreads, setChatThreads] = useState<Record<string, ChatMsg[]>>({})

  useEffect(() => {
    if (!allLandlords.some((listing) => listing.landlord === activeChatLandlord) && allLandlords[0]) {
      setActiveChatLandlord(allLandlords[0].landlord)
    }
  }, [activeChatLandlord, allLandlords])
  const [chatInput, setChatInput] = useState('')

  useEffect(() => {
    if (page !== 'chat') return
    let active = true
    const loadChat = async () => {
      try {
        const conversations = await getStudentChat()
        if (!active) return
        const threads: Record<string, ChatMsg[]> = {}
        for (const conversation of [...conversations].reverse()) {
          threads[conversation.landlordName] = [
            ...(threads[conversation.landlordName] ?? []),
            ...conversation.messages.map(({ from, text }) => ({ from, text })),
          ]
        }
        setChatThreads(threads)
      } catch (error) {
        if (active) setDashboardError(error instanceof Error ? error.message : 'Unable to load chat messages.')
      }
    }
    void loadChat()
    const timer = window.setInterval(() => { void loadChat() }, 3000)
    return () => { active = false; window.clearInterval(timer) }
  }, [page])

  const openChatWith = (landlordName: string) => {
    setActiveChatLandlord(landlordName)
    setPage('chat')
  }

  const sendChat = async () => {
    const message = chatInput.trim()
    const propertyId = allLandlords.find((listing) => listing.landlord === activeChatLandlord)?.propertyId
    if (!message) return
    if (!propertyId) {
      setDashboardError('Select a landlord with a linked property before sending a message.')
      return
    }
    try {
      const conversation = await sendStudentChat(propertyId, message)
      setChatThreads((threads) => ({
        ...threads,
        [conversation.landlordName]: conversation.messages.map(({ from, text }) => ({ from, text })),
      }))
      setChatInput('')
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Unable to send your message.')
    }
  }

  const activeMsgs = chatThreads[activeChatLandlord] ?? []
  const activeLandlordListing = allLandlords.find(l => l.landlord === activeChatLandlord)

  // ── Additional UI state ──────────────────────────────────────────────────────
  const [payMethod, setPayMethod] = useState<'card'|'mobile'|'bank'>('card')
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
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [showComplaintForm, setShowComplaintForm] = useState(false)
  const [cForm, setCForm] = useState({ against: '', property: '', category: 'Maintenance Neglect', subject: '', description: '' })
  const complaintTargets = useMemo(() => {
    const seen = new Set<string>()

    return leases
      .filter((lease) => lease.landlordName && (lease.propertyTitle || lease.propertyCode))
      .filter((lease) => ['active', 'ended', 'terminated'].includes(String(lease.status ?? '').toLowerCase()))
      .map((lease) => {
        const landlordName = lease.landlordName?.trim() ?? ''
        const propertyTitle = lease.propertyTitle?.trim() || lease.propertyCode?.trim() || 'Property'
        const key = `${landlordName}::${propertyTitle}`

        if (!landlordName || seen.has(key)) return null
        seen.add(key)

        return { landlordName, propertyTitle }
      })
      .filter((target): target is { landlordName: string; propertyTitle: string } => Boolean(target))
  }, [leases])

  const complaintPropertyOptions = useMemo(() => {
    if (!cForm.against) return complaintTargets.map((target) => target.propertyTitle)
    return complaintTargets
      .filter((target) => target.landlordName === cForm.against)
      .map((target) => target.propertyTitle)
  }, [complaintTargets, cForm.against])

  const submitComplaint = async () => {
    if (!cForm.subject.trim() || !cForm.against.trim() || !cForm.property.trim()) return
    setDashboardError('')
    try {
      const created = await submitStudentComplaint({
        against: cForm.against,
        property: cForm.property,
        category: cForm.category,
        subject: cForm.subject,
        description: cForm.description,
      })
      setComplaints(prev => [{
        id: String(created?.id ?? `CMP-${Date.now()}`),
        against: cForm.against,
        property: cForm.property,
        category: cForm.category,
        subject: cForm.subject,
        description: cForm.description,
        date: created?.date ?? new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: 'Submitted',
      }, ...prev])
      setCForm({ against: '', property: '', category: 'Maintenance Neglect', subject: '', description: '' })
      setShowComplaintForm(false)
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Could not submit complaint.')
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
          <NotificationBell
            notifications={studentNotifications}
            onMarkRead={markStudentNotificationRead}
            onMarkAllRead={markAllStudentNotificationsRead}
          />
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
                onToggleFavorite={() => toggleFavorite(viewListing.id, String(viewListing.propertyId || viewListing.id))}
                currentTenants={leases
                  .filter((lease) => lease.status === 'active' && (
                    lease.propertyId === String(viewListing.propertyId || viewListing.id) ||
                    lease.propertyCode === String(viewListing.propertyId || viewListing.id) ||
                    lease.propertyTitle === viewListing.title
                  ))
                  .map((lease) => ({
                    name: lease.landlordName ? `Landlord: ${lease.landlordName}` : 'Current tenant',
                    studentId: lease.id,
                  }))}
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
              reviewSubmitting={reviewSubmitting}
              reviewError={reviewError}
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
              activeMsgs={activeMsgs}
              activeLandlordListing={activeLandlordListing}
              setViewListing={setViewListing}
              setPage={setPage}
            />
          )}

          {page === 'favorites' && (
            <FavoritesPage
              favorites={favorites}
              listings={allListings}
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
              complaintTargets={complaintTargets}
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
