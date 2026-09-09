<template>
  <div class="ai-page market">
    <PageHeader
      title="汽车市场分析"
      description="按年份、品牌、能源类型、车型类别与地区多维下钻，分析市场销量结构与新能源渗透趋势"
      :updated-at="options?.updatedAt"
      source="示例数据集 · AutoInsight Mock"
      :mock="true"
      :breadcrumbs="[{ title: '首页' }, { title: '市场分析' }]"
    >
      <template #actions>
        <el-button :loading="loading" @click="exportCsv">
          <el-icon><Download /></el-icon>
          <span style="margin-left: 4px">导出报表</span>
        </el-button>
      </template>
    </PageHeader>

    <!-- 筛选条件 -->
    <FilterBar :loading="loading" @search="loadAll" @reset="onReset">
      <template #actions>
        <slot />
      </template>
      <FilterField label="年份">
        <el-select v-model="query.year" placeholder="全部年份" clearable>
          <el-option v-for="y in options?.years ?? []" :key="y" :label="`${y} 年`" :value="y" />
        </el-select>
      </FilterField>

      <FilterField label="月份">
        <el-select v-model="query.month" placeholder="全部月份" clearable :disabled="!query.year">
          <el-option v-for="m in 12" :key="m" :label="`${m} 月`" :value="m" />
        </el-select>
      </FilterField>

      <FilterField label="品牌">
        <el-select v-model="query.brandId" placeholder="全部品牌" clearable filterable>
          <el-option v-for="b in options?.brands ?? []" :key="b.id" :label="b.name" :value="b.id" />
        </el-select>
      </FilterField>

      <FilterField label="能源类型">
        <el-select v-model="query.energyType" placeholder="全部能源" clearable>
          <el-option v-for="e in ENERGY_OPTIONS" :key="e.value" :label="e.label" :value="e.value" />
        </el-select>
      </FilterField>

      <FilterField label="车型类别">
        <el-select v-model="query.category" placeholder="全部类别" clearable>
          <el-option v-for="c in CAR_CATEGORIES" :key="c" :label="c" :value="c" />
        </el-select>
      </FilterField>

      <FilterField label="地区">
        <el-select v-model="query.region" placeholder="全部地区" clearable filterable>
          <el-option v-for="r in options?.regions ?? []" :key="r" :label="r" :value="r" />
        </el-select>
      </FilterField>
    </FilterBar>

    <!-- 当前筛选条件 -->
    <div class="market__chips">
      <span class="market__chips-label">当前筛选：</span>
      <template v-if="activeChips.length">
        <span v-for="chip in activeChips" :key="chip.label" class="ai-tag ai-tag--brand">
          {{ chip.label }}：{{ chip.value }}
        </span>
      </template>
      <span v-else class="market__chips-empty">未设置筛选条件，展示全部市场数据</span>
      <span class="market__chips-total">
        合计销量 <b class="ai-num">{{ formatCompact(totalSales) }}</b> 辆
      </span>
    </div>

    <ErrorState v-if="error" :message="error" @retry="loadAll" />

    <template v-else>
      <!-- 市场销量趋势 + 新能源渗透率 -->
      <section class="market__grid market__grid--2-1">
        <ChartCard
          title="市场销量趋势"
          subtitle="总销量 / 新能源 / 燃油车"
          :option="trendOption"
          :loading="loading"
          :empty="!trend?.series.length"
          :height="320"
        />
        <ChartCard
          title="新能源渗透率"
          subtitle="新能源销量占总销量比例"
          :option="penetrationOption"
          :loading="loading"
          :empty="!penetration?.values.length"
          :height="320"
        />
      </section>

      <!-- 品牌市场份额 + 地区销量 -->
      <section class="market__grid market__grid--2-1">
        <ChartCard
          title="品牌市场份额"
          subtitle="TOP6 品牌份额变化（%）"
          :loading="loading"
          :empty="!share?.series.length"
          :height="340"
        >
          <MarketShareChart :data="share ?? { months: [], series: [] }" :height="340" />
        </ChartCard>

        <ChartCard
          title="各地区销量"
          subtitle="省份销量排行 TOP10"
          :loading="loading"
          :empty="!regionTop.length"
          :height="340"
        >
          <DistributionBarChart :data="regionTop" :height="340" horizontal color="#35c4d8" />
        </ChartCard>
      </section>

      <!-- 地区地图 -->
      <section class="market__grid">
        <ChartCard
          title="地区销量地图"
          subtitle="按当前筛选条件折算的省级销量分布"
          :option="regionMapOption"
          :loading="loading"
          :empty="!regionData.length"
          :height="440"
          flush
        />
      </section>

      <!-- 能源 / 价格 / 品牌排行 -->
      <section class="market__grid market__grid--3">
        <ChartCard
          title="各能源类型销量"
          subtitle="销量结构占比"
          :loading="loading"
          :empty="!energyData.length"
          :height="300"
        >
          <EnergyPieChart :data="energyData" :height="300" />
        </ChartCard>

        <ChartCard
          title="各价格区间销量"
          subtitle="指导价区间销量分布"
          :loading="loading"
          :empty="!priceData.length"
          :height="300"
        >
          <DistributionBarChart :data="priceData" :height="300" />
        </ChartCard>

        <ChartCard
          title="热门品牌排行榜"
          subtitle="按当前筛选口径排序"
          :loading="loading"
          :empty="!brandRank.length"
          :height="340"
        >
          <template #extra>
            <span class="market__hint">TOP{{ brandRank.length }}</span>
          </template>
          <ol class="market__rank">
            <li v-for="(item, index) in brandRank" :key="item.name">
              <span class="market__rank-no" :class="{ 'is-top': index < 3 }">{{ index + 1 }}</span>
              <span class="market__rank-name ai-truncate">{{ item.name }}</span>
              <span class="market__rank-bar">
                <i :style="{ width: `${sharePercent(item)}%` }" />
              </span>
              <span class="market__rank-value ai-num">{{ formatCompact(item.value) }}</span>
              <span class="market__rank-yoy" :class="item.yoy && item.yoy > 0 ? 'ai-up' : 'ai-down'">
                {{ item.yoy && item.yoy > 0 ? '↑' : '↓' }}{{ Math.abs(item.yoy ?? 0).toFixed(1) }}%
              </span>
            </li>
          </ol>
        </ChartCard>
      </section>

      <!-- 车型类别结构 -->
      <section class="market__grid market__grid--2-1">
        <ChartCard
          title="车型类别销量趋势"
          subtitle="轿车 / SUV / MPV / 跑车 / 皮卡 月度走势"
          :loading="loading"
          :empty="!categoryTrend?.series.length"
          :height="300"
        >
          <template #extra>
            <span class="market__hint">示例数据</span>
          </template>
          <SalesTrendChart
            v-if="categoryTrend"
            :months="categoryTrend.months"
            :series="categoryTrend.series.map((s, i) => ({ name: s.name, data: s.data, color: PALETTE[i % PALETTE.length] }))"
            :height="300"
          />
        </ChartCard>

        <ChartCard
          title="车型类别结构"
          subtitle="当前口径下的类别占比"
          :loading="loading"
          :empty="!categoryData.length"
          :height="300"
        >
          <EnergyPieChart :data="categoryData" :height="300" />
        </ChartCard>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Download } from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'
