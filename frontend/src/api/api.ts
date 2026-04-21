import axios,{ AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import type { Field, Agent, AuthResponse } from '../types'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

/* ---------------- TOKEN ATTACH ---------------- */
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('ss_token')

  if (token) {
    if (!config.headers) {
      config.headers = new AxiosHeaders()
    }

    ;(config.headers as AxiosHeaders).set(
      'Authorization',
      `Bearer ${token}`
    )
  }

  return config
})

/* ---------------- AUTO REFRESH ---------------- */
http.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      const refreshToken = localStorage.getItem('ss_refresh')

      if (!refreshToken) return Promise.reject(error)

      try {
        const res = await http.post('/auth/refresh', {
          token: refreshToken
        })

        const newAccessToken = res.data.accessToken
        const newRefreshToken = res.data.refreshToken

        localStorage.setItem('ss_token', newAccessToken)
        if (newRefreshToken) {
          localStorage.setItem('ss_refresh', newRefreshToken)
        }

        original.headers.Authorization = `Bearer ${newAccessToken}`

        return http(original)
      } catch (err) {
        localStorage.clear()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

/* ---------------- HELPER ---------------- */
const unwrap = <T>(p: Promise<{ data: T }>) =>
  p.then(res => res.data)

/* ---------------- API ---------------- */
export const api = {
  login: (email: string, password: string) =>
    unwrap(http.post<AuthResponse>('/auth/login', { email, password })),

  fields: {
    list: () => unwrap(http.get<Field[]>('/fields')),

    get: (id: number) =>
      unwrap(http.get<Field>(`/fields/${id}`)),

    create: (body: {
      name: string
      crop_type: string
      planting_date: string
      assigned_agent_id?: number | null
    }) =>
      unwrap(http.post<{ id: number }>('/fields', body)),

    delete: (id: number) =>
      unwrap(http.delete(`/fields/${id}`)),

    updateStage: (id: number, stage: string) =>
      unwrap(http.patch(`/fields/${id}/stage`, { stage })),

    addObservation: (id: number, note: string) =>
      unwrap(http.post(`/fields/${id}/observations`, { note }))
  },

  agents: {
    list: () =>
      unwrap(http.get<Agent[]>('/fields/agents'))
  }
}