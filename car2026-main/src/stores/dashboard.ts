import { ref } from 'vue'
import { defineStore } from 'pinia'
import { dashboardApi } from '@/api/dashboard'
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

/**
 * 首页驾驶舱 Store
 * 统一拉取 Dashboard 全部数据，页面只做展示
 */
export const useDashboardStore = defineStore('dashboard', () => {
  const overview = ref<DashboardOverview | null>(null)
  const trend = ref<DashboardTrend | null>(null)
  const brandRanking = ref<RankingItem[]>([])
  const carRanking = ref<RankingItem[]>([])
  const energy = ref<DashboardEnergy | null>(null)
  const region = ref<DashboardRegion | null>(null)
  const price = ref<DashboardPrice | null>(null)
  const growth = ref<DashboardGrowth | null>(null)
  const scatter = ref<CarScatterItem[]>([])

  const loading = ref(false)
  const error = ref<string>('')
  const updatedAt = ref<string>('')

  /** 并行加载全部驾驶舱数据 */
  async function loadAll(span = 18): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      const results = await Promise.allSettled([
        dashboardApi.overview(),
        dashboardApi.trend(span),
        dashboardApi.brandRanking(10, 12),
        dashboardApi.carRanking(10),
        dashboardApi.energy(),
        dashboardApi.region(12),
        dashboardApi.price(),
        dashboardApi.growth(12),
        dashboardApi.scatter(60)
      ])

      const [ov, tr, br, cr, en, rg, pr, gr, sc] = results
      if (ov.status === 'fulfilled') {
        overview.value = ov.value
        updatedAt.value = ov.value.updatedAt
      }
      if (tr.status === 'fulfilled') trend.value = tr.value
      if (br.status === 'fulfilled') brandRanking.value = br.value
      if (cr.status === 'fulfilled') carRanking.value = cr.value
      if (en.status === 'fulfilled') energy.value = en.value
      if (rg.status === 'fulfilled') region.value = rg.value
      if (pr.status === 'fulfilled') price.value = pr.value
      if (gr.status === 'fulfilled') growth.value = gr.value
      if (sc.status === 'fulfilled') scatter.value = sc.value

      const failed = results.filter((r) => r.status === 'rejected')
      if (failed.length === results.length) {
        error.value = '全部数据加载失败，请稍后重试'
      } else if (failed.length) {
        error.value = `部分数据加载失败（${failed.length}/${results.length}）`
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '数据加载失败'
    } finally {
      loading.value = false
    }
  }

  return {
    overview,
    trend,
    brandRanking,
    carRanking,
    energy,
    region,
    price,
    growth,
    scatter,
    loading,
    error,
    updatedAt,
    loadAll
  }
})
