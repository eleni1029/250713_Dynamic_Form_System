import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginCredentials, AuthResponse } from '@shared/types'
import { authApi } from '@/utils/api'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string>('')
  const permissions = ref<string[]>([])
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => permissions.value.includes('admin'))

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      loading.value = true
      const response = await authApi.login(credentials)
      
      if (response.success && response.data) {
        const { token: authToken, user: userData, permissions: userPermissions } = response.data as AuthResponse
        
        user.value = userData
        token.value = authToken
        permissions.value = userPermissions
        
        localStorage.setItem('auth_token', authToken)
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('permissions', JSON.stringify(userPermissions))
        
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    user.value = null
    token.value = ''
    permissions.value = []
    
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    localStorage.removeItem('permissions')
  }

  const initializeAuth = () => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user')
    const storedPermissions = localStorage.getItem('permissions')
    
    if (storedToken && storedUser && storedPermissions) {
      try {
        token.value = storedToken
        user.value = JSON.parse(storedUser)
        permissions.value = JSON.parse(storedPermissions)
      } catch (error) {
        console.error('Failed to parse stored auth data:', error)
        logout()
      }
    }
  }

  const hasPermission = (permission: string): boolean => {
    return permissions.value.includes(permission) || permissions.value.includes('admin')
  }

  const updateUser = (userData: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  return {
    user,
    token,
    permissions,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    initializeAuth,
    hasPermission,
    updateUser
  }
})