/** 本地存储封装（带 JSON 安全解析） */

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 忽略隐私模式下的写入异常 */
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* noop */
  }
}

/** 收藏 / 浏览记录 / 对比列表的存储 key */
export const STORAGE_KEYS = {
  favorites: 'autoinsight_favorites',
  history: 'autoinsight_history',
  compare: 'autoinsight_compare',
  marketFilters: 'autoinsight_market_filters',
  sidebarCollapsed: 'autoinsight_sidebar_collapsed'
} as const
