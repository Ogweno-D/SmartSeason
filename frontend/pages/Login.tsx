import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../src/api/api'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await api.login(form.email, form.password)

      login(response)

      nav('/')
    } catch {
      setError('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (email: string, password: string) =>
    setForm({ email, password })

  return (
    <div className="min-h-screen bg-forest-pale flex items-center justify-center p-4">
      {/* Background texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #1c4a2e 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="w-full max-w-sm relative">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-black/8 border border-gray-100 overflow-hidden">
          {/* Header band */}
          <div className="bg-forest px-8 py-7 text-center">
            <h1 className="text-white font-semibold text-xl tracking-tight"> SmartSeason </h1>
            <p className="text-white/60 text-sm mt-1"> Field Monitoring System </p>
          </div>

          <form onSubmit={submit} className="px-8 py-7 space-y-4">
            <div className="space-y-3">
              <input
                type="email" required placeholder="Email address"
                className="
                  w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                  focus:outline-none focus:ring-2 focus:ring-forest-mid/40
                  placeholder:text-gray-400 transition-shadow
                "
                value={form.email} onChange={set('email')}
              />
              <input
                type="password" required placeholder="Password"
                className="
                  w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                  focus:outline-none focus:ring-2 focus:ring-forest-mid/40
                  placeholder:text-gray-400 transition-shadow
                "
                value={form.password} onChange={set('password')}
              />
            </div>

            {error && (
              <p className="text-risk text-sm bg-risk-light px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              className="
                w-full bg-forest text-white rounded-xl py-3 text-sm font-semibold
                hover:bg-forest-mid active:scale-[0.98]
                transition-all disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 bg-white/70 backdrop-blur rounded-xl border border-gray-100 px-5 py-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Demo accounts</p>
          <div className="space-y-2">
            {[
              { label: 'Admin', email: 'admin@smartseason.com', password: 'admin123' },
              { label: 'Agent', email: 'alice@smartseason.com', password: 'agent123' },
            ].map(d => (
              <button
                key={d.email}
                type="button"
                onClick={() => fillDemo(d.email, d.password)}
                className="
                  w-full text-left px-3 py-2 rounded-lg hover:bg-forest-light
                  transition-colors group
                "
              >
                <span className="text-xs font-semibold text-forest group-hover:underline">{d.label}</span>
                <span className="text-xs text-gray-400 ml-2 font-mono">{d.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}