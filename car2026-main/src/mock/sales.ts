import type { EnergyType, RegionSalesItem, SeriesPoint } from '@/types'
import { CARS, getCarSalesBase, getPriceBucketLabel, PRICE_BUCKETS } from './cars'
import { BRANDS, ENERGY_TYPES } from './brands'
import { buildMonths, clamp, createRng, round, sum } from './random'

/**
 * 销量时间序列（24 个月）
 * ------------------------------------------------------------
 * 生成链路：
 *   车型基础量级 → 月度季节性 + 增长趋势 + 随机扰动 → 全局校准
 * 全局校准保证「全国月销量」落在合理量级（约 200 万辆/月），
 * 使品牌、能源、地区等所有聚合口径互相自洽。
 */

/** 数据截止月份（最近一个完整月） */
export const LATEST_YEAR = 2026
export const LATEST_MONTH = 8

/** 24 个月份序列：2024-09 ~ 2026-08 */
export const MONTHS: string[] = buildMonths(24, LATEST_YEAR, LATEST_MONTH)

/** 月度季节因子（1 月春节前置、2 月春节假期低点、年末冲量） */
const SEASONAL = [0.88, 0.64, 1.02, 1.0, 1.05, 1.09, 0.94, 0.98, 1.08, 1.06, 1.13, 1.24]

/** 全国年度目标销量（用于校准，非真实统计值） */
const TARGET_ANNUAL = 23_600_000

/** 车型月度销量序列 carId → number[]（与 MONTHS 等长） */
const RAW_SERIES: Record<number, number[]> = {}

for (const car of CARS) {
  const base = getCarSalesBase(car)
  const rng = createRng(`series-${car.id}`)
  const isNev = car.energyType === 'BEV' || car.energyType === 'PHEV'
  // 新能源整体处于增长通道，燃油车缓慢下行
  const growth = isNev ? rng.float(0.12, 0.52) : rng.float(-0.22, 0.06)
  const arr: number[] = []
  for (let i = 0; i < MONTHS.length; i++) {
    const m = Number(MONTHS[i].split('-')[1])
    const trend = 1 + (growth * i) / MONTHS.length
    const noise = rng.float(0.86, 1.14)
    const ramp = i < 3 ? 0.72 + i * 0.1 : 1 // 早期爬坡
    arr.push(base * trend * SEASONAL[m - 1] * noise * ramp)
  }
  RAW_SERIES[car.id] = arr
}

/** 校准系数：让最近 12 个月总量接近目标 */
const last12Raw = sum(
  CARS.map((c) => sum(RAW_SERIES[c.id].slice(MONTHS.length - 12)))
)
const SCALE = TARGET_ANNUAL / last12Raw

/** 最终车型月度销量（整数） */
export const CAR_SERIES: Record<number, number[]> = {}
for (const car of CARS) {
  CAR_SERIES[car.id] = RAW_SERIES[car.id].map((v) => Math.max(30, Math.round(v * SCALE)))
}

/** 回填车型聚合销量与市场排名 */
CARS.forEach((car) => {
  const s = CAR_SERIES[car.id]
  car.sales = sum(s.slice(MONTHS.length - 12))
  car.lastMonthSales = s[s.length - 1]
})
;[...CARS]
  .sort((a, b) => b.sales - a.sales)
  .forEach((car, index) => {
    car.rank = index + 1
  })
BRANDS.forEach((b) => {
  const list = CARS.filter((c) => c.brandId === b.id)
  b.modelCount = list.length
  b.annualSales = sum(list.map((c) => c.sales))
})

/** 全国月度总销量 */
export const NATIONAL_MONTHLY: number[] = MONTHS.map((_, i) => sum(CARS.map((c) => CAR_SERIES[c.id][i])))

/** 能源类型月度销量 */
export const ENERGY_MONTHLY: Record<EnergyType, number[]> = {
  BEV: [],
  PHEV: [],
  HEV: [],
  ICE: []
}
MONTHS.forEach((_, i) => {
  for (const e of ENERGY_TYPES) {
    ENERGY_MONTHLY[e][i] = sum(CARS.filter((c) => c.energyType === e).map((c) => CAR_SERIES[c.id][i]))
  }
})

