<template>
  <div class="ai-page admin-overview">
    <PageHeader
      title="系统概览"
      description="企业经营核心指标与算法服务运行情况总览"
      :updated-at="overview?.updatedAt"
      source="示例数据集 · 企业经营"
      :mock="true"
      :breadcrumbs="[{ title: '企业管理后台' }, { title: '系统概览' }]"
    >
      <template #actions>
        <el-button :loading="loading" @click="loadAll">
          <el-icon><Refresh /></el-icon>
          <span style="margin-left: 4px">刷新</span>
        </el-button>
      </template>
    </PageHeader>

    <!-- ---------------- 核心指标 ---------------- -->
    <section class="ai-cols ai-cols--4">
      <StatCard
        label="今日销售"
        :value="overview?.todaySales ?? 0"
        unit="辆"
        :change="overview?.deltas.todaySales ?? 0"
        tone="brand"
        :loading="loading"
        :icon="Odometer"
      />
      <StatCard
        label="本月销量"
        :value="overview?.monthSales ?? 0"
        unit="辆"
        :change="overview?.deltas.monthSales ?? 0"
        tone="nev"
        :loading="loading"
        :icon="Histogram"
      />
      <StatCard
        label="库存总量"
        :value="overview?.inventory ?? 0"
        unit="辆"
        :change="overview?.deltas.inventory ?? 0"
        tone="warn"
        :loading="loading"
        :icon="Box"
      />
      <StatCard
        label="新增用户"
        :value="overview?.newUsers ?? 0"
        unit="人"
        :change="overview?.deltas.newUsers ?? 0"
        tone="purple"
        :loading="loading"
        :icon="User"
      />
    </section>

    <section class="ai-cols ai-cols--3">
      <StatCard
        label="新增订单"
        :value="overview?.newOrders ?? 0"
        unit="单"
        :change="overview?.deltas.newOrders ?? 0"
        tone="brand"
        :loading="loading"
        :icon="Tickets"
      />
      <StatCard
        label="推荐服务调用"
        :value="overview?.recommendCount ?? 0"
        unit="次"
        :change="overview?.deltas.recommendCount ?? 0"
        tone="nev"
        :loading="loading"
        :icon="MagicStick"
      />
      <StatCard
        label="预测任务"
        :value="overview?.predictTasks ?? 0"
        unit="个"
        :change="overview?.deltas.predictTasks ?? 0"
        tone="cyan"
        :loading="loading"
        :icon="TrendCharts"
      />
    </section>

    <ErrorState
      v-if="globalError"
      :message="globalError"
      description="经营数据加载失败，请重新加载"
      @retry="loadAll"
    />

    <template v-else>
      <!-- ---------------- 趋势 ---------------- -->
      <ChartCard
        title="销量与订单趋势"
        subtitle="近 12 个月销量与订单量对比"
        mock
        :loading="loading"
        :empty="!trend?.months.length"
        :height="320"
      >
        <SalesTrendChart :months="trend?.months ?? []" :series="trendSeries" :height="320" />
      </ChartCard>

      <section class="ai-cols ai-cols--3">
        <ChartCard
          title="订单状态分布"
          subtitle="全部订单当前状态占比"
          mock
          :loading="loading"
          :empty="!orderStatus.length"
          :height="280"
        >
          <EnergyPieChart :data="orderStatus" :height="280" />
        </ChartCard>

        <ChartCard
          title="热销车型 TOP8"
          subtitle="按近 12 个月累计销量排序"
          mock
          :loading="loading"
          :empty="!carRanking.length"
          :height="280"
        >
          <DistributionBarChart :data="carRankingBars" :height="280" horizontal />
        </ChartCard>

        <ChartCard
          title="库存水位趋势"
          subtitle="近 12 个月库存总量变化"
          mock
          :loading="loading"
          :empty="!inventoryTrend?.months.length"
          :height="280"
        >
          <SalesTrendChart
            :months="inventoryTrend?.months ?? []"
            :series="[{ name: '库存量', data: inventoryTrend?.data ?? [] }]"
            :height="280"
          />
        </ChartCard>
      </section>

      <!-- ---------------- 快捷入口 ---------------- -->
      <section class="ai-panel admin-overview__shortcuts">
        <header class="ai-panel__header">
          <div>
            <h3 class="ai-panel__title">快捷入口</h3>
            <p class="ai-panel__subtitle">常用管理模块直达</p>
          </div>
        </header>
        <div class="ai-panel__body admin-overview__shortcut-grid">
          <router-link v-for="item in shortcuts" :key="item.path" :to="item.path" class="admin-overview__shortcut">
            <span class="admin-overview__shortcut-icon" :style="{ color: item.color, background: `${item.color}1f` }">
              <el-icon :size="15"><component :is="item.icon" /></el-icon>
            </span>
            <div class="admin-overview__shortcut-text">
              <b>{{ item.title }}</b>
              <span>{{ item.desc }}</span>
            </div>
            <el-icon :size="13" class="admin-overview__shortcut-arrow"><ArrowRight /></el-icon>
          </router-link>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ArrowRight,
  Box,
  Cpu,
  Document,
  FolderOpened,
  Histogram,
  MagicStick,
  Odometer,
  Refresh,
  Tickets,
  TrendCharts,
  User
} from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import ChartCard from '@/components/common/ChartCard.vue'
import StatCard from '@/components/common/StatCard.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import SalesTrendChart from '@/components/charts/SalesTrendChart.vue'
import EnergyPieChart from '@/components/charts/EnergyPieChart.vue'
import DistributionBarChart from '@/components/charts/DistributionBarChart.vue'
import { adminApi } from '@/api/admin'
import { PALETTE } from '@/charts/theme'

