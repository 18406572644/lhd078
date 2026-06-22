import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/composables/useAuth'
import { useApi } from '@/composables/useApi'

export const useUserStore = defineStore('user', () => {
  const { api } = useApi()

  const user = ref<UserInfo | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 1)

  const login = async (phone: string, password: string) => {
    const { data } = await api.post('/auth/login', { phone, password })
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
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

  const getProfile = async () => {
    try {
      const { data } = await api.get('/auth/profile')
      user.value = data
      localStorage.setItem('user', JSON.stringify(data))
    } catch {
      logout()
    }
  }

  const initAuth = () => {
    if (token.value) {
      const saved = localStorage.getItem('user')
      if (saved) {
        try { user.value = JSON.parse(saved) } catch { /* ignore */ }
      }
      getProfile()
    }
  }

  return { user, token, isLoggedIn, isAdmin, login, register, logout, getProfile, initAuth }
})
