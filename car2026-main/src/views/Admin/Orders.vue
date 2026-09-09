<template>
  <div class="ai-page admin-orders">
    <PageHeader
      title="订单管理"
      description="跟踪购车订单全流程状态，支持按订单号、客户、车型检索与状态筛选"
      source="示例数据集 · 订单中心"
      :mock="true"
      :breadcrumbs="[{ title: '企业管理后台' }, { title: '订单管理' }]"
    >
      <template #actions>
        <el-button :loading="loading" @click="loadList">
          <el-icon><Refresh /></el-icon>
          <span style="margin-left: 4px">刷新</span>
        </el-button>
      </template>
    </PageHeader>

    <!-- ---------------- 状态概览 ---------------- -->
    <section class="ai-cols ai-cols--4">
      <StatCard
        label="订单总量"
        :value="statusCount.total"
        unit="单"
        :change="6.8"
        tone="brand"
        :loading="loading"
        :icon="Tickets"
      />
      <StatCard
        label="待处理"
        :value="statusCount.pending"
        unit="单"
        :change="-3.2"
        tone="warn"
        :loading="loading"
        :icon="Clock"
      />
      <StatCard
        label="已交付"
        :value="statusCount.delivered"
        unit="单"
        :change="9.4"
        tone="nev"
        :loading="loading"
        :icon="CircleCheck"
      />
      <StatCard
        label="订单金额"
        :value="statusCount.amount"
        format="text"
        :text="formatCompact(statusCount.amount)"
        unit="万元"
        :change="5.1"
        tone="purple"
        :loading="loading"
        :icon="Wallet"
      />
    </section>

    <!-- ---------------- 筛选 ---------------- -->
    <FilterBar :loading="loading" @search="onSearch" @reset="onReset">
      <FilterField label="关键词">
        <el-input v-model="query.keyword" placeholder="订单号 / 客户 / 车型" clearable />
      </FilterField>
      <FilterField label="订单状态">
        <el-select v-model="query.status" placeholder="全部状态" clearable>
          <el-option label="待处理" value="pending" />
          <el-option label="已付款" value="paid" />
          <el-option label="已交付" value="delivered" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
      </FilterField>
    </FilterBar>

    <!-- ---------------- 列表 ---------------- -->
    <section class="ai-panel admin-orders__panel">
      <DataTable
        v-model:page="page"
        v-model:page-size="pageSize"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        show-index
        :default-sort="{ prop: 'createdAt', order: 'descending' }"
        empty-text="没有匹配的订单"
        @page-change="onPageChange"
      >
        <template #orderNo="{ row }">
          <span class="ai-num admin-orders__no">{{ row.orderNo }}</span>
        </template>

        <template #carName="{ row }">
          <div class="admin-orders__car">
            <span class="admin-orders__brand" :style="{ background: brandColor(row.brand) }">
              {{ row.brand.slice(0, 1) }}
            </span>
            <div class="admin-orders__car-info">
              <span class="admin-orders__car-name">{{ row.carName }}</span>
              <span class="admin-orders__car-meta">{{ row.brand }}</span>
            </div>
          </div>
        </template>

        <template #amount="{ row }">
          <span class="ai-num admin-orders__amount">{{ formatNumber(row.amount) }} 万</span>
        </template>

        <template #status="{ row }">
          <StatusTag :status="row.status" />
        </template>

        <template #createdAt="{ row }">
          <span class="ai-num">{{ formatDate(row.createdAt) }}</span>
        </template>

        <template #action="{ row }">
          <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
        </template>
      </DataTable>
    </section>

    <!-- ---------------- 订单详情 ---------------- -->
    <el-drawer v-model="detailVisible" title="订单详情" size="420px">
      <div v-if="current" class="admin-orders__detail">
        <div class="admin-orders__detail-head">
          <div>
            <h4 class="ai-num">{{ current.orderNo }}</h4>
            <p>下单时间 {{ formatDateTime(current.createdAt) }}</p>
          </div>
          <StatusTag :status="current.status" />
        </div>

        <div class="ai-spec">
          <div class="ai-spec__row">
            <span class="ai-spec__label">车型</span>
            <span class="ai-spec__value">{{ current.brand }} {{ current.carName }}</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">客户</span>
            <span class="ai-spec__value">{{ current.customer }}</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">订单金额</span>
            <span class="ai-spec__value ai-num">{{ formatNumber(current.amount) }} 万元</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">交付地区</span>
            <span class="ai-spec__value">{{ current.region }}</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">销售顾问</span>
            <span class="ai-spec__value">{{ current.salesperson }}</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">订单 ID</span>
            <span class="ai-spec__value ai-num">{{ current.id }}</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">车型 ID</span>
            <span class="ai-spec__value ai-num">{{ current.carId }}</span>
          </div>
        </div>

        <p class="admin-orders__detail-hint">
          订单状态流转（付款、交付、取消）由后端订单服务处理，本页仅提供查询与核对。
        </p>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck, Clock, Refresh, Tickets, Wallet } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import FilterField from '@/components/common/FilterField.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatCard from '@/components/common/StatCard.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { adminOrderApi } from '@/api/admin'
