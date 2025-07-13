<template>
  <div class="project-view">
    <AppHeader />
    
    <main class="main-content">
      <div class="container">
        <!-- 返回按鈕和項目信息 -->
        <div class="project-header">
          <el-button 
            type="default" 
            :icon="ArrowLeft" 
            @click="goBack"
            class="back-button"
          >
            返回
          </el-button>
          
          <div v-if="currentProject" class="project-info">
            <h1 class="project-title">{{ currentProject.name }}</h1>
            <p class="project-description">{{ currentProject.description }}</p>
          </div>
        </div>
        
        <!-- 項目內容 -->
        <div class="project-content">
          <div v-if="loading" class="loading-state">
            <el-skeleton :rows="5" animated />
          </div>
          
          <div v-else-if="!currentProject" class="error-state">
            <el-result
              icon="warning"
              title="項目不存在"
              sub-title="您訪問的項目不存在或已被禁用"
            >
              <template #extra>
                <el-button type="primary" @click="goBack">
                  返回首頁
                </el-button>
              </template>
            </el-result>
          </div>
          
          <div v-else-if="!hasAccess" class="error-state">
            <el-result
              icon="error"
              title="訪問被拒絕"
              sub-title="您沒有權限訪問此項目"
            >
              <template #extra>
                <el-button type="primary" @click="goBack">
                  返回首頁
                </el-button>
              </template>
            </el-result>
          </div>
          
          <!-- 動態載入項目組件 -->
          <component 
            v-else
            :is="projectComponent"
            :project="currentProject"
            :last-input-data="lastInputData"
            @save-input="handleSaveInput"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useProjectsStore } from '@/stores/projects'
import { useUserStore } from '@/stores/user'
import AppHeader from '@/components/AppHeader.vue'

// Dynamic imports for project components
const projectComponents: Record<string, any> = {
  'BMICalculator': () => import('@/components/projects/BMICalculator.vue'),
  'TDEECalculator': () => import('@/components/projects/TDEECalculator.vue')
}

interface Props {
  projectId: string
}

const props = defineProps<Props>()
const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const userStore = useUserStore()

const loading = ref(true)
const projectComponent = ref()

const currentProject = computed(() => projectsStore.currentProject)
const lastInputData = computed(() => {
  if (!currentProject.value) return {}
  return projectsStore.getLastInput(currentProject.value.id)
})

const hasAccess = computed(() => {
  if (!currentProject.value) return false
  return projectsStore.hasProjectAccess(currentProject.value.id)
})

const loadProject = async () => {
  loading.value = true
  
  try {
    await projectsStore.loadProjects()
    await projectsStore.selectProject(props.projectId)
    
    if (currentProject.value && hasAccess.value) {
      // Dynamically load the project component
      const componentLoader = projectComponents[currentProject.value.component]
      if (componentLoader) {
        const component = await componentLoader()
        projectComponent.value = component.default
      } else {
        throw new Error(`Component ${currentProject.value.component} not found`)
      }
    }
  } catch (error) {
    console.error('Failed to load project:', error)
    ElMessage.error('載入項目失敗')
  } finally {
    loading.value = false
  }
}

const handleSaveInput = async (data: Record<string, any>) => {
  if (!currentProject.value) return
  
  try {
    const success = await projectsStore.saveInput(currentProject.value.id, data)
    if (success) {
      ElMessage.success('數據已保存')
    } else {
      ElMessage.error('保存失敗')
    }
  } catch (error) {
    console.error('Failed to save input:', error)
    ElMessage.error('保存過程中發生錯誤')
  }
}

const goBack = () => {
  router.push('/')
}

// Watch for route changes
watch(() => props.projectId, loadProject, { immediate: true })

onMounted(() => {
  loadProject()
})
</script>

<style scoped>
.project-view {
  min-height: 100vh;
  background: var(--background-base);
}

.main-content {
  padding-top: 80px;
  min-height: calc(100vh - 80px);
  padding-bottom: 40px;
}

.project-header {
  margin-bottom: 32px;
}

.back-button {
  margin-bottom: 16px;
}

.project-info {
  margin-top: 8px;
}

.project-title {
  font-size: var(--font-size-extra-large);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.project-description {
  font-size: var(--font-size-medium);
  color: var(--text-secondary);
  margin: 0;
}

.project-content {
  min-height: 400px;
}

.loading-state,
.error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

@media (max-width: 768px) {
  .main-content {
    padding-top: 70px;
  }
  
  .project-header {
    margin-bottom: 24px;
  }
  
  .project-title {
    font-size: var(--font-size-large);
  }
  
  .project-description {
    font-size: var(--font-size-base);
  }
}
</style>