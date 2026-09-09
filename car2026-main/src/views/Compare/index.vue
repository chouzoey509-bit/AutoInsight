<template>
  <div class="ai-page compare">
    <PageHeader
      title="市场对比"
      description="品牌与车型的市场扫描：筛选、销量×热度分布、品牌排行与最多 3 款车型的参数矩阵"
      :updated-at="updatedAt"
      source="示例数据集 · 车型库"
      :mock="true"
      :breadcrumbs="[{ title: '首页' }, { title: '市场对比' }]"
    >
      <template #actions>
        <el-button :disabled="!carStore.compareIds.length" @click="onClear">
          <el-icon><Delete /></el-icon>
          <span style="margin-left: 4px">清空对比</span>
        </el-button>
      </template>
    </PageHeader>

    <!-- 市场筛选 -->
    <section class="ai-panel compare__filter">
      <div class="compare__filter-row">
        <span class="compare__filter-label">BRAND</span>
        <el-select v-model="selectedBrands" multiple collapse-tags collapse-tags-tooltip filterable placeholder="全部品牌" clearable style="width: 280px">
          <el-option v-for="b in brandOptions" :key="b" :label="b" :value="b" />
        </el-select>
      </div>
      <div class="compare__filter-row">
        <span class="compare__filter-label">ENERGY</span>
        <div class="compare__chips">
          <button v-for="e in energyChips" :key="e.value" type="button" class="compare__chip" :class="{ 'is-active': energy === e.value }" @click="energy = e.value">
            {{ e.label }}
          </button>
        </div>
      </div>
      <div class="compare__filter-row">
        <span class="compare__filter-label">PRICE</span>
        <div class="compare__chips">
          <button type="button" class="compare__chip" :class="{ 'is-active': priceIdx === -1 }" @click="priceIdx = -1">全部</button>
          <button v-for="(b, i) in PRICE_OPTIONS" :key="b.label" type="button" class="compare__chip" :class="{ 'is-active': priceIdx === i }" @click="priceIdx = i">
            {{ b.label }}
          </button>
        </div>
      </div>
      <div class="compare__filter-foot">
        <span>命中 <b class="ai-num">{{ filteredCatalog.length }}</b> 款车型 · 覆盖 <b class="ai-num">{{ filteredBrandCount }}</b> 个品牌</span>
        <span class="compare__filter-note">SCAN / {{ energy === '' ? 'ALL ENERGY' : energy }} / {{ priceIdx === -1 ? 'ALL PRICE' : PRICE_OPTIONS[priceIdx]?.label }}</span>
      </div>
    </section>

    <!-- 销量×热度 + 品牌排行 -->
    <section class="compare__grid">
      <ChartCard
        eyebrow="SALES × ATTENTION"
        title="销量 × 热度分布"
        subtitle="横轴指导价，纵轴年销量，气泡大小为用户评分"
        :option="scatterOption"
        :loading="loading"
        :empty="!scatterGroups.length"
        :height="380"
      >
        <template #extra><span class="compare__note">BUBBLE = RATING</span></template>
      </ChartCard>

      <section class="ai-panel compare__ranking">
        <header class="compare__panel-head">
          <div><span class="compare__eyebrow">BRAND RANKING</span><h3>品牌销量排行</h3></div>
          <span class="compare__note">TOP {{ brandRanking.length }}</span>
        </header>
        <ol class="compare__rank-list">
          <li v-for="(item, index) in brandRanking" :key="item.name">
            <span class="compare__rank-no ai-num">{{ String(index + 1).padStart(2, '0') }}</span>
            <div class="compare__rank-body">
              <div class="compare__rank-line"><span class="compare__rank-name">{{ item.name }}</span><b class="ai-num">{{ formatCompact(item.value) }}</b></div>
              <div class="compare__rank-bar"><i :style="{ width: `${(item.value / rankMax) * 100}%` }" /></div>
            </div>
            <span class="compare__rank-count ai-num">{{ item.count }} 款</span>
          </li>
        </ol>
      </section>
    </section>

    <!-- 对比矩阵 -->
    <section class="compare__matrix-head">
      <div><span class="compare__eyebrow">MODEL MATRIX</span><h2>车型对比矩阵</h2><p>最多同时对比 3 款车型，参数差异自动标注最优项</p></div>
      <el-button type="primary" plain @click="$router.push('/cars')">去车型分析挑选</el-button>
    </section>

    <section class="ai-cols ai-cols--3 compare__slots">
      <CarCompareCard
        v-for="slot in 3"
        :key="slot"
        :slot-no="slot"
        :car="carAt(slot - 1)"
        :options="selectOptions"
        @select="onSelect"
        @remove="onRemove"
      />
    </section>

    <section v-if="cars.length >= 2" class="ai-panel compare__panel">
      <header class="compare__panel-head">
        <div><span class="compare__eyebrow">SPEC MATRIX</span><h3>参数对比</h3></div>
        <span class="compare__legend"><i class="compare__legend-dot" /> 该项最优</span>
      </header>

      <div class="compare__table-wrap">
        <table class="compare__table">
          <thead>
            <tr>
              <th class="compare__th compare__th--label">对比项</th>
              <th v-for="car in cars" :key="car.id" class="compare__th">
                <div class="compare__th-inner">
                  <span class="compare__th-brand">{{ car.brand.slice(0, 1) }}</span>
                  <div class="compare__th-text">
                    <span class="compare__th-name ai-truncate">{{ car.brand }} {{ car.name }}</span>
                    <span class="compare__th-meta ai-num">{{ car.modelCode }} · {{ car.category }}</span>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.label">
              <td class="compare__td compare__td--label">{{ row.label }}</td>
              <td
                v-for="(cell, idx) in row.values"
                :key="`${row.label}-${idx}`"
                class="compare__td"
                :class="{ 'is-best': row.better && bestIndexes(row).includes(idx) && cars.length > 1 }"
              >
                <span class="ai-num">{{ cell }}</span>
                <el-icon v-if="row.better && bestIndexes(row).includes(idx) && cars.length > 1" :size="12" class="compare__best">
                  <CaretTop />
                </el-icon>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <EmptyState
      v-else
      title="请至少选择 2 款车型"
      description="在上方对比位中选择车型，或在车型分析页点击「加入对比」后返回本页查看参数差异"
      :icon="Operation"
    >
      <el-button type="primary" plain @click="$router.push('/cars')">前往车型分析</el-button>
    </EmptyState>

    <template v-if="cars.length >= 2">
      <section class="ai-cols ai-cols--2">
        <ChartCard eyebrow="RADAR" title="综合能力雷达" subtitle="各维度统一归一化为 0~100 分" :height="360" mock>
          <RadarCompareChart :indicators="radarIndicators" :series="radarSeries" :height="360" />
        </ChartCard>
        <ChartCard eyebrow="SCORE" title="综合评分对比" subtitle="价格、续航、动力、空间、智能化、舒适、口碑、销量加权" :height="360" mock>
          <DistributionBarChart :data="scoreBars" :height="360" horizontal value-type="plain" />
        </ChartCard>
      </section>

      <section class="ai-panel compare__panel">
        <header class="compare__panel-head">
          <div><span class="compare__eyebrow">ANALYSIS</span><h3>综合表现分析</h3><p>由前端基于当前对比车型的参数与销量数据计算，口径透明可追溯</p></div>
          <span class="ai-tag ai-tag--mock">前端计算</span>
        </header>

        <div class="ai-panel__body compare__analysis">
          <div class="compare__ranking-col">
            <div v-for="(item, idx) in ranking" :key="item.car.id" class="compare__rank-item" :class="{ 'is-top': idx === 0 }">
              <span class="compare__rank-no">No.{{ idx + 1 }}</span>
              <div class="compare__rank-body">
                <span class="compare__rank-name ai-truncate">{{ item.car.brand }} {{ item.car.name }}</span>
                <div class="ai-bar"><div class="ai-bar__fill" :style="{ width: `${item.score}%` }" /></div>
              </div>
              <span class="compare__rank-score ai-num">{{ item.score.toFixed(1) }}</span>
            </div>
          </div>

          <ul class="compare__conclusion">
            <li v-for="(line, i) in conclusions" :key="i">
              <span class="compare__conclusion-dot" :class="`is-${line.tone}`" />
              <p>{{ line.text }}</p>
            </li>
          </ul>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CaretTop, Delete, Operation } from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'
