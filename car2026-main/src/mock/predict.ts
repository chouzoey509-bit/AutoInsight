import type { PredictQuery, PredictResult } from '@/types'
import { CARS } from './cars'
import { MONTHS, CAR_SERIES, NATIONAL_MONTHLY } from './sales'
import { clamp, createRng, round, sum } from './random'
import { MOCK_UPDATED_AT } from './market'

/**
 * 销量预测 —— 后端算法服务模拟
 * ------------------------------------------------------------
 * 模拟 XGBoost / LSTM 时序预测服务的返回结构，
 * 真实环境由 FastAPI 提供 GET /api/predict/sales，前端无需改动。
 */

const SEASONAL = [0.88, 0.64, 1.02, 1.0, 1.05, 1.09, 0.94, 0.98, 1.08, 1.06, 1.13, 1.24]

export function predictSales(query: PredictQuery): PredictResult {
  const carId = query.carId ?? 1
  const car = CARS.find((c) => c.id === carId) ?? CARS[0]
  const horizon = query.horizon ?? 6
  const rng = createRng(`predict-${car.id}-${horizon}`)

  const series = CAR_SERIES[car.id] ?? NATIONAL_MONTHLY
  const historyMonths = MONTHS.slice(-12)
  const historyValues = series.slice(-12)
  const history = historyMonths.map((month, i) => ({ month, value: historyValues[i] }))

  // 基于历史最近 6 个月线性趋势外推
  const recent = historyValues.slice(-6)
  const firstHalf = sum(recent.slice(0, 3)) / 3
  const secondHalf = sum(recent.slice(3)) / 3
  const trendRate = clamp((secondHalf - firstHalf) / (firstHalf || 1), -0.28, 0.36)

  const base = secondHalf
  const prediction: PredictResult['prediction'] = []
  let lastMonth = MONTHS[MONTHS.length - 1]

  for (let i = 1; i <= horizon; i++) {
    const [y, m] = lastMonth.split('-').map(Number)
    const total = y * 12 + (m - 1) + i
    const ny = Math.floor(total / 12)
    const nm = (total % 12) + 1
    const month = `${ny}-${String(nm).padStart(2, '0')}`

    const seasonal = SEASONAL[nm - 1]
    const trend = 1 + (trendRate * i) / horizon
    const noise = rng.float(0.94, 1.06)
    const value = Math.max(60, Math.round(base * seasonal * trend * noise))

    // 置信区间随预测步长递增（不确定性随时间放大）
    const band = clamp(0.045 + i * 0.012, 0.05, 0.22)
    prediction.push({
      month,
      value,
      lower: Math.max(30, Math.round(value * (1 - band))),
      upper: Math.round(value * (1 + band))
    })
  }

  const predValues = prediction.map((p) => p.value)
  const histAvg = sum(historyValues.slice(-3)) / 3
  const predAvg = sum(predValues) / predValues.length
  const growthRate = round(((predAvg - histAvg) / histAvg) * 100, 1)
  const peak = prediction.reduce((a, b) => (b.value > a.value ? b : a), prediction[0])
  const low = prediction.reduce((a, b) => (b.value < a.value ? b : a), prediction[0])

  const accuracy = round(clamp(0.9 - horizon * 0.004 + rng.float(-0.02, 0.035), 0.78, 0.96), 3)

  return {
    carId: car.id,
    carName: `${car.brand} ${car.name}`,
    brand: car.brand,
    model: horizon >= 12 ? 'XGBoost + 季节因子融合' : 'XGBoost',
    accuracy,
    horizon,
    history,
    prediction,
    updatedAt: MOCK_UPDATED_AT,
    growthRate,
    peakMonth: peak?.month,
    lowMonth: low?.month,
    isMock: true,
    features: [
      { name: '近6月销量趋势', importance: round(rng.float(0.22, 0.32), 3) },
      { name: '季节性因子', importance: round(rng.float(0.14, 0.22), 3) },
      { name: '同级别竞品销量', importance: round(rng.float(0.1, 0.18), 3) },
      { name: '品牌热度指数', importance: round(rng.float(0.08, 0.15), 3) },
      { name: '价格变动幅度', importance: round(rng.float(0.06, 0.12), 3) },
      { name: '区域需求结构', importance: round(rng.float(0.04, 0.09), 3) }
    ]
  }
}
