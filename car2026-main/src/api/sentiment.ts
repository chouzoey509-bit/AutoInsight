import type {
  BrandReputation,
  KeywordItem,
  PageResult,
  ReviewItem,
  SentimentOverview,
  SentimentTrend
} from '@/types'
import { get } from '@/utils/request'

/**
 * 舆情分析接口
 * GET /api/sentiment
 * GET /api/sentiment/trend
 * GET /api/sentiment/keywords
 * GET /api/sentiment/brand-reputation
 * GET /api/reviews
 */
export const sentimentApi = {
  overview(): Promise<SentimentOverview> {
    return get<SentimentOverview>('/sentiment')
  },
  trend(): Promise<SentimentTrend> {
    return get<SentimentTrend>('/sentiment/trend')
  },
  keywords(): Promise<KeywordItem[]> {
    return get<KeywordItem[]>('/sentiment/keywords')
  },
  brandReputation(limit = 10): Promise<BrandReputation[]> {
    return get<BrandReputation[]>('/sentiment/brand-reputation', { limit })
  }
}

export const reviewApi = {
  list(params: {
    page?: number
    pageSize?: number
    sentiment?: string
    keyword?: string
    carId?: number
  }): Promise<PageResult<ReviewItem>> {
    return get<PageResult<ReviewItem>>('/reviews', params as Record<string, unknown>)
  }
}
