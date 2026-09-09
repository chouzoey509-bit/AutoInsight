import type {
  CarCategory,
  CarScatterItem,
  DashboardEnergy,
  DashboardGrowth,
  DashboardOverview,
  DashboardPrice,
  DashboardRegion,
  DashboardTrend,
  EnergyType,
  MetricItem,
  MultiSeries,
  ProportionItem,
  RankingItem
} from '@/types'
import { BRANDS, ENERGY_COLOR, ENERGY_LABEL, ENERGY_TYPES } from './brands'
import { CARS, getPriceBucketLabel, PRICE_BUCKETS } from './cars'
import {
  AVG_PRICE_MONTHLY,
  BRAND_MONTHLY,
  CAR_SERIES,
  CATEGORY_MONTHLY,
  ENERGY_MONTHLY,
  ICE_MONTHLY,
  MONTHS,
  NATIONAL_MONTHLY,
  NEV_MONTHLY,
  PENETRATION_MONTHLY,
  REGION_MONTHLY,
  REGION_SEEDS,
  avgPrice,
  calcYoy,
  getPriceBucketSales,
  getRegionSales,
  latestPenetration,
  recentValues
} from './sales'
import { round, sum } from './random'

/**
 * 市场分析聚合层
 * ------------------------------------------------------------
 * 所有 Dashboard / Market 图表数据都从这里产出，
 * 保持「同一份底层销量 → 多种聚合口径」的一致性。
 */

/** 模拟数据更新时间（构建期固定，避免每次刷新跳动） */
export const MOCK_UPDATED_AT = '2026-09-01 09:30:00'
export const MOCK_SOURCE = '示例数据集 · AutoInsight Mock'

/** 市场筛选条件 */
export interface MarketFilters {
  year?: number | string
  month?: number | string
  brandId?: number | string
  energyType?: EnergyType | string
  category?: CarCategory | string
  region?: string
  keyword?: string
  /** 月份跨度（默认 12） */
  span?: number
}

const NEV_TYPES: EnergyType[] = ['BEV', 'PHEV']

/** 按筛选条件得到命中的车型 */
function matchCars(f: MarketFilters) {
  const kw = f.keyword?.trim().toLowerCase()
  return CARS.filter((c) => {
    if (kw && !`${c.brand}${c.name}${c.category}`.toLowerCase().includes(kw)) return false
    if (f.brandId && c.brandId !== Number(f.brandId)) return false
    if (f.energyType && c.energyType !== f.energyType) return false
    if (f.category && c.category !== f.category) return false
    return true
  })
}

/** 解析筛选条件对应的月份窗口（返回 MONTHS 下标） */
function monthWindow(f: MarketFilters): number[] {
  const span = Number(f.span ?? 12)
  if (f.year && f.month) {
    const target = `${f.year}-${String(f.month).padStart(2, '0')}`
    const idx = MONTHS.indexOf(target)
    if (idx >= 0) return [idx]
  }
  if (f.year) {
    const idxs: number[] = []
    MONTHS.forEach((m, i) => {
      if (m.startsWith(String(f.year))) idxs.push(i)
    })
    if (idxs.length) return idxs
  }
  const end = MONTHS.length
  return Array.from({ length: Math.min(span, end) }, (_, i) => end - Math.min(span, end) + i)
}

/** 地区筛选对应的缩放系数 */
function regionFactor(f: MarketFilters): number {
  if (!f.region) return 1
  const seed = REGION_SEEDS.find((r) => r.name === f.region)
  if (!seed) return 1
  const total = sum(REGION_SEEDS.map((r) => r.weight))
  return seed.weight / total
}

function windowMonths(idxs: number[]): string[] {
  return idxs.map((i) => MONTHS[i])
}

/* ============================ 首页 Dashboard ============================ */

