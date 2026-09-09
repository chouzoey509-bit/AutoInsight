import { ref } from 'vue'
import { defineStore } from 'pinia'
import { predictApi } from '@/api/predict'
import type { PredictResult } from '@/types'

/**
 * 销量预测 Store
 * 预测条件 + 预测结果（含置信区间、模型信息）
 */
export const usePredictStore = defineStore('predict', () => {
  const carId = ref<number | undefined>(undefined)
  const horizon = ref<3 | 6 | 12>(6)
  const result = ref<PredictResult | null>(null)
  const loading = ref(false)
  const error = ref('')

  async function run(payload?: { carId?: number; horizon?: 3 | 6 | 12 }): Promise<void> {
    if (payload?.carId !== undefined) carId.value = payload.carId
    if (payload?.horizon) horizon.value = payload.horizon
    if (carId.value === undefined) {
      error.value = '请先选择车型'
      return
    }
    loading.value = true
    error.value = ''
    try {
      result.value = await predictApi.sales({ carId: carId.value, horizon: horizon.value })
    } catch (e) {
      error.value = e instanceof Error ? e.message : '预测服务调用失败'
      result.value = null
    } finally {
      loading.value = false
    }
  }

  function reset(): void {
    result.value = null
    error.value = ''
  }

  return { carId, horizon, result, loading, error, run, reset }
})
