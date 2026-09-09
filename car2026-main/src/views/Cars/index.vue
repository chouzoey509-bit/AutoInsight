<template>
  <div class="ai-page cars">
    <PageHeader
      title="车型分析"
      description="单车深度分析：三视图、核心参数、销量走势与同级竞品对照"
      :updated-at="updatedAt"
      source="示例数据集 · 车型库"
      :mock="true"
      :breadcrumbs="[{ title: '首页' }, { title: '车型分析' }]"
    >
      <template #actions>
        <el-select v-model="brandId" placeholder="全部品牌" clearable filterable style="width: 140px" @change="onBrandChange">
          <el-option v-for="b in brandOptions" :key="b" :label="b" :value="b" />
        </el-select>
        <el-select v-model="selectedId" filterable style="width: 220px" @change="loadCar">
          <el-option v-for="c in filteredCars" :key="c.id" :label="`${c.brand} ${c.name}`" :value="c.id">
            <span class="cars__option"><span>{{ c.brand }} {{ c.name }}</span><span class="cars__option-price ai-num">{{ c.price.toFixed(1) }}万</span></span>
          </el-option>
        </el-select>
        <el-button :type="inCompare ? 'success' : 'default'" :disabled="!car" @click="toggleCompare">
          <el-icon><Operation /></el-icon>
          <span style="margin-left: 4px">{{ inCompare ? '已加入对比' : '加入对比' }}</span>
        </el-button>
        <el-button :disabled="!car" @click="$router.push(`/cars/${selectedId}`)">评价与详情</el-button>
      </template>
    </PageHeader>

    <el-skeleton v-if="carStore.detailLoading && !car" :rows="7" animated />

    <template v-else-if="car">
      <!-- 主视觉：左侧三视图（黑） + 右侧车型参数（白） -->
      <section class="cars__hero">
        <div class="cars__stage">
          <div class="cars__stage-head">
            <span class="cars__eyebrow">MODEL BLUEPRINT</span>
            <span class="ai-num">{{ car.modelCode }}</span>
          </div>
          <h2 class="cars__stage-name">{{ car.brand }} {{ car.name }}</h2>
          <div class="cars__stage-tags">
            <span class="cars__chip">{{ car.category }}</span>
            <span class="cars__chip">{{ energyLabel(car.energyType) }}</span>
            <span v-for="t in car.tags.slice(0, 2)" :key="t" class="cars__chip cars__chip--ghost">{{ t }}</span>
          </div>
          <CarBluePrint ink="#f5f5f2" caption="THREE-VIEW BLUEPRINT / 2026" />
        </div>

        <div class="cars__params">
          <div class="cars__price-line">
            <div>
              <span class="cars__label">指导价</span>
              <div class="cars__price"><b class="ai-num">{{ car.price.toFixed(2) }}</b><span>万元</span></div>
            </div>
            <div class="cars__price-sub">
              <span class="cars__label">终端区间</span>
              <span class="ai-num">{{ car.priceMin.toFixed(2) }} ~ {{ car.priceMax.toFixed(2) }} 万</span>
            </div>
          </div>

          <div class="cars__spec-grid">
            <div v-for="s in specCards" :key="s.label" class="cars__spec">
              <span class="cars__label">{{ s.label }}</span>
              <div class="cars__spec-value"><b class="ai-num">{{ s.value }}</b><span v-if="s.unit">{{ s.unit }}</span></div>
            </div>
          </div>

          <div class="cars__scores">
            <ScoreBar v-for="s in scoreList" :key="s.label" :label="s.label" :score="s.score" />
          </div>

          <div class="cars__market-line">
            <div v-for="m in marketStats" :key="m.label" class="cars__market-item">
              <span class="cars__label">{{ m.label }}</span>
              <b class="ai-num">{{ m.value }}</b>
            </div>
          </div>
        </div>
      </section>

      <!-- 销量趋势 -->
      <section class="cars__trend">
        <ChartCard
          eyebrow="SALES TREND"
          title="销量趋势"
          subtitle="近 18 个月月度销量（辆）"
          :option="salesOption"
          :loading="carStore.detailLoading"
          :empty="!salesPoints.length"
          :height="300"
        >
          <template #extra><span class="cars__chart-note">UNIT: VEHICLES / MONTH</span></template>
        </ChartCard>
      </section>

      <!-- 同级车型推荐 -->
      <section class="cars__similar">
        <header class="cars__section-head">
          <div><span class="cars__eyebrow">SEGMENT RIVALS</span><h3>同级车型推荐</h3></div>
          <span class="cars__chart-note">基于类别与价格带匹配 · TOP 4</span>
        </header>
        <div class="ai-cols ai-cols--4">
          <CarCard v-for="item in carStore.similar" :key="item.id" :car="item" :in-compare="carStore.inCompare(item.id)" @compare="onCompare" />
        </div>
      </section>
    </template>

    <ErrorState v-else message="未找到该车型，请重新选择" @retry="loadCar(selectedId || undefined)" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Operation } from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'
