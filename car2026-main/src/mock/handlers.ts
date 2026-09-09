import type { Car, PageResult } from '@/types'
import { BRANDS, CAR_CATEGORIES, ENERGY_LABEL, ENERGY_TYPES } from './brands'
import { CARS, CAR_MAP, filterCars, PRICE_BUCKETS, type CarFilter } from './cars'
import { CAR_SERIES, MONTHS, NATIONAL_MONTHLY } from './sales'
import {
  getBrandRanking,
  getCarRanking,
  getCarScatter,
  getCategoryTrend,
  getDashboardEnergy,
  getDashboardGrowth,
  getDashboardOverview,
  getDashboardPrice,
  getDashboardRegion,
  getDashboardTrend,
  getMarketBrandRank,
  getMarketCategory,
  getMarketEnergy,
  getMarketPenetration,
  getMarketPrice,
  getMarketRegion,
  getMarketShare,
  getMarketTrend,
  MOCK_UPDATED_AT,
  type MarketFilters
} from './market'
import { recommend, BUDGET_OPTIONS, CITY_MAP, CONCERN_OPTIONS, PROVINCES, USAGE_OPTIONS } from './recommend'
import { predictSales } from './predict'
import {
  getBrandReputation,
  getKeywords,
  getSentimentOverview,
  getSentimentTrend,
  queryReviews
} from './sentiment'
import {
  ALGORITHMS,
  DATA_FILES,
  DEMO_ACCOUNTS,
  INVENTORY,
  LOGS,
  ORDERS,
  USERS,
  getAdminCarRanking,
  getAdminOverview,
  getAdminSalesTrend,
  getInventoryTrend,
  getOrderStatus
} from './admin'
import { REGION_NAMES } from './sales'
import { clamp, createRng } from './random'

/**
 * Mock API 路由表
 * ------------------------------------------------------------
 * 与 src/api/* 中的真实接口一一对应。
 * 切换真实后端时只需把 VITE_USE_MOCK 设为 false，本文件不再参与运行。
 */

export interface MockContext {
  /** 路径参数 /api/cars/:id → { id: '1' } */
  params: Record<string, string>
  /** query 参数 */
  query: Record<string, string>
  /** 请求体 */
  body: Record<string, unknown> | undefined
}

export interface MockRoute {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** 路径模板，支持 :param */
  path: string
  handler: (ctx: MockContext) => unknown
}

/** 业务异常：会被统一包装成 { code, message } */
export class MockError extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

/** 统一成功外壳 */
function ok<T>(data: T) {
  return data
}

function num(v: unknown, fallback?: number): number {
  if (v === undefined || v === null || v === '') return fallback ?? 0
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback ?? 0
}

function str(v: unknown): string | undefined {
  if (v === undefined || v === null || v === '') return undefined
  return String(v)
}

/** 分页切片 */
function paginate<T>(list: T[], page = 1, pageSize = 10): PageResult<T> {
  const p = Math.max(1, page)
  const s = Math.max(1, pageSize)
  const start = (p - 1) * s
  return { list: list.slice(start, start + s), total: list.length, page: p, pageSize: s }
}

function toFilters(q: Record<string, string>): MarketFilters {
  return {
    year: q.year,
    month: q.month,
    brandId: q.brandId,
    energyType: q.energyType,
    category: q.category,
    region: q.region,
    keyword: q.keyword,
    span: num(q.span, 12)
  }
}

/** 排序 */
function sortBy<T>(list: T[], key?: string, order?: string): T[] {
  if (!key) return list
  const dir = order === 'desc' ? -1 : 1
  return [...list].sort((a, b) => {
    const av = (a as Record<string, unknown>)[key]
    const bv = (b as Record<string, unknown>)[key]
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av ?? '').localeCompare(String(bv ?? ''), 'zh-CN') * dir
  })
}

