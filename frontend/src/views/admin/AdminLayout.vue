<template>
  <div class="admin-layout">
    <!-- 固定頂部導航 -->
    <div class="admin-header">
      <div class="header-content">
        <div class="header-left">
          <router-link to="/" class="back-link">
            <el-icon><ArrowLeft /></el-icon>
            返回首頁
          </router-link>
          <h1 class="admin-title">管理後台</h1>
        </div>
        <div class="header-right">
          <span class="admin-user">{{ userStore.user?.name }}</span>
        </div>
      </div>
    </div>

    <div class="admin-content">
      <!-- 側邊欄 -->
      <aside class="admin-sidebar">
        <el-menu
          :default-active="activeMenu"
          class="admin-menu"
          router
          :collapse="isCollapsed"
        >
          <el-menu-item index="/admin/users">
            <el-icon><User /></el-icon>
            <template #title>用戶管理</template>
          </el-menu-item>
          
          <el-menu-item index="/admin/projects">
            <el-icon><Folder /></el-icon>
            <template #title>專案管理</template>
          </el-menu-item>
          
          <el-menu-item index="/admin/logs">
            <el-icon><Document /></el-icon>
            <template #title>操作記錄</template>
          </el-menu-item>
        </el-menu>
        
        <div class="sidebar-toggle">
          <el-button 
            text 
            @click="toggleSidebar"
            :icon="isCollapsed ? Expand : Fold"
          />
        </div>
      </aside>

      <!-- 主要內容區域 -->
      <main class="admin-main">
        <div class="main-content">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { 
  ArrowLeft, User, Folder, Document, 
  Expand, Fold 
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapsed = ref(false)

const activeMenu = computed(() => route.path)

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

// 檢查管理員權限
onMounted(() => {
  if (!userStore.isAdmin) {
    router.push('/')
  }
})
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--background-base);
}

.admin-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: white;
  border-bottom: 1px solid var(--border-light);
  height: 60px;
}

.header-content {
  height: 100%;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: var(--text-secondary);
  font-size: var(--font-size-small);
  transition: color 0.3s;
}

.back-link:hover {
  color: var(--primary-color);
}

.admin-title {
  font-size: var(--font-size-large);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.admin-user {
  font-size: var(--font-size-small);
  color: var(--text-secondary);
}

.admin-content {
  display: flex;
  margin-top: 60px;
  height: calc(100vh - 60px);
}

.admin-sidebar {
  width: 200px;
  background: white;
  border-right: 1px solid var(--border-light);
  position: relative;
  transition: width 0.3s;
}

.admin-sidebar.collapsed {
  width: 64px;
}

.admin-menu {
  border: none;
  height: calc(100vh - 60px);
}

.admin-menu:not(.el-menu--collapse) {
  width: 200px;
}

.sidebar-toggle {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.admin-main {
  flex: 1;
  overflow: hidden;
  background: var(--background-base);
}

.main-content {
  height: 100%;
  padding: 24px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .admin-sidebar {
    position: fixed;
    left: 0;
    top: 60px;
    height: calc(100vh - 60px);
    z-index: 999;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }
  
  .admin-sidebar.mobile-open {
    transform: translateX(0);
  }
  
  .admin-main {
    margin-left: 0;
  }
  
  .header-left {
    gap: 12px;
  }
  
  .admin-title {
    font-size: var(--font-size-medium);
  }
}
</style>