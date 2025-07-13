<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>Dynamic Form System</h1>
        <p>選擇登錄方式</p>
      </div>
      
      <!-- 登錄方式選擇 -->
      <div class="auth-tabs">
        <el-tabs v-model="activeTab" class="auth-tabs-container">
          <el-tab-pane label="帳號登錄" name="login">
            <el-form 
              ref="loginFormRef"
              :model="loginForm" 
              :rules="loginRules"
              class="auth-form"
              size="large"
              @submit.prevent="handleLogin"
            >
              <el-form-item prop="username">
                <el-input
                  v-model="loginForm.username"
                  placeholder="用戶名"
                  prefix-icon="User"
                  :disabled="loading"
                />
              </el-form-item>
              
              <el-form-item prop="password">
                <el-input
                  v-model="loginForm.password"
                  type="password"
                  placeholder="密碼"
                  prefix-icon="Lock"
                  :disabled="loading"
                  show-password
                  @keyup.enter="handleLogin"
                />
              </el-form-item>
              
              <el-form-item>
                <el-button 
                  type="primary" 
                  class="auth-button"
                  :loading="loading"
                  @click="handleLogin"
                >
                  {{ loading ? '登錄中...' : '登錄' }}
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
          
          <el-tab-pane label="註冊帳號" name="register">
            <el-form 
              ref="registerFormRef"
              :model="registerForm" 
              :rules="registerRules"
              class="auth-form"
              size="large"
              @submit.prevent="handleRegister"
            >
              <el-form-item prop="username">
                <el-input
                  v-model="registerForm.username"
                  placeholder="用戶名"
                  prefix-icon="User"
                  :disabled="loading"
                />
              </el-form-item>
              
              <el-form-item prop="name">
                <el-input
                  v-model="registerForm.name"
                  placeholder="顯示名稱"
                  prefix-icon="Avatar"
                  :disabled="loading"
                />
              </el-form-item>
              
              <el-form-item prop="email">
                <el-input
                  v-model="registerForm.email"
                  placeholder="電子郵件（可選）"
                  prefix-icon="Message"
                  :disabled="loading"
                />
              </el-form-item>
              
              <el-form-item prop="password">
                <el-input
                  v-model="registerForm.password"
                  type="password"
                  placeholder="密碼"
                  prefix-icon="Lock"
                  :disabled="loading"
                  show-password
                />
              </el-form-item>
              
              <el-form-item prop="confirmPassword">
                <el-input
                  v-model="registerForm.confirmPassword"
                  type="password"
                  placeholder="確認密碼"
                  prefix-icon="Lock"
                  :disabled="loading"
                  show-password
                  @keyup.enter="handleRegister"
                />
              </el-form-item>
              
              <el-form-item>
                <el-button 
                  type="primary" 
                  class="auth-button"
                  :loading="loading"
                  @click="handleRegister"
                >
                  {{ loading ? '註冊中...' : '註冊' }}
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <!-- 分隔線 -->
      <div class="divider">
        <span>或</span>
      </div>
      
      <!-- 其他登錄方式 -->
      <div class="other-auth-methods">
        <el-button 
          class="google-login-btn"
          size="large"
          :loading="loading"
          @click="handleGoogleLogin"
        >
          <template #icon>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </template>
          使用 Google 登錄
        </el-button>
        
        <div class="guest-login-section">
          <el-divider content-position="center">
            <span class="guest-divider-text">快速體驗</span>
          </el-divider>
          
          <el-form 
            ref="guestFormRef"
            :model="guestForm" 
            :rules="guestRules"
            class="guest-form"
            size="large"
            @submit.prevent="handleGuestLogin"
          >
            <el-form-item prop="name">
              <el-input
                v-model="guestForm.name"
                placeholder="輸入您的暱稱"
                prefix-icon="User"
                :disabled="loading"
                @keyup.enter="handleGuestLogin"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="info" 
                class="auth-button"
                :loading="loading"
                @click="handleGuestLogin"
              >
                {{ loading ? '登錄中...' : '訊客登錄' }}
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
      
      <div class="demo-accounts">
        <h4>測試帳號</h4>
        <div class="demo-account">
          <span>管理員：admin / admin123</span>
        </div>
        <div class="demo-account">
          <span>用戶：user1 / password123</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import type { LoginCredentials, RegisterData, GuestLoginData } from '@shared/types'
import { authApi } from '@/utils/api'

// 聲明 Google 全局對象
declare global {
  interface Window {
    google: any;
  }
}

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()
const guestFormRef = ref<FormInstance>()
const loading = ref(false)
const activeTab = ref('login')

const loginForm = reactive<LoginCredentials>({
  username: '',
  password: ''
})

const registerForm = reactive<RegisterData & { confirmPassword: string }>({
  username: '',
  name: '',
  password: '',
  email: '',
  confirmPassword: ''
})

const guestForm = reactive<GuestLoginData>({
  name: ''
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '請輸入用戶名', trigger: 'blur' },
    { min: 2, max: 50, message: '用戶名長度在 2 到 50 個字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '請輸入密碼', trigger: 'blur' },
    { min: 6, message: '密碼長度不能少於 6 個字符', trigger: 'blur' }
  ]
}

const validatePassword = (rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('請再次輸入密碼'))
  } else if (value !== registerForm.password) {
    callback(new Error('兩次輸入密碼不一致'))
  } else {
    callback()
  }
}