export function getDashboardOverview(): DashboardOverview {
  const totalIdx = MONTHS.length - 12
  const national12 = NATIONAL_MONTHLY.slice(totalIdx)
  const nev12 = NEV_MONTHLY.slice(totalIdx)
  const total = sum(national12)
  const nev = sum(nev12)

  const topBrand = [...BRANDS].sort((a, b) => (b.annualSales ?? 0) - (a.annualSales ?? 0))[0]

  const metrics: MetricItem[] = [
    {
      key: 'national',
      label: '全国汽车销量',
      value: total,
      unit: '辆',
      change: calcYoy(NATIONAL_MONTHLY),
      trend: recentValues(NATIONAL_MONTHLY, 12),
      tone: 'brand',
      format: 'int',
      hint: '最近 12 个月累计'
    },
    {
      key: 'nev',
      label: '新能源汽车销量',
      value: nev,
      unit: '辆',
      change: calcYoy(NEV_MONTHLY),
      trend: recentValues(NEV_MONTHLY, 12),
      tone: 'nev',
      format: 'int',
      hint: '纯电 + 插电混动'
    },
    {
      key: 'penetration',
      label: '新能源渗透率',
      value: latestPenetration(),
      unit: '%',
      change: round(latestPenetration() - PENETRATION_MONTHLY[MONTHS.length - 13], 1),
      trend: recentValues(PENETRATION_MONTHLY, 12),
      tone: 'cyan',
      format: 'percent',
      hint: '最近完整月'
    },
    {
      key: 'price',
      label: '平均成交价格',
      value: avgPrice(),
      unit: '万元',
      change: round(
        ((AVG_PRICE_MONTHLY[MONTHS.length - 1] - AVG_PRICE_MONTHLY[MONTHS.length - 13]) /
          AVG_PRICE_MONTHLY[MONTHS.length - 13]) *
          100,
        1
      ),
      trend: recentValues(AVG_PRICE_MONTHLY, 12),
      tone: 'warn',
      format: 'price',
      hint: '销量加权'
    },
    {
      key: 'hotBrand',
      label: '热门汽车品牌',
      value: topBrand.annualSales ?? 0,
      unit: '辆',
      change: round(((topBrand.annualSales ?? 0) / total) * 100, 1),
      trend: recentValues(BRAND_MONTHLY[topBrand.id], 12),
      tone: 'purple',
      format: 'text',
      text: topBrand.name,
      hint: '年销量领先品牌'
    }
  ]

  const hotBrands: RankingItem[] = [...BRANDS]
    .sort((a, b) => (b.annualSales ?? 0) - (a.annualSales ?? 0))
    .slice(0, 8)
    .map((b) => ({
      name: b.name,
      value: b.annualSales ?? 0,
      share: round((b.annualSales ?? 0) / total, 4),
      yoy: round(calcYoy(BRAND_MONTHLY[b.id]), 1)
    }))

  return {
    metrics,
    hotBrands,
    updatedAt: MOCK_UPDATED_AT,
    source: MOCK_SOURCE,
    isMock: true
  }
}

export function getDashboardTrend(span = 18): DashboardTrend {
  const months = MONTHS.slice(-span)
  return {
    months,
    total: NATIONAL_MONTHLY.slice(-span),
    nev: NEV_MONTHLY.slice(-span),
    ice: ICE_MONTHLY.slice(-span),
    yoy: months.map((_, i) => {
      const idx = MONTHS.length - span + i
      const prev = NATIONAL_MONTHLY[idx - 12]
      return prev ? round(((NATIONAL_MONTHLY[idx] - prev) / prev) * 100, 1) : 0
    }),
    updatedAt: MOCK_UPDATED_AT,
    source: MOCK_SOURCE,
    isMock: true
  }
}

export function getBrandRanking(limit = 10, span = 12): RankingItem[] {
  const from = MONTHS.length - span
  const total = sum(NATIONAL_MONTHLY.slice(from))
  return BRANDS.map((b) => {
    const value = sum(BRAND_MONTHLY[b.id].slice(from))
    return {
      name: b.name,
      value,
      share: round(value / total, 4),
      yoy: round(calcYoy(BRAND_MONTHLY[b.id]), 1)
    }
  })
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

export function getCarRanking(limit = 10): RankingItem[] {
  return [...CARS]
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limit)
    .map((c) => ({
      name: `${c.brand} ${c.name}`,
      value: c.sales,
      yoy: round(calcYoy(CAR_SERIES[c.id]), 1),
      extra: ENERGY_LABEL[c.energyType]
    }))
}

export function getDashboardEnergy(): DashboardEnergy {
  const i = MONTHS.length - 1
  const total = NATIONAL_MONTHLY[i]
  const proportion: ProportionItem[] = ENERGY_TYPES.map((e) => ({
    name: ENERGY_LABEL[e],
    value: ENERGY_MONTHLY[e][i],
    ratio: round(ENERGY_MONTHLY[e][i] / total, 4)
  }))

  const months = MONTHS.slice(-12)
  const from = MONTHS.length - 12
  const monthly: MultiSeries = {
    months,
    series: ENERGY_TYPES.map((e) => ({
      name: ENERGY_LABEL[e],
      data: ENERGY_MONTHLY[e].slice(from),
      type: 'line'
    }))
  }

  return { proportion, monthly, updatedAt: MOCK_UPDATED_AT, source: MOCK_SOURCE, isMock: true }
}

export function getDashboardRegion(span = 12): DashboardRegion {
  const regions = getRegionSales(span)
  const topPenetration = [...regions].sort((a, b) => (b.penetration ?? 0) - (a.penetration ?? 0)).slice(0, 8)
  return { regions, topPenetration, updatedAt: MOCK_UPDATED_AT, source: MOCK_SOURCE, isMock: true }
}

