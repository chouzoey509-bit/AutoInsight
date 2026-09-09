import type {
  AdminOverview,
  AdminUserItem,
  AlgorithmTask,
  Brand,
  Car,
  DataFileItem,
  InventoryItem,
  OperationLog,
  OrderItem,
  OrderStatus,
  PageResult,
  ProportionItem,
  UserStatus
} from '@/types'
import { del, get, patch, post, put } from '@/utils/request'

/**
 * 企业管理后台接口
 * 概览 / 用户 / 品牌 / 车型 / 销量 / 库存 / 订单 / 算法 / 日志 / 数据文件
 */

export const adminApi = {
  overview(): Promise<AdminOverview> {
    return get<AdminOverview>('/admin/overview')
  },
  salesTrend(): Promise<{ months: string[]; sales: number[]; orders: number[] }> {
    return get<{ months: string[]; sales: number[]; orders: number[] }>('/admin/sales-trend')
  },
  orderStatus(): Promise<ProportionItem[]> {
    return get<ProportionItem[]>('/admin/order-status')
  },
  carRanking(limit = 8): Promise<{ name: string; value: number; brand: string }[]> {
    return get<{ name: string; value: number; brand: string }[]>('/admin/car-ranking', { limit })
  },
  inventoryTrend(): Promise<{ months: string[]; data: number[] }> {
    return get<{ months: string[]; data: number[] }>('/admin/inventory-trend')
  }
}

export const adminUserApi = {
  list(params: {
    page?: number
    pageSize?: number
    keyword?: string
    role?: string
    status?: string
  }): Promise<PageResult<AdminUserItem>> {
    return get<PageResult<AdminUserItem>>('/admin/users', params as Record<string, unknown>)
  },
  update(id: number, payload: Partial<AdminUserItem>): Promise<AdminUserItem> {
    return put<AdminUserItem>(`/admin/users/${id}`, payload)
  },
  updateStatus(id: number, status: UserStatus): Promise<AdminUserItem> {
    return patch<AdminUserItem>(`/admin/users/${id}/status`, { status })
  }
}

export const adminBrandApi = {
  list(params: {
    page?: number
    pageSize?: number
    keyword?: string
    group?: string
    sortBy?: string
    sortOrder?: string
  }): Promise<PageResult<Brand>> {
    return get<PageResult<Brand>>('/admin/brands', params as Record<string, unknown>)
  }
}

export const adminCarApi = {
  list(params: {
    page?: number
    pageSize?: number
    keyword?: string
    brandId?: number | string
    energyType?: string
    category?: string
    sortBy?: string
    sortOrder?: string
  }): Promise<PageResult<Car>> {
    return get<PageResult<Car>>('/admin/cars', params as Record<string, unknown>)
  },
  create(payload: Partial<Car>): Promise<Car> {
    return post<Car>('/cars', payload)
  },
  update(id: number, payload: Partial<Car>): Promise<Car> {
    return put<Car>(`/cars/${id}`, payload)
  },
  remove(id: number): Promise<{ id: number }> {
    return del<{ id: number }>(`/cars/${id}`)
  }
}

export const adminSalesApi = {
  list(params: { page?: number; pageSize?: number; span?: number }): Promise<
    PageResult<{ carId: number; carName: string; brand: string; months: string[]; values: number[]; total: number }>
  > {
    return get<PageResult<{ carId: number; carName: string; brand: string; months: string[]; values: number[]; total: number }>>(
      '/admin/sales',
      params as Record<string, unknown>
    )
  }
}

export const adminInventoryApi = {
  list(params: {
    page?: number
    pageSize?: number
    keyword?: string
    status?: string
    sortBy?: string
    sortOrder?: string
  }): Promise<PageResult<InventoryItem>> {
    return get<PageResult<InventoryItem>>('/admin/inventory', params as Record<string, unknown>)
  }
}

export const adminOrderApi = {
  list(params: {
    page?: number
    pageSize?: number
    keyword?: string
    status?: OrderStatus | string
  }): Promise<PageResult<OrderItem>> {
    return get<PageResult<OrderItem>>('/admin/orders', params as Record<string, unknown>)
  }
}

export const adminAlgorithmApi = {
  list(): Promise<AlgorithmTask[]> {
    return get<AlgorithmTask[]>('/admin/algorithms')
  },
  updateStatus(id: number, status: AlgorithmTask['status']): Promise<AlgorithmTask> {
    return patch<AlgorithmTask>(`/admin/algorithms/${id}/status`, { status })
  }
}

export const adminLogApi = {
  list(params: {
    page?: number
    pageSize?: number
    keyword?: string
    module?: string
    result?: string
  }): Promise<PageResult<OperationLog>> {
    return get<PageResult<OperationLog>>('/admin/logs', params as Record<string, unknown>)
  }
}

export const adminDataApi = {
  files(type?: string): Promise<DataFileItem[]> {
    return get<DataFileItem[]>('/admin/data-files', type ? { type } : undefined)
  },
  upload(payload: { name: string; size: number; type: string }): Promise<DataFileItem> {
    return post<DataFileItem>('/admin/data/upload', payload)
  },
  remove(id: number): Promise<{ id: number }> {
    return del<{ id: number }>(`/admin/data-files/${id}`)
  }
}
