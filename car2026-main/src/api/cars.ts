import type { Car, CarQuery, CarSalesHistory, PageResult, ReviewItem } from '@/types'
import { del, get, post, put } from '@/utils/request'

/**
 * 车型接口
 * GET    /api/cars
 * GET    /api/cars/options
 * GET    /api/cars/:id
 * GET    /api/cars/:id/sales
 * GET    /api/cars/:id/similar
 * GET    /api/cars/:id/reviews
 * POST   /api/cars
 * PUT    /api/cars/:id
 * DELETE /api/cars/:id
 */
export const carApi = {
  list(params: CarQuery): Promise<PageResult<Car>> {
    return get<PageResult<Car>>('/cars', params as Record<string, unknown>)
  },
  options(): Promise<CarOptions> {
    return get<CarOptions>('/cars/options')
  },
  detail(id: number | string): Promise<Car> {
    return get<Car>(`/cars/${id}`)
  },
  sales(id: number | string, span = 18): Promise<CarSalesHistory> {
    return get<CarSalesHistory>(`/cars/${id}/sales`, { span })
  },
  similar(id: number | string, limit = 4): Promise<Car[]> {
    return get<Car[]>(`/cars/${id}/similar`, { limit })
  },
  reviews(id: number | string, params: { page?: number; pageSize?: number } = {}): Promise<PageResult<ReviewItem>> {
    return get<PageResult<ReviewItem>>(`/cars/${id}/reviews`, params as Record<string, unknown>)
  },
  create(payload: Partial<Car>): Promise<Car> {
    return post<Car>('/cars', payload)
  },
  update(id: number | string, payload: Partial<Car>): Promise<Car> {
    return put<Car>(`/cars/${id}`, payload)
  },
  remove(id: number | string): Promise<{ id: number }> {
    return del<{ id: number }>(`/cars/${id}`)
  }
}

export interface CarOptions {
  brands: { id: number; name: string }[]
  energies: { value: string; label: string }[]
  categories: string[]
  years: number[]
  priceBuckets: { label: string; min: number; max: number }[]
  regions: string[]
  months: string[]
}