import PageHeader from '@/components/common/PageHeader.vue'
import ChartCard from '@/components/common/ChartCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import CarCompareCard from '@/components/car/CarCompareCard.vue'
import RadarCompareChart from '@/components/charts/RadarCompareChart.vue'
import DistributionBarChart from '@/components/charts/DistributionBarChart.vue'
import { useCarStore } from '@/stores/car'
import { carApi } from '@/api/cars'
import { ENERGY_COLOR, ENERGY_LABEL, ENERGY_OPTIONS } from '@/constants'
import { formatCompact, formatNumber } from '@/utils/format'
import { buildScatterOption } from '@/charts/builders'
import type { Car, EnergyType } from '@/types'

/**
 * 市场对比（Figma V2 · 第三页）
 * 市场扫描（品牌/能源/价格筛选 → 销量×热度散点 + 品牌排行）
 * + 车型对比矩阵（最多 3 款，参数表 + 雷达 + 结论）
 */
const router = useRouter()
const carStore = useCarStore()
const updatedAt = ref('2026-09-01 09:30:00')

const PRICE_OPTIONS = [
  { label: '10万以下', min: 0, max: 10 },
  { label: '10-15万', min: 10, max: 15 },
  { label: '15-20万', min: 15, max: 20 },
  { label: '20-30万', min: 20, max: 30 },
  { label: '30-50万', min: 30, max: 50 },
  { label: '50万以上', min: 50, max: 10000 }
]

