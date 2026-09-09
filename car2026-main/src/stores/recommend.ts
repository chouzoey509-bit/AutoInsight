import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { recommendApi } from '@/api/recommend'
import type { BudgetRange, ConcernFactor, RecommendResult, UsageScenario } from '@/types'

/** 默认关注因素权重 */
const DEFAULT_WEIGHTS: Record<ConcernFactor, number> = {
  price: 70,
  range: 65,
  performance: 55,
  space: 60,
  intelligence: 60,
  comfort: 55
}

/**
 * 智能推荐 Store
 * 只负责「收集需求 → 调用接口 → 保存结果」，不做任何算法计算
 */
export const useRecommendStore = defineStore('recommend', () => {
  const form = ref<{
    budget: BudgetRange
    energyTypes: ('BEV' | 'PHEV' | 'HEV' | 'ICE')[]
    scenarios: UsageScenario[]
    province: string
    city: string
    weights: Record<ConcernFactor, number>
    topN: number
  }>({
    budget: '15-20',
    energyTypes: ['BEV', 'PHEV'],
    scenarios: ['commute', 'family'],
    province: '广东省',
    city: '广州市',
    weights: { ...DEFAULT_WEIGHTS },
    topN: 6
  })

  const result = ref<RecommendResult | null>(null)
  const loading = ref(false)
  const error = ref('')
  const submitted = ref(false)

  const top = computed(() => result.value?.recommendations[0] ?? null)
  const rest = computed(() => result.value?.recommendations.slice(1) ?? [])

  /** 需求摘要（第二步展示） */
  const summary = computed(() => {
    const budgetMap: Record<BudgetRange, string> = {
      lt10: '10万以下',
      '10-15': '10~15万',
      '15-20': '15~20万',
      '20-30': '20~30万',
      gt30: '30万以上'
    }
    const energyMap: Record<string, string> = {
      BEV: '纯电',
      PHEV: '插混',
      HEV: '混动',
      ICE: '燃油'
    }
    const scenarioMap: Record<UsageScenario, string> = {
      commute: '通勤代步',
      family: '家庭用车',
      business: '商务接待',
      longtrip: '长途自驾',
      outdoor: '户外越野'
    }
    const topFactors = (Object.entries(form.value.weights) as [ConcernFactor, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => {
        const map: Record<ConcernFactor, string> = {
          price: '价格',
          range: '续航',
          performance: '性能',
          space: '空间',
          intelligence: '智能化',
          comfort: '舒适性'
        }
        return map[k]
      })
    return {
      budget: budgetMap[form.value.budget],
      energy: form.value.energyTypes.map((e) => energyMap[e] ?? e).join(' / ') || '不限',
      scenario: form.value.scenarios.map((s) => scenarioMap[s] ?? s).join(' / ') || '不限',
      location: `${form.value.province} ${form.value.city}`,
      factors: topFactors.join(' · ')
    }
  })

  async function submit(): Promise<void> {
    loading.value = true
    error.value = ''
    submitted.value = true
    try {
      result.value = await recommendApi.recommend({
        budget: form.value.budget,
        energyTypes: form.value.energyTypes,
        scenarios: form.value.scenarios,
        province: form.value.province,
        city: form.value.city,
        weights: form.value.weights,
        topN: form.value.topN
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : '推荐服务调用失败'
      result.value = null
    } finally {
      loading.value = false
    }
  }

  function reset(): void {
    form.value = {
      budget: '15-20',
      energyTypes: ['BEV', 'PHEV'],
      scenarios: ['commute', 'family'],
      province: '广东省',
      city: '广州市',
      weights: { ...DEFAULT_WEIGHTS },
      topN: 6
    }
    result.value = null
    error.value = ''
    submitted.value = false
  }

  function setWeight(key: ConcernFactor, value: number): void {
    form.value.weights[key] = value
  }

  return { form, result, loading, error, submitted, top, rest, summary, submit, reset, setWeight }
})
