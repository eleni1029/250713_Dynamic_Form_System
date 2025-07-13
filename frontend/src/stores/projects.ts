import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project, FormData } from '@shared/types'
import { projectApi } from '@/utils/api'
import { useUserStore } from './user'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const lastInputData = ref<Record<string, FormData>>({})
  const loading = ref(false)

  const userStore = useUserStore()

  const availableProjects = computed(() => {
    return projects.value.filter(project => {
      if (!project.enabled) return false
      
      // 管理員可以訪問所有專案
      if (userStore.isAdmin) return true
      
      // 如果專案設為公開，任何用戶都可以訪問
      if (project.isPublic) return true
      
      // 否則檢查用戶權限（如果有設定權限要求）
      if (project.requiredPermissions && project.requiredPermissions.length > 0) {
        return project.requiredPermissions.every(permission => 
          userStore.hasPermission(permission)
        )
      }
      
      // 如果沒有權限要求，則允許所有用戶訪問
      return true
    })
  })

  const loadProjects = async () => {
    try {
      loading.value = true
      const response = await projectApi.getProjects()
      
      if (response.success && response.data) {
        projects.value = response.data
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      loading.value = false
    }
  }

  const selectProject = async (projectId: string) => {
    const project = projects.value.find(p => p.id === projectId)
    if (project) {
      currentProject.value = project
      await loadLastInput(projectId)
    }
  }

  const loadLastInput = async (projectId: string) => {
    try {
      const response = await projectApi.getLastInput(projectId)
      
      if (response.success && response.data) {
        lastInputData.value[projectId] = response.data
      }
    } catch (error) {
      console.error('Failed to load last input:', error)
    }
  }

  const saveInput = async (projectId: string, data: Record<string, any>) => {
    try {
      const response = await projectApi.saveInput(projectId, data)
      
      if (response.success && response.data) {
        lastInputData.value[projectId] = response.data
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to save input:', error)
      return false
    }
  }

  const getLastInput = (projectId: string) => {
    return lastInputData.value[projectId]?.data || {}
  }

  const clearCurrentProject = () => {
    currentProject.value = null
  }

  const hasProjectAccess = (projectId: string): boolean => {
    const project = projects.value.find(p => p.id === projectId)
    if (!project || !project.enabled) return false
    
    // 管理員可以訪問所有專案
    if (userStore.isAdmin) return true
    
    // 如果專案設為公開，任何用戶都可以訪問
    if (project.isPublic) return true
    
    // 否則檢查用戶權限（如果有設定權限要求）
    if (project.requiredPermissions && project.requiredPermissions.length > 0) {
      return project.requiredPermissions.every(permission => 
        userStore.hasPermission(permission)
      )
    }
    
    // 如果沒有權限要求，則允許所有用戶訪問
    return true
  }

  return {
    projects,
    currentProject,
    lastInputData,
    loading,
    availableProjects,
    loadProjects,
    selectProject,
    loadLastInput,
    saveInput,
    getLastInput,
    clearCurrentProject,
    hasProjectAccess
  }
})