const energyChips = [{ value: '' as string, label: '全部' }, ...ENERGY_OPTIONS.map((e) => ({ value: e.value as string, label: e.label }))]

const catalog = ref<Car[]>([])
const loading = ref(false)
const selectedBrands = ref<string[]>([])
const energy = ref('')
const priceIdx = ref(-1)

/* ---------------- 市场扫描 ---------------- */

const brandOptions = computed(() => [...new Set(catalog.value.map((c) => c.brand))])

const filteredCatalog = computed(() =>
  catalog.value.filter((c) => {
    if (selectedBrands.value.length && !selectedBrands.value.includes(c.brand)) return false
    if (energy.value && c.energyType !== energy.value) return false
    if (priceIdx.value >= 0) {
      const b = PRICE_OPTIONS[priceIdx.value]
      if (c.price < b.min || c.price >= b.max) return false
    }
    return true
  })
)

const filteredBrandCount = computed(() => new Set(filteredCatalog.value.map((c) => c.brand)).size)

const scatterGroups = computed(() => {
  const groups = new Map<string, { name: string; data: [number, number, number, string][]; color: string }>()
  for (const c of filteredCatalog.value) {
    if (!groups.has(c.energyType)) {
      groups.set(c.energyType, { name: ENERGY_LABEL[c.energyType], data: [], color: ENERGY_COLOR[c.energyType] })
    }
    groups.get(c.energyType)!.data.push([Number(c.price.toFixed(1)), c.sales, c.rating, `${c.brand} ${c.name}`])
  }
  return [...groups.values()]
})

const scatterOption = computed<EChartsOption>(() =>
  buildScatterOption({ groups: scatterGroups.value, xName: '指导价（万元）', yName: '年销量（辆）' })
)

const brandRanking = computed(() => {
  const map = new Map<string, { name: string; value: number; count: number }>()
  for (const c of filteredCatalog.value) {
    const item = map.get(c.brand) ?? { name: c.brand, value: 0, count: 0 }
    item.value += c.sales
    item.count += 1
    map.set(c.brand, item)
  }
  return [...map.values()].sort((a, b) => b.value - a.value).slice(0, 8)
})

const rankMax = computed(() => Math.max(...brandRanking.value.map((b) => b.value), 1))

/* ---------------- 对比矩阵 ---------------- */

const carMap = ref<Record<number, Car>>({})
const loadingIds = ref<number[]>([])
const selectOptions = ref<Car[]>([])

const cars = computed<Car[]>(() => carStore.compareIds.map((id) => carMap.value[id]).filter((c): c is Car => Boolean(c)))

function carAt(index: number): Car | null {
  return cars.value[index] ?? null
}

async function ensureCars(ids: number[]): Promise<void> {
  const missing = ids.filter((id) => !carMap.value[id] && !loadingIds.value.includes(id))
  if (!missing.length) return
  loadingIds.value = [...loadingIds.value, ...missing]
  await Promise.all(
    missing.map(async (id) => {
      try {
        carMap.value[id] = await carApi.detail(id)
      } catch {
        ElMessage.error(`车型 ${id} 详情加载失败`)
      } finally {
        loadingIds.value = loadingIds.value.filter((i) => i !== id)
      }
    })
  )
}

