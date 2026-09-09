"use strict";
import axios from "axios";
import { ElMessage } from "element-plus";
import { mockAdapter } from "@/mock";
import { getToken, clearAuth } from "./auth";
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15e3,
  headers: { "Content-Type": "application/json" }
});
if (USE_MOCK) {
  http.defaults.adapter = mockAdapter;
}
export class ApiError extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}
const KEY_RENAMES = {
  model_name: "name",
  brand_name: "brand",
  sales_volume: "sales",
  last_month_sales: "lastMonthSales",
  range_km: "range",
  power_kw: "power",
  label: "name"
};
function toCamelKey(key) {
  if (KEY_RENAMES[key]) return KEY_RENAMES[key];
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}
function normalizeData(value) {
  if (Array.isArray(value)) return value.map(normalizeData);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[toCamelKey(k)] = normalizeData(v);
    }
    return out;
  }
  return value;
}
function toSnakeKey(key) {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/([A-Z])([A-Z][a-z])/g, "$1_$2").toLowerCase();
}
function toSnake(value) {
  if (Array.isArray(value)) return value.map(toSnake);
  if (value && typeof value === "object" && !(value instanceof FormData)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[toSnakeKey(k)] = toSnake(v);
    }
    return out;
  }
  return value;
}
http.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["X-Client"] = "autoinsight-web";
    if (config.params && typeof config.params === "object") {
      config.params = toSnake(config.params);
    }
    if (config.data && typeof config.data === "object" && !(config.data instanceof FormData)) {
      config.data = toSnake(config.data);
    }
    return config;
  },
  (error) => Promise.reject(error)
);
async function handleUnauthorized(message) {
  clearAuth();
  if (message) ElMessage.error(message);
  try {
    const { default: router } = await import("@/router");
    const current = router.currentRoute.value;
    if (current.path !== "/login") {
      router.replace({ path: "/login", query: { redirect: current.fullPath } });
    }
  } catch {
    window.location.href = "/login";
  }
}
http.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (payload && typeof payload === "object" && "code" in payload) {
      if (payload.code === 0 || payload.code === 200) return normalizeData(payload.data);
      if (payload.code === 401) {
        void handleUnauthorized(payload.message);
      }
      return Promise.reject(new ApiError(payload.code, payload.message || "\u8BF7\u6C42\u5931\u8D25"));
    }
    return normalizeData(payload);
  },
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      void handleUnauthorized("\u767B\u5F55\u72B6\u6001\u5DF2\u5931\u6548\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55");
      return Promise.reject(new ApiError(401, "\u767B\u5F55\u72B6\u6001\u5DF2\u5931\u6548"));
    }
    if (status === 403) {
      return Promise.reject(new ApiError(403, "\u6CA1\u6709\u8BBF\u95EE\u8BE5\u8D44\u6E90\u7684\u6743\u9650"));
    }
    if (status === 404) {
      return Promise.reject(new ApiError(404, "\u63A5\u53E3\u4E0D\u5B58\u5728"));
    }
    if (status && status >= 500) {
      return Promise.reject(new ApiError(status, "\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"));
    }
    if (error?.code === "ECONNABORTED") {
      return Promise.reject(new ApiError(-1, "\u8BF7\u6C42\u8D85\u65F6\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u6216\u540E\u7AEF\u670D\u52A1"));
    }
    return Promise.reject(new ApiError(-2, error?.message || "\u7F51\u7EDC\u5F02\u5E38\uFF0C\u8BF7\u68C0\u67E5\u540E\u7AEF\u670D\u52A1\u662F\u5426\u5DF2\u542F\u52A8"));
  }
);
export async function request(options) {
  const { silent, ...rest } = options;
  try {
    return await http.request(rest);
  } catch (err) {
    if (!silent && err instanceof ApiError) {
      ElMessage.error(err.message);
    }
    throw err;
  }
}
export function get(url, params, options) {
  return request({ url, method: "get", params, ...options });
}
export function post(url, data, options) {
  return request({ url, method: "post", data, ...options });
}
export function put(url, data, options) {
  return request({ url, method: "put", data, ...options });
}
export function patch(url, data, options) {
  return request({ url, method: "patch", data, ...options });
}
export function del(url, params, options) {
  return request({ url, method: "delete", params, ...options });
}
export { http };
