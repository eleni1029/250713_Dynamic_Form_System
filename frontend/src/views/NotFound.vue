<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-image">
        <el-icon size="120" color="#909399">
          <Warning />
        </el-icon>
      </div>
      
      <h1 class="error-title">404</h1>
      <h2 class="error-subtitle">頁面未找到</h2>
      <p class="error-description">
        抱歉，您訪問的頁面不存在或已被移除。
      </p>
      
      <div class="error-actions">
        <el-button type="primary" size="large" @click="goHome">
          返回首頁
        </el-button>
        <el-button size="large" @click="goBack">
          返回上頁
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Warning } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background-base);
  padding: 20px;
}

.not-found-content {
  text-align: center;
  max-width: 500px;
}

.error-image {
  margin-bottom: 32px;
}

.error-title {
  font-size: 72px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  line-height: 1;
}

.error-subtitle {
  font-size: var(--font-size-extra-large);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.error-description {
  font-size: var(--font-size-medium);
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .error-title {
    font-size: 48px;
  }
  
  .error-subtitle {
    font-size: var(--font-size-large);
  }
  
  .error-description {
    font-size: var(--font-size-base);
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .error-actions .el-button {
    width: 200px;
  }
}
</style>