watch(
  () => [...carStore.compareIds],
  (ids) => {
    void ensureCars(ids)
  },
  { immediate: true }
)

function onSelect(slotNo: number, carId: number): void {
  const idx = slotNo - 1
  if (carStore.inCompare(carId)) {
    ElMessage.warning('该车型已在对比栏中')
    return
  }
  if (idx < carStore.compareIds.length) {
    carStore.removeCompare(carStore.compareIds[idx])
  }
  const res = carStore.toggleCompare(carId)
  if (!res.ok) ElMessage.warning(res.message)
}

function onRemove(slotNo: number): void {
  const id = carStore.compareIds[slotNo - 1]
  if (id !== undefined) carStore.removeCompare(id)
}

function onClear(): void {
  carStore.clearCompare()
  ElMessage.success('已清空对比栏')
}

/* ---------------- 参数对比表 ---------------- */

interface CompareRow {
  label: string
  values: string[]
  raw: (number | null)[]
  better?: 'higher' | 'lower'
}

const rows = computed<CompareRow[]>(() => {
  const list = cars.value
  if (list.length < 2) return []

  const num = (fn: (c: Car) => number, unit = ''): { values: string[]; raw: number[] } => ({
    values: list.map((c) => `${formatNumber(fn(c))}${unit}`),
    raw: list.map(fn)
  })

  return [
    { label: '指导价（万元）', ...num((c) => c.price, ''), better: 'lower' },
    { label: '终端价格区间（万元）', values: list.map((c) => `${c.priceMin.toFixed(1)} ~ ${c.priceMax.toFixed(1)}`), raw: list.map(() => null) },
    { label: '能源类型', values: list.map((c) => ENERGY_LABEL[c.energyType]), raw: list.map(() => null) },
    { label: '车型类别', values: list.map((c) => c.category), raw: list.map(() => null) },
    { label: '纯电续航（km）', ...num((c) => c.range, ''), better: 'higher' },
    { label: '电池容量（kWh）', ...num((c) => c.battery, ''), better: 'higher' },
    { label: '最大功率（kW）', ...num((c) => c.power, ''), better: 'higher' },
    { label: '峰值扭矩（N·m）', ...num((c) => c.torque, ''), better: 'higher' },
    { label: '轴距（mm）', ...num((c) => c.wheelbase, ''), better: 'higher' },
    { label: '车身尺寸（mm）', values: list.map((c) => `${c.length}×${c.width}×${c.height}`), raw: list.map((c) => c.length * c.width * c.height), better: 'higher' },
    { label: '座位数', ...num((c) => c.seats, ''), better: 'higher' },
    { label: '上市时间', values: list.map((c) => c.launchDate), raw: list.map(() => null) },
    { label: '近 12 月销量（辆）', ...num((c) => c.sales, ''), better: 'higher' },
    { label: '上月销量（辆）', ...num((c) => c.lastMonthSales, ''), better: 'higher' },
    { label: '用户评分（5 分制）', values: list.map((c) => c.rating.toFixed(1)), raw: list.map((c) => c.rating), better: 'higher' },
    { label: '智能化评分', ...num((c) => c.intelligenceScore, ''), better: 'higher' },
    { label: '舒适性评分', ...num((c) => c.comfortScore, ''), better: 'higher' },
    { label: '空间评分', ...num((c) => c.spaceScore, ''), better: 'higher' },
    { label: '性能评分', ...num((c) => c.performanceScore, ''), better: 'higher' },
    { label: '累计评价数', ...num((c) => c.reviewCount, ''), better: 'higher' }
  ]
})

function bestIndexes(row: CompareRow): number[] {
  const nums = row.raw.filter((v): v is number => v !== null)
  if (nums.length < 2) return []
  const target = row.better === 'lower' ? Math.min(...nums) : Math.max(...nums)
  if (nums.every((v) => v === target)) return []
  return row.raw.reduce<number[]>((acc, v, i) => {
    if (v === target) acc.push(i)
    return acc
  }, [])
}

/* ---------------- 综合评分（前端计算） ---------------- */

