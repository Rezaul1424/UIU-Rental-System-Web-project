import { useState } from 'react'
import type { Listing } from '../../types'
import { listings } from '../../data'
import { Badge } from '../../components/ui'
import NotificationBell from '../../components/NotificationBell'
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
  type Application = { listingId: number; status: AppStatus; date: string }
  type Review = { id: number; landlord: string; property: string; listingId: number; landlordStars: number; propStars: number; text: string; date: string }
  type ChatMsg = { from: 'student' | 'landlord'; text: string }

  const [page, setPage] = useState<StudentPage>('overview')
  const [applyListing, setApplyListing] = useState<Listing | null>(null)
  const [viewListing, setViewListing] = useState<Listing | null>(null)
  const openStudentListing = (l: Listing) => { setViewListing(l); setPage('listing-detail') }

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
  const toggleFavorite = (id: number) => setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id])

  const filteredListings = listings.filter(l => {
    if (typeFilter !== 'all' && l.type !== typeFilter) return false
    if (distFilter !== 'all' && parseFloat(l.distance) > parseFloat(distFilter)) return false
    if (l.price > maxPrice) return false
    if (additionalFilters.includes('AC') && !l.facilities.includes('AC')) return false
    if (additionalFilters.includes('WiFi') && !l.facilities.includes('WiFi')) return false
    if (additionalFilters.includes('Parking') && !l.facilities.includes('Parking')) return false
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
  const hasApplied = (id: number) => applications.some(a => a.listingId === id && a.status !== 'cancelled')
  const cancelApplication = (listingId: number) =>
    setApplications(prev => prev.map(a => a.listingId === listingId ? { ...a, status: 'cancelled' } : a))

  const [appForm, setAppForm] = useState({ studentId: '', phone: '', moveIn: '', message: '', employment: 'Student' })
  const submitApplication = () => {
    if (!applyListing) return
    setApplications(prev => [...prev, { listingId: applyListing.id, status: 'under-review', date: '31 Jul 2026' }])
    setPage('applications')
    setApplyListing(null)
    setAppForm({ studentId: '', phone: '', moveIn: '', message: '', employment: 'Student' })
  }

  // ── Maintenance ─────────────────────────────────────────────────────────────
  const [myRequests, setMyRequests] = useState([
    { id: 1, issue: 'AC not cooling properly', status: 'in-progress', date: '25 Jul 2026' },
    { id: 2, issue: 'Water tap leaking', status: 'resolved', date: '10 Jul 2026' },
  ])
  const [showNewReq, setShowNewReq] = useState(false)
  const [newReq, setNewReq] = useState({ issue: '', description: '', priority: 'Medium' })
  const submitRequest = () => {
    if (!newReq.issue.trim()) return
    setMyRequests(r => [...r, { id: Date.now(), issue: newReq.issue, status: 'open', date: '31 Jul 2026' }])
    setNewReq({ issue: '', description: '', priority: 'Medium' })
    setShowNewReq(false)
  }

  // ── Pay rent ─────────────────────────────────────────────────────────────────
  const [payStep, setPayStep] = useState<'form' | 'success'>('form')
  const [payForm, setPayForm] = useState({ card: '', expiry: '', cvv: '', name: '' })
  const submitPayment = () => setPayStep('success')

  // ── Reviews ──────────────────────────────────────────────────────────────────
  // Landlords the student can review: current + any previously applied
  const reviewableLandlords = [
    { landlord: 'Rahman Faruk', property: 'Studio near Gate 3', listingId: 1 },
    { landlord: 'Nusrat Jahan', property: 'Shared Mess – South Campus', listingId: 2 },
  ]
  const [reviewTarget, setReviewTarget] = useState(reviewableLandlords[0])
  const [landlordStars, setLandlordStars] = useState(0)
  const [propStars, setPropStars] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewHistory, setReviewHistory] = useState<Review[]>([
    { id: 1, landlord: 'Nusrat Jahan', property: 'Shared Mess – South Campus', listingId: 2, landlordStars: 4, propStars: 3, text: 'Good facilities overall, but the common area could be cleaner. Landlord is responsive and polite.', date: '15 Jun 2026' },
  ])
  const submitReview = () => {
    if (landlordStars === 0 || propStars === 0) return
    setReviewHistory(h => [...h, {
      id: Date.now(),
      landlord: reviewTarget.landlord,
      property: reviewTarget.property,
      listingId: reviewTarget.listingId,
      landlordStars,
      propStars,
      text: reviewText,
      date: '31 Jul 2026',
    }])
    setLandlordStars(0)
    setPropStars(0)
    setReviewText('')
    setPage('review-history')
  }
  const alreadyReviewed = (listingId: number) => reviewHistory.some(r => r.listingId === listingId)

  // ── Chat ─────────────────────────────────────────────────────────────────────
  // All landlords from listings are available to chat with
  const allLandlords = Array.from(new Map(listings.map(l => [l.landlord, l])).values())
  const [activeChatLandlord, setActiveChatLandlord] = useState<string>(allLandlords[0].landlord)
  const [chatThreads, setChatThreads] = useState<Record<string, ChatMsg[]>>({
    'Rahman Faruk': [
      { from: 'landlord', text: 'Hello! How can I help you today?' },
      { from: 'student', text: 'I wanted to ask about the parking availability.' },
      { from: 'landlord', text: 'Yes, we have one parking spot included with your unit.' },
    ],
  })
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
  const submitComplaint = () => {
    if (!cForm.subject.trim() || !cForm.against.trim()) return
    setComplaints(prev => [...prev, {
      id: `CMP-${String(prev.length + 1).padStart(3, '0')}`,
      against: cForm.against,
      property: cForm.property,
      category: cForm.category,
      subject: cForm.subject,
      description: cForm.description,
      date: '31 Jul 2026',
      status: 'Submitted',
    }])
    setCForm({ against: '', property: '', category: 'Maintenance Neglect', subject: '', description: '' })
    setShowComplaintForm(false)
  }
  // Maintenance chat (per request)
  const [maintChatThreads, setMaintChatThreads] = useState<Record<number, {from:'student'|'landlord';text:string}[]>>({
    1: [{ from: 'landlord', text: 'We have assigned a technician. They will visit on Friday.' }, { from: 'student', text: 'Thank you, I\'ll be available from 2pm.' }],
    2: [{ from: 'landlord', text: 'Issue resolved. AC serviced and refilled.' }],
  })
  const [maintChatInput, setMaintChatInput] = useState<Record<number,string>>({})
  const sendMaintChat = (reqId: number) => {
    const text = (maintChatInput[reqId] ?? '').trim()
    if (!text) return
    setMaintChatThreads(t => ({ ...t, [reqId]: [...(t[reqId]??[]), { from: 'student', text }] }))
    setMaintChatInput(c => ({ ...c, [reqId]: '' }))
    setTimeout(() => {
      setMaintChatThreads(t => ({ ...t, [reqId]: [...(t[reqId]??[]), { from: 'landlord', text: "Got it, I'll look into this right away." }] }))
    }, 900)
  }

  // ── Nav ──────────────────────────────────────────────────────────────────────
  const receipts = [
    { month: 'Jul 2026', amount: 4200, paid: false },
    { month: 'Jun 2026', amount: 4200, paid: true },
    { month: 'May 2026', amount: 4200, paid: true },
    { month: 'Apr 2026', amount: 4200, paid: true },
  ]

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
        userName={userName}
        onSignOut={() => setShowSignOutConfirm(true)}
      />

      <main className="flex-1 overflow-auto bg-[#f8fafc]">
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

          {page === 'listing-detail' && viewListing && (
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
                  <button onClick={() => openChatWith(viewListing.landlord)} className="w-full border border-gray-200 text-[#1a1a18] text-sm font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    💬 Chat with {viewListing.landlord.split(' ')[0]}
                  </button>
                  <button onClick={() => setPage('browse')} className="w-full border border-gray-200 text-gray-500 text-sm font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors">Back to Browse</button>
                </>
              }
            />
          )}

          {page === 'apply-form' && applyListing && (
            <ApplyFormPage
              userName={userName}
              applyListing={applyListing}
              appForm={appForm}
              setAppForm={setAppForm}
              submitApplication={submitApplication}
              onBack={setPage}
            />
          )}

          {page === 'applications' && (
            <ApplicationsPage
              applications={applications}
              listings={listings}
              statusBadge={statusBadge}
              cancelApplication={cancelApplication}
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
            />
          )}

          {page === 'receipts' && <ReceiptsPage receipts={receipts} userName={userName} setPage={setPage} />}

          {page === 'maintenance' && (
            <MaintenancePage
              myRequests={myRequests}
              showNewReq={showNewReq}
              setShowNewReq={setShowNewReq}
              newReq={newReq}
              setNewReq={setNewReq}
              submitRequest={submitRequest}
              expandedMaintId={expandedMaintId}
              setExpandedMaintId={setExpandedMaintId}
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
