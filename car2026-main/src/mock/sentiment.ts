import type { BrandReputation, KeywordItem, ReviewItem, SentimentLabel, SentimentOverview, SentimentTrend } from '@/types'
import { CARS } from './cars'
import { BRANDS } from './brands'
import { MONTHS } from './sales'
import { MOCK_UPDATED_AT } from './market'
import { clamp, createRng, round, sum } from './random'

/**
 * 舆情分析 —— 示例数据
 * ------------------------------------------------------------
 * 全部为 Mock 数据，界面需明确标注「示例数据」，
 * 真实环境由后端 NLP 服务提供 /api/sentiment 与 /api/reviews。
 */

const POSITIVE_WORDS = [
  '续航扎实', '加速平顺', '内饰质感好', '智能座舱流畅', '空间宽敞',
  '静谧性优秀', '辅助驾驶好用', '底盘稳健', '外观耐看', '用车成本低',
  '充电速度快', '性价比高', '座椅舒适', '车机响应快', '售后服务好'
]

const NEGATIVE_WORDS = [
  '车机卡顿', '风噪偏大', '后排空间局促', '续航虚标', '交付周期长',
  '底盘偏硬', '内饰异味', '辅助驾驶保守', '充电网络不足', '保值率一般',
  '轮胎磨损快', '雨刮异响', '后排座椅偏短', '中控反光', '售后服务慢'
]

const NEUTRAL_WORDS = [
  '配置够用', '中规中矩', '价格稳定', '等待观望', '对比竞品',
  '试驾体验中', '关注优惠', '考虑置换', '关注改款', '等待补贴'
]

const REVIEW_TEMPLATES: Record<SentimentLabel, string[]> = {
  positive: [
    '提车三个月，{w}，整体超出预期，家用非常合适。',
    '最满意的一点是{w}，日常通勤成本比之前的燃油车低很多。',
    '跑了趟长途，{w}，高速表现稳定，值得推荐。',
    '对比了同级别几款车，最终选择它主要因为{w}。'
  ],
  neutral: [
    '目前{w}，还在观望后续改款信息。',
    '整体{w}，没有明显短板也没有特别惊喜。',
    '试驾后感觉{w}，准备再对比一下竞品。'
  ],
  negative: [
    '目前遇到{w}的问题，希望厂家后续能优化。',
    '不太满意的地方是{w}，与宣传有一定差距。',
    '开了半年，{w}，建议有意向的朋友先试驾。'
  ]
}

const USER_NAMES = [
  '陈默', '林知远', '苏晚', '周牧', '顾南舟', '沈砚', '许星野', '江照白',
  '温言', '裴屿', '陆行舟', '叶知秋', '柏川', '祁夜', '宋清和', '罗与之'
]