/** 新能源月度销量（BEV + PHEV，含 HEV 不计入新能源） */
export const NEV_MONTHLY: number[] = MONTHS.map((_, i) => ENERGY_MONTHLY.BEV[i] + ENERGY_MONTHLY.PHEV[i])
export const ICE_MONTHLY: number[] = MONTHS.map((_, i) => ENERGY_MONTHLY.HEV[i] + ENERGY_MONTHLY.ICE[i])

/** 品牌月度销量 */
export const BRAND_MONTHLY: Record<number, number[]> = {}
for (const b of BRANDS) {
  const list = CARS.filter((c) => c.brandId === b.id)
  BRAND_MONTHLY[b.id] = MONTHS.map((_, i) => sum(list.map((c) => CAR_SERIES[c.id][i])))
}

/** 车型类别月度销量 */
export const CATEGORY_MONTHLY: Record<string, number[]> = {}
for (const cat of ['轿车', 'SUV', 'MPV', '跑车', '皮卡']) {
  const list = CARS.filter((c) => c.category === cat)
  CATEGORY_MONTHLY[cat] = MONTHS.map((_, i) => sum(list.map((c) => CAR_SERIES[c.id][i])))
}

/* ============================ 地区维度 ============================ */

interface RegionSeed {
  name: string
  /** 市场份额权重 */
  weight: number
  /** 新能源渗透率 % */
  penetration: number
}

/** 34 个省级行政区（份额为模拟值，仅用于示例演示） */
export const REGION_SEEDS: RegionSeed[] = [
  { name: '广东省', weight: 10.8, penetration: 56.2 },
  { name: '江苏省', weight: 8.2, penetration: 49.1 },
  { name: '山东省', weight: 7.6, penetration: 38.4 },
  { name: '浙江省', weight: 7.1, penetration: 54.8 },
  { name: '河南省', weight: 6.0, penetration: 41.2 },
  { name: '四川省', weight: 5.2, penetration: 45.6 },
  { name: '河北省', weight: 4.8, penetration: 36.8 },
  { name: '湖北省', weight: 4.1, penetration: 43.5 },
  { name: '湖南省', weight: 3.9, penetration: 42.1 },
  { name: '安徽省', weight: 3.8, penetration: 44.9 },
  { name: '上海市', weight: 3.2, penetration: 68.5 },
  { name: '北京市', weight: 3.0, penetration: 51.2 },
  { name: '福建省', weight: 3.0, penetration: 47.3 },
  { name: '陕西省', weight: 2.6, penetration: 44.1 },
  { name: '江西省', weight: 2.4, penetration: 39.7 },
  { name: '重庆市', weight: 2.4, penetration: 50.6 },
  { name: '辽宁省', weight: 2.3, penetration: 33.9 },
  { name: '山西省', weight: 2.0, penetration: 34.5 },
  { name: '广西壮族自治区', weight: 2.0, penetration: 46.8 },
  { name: '云南省', weight: 1.9, penetration: 37.6 },
  { name: '天津市', weight: 1.6, penetration: 46.2 },
  { name: '贵州省', weight: 1.6, penetration: 35.8 },
  { name: '黑龙江省', weight: 1.3, penetration: 26.4 },
  { name: '吉林省', weight: 1.2, penetration: 28.1 },
  { name: '内蒙古自治区', weight: 1.2, penetration: 27.5 },
  { name: '新疆维吾尔自治区', weight: 1.1, penetration: 25.9 },
  { name: '甘肃省', weight: 1.0, penetration: 30.2 },
  { name: '海南省', weight: 0.7, penetration: 62.4 },
  { name: '宁夏回族自治区', weight: 0.5, penetration: 29.6 },
  { name: '青海省', weight: 0.4, penetration: 28.3 },
  { name: '西藏自治区', weight: 0.2, penetration: 22.7 },
  { name: '台湾省', weight: 1.4, penetration: 21.5 },
  { name: '香港特别行政区', weight: 0.5, penetration: 58.3 },
  { name: '澳门特别行政区', weight: 0.2, penetration: 52.7 }
]

