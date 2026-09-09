import type { RecommendRequest, RecommendResult } from '@/types'
import { get, post } from '@/utils/request'

/**
 * 智能购车推荐接口
 * GET  /api/recommend/options
 * POST /api/recommend
 *
 * 前端只负责收集需求、调用接口、展示算法结果，
 * 不参与任何模型计算。
 */
export interface RecommendOptions {
  budgets: { value: string; label: string }[]
  usages: { value: string; label: string; desc: string }[]
  concerns: { value: string; label: string; desc: string }[]
  provinces: string[]
  cities: Record<string, string[]>
  energies: { value: string; label: string }[]
}

export const recommendApi = {
  options(): Promise<RecommendOptions> {
    return get<RecommendOptions>('/recommend/options')
  },
  recommend(payload: RecommendRequest): Promise<RecommendResult> {
    return post<RecommendResult>('/recommend', payload)
  }
}
