import dayjs from 'dayjs'

/** 数字与日期格式化工具（全站统一口径） */

/** 千分位 */
export function formatNumber(value?: number | string, digits = 0): string {
  if (value === undefined || value === null || value === '') return '--'
  const n = Number(value)
  if (!Number.isFinite(n)) return '--'
  return n.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

/** 紧凑格式：1.2万 / 3.4亿 */
export function formatCompact(value?: number, digits = 1): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return '--'
  const abs = Math.abs(value)
  if (abs >= 100_000_000) return `${(value / 100_000_000).toFixed(digits)}亿`
  if (abs >= 10_000) return `${(value / 10_000).toFixed(digits)}万`
  return formatNumber(value)
}

/** 百分比 */
export function formatPercent(value?: number, digits = 1): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return '--'
  return `${value.toFixed(digits)}%`
}

/** 变化量（带正负号） */
export function formatDelta(value?: number, digits = 1): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return '--'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}%`
}

/** 价格（万元） */
export function formatPrice(value?: number, digits = 2): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return '--'
  return `${value.toFixed(digits)}万`
}

/** 文件大小 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i += 1
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/** 日期：YYYY-MM-DD HH:mm:ss */
export function formatDateTime(value?: string): string {
  if (!value) return '--'
  const d = dayjs(value)
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm:ss') : value
}

/** 日期：YYYY-MM-DD */
export function formatDate(value?: string): string {
  if (!value) return '--'
  const d = dayjs(value)
  return d.isValid() ? d.format('YYYY-MM-DD') : value
}

/** 月份：2026-08 → 2026年8月 */
export function formatMonth(value: string): string {
  const [y, m] = value.split('-')
  return `${y}年${Number(m)}月`
}

/** 月份短格式：2026-08 → 08月 */
export function formatMonthShort(value: string): string {
  const m = value.split('-')[1]
  return `${m}月`
}

/** 相对时间 */
export function fromNow(value?: string): string {
  if (!value) return '--'
  const d = dayjs(value)
  if (!d.isValid()) return value
  const diff = Date.now() - d.valueOf()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} 小时前`
  const day = Math.floor(hour / 24)
  if (day < 30) return `${day} 天前`
  return d.format('YYYY-MM-DD')
}

/** 数值 → 涨跌语义类名（中国习惯：涨红跌绿） */
export function deltaClass(value?: number): string {
  if (!value) return ''
  return value > 0 ? 'ai-up' : 'ai-down'
}

/** 数值 → 涨跌箭头 */
export function deltaArrow(value?: number): string {
  if (!value) return ''
  return value > 0 ? '↑' : '↓'
}