import PageHeader from '@/components/common/PageHeader.vue'
import ChartCard from '@/components/common/ChartCard.vue'
import ScoreBar from '@/components/common/ScoreBar.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import CarCard from '@/components/car/CarCard.vue'
import CarBluePrint from '@/components/car/CarBluePrint.vue'
import { useCarStore } from '@/stores/car'
import { carApi } from '@/api/cars'
import { ENERGY_LABEL } from '@/constants'
import { formatCompact } from '@/utils/format'
import { buildLineOption } from '@/charts/builders'
import { PALETTE } from '@/charts/theme'
import type { Car, EnergyType } from '@/types'

/**
 * 车型分析（Figma V2 · 第二页）
 * 左：汽车三视图蓝图；右：参数卡片；下：销量趋势 + 同级推荐
 */
const route = useRoute()
const router = useRouter()
const carStore = useCarStore()

const updatedAt = ref('2026-09-01 09:30:00')
const catalog = ref<Car[]>([])
const selectedId = ref<number | null>(null)
const brandId = ref<number | ''>('')

const brandOptions = computed(() => [...new Set(catalog.value.map((c) => c.brand))])
const filteredCars = computed(() => (brandId.value === '' ? catalog.value : catalog.value.filter((c) => c.brand === brandId.value)))

const car = computed(() => carStore.current)
const inCompare = computed(() => (car.value ? carStore.inCompare(car.value.id) : false))

function energyLabel(v: string): string {
  return ENERGY_LABEL[v as EnergyType] ?? v
}

const specCards = computed(() => {
  if (!car.value) return []
  const c = car.value
  return [
    { label: '纯电续航', value: c.range ? String(c.range) : '—', unit: c.range ? 'km' : '' },
    { label: '电池容量', value: c.battery ? String(c.battery) : '—', unit: c.battery ? 'kWh' : '' },
    { label: '最大功率', value: String(c.power), unit: 'kW' },
    { label: '峰值扭矩', value: String(c.torque), unit: 'N·m' },
    { label: '轴距', value: String(c.wheelbase), unit: 'mm' },
    { label: '车身长度', value: String(c.length), unit: 'mm' },
    { label: '座位数', value: String(c.seats), unit: '座' },
    { label: '上市时间', value: c.launchDate, unit: '' }
  ]
})

const scoreList = computed(() => {
  if (!car.value) return []
  const c = car.value
  return [
    { label: '智能化', score: c.intelligenceScore },
    { label: '舒适性', score: c.comfortScore },
    { label: '空间', score: c.spaceScore },
    { label: '性能', score: c.performanceScore }
  ]
})

const marketStats = computed(() => {
  if (!car.value) return []
  const c = car.value
  return [
    { label: '近 12 月销量', value: formatCompact(c.sales) },
    { label: '上月销量', value: formatCompact(c.lastMonthSales) },
    { label: '市场排名', value: c.rank ? `NO.${c.rank}` : '--' },
    { label: '用户评分', value: c.rating.toFixed(1) }
  ]
})

const salesPoints = computed(() => carStore.currentSales?.points ?? [])
const salesOption = computed<EChartsOption>(() =>
  buildLineOption({
    x: salesPoints.value.map((p) => p.month),
    series: [{ name: '月度销量', data: salesPoints.value.map((p) => p.value), color: PALETTE[0], area: true }]
  })
)

function onBrandChange(): void {
  const first = filteredCars.value[0]
  if (first) selectedId.value = first.id
  if (selectedId.value) void loadCar(selectedId.value)
}

async function loadCatalog(): Promise<void> {
  try {
    const res = await carApi.list({ page: 1, pageSize: 60, sortBy: 'sales', sortOrder: 'desc' })
    catalog.value = res.list
    if (!selectedId.value && res.list.length) {
      const fromRoute = Number(route.query.id)
      selectedId.value = res.list.some((c) => c.id === fromRoute) ? fromRoute : res.list[0].id
      await loadCar(selectedId.value)
    }
  } catch {
    catalog.value = []
  }
}

async function loadCar(id?: number): Promise<void> {
  if (!id) return
  await carStore.fetchDetail(id)
  void router.replace({ query: { ...route.query, id: String(id) } })
}