function normalized(car: Car): Record<string, number> {
  const list = cars.value
  const maxRange = Math.max(...list.map((c) => c.range), 1)
  const maxPower = Math.max(...list.map((c) => c.power), 1)
  const maxSales = Math.max(...list.map((c) => c.sales), 1)
  const minPrice = Math.min(...list.map((c) => c.price))
  const maxPrice = Math.max(...list.map((c) => c.price))

  return {
    price: maxPrice === minPrice ? 80 : ((maxPrice - car.price) / (maxPrice - minPrice)) * 40 + 60,
    range: Math.min(100, (car.range / Math.max(maxRange, 400)) * 100),
    power: Math.min(100, (car.power / Math.max(maxPower, 300)) * 100),
    space: car.spaceScore,
    intelligence: car.intelligenceScore,
    comfort: car.comfortScore,
    rating: (car.rating / 5) * 100,
    sales: (car.sales / maxSales) * 100
  }
}

const DIMENSION_WEIGHT: Record<string, number> = {
  price: 0.15,
  range: 0.15,
  power: 0.1,
  space: 0.1,
  intelligence: 0.1,
  comfort: 0.1,
  rating: 0.15,
  sales: 0.15
}

const DIMENSION_LABEL: Record<string, string> = {
  price: '价格优势',
  range: '续航能力',
  power: '动力性能',
  space: '空间表现',
  intelligence: '智能化',
  comfort: '舒适性',
  rating: '用户口碑',
  sales: '市场表现'
}

const scored = computed(() =>
  cars.value.map((car) => {
    const dims = normalized(car)
    const score = Object.entries(DIMENSION_WEIGHT).reduce((sum, [key, w]) => sum + dims[key] * w, 0)
    return { car, dims, score }
  })
)

const ranking = computed(() => [...scored.value].sort((a, b) => b.score - a.score))

const radarIndicators = computed(() => Object.keys(DIMENSION_WEIGHT).map((key) => ({ name: DIMENSION_LABEL[key], max: 100 })))

const radarSeries = computed(() =>
  scored.value.map((s, i) => ({
    name: `${s.car.brand} ${s.car.name}`,
    value: Object.keys(DIMENSION_WEIGHT).map((key) => Number(s.dims[key].toFixed(1))),
    color: ['#111111', '#85857f', '#c2c2bc'][i % 3]
  }))
)

const scoreBars = computed(() => ranking.value.map((s) => ({ label: `${s.car.brand} ${s.car.name}`, value: Number(s.score.toFixed(1)) })))

/* ---------------- 综合表现分析 ---------------- */

interface ConclusionLine {
  text: string
  tone: 'brand' | 'nev' | 'warn'
}

const conclusions = computed<ConclusionLine[]>(() => {
  if (cars.value.length < 2) return []
  const lines: ConclusionLine[] = []
  const sorted = ranking.value

  const best = sorted[0]
  const worst = sorted[sorted.length - 1]
  lines.push({
    tone: 'nev',
    text: `综合评分：${best.car.brand} ${best.car.name} 以 ${best.score.toFixed(1)} 分领先，较 ${worst.car.brand} ${worst.car.name} 高出 ${(best.score - worst.score).toFixed(1)} 分。评分由价格优势、续航、动力、空间、智能化、舒适性、口碑、市场表现八项加权得出。`
  })

  const dimLines: string[] = []
  for (const key of Object.keys(DIMENSION_WEIGHT)) {
    const values = sorted.map((s) => ({ car: s.car, v: s.dims[key] }))
    const top = values.reduce((a, b) => (b.v > a.v ? b : a))
    const bottom = values.reduce((a, b) => (b.v < a.v ? b : a))
    if (top.v - bottom.v < 3) continue
    dimLines.push(`${DIMENSION_LABEL[key]}：${top.car.name} 领先 ${(top.v - bottom.v).toFixed(1)} 分`)
  }
  if (dimLines.length) {
    lines.push({ tone: 'brand', text: `维度差异——${dimLines.slice(0, 4).join('；')}。` })
  }

  const cheapest = [...cars.value].sort((a, b) => a.price - b.price)[0]
  const priciest = [...cars.value].sort((a, b) => b.price - a.price)[0]
  if (cheapest.id !== priciest.id) {
    lines.push({
      tone: 'warn',
      text: `购车成本：${cheapest.brand} ${cheapest.name} 指导价 ${cheapest.price.toFixed(2)} 万，比 ${priciest.name} 低 ${(priciest.price - cheapest.price).toFixed(2)} 万；${priciest.name} 在其余参数上的领先幅度需结合预算权衡。`
    })
  }

  const topSales = [...cars.value].sort((a, b) => b.sales - a.sales)[0]
  lines.push({
    tone: 'brand',
    text: `市场表现：${topSales.brand} ${topSales.name} 近 12 个月累计销售 ${formatCompact(topSales.sales)} 辆，为对比组中销量最高车型，市场保有量与后续保值率相对更有优势。`
  })

  const gap = best.score - sorted[1].score
  lines.push({
    tone: 'nev',
    text:
      gap >= 8
        ? `选购建议：${best.car.name} 综合优势明显（领先 ${gap.toFixed(1)} 分），若购车需求与评分权重一致，可优先纳入考虑。`
        : `选购建议：${best.car.name} 与 ${sorted[1].car.name} 综合分差仅 ${gap.toFixed(1)} 分，建议结合实车试驾、终端优惠与补能条件做最终决策。`
  })

  return lines
})