import PageHeader from '@/components/common/PageHeader.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import FilterField from '@/components/common/FilterField.vue'
import ChartCard from '@/components/common/ChartCard.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import SalesTrendChart from '@/components/charts/SalesTrendChart.vue'
import MarketShareChart from '@/components/charts/MarketShareChart.vue'
import EnergyPieChart from '@/components/charts/EnergyPieChart.vue'
import DistributionBarChart from '@/components/charts/DistributionBarChart.vue'
import { marketApi, type MarketOptions, type MarketQuery } from '@/api/market'
import { buildLineOption, buildMapOption } from '@/charts/builders'
import { PALETTE } from '@/charts/theme'
import { CAR_CATEGORIES, ENERGY_OPTIONS, ENERGY_LABEL } from '@/constants'
import { formatCompact } from '@/utils/format'
import type { MultiSeries, ProportionItem, RankingItem, RegionSalesItem } from '@/types'

const loading = ref(false)
const error = ref('')

const options = ref<MarketOptions | null>(null)
const trend = ref<MultiSeries | null>(null)
const share = ref<MultiSeries | null>(null)
const penetration = ref<{ months: string[]; values: number[] } | null>(null)
const regionData = ref<RegionSalesItem[]>([])
const energyData = ref<ProportionItem[]>([])
const priceData = ref<{ label: string; value: number }[]>([])
const brandRank = ref<RankingItem[]>([])
const categoryData = ref<ProportionItem[]>([])
const categoryTrend = ref<MultiSeries | null>(null)

