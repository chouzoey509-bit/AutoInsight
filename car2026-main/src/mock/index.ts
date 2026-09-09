import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from 'axios'
import { mockRoutes, MockError } from './handlers'

/**
 * Mock 适配器（Axios Adapter）
 * ------------------------------------------------------------
 * 以 Axios 自定义 adapter 的形式注入，业务层（src/api、stores、views）
 * 完全感知不到 Mock 的存在。切换真实后端只需：
 *    VITE_USE_MOCK=false  +  VITE_API_BASE_URL=http://<backend>/api
 */

const DEFAULT_DELAY = 240

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 去掉 baseURL，得到规范化的 API 路径 */
function normalizePath(url = '', baseURL = ''): { path: string; search: string } {
  let p = url
  if (baseURL && p.startsWith(baseURL)) p = p.slice(baseURL.length)
  const [pathname, search = ''] = p.split('?')
  if (!pathname.startsWith('/')) p = `/${pathname}`
  return { path: pathname.startsWith('/') ? pathname : `/${pathname}`, search }
}

function parseSearch(search: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!search) return out
  search.split('&').forEach((pair) => {
    if (!pair) return
    const [k, v = ''] = pair.split('=')
    out[decodeURIComponent(k)] = decodeURIComponent(v)
  })
  return out
}

function toRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {}
  const out: Record<string, string> = {}
  Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    out[k] = Array.isArray(v) ? v.join(',') : String(v)
  })
  return out
}

function parseBody(data: unknown): Record<string, unknown> | undefined {
  if (!data) return undefined
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Record<string, unknown>
    } catch {
      return undefined
    }
  }
  return data as Record<string, unknown>
}

/** 命中路由并解析路径参数 */
function matchRoute(method: string, path: string) {
  const upper = method.toUpperCase()
  const segs = path.split('/').filter(Boolean)
  for (const route of mockRoutes) {
    if (route.method !== upper) continue
    const rSegs = route.path.split('/').filter(Boolean)
    if (rSegs.length !== segs.length) continue
    const params: Record<string, string> = {}
    let matched = true
    for (let i = 0; i < rSegs.length; i++) {
      const r = rSegs[i]
      if (r.startsWith(':')) {
        params[r.slice(1)] = decodeURIComponent(segs[i])
      } else if (r !== segs[i]) {
        matched = false
        break
      }
    }
    if (matched) return { route, params }
  }
  return null
}

export const mockAdapter: AxiosAdapter = async (config: AxiosRequestConfig) => {
  const delay = Number(import.meta.env.VITE_MOCK_DELAY ?? DEFAULT_DELAY)
  const { path, search } = normalizePath(config.url, config.baseURL)
  const method = (config.method ?? 'get').toUpperCase()

  await sleep(delay)

  const query = { ...parseSearch(search), ...toRecord(config.params) }
  const body = parseBody(config.data)
  const hit = matchRoute(method, path)

  let code = 0
  let message = 'ok'
  let data: unknown = null

  try {
    if (!hit) {
      throw new MockError(404, `Mock 服务未实现该接口：${method} ${path}`)
    }
    data = hit.route.handler({ params: hit.params, query, body })
  } catch (err) {
    if (err instanceof MockError) {
      code = err.code
      message = err.message
    } else {
      code = 500
      message = err instanceof Error ? err.message : 'Mock 服务内部错误'
      // 开发期保留堆栈，便于定位 Mock 数据问题
      console.warn('[mock] 处理失败：', method, path, err)
    }
  }

  const response: AxiosResponse = {
    data: { code, message, data, timestamp: Date.now() },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: config as AxiosResponse['config']
  }

  return response
}

export default mockAdapter
