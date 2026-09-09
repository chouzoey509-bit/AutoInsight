import type {
  BudgetRange,
  ConcernFactor,
  RecommendRequest,
  RecommendResult,
  Recommendation,
  ScoreDimension,
  UsageScenario
} from '@/types'
import { CARS } from './cars'
import { MONTHS, CAR_SERIES } from './sales'
import { ENERGY_LABEL } from './brands'
import { clamp, createRng, hashString, round, sum } from './random'

/**
 * 智能购车推荐 —— 后端算法服务模拟
 * ------------------------------------------------------------
 * 注意：本文件属于「Mock 后端」范畴，用于替代 Python 侧推荐服务。
 * 真实环境由 FastAPI 提供 POST /api/recommend，前端逻辑无需改动。
 * 算法口径：硬约束过滤（预算 / 能源）→ 多维度打分 → 按用户关注因素加权排序。
 */

export const BUDGET_OPTIONS: { value: BudgetRange; label: string; min: number; max: number }[] = [
  { value: 'lt10', label: '10万以下', min: 0, max: 10 },
  { value: '10-15', label: '10~15万', min: 10, max: 15 },
  { value: '15-20', label: '15~20万', min: 15, max: 20 },
  { value: '20-30', label: '20~30万', min: 20, max: 30 },
  { value: 'gt30', label: '30万以上', min: 30, max: 1000 }
]

export const USAGE_OPTIONS: { value: UsageScenario; label: string; desc: string }[] = [
  { value: 'commute', label: '通勤代步', desc: '日常上下班、城市短途' },
  { value: 'family', label: '家庭用车', desc: '多人出行、儿童安全' },
  { value: 'business', label: '商务接待', desc: '形象气质、乘坐舒适' },
  { value: 'longtrip', label: '长途自驾', desc: '高速续航、可靠性' },
  { value: 'outdoor', label: '户外越野', desc: '通过性、装载能力' }
]

export const CONCERN_OPTIONS: { value: ConcernFactor; label: string; desc: string }[] = [
  { value: 'price', label: '价格', desc: '购车预算与用车成本' },
  { value: 'range', label: '续航', desc: '续航里程与补能便利' },
  { value: 'performance', label: '性能', desc: '动力与操控表现' },
  { value: 'space', label: '空间', desc: '乘坐与装载空间' },
  { value: 'intelligence', label: '智能化', desc: '智能座舱与辅助驾驶' },
  { value: 'comfort', label: '舒适性', desc: '底盘滤震与静谧性' }
]

export const PROVINCES = [
  '广东省', '江苏省', '山东省', '浙江省', '河南省', '四川省', '河北省', '湖北省',
  '湖南省', '安徽省', '上海市', '北京市', '福建省', '陕西省', '重庆市', '天津市'
]

export const CITY_MAP: Record<string, string[]> = {
  广东省: ['广州市', '深圳市', '东莞市', '佛山市'],
  江苏省: ['南京市', '苏州市', '无锡市', '常州市'],
  山东省: ['济南市', '青岛市', '烟台市', '潍坊市'],
  浙江省: ['杭州市', '宁波市', '温州市', '嘉兴市'],
  河南省: ['郑州市', '洛阳市', '南阳市'],
  四川省: ['成都市', '绵阳市', '德阳市'],
  河北省: ['石家庄市', '唐山市', '保定市'],
  湖北省: ['武汉市', '宜昌市', '襄阳市'],
  湖南省: ['长沙市', '株洲市', '湘潭市'],
  安徽省: ['合肥市', '芜湖市'],
  上海市: ['上海市'],
  北京市: ['北京市'],
  福建省: ['福州市', '厦门市', '泉州市'],
  陕西省: ['西安市', '咸阳市'],
  重庆市: ['重庆市'],
  天津市: ['天津市']
}

const NEV = ['BEV', 'PHEV']

function budgetRange(budget: BudgetRange) {
  return BUDGET_OPTIONS.find((b) => b.value === budget) ?? BUDGET_OPTIONS[1]
}