function toggleCompare(): void {
  if (!car.value) return
  const res = carStore.toggleCompare(car.value.id)
  if (!res.ok) {
    ElMessage.warning(res.message)
    return
  }
  ElMessage.success(inCompare.value ? '已加入对比栏' : '已移出对比栏')
}

function onCompare(item: Car): void {
  const res = carStore.toggleCompare(item.id)
  if (!res.ok) {
    ElMessage.warning(res.message)
    return
  }
  ElMessage.success(carStore.inCompare(item.id) ? `已加入对比：${item.name}` : `已移出对比：${item.name}`)
}

watch(
  () => route.query.id,
  (id) => {
    const num = Number(id)
    if (num && num !== selectedId.value) {
      selectedId.value = num
      void loadCar(num)
    }
  }
)

onMounted(() => {
  void loadCatalog()
})
</script>

<style scoped lang="scss">
.cars__option { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.cars__option-price { color: var(--ai-text-4); font-size: 11px; }

/* ---------- 主视觉 ---------- */
.cars__hero {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 16px;
  min-width: 0;
}

.cars__stage {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 28px 32px 24px;
  background: #111111;
  color: #ffffff;
}

.cars__stage-head { display: flex; align-items: center; justify-content: space-between; }
.cars__eyebrow { color: #8d8d88; font-family: var(--ai-font-mono); font-size: 10px; letter-spacing: 0.14em; }
.cars__stage-head .ai-num { color: #6f6f6b; font-size: 10px; letter-spacing: 0.08em; }

.cars__stage-name { font-size: clamp(26px, 2.6vw, 36px); font-weight: 600; letter-spacing: -0.03em; line-height: 1.1; }

.cars__stage-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.cars__chip { padding: 3px 10px; border: 1px solid rgba(255, 255, 255, 0.28); color: #e8e8e4; font-size: 11px; }
.cars__chip--ghost { border-style: dashed; border-color: rgba(255, 255, 255, 0.18); color: #9a9a94; }

.cars__stage :deep(.blueprint) { margin-top: auto; }
.cars__stage :deep(.blueprint__view) { background: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px); background-size: 22px 22px; border-color: rgba(255, 255, 255, 0.14); }
.cars__stage :deep(.blueprint__caption) { color: #6f6f6b; }

/* ---------- 参数面板 ---------- */
.cars__params {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px 32px 24px;
  background: var(--ai-bg-panel);
  border: 1px solid var(--ai-border);
  min-width: 0;
}

.cars__label { display: block; color: var(--ai-text-3); font-size: 11px; letter-spacing: 0.04em; }

.cars__price-line {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--ai-border);
}

.cars__price { margin-top: 6px; display: flex; align-items: baseline; gap: 6px; }
.cars__price b { font-size: 38px; font-weight: 600; letter-spacing: -0.02em; color: var(--ai-text-1); line-height: 1; }
.cars__price span { color: var(--ai-text-3); font-size: 12px; }
.cars__price-sub { text-align: right; }
.cars__price-sub .ai-num { display: block; margin-top: 6px; color: var(--ai-text-2); font-size: 13px; }

.cars__spec-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  background: var(--ai-border);
  border: 1px solid var(--ai-border);
}

.cars__spec { padding: 12px 14px; background: var(--ai-bg-panel); min-width: 0; }
.cars__spec-value { display: flex; align-items: baseline; gap: 3px; margin-top: 6px; }
.cars__spec-value b { font-size: 17px; font-weight: 600; color: var(--ai-text-1); }
.cars__spec-value span { color: var(--ai-text-4); font-size: 10px; }

.cars__scores { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 24px; }

.cars__market-line {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--ai-border);
}

.cars__market-item b { display: block; margin-top: 6px; font-size: 16px; font-weight: 600; color: var(--ai-text-1); }

/* ---------- 趋势与推荐 ---------- */
.cars__trend { min-width: 0; }
.cars__chart-note { color: var(--ai-text-4); font-family: var(--ai-font-mono); font-size: 9px; letter-spacing: 0.1em; }

.cars__section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;
}

.cars__section-head h3 { margin-top: 6px; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; }

@media (max-width: 1280px) {
  .cars__hero { grid-template-columns: minmax(0, 1fr); }
  .cars__spec-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

@media (max-width: 1024px) {
  .cars__spec-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cars__market-line { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 768px) {
  .cars__stage { padding: 22px 20px; }
  .cars__params { padding: 22px 20px; }
  .cars__price b { font-size: 30px; }
  .cars__scores { grid-template-columns: minmax(0, 1fr); }
}
</style>
