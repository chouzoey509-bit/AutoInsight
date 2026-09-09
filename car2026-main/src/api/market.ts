import type { MultiSeries, PageResult, ProportionItem, RankingItem, RegionSalesItem, SalesRecord } from '@/types'
import { get } from '@/utils/request'

/**
 * 市场分析接口
 * GET /api/market/options
 * GET /api/market/trend
 * GET /api/market/share
 * GET /api/market/penetration
 * GET /api/market/region
 * GET /api/market/energy
 * GET /api/market/price
 * GET /api/market/brand-rank
 * GET /api/market/category
 * GET /api/market/category-trend
 *
 * 销量数据接口（后端 /api/sales 系列）
 * GET /api/sales
 * GET /api/sales/trend
 * GET /api/sales/ranking
 * GET /api/sales/region
 */

export interface MarketQuery {
  year?: number | string
  month?: number | string
  brandId?: number | string
  energyType?: string
  category?: string
  region?: string
  keyword?: string
  span?: number
  limit?: number
}

export interface MarketOptions {
  years: string[]
  months: number[]
  brands: { id: number; name: string }[]
  energies: { value: string; label: string }[]
  categories: string[]
  regions: string[]
  updatedAt: string
}

export const marketApi = {
  options(): Promise<MarketOptions> {
    return get<MarketOptions>('/market/options')
  },
  trend(query: MarketQuery): Promise<MultiSeries> {
    return get<MultiSeries>('/market/trend', query as Record<string, unknown>)
  },
  share(query: MarketQuery): Promise<MultiSeries> {
    return get<MultiSeries>('/market/share', query as Record<string, unknown>)
  },
  penetration(query: MarketQuery): Promise<{ months: string[]; values: number[] }> {
    return get<{ months: string[]; values: number[] }>('/market/penetration', query as Record<string, unknown>)
  },
  region(query: MarketQuery): Promise<RegionSalesItem[]> {
    return get<RegionSalesItem[]>('/market/region', query as Record<string, unknown>)
  },
  energy(query: MarketQuery): Promise<ProportionItem[]> {
    return get<ProportionItem[]>('/market/energy', query as Record<string, unknown>)
  },
  price(query: MarketQuery): Promise<{ label: string; value: number }[]> {
    return get<{ label: string; value: number }[]>('/market/price', query as Record<string, unknown>)
  },
  brandRank(query: MarketQuery): Promise<RankingItem[]> {
    return get<RankingItem[]>('/market/brand-rank', query as Record<string, unknown>)
  },
  category(query: MarketQuery): Promise<ProportionItem[]> {
    return get<ProportionItem[]>('/market/category', query as Record<string, unknown>)
  },
  categoryTrend(span = 12): Promise<MultiSeries> {
    return get<MultiSeries>('/market/category-trend', { span })
  }
}

export const salesApi = {
  list(params: Record<string, unknown> = {}): Promise<PageResult<SalesRecord>> {
    return get<PageResult<SalesRecord>>('/sales', params)
  },
  trend(query: MarketQuery): Promise<MultiSeries> {
    return get<MultiSeries>('/sales/trend', query as Record<string, unknown>)
  },
  ranking(query: MarketQuery): Promise<RankingItem[]> {
    return get<RankingItem[]>('/sales/ranking', query as Record<string, unknown>)
  },
  region(query: MarketQuery): Promise<RegionSalesItem[]> {
    return get<RegionSalesItem[]>('/sales/region', query as Record<string, unknown>)
  }
}