export function getDashboardPrice(): DashboardPrice {
  return {
    buckets: getPriceBucketSales(),
    updatedAt: MOCK_UPDATED_AT,
    source: MOCK_SOURCE,
    isMock: true
  }
}

export function getDashboardGrowth(span = 12): DashboardGrowth {
  const from = MONTHS.length - span
  const months = MONTHS.slice(from)
  const marketSize = NATIONAL_MONTHLY.slice(from).map((v) => round((v * avgPrice()) / 10000, 2))
  const growth = months.map((_, i) => {
    const idx = from + i
    const prev = NATIONAL_MONTHLY[idx - 1]
    return prev ? round(((NATIONAL_MONTHLY[idx] - prev) / prev) * 100, 1) : 0
  })
  return { months, marketSize, growth, updatedAt: MOCK_UPDATED_AT, source: MOCK_SOURCE, isMock: true }
}

/** 价格—销量散点（气泡大小为评分） */
export function getCarScatter(limit = 60): CarScatterItem[] {
  return [...CARS]
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limit)
    .map((c) => ({
      name: c.name,
      brand: c.brand,
      price: c.price,
      sales: c.sales,
      rating: c.rating,
      energyType: ENERGY_LABEL[c.energyType]
    }))
}

/* ============================ 市场分析页 ============================ */

/** 市场销量趋势（总销量 / 新能源 / 燃油） */
export function getMarketTrend(f: MarketFilters): MultiSeries {
  const cars = matchCars(f)
  const idxs = monthWindow(f)
  const rf = regionFactor(f)
  const nevCars = cars.filter((c) => NEV_TYPES.includes(c.energyType))
  const iceCars = cars.filter((c) => !NEV_TYPES.includes(c.energyType))

  const pick = (list: typeof cars) => idxs.map((i) => Math.round(sum(list.map((c) => CAR_SERIES[c.id][i])) * rf))

  return {
    months: windowMonths(idxs),
    series: [
      { name: '总销量', data: pick(cars), type: 'line' },
      { name: '新能源', data: pick(nevCars), type: 'line' },
      { name: '燃油车', data: pick(iceCars), type: 'line' }
    ]
  }
}

/** 品牌市场份额（堆叠面积，TOP6 + 其他） */
export function getMarketShare(f: MarketFilters): MultiSeries {
  const idxs = monthWindow(f)
  const rf = regionFactor(f)
  const cars = matchCars({ ...f, brandId: undefined })
  const carIds = new Set(cars.map((c) => c.id))

  const brandTotals = BRANDS.map((b) => {
    const list = cars.filter((c) => c.brandId === b.id)
    const value = sum(list.map((c) => c.sales))
    return { brand: b, list, value }
  }).sort((a, b) => b.value - a.value)

  const top = brandTotals.slice(0, 6)
  const restIds = new Set<number>()
  brandTotals.slice(6).forEach((b) => b.list.forEach((c) => restIds.add(c.id)))

  const series = top.map((b) => ({
    name: b.brand.name,
    type: 'line' as const,
    data: idxs.map((i) => {
      const v = sum(b.list.map((c) => CAR_SERIES[c.id][i]))
      const total = sum(Array.from(carIds).map((id) => CAR_SERIES[id][i]))
      return total ? round((v / total) * 100, 2) : 0
    })
  }))

  series.push({
    name: '其他',
    type: 'line' as const,
    data: idxs.map((i) => {
      const v = sum(Array.from(restIds).map((id) => CAR_SERIES[id][i]))
      const total = sum(Array.from(carIds).map((id) => CAR_SERIES[id][i]))
      return total ? round((v / total) * 100, 2) : 0
    })
  })

  return { months: windowMonths(idxs), series }
}

/** 新能源渗透率趋势 */
export function getMarketPenetration(f: MarketFilters): { months: string[]; values: number[] } {
  const cars = matchCars(f)
  const idxs = monthWindow(f)
  const nevCars = cars.filter((c) => NEV_TYPES.includes(c.energyType))
  const values = idxs.map((i) => {
    const total = sum(cars.map((c) => CAR_SERIES[c.id][i]))
    const nev = sum(nevCars.map((c) => CAR_SERIES[c.id][i]))
    return total ? round((nev / total) * 100, 1) : 0
  })
  return { months: windowMonths(idxs), values }
}

