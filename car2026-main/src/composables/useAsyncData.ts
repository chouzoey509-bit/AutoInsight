import { ref } from 'vue'

/**
 * 异步数据通用封装
 * 统一维护 loading / error / data 三态，避免每个页面重复写 try-catch
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  options: { immediate?: boolean; initial?: T | null } = {}
) {
  const { immediate = true, initial = null } = options
  const data = ref<T | null>(initial) as { value: T | null }
  const loading = ref(false)
  const error = ref('')

  async function run(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      data.value = await fetcher()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '数据加载失败'
      data.value = null
    } finally {
      loading.value = false
    }
  }

  if (immediate) void run()

  return { data, loading, error, run, refresh: run }
}

export default useAsyncData