/** 生成评价数据（240 条） */
function buildReviews(): ReviewItem[] {
  const rng = createRng('reviews')
  const list: ReviewItem[] = []
  const pool = CARS.slice(0, 80)
  for (let i = 0; i < 240; i++) {
    const car = rng.pick(pool)
    // 高评分车型更容易产生正面评价
    const positiveProb = clamp((car.rating - 3.6) / 1.2, 0.25, 0.78)
    const roll = rng.next()
    const sentiment: SentimentLabel = roll < positiveProb ? 'positive' : roll < positiveProb + 0.2 ? 'negative' : 'neutral'
    const words = sentiment === 'positive' ? POSITIVE_WORDS : sentiment === 'negative' ? NEGATIVE_WORDS : NEUTRAL_WORDS
    const word = rng.pick(words)
    const tpl = rng.pick(REVIEW_TEMPLATES[sentiment])
    const monthIdx = rng.int(MONTHS.length - 12, MONTHS.length - 1)
    const day = rng.int(1, 28)
    list.push({
      id: i + 1,
      carId: car.id,
      carName: `${car.brand} ${car.name}`,
      brand: car.brand,
      user: `${rng.pick(USER_NAMES)}`,
      rating: sentiment === 'positive' ? rng.int(5, 5) || rng.int(4, 5) : sentiment === 'negative' ? rng.int(2, 3) : rng.int(3, 4),
      content: tpl.replace('{w}', word),
      sentiment,
      createdAt: `${MONTHS[monthIdx]}-${String(day).padStart(2, '0')}`,
      likes: rng.int(0, 320)
    })
  }
  return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export const REVIEWS: ReviewItem[] = buildReviews()

export function getSentimentOverview(): SentimentOverview {
  const total = REVIEWS.length
  const positive = REVIEWS.filter((r) => r.sentiment === 'positive').length
  const negative = REVIEWS.filter((r) => r.sentiment === 'negative').length
  const neutral = total - positive - negative
  const avgScore = round(sum(REVIEWS.map((r) => r.rating)) / total, 2)
  return {
    total,
    positive,
    neutral,
    negative,
    positiveRate: round((positive / total) * 100, 1),
    avgScore,
    updatedAt: MOCK_UPDATED_AT,
    isMock: true
  }
}

export function getSentimentTrend(): SentimentTrend {
  const months = MONTHS.slice(-12)
  const rng = createRng('sentiment-trend')
  const positive: number[] = []
  const neutral: number[] = []
  const negative: number[] = []
  months.forEach((m) => {
    const monthReviews = REVIEWS.filter((r) => r.createdAt.startsWith(m))
    const base = monthReviews.length || 8
    const p = monthReviews.filter((r) => r.sentiment === 'positive').length || Math.round(base * rng.float(0.44, 0.62))
    const n = monthReviews.filter((r) => r.sentiment === 'negative').length || Math.round(base * rng.float(0.12, 0.24))
    positive.push(p)
    negative.push(n)
    neutral.push(Math.max(0, base - p - n))
  })
  return { months, positive, neutral, negative }
}

/** 热门关键词（用于词云与正负面榜单） */
export function getKeywords(): KeywordItem[] {
  const rng = createRng('keywords')
  const all: KeywordItem[] = []
  const push = (words: string[], sentiment: SentimentLabel) => {
    words.forEach((w) => {
      all.push({
        word: w,
        count: rng.int(60, 1800),
        sentiment,
        weight: rng.float(0.3, 1)
      })
    })
  }
  push(POSITIVE_WORDS, 'positive')
  push(NEGATIVE_WORDS, 'negative')
  push(NEUTRAL_WORDS, 'neutral')
  return all.sort((a, b) => b.count - a.count)
}

/** 品牌口碑排行 */
export function getBrandReputation(limit = 10): BrandReputation[] {
  const rng = createRng('reputation')
  return BRANDS.map((b) => {
    const list = REVIEWS.filter((r) => r.brand === b.name)
    const positive = list.filter((r) => r.sentiment === 'positive').length || rng.int(6, 40)
    const cars = CARS.filter((c) => c.brandId === b.id)
    const avgRating = cars.length ? sum(cars.map((c) => c.rating)) / cars.length : 4
    return {
      brand: b.name,
      score: round(clamp(avgRating + rng.float(-0.15, 0.2), 3.6, 4.9), 2),
      positiveRate: round(clamp((positive / (list.length || 1)) * 100, 42, 92), 1),
      mentionCount: (list.length || rng.int(20, 120)) * rng.int(60, 260),
      delta: round(rng.float(-3.2, 4.6), 1)
    }
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/** 评价列表（支持分页与筛选） */
export function queryReviews(params: { page?: number; pageSize?: number; sentiment?: string; keyword?: string; carId?: number }) {
  const page = Number(params.page ?? 1)
  const pageSize = Number(params.pageSize ?? 10)
  const kw = params.keyword?.trim().toLowerCase()
  let list = REVIEWS
  if (params.sentiment && params.sentiment !== 'all') {
    list = list.filter((r) => r.sentiment === params.sentiment)
  }
  if (params.carId) {
    list = list.filter((r) => r.carId === Number(params.carId))
  }
  if (kw) {
    list = list.filter((r) => `${r.carName}${r.content}${r.user}`.toLowerCase().includes(kw))
  }
  const total = list.length
  const start = (page - 1) * pageSize
  return { list: list.slice(start, start + pageSize), total, page, pageSize }
}
