<template>
  <div class="tdee-calculator">
    <div class="calculator-card">
      <div class="card-header">
        <h3>TDEE 計算器</h3>
        <p>計算您的每日總能量消耗</p>
      </div>
      
      <el-form 
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        size="large"
      >
        <el-form-item label="性別" prop="gender">
          <el-radio-group v-model="formData.gender">
            <el-radio value="male">男性</el-radio>
            <el-radio value="female">女性</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="年齡" prop="age">
          <el-input
            v-model.number="formData.age"
            placeholder="請輸入年齡"
            type="number"
            :min="10"
            :max="100"
          >
            <template #suffix>歲</template>
          </el-input>
        </el-form-item>
        
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
        
        <el-form-item label="活動水平" prop="activityLevel">
          <el-select v-model="formData.activityLevel" placeholder="請選擇活動水平" style="width: 100%">
            <el-option value="sedentary" label="久坐不動（辦公室工作，很少運動）" />
            <el-option value="lightly_active" label="輕度活動（每週輕鬆運動1-3天）" />
            <el-option value="moderately_active" label="中度活動（每週中等強度運動3-5天）" />
            <el-option value="very_active" label="高度活動（每週高強度運動6-7天）" />
            <el-option value="extra_active" label="極高活動（每天高強度運動，體力勞動）" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="calculate" :loading="calculating">
            計算 TDEE
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
          
          <div class="result-grid">
            <div class="result-item">
              <div class="result-label">基礎代謝率 (BMR)</div>
              <div class="result-value">{{ result.bmr.toFixed(0) }} <span class="unit">kcal/day</span></div>
            </div>
            
            <div class="result-item primary">
              <div class="result-label">每日總消耗 (TDEE)</div>
              <div class="result-value large">{{ result.tdee.toFixed(0) }} <span class="unit">kcal/day</span></div>
            </div>
          </div>
          
          <div class="activity-info">
            <p class="activity-multiplier">
              活動係數：{{ result.activityMultiplier }}
            </p>
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
import type { Project, TDEEData, TDEEResult } from '@shared/types'

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
const result = ref<TDEEResult | null>(null)

const formData = reactive<TDEEData>({
  gender: 'male',
  age: 0,
  height: 0,
  weight: 0,
  activityLevel: 'sedentary'
})

const formRules: FormRules = {
  gender: [
    { required: true, message: '請選擇性別', trigger: 'change' }
  ],
  age: [
    { required: true, message: '請輸入年齡', trigger: 'blur' },
    { type: 'number', min: 10, max: 100, message: '年齡應在 10-100 歲之間', trigger: 'blur' }
  ],
  height: [
    { required: true, message: '請輸入身高', trigger: 'blur' },
    { type: 'number', min: 100, max: 250, message: '身高應在 100-250cm 之間', trigger: 'blur' }
  ],
  weight: [
    { required: true, message: '請輸入體重', trigger: 'blur' },
    { type: 'number', min: 30, max: 300, message: '體重應在 30-300kg 之間', trigger: 'blur' }
  ],
  activityLevel: [
    { required: true, message: '請選擇活動水平', trigger: 'change' }
  ]
}

const getActivityMultiplier = (level: TDEEData['activityLevel']): number => {
  switch (level) {
    case 'sedentary': return 1.2
    case 'lightly_active': return 1.375
    case 'moderately_active': return 1.55
    case 'very_active': return 1.725
    case 'extra_active': return 1.9
    default: return 1.2
  }
}

const calculateBMR = (data: TDEEData): number => {
  // Mifflin-St Jeor Equation
  if (data.gender === 'male') {
    return 10 * data.weight + 6.25 * data.height - 5 * data.age + 5
  } else {
    return 10 * data.weight + 6.25 * data.height - 5 * data.age - 161
  }
}

const calculate = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    calculating.value = true
    
    try {
      // 模擬計算延遲
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const bmr = calculateBMR(formData)
      const activityMultiplier = getActivityMultiplier(formData.activityLevel)
      const tdee = bmr * activityMultiplier
      
      result.value = {
        ...formData,
        bmr,
        tdee,
        activityMultiplier
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
  Object.assign(formData, {
    gender: 'male',
    age: 0,
    height: 0,
    weight: 0,
    activityLevel: 'sedentary'
  })
  result.value = null
  formRef.value?.resetFields()
}

// 載入上次輸入的數據
onMounted(() => {
  if (props.lastInputData && Object.keys(props.lastInputData).length > 0) {
    Object.assign(formData, props.lastInputData)
  }
})
</script>

<style scoped>
.tdee-calculator {
  max-width: 700px;
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
}

.result-card h4 {
  font-size: var(--font-size-medium);
  color: var(--text-primary);
  margin: 0 0 20px 0;
  text-align: center;
}

.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.result-item {
  background: white;
  border-radius: var(--border-radius-base);
  padding: 20px;
  text-align: center;
  border: 1px solid var(--border-lighter);
}

.result-item.primary {
  border-color: var(--primary-color);
  background: linear-gradient(135deg, #f8fbff, #e8f4ff);
}

.result-label {
  font-size: var(--font-size-small);
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.result-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.result-value.large {
  font-size: 32px;
  color: var(--primary-color);
}

.result-value .unit {
  font-size: var(--font-size-small);
  font-weight: normal;
  color: var(--text-secondary);
}

.activity-info {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid var(--border-lighter);
}

.activity-multiplier {
  color: var(--text-secondary);
  font-size: var(--font-size-small);
  margin: 0;
}

@media (max-width: 768px) {
  .calculator-card {
    padding: 24px 16px;
  }
  
  .result-grid {
    grid-template-columns: 1fr;
  }
  
  .result-value {
    font-size: 20px;
  }
  
  .result-value.large {
    font-size: 28px;
  }
}
</style>