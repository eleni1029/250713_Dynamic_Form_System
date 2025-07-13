<template>
  <div class="project-management">
    <div class="page-header">
      <h2>專案管理</h2>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon>
        新增專案
      </el-button>
    </div>

    <!-- 搜索和篩選 -->
    <div class="search-section">
      <div class="search-controls">
        <el-input
          v-model="searchQuery"
          placeholder="搜索專案名稱或描述..."
          style="width: 300px"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select v-model="statusFilter" placeholder="狀態篩選" style="width: 120px" @change="loadProjects">
          <el-option label="全部" value="" />
          <el-option label="啟用" value="enabled" />
          <el-option label="停用" value="disabled" />
        </el-select>
        
        <el-select v-model="categoryFilter" placeholder="分類篩選" style="width: 150px" @change="loadProjects">
          <el-option label="全部分類" value="" />
          <el-option label="健康計算" value="health" />
        </el-select>
      </div>
    </div>

    <!-- 專案表格 -->
    <div class="table-section">
      <el-table 
        :data="projects" 
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="專案ID" width="140" />
        <el-table-column prop="name" label="專案名稱" width="150" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="component" label="組件名稱" width="140" />
        <el-table-column label="狀態" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'danger'">
              {{ row.enabled ? '啟用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分類" width="100">
          <template #default="{ row }">
            {{ getCategoryName(row.category) }}
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column label="創建時間" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editProject(row)">編輯</el-button>
            <el-button 
              size="small" 
              :type="row.enabled ? 'warning' : 'success'"
              @click="toggleProjectStatus(row)"
            >
              {{ row.enabled ? '停用' : '啟用' }}
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteProject(row)"
            >
              刪除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 創建/編輯專案對話框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '編輯專案' : '新增專案'"
      width="600px"
      @closed="resetForm"
    >
      <el-form
        ref="projectFormRef"
        :model="projectForm"
        :rules="projectRules"
        label-width="100px"
      >
        <el-form-item label="專案ID" prop="id">
          <el-input 
            v-model="projectForm.id" 
            :disabled="isEditing"
            placeholder="例如: my-calculator"
          />
          <div class="form-tip">專案ID用於URL路徑，只能包含小寫字母、數字和連字符</div>
        </el-form-item>
        
        <el-form-item label="專案名稱" prop="name">
          <el-input v-model="projectForm.name" placeholder="例如: 我的計算器" />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="projectForm.description" 
            type="textarea" 
            :rows="2"
            placeholder="簡要描述專案功能"
          />
        </el-form-item>
        
        <el-form-item label="組件名稱" prop="component">
          <el-input 
            v-model="projectForm.component" 
            placeholder="例如: MyCalculator"
          />
          <div class="form-tip">Vue組件名稱，需要對應實際的組件文件</div>
        </el-form-item>
        
        <el-form-item label="URL路徑" prop="path">
          <el-input 
            v-model="projectForm.path" 
            placeholder="例如: /projects/my-calculator"
          />
        </el-form-item>
        
        <el-form-item label="分類" prop="category">
          <el-select v-model="projectForm.category" placeholder="選擇分類">
            <el-option label="健康計算" value="health" />
            <el-option label="金融計算" value="finance" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="版本" prop="version">
          <el-input v-model="projectForm.version" placeholder="例如: 1.0.0" />
        </el-form-item>
        
        <el-form-item label="作者" prop="author">
          <el-input v-model="projectForm.author" placeholder="作者名稱" />
        </el-form-item>
        
        <el-form-item label="狀態">
          <el-switch v-model="projectForm.enabled" active-text="啟用" inactive-text="停用" />
        </el-form-item>
        
        <el-form-item label="公開使用">
          <el-switch v-model="projectForm.isPublic" active-text="公開" inactive-text="需要權限" />
          <div class="form-tip">設為公開後，所有用戶都可以訪問此專案</div>
        </el-form-item>
        
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProject" :loading="saving">
          {{ isEditing ? '更新' : '創建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { adminProjectApi } from '@/utils/api'
import type { Project } from '@shared/types'

const loading = ref(false)
const saving = ref(false)
const projects = ref<Project[]>([])
const searchQuery = ref('')
const statusFilter = ref('')
const categoryFilter = ref('')

const dialogVisible = ref(false)
const isEditing = ref(false)
const selectedProject = ref<Project | null>(null)
const projectFormRef = ref<FormInstance>()

const projectForm = reactive({
  id: '',
  name: '',
  description: '',
  component: '',
  path: '',
  category: 'health',
  version: '1.0.0',
  author: '',
  enabled: true,
  isPublic: false,
  metadata: {
    saveLastInput: true,
    saveHistory: false,
    maxInputFields: 10
  }
})

const projectRules: FormRules = {
  id: [
    { required: true, message: '請輸入專案ID', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: '專案ID只能包含小寫字母、數字和連字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '請輸入專案名稱', trigger: 'blur' },
    { min: 1, max: 100, message: '專案名稱長度在 1 到 100 個字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '請輸入專案描述', trigger: 'blur' }
  ],
  component: [
    { required: true, message: '請輸入組件名稱', trigger: 'blur' }
  ],
  path: [
    { required: true, message: '請輸入URL路徑', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '請選擇分類', trigger: 'change' }
  ],
  version: [
    { required: true, message: '請輸入版本號', trigger: 'blur' }
  ],
  author: [
    { required: true, message: '請輸入作者', trigger: 'blur' }
  ]
}

const loadProjects = async () => {
  loading.value = true
  try {
    const response = await adminProjectApi.getProjects()
    if (response.success && response.data) {
      projects.value = response.data
    }
  } catch (error) {
    ElMessage.error('載入專案列表失敗')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  // 實現搜索邏輯
  loadProjects()
}

const showCreateDialog = () => {
  isEditing.value = false
  dialogVisible.value = true
}

const editProject = (project: Project) => {
  isEditing.value = true
  selectedProject.value = project
  Object.assign(projectForm, {
    ...project,
    metadata: {
      saveLastInput: true,
      saveHistory: false,
      maxInputFields: 10,
      ...project.metadata
    }
  })
  dialogVisible.value = true
}

const saveProject = async () => {
  if (!projectFormRef.value) return
  
  await projectFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    saving.value = true
    try {
      if (isEditing.value && selectedProject.value) {
        await adminProjectApi.updateProject(selectedProject.value.id, projectForm)
        ElMessage.success('專案更新成功')
      } else {
        await adminProjectApi.createProject(projectForm)
        ElMessage.success('專案創建成功')
      }
      
      dialogVisible.value = false
      loadProjects()
    } catch (error) {
      ElMessage.error(isEditing.value ? '更新專案失敗' : '創建專案失敗')
    } finally {
      saving.value = false
    }
  })
}

const toggleProjectStatus = async (project: Project) => {
  try {
    await adminProjectApi.updateProject(project.id, { enabled: !project.enabled })
    ElMessage.success(`專案已${project.enabled ? '停用' : '啟用'}`)
    loadProjects()
  } catch (error) {
    ElMessage.error('更新專案狀態失敗')
  }
}

const deleteProject = async (project: Project) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除專案 "${project.name}" 嗎？此操作不可恢復。`,
      '確認刪除',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await adminProjectApi.deleteProject(project.id)
    ElMessage.success('專案刪除成功')
    loadProjects()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('刪除專案失敗')
    }
  }
}

const resetForm = () => {
  Object.assign(projectForm, {
    id: '',
    name: '',
    description: '',
    component: '',
    path: '',
    category: 'health',
    version: '1.0.0',
    author: '',
    enabled: true,
    isPublic: false,
    metadata: {
      saveLastInput: true,
      saveHistory: false,
      maxInputFields: 10
    }
  })
  selectedProject.value = null
  projectFormRef.value?.resetFields()
}

const getCategoryName = (category: string) => {
  const categoryMap: Record<string, string> = {
    health: '健康計算',
    finance: '金融計算',
    other: '其他'
  }
  return categoryMap[category] || category
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadProjects()
})
</script>

<style scoped>
.project-management {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: var(--font-size-large);
  color: var(--text-primary);
}

.search-section {
  margin-bottom: 20px;
}

.search-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.table-section {
  flex: 1;
  background: white;
  border-radius: var(--border-radius-base);
  padding: 20px;
  box-shadow: var(--box-shadow-base);
  overflow: auto;
}

.form-tip {
  font-size: var(--font-size-small);
  color: var(--text-secondary);
  margin-top: 4px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .search-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-controls > * {
    width: 100% !important;
  }
  
  .table-section {
    padding: 16px;
  }
}
</style>