/** 价格匹配度：越贴近预算区间中心越高 */
function priceScore(price: number, budget: BudgetRange): number {
  const { min, max } = budgetRange(budget)
  const center = (min + Math.min(max, min + 20)) / 2
  const span = Math.max(1, Math.min(max, min + 20) - min)
  const diff = Math.abs(price - center)
  return clamp(100 - (diff / span) * 110, 42, 100)
}

/** 续航匹配度 */
function rangeScore(car: (typeof CARS)[number]): number {
  if (car.energyType === 'BEV') return clamp((car.range / 620) * 100, 30, 100)
  if (car.energyType === 'PHEV') return clamp(55 + (car.range / 240) * 40, 55, 96)
  return 58 // 燃油 / 混动无续航焦虑，但补能成本与绿牌劣势
}

/** 场景匹配度 */
function scenarioScore(car: (typeof CARS)[number], scenarios: UsageScenario[]): number {
  if (!scenarios.length) return 70
  let total = 0
  for (const s of scenarios) {
    let v = 60
    if (s === 'commute') {
      v = car.category === '轿车' ? 88 : car.category === 'SUV' ? 74 : 55
      if (car.price <= 18) v += 6
      if (NEV.includes(car.energyType)) v += 6
    } else if (s === 'family') {
      v = car.category === 'MPV' ? 92 : car.category === 'SUV' ? 88 : 62
      v += (car.spaceScore - 60) * 0.28
      if (car.seats >= 6) v += 6
    } else if (s === 'business') {
      v = car.category === 'MPV' ? 90 : car.category === '轿车' ? 84 : 66
      v += (car.price - 20) * 0.55
      v += (car.comfortScore - 60) * 0.22
    } else if (s === 'longtrip') {
      v = 52 + (car.range >= 600 ? 32 : car.range / 20)
      v += (car.comfortScore - 60) * 0.18
      if (car.category === 'SUV') v += 5
    } else if (s === 'outdoor') {
      v = car.category === 'SUV' ? 88 : car.category === '皮卡' ? 90 : 48
      v += (car.performanceScore - 60) * 0.24
    }
    total += clamp(v, 30, 100)
  }
  return round(total / scenarios.length, 1)
}

