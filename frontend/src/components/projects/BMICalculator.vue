<template>
  <div class="bmi-calculator">
    <div class="calculator-card">
      <div class="card-header">
        <h3>BMI 計算器</h3>
        <p>計算您的身體質量指數</p>
      </div>
      
      <el-form 
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        size="large"
      >
        <el-form-item label="身高" prop="height">
          <el-input
            v-model.number="formData.height"
            placeholder="請輸入身高"
            type="number"
            :min="100"
            :max="250"
          >
            <template #suffix>cm</template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="體重" prop="weight">
          <el-input
            v-model.number="formData.weight"
            placeholder="請輸入體重"
            type="number"
            :min="30"
            :max="300"
          >
            <template #suffix>kg</template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="calculate" :loading="calculating">
            計算 BMI
          </el-button>
          <el-button @click="reset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
      
      <!-- 結果顯示 -->
      <div v-if="result" class="result-section">
        <div class="result-card">
          <h4>計算結果</h4>
          <div class="bmi-value">
            <span class="value">{{ result.bmi.toFixed(1) }}</span>
            <span class="unit">BMI</span>
          </div>
          <div class="category" :class="getCategoryClass(result.category)">
            {{ result.categoryText }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { Project, BMIData, BMIResult } from '@shared/types'

interface Props {
  project: Project
  lastInputData: Record<string, any>
}

interface Emits {
  (e: 'save-input', data: Record<string, any>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const calculating = ref(false)
const result = ref<BMIResult | null>(null)

const formData = reactive<BMIData>({
  height: 0,
  weight: 0
})

const formRules: FormRules = {
  height: [
    { required: true, message: '請輸入身高', trigger: 'blur' },
    { type: 'number', min: 100, max: 250, message: '身高應在 100-250cm 之間', trigger: 'blur' }
  ],
  weight: [
    { required: true, message: '請輸入體重', trigger: 'blur' },
    { type: 'number', min: 30, max: 300, message: '體重應在 30-300kg 之間', trigger: 'blur' }
  ]
}

const calculate = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    calculating.value = true
    
    try {
      // 模擬計算延遲
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const heightInMeters = formData.height / 100
      const bmi = formData.weight / (heightInMeters * heightInMeters)
      
      let category: BMIResult['category']
      let categoryText: string
      
      if (bmi < 18.5) {
        category = 'underweight'
        categoryText = '體重過輕'
      } else if (bmi < 24) {
        category = 'normal'
        categoryText = '正常體重'
      } else if (bmi < 28) {
        category = 'overweight'
        categoryText = '體重過重'
      } else {
        category = 'obese'
        categoryText = '肥胖'
      }
      
      result.value = {
        ...formData,
        bmi,
        category,
        categoryText
      }
      
      // 保存輸入數據
      emit('save-input', formData)
      
      ElMessage.success('計算完成')
    } catch (error) {
      ElMessage.error('計算失敗')
    } finally {
      calculating.value = false
    }
  })
}

const reset = () => {
  formData.height = 0
  formData.weight = 0
  result.value = null
  formRef.value?.resetFields()
}

const getCategoryClass = (category: BMIResult['category']) => {
  switch (category) {
    case 'underweight':
      return 'category-underweight'
    case 'normal':
      return 'category-normal'
    case 'overweight':
      return 'category-overweight'
    case 'obese':
      return 'category-obese'
    default:
      return ''
  }
}

// 載入上次輸入的數據
onMounted(() => {
  if (props.lastInputData && Object.keys(props.lastInputData).length > 0) {
    Object.assign(formData, props.lastInputData)
  }
})
</script>

<style scoped>
.bmi-calculator {
  max-width: 600px;
  margin: 0 auto;
}

.calculator-card {
  background: var(--background-page);
  border-radius: var(--border-radius-base);
  box-shadow: var(--box-shadow-base);
  padding: 32px;
}

.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.card-header h3 {
  font-size: var(--font-size-large);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.card-header p {
  color: var(--text-secondary);
  margin: 0;
}

.result-section {
  margin-top: 32px;
}

.result-card {
  background: var(--background-base);
  border-radius: var(--border-radius-base);
  padding: 24px;
  text-align: center;
}

.result-card h4 {
  font-size: var(--font-size-medium);
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.bmi-value {
  margin-bottom: 12px;
}

.bmi-value .value {
  font-size: 48px;
  font-weight: 700;
  color: var(--primary-color);
}

.bmi-value .unit {
  font-size: var(--font-size-medium);
  color: var(--text-secondary);
  margin-left: 8px;
}

.category {
  font-size: var(--font-size-medium);
  font-weight: 600;
  padding: 8px 16px;
  border-radius: var(--border-radius-base);
  display: inline-block;
}

.category-underweight {
  background: #e1f3ff;
  color: #409eff;
}

.category-normal {
  background: #f0f9ff;
  color: #67c23a;
}

.category-overweight {
  background: #fdf6ec;
  color: #e6a23c;
}

.category-obese {
  background: #fef0f0;
  color: #f56c6c;
}

@media (max-width: 768px) {
  .calculator-card {
    padding: 24px 16px;
  }
  
  .bmi-value .value {
    font-size: 36px;
  }
}
</style>