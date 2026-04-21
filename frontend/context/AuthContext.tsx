import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode
  } from 'react'
  import type { User, AuthResponse } from '../src/types'
  
  interface AuthCtx {
    user: User | null
    token: string | null
    login: (data: AuthResponse) => void
    logout: () => void
  }
  
  const Ctx = createContext<AuthCtx | null>(null)
  
  export const useAuth = () => {
    const ctx = useContext(Ctx)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
  }
  
  export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
  
    // 🔁 Restore session on reload
    useEffect(() => {
      const storedUser = localStorage.getItem('ss_user')
      const storedToken = localStorage.getItem('ss_token')
  
      if (storedUser) setUser(JSON.parse(storedUser))
      if (storedToken) setToken(storedToken)
    }, [])
  
    // LOGIN (stores access + refresh)
    const login = (data: AuthResponse) => {
      localStorage.setItem('ss_token', data.accessToken)
      localStorage.setItem('ss_refresh', data.refreshToken)
      localStorage.setItem('ss_user', JSON.stringify(data.user))
  
      setToken(data.accessToken)
      setUser(data.user)
    }
  
    // LOGOUT (clean + backend revoke)
    const logout = async () => {
      const refresh = localStorage.getItem('ss_refresh')
  
      try {
        if (refresh) {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: refresh })
          })
        }
      } catch { 
        // 
      }
  
      localStorage.removeItem('ss_token')
      localStorage.removeItem('ss_refresh')
      localStorage.removeItem('ss_user')
  
      setToken(null)
      setUser(null)
    }
  
    return (
      <Ctx.Provider value={{ user, token, login, logout }}>
        {children}
      </Ctx.Provider>
    )
  }