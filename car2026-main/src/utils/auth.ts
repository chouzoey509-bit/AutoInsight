/** 登录态本地存储（独立于 Pinia，避免请求层与 store 循环依赖） */

const TOKEN_KEY = 'autoinsight_token'
const USER_KEY = 'autoinsight_user'
const REMEMBER_KEY = 'autoinsight_remember'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function store(): StorageLike {
  // 记住登录 → localStorage；否则 → sessionStorage（关闭浏览器即失效）
  const remember = typeof localStorage !== 'undefined' && localStorage.getItem(REMEMBER_KEY) === '1'
  return remember ? localStorage : sessionStorage
}

export function getToken(): string {
  const fromLocal = localStorage.getItem(TOKEN_KEY)
  if (fromLocal) return fromLocal
  return sessionStorage.getItem(TOKEN_KEY) ?? ''
}

export function setToken(token: string, remember = true): void {
  localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0')
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token)
    sessionStorage.removeItem(TOKEN_KEY)
  } else {
    sessionStorage.setItem(TOKEN_KEY, token)
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function getCachedUser<T>(): T | null {
  try {
    const raw = store().getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function setCachedUser<T>(user: T): void {
  try {
    store().setItem(USER_KEY, JSON.stringify(user))
  } catch {
    /* 忽略存储配额异常 */
  }
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}