const registerRules: FormRules = {
  username: [
    { required: true, message: '請輸入用戶名', trigger: 'blur' },
    { min: 2, max: 50, message: '用戶名長度在 2 到 50 個字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '用戶名只能包含字母、數字、下划線和連字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '請輸入顯示名稱', trigger: 'blur' },
    { min: 1, max: 100, message: '顯示名稱長度在 1 到 100 個字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '請輸入正確的電子郵件格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '請輸入密碼', trigger: 'blur' },
    { min: 6, message: '密碼長度不能少於 6 個字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePassword, trigger: 'blur' }
  ]
}

const guestRules: FormRules = {
  name: [
    { required: true, message: '請輸入您的暱稱', trigger: 'blur' },
    { min: 1, max: 50, message: '暱稱長度在 1 到 50 個字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      loading.value = true
      const success = await userStore.login(loginForm)
      
      if (success) {
        ElMessage.success('登錄成功')
        router.push('/')
      } else {
        ElMessage.error('登錄失敗，請檢查用戶名和密碼')
      }
    } catch (error) {
      console.error('Login error:', error)
      ElMessage.error('登錄過程中發生錯誤')
    } finally {
      loading.value = false
    }
  })
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      loading.value = true
      const { confirmPassword, ...registerData } = registerForm
      const response = await authApi.register(registerData)
      
      if (response.success && response.data) {
        const { token, user, permissions } = response.data
        
        userStore.user = user
        userStore.token = token
        userStore.permissions = permissions
        
        localStorage.setItem('auth_token', token)
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('permissions', JSON.stringify(permissions))
        
        ElMessage.success('註冊成功')
        router.push('/')
      } else {
        ElMessage.error('註冊失敗')
      }
    } catch (error: any) {
      console.error('Register error:', error)
      ElMessage.error(error.message || '註冊過程中發生錯誤')
    } finally {
      loading.value = false
    }
  })
}

const handleGoogleLogin = async () => {
  try {
    loading.value = true
    
    // 檢查 Google Client ID 是否配置
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || clientId === 'your-google-client-id-here') {
      ElMessage.warning('請先在 .env 文件中配置 Google Client ID')
      return
    }
    
    // 檢查 Google API 是否加載
    if (!window.google) {
      ElMessage.error('Google 登錄 API 未加載')
      return
    }
    
    // 初始化 Google Sign-In
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleAuthResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    })
    
    // 顯示 Google 登錄彈窗
    window.google.accounts.id.prompt()
    
  } catch (error) {
    console.error('Google login error:', error)
    ElMessage.error('Google 登錄失敗')
  } finally {
    loading.value = false
  }
}

const handleGoogleAuthResponse = async (response: any) => {
  try {
    loading.value = true
    const { credential } = response
    
    const authResponse = await authApi.googleAuth(credential)
    
    if (authResponse.success && authResponse.data) {
      const { token, user, permissions } = authResponse.data
      
      userStore.user = user
      userStore.token = token
      userStore.permissions = permissions
      
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('permissions', JSON.stringify(permissions))
      
      ElMessage.success(`歡迎您，${user.name}`)
      router.push('/')
    } else {
      ElMessage.error('Google 登錄失敗')
    }
  } catch (error: any) {
    console.error('Google auth response error:', error)
    ElMessage.error(error.message || 'Google 登錄過程中發生錯誤')
  } finally {
    loading.value = false
  }
}

const handleGuestLogin = async () => {
  if (!guestFormRef.value) return
  
  await guestFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      loading.value = true
      const response = await authApi.guestLogin(guestForm)
      
      if (response.success && response.data) {
        const { token, user, permissions } = response.data
        
        userStore.user = user
        userStore.token = token
        userStore.permissions = permissions
        
        localStorage.setItem('auth_token', token)
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('permissions', JSON.stringify(permissions))
        
        ElMessage.success(`歡迎您，${user.name}`)
        router.push('/')
      } else {
        ElMessage.error('訪客登錄失敗')
      }
    } catch (error: any) {
      console.error('Guest login error:', error)
      ElMessage.error(error.message || '訪客登錄過程中發生錯誤')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  color: var(--text-primary);
  margin-bottom: 8px;
  font-size: 24px;
  font-weight: 600;
}

.login-header p {
  color: var(--text-secondary);
  margin: 0;
}

.auth-tabs-container {
  margin-bottom: 20px;
}

.auth-form {
  margin-top: 20px;
}

.auth-button {
  width: 100%;
}

.divider {
  text-align: center;
  margin: 30px 0;
  position: relative;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--border-lighter);
}

.divider span {
  background: white;
  padding: 0 16px;
  color: var(--text-secondary);
  font-size: var(--font-size-small);
}

.other-auth-methods {
  margin-bottom: 30px;
}

.google-login-btn {
  width: 100%;
  margin-bottom: 20px;
  border: 1px solid #dadce0;
  color: #3c4043;
  background: white;
}

.google-login-btn:hover {
  background: #f8f9fa;
  border-color: #dadce0;
  color: #3c4043;
}

.guest-login-section {
  margin-top: 20px;
}

.guest-divider-text {
  color: var(--text-secondary);
  font-size: var(--font-size-small);
}

.guest-form {
  margin-top: 16px;
}

.demo-accounts {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--border-lighter);
}

.demo-accounts h4 {
  margin: 0 0 12px 0;
  font-size: var(--font-size-small);
  color: var(--text-secondary);
  text-align: center;
}

.demo-account {
  margin-bottom: 8px;
  text-align: center;
}

.demo-account span {
  font-size: var(--font-size-small);
  color: var(--text-secondary);
  background: var(--background-base);
  padding: 4px 8px;
  border-radius: var(--border-radius-small);
  display: inline-block;
}

@media (max-width: 768px) {
  .login-card {
    padding: 30px 20px;
    max-width: 100%;
  }
  
  .login-header h1 {
    font-size: 20px;
  }
}
</style>