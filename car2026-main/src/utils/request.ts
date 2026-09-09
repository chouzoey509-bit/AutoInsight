import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { mockAdapter } from '@/mock'
import { getToken, clearAuth } from './auth'

/**
 * 统一请求层
 * ------------------------------------------------------------
 * - baseURL / token / timeout 统一在这里配置
 * - 页面与 store 只依赖 src/api/*，禁止直接使用 axios
 * - 业务错误码统一转换为 ApiError，401 自动登出并跳转登录页
 */

/** 是否启用 Mock（默认开启，设置 VITE_USE_MOCK=false 后走真实后端） */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' }
})

if (USE_MOCK) {
  // 注入 Mock 适配器：对业务层完全透明
  http.defaults.adapter = mockAdapter
}

/** 业务异常 */
export class ApiError extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

/* ============================ 后端字段适配层 ============================ */
/**
 * FastAPI 返回 snake_case，前端业务层统一使用 camelCase；同时后端业务码为 200（Mock 为 0）。
 * 这里递归把响应数据的 key 从 snake_case 转为 camelCase，并对少量语义差异字段做重命名，
 * 使真实后端与内置 Mock 的数据契约保持一致，业务层 / 组件无需改动。
 */
const KEY_RENAMES: Record<string, string> = {
  model_name: 'name',
  brand_name: 'brand',
  sales_volume: 'sales',
  last_month_sales: 'lastMonthSales',
  range_km: 'range',
  power_kw: 'power',
  label: 'name'
}

function toCamelKey(key: string): string {
  if (KEY_RENAMES[key]) return KEY_RENAMES[key]
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}

function normalizeData(value: unknown): any {
  if (Array.isArray(value)) return value.map(normalizeData)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[toCamelKey(k)] = normalizeData(v)
    }
    return out
  }
  return value
}

/** 请求参数 / JSON 体：camelCase -> snake_case，使前端与 FastAPI 参数命名一致 */
function toSnakeKey(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z])([A-Z][a-z])/g, '$1_$2').toLowerCase()
}

function toSnake(value: unknown): any {
  if (Array.isArray(value)) return value.map(toSnake)
  if (value && typeof value === 'object' && !(value instanceof FormData)) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[toSnakeKey(k)] = toSnake(v)
    }
    return out
  }
  return value
}

/* ============================ 请求拦截 ============================ */

http.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    config.headers['X-Client'] = 'autoinsight-web'
    // 前端使用 camelCase 参数，后端（FastAPI）使用 snake_case，统一转换
    if (config.params && typeof config.params === 'object') {
      config.params = toSnake(config.params)
    }
    if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
      config.data = toSnake(config.data)
    }
    return config
  },
  (error) => Promise.reject(error)
)

/* ============================ 响应拦截 ============================ */

/** 401 处理：清除登录态并跳转登录（动态引入 router 避免循环依赖） */
async function handleUnauthorized(message?: string) {
  clearAuth()
  if (message) ElMessage.error(message)
  try {
    const { default: router } = await import('@/router')
    const current = router.currentRoute.value
    if (current.path !== '/login') {
      router.replace({ path: '/login', query: { redirect: current.fullPath } })
    }
  } catch {
    window.location.href = '/login'
  }
}

http.interceptors.response.use(
  (response: AxiosResponse) => {
    const payload = response.data
    // 兼容非 envelope 结构（例如后端直出裸数据）
    if (payload && typeof payload === 'object' && 'code' in payload) {
      // 后端业务码 200 与 Mock 的 0 均视为成功
      if (payload.code === 0 || payload.code === 200) return normalizeData(payload.data)
      if (payload.code === 401) {
        void handleUnauthorized(payload.message)
      }
      return Promise.reject(new ApiError(payload.code, payload.message || '请求失败'))
    }
    return normalizeData(payload)
  },
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      void handleUnauthorized('登录状态已失效，请重新登录')
      return Promise.reject(new ApiError(401, '登录状态已失效'))
    }
    if (status === 403) {
      return Promise.reject(new ApiError(403, '没有访问该资源的权限'))
    }
    if (status === 404) {
      return Promise.reject(new ApiError(404, '接口不存在'))
    }
    if (status && status >= 500) {
      return Promise.reject(new ApiError(status, '服务暂时不可用，请稍后重试'))
    }
    if (error?.code === 'ECONNABORTED') {
      return Promise.reject(new ApiError(-1, '请求超时，请检查网络或后端服务'))
    }
    return Promise.reject(new ApiError(-2, error?.message || '网络异常，请检查后端服务是否已启动'))
  }
)

/* ============================ 对外方法 ============================ */

export interface RequestOptions extends AxiosRequestConfig {
  /** 是否关闭错误提示（由调用方自行处理） */
  silent?: boolean
}

export async function request<T>(options: RequestOptions): Promise<T> {
  const { silent, ...rest } = options
  try {
    return (await http.request(rest)) as T
  } catch (err) {
    if (!silent && err instanceof ApiError) {
      ElMessage.error(err.message)
    }
    throw err
  }
}

export function get<T>(url: string, params?: Record<string, unknown>, options?: RequestOptions): Promise<T> {
  return request<T>({ url, method: 'get', params, ...options })
}

export function post<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>({ url, method: 'post', data, ...options })
}

export function put<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>({ url, method: 'put', data, ...options })
}

export function patch<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>({ url, method: 'patch', data, ...options })
}

export function del<T>(url: string, params?: Record<string, unknown>, options?: RequestOptions): Promise<T> {
  return request<T>({ url, method: 'delete', params, ...options })
}

export { http }
