import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { readJSON, STORAGE_KEYS, writeJSON } from '@/utils/storage'

export interface NoticeItem {
  id: number
  title: string
  desc: string
  time: string
  type: 'info' | 'success' | 'warning' | 'danger'
  read: boolean
}

/**
 * 应用级 Store：侧边栏状态、通知、全局数据源提示
 */
export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(readJSON<boolean>(STORAGE_KEYS.sidebarCollapsed, false))
  const adminSidebarCollapsed = ref(false)

  const notices = ref<NoticeItem[]>([
    {
      id: 1,
      title: '9 月销量数据已更新',
      desc: '全国 8 月销量数据集已完成清洗，共 158 款车型',
      time: '2026-09-01 09:30',
      type: 'success',
      read: false
    },
    {
      id: 2,
      title: '预测模型完成重训练',
      desc: 'XGBoost v1.8.0 准确率提升至 90.6%',
      time: '2026-09-02 06:30',
      type: 'info',
      read: false
    },
    {
      id: 3,
      title: '库存预警',
      desc: '3 款车型库存周转天数低于 25 天，建议补货',
      time: '2026-09-02 18:12',
      type: 'warning',
      read: false
    },
    {
      id: 4,
      title: '舆情数据接入延迟',
      desc: '评价数据采集任务延迟 40 分钟，正在重试',
      time: '2026-09-03 07:05',
      type: 'danger',
      read: false
    }
  ])

  const unreadCount = computed(() => notices.value.filter((n) => !n.read).length)

  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value
    writeJSON(STORAGE_KEYS.sidebarCollapsed, sidebarCollapsed.value)
  }

  function toggleAdminSidebar(): void {
    adminSidebarCollapsed.value = !adminSidebarCollapsed.value
  }

  function markAllRead(): void {
    notices.value.forEach((n) => {
      n.read = true
    })
  }

  function markRead(id: number): void {
    const item = notices.value.find((n) => n.id === id)
    if (item) item.read = true
  }

  return {
    sidebarCollapsed,
    adminSidebarCollapsed,
    notices,
    unreadCount,
    toggleSidebar,
    toggleAdminSidebar,
    markAllRead,
    markRead
  }
})
