<template>
  <div class="ai-page admin-inventory">
    <PageHeader
      title="库存管理"
      description="监控各仓库车型库存水位、在途数量与周转天数，识别库存紧张与积压风险"
      source="示例数据集 · 库存台账"
      :mock="true"
      :breadcrumbs="[{ title: '企业管理后台' }, { title: '库存管理' }]"
    >
      <template #actions>
        <el-button :loading="loading" @click="loadList">
          <el-icon><Refresh /></el-icon>
          <span style="margin-left: 4px">刷新</span>
        </el-button>
      </template>
    </PageHeader>

    <!-- ---------------- 概览 ---------------- -->
    <section class="ai-cols ai-cols--4">
      <StatCard
        label="库存总量"
        :value="summary.total"
        unit="辆"
        :change="3.6"
        tone="brand"
        :loading="loading"
        :icon="Box"
      />
      <StatCard
        label="在途数量"
        :value="summary.inbound"
        unit="辆"
        :change="8.2"
        tone="cyan"
        :loading="loading"
        :icon="Van"
      />
      <StatCard
        label="紧张车型"
        :value="summary.tense"
        unit="款"
        :change="-2.4"
        tone="danger"
        :loading="loading"
        :icon="WarningFilled"
      />
      <StatCard
        label="平均周转天数"
        :value="summary.turnover"
        unit="天"
        :change="-4.1"
        tone="warn"
        :loading="loading"
        :icon="Timer"
      />
    </section>

    <!-- ---------------- 筛选 ---------------- -->
    <FilterBar :loading="loading" @search="onSearch" @reset="onReset">
      <FilterField label="关键词">
        <el-input v-model="query.keyword" placeholder="车型 / 品牌 / 仓库" clearable />
      </FilterField>
      <FilterField label="库存状态">
        <el-select v-model="query.status" placeholder="全部状态" clearable>
          <el-option label="库存充足" value="充足" />
          <el-option label="库存偏低" value="偏低" />
          <el-option label="库存紧张" value="紧张" />
        </el-select>
      </FilterField>
    </FilterBar>

    <!-- ---------------- 列表 ---------------- -->
    <section class="ai-panel admin-inventory__panel">
      <DataTable
        v-model:page="page"
        v-model:page-size="pageSize"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        show-index
        :default-sort="{ prop: 'quantity', order: 'descending' }"
        empty-text="没有匹配的库存记录"
        @page-change="onPageChange"
        @sort-change="onSortChange"
      >
        <template #carName="{ row }">
          <div class="admin-inventory__car">
            <span class="admin-inventory__brand" :style="{ background: brandColor(row.brand) }">
              {{ row.brand.slice(0, 1) }}
            </span>
            <div class="admin-inventory__car-info">
              <span class="admin-inventory__car-name">{{ row.carName }}</span>
              <span class="admin-inventory__car-meta">{{ row.brand }} · {{ row.warehouse }}</span>
            </div>
          </div>
        </template>

        <template #quantity="{ row }">
          <span class="ai-num admin-inventory__qty">{{ formatNumber(row.quantity) }}</span>
        </template>

        <template #ratio="{ row }">
          <div class="admin-inventory__ratio">
            <div class="ai-bar">
              <div class="ai-bar__fill" :style="{ width: `${stockRatio(row)}%`, background: ratioColor(row) }" />
            </div>
            <span class="ai-num">可支撑 {{ monthsOfStock(row).toFixed(1) }} 个月</span>
          </div>
        </template>

        <template #turnoverDays="{ row }">
          <span class="ai-num">{{ row.turnoverDays }} 天</span>
        </template>

        <template #status="{ row }">
          <StatusTag :status="row.status" />
        </template>

        <template #action="{ row }">
          <el-button link type="primary" size="small" @click="$router.push(`/cars/${row.carId}`)">
            车型详情
          </el-button>
        </template>
      </DataTable>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Box, Refresh, Timer, Van, WarningFilled } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import FilterField from '@/components/common/FilterField.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatCard from '@/components/common/StatCard.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { adminInventoryApi } from '@/api/admin'
