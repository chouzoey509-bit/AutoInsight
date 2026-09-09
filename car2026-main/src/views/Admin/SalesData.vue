<template>
  <div class="ai-page admin-sales">
    <PageHeader
      title="销量数据"
      description="按车型维度查看近 12 个月销量序列与汇总指标，用于数据核对与异常排查"
      source="示例数据集 · 销量记录"
      :mock="true"
      :breadcrumbs="[{ title: '企业管理后台' }, { title: '销量数据' }]"
    >
      <template #actions>
        <el-select v-model="span" style="width: 130px" @change="loadAll">
          <el-option :value="6" label="近 6 个月" />
          <el-option :value="12" label="近 12 个月" />
          <el-option :value="24" label="近 24 个月" />
        </el-select>
        <el-button :loading="loading" @click="loadAll">
          <el-icon><Refresh /></el-icon>
          <span style="margin-left: 4px">刷新</span>
        </el-button>
      </template>
    </PageHeader>

    <ErrorState v-if="error" :message="error" description="销量数据加载失败" @retry="loadAll" />

    <template v-else>
      <!-- ---------------- 汇总趋势 ---------------- -->
      <ChartCard
        title="销量汇总趋势"
        :subtitle="`所选周期：近 ${span} 个月，合计 ${formatCompact(grandTotal)} 辆`"
        mock
        :loading="loading"
        :empty="!list.length"
        :height="300"
      >
        <SalesTrendChart :months="aggregateMonths" :series="aggregateSeries" :height="300" />
      </ChartCard>

      <!-- ---------------- 明细表 ---------------- -->
      <section class="ai-panel admin-sales__panel">
        <header class="ai-panel__header">
          <div>
            <h3 class="ai-panel__title">车型销量明细</h3>
            <p class="ai-panel__subtitle">共 {{ total }} 条记录，按合计销量降序排列</p>
          </div>
          <SearchBar v-model="keyword" placeholder="搜索车型 / 品牌" width="220px" @search="loadAll" />
        </header>

        <DataTable
          v-model:page="page"
          v-model:page-size="pageSize"
          :data="list"
          :columns="columns"
          :loading="loading"
          :total="total"
          show-index
          empty-text="没有匹配的销量记录"
          @page-change="onPageChange"
        >
          <template #carName="{ row }">
            <div class="admin-sales__car">
              <span class="admin-sales__brand" :style="{ background: brandColor(row.brand) }">
                {{ row.brand.slice(0, 1) }}
              </span>
              <div class="admin-sales__car-info">
                <span class="admin-sales__car-name">{{ row.carName }}</span>
                <span class="admin-sales__car-meta">{{ row.brand }}</span>
              </div>
            </div>
          </template>

          <template #trend="{ row }">
            <div class="admin-sales__spark">
              <BaseChart :option="sparkOption(row.values)" :height="34" />
            </div>
          </template>

          <template #total="{ row }">
            <span class="ai-num admin-sales__total">{{ formatNumber(row.total) }}</span>
          </template>

          <template #avg="{ row }">
            <span class="ai-num">{{ formatCompact(Math.round(row.total / Math.max(1, row.values.length))) }}</span>
          </template>

          <template #action="{ row }">
            <el-button link type="primary" size="small" @click="$router.push(`/cars/${row.carId}`)">
              车型详情
            </el-button>
          </template>
        </DataTable>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'
import PageHeader from '@/components/common/PageHeader.vue'
import ChartCard from '@/components/common/ChartCard.vue'
import DataTable from '@/components/common/DataTable.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import BaseChart from '@/components/charts/BaseChart.vue'
import SalesTrendChart from '@/components/charts/SalesTrendChart.vue'
import { adminSalesApi } from '@/api/admin'
import { brandColor } from '@/utils/brand'
import { formatCompact, formatNumber } from '@/utils/format'
import { PALETTE, areaGradient } from '@/charts/theme'

/**
 * 管理后台 · 销量数据
 * 数据来源：GET /api/admin/sales
 */

interface SalesRow {
  carId: number
  carName: string
  brand: string
  months: string[]
  values: number[]
  total: number
}

const list = ref<SalesRow[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const page = ref(1)
const pageSize = ref(10)
const span = ref(12)
const keyword = ref('')

const columns = [
  { prop: 'carName', label: '车型', minWidth: 200, slot: 'carName' },
  { prop: 'trend', label: '销量走势', minWidth: 160, slot: 'trend' },
  { prop: 'total', label: '合计销量', width: 130, align: 'right' as const, slot: 'total' },
  { prop: 'avg', label: '月均销量', width: 120, align: 'right' as const, slot: 'avg' },
  { prop: 'action', label: '操作', width: 110, fixed: 'right' as const, slot: 'action' }
]

const grandTotal = computed(() => list.value.reduce((s, r) => s + r.total, 0))
const aggregateMonths = computed(() => list.value[0]?.months ?? [])

/** 汇总序列：当前页所有车型的逐月合计 */
const aggregateSeries = computed(() => {
  const months = aggregateMonths.value
  const sums = months.map((_, i) => list.value.reduce((s, r) => s + (r.values[i] ?? 0), 0))
  return [{ name: '销量合计', data: sums, color: PALETTE[0], area: true }]
})

function sparkOption(values: number[]): EChartsOption {
  return {
    grid: { left: 0, right: 0, top: 4, bottom: 0 },
    xAxis: { type: 'category', show: false, boundaryGap: false, data: values.map((_, i) => i) },
    yAxis: { type: 'value', show: false, scale: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(19,26,36,0.96)',
      borderColor: 'rgba(255,255,255,0.12)',
      textStyle: { color: '#e6edf6', fontSize: 12 },
      formatter: (params: unknown) => {
        const arr = params as { value: number }[]
        return formatCompact(arr[0]?.value ?? 0)
      }
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: values,
        lineStyle: { width: 1.4, color: PALETTE[0] },
        areaStyle: { color: areaGradient(PALETTE[0], 0.22, 0) }
      }
    ]
  }
}

async function loadAll(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const res = await adminSalesApi.list({
      page: page.value,
      pageSize: pageSize.value,
      span: span.value
    })
    let rows: SalesRow[] = res.list
    if (keyword.value.trim()) {
      const kw = keyword.value.trim().toLowerCase()
      rows = rows.filter(
        (r) => r.carName.toLowerCase().includes(kw) || r.brand.toLowerCase().includes(kw)
      )
    }
    list.value = rows
    total.value = rows.length
  } catch (e) {
    error.value = e instanceof Error ? e.message : '销量数据加载失败，请稍后重试'
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function onPageChange({ page: p, pageSize: s }: { page: number; pageSize: number }): void {
  page.value = p
  pageSize.value = s
  void loadAll()
}

onMounted(() => {
  void loadAll()
})
</script>

<style scoped lang="scss">
.admin-sales__panel {
  overflow: hidden;
}

.admin-sales__car {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.admin-sales__brand {
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

.admin-sales__car-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.35;
}

.admin-sales__car-name {
  font-size: var(--ai-fs-sm);
  color: var(--ai-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-sales__car-meta {
  font-size: 10px;
  color: var(--ai-text-4);
}

.admin-sales__spark {
  min-width: 120px;
}

.admin-sales__total {
  color: var(--ai-text-1);
  font-weight: var(--ai-fw-medium);
}
</style>
