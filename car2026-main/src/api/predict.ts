import type { PredictResult } from '@/types'
import { get } from '@/utils/request'

/**
 * 销量预测接口
 * GET /api/predict/sales?carId=1&horizon=6
 */
export const predictApi = {
  sales(params: { carId?: number; brandId?: number; horizon: 3 | 6 | 12 }): Promise<PredictResult> {
    return get<PredictResult>('/predict/sales', params as Record<string, unknown>)
  }
}
