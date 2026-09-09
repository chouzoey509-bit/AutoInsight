/**
 * 通用 API 类型定义
 * 后端统一返回 envelope 结构：{ code, message, data }
 * code = 0 表示成功，其余为业务错误码
 */

/** 统一响应外壳 */
export interface ApiEnvelope<T = unknown> {
  /** 0 = 成功 */
  code: number
  message: string
  data: T
  /** 服务端时间戳（毫秒） */
  timestamp?: number
  /** 服务端链路 ID，便于后端排查 */
  traceId?: string
}

/** 分页查询基础参数 */
export interface PageQuery {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/** 分页结果 */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages?: number
}

/** 序列点（月度） */
export interface SeriesPoint {
  /** 2025-01 */
  month: string
  value: number
}

/** 多序列数据 */
export interface MultiSeries {
  /** x 轴月份 */
  months: string[]
  /** 每条序列 */
  series: SeriesItem[]
}

export interface SeriesItem {
  name: string
  /** 与 months 等长 */
  data: number[]
  /** 图表类型提示，后端可指定 */
  type?: 'line' | 'bar'
  unit?: string
}

/** 排行榜条目 */
export interface RankingItem {
  name: string
  value: number
  /** 份额 0~1 */
  share?: number
  /** 同比 % */
  yoy?: number
  /** 附加标签，如能源类型 */
  extra?: string
}

/** 占比条目（饼/环图） */
export interface ProportionItem {
  name: string
  value: number
  /** 0~1 */
  ratio?: number
}

/** 地区销量 */
export interface RegionSalesItem {
  /** 省份名称，需与地图 GeoJSON 的 properties.name 对齐 */
  name: string
  /** 销量（辆） */
  value: number
  /** 同比 % */
  yoy?: number
  /** 新能源渗透率 % */
  penetration?: number
}

/** 数据更新时间与来源 */
export interface DataMeta {
  /** 数据更新时间 */
  updatedAt: string
  /** 数据来源说明 */
  source?: string
  /** 是否为示例数据 */
  isMock?: boolean
}
