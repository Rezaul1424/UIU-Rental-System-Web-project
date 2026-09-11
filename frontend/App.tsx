import { useEffect, useState } from 'react'
import type { Role, Screen, Modal } from './types'
import LandingPage from './pages/LandingPage'
import GuestBrowse from './pages/GuestBrowse'
import AdminDashboard from './pages/AdminDashboard'
import LandlordDashboard from './pages/LandlordDashboard'
import StudentDashboard from './pages/StudentDashboard'
import AppNav from './components/AppNav'
import AuthModal from './components/AuthModal'
import { clearAuthSession, readStoredAuthSession } from './lib/api'

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [modal, setModal] = useState<Modal>(null)
  const [role, setRole] = useState<Role>('guest')
  const [userName, setUserName] = useState('User')

  useEffect(() => {
    const session = readStoredAuthSession();
    if (!session) return;

    const persistedRole = session.user.role as Role;
    setRole(persistedRole === 'admin' || persistedRole === 'landlord' || persistedRole === 'student' ? persistedRole : 'guest');
    setUserName(session.user.name || 'User');
    setScreen('app');
  }, [])

  const handleAuth = (r: Role, name: string) => {
    setRole(r)
    setUserName(name)
    setModal(null)
    setScreen('app')
  }

  const handleSignOut = () => {
    clearAuthSession();
    setScreen('landing')
    setRole('guest')
    setUserName('User')
  }

  const handleBrowseAsGuest = () => {
    setRole('guest')
    setScreen('app')
  }

  return (
    <>
      {screen === 'landing' && <LandingPage onModal={setModal} onBrowseAsGuest={handleBrowseAsGuest} />}
      {screen === 'app' && role === 'guest' && (
        <div className="min-h-screen bg-gray-50">
          <AppNav role={role} userName={userName} onSignOut={handleSignOut} onModal={setModal} onBackToHome={() => setScreen('landing')} />
          <GuestBrowse onModal={setModal} />
        </div>
      )}
      {screen === 'app' && role === 'admin' && <AdminDashboard userName={userName} onSignOut={handleSignOut} />}
      {screen === 'app' && role === 'landlord' && <LandlordDashboard userName={userName} onSignOut={handleSignOut} />}
      {screen === 'app' && role === 'student' && <StudentDashboard userName={userName} onSignOut={handleSignOut} />}
      {modal && <AuthModal mode={modal} onClose={() => setModal(null)} onAuth={handleAuth} />}
    </>
  )
}
