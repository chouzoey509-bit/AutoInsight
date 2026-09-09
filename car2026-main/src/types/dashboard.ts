import type { DataMeta, MultiSeries, ProportionItem, RankingItem, RegionSalesItem, SeriesPoint } from './api'

/** 核心指标卡 */
export interface MetricItem {
  key: string
  label: string
  /** 展示值（已格式化前的原始数值） */
  value: number
  /** 单位，如 辆 / % / 万元 */
  unit: string
  /** 同比变化 %，正为涨 */
  change: number
  /** 迷你趋势数据 */
  trend: number[]
  /** 图标语义色 */
  tone: 'brand' | 'nev' | 'warn' | 'danger' | 'purple' | 'cyan'
  /** 补充说明 */
  hint?: string
  /** 数值格式化方式 */
  format?: 'int' | 'percent' | 'price' | 'text'
  /** 文本型指标值（如热门品牌名） */
  text?: string
}

/** 首页概览 */
export interface DashboardOverview extends DataMeta {
  metrics: MetricItem[]
  /** 热闹品牌榜（热门汽车品牌指标附带） */
  hotBrands: RankingItem[]
}

/** 首页销量趋势 */
export interface DashboardTrend extends DataMeta {
  months: string[]
  /** 全国汽车销量 */
  total: number[]
  /** 新能源销量 */
  nev: number[]
  /** 燃油车销量 */
  ice: number[]
  /** 同比增速 % */
  yoy: number[]
}

/** 能源结构 */
export interface DashboardEnergy extends DataMeta {
  /** 当月各能源类型占比 */
  proportion: ProportionItem[]
  /** 近 12 个月能源结构变化 */
  monthly: MultiSeries
}

/** 地区销量 */
export interface DashboardRegion extends DataMeta {
  regions: RegionSalesItem[]
  /** 渗透率最高的地区 */
  topPenetration: RegionSalesItem[]
}

/** 价格区间分布 */
export interface DashboardPrice extends DataMeta {
  buckets: { label: string; value: number }[]
}

/** 市场增长趋势（散点/面积） */
export interface DashboardGrowth extends DataMeta {
  months: string[]
  /** 市场规模（亿元） */
  marketSize: number[]
  /** 增速 % */
  growth: number[]
}

/** 车型-销量散点 */
export interface CarScatterItem {
  name: string
  brand: string
  /** 价格（万元） */
  price: number
  /** 销量（辆） */
  sales: number
  /** 新能源渗透率贡献（气泡大小） */
  rating: number
  energyType: string
}
