<template>
  <div class="ai-page admin-logs">
    <PageHeader
      title="操作日志"
      description="记录企业用户在系统中的关键操作，包括登录、数据管理、车型变更、算法调用等行为轨迹"
      source="示例数据集 · 审计日志"
      :mock="true"
      :breadcrumbs="[{ title: '企业管理后台' }, { title: '操作日志' }]"
    >
      <template #actions>
        <el-button :loading="loading" @click="loadList">
          <el-icon><Refresh /></el-icon>
          <span style="margin-left: 4px">刷新</span>
        </el-button>
        <el-button @click="exportLogs" :disabled="!list.length">
          <el-icon><Download /></el-icon>
          <span style="margin-left: 4px">导出</span>
        </el-button>
      </template>
    </PageHeader>

    <!-- ---------------- 概览统计 ---------------- -->
    <section class="ai-cols ai-cols--4">
      <StatCard
        label="日志总数"
        :value="total"
        unit="条"
        :change="0"
        tone="brand"
        :loading="loading"
        :icon="Document"
      />
      <StatCard
        label="成功操作"
        :value="successCount"
        unit="条"
        :change="0"
        tone="nev"
        :loading="loading"
        :icon="CircleCheckFilled"
      />
      <StatCard
        label="失败操作"
        :value="failedCount"
        unit="条"
        :change="0"
        tone="danger"
        :loading="loading"
        :icon="CircleCloseFilled"
      />
      <StatCard
        label="成功率"
        :value="successRate"
        format="percent"
        unit="%"
        :change="0"
        tone="cyan"
        :loading="loading"
        :icon="DataAnalysis"
      />
    </section>

    <!-- ---------------- 筛选 ---------------- -->
    <FilterBar :loading="loading" @search="onSearch" @reset="onReset">
      <FilterField label="关键词">
        <el-input
          v-model="query.keyword"
          placeholder="操作人 / 操作动作"
          clearable
          @keyup.enter="onSearch"
        />
      </FilterField>
      <FilterField label="功能模块">
        <el-select v-model="query.module" placeholder="全部模块" clearable>
          <el-option
            v-for="m in MODULE_OPTIONS"
            :key="m"
            :label="m"
            :value="m"
          />
        </el-select>
      </FilterField>
      <FilterField label="操作结果">
        <el-select v-model="query.result" placeholder="全部结果" clearable>
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failed" />
        </el-select>
      </FilterField>
    </FilterBar>

    <!-- ---------------- 列表 ---------------- -->
    <ErrorState
      v-if="error"
      :message="error"
      description="操作日志加载失败"
      @retry="loadList"
    />

    <LoadingState v-else-if="loading && !list.length" variant="table" :rows="8" />

    <section v-else class="ai-panel admin-logs__panel">
      <DataTable
        v-model:page="page"
        v-model:page-size="pageSize"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        show-index
        empty-text="没有匹配的操作日志"
        @page-change="onPageChange"
      >
        <template #operator="{ row }">
          <div class="admin-logs__operator">
            <span
              class="admin-logs__avatar"
              :style="{ background: avatarColor(row.operator) }"
            >
              {{ row.operator.slice(0, 1) }}
            </span>
            <span class="admin-logs__name">{{ row.operator }}</span>
          </div>
        </template>

        <template #action="{ row }">
          <span class="admin-logs__action">{{ row.action }}</span>
        </template>

        <template #module="{ row }">
          <span class="ai-tag ai-tag--default">{{ row.module }}</span>
        </template>

        <template #target="{ row }">
          <span class="admin-logs__target">
            {{ row.target || '—' }}
          </span>
        </template>

        <template #result="{ row }">
          <StatusTag :status="row.result" :text="row.result === 'success' ? '成功' : '失败'" />
        </template>

        <template #ip="{ row }">
          <span class="ai-num admin-logs__ip">{{ row.ip }}</span>
        </template>

        <template #createdAt="{ row }">
          <div class="admin-logs__time">
            <span class="ai-num">{{ formatDateTime(row.createdAt) }}</span>
            <span class="admin-logs__relative">{{ fromNow(row.createdAt) }}</span>
          </div>
        </template>

        <template #action-col="{ row }">
          <el-button
            link
            type="primary"
            size="small"
            @click="showDetail(row)"
          >
            详情
          </el-button>
        </template>
      </DataTable>
    </section>

    <!-- ---------------- 详情弹窗 ---------------- -->
    <el-dialog
      v-model="detailVisible"
      title="操作日志详情"
      width="520px"
      :append-to-body="true"
    >
      <template v-if="current">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="日志编号">
            <span class="ai-num">#{{ current.id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="操作人">
            {{ current.operator }}
          </el-descriptions-item>
          <el-descriptions-item label="操作动作">
            {{ current.action }}
          </el-descriptions-item>
          <el-descriptions-item label="功能模块">
            {{ current.module }}
          </el-descriptions-item>
          <el-descriptions-item label="操作对象">
            {{ current.target || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="客户端 IP">
            <span class="ai-num">{{ current.ip }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="操作结果">
            <StatusTag
              :status="current.result"
              :text="current.result === 'success' ? '成功' : '失败'"
            />
          </el-descriptions-item>
          <el-descriptions-item label="操作时间">
            <span class="ai-num">{{ formatDateTime(current.createdAt) }}</span>
          </el-descriptions-item>
          <el-descriptions-item v-if="current.detail" label="附加说明">
            <span class="admin-logs__detail">{{ current.detail }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  CircleCheckFilled,
  CircleCloseFilled,
  DataAnalysis,
  Document,
  Download,
  Refresh
} from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import FilterField from '@/components/common/FilterField.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatCard from '@/components/common/StatCard.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import { adminLogApi } from '@/api/admin'
import { formatDateTime, fromNow } from '@/utils/format'
import type { OperationLog } from '@/types'

/**
 * 管理后台 · 操作日志
 * 数据来源：GET /api/admin/logs
 */

const MODULE_OPTIONS = [
  '认证',
  '市场分析',
  '车型管理',
  '销量预测',
  '智能推荐',
  '数据管理',
  '用户管理',
  '算法管理',
  '库存管理'
]

const list = ref<OperationLog[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const page = ref(1)
const pageSize = ref(10)

const query = reactive<{ keyword: string; module: string; result: string }>({
  keyword: '',
  module: '',
  result: ''
})

const columns = [
  { prop: 'operator', label: '操作人', width: 140, slot: 'operator' },
  { prop: 'action', label: '操作动作', minWidth: 160, slot: 'action' },
  { prop: 'module', label: '功能模块', width: 120, slot: 'module' },
  { prop: 'target', label: '操作对象', minWidth: 150, slot: 'target' },
  { prop: 'result', label: '结果', width: 90, slot: 'result' },
  { prop: 'ip', label: 'IP 地址', width: 130, slot: 'ip' },
  { prop: 'createdAt', label: '操作时间', width: 180, slot: 'createdAt' },
  { prop: '_action', label: '操作', width: 80, fixed: 'right' as const, slot: 'action-col' }
]

// 详情弹窗
const detailVisible = ref(false)
const current = ref<OperationLog | null>(null)

// 概览统计（基于当前页数据估算）
const successCount = computed(() => list.value.filter((l) => l.result === 'success').length)
const failedCount = computed(() => list.value.filter((l) => l.result === 'failed').length)
const successRate = computed(() => {
  const len = list.value.length
  if (!len) return 0
  return successCount.value / len
})

/** 头像首字母背景色 */
const AVATAR_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'
]
function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

async function loadList(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const res = await adminLogApi.list({
      page: page.value,
      pageSize: pageSize.value,
      keyword: query.keyword || undefined,
      module: query.module || undefined,
      result: query.result || undefined
    })
    list.value = res.list
    total.value = res.total
  } catch (e) {
    error.value = e instanceof Error ? e.message : '操作日志加载失败'
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function onSearch(): void {
  page.value = 1
  void loadList()
}

function onReset(): void {
  query.keyword = ''
  query.module = ''
  query.result = ''
  page.value = 1
  void loadList()
}

function onPageChange({ page: p, pageSize: s }: { page: number; pageSize: number }): void {
  page.value = p
  pageSize.value = s
  void loadList()
}

function showDetail(row: OperationLog): void {
  current.value = row
  detailVisible.value = true
}

/** 导出当前筛选条件下的日志为 CSV */
function exportLogs(): void {
  if (!list.value.length) {
    ElMessage.warning('当前没有可导出的日志')
    return
  }
  const header = ['编号', '操作人', '操作动作', '功能模块', '操作对象', 'IP地址', '结果', '操作时间', '附加说明']
  const rows = list.value.map((l) => [
    l.id,
    l.operator,
    l.action,
    l.module,
    l.target || '',
    l.ip,
    l.result === 'success' ? '成功' : '失败',
    l.createdAt,
    l.detail || ''
  ])
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `operation_logs_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${list.value.length} 条操作日志`)
}

onMounted(() => {
  void loadList()
})
</script>

<style scoped lang="scss">
.admin-logs__panel {
  overflow: hidden;
}

.admin-logs__operator {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.admin-logs__avatar {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: #fff;
  font-size: var(--ai-fs-xs);
  font-weight: 600;
  flex-shrink: 0;
}

.admin-logs__name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-logs__action {
  font-weight: 500;
}

.admin-logs__target {
  color: var(--ai-text-secondary);
  font-size: var(--ai-fs-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-logs__ip {
  color: var(--ai-text-secondary);
  font-size: var(--ai-fs-sm);
}

.admin-logs__time {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.admin-logs__relative {
  color: var(--ai-text-tertiary);
  font-size: var(--ai-fs-xs);
}

.admin-logs__detail {
  color: var(--ai-danger);
  font-size: var(--ai-fs-sm);
}
</style>