/* ---------------- 数据加载 ---------------- */

async function loadCatalog(): Promise<void> {
  loading.value = true
  try {
    const res = await carApi.list({ page: 1, pageSize: 100, sortBy: 'sales', sortOrder: 'desc' })
    catalog.value = res.list
  } catch {
    catalog.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  void loadCatalog()
  try {
    const res = await carApi.list({ page: 1, pageSize: 60, sortBy: 'sales', sortOrder: 'desc' })
    selectOptions.value = res.list
  } catch {
    selectOptions.value = []
  }
})
</script>

<style scoped lang="scss">
.compare__filter { padding: var(--ai-space-4) var(--ai-space-5); display: flex; flex-direction: column; gap: 12px; }

.compare__filter-row { display: flex; align-items: center; gap: 16px; min-width: 0; }

.compare__filter-label { flex: 0 0 52px; color: var(--ai-text-4); font-family: var(--ai-font-mono); font-size: 9px; letter-spacing: 0.12em; }

.compare__chips { display: flex; flex-wrap: wrap; gap: 6px; }

.compare__chip {
  padding: 5px 12px;
  border: 1px solid var(--ai-border);
  background: var(--ai-bg-panel);
  color: var(--ai-text-2);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--ai-duration-fast) var(--ai-ease);

  &:hover { border-color: var(--ai-border-strong); color: var(--ai-text-1); }

  &.is-active { background: var(--ai-brand); border-color: var(--ai-brand); color: var(--ai-text-inverse); }
}

.compare__filter-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--ai-border);
  color: var(--ai-text-3);
  font-size: 12px;

  b { color: var(--ai-text-1); font-weight: 600; }
}

.compare__filter-note { color: var(--ai-text-4); font-family: var(--ai-font-mono); font-size: 9px; letter-spacing: 0.1em; }

/* ---------- 扫描区 ---------- */
.compare__grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 16px;
  min-width: 0;
}

.compare__note { color: var(--ai-text-4); font-family: var(--ai-font-mono); font-size: 9px; letter-spacing: 0.1em; }

.compare__eyebrow { display: block; color: var(--ai-text-4); font-family: var(--ai-font-mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; }

/* ---------- 品牌排行 ---------- */
.compare__ranking { padding: var(--ai-space-5); display: flex; flex-direction: column; min-width: 0; }

.compare__panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ai-space-3);

  h3 { margin-top: 6px; font-size: 18px; font-weight: 600; letter-spacing: -0.01em; }

  p { margin-top: 4px; color: var(--ai-text-4); font-size: 11px; }
}

.compare__rank-list { display: flex; flex: 1; flex-direction: column; justify-content: space-evenly; margin-top: 14px; }

.compare__rank-list li { display: flex; align-items: center; gap: 12px; padding: 9px 0; }

.compare__rank-no { flex: 0 0 24px; color: var(--ai-text-4); font-size: 10px; }

.compare__rank-body { flex: 1; min-width: 0; }

.compare__rank-line { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }

.compare__rank-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; color: var(--ai-text-1); }

.compare__rank-line b { font-size: 12px; font-weight: 600; color: var(--ai-text-1); }

.compare__rank-bar { height: 4px; margin-top: 7px; background: var(--ai-bg-active); overflow: hidden; }

.compare__rank-bar i { display: block; height: 100%; background: var(--ai-brand); transition: width var(--ai-duration-slow) var(--ai-ease); }

.compare__rank-count { flex: 0 0 auto; color: var(--ai-text-4); font-size: 10px; }