/** 各地区销量（受其他筛选联动，按地区份额折算） */
export function getMarketRegion(f: MarketFilters) {
  const cars = matchCars(f)
  const idxs = monthWindow(f)
  const base = idxs.map((i) => sum(cars.map((c) => CAR_SERIES[c.id][i])))
  const totalWeight = sum(REGION_SEEDS.map((r) => r.weight))

  if (f.region) {
    const seed = REGION_SEEDS.find((r) => r.name === f.region)
    if (seed) {
      return [
        {
          name: seed.name,
          value: Math.round(sum(base) * (seed.weight / totalWeight)),
          penetration: seed.penetration,
          yoy: 6.8
        }
      ]
    }
  }

  return REGION_SEEDS.map((r) => {
    const arr = REGION_MONTHLY[r.name]
    const cur = sum(idxs.map((i) => arr[i]))
    // 用筛选后的量级与原始量级之比进行缩放
    const rawIdxTotal = sum(idxs.map((i) => NATIONAL_MONTHLY[i]))
    const scale = rawIdxTotal ? sum(base) / rawIdxTotal : 1
    return {
      name: r.name,
      value: Math.round(cur * scale),
      penetration: r.penetration,
      yoy: round((cur % 90) / 10 + 2, 1)
    }
  }).sort((a, b) => b.value - a.value)
}

/** 各能源类型销量 */
export function getMarketEnergy(f: MarketFilters): ProportionItem[] {
  const cars = matchCars(f)
  const idxs = monthWindow(f)
  const rf = regionFactor(f)
  const total = sum(cars.map((c) => sum(idxs.map((i) => CAR_SERIES[c.id][i])))) * rf
  return ENERGY_TYPES.map((e) => {
    const list = cars.filter((c) => c.energyType === e)
    const value = sum(list.map((c) => sum(idxs.map((i) => CAR_SERIES[c.id][i])))) * rf
    return {
      name: ENERGY_LABEL[e],
      value: Math.round(value),
      ratio: total ? round(value / total, 4) : 0
    }
  }).filter((i) => i.value > 0)
}

/** 各价格区间销量 */
export function getMarketPrice(f: MarketFilters): { label: string; value: number }[] {
  const cars = matchCars(f)
  const idxs = monthWindow(f)
  const rf = regionFactor(f)
  const buckets = new Map<string, number>()
  PRICE_BUCKETS.forEach((b) => buckets.set(b.label, 0))
  for (const c of cars) {
    const label = getPriceBucketLabel(c.price)
    const v = sum(idxs.map((i) => CAR_SERIES[c.id][i]))
    buckets.set(label, (buckets.get(label) ?? 0) + v)
  }
  return PRICE_BUCKETS.map((b) => ({ label: b.label, value: Math.round((buckets.get(b.label) ?? 0) * rf) }))
}

/** 热门品牌排行榜 */
export function getMarketBrandRank(f: MarketFilters, limit = 10): RankingItem[] {
  const cars = matchCars({ ...f, brandId: undefined })
  const idxs = monthWindow(f)
  const rf = regionFactor(f)
  const total = sum(cars.map((c) => sum(idxs.map((i) => CAR_SERIES[c.id][i])))) * rf
  return BRANDS.map((b) => {
    const list = cars.filter((c) => c.brandId === b.id)
    const value = sum(list.map((c) => sum(idxs.map((i) => CAR_SERIES[c.id][i])))) * rf
    return {
      name: b.name,
      value: Math.round(value),
      share: total ? round(value / total, 4) : 0,
      yoy: round(calcYoy(BRAND_MONTHLY[b.id]), 1)
    }
  })
    .filter((i) => i.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

/** 车型类别销量（市场分析页补充维度） */
export function getMarketCategory(f: MarketFilters): ProportionItem[] {
  const cars = matchCars(f)
  const idxs = monthWindow(f)
  const cats = ['轿车', 'SUV', 'MPV', '跑车', '皮卡']
  const total = sum(cars.map((c) => sum(idxs.map((i) => CAR_SERIES[c.id][i]))))
  return cats
    .map((cat) => {
      const list = cars.filter((c) => c.category === cat)
      const value = sum(list.map((c) => sum(idxs.map((i) => CAR_SERIES[c.id][i]))))
      return { name: cat, value, ratio: total ? round(value / total, 4) : 0 }
    })
    .filter((i) => i.value > 0)
}

/** 车型类别月度趋势（全局，含真实 CATEGORY_MONTHLY） */
export function getCategoryTrend(span = 12): MultiSeries {
  const from = MONTHS.length - span
  return {
    months: MONTHS.slice(from),
    series: Object.keys(CATEGORY_MONTHLY).map((k) => ({
      name: k,
      data: CATEGORY_MONTHLY[k].slice(from),
      type: 'bar' as const
    }))
  }
}

/** 能源色板（图表组件复用） */
export function energyColorMap(): Record<string, string> {
  return {
    [ENERGY_LABEL.BEV]: ENERGY_COLOR.BEV,
    [ENERGY_LABEL.PHEV]: ENERGY_COLOR.PHEV,
    [ENERGY_LABEL.HEV]: ENERGY_COLOR.HEV,
    [ENERGY_LABEL.ICE]: ENERGY_COLOR.ICE
  }
}
