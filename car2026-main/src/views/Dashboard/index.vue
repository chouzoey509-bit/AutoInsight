<template>
  <div class="ai-page dashboard">
    <section class="dashboard__hero">
      <img class="dashboard__hero-car" :src="carSideUrl" alt="" aria-hidden="true" />
      <div class="dashboard__hero-copy">
        <span class="dashboard__eyebrow">01 / MARKET OVERVIEW</span>
        <h1>AUTOMOTIVE<br />INTELLIGENCE</h1>
        <p>从市场数据到车型表现，<br />让汽车行业的变化变得可见。</p>
      </div>
      <div class="dashboard__hero-meta">
        <strong>2026 Q3</strong>
        <span>LIVE DATA</span>
        <span>AutoInsight · Data Platform</span>
      </div>
    </section>

    <PageHeader
      title="市场概览"
      description="全国汽车销量、新能源渗透、品牌格局与价格结构"
      :updated-at="store.updatedAt"
      :source="store.overview?.source"
      :mock="true"
      :breadcrumbs="[{ title: '首页' }, { title: '市场概览' }]"
    >
      <template #actions>
        <el-radio-group v-model="span" size="small" @change="store.loadAll(span)">
          <el-radio-button :value="12">近 12 月</el-radio-button>
          <el-radio-button :value="18">近 18 月</el-radio-button>
          <el-radio-button :value="24">近 24 月</el-radio-button>
        </el-radio-group>
        <el-button :loading="store.loading" @click="store.loadAll(span)"><el-icon><Refresh /></el-icon><span>刷新数据</span></el-button>
      </template>
    </PageHeader>

    <el-alert v-if="store.error" :title="store.error" type="warning" show-icon :closable="false" class="dashboard__alert" />

    <section class="dashboard__section-head">
      <div><span class="dashboard__section-kicker">MARKET SNAPSHOT</span><h2>实时市场关键指标</h2></div>
      <span>DEMO DATA · 2026 Q3</span>
    </section>

    <section class="ai-cols ai-cols--4 dashboard__metrics">
      <template v-if="store.loading && !store.overview">
        <div v-for="i in 4" :key="i" class="ai-panel dashboard__metric-skeleton"><LoadingState variant="metric" /></div>
      </template>
      <StatCard v-for="m in displayMetrics" v-else :key="m.key" :label="m.label" :value="m.value" :unit="m.unit" :change="m.change" :trend="m.trend" :tone="m.tone" :hint="m.hint" :format="m.format" :text="m.text" />
    </section>

    <section class="dashboard__grid dashboard__grid--hero">
      <ChartCard class="dashboard__trend" eyebrow="MARKET TREND" title="新能源乘用车销量趋势" subtitle="月度销量与市场结构变化" :option="trendOption" :loading="store.loading" :empty="!store.trend" :height="330" mock>
        <template #extra><span class="dashboard__chart-note">单位：辆</span></template>
      </ChartCard>
      <section class="dashboard__top-models">
        <div class="dashboard__dark-head"><div><span class="dashboard__eyebrow">TOP MODELS</span><h3>车型关注度排行</h3></div><span>DEMO</span></div>
        <ol>
          <li v-for="(item, index) in carData.slice(0, 5)" :key="item.name">
            <span class="dashboard__rank">0{{ index + 1 }}</span><span class="dashboard__model-name">{{ item.name }}</span><strong>{{ formatRanking(item.value) }}</strong>
          </li>
        </ol>
      </section>
    </section>

    <section class="dashboard__grid dashboard__grid--secondary">
      <ChartCard eyebrow="ENERGY MIX" title="动力类型结构" subtitle="当前在售车型结构" :option="energyOption" :loading="store.loading" :empty="!energyData.length" :height="300" />
      <ChartCard eyebrow="PRICE BAND" title="价格区间分布" subtitle="不同指导价区间销量结构" :loading="store.loading" :empty="!priceData.length" :height="300"><DistributionBarChart :data="priceData" :height="300" /></ChartCard>
    </section>

    <section class="dashboard__grid dashboard__grid--secondary">
      <ChartCard eyebrow="BRAND RANKING" title="品牌销量 TOP10" subtitle="按最近 12 个月销量排序" :loading="store.loading" :empty="!brandData.length" :height="320"><BrandRankingChart :data="brandData" :height="320" /></ChartCard>
      <ChartCard eyebrow="REGION" title="地区销量分布" subtitle="省级行政区销量热力分布" :option="mapOption" :loading="store.loading" :empty="!regionData.length" :height="320" flush />
    </section>

    <section class="dashboard__footer-line">AUTOINSIGHT / DATA PLATFORM <span>Designed for Vue 3 · ECharts · Responsive Desktop</span></section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Coin, DataLine, Odometer, Refresh, Sunny, Wallet } from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'