/* ---------- 对比矩阵 ---------- */
.compare__matrix-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding-top: 8px;

  h2 { margin-top: 6px; font-size: 22px; font-weight: 600; letter-spacing: -0.01em; }

  p { margin-top: 4px; color: var(--ai-text-4); font-size: 12px; }
}

.compare__slots { align-items: stretch; }

.compare__panel { overflow: hidden; }

.compare__panel > .compare__panel-head { padding: var(--ai-space-4) var(--ai-space-5); border-bottom: 1px solid var(--ai-border); }

.compare__legend { display: inline-flex; align-items: center; gap: 6px; font-size: var(--ai-fs-xs); color: var(--ai-text-3); white-space: nowrap; }

.compare__legend-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ai-brand); }

.compare__table-wrap { overflow-x: auto; }

.compare__table { width: 100%; min-width: 640px; border-collapse: collapse; font-size: var(--ai-fs-sm); }

.compare__th,
.compare__td { padding: 11px var(--ai-space-4); border-bottom: 1px solid var(--ai-border); text-align: left; vertical-align: middle; }

.compare__th { background: var(--ai-bg-subtle); font-size: var(--ai-fs-xs); color: var(--ai-text-3); font-weight: var(--ai-fw-normal); border-bottom: 1px solid var(--ai-border-strong); }

.compare__th--label,
.compare__td--label { width: 150px; background: var(--ai-bg-subtle); color: var(--ai-text-3); font-size: var(--ai-fs-xs); border-right: 1px solid var(--ai-border); }

.compare__th-inner { display: flex; align-items: center; gap: 8px; min-width: 0; }

.compare__th-brand { display: grid; place-items: center; width: 22px; height: 22px; background: var(--ai-brand); color: var(--ai-text-inverse); font-size: var(--ai-fs-mini); font-weight: 600; flex-shrink: 0; }

.compare__th-text { display: flex; flex-direction: column; min-width: 0; line-height: 1.3; }

.compare__th-name { font-size: var(--ai-fs-sm); color: var(--ai-text-1); font-weight: var(--ai-fw-medium); }

.compare__th-meta { font-size: 10px; color: var(--ai-text-4); }

.compare__td { color: var(--ai-text-1); min-width: 130px; }

.compare__td.is-best { background: var(--ai-brand-ghost); }

.compare__best { margin-left: 5px; color: var(--ai-brand); vertical-align: -1px; }

/* ---------- 分析区 ---------- */
.compare__analysis { display: grid; grid-template-columns: minmax(0, 320px) minmax(0, 1fr); gap: var(--ai-space-6); align-items: start; }

.compare__ranking-col { display: flex; flex-direction: column; gap: var(--ai-space-3); }

.compare__rank-item { display: flex; align-items: center; gap: var(--ai-space-3); padding: 10px var(--ai-space-3); border: 1px solid var(--ai-border); background: var(--ai-bg-subtle); min-width: 0; }

.compare__rank-item.is-top { border-color: var(--ai-border-brand); background: var(--ai-brand-ghost); }

.compare__rank-item .compare__rank-no { flex-shrink: 0; font-size: var(--ai-fs-mini); color: var(--ai-text-3); letter-spacing: 0.04em; }

.compare__rank-item .compare__rank-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }

.compare__rank-item .compare__rank-name { font-size: var(--ai-fs-xs); color: var(--ai-text-1); }

.compare__rank-score { flex-shrink: 0; font-size: var(--ai-fs-h3); font-weight: var(--ai-fw-semibold); color: var(--ai-text-1); }

.compare__conclusion { display: flex; flex-direction: column; gap: var(--ai-space-3);

  li { display: flex; gap: 10px; align-items: flex-start; }

  p { flex: 1; font-size: var(--ai-fs-sm); color: var(--ai-text-2); line-height: var(--ai-lh-loose); }
}

.compare__conclusion-dot { flex-shrink: 0; width: 6px; height: 6px; margin-top: 7px; border-radius: 50%; background: var(--ai-brand);

  &.is-nev { background: var(--ai-text-2); }
  &.is-warn { background: var(--ai-text-4); }
}

@media (max-width: 1280px) {
  .compare__grid { grid-template-columns: minmax(0, 1fr); }
  .compare__analysis { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 768px) {
  .compare__slots { grid-template-columns: minmax(0, 1fr); }
  .compare__filter-row { flex-wrap: wrap; }
  .compare__matrix-head { flex-direction: column; align-items: flex-start; }
}
</style>
