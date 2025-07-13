<template>
  <div class="user-management">
    <div class="page-header">
      <h2>用戶管理</h2>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon>
        新增用戶
      </el-button>
    </div>

    <!-- 搜索和篩選 -->
    <div class="search-section">
      <div class="search-controls">
        <el-input
          v-model="searchQuery"
          placeholder="搜索用戶名或姓名..."
          style="width: 300px"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select v-model="statusFilter" placeholder="狀態篩選" style="width: 120px" @change="loadUsers">
          <el-option label="全部" value="" />
          <el-option label="啟用" value="active" />
          <el-option label="停用" value="inactive" />
        </el-select>
      </div>
    </div>

    <!-- 用戶表格 -->
    <div class="table-section">
      <el-table 
        :data="users" 
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="username" label="用戶名" width="120" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="email" label="郵箱" min-width="180" />
        <el-table-column label="頭像" width="80">
          <template #default="{ row }">
            <el-avatar :src="row.avatar" :size="32">
              {{ row.name?.charAt(0) }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column label="狀態" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ row.isActive ? '啟用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="管理員" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.isAdmin" type="warning">管理員</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="創建時間" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editUser(row)">編輯</el-button>
            <el-button size="small" @click="managePermissions(row)">權限</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteUser(row)"
              :disabled="row.isAdmin"
            >
              刪除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分頁 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadUsers"
          @current-change="loadUsers"
        />
      </div>
    </div>

    <!-- 創建/編輯用戶對話框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '編輯用戶' : '新增用戶'"
      width="500px"
      @closed="resetForm"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="80px"
      >
        <el-form-item label="用戶名" prop="username">
          <el-input v-model="userForm.username" :disabled="isEditing" />
        </el-form-item>
        
        <el-form-item label="姓名" prop="name">
          <el-input v-model="userForm.name" />
        </el-form-item>
        
        <el-form-item label="郵箱" prop="email">
          <el-input v-model="userForm.email" type="email" />
        </el-form-item>
        
        <el-form-item v-if="!isEditing" label="密碼" prop="password">
          <el-input v-model="userForm.password" type="password" show-password />
        </el-form-item>
        
        <el-form-item label="頭像" prop="avatar">
          <el-input v-model="userForm.avatar" placeholder="頭像URL（可選）" />
        </el-form-item>
        
        <el-form-item label="狀態">
          <el-switch v-model="userForm.isActive" active-text="啟用" inactive-text="停用" />
        </el-form-item>
        
        <el-form-item label="管理員">
          <el-switch v-model="userForm.isAdmin" active-text="是" inactive-text="否" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser" :loading="saving">
          {{ isEditing ? '更新' : '創建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 權限管理對話框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="權限管理"
      width="400px"
    >
      <div v-if="selectedUser">
        <h4>{{ selectedUser.name }} 的權限</h4>
        <el-checkbox-group v-model="userPermissions">
          <el-checkbox 
            v-for="permission in availablePermissions"
            :key="permission.id"
            :value="permission.id"
          >
            {{ permission.name }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
      
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePermissions" :loading="saving">
          保存
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
import { userApi } from '@/utils/api'
import type { User } from '@shared/types'

const loading = ref(false)
const saving = ref(false)
const users = ref<User[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const statusFilter = ref('')

const dialogVisible = ref(false)
const permissionDialogVisible = ref(false)
const isEditing = ref(false)
const selectedUser = ref<User | null>(null)
const userFormRef = ref<FormInstance>()

const userForm = reactive({
  username: '',
  name: '',
  email: '',
  password: '',
  avatar: '',
  isActive: true,
  isAdmin: false
})

const userPermissions = ref<string[]>([])
const availablePermissions = ref([
  { id: 'bmi_access', name: 'BMI計算器訪問權限' },
  { id: 'tdee_access', name: 'TDEE計算器訪問權限' }
])

const userRules: FormRules = {
  username: [
    { required: true, message: '請輸入用戶名', trigger: 'blur' },
    { min: 2, max: 50, message: '用戶名長度在 2 到 50 個字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '請輸入姓名', trigger: 'blur' },
    { min: 1, max: 100, message: '姓名長度在 1 到 100 個字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '請輸入正確的郵箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '請輸入密碼', trigger: 'blur' },
    { min: 6, message: '密碼長度不能少於 6 個字符', trigger: 'blur' }
  ]
}

const loadUsers = async () => {
  loading.value = true
  try {
    const response = await userApi.getUsers(currentPage.value, pageSize.value)
    if (response.success && response.data) {
      users.value = response.data
      total.value = response.pagination?.total || 0
    }
  } catch (error) {
    ElMessage.error('載入用戶列表失敗')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
}

const showCreateDialog = () => {
  isEditing.value = false
  dialogVisible.value = true
}

const editUser = (user: User) => {
  isEditing.value = true
  selectedUser.value = user
  Object.assign(userForm, {
    username: user.username,
    name: user.name,
    email: user.email || '',
    password: '',
    avatar: user.avatar || '',
    isActive: user.isActive,
    isAdmin: user.isAdmin || false
  })
  dialogVisible.value = true
}

const saveUser = async () => {
  if (!userFormRef.value) return
  
  await userFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    saving.value = true
    try {
      if (isEditing.value && selectedUser.value) {
        const { password, ...updateData } = userForm
        await userApi.updateUser(selectedUser.value.id, updateData)
        ElMessage.success('用戶更新成功')
      } else {
        await userApi.createUser(userForm)
        ElMessage.success('用戶創建成功')
      }
      
      dialogVisible.value = false
      loadUsers()
    } catch (error) {
      ElMessage.error(isEditing.value ? '更新用戶失敗' : '創建用戶失敗')
    } finally {
      saving.value = false
    }
  })
}

const deleteUser = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除用戶 "${user.name}" 嗎？此操作不可恢復。`,
      '確認刪除',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await userApi.deleteUser(user.id)
    ElMessage.success('用戶刪除成功')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('刪除用戶失敗')
    }
  }
}

const managePermissions = async (user: User) => {
  selectedUser.value = user
  // TODO: 載入用戶權限
  userPermissions.value = ['bmi_access', 'tdee_access'] // 暫時給所有權限
  permissionDialogVisible.value = true
}

const savePermissions = async () => {
  if (!selectedUser.value) return
  
  saving.value = true
  try {
    await userApi.updateUserPermissions(selectedUser.value.id, userPermissions.value)
    ElMessage.success('權限更新成功')
    permissionDialogVisible.value = false
  } catch (error) {
    ElMessage.error('權限更新失敗')
  } finally {
    saving.value = false
  }
}

const resetForm = () => {
  Object.assign(userForm, {
    username: '',
    name: '',
    email: '',
    password: '',
    avatar: '',
    isActive: true,
    isAdmin: false
  })
  selectedUser.value = null
  userFormRef.value?.resetFields()
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
  loadUsers()
})
</script>

<style scoped>
.user-management {
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
}

.table-section {
  flex: 1;
  background: white;
  border-radius: var(--border-radius-base);
  padding: 20px;
  box-shadow: var(--box-shadow-base);
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: center;
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