const query = reactive<MarketQuery>({
  year: '',
  month: '',
  brandId: '',
  energyType: '',
  category: '',
  region: '',
  span: 12
})

const activeChips = computed(() => {
  const chips: { label: string; value: string }[] = []
  if (query.year) chips.push({ label: '年份', value: `${query.year} 年` })
  if (query.month) chips.push({ label: '月份', value: `${query.month} 月` })
  if (query.brandId) {
    const b = options.value?.brands.find((i) => String(i.id) === String(query.brandId))
    if (b) chips.push({ label: '品牌', value: b.name })
  }
  if (query.energyType) chips.push({ label: '能源', value: ENERGY_LABEL[query.energyType as keyof typeof ENERGY_LABEL] ?? String(query.energyType) })
  if (query.category) chips.push({ label: '类别', value: String(query.category) })
  if (query.region) chips.push({ label: '地区', value: String(query.region) })
  return chips
})

const totalSales = computed(() => trend.value?.series[0]?.data.reduce((a, b) => a + b, 0) ?? 0)

const regionTop = computed(() =>
  [...regionData.value]
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map((r) => ({ label: r.name, value: r.value }))
)

const maxBrandValue = computed(() => Math.max(...brandRank.value.map((i) => i.value), 1))

function sharePercent(item: RankingItem): number {
  return (item.value / maxBrandValue.value) * 100
}

const trendOption = computed<EChartsOption>(() => {
  if (!trend.value) return {}
  return buildLineOption({
    x: trend.value.months,
    series: trend.value.series.map((s, i) => ({
      name: s.name,
      data: s.data,
      color: PALETTE[i % PALETTE.length],
      area: i === 0
    }))
  })
})

const penetrationOption = computed<EChartsOption>(() => {
  if (!penetration.value) return {}
  return buildLineOption({
    x: penetration.value.months,
    valueType: 'percent',
    series: [{ name: '新能源渗透率', data: penetration.value.values, color: PALETTE[1], area: true }]
  })
})

const regionMapOption = computed<EChartsOption>(() =>
  buildMapOption({ data: regionData.value })
)

