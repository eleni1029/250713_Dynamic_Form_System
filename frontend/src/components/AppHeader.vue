<template>
  <header class="app-header">
    <div class="container header-content">
      <!-- Logo 和標題 -->
      <div class="header-left">
        <router-link to="/" class="logo-link">
          <h1 class="app-title">Dynamic Form</h1>
        </router-link>
        
        <!-- 專案選擇器 -->
        <div v-if="userStore.isAuthenticated" class="project-selector">
          <el-select
            v-model="selectedProjectId"
            placeholder="選擇專案"
            filterable
            clearable
            style="width: 200px"
            @change="handleProjectChange"
            :loading="projectsStore.loading"
          >
            <el-option
              v-for="project in availableProjects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
        </div>
      </div>
      
      <!-- 用戶信息和操作 -->
      <div class="header-right">
        <div v-if="userStore.isAuthenticated" class="user-section">
          <!-- 用戶頭像和菜單 -->
          <el-dropdown @command="handleUserMenuCommand" trigger="click">
            <div class="user-avatar-section">
              <el-avatar 
                :src="userStore.user?.avatar" 
                :size="36"
                class="user-avatar"
              >
                {{ userStore.user?.name?.charAt(0) || 'U' }}
              </el-avatar>
              <span class="user-name hidden-mobile">
                {{ userStore.user?.name }}
              </span>
              <el-icon class="dropdown-icon">
                <ArrowDown />
              </el-icon>
            </div>
            
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  個人資料
                </el-dropdown-item>
                <el-dropdown-item v-if="userStore.isAdmin" command="admin" divided>
                  <el-icon><Setting /></el-icon>
                  管理後台
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  登出
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        
        <div v-else class="auth-section">
          <el-button type="primary" @click="goToLogin">
            登錄
          </el-button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, User, Setting, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useProjectsStore } from '@/stores/projects'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const projectsStore = useProjectsStore()

const selectedProjectId = ref('')

const availableProjects = computed(() => projectsStore.availableProjects)

const handleProjectChange = async (projectId: string) => {
  if (projectId) {
    try {
      await projectsStore.selectProject(projectId)
      router.push(`/project/${projectId}`)
    } catch (error) {
      ElMessage.error('切換專案失敗')
    }
  } else {
    // 清除選擇，返回首頁
    router.push('/')
  }
}

// 根據當前路由設置選中的專案
watch(() => route.params.projectId, (projectId) => {
  if (typeof projectId === 'string') {
    selectedProjectId.value = projectId
  } else {
    selectedProjectId.value = ''
  }
}, { immediate: true })

// 載入專案列表
onMounted(async () => {
  if (userStore.isAuthenticated) {
    try {
      await projectsStore.loadProjects()
    } catch (error) {
      console.error('Failed to load projects in header:', error)
    }
  }
})

const handleUserMenuCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      // TODO: 實現個人資料頁面
      ElMessage.info('個人資料功能將在後續版本中提供')
      break
      
    case 'admin':
      router.push('/admin')
      break
      
    case 'logout':
      try {
        await ElMessageBox.confirm(
          '確定要登出嗎？',
          '確認登出',
          {
            confirmButtonText: '確定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        await userStore.logout()
        ElMessage.success('已登出')
        router.push('/login')
      } catch (error) {
        // User cancelled
      }
      break
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--background-page);
  box-shadow: var(--box-shadow-base);
  height: 64px;
}

.header-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.project-selector {
  display: flex;
  align-items: center;
}

.logo-link {
  text-decoration: none;
  color: inherit;
}

.app-title {
  font-size: var(--font-size-large);
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
  cursor: pointer;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-section {
  display: flex;
  align-items: center;
}

.user-avatar-section {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: var(--border-radius-base);
  transition: background-color 0.3s;
}

.user-avatar-section:hover {
  background-color: var(--background-base);
}

.user-avatar {
  flex-shrink: 0;
}

.user-name {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  font-weight: 500;
}

.dropdown-icon {
  color: var(--text-secondary);
  font-size: 12px;
}

.auth-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 768px) {
  .app-header {
    height: 56px;
  }
  
  .header-left {
    gap: 12px;
  }
  
  .app-title {
    font-size: var(--font-size-medium);
  }
  
  .project-selector {
    display: none;
  }
  
  .user-avatar-section {
    padding: 6px 8px;
  }
}
</style>