import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { carApi } from '@/api/cars'
import type { Car, CarCategory, CarQuery, CarSalesHistory, EnergyType } from '@/types'
import { readJSON, STORAGE_KEYS, writeJSON } from '@/utils/storage'

/**
 * 车型 Store
 * 负责：车型列表查询、筛选、详情、对比、收藏、浏览记录
 */
export const useCarStore = defineStore('car', () => {
  const list = ref<Car[]>([])
  const total = ref(0)
  const loading = ref(false)

  const current = ref<Car | null>(null)
  const currentSales = ref<CarSalesHistory | null>(null)
  const similar = ref<Car[]>([])
  const detailLoading = ref(false)

  /** 列表筛选条件（与后端 /api/cars 参数一致） */
  const filters = ref<CarQuery>({
    keyword: '',
    brandId: '',
    energyType: '',
    category: '',
    priceMin: '',
    priceMax: '',
    year: '',
    page: 1,
    pageSize: 10,
    sortBy: 'sales',
    sortOrder: 'desc'
  })

  /** 对比栏（本地持久化） */
  const compareIds = ref<number[]>(readJSON<number[]>(STORAGE_KEYS.compare, []))
  /** 收藏车型 */
  const favorites = ref<number[]>(readJSON<number[]>(STORAGE_KEYS.favorites, []))
  /** 浏览记录 */
  const history = ref<number[]>(readJSON<number[]>(STORAGE_KEYS.history, []))

  const compareCount = computed(() => compareIds.value.length)
  const favoriteCount = computed(() => favorites.value.length)

  async function fetchList(params: Partial<CarQuery> = {}): Promise<void> {
    loading.value = true
    try {
      const query = { ...filters.value, ...params }
      const res = await carApi.list(query)
      list.value = res.list
      total.value = res.total
      filters.value.page = res.page
      filters.value.pageSize = res.pageSize
    } finally {
      loading.value = false
    }
  }

  function setFilter<K extends keyof CarQuery>(key: K, value: CarQuery[K]): void {
    filters.value[key] = value
    filters.value.page = 1
  }

  function resetFilters(): void {
    filters.value = {
      keyword: '',
      brandId: '',
      energyType: '',
      category: '',
      priceMin: '',
      priceMax: '',
      year: '',
      page: 1,
      pageSize: 10,
      sortBy: 'sales',
      sortOrder: 'desc'
    }
  }

  async function fetchDetail(id: number | string): Promise<Car> {
    detailLoading.value = true
    try {
      const [car, sales, sim] = await Promise.all([
        carApi.detail(id),
        carApi.sales(id, 18),
        carApi.similar(id, 4)
      ])
      current.value = car
      currentSales.value = sales
      similar.value = sim
      pushHistory(car.id)
      return car
    } finally {
      detailLoading.value = false
    }
  }

  /* ---------------- 对比 ---------------- */

  function toggleCompare(id: number): { ok: boolean; message?: string } {
    const idx = compareIds.value.indexOf(id)
    if (idx >= 0) {
      compareIds.value.splice(idx, 1)
      persist()
      return { ok: true }
    }
    if (compareIds.value.length >= 3) {
      return { ok: false, message: '最多同时对比 3 款车型' }
    }
    compareIds.value.push(id)
    persist()
    return { ok: true }
  }

  function removeCompare(id: number): void {
    compareIds.value = compareIds.value.filter((i) => i !== id)
    persist()
  }

  function clearCompare(): void {
    compareIds.value = []
    persist()
  }

  const inCompare = (id: number): boolean => compareIds.value.includes(id)

  /* ---------------- 收藏 ---------------- */

  function toggleFavorite(id: number): boolean {
    const idx = favorites.value.indexOf(id)
    if (idx >= 0) {
      favorites.value.splice(idx, 1)
      persist()
      return false
    }
    favorites.value.unshift(id)
    persist()
    return true
  }

  const isFavorite = (id: number): boolean => favorites.value.includes(id)

  /* ---------------- 浏览记录 ---------------- */

  function pushHistory(id: number): void {
    history.value = [id, ...history.value.filter((i) => i !== id)].slice(0, 20)
    persist()
  }

  function clearHistory(): void {
    history.value = []
    persist()
  }

  function persist(): void {
    writeJSON(STORAGE_KEYS.compare, compareIds.value)
    writeJSON(STORAGE_KEYS.favorites, favorites.value)
    writeJSON(STORAGE_KEYS.history, history.value)
  }

  return {
    list,
    total,
    loading,
    filters,
    current,
    currentSales,
    similar,
    detailLoading,
    compareIds,
    favorites,
    history,
    compareCount,
    favoriteCount,
    fetchList,
    fetchDetail,
    setFilter,
    resetFilters,
    toggleCompare,
    removeCompare,
    clearCompare,
    inCompare,
    toggleFavorite,
    isFavorite,
    pushHistory,
    clearHistory
  }
})

export type CarFilterKey = 'keyword' | 'brandId' | 'energyType' | 'category' | 'priceMin' | 'priceMax' | 'year'
export type { Car, CarCategory, CarQuery, EnergyType }