import carSideUrl from '@/assets/intro/car-side.svg'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'
import ChartCard from '@/components/common/ChartCard.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import BrandRankingChart from '@/components/charts/BrandRankingChart.vue'
import DistributionBarChart from '@/components/charts/DistributionBarChart.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { buildGaugeOption, buildLineOption } from '@/charts/builders'
import { PALETTE } from '@/charts/theme'
import { ENERGY_COLOR } from '@/constants'
import type { MetricItem } from '@/types'
import { formatCompact } from '@/utils/format'

const store = useDashboardStore()
const span = ref(18)
const metricIcons = [Odometer, Sunny, DataLine, Wallet, Coin]
const fallbackMetrics: MetricItem[] = [
  { key: 'models', label: '在售车型', value: 0, unit: '款', change: 0, trend: [], tone: 'brand', hint: '全市场覆盖', format: 'int' },
  { key: 'penetration', label: '新能源渗透率', value: 0, unit: '%', change: 0, trend: [], tone: 'nev', hint: '最近完整月', format: 'percent' },
  { key: 'price', label: '平均指导价', value: 0, unit: '万元', change: 0, trend: [], tone: 'brand', hint: '乘用车市场', format: 'price' },
  { key: 'attention', label: '同比关注度', value: 0, unit: '%', change: 0, trend: [], tone: 'brand', hint: '示例指标', format: 'percent' }
]
const metrics = computed<MetricItem[]>(() => store.overview?.metrics ?? fallbackMetrics)
const displayMetrics = computed(() => metrics.value.slice(0, 4))
const regionData = computed(() => store.region?.regions ?? [])
const energyData = computed(() => store.energy?.proportion ?? [])
const brandData = computed(() => store.brandRanking)
const carData = computed(() => store.carRanking)
const priceData = computed(() => store.price?.buckets ?? [])
const penetrationValue = computed(() => metrics.value.find((m) => m.key === 'penetration')?.value ?? 0)
const trendOption = computed<EChartsOption>(() => store.trend ? buildLineOption({ x: store.trend.months, valueType: 'compact', series: [{ name: '新能源', data: store.trend.nev, color: PALETTE[0], area: true }, { name: '总销量', data: store.trend.total, color: PALETTE[2] }] }) : {})
const energyOption = computed<EChartsOption>(() => ({ tooltip: { trigger: 'item' }, color: [ENERGY_COLOR.BEV, ENERGY_COLOR.PHEV, ENERGY_COLOR.HEV, ENERGY_COLOR.ICE], series: [{ type: 'pie', radius: ['54%', '74%'], center: ['50%', '52%'], itemStyle: { borderColor: '#fff', borderWidth: 2 }, label: { color: '#3f3f3c', fontSize: 11, formatter: '{b}  {d}%' }, data: energyData.value.map((d) => ({ name: d.name, value: d.value })) }] }))
const mapOption = computed<EChartsOption>(() => ({ tooltip: { trigger: 'item' }, visualMap: { min: 0, max: Math.max(...regionData.value.map((r) => r.value), 1), left: 16, bottom: 18, itemWidth: 10, itemHeight: 70, textStyle: { color: '#777', fontSize: 10 }, inRange: { color: ['#e9e9e6', '#111111'] } }, series: [{ type: 'map', map: 'china', roam: true, zoom: 1.1, center: [104.5, 35.5], itemStyle: { areaColor: '#ededeb', borderColor: '#fff', borderWidth: 1 }, emphasis: { itemStyle: { areaColor: '#111' }, label: { color: '#fff', fontSize: 10 } }, data: regionData.value.map((r) => ({ name: r.name, value: r.value })) }] }))
function formatRanking(value: number): string { return formatCompact(value) }
onMounted(() => { if (!store.overview) void store.loadAll(span.value) })
</script>

