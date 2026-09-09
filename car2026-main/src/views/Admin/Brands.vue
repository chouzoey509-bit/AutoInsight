<template>
  <div class="ai-page admin-brands">
    <PageHeader
      title="品牌管理"
      description="维护汽车品牌主数据：阵营归属、成立年份、在售车型与年度销量表现"
      source="示例数据集 · 品牌主数据"
      :mock="true"
      :breadcrumbs="[{ title: '企业管理后台' }, { title: '品牌管理' }]"
    >
      <template #actions>
        <el-button @click="loadList">
          <el-icon><Refresh /></el-icon>
          <span style="margin-left: 4px">刷新</span>
        </el-button>
      </template>
    </PageHeader>

    <!-- ---------------- 筛选 ---------------- -->
    <FilterBar :loading="loading" @search="onSearch" @reset="onReset">
      <FilterField label="关键词">
        <el-input v-model="query.keyword" placeholder="品牌中文名 / 英文名" clearable />
      </FilterField>
      <FilterField label="阵营">
        <el-select v-model="query.group" placeholder="全部阵营" clearable>
          <el-option v-for="g in groupOptions" :key="g" :label="g" :value="g" />
        </el-select>
      </FilterField>
      <FilterField label="排序">
        <el-select v-model="sortKey" placeholder="默认排序">
          <el-option label="年销量最高" value="annualSales" />
          <el-option label="在售车型最多" value="modelCount" />
          <el-option label="成立年份最早" value="foundedYear" />
        </el-select>
      </FilterField>
    </FilterBar>

    <!-- ---------------- 列表 ---------------- -->
    <section class="ai-panel admin-brands__panel">
      <DataTable
        v-model:page="page"
        v-model:page-size="pageSize"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        show-index
        empty-text="没有匹配的品牌"
        @page-change="onPageChange"
        @sort-change="onSortChange"
      >
        <template #name="{ row }">
          <div class="admin-brands__brand">
            <span class="admin-brands__logo" :style="{ background: row.color }">{{ row.name.slice(0, 1) }}</span>
            <div class="admin-brands__brand-info">
              <span class="admin-brands__brand-name">{{ row.name }}</span>
              <span class="admin-brands__brand-en">{{ row.nameEn }}</span>
            </div>
          </div>
        </template>

        <template #group="{ row }">
          <span class="ai-tag ai-tag--brand">{{ row.group }}</span>
        </template>

        <template #energyFocus="{ row }">
          <div class="admin-brands__energies">
            <span
              v-for="e in row.energyFocus"
              :key="e"
              class="admin-brands__energy"
              :style="{ color: ENERGY_COLOR[e], borderColor: `${ENERGY_COLOR[e]}55` }"
            >
              {{ ENERGY_SHORT[e] }}
            </span>
          </div>
        </template>

        <template #annualSales="{ row }">
          <span class="ai-num admin-brands__sales">{{ formatCompact(row.annualSales ?? 0) }}</span>
        </template>

        <template #share="{ row }">
          <div class="admin-brands__share">
            <div class="ai-bar">
              <div class="ai-bar__fill" :style="{ width: `${shareOf(row)}%`, background: row.color }" />
            </div>
            <span class="ai-num">{{ shareOf(row).toFixed(2) }}%</span>
          </div>
        </template>

        <template #action="{ row }">
          <el-button link type="primary" size="small" @click="openDetail(row)">查看详情</el-button>
        </template>
      </DataTable>
    </section>

    <!-- ---------------- 详情抽屉 ---------------- -->
    <el-drawer v-model="detailVisible" title="品牌详情" size="440px">
      <div v-if="current" class="admin-brands__detail">
        <div class="admin-brands__detail-head">
          <span class="admin-brands__detail-logo" :style="{ background: current.color }">
            {{ current.name.slice(0, 1) }}
          </span>
          <div>
            <h4>{{ current.name }}</h4>
            <p>{{ current.nameEn }}</p>
          </div>
        </div>

        <div class="ai-spec">
          <div class="ai-spec__row">
            <span class="ai-spec__label">品牌 ID</span>
            <span class="ai-spec__value ai-num">{{ current.id }}</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">阵营</span>
            <span class="ai-spec__value">{{ current.group }}</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">国别</span>
            <span class="ai-spec__value">{{ current.country }}</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">成立年份</span>
            <span class="ai-spec__value ai-num">{{ current.foundedYear }}</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">在售车型</span>
            <span class="ai-spec__value ai-num">{{ current.modelCount ?? 0 }} 款</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">年度销量</span>
            <span class="ai-spec__value ai-num">{{ formatNumber(current.annualSales ?? 0) }} 辆</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">市场份额</span>
            <span class="ai-spec__value ai-num">{{ shareOf(current).toFixed(2) }}%</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">主打能源</span>
            <span class="ai-spec__value">
              <span
                v-for="e in current.energyFocus"
                :key="e"
                class="admin-brands__energy"
                :style="{ color: ENERGY_COLOR[e], borderColor: `${ENERGY_COLOR[e]}55` }"
              >
                {{ ENERGY_LABEL[e] }}
              </span>
            </span>
          </div>
        </div>

        <p class="admin-brands__detail-hint">
          品牌主数据的新增与编辑由后端数据治理流程统一维护，当前版本仅提供查询与核对能力。
        </p>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import FilterField from '@/components/common/FilterField.vue'
