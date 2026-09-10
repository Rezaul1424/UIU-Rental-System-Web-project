import { useState } from 'react'
import type { Role, Screen, Modal } from './types'
import LandingPage from './pages/LandingPage'
import GuestBrowse from './pages/GuestBrowse'
import AdminDashboard from './pages/AdminDashboard'
import LandlordDashboard from './pages/LandlordDashboard'
import StudentDashboard from './pages/StudentDashboard'
import AppNav from './components/AppNav'
import AuthModal from './components/AuthModal'

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [modal, setModal] = useState<Modal>(null)
  const [role, setRole] = useState<Role>('student')
  const [userName, setUserName] = useState('User')

  const handleAuth = (r: Role, name: string) => {
    setRole(r)
    setUserName(name)
    setModal(null)
    setScreen('app')
  }

  const handleSignOut = () => {
    setScreen('landing')
    setRole('student')
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
