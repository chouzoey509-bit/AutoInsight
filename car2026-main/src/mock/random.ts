/**
 * 确定性随机数工具
 * ------------------------------------------------------------
 * Mock 数据必须「可复现」：同一个 seed 每次刷新得到同一份数据，
 * 否则图表会在每次刷新时跳变，不利于演示与联调。
 */

/** mulberry32：轻量可复现伪随机数生成器 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 字符串 → 32 位整数哈希（FNV-1a 变体） */
export function hashString(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export interface Rng {
  /** [0,1) */
  next: () => number
  /** [min,max] 浮点 */
  float: (min: number, max: number) => number
  /** [min,max] 整数（含端点） */
  int: (min: number, max: number) => number
  /** 按权重取索引 */
  pick: <T>(arr: readonly T[]) => T
  /** 不重复取 n 个 */
  sample: <T>(arr: readonly T[], n: number) => T[]
  /** 布尔 */
  bool: (probability?: number) => boolean
}

export function createRng(seed: number | string): Rng {
  const next = mulberry32(typeof seed === 'string' ? hashString(seed) : seed)
  const float = (min: number, max: number) => min + next() * (max - min)
  const int = (min: number, max: number) => Math.floor(float(min, max + 1))
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)]
  const sample = <T>(arr: readonly T[], n: number): T[] => {
    const pool = arr.slice()
    const out: T[] = []
    const size = Math.min(n, pool.length)
    for (let i = 0; i < size; i++) {
      out.push(pool.splice(Math.floor(next() * pool.length), 1)[0])
    }
    return out
  }
  const bool = (probability = 0.5) => next() < probability
  return { next, float, int, pick, sample, bool }
}

/** 保留小数位 */
export function round(value: number, digits = 2): number {
  const p = 10 ** digits
  return Math.round(value * p) / p
}

/** 限制区间 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** 数组求和 */
export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0)
}

/** 生成月度序列：从 endYear/endMonth 往前推 count 个月 */
export function buildMonths(count: number, endYear: number, endMonth: number): string[] {
  const out: string[] = []
  let y = endYear
  let m = endMonth
  for (let i = 0; i < count; i++) {
    out.unshift(`${y}-${String(m).padStart(2, '0')}`)
    m -= 1
    if (m === 0) {
      m = 12
      y -= 1
    }
  }
  return out
}

/** 月份加 n 个月 */
export function addMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const total = y * 12 + (m - 1) + delta
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  return `${ny}-${String(nm).padStart(2, '0')}`
}
