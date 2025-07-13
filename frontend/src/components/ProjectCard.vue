<template>
  <div class="project-card" @click="handleClick">
    <div class="project-header">
      <div class="project-icon">
        <el-icon size="24">
          <component :is="getProjectIcon(project.category)" />
        </el-icon>
      </div>
      <div class="project-meta">
        <h3 class="project-name">{{ project.name }}</h3>
        <span class="project-version">v{{ project.version }}</span>
      </div>
    </div>
    
    <div class="project-body">
      <p class="project-description">{{ project.description }}</p>
      
      <div class="project-info">
        <div class="info-item">
          <el-icon><User /></el-icon>
          <span>{{ project.author }}</span>
        </div>
        <div class="info-item">
          <el-icon><FolderOpened /></el-icon>
          <span>{{ getCategoryName(project.category) }}</span>
        </div>
      </div>
    </div>
    
    <div class="project-footer">
      <el-button type="primary" :loading="loading" @click.stop="handleSelect">
        {{ loading ? '載入中...' : '使用' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { User, FolderOpened, Monitor, TrendCharts } from '@element-plus/icons-vue'
import type { Project } from '@shared/types'

interface Props {
  project: Project
}

interface Emits {
  (e: 'select', project: Project): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const loading = ref(false)

const getProjectIcon = (category: string) => {
  switch (category) {
    case 'health':
      return TrendCharts
    default:
      return Monitor
  }
}

const getCategoryName = (category: string) => {
  switch (category) {
    case 'health':
      return '健康計算'
    default:
      return '其他'
  }
}

const handleClick = () => {
  // Allow clicking on the entire card to select
  handleSelect()
}

const handleSelect = async () => {
  if (loading.value) return
  
  loading.value = true
  try {
    emit('select', props.project)
  } finally {
    // Keep loading state for a moment to show feedback
    setTimeout(() => {
      loading.value = false
    }, 500)
  }
}
</script>

<style scoped>
.project-card {
  background: var(--background-page);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-base);
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.project-card:hover {
  border-color: var(--primary-color);
  box-shadow: var(--box-shadow-light);
  transform: translateY(-2px);
}

.project-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.project-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-base);
  background: linear-gradient(135deg, var(--primary-color), #667eea);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.project-meta {
  flex: 1;
  min-width: 0;
}

.project-name {
  font-size: var(--font-size-medium);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-version {
  font-size: var(--font-size-small);
  color: var(--text-secondary);
  background: var(--background-base);
  padding: 2px 6px;
  border-radius: var(--border-radius-small);
}

.project-body {
  flex: 1;
  margin-bottom: 20px;
}

.project-description {
  font-size: var(--font-size-base);
  color: var(--text-regular);
  line-height: 1.5;
  margin: 0 0 16px 0;
}

.project-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-small);
  color: var(--text-secondary);
}

.info-item .el-icon {
  color: var(--text-placeholder);
}

.project-footer {
  margin-top: auto;
}

.project-footer .el-button {
  width: 100%;
}

@media (max-width: 768px) {
  .project-card {
    padding: 20px;
  }
  
  .project-header {
    margin-bottom: 12px;
  }
  
  .project-icon {
    width: 40px;
    height: 40px;
  }
  
  .project-name {
    font-size: var(--font-size-base);
  }
}
</style>