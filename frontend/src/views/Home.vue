<template>
  <div class="home-container">
    <!-- 導航欄 -->
    <AppHeader />
    
    <!-- 主要內容 -->
    <main class="main-content">
      <div class="container">
        <!-- 專案選擇區域 -->
        <div class="projects-section">
          <div class="section-header">
            <h2>專案清單</h2>
            <div class="project-filter">
              <el-input
                v-model="searchQuery"
                placeholder="搜索專案..."
                prefix-icon="Search"
                clearable
                style="width: 300px"
              />
            </div>
          </div>
          
          <div v-if="loading" class="loading-state">
            <el-skeleton :rows="3" animated />
          </div>
          
          <div v-else-if="filteredProjects.length === 0" class="empty-state">
            <div class="empty-content">
              <el-icon size="80" color="#c0c4cc">
                <FolderOpened />
              </el-icon>
              <h3>您還沒有可以訪問的專案</h3>
              <p>請聯繫管理員為您分配專案訪問權限</p>
              <el-button type="primary" @click="contactAdmin">
                聯繫管理員
              </el-button>
            </div>
          </div>
          
          <div v-else class="projects-grid">
            <ProjectCard
              v-for="project in filteredProjects"
              :key="project.id"
              :project="project"
              @select="handleProjectSelect"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { FolderOpened } from '@element-plus/icons-vue'
import { useProjectsStore } from '@/stores/projects'
import { useUserStore } from '@/stores/user'
import AppHeader from '@/components/AppHeader.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import type { Project } from '@shared/types'

const router = useRouter()
const projectsStore = useProjectsStore()
const userStore = useUserStore()

const searchQuery = ref('')
const loading = ref(false)

const filteredProjects = computed(() => {
  if (!searchQuery.value) {
    return projectsStore.availableProjects
  }
  
  return projectsStore.availableProjects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const handleProjectSelect = async (project: Project) => {
  try {
    await projectsStore.selectProject(project.id)
    router.push(`/project/${project.id}`)
  } catch (error) {
    console.error('Failed to select project:', error)
    ElMessage.error('載入專案失敗')
  }
}

const contactAdmin = () => {
  ElMessage.info('請聯繫系統管理員分配專案權限')
}

onMounted(async () => {
  loading.value = true
  try {
    await projectsStore.loadProjects()
  } catch (error) {
    console.error('Failed to load projects:', error)
    ElMessage.error('載入專案列表失敗')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: var(--background-base);
}

.main-content {
  padding-top: 80px; /* Account for fixed header */
  min-height: calc(100vh - 80px);
}

.welcome-section {
  text-align: center;
  padding: 60px 0 40px;
}

.welcome-section h1 {
  font-size: var(--font-size-extra-large);
  color: var(--text-primary);
  margin-bottom: 12px;
  font-weight: 600;
}

.welcome-section p {
  font-size: var(--font-size-medium);
  color: var(--text-secondary);
  margin: 0;
}

.projects-section {
  padding-bottom: 60px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.section-header h2 {
  font-size: var(--font-size-large);
  color: var(--text-primary);
  margin: 0;
  font-weight: 600;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.loading-state {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-content {
  max-width: 400px;
  margin: 0 auto;
}

.empty-content h3 {
  font-size: var(--font-size-large);
  color: var(--text-primary);
  margin: 20px 0 12px 0;
}

.empty-content p {
  color: var(--text-secondary);
  margin-bottom: 24px;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .main-content {
    padding-top: 70px;
  }
  
  .welcome-section {
    padding: 40px 0 30px;
  }
  
  .welcome-section h1 {
    font-size: var(--font-size-large);
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .project-filter {
    width: 100%;
  }
  
  .project-filter .el-input {
    width: 100% !important;
  }
  
  .projects-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>