export function recommend(req: RecommendRequest): RecommendResult {
  const topN = req.topN ?? 3
  const requestId = `RC${String(hashString(JSON.stringify(req)) % 100000000).padStart(8, '0')}`
  const rng = createRng(`rec-${requestId}`)

  // ---- 硬约束：预算 + 能源 ----
  const { min, max } = budgetRange(req.budget)
  const energySet = new Set(req.energyTypes?.length ? req.energyTypes : ['BEV', 'PHEV', 'HEV', 'ICE'])

  const candidates = CARS.filter((c) => c.price >= min && c.price < max && energySet.has(c.energyType))

  const weights = req.weights ?? ({} as Record<ConcernFactor, number>)
  const w = {
    price: weights.price ?? 60,
    range: weights.range ?? 60,
    performance: weights.performance ?? 60,
    space: weights.space ?? 60,
    intelligence: weights.intelligence ?? 60,
    comfort: weights.comfort ?? 60
  }
  const wTotal = sum(Object.values(w)) || 1

  const scored = candidates.map((car) => {
    const pScore = priceScore(car.price, req.budget)
    const rScore = rangeScore(car)
    const eScore = energySet.has(car.energyType) ? 100 : 20
    const sScore = scenarioScore(car, req.scenarios ?? [])

    const factorScores: Record<ConcernFactor, number> = {
      price: pScore,
      range: rScore,
      performance: car.performanceScore,
      space: car.spaceScore,
      intelligence: car.intelligenceScore,
      comfort: car.comfortScore
    }

    // 加权求和 + 口碑微调 + 轻微随机（模拟模型不确定性）
    const weighted =
      (Object.keys(w) as ConcernFactor[]).reduce((acc, k) => acc + factorScores[k] * w[k], 0) / wTotal
    const score = clamp(weighted * 0.82 + (car.rating / 5) * 100 * 0.1 + sScore * 0.08 + rng.float(-1.6, 1.6), 40, 99)

    const highlights: string[] = []
    if (pScore >= 82) highlights.push('价格契合预算')
    if (rScore >= 80) highlights.push('续航表现优秀')
    if (car.category === 'SUV' && (req.scenarios ?? []).includes('family')) highlights.push('适配家庭出行')
    if (car.intelligenceScore >= 85) highlights.push('智能化配置领先')
    if (car.performanceScore >= 82) highlights.push('动力储备充足')
    if (car.spaceScore >= 85) highlights.push('乘坐空间宽敞')
    if (car.price <= 15 && car.energyType === 'BEV') highlights.push('用车成本低')
    if (!highlights.length) highlights.push('综合表现均衡')

    const dimensions: ScoreDimension[] = [
      { key: 'price', label: '价格匹配', score: round(pScore, 1) },
      { key: 'range', label: '续航匹配', score: round(rScore, 1) },
      { key: 'energy', label: '能源匹配', score: eScore },
      { key: 'usage', label: '用途匹配', score: round(sScore, 1) },
      { key: 'intelligence', label: '智能化', score: car.intelligenceScore },
      { key: 'space', label: '空间', score: car.spaceScore },
      { key: 'performance', label: '性能', score: car.performanceScore },
      { key: 'comfort', label: '舒适性', score: car.comfortScore }
    ]

    const topFactor = (Object.keys(w) as ConcernFactor[]).sort((a, b) => w[b] - w[a])[0]
    const topFactorLabel = CONCERN_OPTIONS.find((o) => o.value === topFactor)?.label ?? '综合'

    const recommendation: Recommendation = {
      carId: car.id,
      carName: `${car.brand} ${car.name}`,
      brand: car.brand,
      score: round(score, 1),
      price: car.price,
      energyType: car.energyType,
      range: car.range,
      rating: car.rating,
      dimensions,
      highlights: highlights.slice(0, 3),
      reason: ''
    }

    recommendation.reason = buildReason(recommendation, car.name, topFactorLabel, req)
    return recommendation
  })

  const recommendations = scored.sort((a, b) => b.score - a.score).slice(0, topN)

  return {
    requestId,
    model: 'AutoRec-CarRanking v2.3',
    generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    isMock: true,
    recommendations
  }
}

/** 生成推荐理由（基于真实计算结果，不编造未参与计算的结论） */
function buildReason(
  rec: Recommendation,
  carName: string,
  topFactorLabel: string,
  req: RecommendRequest
): string {
  const dim = (k: string) => rec.dimensions.find((d) => d.key === k)?.score ?? 0
  const parts: string[] = []
  parts.push(`${carName} 在您关注的「${topFactorLabel}」维度表现突出`)
  if (dim('price') >= 82) parts.push('价格落在预算核心区间')
  if (dim('range') >= 78) parts.push(`续航 ${rec.range}km 满足日常与中长途出行`)
  if (dim('usage') >= 80) parts.push('与所选用车场景高度契合')
  if (dim('intelligence') >= 85) parts.push('智能化配置处于同价位第一梯队')
  const scenario = (req.scenarios ?? [])
    .map((s) => USAGE_OPTIONS.find((o) => o.value === s)?.label)
    .filter(Boolean)
    .join('、')
  if (scenario) parts.push(`适配${scenario}场景`)
  return `${parts.join('，')}。综合匹配度 ${rec.score}%。`
}

/** 推荐结果附带的销量走势（用于推荐卡下方迷你图） */
export function getCarMiniSeries(carId: number, span = 6): number[] {
  const arr = CAR_SERIES[carId]
  if (!arr) return []
  return arr.slice(Math.max(0, arr.length - span))
}

export const RECOMMEND_MONTHS = MONTHS.slice(-6)