export const REGION_NAMES: string[] = REGION_SEEDS.map((r) => r.name)

const REGION_WEIGHT_TOTAL = sum(REGION_SEEDS.map((r) => r.weight))

/** 地区 × 月份 销量矩阵 */
export const REGION_MONTHLY: Record<string, number[]> = {}
for (const region of REGION_SEEDS) {
  const rng = createRng(`region-${region.name}`)
  REGION_MONTHLY[region.name] = MONTHS.map((_, i) =>
    Math.round((NATIONAL_MONTHLY[i] * region.weight) / REGION_WEIGHT_TOTAL * rng.float(0.94, 1.06))
  )
}

/** 地区近 12 个月销量汇总 */
export function getRegionSales(months = 12): RegionSalesItem[] {
  const from = Math.max(0, MONTHS.length - months)
  return REGION_SEEDS.map((r) => {
    const arr = REGION_MONTHLY[r.name]
    const cur = sum(arr.slice(from))
    const prevFrom = Math.max(0, from - 12)
    const prev = sum(arr.slice(prevFrom, from)) || cur
    return {
      name: r.name,
      value: cur,
      yoy: round(((cur - prev) / prev) * 100, 1),
      penetration: round(r.penetration + (cur % 7) / 10, 1)
    }
  }).sort((a, b) => b.value - a.value)
}

/** 价格区间销量分布 */
export function getPriceBucketSales(carIds?: Set<number>): { label: string; value: number }[] {
  const buckets = new Map<string, number>()
  PRICE_BUCKETS.forEach((b) => buckets.set(b.label, 0))
  for (const car of CARS) {
    if (carIds && !carIds.has(car.id)) continue
    const label = getPriceBucketLabel(car.price)
    buckets.set(label, (buckets.get(label) ?? 0) + car.sales)
  }
  return PRICE_BUCKETS.map((b) => ({ label: b.label, value: buckets.get(b.label) ?? 0 }))
}

/** 取最近 n 个月份 */
export function recentMonths(n: number): string[] {
  return MONTHS.slice(Math.max(0, MONTHS.length - n))
}

/** 取最近 n 个月的数值切片 */
export function recentValues(arr: number[], n: number): number[] {
  return arr.slice(Math.max(0, arr.length - n))
}

/** 月份序列 → SeriesPoint[] */
export function toPoints(months: string[], values: number[]): SeriesPoint[] {
  return months.map((month, i) => ({ month, value: values[i] ?? 0 }))
}

/** 计算同比（最近 12 个月 vs 前 12 个月） */
export function calcYoy(arr: number[]): number {
  const cur = sum(arr.slice(12))
  const prev = sum(arr.slice(0, 12))
  if (!prev) return 0
  return round(((cur - prev) / prev) * 100, 1)
}

/** 全国新能源渗透率（最近一个月） */
export function latestPenetration(): number {
  const i = MONTHS.length - 1
  return round((NEV_MONTHLY[i] / NATIONAL_MONTHLY[i]) * 100, 1)
}

/** 渗透率月度序列 */
export const PENETRATION_MONTHLY: number[] = MONTHS.map((_, i) =>
  round((NEV_MONTHLY[i] / NATIONAL_MONTHLY[i]) * 100, 1)
)

/** 平均成交价格（万元），按销量加权 */
export function avgPrice(): number {
  const totalSales = sum(CARS.map((c) => c.sales))
  const weighted = sum(CARS.map((c) => c.price * c.sales))
  return round(weighted / totalSales, 2)
}

export const AVG_PRICE_MONTHLY: number[] = MONTHS.map((_, i) => {
  const total = sum(CARS.map((c) => CAR_SERIES[c.id][i]))
  const weighted = sum(CARS.map((c) => c.price * CAR_SERIES[c.id][i]))
  return round(clamp(weighted / total, 5, 60), 2)
})
