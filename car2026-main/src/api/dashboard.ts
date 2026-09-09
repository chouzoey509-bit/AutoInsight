import type {
  CarScatterItem,
  DashboardEnergy,
  DashboardGrowth,
  DashboardOverview,
  DashboardPrice,
  DashboardRegion,
  DashboardTrend,
  RankingItem
} from '@/types'
import { get } from '@/utils/request'

/**
 * 首页驾驶舱接口
 * GET /api/dashboard/overview
 * GET /api/dashboard/trend
 * GET /api/dashboard/brand-ranking
 * GET /api/dashboard/car-ranking
 * GET /api/dashboard/energy
 * GET /api/dashboard/region
 * GET /api/dashboard/price
 * GET /api/dashboard/growth
 * GET /api/dashboard/scatter
 */
export const dashboardApi = {
  overview(): Promise<DashboardOverview> {
    return get<DashboardOverview>('/dashboard/overview')
  },
  trend(span = 18): Promise<DashboardTrend> {
    return get<DashboardTrend>('/dashboard/trend', { span })
  },
  brandRanking(limit = 10, span = 12): Promise<RankingItem[]> {
    return get<RankingItem[]>('/dashboard/brand-ranking', { limit, span })
  },
  carRanking(limit = 10): Promise<RankingItem[]> {
    return get<RankingItem[]>('/dashboard/car-ranking', { limit })
  },
  energy(): Promise<DashboardEnergy> {
    return get<DashboardEnergy>('/dashboard/energy')
  },
  region(span = 12): Promise<DashboardRegion> {
    return get<DashboardRegion>('/dashboard/region', { span })
  },
  price(): Promise<DashboardPrice> {
    return get<DashboardPrice>('/dashboard/price')
  },
  growth(span = 12): Promise<DashboardGrowth> {
    return get<DashboardGrowth>('/dashboard/growth', { span })
  },
  scatter(limit = 60): Promise<CarScatterItem[]> {
    return get<CarScatterItem[]>('/dashboard/scatter', { limit })
  }
}