async function loadAll(): Promise<void> {
  loading.value = true
  error.value = ''
  if (!options.value) {
    try {
      options.value = await marketApi.options()
    } catch {
      /* 选项加载失败不阻断主流程 */
    }
  }
  const params: MarketQuery = {
    year: query.year || undefined,
    month: query.month || undefined,
    brandId: query.brandId || undefined,
    energyType: query.energyType || undefined,
    category: query.category || undefined,
    region: query.region || undefined,
    span: query.span
  }
  try {
    const results = await Promise.allSettled([
      marketApi.trend(params),
      marketApi.share(params),
      marketApi.penetration(params),
      marketApi.region(params),
      marketApi.energy(params),
      marketApi.price(params),
      marketApi.brandRank(params),
      marketApi.category(params),
      marketApi.categoryTrend(12)
    ])
    const [tr, sh, pe, rg, en, pr, br, ca, ct] = results
    if (tr.status === 'fulfilled') trend.value = tr.value
    if (sh.status === 'fulfilled') share.value = sh.value
    if (pe.status === 'fulfilled') penetration.value = pe.value
    if (rg.status === 'fulfilled') regionData.value = rg.value
    if (en.status === 'fulfilled') energyData.value = en.value
    if (pr.status === 'fulfilled') priceData.value = pr.value
    if (br.status === 'fulfilled') brandRank.value = br.value
    if (ca.status === 'fulfilled') categoryData.value = ca.value
    if (ct.status === 'fulfilled') categoryTrend.value = ct.value

    if (results.every((r) => r.status === 'rejected')) {
      error.value = '市场数据加载失败，请稍后重试'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '数据加载失败'
  } finally {
    loading.value = false
  }
}

function onReset(): void {
  query.year = ''
  query.month = ''
  query.brandId = ''
  query.energyType = ''
  query.category = ''
  query.region = ''
  void loadAll()
}

/** 导出当前筛选口径下的品牌排行 CSV（前端导出示例，实际文件导出由后端提供） */
function exportCsv(): void {
  const rows = [
    ['排名', '品牌', '销量', '份额(%)', '同比(%)'],
    ...brandRank.value.map((item, i) => [
      String(i + 1),
      item.name,
      String(item.value),
      ((item.share ?? 0) * 100).toFixed(2),
      String(item.yoy ?? 0)
    ])
  ]
  const csv = `\uFEFF${rows.map((r) => r.join(',')).join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `autoinsight-market-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  void loadAll()
})
</script>

<style scoped lang="scss">
.market__chips {
  display: flex;
  align-items: center;
  gap: var(--ai-space-2);
  flex-wrap: wrap;
  padding: var(--ai-space-3) var(--ai-space-4);
  border: 1px solid var(--ai-border);
  border-radius: var(--ai-radius-md);
  background: var(--ai-bg-subtle);
  font-size: var(--ai-fs-xs);
}

.market__chips-label { color: var(--ai-text-3); }
.market__chips-empty { color: var(--ai-text-4); }

.market__chips-total {
  margin-left: auto;
  color: var(--ai-text-3);

  b { color: var(--ai-text-1); font-weight: var(--ai-fw-semibold); }
}

.market__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--ai-space-4);
}

.market__grid--2-1 {
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
}

.market__grid--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.market__hint {
  font-size: var(--ai-fs-mini);
  color: var(--ai-text-4);
}

.market__rank {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: var(--ai-space-2) 0;

  li {
    display: grid;
    grid-template-columns: 22px 76px minmax(0, 1fr) 62px 56px;
    align-items: center;
    gap: var(--ai-space-2);
    font-size: var(--ai-fs-xs);
  }
}

.market__rank-no {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: var(--ai-radius-xs);
  background: var(--ai-bg-subtle);
  border: 1px solid var(--ai-border);
  color: var(--ai-text-3);
  font-size: 10px;

  &.is-top {
    color: #fff;
    background: linear-gradient(135deg, var(--ai-brand), var(--ai-nev));
    border-color: transparent;
  }
}

.market__rank-name { color: var(--ai-text-1); }

.market__rank-bar {
  height: 5px;
  border-radius: var(--ai-radius-pill);
  background: var(--ai-bg-active);
  overflow: hidden;

  i {
    display: block;
    height: 100%;
    border-radius: var(--ai-radius-pill);
    background: linear-gradient(90deg, var(--ai-brand), var(--ai-nev));
    transition: width var(--ai-duration-slow) var(--ai-ease);
  }
}

.market__rank-value {
  text-align: right;
  color: var(--ai-text-2);
}

.market__rank-yoy {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1280px) {
  .market__grid--2-1,
  .market__grid--3 {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
