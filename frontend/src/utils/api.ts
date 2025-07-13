import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type { 
  ApiResponse, 
  LoginCredentials, 
  AuthResponse, 
  Project, 
  FormData,
  User,
  ActivityLog,
  PaginatedResponse,
  RegisterData,
  GoogleAuthData,
  GuestLoginData
} from '@shared/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      localStorage.removeItem('permissions')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error.message)
  }
)

export const authApi = {
  login: (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> =>
    apiClient.post('/auth/login', credentials),
  
  register: (registerData: RegisterData): Promise<ApiResponse<AuthResponse>> =>
    apiClient.post('/auth/register', registerData),
  
  googleAuth: (idToken: string): Promise<ApiResponse<AuthResponse>> =>
    apiClient.post('/auth/google', { idToken }),
  
  guestLogin: (guestData: GuestLoginData): Promise<ApiResponse<AuthResponse>> =>
    apiClient.post('/auth/guest', guestData),
  
  logout: (): Promise<ApiResponse> =>
    apiClient.post('/auth/logout'),
  
  verify: (): Promise<ApiResponse<AuthResponse>> =>
    apiClient.get('/auth/verify')
}

export const projectApi = {
  getProjects: (): Promise<ApiResponse<Project[]>> =>
    apiClient.get('/projects'),
  
  getProject: (id: string): Promise<ApiResponse<Project>> =>
    apiClient.get(`/projects/${id}`),
  
  getLastInput: (projectId: string): Promise<ApiResponse<FormData>> =>
    apiClient.get(`/projects/${projectId}/last-input`),
  
  saveInput: (projectId: string, data: Record<string, any>): Promise<ApiResponse<FormData>> =>
    apiClient.post(`/projects/${projectId}/input`, { data })
}

export const userApi = {
  getUsers: (page?: number, limit?: number): Promise<PaginatedResponse<User>> =>
    apiClient.get('/users', { params: { page, limit } }),
  
  getUser: (id: string): Promise<ApiResponse<User>> =>
    apiClient.get(`/users/${id}`),
  
  createUser: (userData: Partial<User>): Promise<ApiResponse<User>> =>
    apiClient.post('/users', userData),
  
  updateUser: (id: string, userData: Partial<User>): Promise<ApiResponse<User>> =>
    apiClient.put(`/users/${id}`, userData),
  
  deleteUser: (id: string): Promise<ApiResponse> =>
    apiClient.delete(`/users/${id}`),
  
  updateUserPermissions: (userId: string, permissions: string[]): Promise<ApiResponse> =>
    apiClient.put(`/users/${userId}/permissions`, { permissions })
}

export const activityApi = {
  getLogs: (page?: number, limit?: number, userId?: string): Promise<PaginatedResponse<ActivityLog>> =>
    apiClient.get('/activity-logs', { params: { page, limit, userId } })
}

// Admin APIs
export const adminProjectApi = {
  getProjects: (): Promise<ApiResponse<Project[]>> =>
    apiClient.get('/admin/projects'),
  
  getProject: (id: string): Promise<ApiResponse<Project>> =>
    apiClient.get(`/admin/projects/${id}`),
  
  createProject: (projectData: Partial<Project>): Promise<ApiResponse<Project>> =>
    apiClient.post('/admin/projects', projectData),
  
  updateProject: (id: string, projectData: Partial<Project>): Promise<ApiResponse<Project>> =>
    apiClient.put(`/admin/projects/${id}`, projectData),
  
  deleteProject: (id: string): Promise<ApiResponse> =>
    apiClient.delete(`/admin/projects/${id}`)
}

export default apiClient