<style scoped lang="scss">
.dashboard { gap: 24px; }
.dashboard__hero { position: relative; display: flex; min-height: 320px; align-items: flex-end; justify-content: space-between; padding: 38px 40px; background: #111; color: #fff; overflow: hidden; }
.dashboard__hero-car { position: absolute; right: 3%; bottom: 6%; width: min(46%, 560px); opacity: .82; filter: invert(1); pointer-events: none; }
.dashboard__hero-copy { position: relative; z-index: 1; }
.dashboard__eyebrow { display: block; color: #b2b2ad; font-family: var(--ai-font-mono); font-size: 10px; letter-spacing: .12em; }
.dashboard__hero h1 { margin-top: 18px; font-size: clamp(42px, 5vw, 68px); line-height: .94; letter-spacing: -.045em; font-weight: 600; }
.dashboard__hero p { margin-top: 20px; color: #bfbfba; font-size: 14px; line-height: 1.7; }
.dashboard__hero-meta { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; font-family: var(--ai-font-mono); }
.dashboard__hero-meta strong { font-size: 20px; font-weight: 500; }
.dashboard__hero-meta span { color: #9a9a94; font-size: 9px; letter-spacing: .12em; }
.dashboard__alert { margin: 0; }
.dashboard__section-head { display: flex; align-items: flex-end; justify-content: space-between; padding-top: 4px; }
.dashboard__section-head h2 { margin-top: 5px; font-size: 22px; font-weight: 600; }
.dashboard__section-head > span { color: var(--ai-text-4); font-family: var(--ai-font-mono); font-size: 9px; letter-spacing: .1em; }
.dashboard__section-kicker { color: var(--ai-text-4); font-family: var(--ai-font-mono); font-size: 10px; letter-spacing: .12em; }
.dashboard__metrics { gap: 16px; }
.dashboard__metric-skeleton { min-height: 148px; }
.dashboard__grid { display: grid; min-width: 0; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 16px; }
.dashboard__grid--secondary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.dashboard__top-models { min-width: 0; min-height: 370px; padding: 24px; background: #111; color: #fff; }
.dashboard__dark-head { display: flex; align-items: flex-start; justify-content: space-between; }
.dashboard__dark-head h3 { margin-top: 7px; font-size: 22px; font-weight: 600; }
.dashboard__dark-head > span { color: #777; font-family: var(--ai-font-mono); font-size: 9px; }
.dashboard__top-models ol { margin-top: 26px; }
.dashboard__top-models li { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 14px 0; border-top: 1px solid rgba(255,255,255,.1); }
.dashboard__rank { color: #777; font-family: var(--ai-font-mono); font-size: 10px; }
.dashboard__model-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
.dashboard__top-models strong { font-family: var(--ai-font-mono); font-size: 12px; font-weight: 500; }
.dashboard__chart-note { color: var(--ai-text-4); font-family: var(--ai-font-mono); font-size: 9px; }
.dashboard__footer-line { display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid var(--ai-border); color: var(--ai-text-4); font-family: var(--ai-font-mono); font-size: 9px; letter-spacing: .08em; }
@media (max-width: 1100px) { .dashboard__hero { min-height: 270px; } .dashboard__grid, .dashboard__grid--secondary { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 768px) { .dashboard__hero { min-height: 250px; padding: 28px 24px; } .dashboard__hero-meta { display: none; } .dashboard__metrics { grid-template-columns: repeat(2, minmax(0,1fr)); } .dashboard__footer-line { flex-direction: column; gap: 6px; } }
@media (max-width: 520px) { .dashboard__metrics { grid-template-columns: minmax(0,1fr); } .dashboard__hero h1 { font-size: 38px; } }
</style>
