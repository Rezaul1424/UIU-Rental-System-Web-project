import { useState, useEffect } from 'react'
import type { Modal, Listing } from '../../types'
import { listings, testimonials } from '../../data'
import ListingDetailPage from '../../components/ListingDetail'
import UIULogo from '../../components/UIULogo'

export default function LandingPage({ onModal, onBrowseAsGuest }: { onModal: (m: Modal) => void; onBrowseAsGuest: () => void }) {
  const [landingView, setLandingView] = useState<Listing | null>(null)
  const [location, setLocation] = useState('')
  const [propType, setPropType] = useState('')
  const [budget, setBudget] = useState('')
  const [activeSection, setActiveSection] = useState<'home' | 'listings' | 'how' | 'about'>('home')
  const navItems = [
    { id: 'home', label: 'Home', href: '#home' },
    { id: 'listings', label: 'Properties', href: '#listings' },
    { id: 'how', label: 'How It Works', href: '#how' },
    { id: 'about', label: 'About Us', href: '#about' },
  ]

  useEffect(() => {
    const sections = navItems.map(item => ({
      id: item.id,
      element: item.id === 'home' ? document.documentElement : document.getElementById(item.id),
    }))

    const onScroll = () => {
      const scrollPos = window.scrollY + 120
      let current: 'home' | 'listings' | 'how' | 'about' = 'home'
      for (const section of sections) {
        if (!section.element) continue
        const top = section.element.getBoundingClientRect().top + window.scrollY
        if (top <= scrollPos) {
          current = section.id as 'home' | 'listings' | 'how' | 'about'
        }
      }
      setActiveSection(current)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [navItems])

  const handleNavClick = (id: string, event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    setActiveSection(id as 'home' | 'listings' | 'how' | 'about')
    const target = id === 'home' ? document.documentElement : document.getElementById(id)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (landingView) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2.5">
            <UIULogo size={28} variant="light" />
            <span className="font-bold text-[#1a1a18] text-[15px] tracking-tight">UIU Rental</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onModal('login')} className="text-sm font-medium text-[#1a1a18] px-4 py-2 border border-[#1a1a18] rounded hover:bg-gray-50 transition-colors">Sign In</button>
            <button onClick={() => onModal('signup')} className="text-sm font-semibold text-white bg-[#1a1a18] px-4 py-2 rounded hover:bg-[#333] transition-colors">Sign Up</button>
          </div>
        </nav>
        <ListingDetailPage
          listing={landingView}
          onBack={() => setLandingView(null)}
          backLabel="← Back to Home"
          actions={
            <button onClick={() => onModal('signup')} className="w-full bg-[#1a1a18] text-white text-sm font-semibold py-3 rounded hover:bg-[#333] transition-colors">
              Sign up to apply
            </button>
          }
        />
      </div>
    )
  }

  const featuredListings = listings.filter(l => l.status === 'available').slice(0, 3)

  return (
    <div id="home" className="min-h-screen bg-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Nav ── */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UIULogo size={32} variant="light" />
            <span className="font-bold text-[#1a1a18] text-[17px] tracking-tight">UIU Rental</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#1a1a18]">
            {navItems.map(item => (
              <a
                key={item.id}
                href={item.href}
                onClick={e => handleNavClick(item.id, e)}
                className={`pb-0.5 transition-colors ${activeSection === item.id ? 'border-b-2 border-[#1a1a18]' : 'border-b-2 border-transparent hover:text-[#4b5563]'}`}
              >
                {item.label}
              </a>
            ))}
          </div>
          <button
            onClick={() => onModal('login')}
            className="text-sm font-semibold text-[#1a1a18] px-5 py-2 border-2 border-[#1a1a18] rounded hover:bg-[#1a1a18] hover:text-white transition-colors"
          >
            Find A House
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-[#d8eaf5] overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 flex items-end gap-0 min-h-[500px]">
          {/* Left */}
          <div className="flex-1 pt-14 pb-14 z-10 relative">
            <h1 className="text-[clamp(2.8rem,5.5vw,5.2rem)] font-bold text-[#1a1a18] leading-[1.05] tracking-tight mb-5">
              Find A House<br />
              That Suits You
            </h1>
            <p className="text-[#4a6070] text-base leading-relaxed mb-8 max-w-[280px]">
              Want to find a home near UIU campus? We are ready to help you find one that suits your lifestyle and needs.
            </p>
            <button
              onClick={() => onModal('signup')}
              className="bg-[#1a1a18] text-white font-semibold px-7 py-3.5 rounded text-sm hover:bg-[#333] transition-colors"
            >
              Get Started
            </button>
            <div className="flex items-center gap-10 mt-12 pt-10 border-t border-[#a8c8e0]/60">
              {[['120 +', 'Listed Properties'], ['850 +', 'Happy Students'], ['40 +', 'Verified Landlords']].map(([v, l]) => (
                <div key={l}>
                  <div className="text-2xl font-bold text-[#111827] tracking-tight">{v}</div>
                  <div className="text-xs text-[#4a6070] mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Right building image */}
          <div className="hidden lg:block w-[55%] flex-shrink-0 self-end">
            <img
              src="https://images.unsplash.com/photo-1515263487990-61b07816b324?w=900&h=700&fit=crop&auto=format&crop=bottom"
              alt="Modern apartment building"
              className="w-full h-[490px] object-cover object-bottom"
              style={{ borderTopLeftRadius: '12px' }}
            />
          </div>
        </div>
      </section>

      {/* ── Search bar ── */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-8">
          <div className="bg-white shadow-2xl border border-gray-100 rounded-xl px-7 py-6 -mt-1 relative z-10">
            <div className="text-sm font-semibold text-[#1a1a18] mb-4">Search for available properties</div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded px-4 py-2.5">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 1C5.24 1 3 3.24 3 6c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.75A1.75 1.75 0 1 1 8 4.25a1.75 1.75 0 0 1 0 3.5z" fill="#9ca3af"/></svg>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" className="flex-1 text-sm text-[#1a1a18] outline-none placeholder-gray-400 bg-transparent" />
              </div>
              <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded px-4 py-2.5">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 3h12v2L9 10v4l-2-1V10L2 5V3z" fill="#9ca3af"/></svg>
                <select value={propType} onChange={e => setPropType(e.target.value)} className="flex-1 text-sm text-[#1a1a18] outline-none bg-transparent">
                  <option value="">Property Type</option>
                  <option>Single</option><option>Shared</option><option>Mess</option><option>Sublet</option>
                </select>
              </div>
              <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded px-4 py-2.5">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#9ca3af" strokeWidth="1.5"/><path d="M8 5v3l2 2" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <select value={budget} onChange={e => setBudget(e.target.value)} className="flex-1 text-sm text-[#1a1a18] outline-none bg-transparent">
                  <option value="">Budget</option>
                  <option>Under ৳3,000</option><option>৳3,000 – ৳5,000</option><option>৳5,000 – ৳8,000</option><option>৳8,000+</option>
                </select>
              </div>
              <button
                onClick={onBrowseAsGuest}
                className="bg-[#1a1a18] text-white font-semibold px-7 py-2.5 rounded text-sm whitespace-nowrap hover:bg-[#333] transition-colors"
              >
                Search Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Popular Homes (dark section) ── */}
      <section id="listings" className="bg-[#111111] pt-16 pb-20 mt-8">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-px bg-white/40" />
                <span className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase">Popular</span>
              </div>
              <h2 className="text-[2rem] font-bold text-white tracking-tight">Our Popular Homes</h2>
            </div>
            <button onClick={onBrowseAsGuest} className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors">
              Explore All
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {featuredListings.map((l, i) => {
              const cardImages = [
                'https://images.unsplash.com/photo-1551361415-69c87624334f?w=600&h=380&fit=crop&auto=format',
                'https://images.unsplash.com/photo-1540762693098-50320eb8a752?w=600&h=380&fit=crop&auto=format',
                'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=380&fit=crop&auto=format',
              ]
              return (
                <div
                  key={l.id}
                  className="bg-[#1c1c1c] rounded-xl overflow-hidden cursor-pointer group hover:bg-[#242424] transition-colors"
                  onClick={() => setLandingView(l)}
                >
                  <div className="h-52 overflow-hidden">
                    <img src={cardImages[i] ?? l.image} alt={l.title} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-1.5 mb-3">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1C4.57 1 3 2.57 3 4.5c0 2.81 3.5 7 3.5 7S10 7.31 10 4.5C10 2.57 8.43 1 6.5 1zm0 4.88a1.38 1.38 0 1 1 0-2.76 1.38 1.38 0 0 1 0 2.76z" fill="white" fillOpacity=".6"/></svg>
                      <span className="text-white/60 text-xs font-medium">{l.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-white/35 text-xs mb-4">
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="4" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M1 7h10" stroke="currentColor" strokeWidth="1.2"/><path d="M4 7V4a2 2 0 0 1 4 0v3" stroke="currentColor" strokeWidth="1.2"/></svg>
                        {l.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>
                        {l.distance}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 10V3l4-2 4 2v7" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                        Campus
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={e => { e.stopPropagation(); onModal('signup') }}
                        className="bg-white text-[#1a1a18] text-xs font-bold px-4 py-2 rounded hover:bg-gray-100 transition-colors"
                      >
                        Apply Now
                      </button>
                      <span className="text-white font-bold text-sm">৳{l.price.toLocaleString()}/mo</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-12">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Simple process</div>
            <h2 className="text-3xl font-bold text-[#1a1a18] tracking-tight">How it works</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <div className="text-xs font-bold text-[#1a1a18] uppercase tracking-widest mb-5 border-b border-gray-100 pb-3">For Students</div>
              <div className="space-y-6">
                {[['01','Register with your UIU student ID','Create an account and get verified by admin within 24 hours.'],['02','Browse & filter listings','Search by room type, distance, price, and available facilities.'],['03','Apply online','Submit an application in minutes. No paperwork required.'],['04','Pay & track','Pay rent monthly, download receipts, raise maintenance requests.']].map(([n,t,d]) => (
                  <div key={n} className="flex gap-5">
                    <div className="text-sm font-bold text-gray-200 w-7 flex-shrink-0 mt-0.5">{n}</div>
                    <div><div className="font-semibold text-[#1a1a18] text-sm mb-0.5">{t}</div><div className="text-xs text-gray-400 leading-relaxed">{d}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-[#1a1a18] uppercase tracking-widest mb-5 border-b border-gray-100 pb-3">For Landlords</div>
              <div className="space-y-6">
                {[['01','Register & get verified','Submit your details for admin review. Campus proximity confirmed before approval.'],['02','Add your properties','List rooms with photos, facilities, price, and distance. Go live fast.'],['03','Manage applications','Review and approve tenant applications from your dashboard.'],['04','Track rent & maintenance','Monitor monthly payments and respond to maintenance requests.']].map(([n,t,d]) => (
                  <div key={n} className="flex gap-5">
                    <div className="text-sm font-bold text-gray-200 w-7 flex-shrink-0 mt-0.5">{n}</div>
                    <div><div className="font-semibold text-[#1a1a18] text-sm mb-0.5">{t}</div><div className="text-xs text-gray-400 leading-relaxed">{d}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="bg-[#0d0d0d] py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
            <div className="md:w-52 flex-shrink-0">
              <div className="font-bold text-white text-base">UIU Housing Office</div>
              <div className="text-white/40 text-sm mt-0.5">Official Partner</div>
            </div>
            <div className="flex-1 relative pl-10">
              <span className="absolute left-0 top-0 text-[5rem] leading-none text-white/10 select-none">"</span>
              <p className="text-white/65 text-base leading-relaxed max-w-2xl">
                Our platform is built on trust, transparency, and close relationships between students and verified landlords. We are glad to help every UIU student find a safe, comfortable home near campus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Partner logos ── */}
      <section className="bg-[#0d0d0d] pb-14 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-wrap items-center justify-center gap-14 opacity-25">
            <div className="text-white font-black text-sm tracking-[0.25em] uppercase">UIU</div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      {testimonials.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-10">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">What students say</div>
              <h2 className="text-3xl font-bold text-[#1a1a18] tracking-tight">Student Testimonials</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map(t => (
                <div key={t.name} className="bg-gray-50 rounded-2xl p-6 space-y-4">
                  <p className="text-sm text-gray-600 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                    <div className="w-9 h-9 rounded-full bg-[#111827] text-white flex items-center justify-center font-bold text-sm">{t.avatar}</div>
                    <div>
                      <div className="font-semibold text-[#1a1a18] text-sm">{t.name}</div>
                      <div className="text-xs text-gray-400">{t.dept}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="bg-[#111111] text-white">
        <div className="max-w-7xl mx-auto px-8 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <UIULogo size={26} variant="dark" />
              <span className="font-bold text-white text-sm tracking-tight">UIU Rental</span>
            </div>
            <p className="text-xs text-white/35 leading-relaxed max-w-[180px]">The official housing portal of United International University, Dhaka.</p>
          </div>
          {[
            { head: 'Platform', links: [
              { label: 'Browse Listings', href: '#listings' },
              { label: 'List a Property', href: '#how' },
              { label: 'How It Works', href: '#how' },
            ]},
            { head: 'Account', links: [
              { label: 'Sign In', href: '#signin', action: 'login' },
              { label: 'Create Account', href: '#signup', action: 'signup' },
              { label: 'Student Portal', href: '#signin', action: 'login' },
              { label: 'Landlord Portal', href: '#signin', action: 'login' },
            ]},
            { head: 'Support', links: [
              { label: 'Help Center', href: '#about' },
              { label: 'Contact Admin', href: '#about' },
              { label: 'Report a Listing', href: '#listings' },
              { label: 'Privacy Policy', href: '#about' },
            ]},
          ].map(col => (
            <div key={col.head}>
              <div className="text-xs font-bold text-white uppercase tracking-wider mb-4">{col.head}</div>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l.label}>
                    {'action' in l && l.action
                      ? <button onClick={() => onModal(l.action as 'login' | 'signup')} className="text-xs text-white/35 hover:text-white/70 transition-colors text-left">{l.label}</button>
                      : <a href={l.href} className="text-xs text-white/35 hover:text-white/70 transition-colors">{l.label}</a>
                    }
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 px-8 py-4 max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-xs text-white/25">© 2026 UIU Rental System. All rights reserved.</p>
          <p className="text-xs text-white/25">United International University, Dhaka, Bangladesh</p>
        </div>
      </footer>
    </div>
  )
}