import { brandColor } from '@/utils/brand'
import { formatNumber } from '@/utils/format'
import type { InventoryItem } from '@/types'

/**
 * 管理后台 · 库存管理
 * 数据来源：GET /api/admin/inventory
 */

const list = ref<InventoryItem[]>([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)

const query = reactive<{ keyword: string; status: string }>({ keyword: '', status: '' })
const sortBy = ref('quantity')
const sortOrder = ref<'asc' | 'desc'>('desc')

const columns = [
  { prop: 'carName', label: '车型', minWidth: 220, slot: 'carName' },
  { prop: 'quantity', label: '库存量', width: 110, sortable: true, slot: 'quantity' },
  { prop: 'inbound', label: '在途', width: 90, sortable: true },
  { prop: 'monthlySales', label: '月均销量', width: 110, sortable: true },
  { prop: 'ratio', label: '库存可支撑', minWidth: 180, slot: 'ratio' },
  { prop: 'turnoverDays', label: '周转天数', width: 110, sortable: true, slot: 'turnoverDays' },
  { prop: 'status', label: '状态', width: 110, slot: 'status' },
  { prop: 'action', label: '操作', width: 110, fixed: 'right' as const, slot: 'action' }
]

const summary = computed(() => {
  const rows = list.value
  const totalQty = rows.reduce((s, r) => s + r.quantity, 0)
  const inbound = rows.reduce((s, r) => s + r.inbound, 0)
  const tense = rows.filter((r) => r.status === '紧张').length
  const turnover = rows.length
    ? Math.round(rows.reduce((s, r) => s + r.turnoverDays, 0) / rows.length)
    : 0
  return { total: totalQty, inbound, tense, turnover }
})

/** 当前库存可支撑月数 */
function monthsOfStock(row: InventoryItem): number {
  return row.monthlySales > 0 ? row.quantity / row.monthlySales : 0
}

function stockRatio(row: InventoryItem): number {
  return Math.min(100, (monthsOfStock(row) / 6) * 100)
}

function ratioColor(row: InventoryItem): string {
  const m = monthsOfStock(row)
  if (m >= 3) return 'var(--ai-nev)'
  if (m >= 1.5) return 'var(--ai-warn)'
  return 'var(--ai-danger)'
}

async function loadList(): Promise<void> {
  loading.value = true
  try {
    const res = await adminInventoryApi.list({
      page: page.value,
      pageSize: pageSize.value,
      keyword: query.keyword || undefined,
      status: query.status || undefined,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    })
    list.value = res.list
    total.value = res.total
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '库存列表加载失败')
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
  query.status = ''
  page.value = 1
  void loadList()
}

function onPageChange({ page: p, pageSize: s }: { page: number; pageSize: number }): void {
  page.value = p
  pageSize.value = s
  void loadList()
}

function onSortChange({ prop, order }: { prop: string; order: string }): void {
  sortBy.value = prop || 'quantity'
  sortOrder.value = (order || 'desc') as 'asc' | 'desc'
  void loadList()
}

onMounted(() => {
  void loadList()
})
</script>

<style scoped lang="scss">
.admin-inventory__panel {
  overflow: hidden;
}

.admin-inventory__car {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.admin-inventory__brand {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: var(--ai-radius-xs);
  color: #fff;
  font-size: var(--ai-fs-xs);
  font-weight: 600;
  flex-shrink: 0;
}

.admin-inventory__car-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.35;
}

.admin-inventory__car-name {
  font-size: var(--ai-fs-sm);
  color: var(--ai-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-inventory__car-meta {
  font-size: 10px;
  color: var(--ai-text-4);
}

.admin-inventory__qty {
  color: var(--ai-text-1);
  font-weight: var(--ai-fw-medium);
}

.admin-inventory__ratio {
  display: flex;
  align-items: center;
  gap: var(--ai-space-3);

  .ai-bar { flex: 1; min-width: 60px; }

  span {
    flex-shrink: 0;
    font-size: var(--ai-fs-xs);
    color: var(--ai-text-3);
    white-space: nowrap;
  }
}
</style>
