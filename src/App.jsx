import { useState, useEffect } from 'react'
import { setToken } from './services/api'
import { useIdleTimeout } from './hooks/useIdleTimeout'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import DashboardOficina from './pages/DashboardOficina'
import VistaTecnico from './pages/VistaTecnico'

export default function App() {
  const [view, setView] = useState('landing')
  const [user, setUser] = useState(null)
  const [idleMessage, setIdleMessage] = useState('')
  const [showIdleWarning, setShowIdleWarning] = useState(false)
  const [idleSeconds, setIdleSeconds] = useState(0)

  const logout = (msg) => {
    setToken(null)
    setUser(null)
    setView('landing')
    if (msg) setIdleMessage(msg)
  }

  const { secondsLeft } = useIdleTimeout({
    enabled: !!user,
    onIdle: () => {
      setShowIdleWarning(false)
      logout('Sesión cerrada automáticamente por inactividad')
    },
    onWarning: (show) => setShowIdleWarning(show),
  })

  useEffect(() => {
    setIdleSeconds(secondsLeft)
  }, [secondsLeft])

  if (view === 'landing') return <LandingPage onLogin={() => setView('login')} />
  if (view === 'login') return (
    <>
      {idleMessage && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg">{idleMessage}</div>}
      <Login onBack={() => setView('landing')} onOk={u => { setUser(u); setIdleMessage(''); setView(u.rol === 'tecnico' ? 'tecnico' : 'oficina') }} />
    </>
  )
  return (
    <>
      {showIdleWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg">
          Tu sesión se cerrará en {idleSeconds}s por inactividad. Mueve el mouse o haz clic para continuar.
        </div>
      )}
      {user.rol === 'tecnico'
        ? <VistaTecnico user={user} logout={() => logout()} />
        : <DashboardOficina user={user} logout={() => logout()} />}
    </>
  )
}