import { brandColor } from '@/utils/brand'
import { formatCompact, formatDate, formatDateTime, formatNumber } from '@/utils/format'
import type { OrderItem } from '@/types'

/**
 * 管理后台 · 订单管理
 * 数据来源：GET /api/admin/orders
 */

const list = ref<OrderItem[]>([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)

const query = reactive<{ keyword: string; status: string }>({ keyword: '', status: '' })

const columns = [
  { prop: 'orderNo', label: '订单号', width: 170, slot: 'orderNo' },
  { prop: 'carName', label: '车型', minWidth: 200, slot: 'carName' },
  { prop: 'customer', label: '客户', width: 120 },
  { prop: 'amount', label: '金额', width: 120, align: 'right' as const, slot: 'amount' },
  { prop: 'status', label: '状态', width: 100, slot: 'status' },
  { prop: 'region', label: '地区', width: 110 },
  { prop: 'salesperson', label: '销售顾问', width: 110 },
  { prop: 'createdAt', label: '下单时间', width: 120, slot: 'createdAt' },
  { prop: 'action', label: '操作', width: 90, fixed: 'right' as const, slot: 'action' }
]

const statusCount = computed(() => {
  const rows = list.value
  return {
    total: rows.length,
    pending: rows.filter((r) => r.status === 'pending').length,
    delivered: rows.filter((r) => r.status === 'delivered').length,
    amount: Number(rows.reduce((s, r) => s + r.amount, 0).toFixed(1))
  }
})

const current = ref<OrderItem | null>(null)
const detailVisible = ref(false)

function openDetail(row: OrderItem): void {
  current.value = row
  detailVisible.value = true
}

async function loadList(): Promise<void> {
  loading.value = true
  try {
    const res = await adminOrderApi.list({
      page: page.value,
      pageSize: pageSize.value,
      keyword: query.keyword || undefined,
      status: query.status || undefined
    })
    list.value = res.list
    total.value = res.total
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '订单列表加载失败')
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

onMounted(() => {
  void loadList()
})
</script>

<style scoped lang="scss">
.admin-orders__panel {
  overflow: hidden;
}

.admin-orders__no {
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-2);
}

.admin-orders__car {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.admin-orders__brand {
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

.admin-orders__car-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.35;
}

.admin-orders__car-name {
  font-size: var(--ai-fs-sm);
  color: var(--ai-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-orders__car-meta {
  font-size: 10px;
  color: var(--ai-text-4);
}

.admin-orders__amount {
  color: var(--ai-warn);
  font-weight: var(--ai-fw-medium);
}

.admin-orders__detail {
  display: flex;
  flex-direction: column;
  gap: var(--ai-space-5);
}

.admin-orders__detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ai-space-4);

  h4 {
    font-size: var(--ai-fs-h3);
    font-weight: var(--ai-fw-semibold);
    color: var(--ai-text-1);
  }

  p {
    margin-top: 5px;
    font-size: var(--ai-fs-xs);
    color: var(--ai-text-3);
  }
}

.admin-orders__detail-hint {
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-3);
  line-height: var(--ai-lh-loose);
  padding: 10px 12px;
  border-radius: var(--ai-radius-sm);
  background: var(--ai-bg-subtle);
  border-left: 2px solid var(--ai-brand);
}
</style>
