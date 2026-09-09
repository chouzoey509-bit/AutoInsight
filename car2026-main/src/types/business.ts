/**
 * 汽车行业业务实体类型定义
 * 与后端 FastAPI Pydantic Schema 一一对应，字段命名统一使用 snake_case
 * （前端 API 层负责把 camelCase UI 参数转换为后端所需字段）
 */

import type { PageQuery, SeriesPoint } from './api'

/* ============================ 基础枚举 ============================ */

/** 能源类型：纯电 / 插电混动 / 油电混动 / 燃油 */
export type EnergyType = 'BEV' | 'PHEV' | 'HEV' | 'ICE'

/** 车型类别 */
export type CarCategory = '轿车' | 'SUV' | 'MPV' | '跑车' | '皮卡'

/** 用户角色 */
export type UserRole = 'admin' | 'analyst' | 'sales' | 'user'

/** 用户状态 */
export type UserStatus = 'active' | 'disabled' | 'pending'

/** 订单状态 */
export type OrderStatus = 'pending' | 'paid' | 'delivered' | 'cancelled'

/* ============================ 品牌 ============================ */

export interface Brand {
  id: number
  /** 中文名 */
  name: string
  /** 英文名 */
  nameEn: string
  /** 国别 */
  country: string
  /** 车系阵营：自主 / 新势力 / 德系 / 日系 / 美系 / 韩系 / 欧系 */
  group: string
  /** 品牌主色（用于图形化标识） */
  color: string
  foundedYear: number
  /** 主打能源类型 */
  energyFocus: EnergyType[]
  /** 在售车型数 */
  modelCount?: number
  /** 年销量（辆） */
  annualSales?: number
  status?: 'active' | 'inactive'
}

/* ============================ 车型 ============================ */

export interface Car {
  id: number
  brandId: number
  brand: string
  /** 车型名称 */
  name: string
  /** 车型代号 */
  modelCode: string
  category: CarCategory
  energyType: EnergyType
  /** 指导价（万元） */
  price: number
  /** 终端价格区间（万元） */
  priceMin: number
  priceMax: number
  /** 纯电续航（km） */
  range: number
  /** 电池容量（kWh） */
  battery: number
  /** 最大功率（kW） */
  power: number
  /** 扭矩（N·m） */
  torque: number
  /** 轴距（mm） */
  wheelbase: number
  /** 车身尺寸 长×宽×高（mm） */
  length: number
  width: number
  height: number
  /** 座位数 */
  seats: number
  /** 上市时间 YYYY-MM */
  launchDate: string
  launchYear: number
  /** 近 12 个月累计销量 */
  sales: number
  /** 上月销量 */
  lastMonthSales: number
  /** 用户评分 0~5 */
  rating: number
  /** 智能化评分 0~100 */
  intelligenceScore: number
  /** 舒适性评分 0~100 */
  comfortScore: number
  /** 空间评分 0~100 */
  spaceScore: number
  /** 性能评分 0~100 */
  performanceScore: number
  /** 评价数 */
  reviewCount: number
  /** 车型图片（后端返回；为空时前端使用图形化占位） */
  image?: string
  /** 车型卖点标签 */
  tags: string[]
  /** 市场排名 */
  rank?: number
}

/** 车型查询参数 */
export interface CarQuery extends PageQuery {
  keyword?: string
  brandId?: number | ''
  energyType?: EnergyType | ''
  category?: CarCategory | ''
  priceMin?: number | ''
  priceMax?: number | ''
  year?: number | ''
}

/** 车型销售历史 */
export interface CarSalesHistory {
  carId: number
  carName: string
  points: SeriesPoint[]
  /** 同比增速序列 */
  yoy?: number[]
}

/* ============================ 销量 ============================ */

export interface SalesRecord {
  id: number
  carId: number
  carName: string
  brand: string
  month: string
  sales: number
  /** 销售额（万元） */
  revenue: number
  region: string
  energyType: EnergyType
}

/** 价格区间分布 */
export interface PriceBucket {
  /** 如 "10-15万" */
  label: string
  value: number
  ratio?: number
}

/* ============================ 用户 ============================ */

export interface UserProfile {
  id: number
  username: string
  nickname: string
  email: string
  phone?: string
  role: UserRole
  status: UserStatus
  avatar?: string
  department?: string
  createdAt: string
  lastLoginAt?: string
  lastLoginIp?: string
  loginCount?: number
}

export interface LoginPayload {
  username: string
  password: string
  remember?: boolean
  /** 验证码（后端启用时必填） */
  captcha?: string
}

export interface LoginResult {
  token: string
  refreshToken?: string
  expiresIn?: number
  user: UserProfile
}

/** 管理端用户列表项 */
export interface AdminUserItem extends UserProfile {
  carCount?: number
}

/* ============================ 智能推荐 ============================ */

/** 购车预算区间 */
export type BudgetRange = 'lt10' | '10-15' | '15-20' | '20-30' | 'gt30'

/** 用车场景 */
export type UsageScenario = 'commute' | 'family' | 'business' | 'longtrip' | 'outdoor'

/** 关注因素 */
export type ConcernFactor = 'price' | 'range' | 'performance' | 'space' | 'intelligence' | 'comfort'

