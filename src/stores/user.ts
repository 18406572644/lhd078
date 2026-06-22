import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/composables/useAuth'
import { api } from '@/composables/useApi'
import { clearAuth, setAuth, getToken, getUser } from '@/utils/auth'

export const useUserStore = defineStore('user', () => {
  const user = ref<UserInfo | null>(getUser())
  const token = ref<string | null>(getToken())
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 1)

  const login = async (phone: string, password: string) => {
    const { data } = await api.post('/auth/login', { phone, password })
    const result = data.data || data
    token.value = result.token
    user.value = result.user
    setAuth(result.token, result.user)
    return result
  }

  const register = async (params: { phone: string; password: string; name: string; address: string }) => {
    const { data } = await api.post('/auth/register', params)
    return data
  }

  const logout = () => {
    token.value = null
    user.value = null
    clearAuth()
  }

  const getProfile = async () => {
    try {
      const { data } = await api.get('/auth/profile')
      const result = data.data || data
      user.value = result
      setAuth(token.value!, result)
    } catch {
      logout()
    }
  }

  const initAuth = () => {
    if (token.value) {
      const saved = getUser()
      if (saved) {
        user.value = saved
      }
      getProfile()
    }
  }

  return { user, token, isLoggedIn, isAdmin, login, register, logout, getProfile, initAuth }
})