import DataTable from '@/components/common/DataTable.vue'
import { adminBrandApi } from '@/api/admin'
import { ENERGY_COLOR, ENERGY_LABEL, ENERGY_SHORT } from '@/constants'
import { formatCompact, formatNumber } from '@/utils/format'
import type { Brand, EnergyType } from '@/types'

/**
 * 管理后台 · 品牌管理
 * 数据来源：GET /api/admin/brands（只读，写入由后端数据治理流程负责）
 */

const list = ref<Brand[]>([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)

const query = reactive<{ keyword: string; group: string }>({ keyword: '', group: '' })
const sortKey = ref('annualSales')
const sortBy = ref('annualSales')
const sortOrder = ref<'asc' | 'desc'>('desc')

const columns = [
  { prop: 'name', label: '品牌', minWidth: 200, slot: 'name' },
  { prop: 'group', label: '阵营', width: 110, slot: 'group' },
  { prop: 'country', label: '国别', width: 110 },
  { prop: 'foundedYear', label: '成立年份', width: 110, sortable: true },
  { prop: 'energyFocus', label: '主打能源', width: 150, slot: 'energyFocus' },
  { prop: 'modelCount', label: '在售车型', width: 110, sortable: true },
  { prop: 'annualSales', label: '年度销量', width: 120, sortable: true, slot: 'annualSales' },
  { prop: 'share', label: '市场份额', minWidth: 160, slot: 'share' },
  { prop: 'action', label: '操作', width: 110, fixed: 'right' as const, slot: 'action' }
]

const groupOptions = ['自主', '新势力', '德系', '日系', '美系', '韩系', '欧系']

/** 全量品牌年销量总和（用于计算份额） */
const totalAnnual = ref(0)

const shareOf = (row: Brand): number =>
  totalAnnual.value ? Number((((row.annualSales ?? 0) / totalAnnual.value) * 100).toFixed(2)) : 0

const current = ref<Brand | null>(null)
const detailVisible = ref(false)

function openDetail(row: Brand): void {
  current.value = row
  detailVisible.value = true
}

async function loadList(): Promise<void> {
  loading.value = true
  try {
    const res = await adminBrandApi.list({
      page: page.value,
      pageSize: pageSize.value,
      keyword: query.keyword || undefined,
      group: query.group || undefined,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    })
    list.value = res.list
    total.value = res.total
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '品牌列表加载失败')
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/** 份额分母取全量品牌年销量（一次性拉取大页） */
async function loadTotal(): Promise<void> {
  try {
    const res = await adminBrandApi.list({ page: 1, pageSize: 200 })
    totalAnnual.value = res.list.reduce((s, b) => s + (b.annualSales ?? 0), 0)
  } catch {
    totalAnnual.value = 0
  }
}

function onSearch(): void {
  page.value = 1
  void loadList()
}

function onReset(): void {
  query.keyword = ''
  query.group = ''
  sortKey.value = 'annualSales'
  sortBy.value = 'annualSales'
  sortOrder.value = 'desc'
  page.value = 1
  void loadList()
}

function onPageChange({ page: p, pageSize: s }: { page: number; pageSize: number }): void {
  page.value = p
  pageSize.value = s
  void loadList()
}

function onSortChange({ prop, order }: { prop: string; order: string }): void {
  sortBy.value = prop || 'annualSales'
  sortOrder.value = (order || 'desc') as 'asc' | 'desc'
  void loadList()
}

onMounted(async () => {
  await loadTotal()
  await loadList()
})
</script>

<style scoped lang="scss">
.admin-brands__panel {
  overflow: hidden;
}

.admin-brands__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.admin-brands__logo {
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

.admin-brands__brand-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.35;
}

.admin-brands__brand-name {
  font-size: var(--ai-fs-sm);
  color: var(--ai-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-brands__brand-en {
  font-size: 10px;
  color: var(--ai-text-4);
}

.admin-brands__energies {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.admin-brands__energy {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 6px;
  border: 1px solid var(--ai-border);
  border-radius: var(--ai-radius-xs);
  background: var(--ai-bg-subtle);
  font-size: 10px;
}

.admin-brands__sales {
  color: var(--ai-text-1);
  font-weight: var(--ai-fw-medium);
}

.admin-brands__share {
  display: flex;
  align-items: center;
  gap: var(--ai-space-3);

  .ai-bar { flex: 1; min-width: 60px; }

  span {
    flex-shrink: 0;
    width: 48px;
    text-align: right;
    font-size: var(--ai-fs-xs);
    color: var(--ai-text-3);
  }
}

.admin-brands__detail {
  display: flex;
  flex-direction: column;
  gap: var(--ai-space-5);
}

.admin-brands__detail-head {
  display: flex;
  align-items: center;
  gap: var(--ai-space-4);

  h4 {
    font-size: var(--ai-fs-h3);
    font-weight: var(--ai-fw-semibold);
    color: var(--ai-text-1);
  }

  p {
    margin-top: 4px;
    font-size: var(--ai-fs-xs);
    color: var(--ai-text-3);
    letter-spacing: 0.04em;
  }
}

.admin-brands__detail-logo {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: var(--ai-radius-md);
  color: #fff;
  font-size: 18px;
  font-weight: var(--ai-fw-semibold);
  flex-shrink: 0;
}

.admin-brands__detail-hint {
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-3);
  line-height: var(--ai-lh-loose);
  padding: 10px 12px;
  border-radius: var(--ai-radius-sm);
  background: var(--ai-bg-subtle);
  border-left: 2px solid var(--ai-brand);
}
</style>
