import { ref, computed } from 'vue'
import { useApi } from './useApi'

export interface UserInfo {
  id: number
  phone: string
  name: string
  avatar: string
  address: string
  role: number
  points: number
  status: number
  created_at?: string
}

export function useAuth() {
  const { api } = useApi()
  const user = ref<UserInfo | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 1)

  const login = async (phone: string, password: string) => {
    const { data } = await api.post('/auth/login', { phone, password })
    token.value = data.token
    localStorage.setItem('token', data.token)
    user.value = data.user
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  }

  const register = async (params: { phone: string; password: string; name: string; address: string }) => {
    const { data } = await api.post('/auth/register', params)
    return data
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const getCurrentUser = async () => {
    try {
      const { data } = await api.get('/auth/profile')
      user.value = data
      localStorage.setItem('user', JSON.stringify(data))
    } catch {
      logout()
    }
  }

  const checkAuth = () => {
    if (token.value && !user.value) {
      const saved = localStorage.getItem('user')
      if (saved) {
        try { user.value = JSON.parse(saved) } catch { /* ignore */ }
      }
      getCurrentUser()
    }
  }

  return { user, token, isLoggedIn, isAdmin, login, register, logout, getCurrentUser, checkAuth }
}