/** 推荐请求体（POST /api/recommend） */
export interface RecommendRequest {
  budget: BudgetRange
  energyTypes: EnergyType[]
  scenarios: UsageScenario[]
  /** 省份 */
  province: string
  /** 城市 */
  city: string
  /** 关注因素及权重 0~100 */
  weights: Record<ConcernFactor, number>
  /** 返回条数 */
  topN?: number
}

/** 单维度匹配度 */
export interface ScoreDimension {
  key: string
  label: string
  /** 0~100 */
  score: number
  /** 说明文案 */
  desc?: string
}

/** 推荐结果项 */
export interface Recommendation {
  carId: number
  carName: string
  brand: string
  image?: string
  /** 综合匹配度 0~100 */
  score: number
  /** 一句话推荐理由 */
  reason: string
  price: number
  energyType: EnergyType
  range: number
  rating: number
  /** 各维度匹配度，用于可视化解释 */
  dimensions: ScoreDimension[]
  /** 命中的需求标签 */
  highlights: string[]
}

export interface RecommendResult {
  /** 请求指纹，便于后端缓存/追溯 */
  requestId: string
  /** 算法模型标识 */
  model: string
  generatedAt: string
  isMock: boolean
  recommendations: Recommendation[]
}

/* ============================ 销量预测 ============================ */

export interface PredictQuery {
  carId?: number
  brandId?: number
  /** 预测周期（月） */
  horizon: 3 | 6 | 12
}

export interface PredictPoint {
  month: string
  /** 预测值 */
  value: number
  /** 置信区间下界 */
  lower?: number
  /** 置信区间上界 */
  upper?: number
}

export interface PredictResult {
  carId: number
  carName: string
  brand?: string
  /** 模型名称，如 XGBoost / LSTM / Prophet */
  model: string
  /** 模型准确率 0~1 */
  accuracy: number
  /** 预测周期（月） */
  horizon: number
  /** 历史数据 */
  history: SeriesPoint[]
  /** 预测数据 */
  prediction: PredictPoint[]
  updatedAt: string
  /** 预测增长率 % */
  growthRate?: number
  /** 最高预测月份 */
  peakMonth?: string
  /** 最低预测月份 */
  lowMonth?: string
  isMock: boolean
  /** 特征重要性（模型可解释性） */
  features?: { name: string; importance: number }[]
}

/* ============================ 舆情分析 ============================ */

export type SentimentLabel = 'positive' | 'neutral' | 'negative'

export interface SentimentOverview {
  total: number
  positive: number
  neutral: number
  negative: number
  /** 正面占比 % */
  positiveRate: number
  /** 平均情感分 0~5 */
  avgScore: number
  updatedAt: string
  isMock: boolean
}

export interface SentimentTrend {
  months: string[]
  positive: number[]
  neutral: number[]
  negative: number[]
}

export interface KeywordItem {
  word: string
  /** 出现频次 */
  count: number
  sentiment: SentimentLabel
  /** 权重 0~1，用于词云字号 */
  weight?: number
}

export interface BrandReputation {
  brand: string
  /** 口碑分 0~5 */
  score: number
  positiveRate: number
  mentionCount: number
  /** 环比变化 */
  delta?: number
}

export interface ReviewItem {
  id: number
  carId: number
  carName: string
  brand: string
  user: string
  rating: number
  content: string
  sentiment: SentimentLabel
  createdAt: string
  likes: number
}

/* ============================ 企业管理后台 ============================ */

export interface AdminOverview {
  /** 今日销售（辆） */
  todaySales: number
  /** 本月销量（辆） */
  monthSales: number
  /** 库存数量（辆） */
  inventory: number
  /** 新增用户 */
  newUsers: number
  /** 新增订单 */
  newOrders: number
  /** 推荐调用次数 */
  recommendCount: number
  /** 预测任务数 */
  predictTasks: number
  /** 各项环比 % */
  deltas: Record<string, number>
  updatedAt: string
  isMock: boolean
}

export interface InventoryItem {
  id: number
  carId: number
  carName: string
  brand: string
  /** 库存数量 */
  quantity: number
  /** 在途数量 */
  inbound: number
  /** 月均销量 */
  monthlySales: number
  /** 库存周转天数 */
  turnoverDays: number
  warehouse: string
  status: '充足' | '偏低' | '紧张'
}

export interface OrderItem {
  id: number
  orderNo: string
  carId: number
  carName: string
  brand: string
  customer: string
  amount: number
  status: OrderStatus
  region: string
  createdAt: string
  salesperson: string
}

export interface AlgorithmTask {
  id: number
  name: string
  type: '推荐' | '预测' | '舆情'
  model: string
  version: string
  accuracy: number
  status: 'running' | 'idle' | 'failed' | 'training'
  lastRunAt: string
  /** 累计调用次数 */
  calls: number
  owner: string
}

export interface OperationLog {
  id: number
  operator: string
  action: string
  module: string
  target?: string
  ip: string
  result: 'success' | 'failed'
  createdAt: string
  detail?: string
}

export interface DataFileItem {
  id: number
  name: string
  size: number
  type: '车型数据' | '销量数据' | '评价数据'
  status: 'success' | 'uploading' | 'failed' | 'pending'
  progress: number
  uploadedAt: string
  rows?: number
  message?: string
}
