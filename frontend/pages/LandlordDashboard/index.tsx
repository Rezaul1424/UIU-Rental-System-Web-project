import { useState } from 'react'
import type { Listing } from '../../types'
import { listings, rentTransactions } from '../../data'
import ListingDetailPage from '../../components/ListingDetail'
import NotificationBell from '../../components/NotificationBell'
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
  const openLandlordListing = (l: Listing) => { setLandlordView(l); setPage('listing-detail') }
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
  const [requests, setRequests] = useState<RequestItem[]>([
    { id: 1, student: 'Rifat Hassan', studentId: '2024-EEE-059', dept: 'B.Sc. EEE, Batch 2024', phone: '+880 1712-345678', moveIn: '1 Sep 2026', employment: 'Student (Family Support)', message: "I'm a first-year student looking for a quiet place close to campus. I am well-mannered and responsible.", listing: 'Studio near Gate 3', date: '29 Jul 2026', status: 'pending' },
    { id: 2, student: 'Alif Hossain', studentId: '2023-BBA-201', dept: 'BBA, Batch 2023', phone: '+880 1898-765432', moveIn: '15 Aug 2026', employment: 'Student (Part-time Job)', message: 'Looking for a bachelor flat to share with one friend. We are both UIU students and can provide references.', listing: 'Bachelor Flat – North Side', date: '27 Jul 2026', status: 'pending' },
    { id: 3, student: 'Tanvir Ahmed', studentId: '2023-CSE-104', dept: 'B.Sc. CSE, Batch 2023', phone: '+880 1755-112233', moveIn: '1 Jul 2026', employment: 'Student (Scholarship)', message: 'I have been looking for a unit near Gate 3 for easy access to the CS department. References available.', listing: 'Studio near Gate 3', date: '1 Jul 2026', status: 'approved' },
  ])
  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(null)
  const pendingRequests = requests.filter(r => r.status === 'pending').length
  const approveRequest = (id: number) => setRequests(rs => rs.map(r => r.id === id ? { ...r, status: 'approved' } : r))
  const rejectRequest  = (id: number) => setRequests(rs => rs.map(r => r.id === id ? { ...r, status: 'rejected' } : r))

  // ── Maintenance ──────────────────────────────────────────────────────────────
  const [mReqs, setMReqs] = useState<MaintReq[]>([
    {
      id: 1, title: 'AC not cooling properly', description: 'The air conditioner in the bedroom has stopped cooling. Fan runs but no cold air. Already checked power supply.',
      listing: 'Studio near Gate 3', tenant: 'Tanvir Ahmed', date: '25 Jul 2026', priority: 'High', stage: 2,
      estimatedDate: '3 Aug 2026',
      comments: [
        { from: 'tenant', text: 'The AC has been making noise too. Please fix ASAP, it is very hot.', date: '25 Jul' },
        { from: 'landlord', text: "I've approved the request. A technician will be assigned this week.", date: '26 Jul' },
      ],
      hasPhotos: true,
    },
    {
      id: 2, title: 'Leaking pipe in bathroom', description: 'Water dripping from under the sink pipe joint. Placed a bucket but it fills up every 2–3 hours.',
      listing: 'Shared Mess – South Campus', tenant: 'Sadia Islam', date: '22 Jul 2026', priority: 'Medium', stage: 4,
      estimatedDate: '31 Jul 2026',
      comments: [
        { from: 'tenant', text: 'This has been going on for a week. The floor tiles are getting damaged.', date: '22 Jul' },
        { from: 'landlord', text: 'Technician Karim is assigned. He will visit tomorrow between 10am and 12pm.', date: '23 Jul' },
        { from: 'tenant', text: 'Karim arrived and did a temporary fix. Awaiting permanent repair.', date: '24 Jul' },
      ],
      hasPhotos: true,
    },
    {
      id: 3, title: 'Door lock broken', description: 'The main door lock cylinder is jammed and the key no longer turns smoothly. Door can be opened but only with difficulty.',
      listing: 'Bachelor Flat – North Side', tenant: 'Rifat Hassan', date: '20 Jul 2026', priority: 'Urgent', stage: 5,
      estimatedDate: '22 Jul 2026',
      comments: [
        { from: 'tenant', text: 'This is a security issue. Please prioritize.', date: '20 Jul' },
        { from: 'landlord', text: 'Understood. Emergency lock replacement ordered.', date: '20 Jul' },
        { from: 'landlord', text: 'Replacement complete. New keys handed to tenant.', date: '22 Jul' },
      ],
      hasPhotos: false,
    },
  ])
  const [expandedMaintId, setExpandedMaintId] = useState<number | null>(null)
  const [newComment, setNewComment] = useState<Record<number, string>>({})

  const advanceStage = (id: number) =>
    setMReqs(ms => ms.map(m => m.id === id && m.stage < 6 ? { ...m, stage: (m.stage + 1) as MaintStage } : m))
  const revertStage = (id: number) =>
    setMReqs(ms => ms.map(m => m.id === id && m.stage > 0 ? { ...m, stage: (m.stage - 1) as MaintStage } : m))

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
  const currentTenants = [
    { name: 'Tanvir Ahmed', listing: 'Studio near Gate 3', category: 'current' as const },
    { name: 'Sadia Islam',  listing: 'Shared Mess – South Campus', category: 'current' as const },
  ]
  const potentialTenants = [
    { name: 'Rifat Hassan', listing: 'Studio near Gate 3', category: 'potential' as const },
    { name: 'Alif Hossain', listing: 'Bachelor Flat – North Side', category: 'potential' as const },
  ]

  const [activeChatName, setActiveChatName] = useState('Tanvir Ahmed')
  const [chatThreads, setChatThreads] = useState<Record<string, ChatMsg[]>>({
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
  })
  const [chatInput, setChatInput] = useState('')

  const sendChat = () => {
    if (!chatInput.trim()) return
    setChatThreads(t => ({ ...t, [activeChatName]: [...(t[activeChatName] ?? []), { from: 'landlord', text: chatInput }] }))
    setChatInput('')
  }

  const myListings = listings.slice(0, 3)

  // ── Confirmation overlay state ───────────────────────────────────────────────
  const [showLandlordSignOutConfirm, setShowLandlordSignOutConfirm] = useState(false)
  const [showLandlordDeactivateConfirm, setShowLandlordDeactivateConfirm] = useState(false)
  const [landlordDeactivateInput, setLandlordDeactivateInput] = useState('')
  const [showRemoveListingConfirm, setShowRemoveListingConfirm] = useState(false)
  const [showDiscardEditConfirm, setShowDiscardEditConfirm] = useState(false)
  const [showDiscardAddConfirm, setShowDiscardAddConfirm] = useState(false)

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
        userName={userName}
        onSignOut={() => setShowLandlordSignOutConfirm(true)}
      />

      {/* Main */}
      <main className="flex-1 overflow-auto bg-[#f8fafc]">
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
                <button onClick={() => { setShowRemoveListingConfirm(false); setPage('listings') }} className="flex-1 bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-red-700 transition-colors">Remove Listing</button>
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
            <RentPage rentTransactions={rentTransactions} />
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