/**
 * 管理后台 · 系统概览
 * 数据来源：/api/admin/overview · sales-trend · order-status · car-ranking · inventory-trend
 */

const loading = ref(false)
const globalError = ref('')

const overview = ref<Awaited<ReturnType<typeof adminApi.overview>> | null>(null)
const trend = ref<Awaited<ReturnType<typeof adminApi.salesTrend>> | null>(null)
const orderStatus = ref<Awaited<ReturnType<typeof adminApi.orderStatus>>>([])
const carRanking = ref<Awaited<ReturnType<typeof adminApi.carRanking>>>([])
const inventoryTrend = ref<Awaited<ReturnType<typeof adminApi.inventoryTrend>> | null>(null)

const trendSeries = computed(() => [
  { name: '销量', data: trend.value?.sales ?? [], color: PALETTE[0], area: true },
  { name: '订单量', data: trend.value?.orders ?? [], color: PALETTE[2], area: false }
])

const carRankingBars = computed(() =>
  carRanking.value.map((c) => ({ label: c.name, value: c.value }))
)

const shortcuts = [
  { path: '/admin/users', title: '用户管理', desc: '账号、角色与状态维护', icon: User, color: PALETTE[3] },
  { path: '/admin/cars', title: '车型管理', desc: '车型基础信息与参数录入', icon: Histogram, color: PALETTE[0] },
  { path: '/admin/orders', title: '订单管理', desc: '订单流转与状态跟踪', icon: Tickets, color: PALETTE[1] },
  { path: '/admin/inventory', title: '库存管理', desc: '库存水位与周转天数', icon: Box, color: PALETTE[2] },
  { path: '/admin/algorithms', title: '算法管理', desc: '模型任务与调用监控', icon: Cpu, color: PALETTE[4] },
  { path: '/admin/data', title: '数据管理', desc: '数据文件导入与校验', icon: FolderOpened, color: PALETTE[5] },
  { path: '/admin/logs', title: '操作日志', desc: '操作审计与异常排查', icon: Document, color: PALETTE[6] }
]

async function loadAll(): Promise<void> {
  loading.value = true
  globalError.value = ''
  try {
    const [o, t, s, r, i] = await Promise.all([
      adminApi.overview(),
      adminApi.salesTrend(),
      adminApi.orderStatus(),
      adminApi.carRanking(8),
      adminApi.inventoryTrend()
    ])
    overview.value = o
    trend.value = t
    orderStatus.value = s
    carRanking.value = r
    inventoryTrend.value = i
  } catch (e) {
    globalError.value = e instanceof Error ? e.message : '经营数据加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadAll()
})
</script>

<style scoped lang="scss">
.admin-overview__shortcuts {
  overflow: hidden;
}

.admin-overview__shortcut-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--ai-space-3);
}

.admin-overview__shortcut {
  display: flex;
  align-items: center;
  gap: var(--ai-space-3);
  padding: 12px var(--ai-space-4);
  border: 1px solid var(--ai-border);
  border-radius: var(--ai-radius-sm);
  background: var(--ai-bg-subtle);
  transition: all var(--ai-duration-base) var(--ai-ease);

  &:hover {
    border-color: var(--ai-border-brand);
    background: var(--ai-brand-ghost);

    .admin-overview__shortcut-arrow { color: var(--ai-brand); transform: translateX(2px); }
  }
}

.admin-overview__shortcut-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: var(--ai-radius-sm);
  flex-shrink: 0;
}

.admin-overview__shortcut-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;

  b {
    font-size: var(--ai-fs-sm);
    color: var(--ai-text-1);
    font-weight: var(--ai-fw-medium);
  }

  span {
    font-size: var(--ai-fs-mini);
    color: var(--ai-text-4);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.admin-overview__shortcut-arrow {
  flex-shrink: 0;
  color: var(--ai-text-4);
  transition: all var(--ai-duration-base) var(--ai-ease);
}
</style>
