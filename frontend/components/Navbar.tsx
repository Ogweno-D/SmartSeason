import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export function Navbar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  const handleLogout = () => {
    logout()
    nav('/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <button
          onClick={() => nav('/')}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          {/* Logo */}
          <span className="text-lg">
          </span>
          <span className="font-semibold text-forest tracking-tight">SmartSeason</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-gray-900 leading-none">{user?.name}</span>
            <span className="text-xs text-gray-400 capitalize mt-0.5">{user?.role}</span>
          </div>
          <button
            onClick={handleLogout}
            className="
              text-xs font-medium text-gray-500 px-3 py-1.5 rounded-lg
              hover:bg-red-50 hover:text-red-600 transition-colors
            "
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}