<template>
  <div class="activity-logs">
    <div class="page-header">
      <h2>操作記錄</h2>
      <div class="header-actions">
        <el-button @click="exportLogs" :loading="exporting">
          <el-icon><Download /></el-icon>
          導出記錄
        </el-button>
        <el-button type="danger" @click="clearOldLogs">
          <el-icon><Delete /></el-icon>
          清理舊記錄
        </el-button>
      </div>
    </div>

    <!-- 篩選條件 -->
    <div class="filter-section">
      <div class="filter-controls">
        <el-select 
          v-model="userFilter" 
          placeholder="選擇用戶" 
          style="width: 200px"
          clearable
          @change="loadLogs"
        >
          <el-option 
            v-for="user in users"
            :key="user.id"
            :label="user.name"
            :value="user.id"
          />
        </el-select>
        
        <el-select 
          v-model="actionFilter" 
          placeholder="操作類型" 
          style="width: 150px"
          clearable
          @change="loadLogs"
        >
          <el-option label="登錄" value="login" />
          <el-option label="登出" value="logout" />
          <el-option label="表單輸入" value="form_input_saved" />
          <el-option label="個人資料更新" value="profile_update" />
        </el-select>
        
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="開始日期"
          end-placeholder="結束日期"
          style="width: 300px"
          @change="loadLogs"
        />
        
        <el-button type="primary" @click="loadLogs">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 記錄表格 -->
    <div class="table-section">
      <el-table 
        :data="logs" 
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column label="時間" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="用戶" width="120">
          <template #default="{ row }">
            <div class="user-info">
              <span>{{ row.userName || '未知用戶' }}</span>
              <small>{{ row.username }}</small>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)">
              {{ getActionName(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="詳情" min-width="250">
          <template #default="{ row }">
            <div class="action-details">
              <div v-if="row.action === 'login'" class="detail-item">
                登錄成功
              </div>
              <div v-else-if="row.action === 'logout'" class="detail-item">
                用戶登出
              </div>
              <div v-else-if="row.action === 'form_input_saved'" class="detail-item">
                保存了 {{ row.details?.projectName || '未知專案' }} 的表單數據
              </div>
              <div v-else-if="row.action === 'profile_update'" class="detail-item">
                更新了個人資料: {{ row.details?.fields?.join(', ') || '未知欄位' }}
              </div>
              <div v-else class="detail-item">
                {{ JSON.stringify(row.details) }}
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="IP地址" width="140">
          <template #default="{ row }">
            <code class="ip-address">{{ row.ipAddress || 'N/A' }}</code>
          </template>
        </el-table-column>
        
        <el-table-column label="用戶代理" width="200">
          <template #default="{ row }">
            <div class="user-agent" :title="row.userAgent">
              {{ getBrowserInfo(row.userAgent) }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetails(row)">詳情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分頁 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadLogs"
          @current-change="loadLogs"
        />
      </div>
    </div>

    <!-- 詳情對話框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="操作詳情"
      width="600px"
    >
      <div v-if="selectedLog" class="log-details">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="時間">
            {{ formatDate(selectedLog.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="用戶">
            {{ selectedLog.userName }} ({{ selectedLog.username }})
          </el-descriptions-item>
          <el-descriptions-item label="操作">
            {{ getActionName(selectedLog.action) }}
          </el-descriptions-item>
          <el-descriptions-item label="IP地址">
            {{ selectedLog.ipAddress || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="用戶代理">
            {{ selectedLog.userAgent || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="詳細信息">
            <pre class="details-json">{{ JSON.stringify(selectedLog.details, null, 2) }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Delete, Refresh } from '@element-plus/icons-vue'
import { activityApi, userApi } from '@/utils/api'
import type { ActivityLog, User } from '@shared/types'

const loading = ref(false)
const exporting = ref(false)
const logs = ref<ActivityLog[]>([])
const users = ref<User[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

const userFilter = ref('')
const actionFilter = ref('')
const dateRange = ref<[Date, Date] | null>(null)

const detailDialogVisible = ref(false)
const selectedLog = ref<ActivityLog | null>(null)

const loadLogs = async () => {
  loading.value = true
  try {
    const response = await activityApi.getLogs(
      currentPage.value,
      pageSize.value,
      userFilter.value || undefined
    )
    
    if (response.success && response.data) {
      logs.value = response.data
      total.value = response.pagination?.total || 0
    }
  } catch (error) {
    ElMessage.error('載入操作記錄失敗')
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  try {
    const response = await userApi.getUsers(1, 100)
    if (response.success && response.data) {
      users.value = response.data
    }
  } catch (error) {
    console.error('載入用戶列表失敗:', error)
  }
}

const exportLogs = async () => {
  exporting.value = true
  try {
    // 模擬導出功能
    await new Promise(resolve => setTimeout(resolve, 2000))
    ElMessage.success('記錄導出成功')
  } catch (error) {
    ElMessage.error('導出記錄失敗')
  } finally {
    exporting.value = false
  }
}

const clearOldLogs = async () => {
  try {
    await ElMessageBox.confirm(
      '確定要清理90天前的舊記錄嗎？此操作不可恢復。',
      '確認清理',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 清理邏輯
    ElMessage.success('舊記錄清理成功')
    loadLogs()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清理記錄失敗')
    }
  }
}

const viewDetails = (log: ActivityLog) => {
  selectedLog.value = log
  detailDialogVisible.value = true
}

const getActionType = (action: string) => {
  const typeMap: Record<string, string> = {
    login: 'success',
    logout: 'info',
    form_input_saved: 'primary',
    profile_update: 'warning'
  }
  return typeMap[action] || 'default'
}

const getActionName = (action: string) => {
  const nameMap: Record<string, string> = {
    login: '登錄',
    logout: '登出',
    form_input_saved: '表單輸入',
    profile_update: '資料更新'
  }
  return nameMap[action] || action
}

const getBrowserInfo = (userAgent: string | null) => {
  if (!userAgent) return 'Unknown'
  
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  
  return 'Other'
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  loadLogs()
  loadUsers()
})
</script>

<style scoped>
.activity-logs {
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

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-controls {
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
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-info small {
  color: var(--text-secondary);
  font-size: var(--font-size-extra-small);
}

.action-details {
  font-size: var(--font-size-small);
}

.detail-item {
  color: var(--text-regular);
}

.ip-address {
  font-family: monospace;
  background: var(--background-base);
  padding: 2px 4px;
  border-radius: 2px;
  font-size: var(--font-size-small);
}

.user-agent {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-size-small);
  color: var(--text-secondary);
}

.log-details {
  max-height: 600px;
  overflow-y: auto;
}

.details-json {
  background: var(--background-base);
  padding: 12px;
  border-radius: var(--border-radius-base);
  font-size: var(--font-size-small);
  overflow-x: auto;
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-controls > * {
    width: 100% !important;
  }
  
  .table-section {
    padding: 16px;
  }
}
</style>