export const mockRoutes: MockRoute[] = [
  /* ======================== 认证 ======================== */
  {
    method: 'POST',
    path: '/auth/login',
    handler: ({ body }) => {
      const username = str(body?.username) ?? ''
      const password = str(body?.password) ?? ''
      const account = DEMO_ACCOUNTS.find((a) => a.username === username)
      if (!account || account.password !== password) {
        throw new MockError(401, '用户名或密码不正确（演示账号见登录页说明）')
      }
      const user = USERS.find((u) => u.username === username)
      const rng = createRng(`token-${username}`)
      return ok({
        token: `mock-token-${username}-${rng.int(100000, 999999)}`,
        refreshToken: `mock-refresh-${username}`,
        expiresIn: 7200,
        user: {
          ...user,
          lastLoginAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          loginCount: (user?.loginCount ?? 0) + 1
        }
      })
    }
  },
  {
    method: 'POST',
    path: '/auth/register',
    handler: ({ body }) => {
      const username = str(body?.username) ?? ''
      if (USERS.some((u) => u.username === username)) {
        throw new MockError(409, '该用户名已被注册')
      }
      return ok({
        id: USERS.length + 1,
        username,
        nickname: str(body?.nickname) ?? username,
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
      })
    }
  },
  {
    method: 'GET',
    path: '/users/me',
    handler: () => {
      // 真实环境由后端根据 Token 解析；Mock 场景由 userStore 兜底
      return ok(USERS[0])
    }
  },

  /* ======================== Dashboard ======================== */
  { method: 'GET', path: '/dashboard/overview', handler: () => getDashboardOverview() },
  {
    method: 'GET',
    path: '/dashboard/trend',
    handler: ({ query }) => getDashboardTrend(num(query.span, 18))
  },
  {
    method: 'GET',
    path: '/dashboard/brand-ranking',
    handler: ({ query }) => getBrandRanking(num(query.limit, 10), num(query.span, 12))
  },
  {
    method: 'GET',
    path: '/dashboard/car-ranking',
    handler: ({ query }) => getCarRanking(num(query.limit, 10))
  },
  { method: 'GET', path: '/dashboard/energy', handler: () => getDashboardEnergy() },
  {
    method: 'GET',
    path: '/dashboard/region',
    handler: ({ query }) => getDashboardRegion(num(query.span, 12))
  },
  { method: 'GET', path: '/dashboard/price', handler: () => getDashboardPrice() },
  {
    method: 'GET',
    path: '/dashboard/growth',
    handler: ({ query }) => getDashboardGrowth(num(query.span, 12))
  },
  {
    method: 'GET',
    path: '/dashboard/scatter',
    handler: ({ query }) => getCarScatter(num(query.limit, 60))
  },

  /* ======================== 车型 ======================== */
  {
    method: 'GET',
    path: '/cars',
    handler: ({ query }) => {
      const filter: CarFilter = {
        keyword: str(query.keyword),
        brandId: num(query.brandId) || undefined,
        energyType: query.energyType as never,
        category: query.category as never,
        year: num(query.year) || undefined
      }
      const priceMin = num(query.priceMin)
      const priceMax = num(query.priceMax)
      if (priceMin > 0) filter.priceMin = priceMin
      if (priceMax > 0) filter.priceMax = priceMax
      const filtered = filterCars(CARS, filter)
      const sorted = sortBy(filtered, str(query.sortBy), str(query.sortOrder))
      return ok(paginate(sorted, num(query.page, 1), num(query.pageSize, 10)))
    }
  },
  {
    method: 'GET',
    path: '/cars/options',
    handler: () => ({
      brands: BRANDS.map((b) => ({ id: b.id, name: b.name })),
      energies: ENERGY_TYPES.map((e) => ({ value: e, label: ENERGY_LABEL[e] })),
      categories: CAR_CATEGORIES,
      years: Array.from(new Set(CARS.map((c) => c.launchYear))).sort((a, b) => b - a),
      priceBuckets: PRICE_BUCKETS.map((b) => ({ label: b.label, min: b.min, max: b.max })),
      regions: REGION_NAMES,
      months: MONTHS.slice(-24)
    })
  },
  {
    method: 'GET',
    path: '/cars/:id',
    handler: ({ params }) => {
      const car = CAR_MAP[num(params.id, 0) ?? 0]
      if (!car) throw new MockError(404, '车型不存在')
      return ok(car)
    }
  },
  {
    method: 'GET',
    path: '/cars/:id/sales',
    handler: ({ params, query }) => {
      const id = num(params.id, 0) ?? 0
      const car = CAR_MAP[id]
      if (!car) throw new MockError(404, '车型不存在')
      const span = num(query.span, 18) ?? 18
      const series = CAR_SERIES[id] ?? []
      const months = MONTHS.slice(-span)
      const values = series.slice(-span)
      return ok({
        carId: id,
        carName: `${car.brand} ${car.name}`,
        points: months.map((month, i) => ({ month, value: values[i] ?? 0 })),
        yoy: values.map((v, i) => {
          const prev = series[series.length - span - 12 + i]
          return prev ? Math.round(((v - prev) / prev) * 1000) / 10 : 0
        })
      })
    }
  },
  {
    method: 'GET',
    path: '/cars/:id/similar',
    handler: ({ params, query }) => {
      const car = CAR_MAP[num(params.id, 0) ?? 0]
      if (!car) return ok([])
      const limit = num(query.limit, 4) ?? 4
      const scored = CARS.filter((c) => c.id !== car.id).map((c) => {
        const priceDiff = Math.abs(c.price - car.price)
        const score =
          100 -
          priceDiff * 1.6 -
          (c.category === car.category ? 0 : 14) -
          (c.energyType === car.energyType ? 0 : 8) +
          (c.rating - 4) * 10
        return { car: c, score }
      })
      return ok(
        scored
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map((s) => s.car)
      )
    }
  },
  {
    method: 'GET',
    path: '/cars/:id/reviews',
    handler: ({ params, query }) => {
      const id = num(params.id, 0) ?? 0
      return ok(queryReviews({ page: num(query.page, 1), pageSize: num(query.pageSize, 5), carId: id }))
    }
  },
  {
    method: 'POST',
    path: '/cars',
    handler: ({ body }) => {
      const nextId = Math.max(...CARS.map((c) => c.id)) + 1
      const brand = BRANDS.find((b) => b.id === num(body?.brandId)) ?? BRANDS[0]
      const price = num(body?.price, 15) ?? 15
      const car: Car = {
        id: nextId,
        brandId: brand.id,
        brand: brand.name,
        name: str(body?.name) ?? '未命名车型',
        modelCode: `${brand.nameEn.slice(0, 3).toUpperCase()}-${String(nextId).padStart(3, '0')}`,
        category: (str(body?.category) ?? '轿车') as Car['category'],
        energyType: (str(body?.energyType) ?? 'BEV') as Car['energyType'],
        price,
        priceMin: num(body?.priceMin, price * 0.9) ?? price * 0.9,
        priceMax: num(body?.priceMax, price * 1.1) ?? price * 1.1,
        range: num(body?.range, 500) ?? 500,
        battery: num(body?.battery, 60) ?? 60,
        power: num(body?.power, 150) ?? 150,
        torque: num(body?.torque, 300) ?? 300,
        wheelbase: num(body?.wheelbase, 2800) ?? 2800,
        length: num(body?.length, 4700) ?? 4700,
        width: num(body?.width, 1860) ?? 1860,
        height: num(body?.height, 1480) ?? 1480,
        seats: num(body?.seats, 5) ?? 5,
        launchDate: str(body?.launchDate) ?? MONTHS[MONTHS.length - 1],
        launchYear: Number((str(body?.launchDate) ?? MONTHS[MONTHS.length - 1]).slice(0, 4)),
        sales: 0,
        lastMonthSales: 0,
        rating: 4.5,
        intelligenceScore: 80,
        comfortScore: 78,
        spaceScore: 78,
        performanceScore: 72,
        reviewCount: 0,
        tags: ['新入库']
      }
      CARS.unshift(car)
      CAR_MAP[car.id] = car
      CAR_SERIES[car.id] = MONTHS.map((_, i) => Math.round(NATIONAL_MONTHLY[i] / CARS.length))
      return ok(car)
    }
  },
  {
    method: 'PUT',
    path: '/cars/:id',
    handler: ({ params, body }) => {
      const car = CAR_MAP[num(params.id, 0) ?? 0]
      if (!car) throw new MockError(404, '车型不存在')
      const merged = { ...car, ...body } as Car
      Object.assign(car, merged)
      return ok(car)
    }
  },
  {
    method: 'DELETE',
    path: '/cars/:id',
    handler: ({ params }) => {
      const id = num(params.id, 0) ?? 0
      const idx = CARS.findIndex((c) => c.id === id)
      if (idx < 0) throw new MockError(404, '车型不存在')
      CARS.splice(idx, 1)
      delete CAR_MAP[id]
      return ok({ id })
    }
  },

  /* ======================== 销量 ======================== */
  {
    method: 'GET',
    path: '/sales',
    handler: ({ query }) => {
      const span = num(query.span, 12) ?? 12
      const from = Math.max(0, MONTHS.length - span)
      const page = num(query.page, 1) ?? 1
      const pageSize = num(query.pageSize, 20) ?? 20
      const cars = query.brandId ? CARS.filter((c) => c.brandId === num(query.brandId)) : CARS
      const rows = cars.flatMap((c) =>
        MONTHS.slice(from).map((month, i) => ({
          id: c.id * 100 + i,
          carId: c.id,
          carName: `${c.brand} ${c.name}`,
          brand: c.brand,
          month,
          sales: CAR_SERIES[c.id][from + i],
          revenue: Math.round((CAR_SERIES[c.id][from + i] * c.price) / 1),
          region: '全国',
          energyType: c.energyType
        }))
      )
      return ok(paginate(rows, page, pageSize))
    }
  },
  {
    method: 'GET',
    path: '/sales/trend',
    handler: ({ query }) => getMarketTrend(toFilters(query))
  },
  {
    method: 'GET',
    path: '/sales/ranking',
    handler: ({ query }) => getMarketBrandRank(toFilters(query), num(query.limit, 10))
  },
  {
    method: 'GET',
    path: '/sales/region',
    handler: ({ query }) => getMarketRegion(toFilters(query))
  },

  /* ======================== 市场分析 ======================== */
  {
    method: 'GET',
    path: '/market/options',
    handler: () => ({
      years: Array.from(new Set(MONTHS.map((m) => m.slice(0, 4)))),
      months: Array.from({ length: 12 }, (_, i) => i + 1),
      brands: BRANDS.map((b) => ({ id: b.id, name: b.name })),
      energies: ENERGY_TYPES.map((e) => ({ value: e, label: ENERGY_LABEL[e] })),
      categories: CAR_CATEGORIES,
      regions: REGION_NAMES,
      updatedAt: MOCK_UPDATED_AT
    })
  },
  {
    method: 'GET',
    path: '/market/trend',
    handler: ({ query }) => getMarketTrend(toFilters(query))
  },
  {
    method: 'GET',
    path: '/market/share',
    handler: ({ query }) => getMarketShare(toFilters(query))
  },
  {
    method: 'GET',
    path: '/market/penetration',
    handler: ({ query }) => getMarketPenetration(toFilters(query))
  },
  {
    method: 'GET',
    path: '/market/region',
    handler: ({ query }) => getMarketRegion(toFilters(query))
  },
  {
    method: 'GET',
    path: '/market/energy',
    handler: ({ query }) => getMarketEnergy(toFilters(query))
  },
  {
    method: 'GET',
    path: '/market/price',
    handler: ({ query }) => getMarketPrice(toFilters(query))
  },
  {
    method: 'GET',
    path: '/market/brand-rank',
    handler: ({ query }) => getMarketBrandRank(toFilters(query), num(query.limit, 10))
  },
  {
    method: 'GET',
    path: '/market/category',
    handler: ({ query }) => getMarketCategory(toFilters(query))
  },
  {
    method: 'GET',
    path: '/market/category-trend',
    handler: ({ query }) => getCategoryTrend(num(query.span, 12))
  },

  /* ======================== 智能推荐 ======================== */
  {
    method: 'GET',
    path: '/recommend/options',
    handler: () => ({
      budgets: BUDGET_OPTIONS.map((b) => ({ value: b.value, label: b.label })),
      usages: USAGE_OPTIONS,
      concerns: CONCERN_OPTIONS,
      provinces: PROVINCES,
      cities: CITY_MAP,
      energies: ENERGY_TYPES.map((e) => ({ value: e, label: ENERGY_LABEL[e] }))
    })
  },
  {
    method: 'POST',
    path: '/recommend',
    handler: ({ body }) => {
      const weights = (body?.weights ?? {}) as Record<string, number>
      const result = recommend({
        budget: (str(body?.budget) ?? '15-20') as never,
        energyTypes: (body?.energyTypes as never) ?? ['BEV', 'PHEV'],
        scenarios: (body?.scenarios as never) ?? ['commute'],
        province: str(body?.province) ?? '广东省',
        city: str(body?.city) ?? '广州市',
        weights: weights as never,
        topN: num(body?.topN, 6)
      })
      return ok(result)
    }
  },

  /* ======================== 销量预测 ======================== */
  {
    method: 'GET',
    path: '/predict/sales',
    handler: ({ query }) => {
      const horizon = clamp(num(query.horizon, 6) ?? 6, 3, 12)
      if (horizon !== 3 && horizon !== 6 && horizon !== 12) {
        throw new MockError(400, '预测周期仅支持 3 / 6 / 12 个月')
      }
      return ok(
        predictSales({
          carId: num(query.carId, 1),
          brandId: num(query.brandId),
          horizon: horizon as 3 | 6 | 12
        })
      )
    }
  },

  /* ======================== 舆情 ======================== */
  { method: 'GET', path: '/sentiment', handler: () => getSentimentOverview() },
  { method: 'GET', path: '/sentiment/trend', handler: () => getSentimentTrend() },
  { method: 'GET', path: '/sentiment/keywords', handler: () => getKeywords() },
  {
    method: 'GET',
    path: '/sentiment/brand-reputation',
    handler: ({ query }) => getBrandReputation(num(query.limit, 10))
  },
  {
    method: 'GET',
    path: '/reviews',
    handler: ({ query }) =>
      queryReviews({
        page: num(query.page, 1),
        pageSize: num(query.pageSize, 10),
        sentiment: str(query.sentiment),
        keyword: str(query.keyword),
        carId: num(query.carId)
      })
  },

  /* ======================== 管理后台 ======================== */
  { method: 'GET', path: '/admin/overview', handler: () => getAdminOverview() },
  { method: 'GET', path: '/admin/sales-trend', handler: () => getAdminSalesTrend() },
  { method: 'GET', path: '/admin/order-status', handler: () => getOrderStatus() },
  { method: 'GET', path: '/admin/car-ranking', handler: ({ query }) => getAdminCarRanking(num(query.limit, 8)) },
  { method: 'GET', path: '/admin/inventory-trend', handler: () => getInventoryTrend() },
  {
    method: 'GET',
    path: '/admin/users',
    handler: ({ query }) => {
      const kw = str(query.keyword)?.toLowerCase()
      let list = USERS
      if (kw) {
        list = list.filter(
          (u) => u.username.toLowerCase().includes(kw) || u.nickname.toLowerCase().includes(kw) || u.email.toLowerCase().includes(kw)
        )
      }
      if (query.role && query.role !== 'all') list = list.filter((u) => u.role === query.role)
      if (query.status && query.status !== 'all') list = list.filter((u) => u.status === query.status)
      return ok(paginate(list, num(query.page, 1), num(query.pageSize, 10)))
    }
  },
  {
    method: 'PUT',
    path: '/admin/users/:id',
    handler: ({ params, body }) => {
      const user = USERS.find((u) => u.id === num(params.id))
      if (!user) throw new MockError(404, '用户不存在')
      Object.assign(user, body)
      return ok(user)
    }
  },
  {
    method: 'PATCH',
    path: '/admin/users/:id/status',
    handler: ({ params, body }) => {
      const user = USERS.find((u) => u.id === num(params.id))
      if (!user) throw new MockError(404, '用户不存在')
      user.status = (str(body?.status) ?? 'active') as typeof user.status
      return ok(user)
    }
  },
  {
    method: 'GET',
    path: '/admin/brands',
    handler: ({ query }) => {
      const kw = str(query.keyword)?.toLowerCase()
      let list = BRANDS.map((b) => ({
        ...b,
        status: 'active' as const
      }))
      if (kw) list = list.filter((b) => `${b.name}${b.nameEn}`.toLowerCase().includes(kw))
      if (query.group && query.group !== 'all') list = list.filter((b) => b.group === query.group)
      return ok(paginate(sortBy(list, str(query.sortBy), str(query.sortOrder)), num(query.page, 1), num(query.pageSize, 10)))
    }
  },
  {
    method: 'GET',
    path: '/admin/cars',
    handler: ({ query }) => {
      const list = filterCars(CARS, {
        keyword: str(query.keyword),
        brandId: num(query.brandId),
        energyType: query.energyType as never,
        category: query.category as never
      })
      return ok(paginate(sortBy(list, str(query.sortBy), str(query.sortOrder)), num(query.page, 1), num(query.pageSize, 10)))
    }
  },
  {
    method: 'GET',
    path: '/admin/sales',
    handler: ({ query }) => {
      const span = num(query.span, 12) ?? 12
      const from = Math.max(0, MONTHS.length - span)
      const rows = CARS.slice(0, 60).map((c) => ({
        carId: c.id,
        carName: `${c.brand} ${c.name}`,
        brand: c.brand,
        months: MONTHS.slice(from),
        values: CAR_SERIES[c.id].slice(from),
        total: CAR_SERIES[c.id].slice(from).reduce((a, b) => a + b, 0)
      }))
      return ok(paginate(rows, num(query.page, 1), num(query.pageSize, 10)))
    }
  },
  {
    method: 'GET',
    path: '/admin/inventory',
    handler: ({ query }) => {
      const kw = str(query.keyword)?.toLowerCase()
      let list = INVENTORY
      if (kw) list = list.filter((i) => `${i.carName}${i.brand}`.toLowerCase().includes(kw))
      if (query.status && query.status !== 'all') list = list.filter((i) => i.status === query.status)
      return ok(paginate(sortBy(list, str(query.sortBy), str(query.sortOrder)), num(query.page, 1), num(query.pageSize, 10)))
    }
  },
  {
    method: 'GET',
    path: '/admin/orders',
    handler: ({ query }) => {
      const kw = str(query.keyword)?.toLowerCase()
      let list = ORDERS
      if (kw) list = list.filter((o) => `${o.orderNo}${o.carName}${o.customer}`.toLowerCase().includes(kw))
      if (query.status && query.status !== 'all') list = list.filter((o) => o.status === query.status)
      return ok(paginate(list, num(query.page, 1), num(query.pageSize, 10)))
    }
  },
  {
    method: 'GET',
    path: '/admin/algorithms',
    handler: () => ALGORITHMS
  },
  {
    method: 'PATCH',
    path: '/admin/algorithms/:id/status',
    handler: ({ params, body }) => {
      const task = ALGORITHMS.find((t) => t.id === num(params.id))
      if (!task) throw new MockError(404, '算法任务不存在')
      task.status = (str(body?.status) ?? 'idle') as typeof task.status
      task.lastRunAt = new Date().toISOString().replace('T', ' ').slice(0, 19)
      return ok(task)
    }
  },
  {
    method: 'GET',
    path: '/admin/logs',
    handler: ({ query }) => {
      const kw = str(query.keyword)?.toLowerCase()
      let list = LOGS
      if (kw) list = list.filter((l) => `${l.operator}${l.action}${l.module}`.toLowerCase().includes(kw))
      if (query.module && query.module !== 'all') list = list.filter((l) => l.module === query.module)
      if (query.result && query.result !== 'all') list = list.filter((l) => l.result === query.result)
      return ok(paginate(list, num(query.page, 1), num(query.pageSize, 10)))
    }
  },
  {
    method: 'GET',
    path: '/admin/data-files',
    handler: ({ query }) => {
      let list = DATA_FILES
      if (query.type && query.type !== 'all') list = list.filter((f) => f.type === query.type)
      return ok(list)
    }
  },
  {
    method: 'POST',
    path: '/admin/data/upload',
    handler: ({ body }) => {
      const name = str(body?.name) ?? 'unknown.csv'
      return ok({
        id: DATA_FILES.length + 1,
        name,
        size: num(body?.size, 102400) ?? 102400,
        type: (str(body?.type) ?? '车型数据') as never,
        status: 'success',
        progress: 100,
        uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        rows: 128
      })
    }
  },
  {
    method: 'DELETE',
    path: '/admin/data-files/:id',
    handler: ({ params }) => {
      const idx = DATA_FILES.findIndex((f) => f.id === num(params.id))
      if (idx >= 0) DATA_FILES.splice(idx, 1)
      return ok({ id: num(params.id) })
    }
  }
]
