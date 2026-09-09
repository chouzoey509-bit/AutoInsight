<template>
  <div class="ai-page car-detail">
    <el-skeleton v-if="carStore.detailLoading" :rows="8" animated />

    <template v-else-if="car">
      <!-- 车型头图 -->
      <section class="ai-panel car-detail__hero">
        <div class="car-detail__media">
          <CarThumb :brand="car.brand" :name="car.name" :color="color" :height="220" :seed="car.id" show-name />
        </div>

        <div class="car-detail__info">
          <div class="car-detail__title">
            <StatusTag :status="car.category" :text="car.category" :dot="false" />
            <h1>{{ car.brand }} {{ car.name }}</h1>
            <StatusTag v-if="car.energyType" :status="car.energyType" :text="energyLabel(car.energyType)" tone="nev" />
          </div>

          <div class="car-detail__price">
            <div>
              <span class="car-detail__price-label">指导价</span>
              <b class="ai-num">{{ car.price.toFixed(2) }}</b>
              <span class="car-detail__price-unit">万</span>
            </div>
            <div class="car-detail__price-range">
              <span>终端区间</span>
              <em class="ai-num">{{ car.priceMin.toFixed(2) }} ~ {{ car.priceMax.toFixed(2) }} 万</em>
            </div>
          </div>

          <div class="car-detail__highlights">
            <div v-for="h in highlights" :key="h.label" class="car-detail__highlight">
              <span class="car-detail__highlight-label">{{ h.label }}</span>
              <b class="ai-num">{{ h.value }}</b>
            </div>
          </div>

          <div class="car-detail__tags">
            <span v-for="tag in car.tags" :key="tag" class="ai-tag ai-tag--brand">{{ tag }}</span>
          </div>

          <div class="car-detail__actions">
            <el-button type="primary" @click="startRecommend">
              <el-icon><MagicStick /></el-icon>
              <span style="margin-left: 4px">开始智能推荐</span>
            </el-button>
            <el-button :type="inCompare ? 'success' : 'default'" @click="toggleCompare">
              <el-icon><Operation /></el-icon>
              <span style="margin-left: 4px">{{ inCompare ? '已加入对比' : '加入对比' }}</span>
            </el-button>
            <el-button :type="favorite ? 'warning' : 'default'" @click="toggleFavorite">
              <el-icon><Star /></el-icon>
              <span style="margin-left: 4px">{{ favorite ? '已收藏' : '收藏车型' }}</span>
            </el-button>
          </div>
        </div>
      </section>

      <!-- 基础信息 + 核心参数 -->
      <section class="car-detail__grid car-detail__grid--2-1">
        <div class="ai-panel">
          <header class="ai-panel__header">
            <h3 class="ai-panel__title">基础信息</h3>
          </header>
          <div class="ai-panel__body">
            <dl class="ai-spec">
              <div v-for="row in basicInfo" :key="row.label" class="ai-spec__row">
                <dt class="ai-spec__label">{{ row.label }}</dt>
                <dd class="ai-spec__value">{{ row.value }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div class="ai-panel">
          <header class="ai-panel__header">
            <h3 class="ai-panel__title">市场表现</h3>
          </header>
          <div class="ai-panel__body car-detail__market">
            <div class="car-detail__market-item">
              <span>综合排名</span>
              <b class="ai-num">NO.{{ car.rank ?? '--' }}</b>
              <em>全站 {{ totalCars }} 款车型</em>
            </div>
            <div class="car-detail__market-item">
              <span>近 12 月销量</span>
              <b class="ai-num">{{ formatCompact(car.sales) }}</b>
              <em>上月 {{ formatCompact(car.lastMonthSales) }} 辆</em>
            </div>
            <div class="car-detail__market-item">
              <span>用户评分</span>
              <b class="ai-num">{{ car.rating.toFixed(1) }}</b>
              <em>{{ formatNumber(car.reviewCount) }} 条评价</em>
            </div>
            <div class="car-detail__scores">
              <ScoreBar label="智能化" :score="car.intelligenceScore" />
              <ScoreBar label="舒适性" :score="car.comfortScore" />
              <ScoreBar label="空间" :score="car.spaceScore" />
              <ScoreBar label="性能" :score="car.performanceScore" />
            </div>
          </div>
        </div>
      </section>

      <!-- 核心参数 -->
      <section class="ai-panel">
        <header class="ai-panel__header">
          <h3 class="ai-panel__title">核心参数</h3>
          <span class="ai-hint">数据来源：车型库（示例数据）</span>
        </header>
        <div class="ai-panel__body">
          <div class="car-detail__params">
            <div v-for="p in coreParams" :key="p.label" class="car-detail__param">
              <span class="car-detail__param-label">{{ p.label }}</span>
              <b class="ai-num">{{ p.value }}</b>
              <span v-if="p.unit" class="car-detail__param-unit">{{ p.unit }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 历史销量 + 价格区间 -->
      <section class="car-detail__grid car-detail__grid--2-1">
        <ChartCard
          title="历史销量走势"
          subtitle="近 18 个月月度销量"
          :option="salesOption"
          :loading="carStore.detailLoading"
          :empty="!salesPoints.length"
          :height="300"
        />
        <ChartCard
          title="价格区间"
          subtitle="指导价与终端成交区间（万元）"
          :option="priceOption"
          :empty="!car"
          :height="300"
        />
      </section>

      <!-- 用户评价 -->
      <section class="ai-panel">
        <header class="ai-panel__header">
          <h3 class="ai-panel__title">用户评价</h3>
          <span class="ai-hint">示例数据 · 共 {{ formatNumber(car.reviewCount) }} 条</span>
        </header>
        <div class="ai-panel__body car-detail__reviews">
          <template v-if="reviews.length">
            <article v-for="r in reviews" :key="r.id" class="car-detail__review">
              <header>
                <span class="car-detail__review-user">{{ r.user }}</span>
                <el-rate :model-value="r.rating" disabled size="small" />
                <StatusTag :status="r.sentiment" :dot="true" />
                <span class="car-detail__review-time">{{ r.createdAt }}</span>
              </header>
              <p>{{ r.content }}</p>
            </article>
          </template>
          <EmptyState v-else description="该车型暂无评价数据" />
        </div>
      </section>

      <!-- 相似车型 -->
      <section>
        <header class="car-detail__section-head">
          <h3 class="ai-section-title">相似车型</h3>
          <el-button link type="primary" @click="$router.push('/cars')">查看全部车型</el-button>
        </header>
        <div class="ai-cols ai-cols--4">
          <CarCard
            v-for="item in carStore.similar"
            :key="item.id"
            :car="item"
            :in-compare="carStore.inCompare(item.id)"
            @compare="onCompare"
          />
        </div>
      </section>
    </template>

    <ErrorState v-else message="未找到该车型，请返回车型中心重新选择" @retry="$router.push('/cars')" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { MagicStick, Operation, Star } from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'
import CarThumb from '@/components/car/CarThumb.vue'
import CarCard from '@/components/car/CarCard.vue'
import ChartCard from '@/components/common/ChartCard.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import ScoreBar from '@/components/common/ScoreBar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { useCarStore } from '@/stores/car'
import { useRecommendStore } from '@/stores/recommend'
import { carApi } from '@/api/cars'
import { ENERGY_LABEL } from '@/constants'
import { brandColor } from '@/utils/brand'
import { formatCompact, formatNumber } from '@/utils/format'
import { buildLineOption, buildBarOption } from '@/charts/builders'
import { PALETTE } from '@/charts/theme'
import type { Car, ReviewItem } from '@/types'

const route = useRoute()
const router = useRouter()
const carStore = useCarStore()
const recommendStore = useRecommendStore()

const reviews = ref<ReviewItem[]>([])
const totalCars = ref(158)

const car = computed(() => carStore.current)
const color = computed(() => (car.value ? brandColor(car.value.brand) : '#2e7cf6'))
const inCompare = computed(() => (car.value ? carStore.inCompare(car.value.id) : false))
const favorite = computed(() => (car.value ? carStore.isFavorite(car.value.id) : false))

function energyLabel(v: string): string {
  return ENERGY_LABEL[v as keyof typeof ENERGY_LABEL] ?? v
}

const highlights = computed(() => {
  if (!car.value) return []
  return [
    { label: '能源类型', value: energyLabel(car.value.energyType) },
    { label: car.value.range ? '纯电续航' : '动力形式', value: car.value.range ? `${car.value.range}km` : '燃油' },
    { label: '最大功率', value: `${car.value.power}kW` },
    { label: '轴距', value: `${car.value.wheelbase}mm` }
  ]
})

const basicInfo = computed(() => {
  if (!car.value) return []
  return [
    { label: '品牌', value: car.value.brand },
    { label: '车型名称', value: car.value.name },
    { label: '车型代号', value: car.value.modelCode },
    { label: '车型类别', value: car.value.category },
    { label: '上市时间', value: car.value.launchDate },
    { label: '座位数', value: `${car.value.seats} 座` },
    { label: '车身尺寸', value: `${car.value.length}×${car.value.width}×${car.value.height} mm` },
    { label: '评价数量', value: `${formatNumber(car.value.reviewCount)} 条` }
  ]
})

const coreParams = computed(() => {
  if (!car.value) return []
  return [
    { label: '指导价', value: car.value.price.toFixed(2), unit: '万元' },
    { label: '能源类型', value: energyLabel(car.value.energyType), unit: '' },
    { label: '续航里程', value: car.value.range ? String(car.value.range) : '—', unit: car.value.range ? 'km' : '' },
    { label: '电池容量', value: car.value.battery ? String(car.value.battery) : '—', unit: car.value.battery ? 'kWh' : '' },
    { label: '最大功率', value: String(car.value.power), unit: 'kW' },
    { label: '最大扭矩', value: String(car.value.torque), unit: 'N·m' },
    { label: '轴距', value: String(car.value.wheelbase), unit: 'mm' },
    { label: '车长', value: String(car.value.length), unit: 'mm' },
    { label: '车宽', value: String(car.value.width), unit: 'mm' },
    { label: '车高', value: String(car.value.height), unit: 'mm' },
    { label: '车型类别', value: car.value.category, unit: '' },
    { label: '上市时间', value: car.value.launchDate, unit: '' }
  ]
})

const salesPoints = computed(() => carStore.currentSales?.points ?? [])

const salesOption = computed<EChartsOption>(() =>
  buildLineOption({
    x: salesPoints.value.map((p) => p.month),
    series: [
      {
        name: '月度销量',
        data: salesPoints.value.map((p) => p.value),
        color: PALETTE[0],
        area: true
      }
    ]
  })
)

const priceOption = computed<EChartsOption>(() => {
  if (!car.value) return {}
  return buildBarOption({
    x: ['终端起售价', '指导价', '终端顶配价'],
    legend: false,
    label: true,
    valueType: 'plain',
    series: [
      {
        name: '价格（万元）',
        data: [
          Number(car.value.priceMin.toFixed(2)),
          Number(car.value.price.toFixed(2)),
          Number(car.value.priceMax.toFixed(2))
        ],
        color: PALETTE[2],
        barWidth: 26
      }
    ]
  })
})

function toggleCompare(): void {
  if (!car.value) return
  const res = carStore.toggleCompare(car.value.id)
  if (!res.ok) {
    ElMessage.warning(res.message)
    return
  }
  ElMessage.success(inCompare.value ? '已加入对比栏' : '已移出对比栏')
}

function toggleFavorite(): void {
  if (!car.value) return
  const added = carStore.toggleFavorite(car.value.id)
  ElMessage.success(added ? '已加入收藏' : '已取消收藏')
}

function onCompare(item: Car): void {
  const res = carStore.toggleCompare(item.id)
  if (!res.ok) {
    ElMessage.warning(res.message)
    return
  }
  ElMessage.success(carStore.inCompare(item.id) ? `已加入对比：${item.name}` : `已移出对比：${item.name}`)
}

/** 以当前车型为线索发起智能推荐 */
function startRecommend(): void {
  if (!car.value) return
  recommendStore.reset()
  recommendStore.form.energyTypes = [car.value.energyType]
  const budget = car.value.price < 10 ? 'lt10'
    : car.value.price < 15 ? '10-15'
      : car.value.price < 20 ? '15-20'
        : car.value.price < 30 ? '20-30' : 'gt30'
  recommendStore.form.budget = budget
  void router.push('/recommend')
}

async function loadReviews(id: number): Promise<void> {
  try {
    const res = await carApi.reviews(id, { page: 1, pageSize: 5 })
    reviews.value = res.list
  } catch {
    reviews.value = []
  }
}

async function load(id: number | string): Promise<void> {
  await carStore.fetchDetail(id)
  if (carStore.current) {
    await loadReviews(carStore.current.id)
  }
}

onMounted(async () => {
  const id = route.params.id
  await load(Array.isArray(id) ? id[0] : id)
  try {
    const res = await carApi.list({ page: 1, pageSize: 1 })
    totalCars.value = res.total
  } catch {
    /* 总数获取失败时保持默认值 */
  }
})

watch(() => route.params.id, (id) => {
  if (id) void load(Array.isArray(id) ? id[0] : id)
})
</script>

<style scoped lang="scss">
.car-detail__hero {
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  overflow: hidden;
}

.car-detail__media :deep(.car-thumb) {
  border: 0;
  border-right: 1px solid var(--ai-border);
  border-radius: 0;
}

.car-detail__info {
  display: flex;
  flex-direction: column;
  gap: var(--ai-space-4);
  padding: var(--ai-space-5) var(--ai-space-6);
  min-width: 0;
}

.car-detail__title {
  display: flex;
  align-items: center;
  gap: var(--ai-space-3);
  flex-wrap: wrap;

  h1 {
    font-size: var(--ai-fs-h1);
    font-weight: var(--ai-fw-semibold);
    color: var(--ai-text-1);
  }
}

.car-detail__price {
  display: flex;
  align-items: flex-end;
  gap: var(--ai-space-6);
  padding-bottom: var(--ai-space-4);
  border-bottom: 1px solid var(--ai-border);
  flex-wrap: wrap;
}

.car-detail__price-label {
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-3);
  margin-right: 8px;
}

.car-detail__price b {
  font-size: 30px;
  font-weight: var(--ai-fw-semibold);
  color: var(--ai-warn);
}

.car-detail__price-unit {
  font-size: var(--ai-fs-sm);
  color: var(--ai-text-3);
  margin-left: 4px;
}

.car-detail__price-range {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-3);

  em { font-style: normal; color: var(--ai-text-1); }
}

.car-detail__highlights {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--ai-space-4);
}

.car-detail__highlight {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: var(--ai-radius-sm);
  background: var(--ai-bg-subtle);
  border: 1px solid var(--ai-border);

  b { font-size: 16px; color: var(--ai-text-1); font-weight: var(--ai-fw-medium); }
}

.car-detail__highlight-label {
  font-size: var(--ai-fs-mini);
  color: var(--ai-text-3);
}

.car-detail__tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.car-detail__actions {
  display: flex;
  gap: var(--ai-space-3);
  margin-top: auto;
  padding-top: var(--ai-space-3);
  flex-wrap: wrap;
}

.car-detail__grid {
  display: grid;
  gap: var(--ai-space-4);
}

.car-detail__grid--2-1 {
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
}

.car-detail__market {
  display: flex;
  flex-direction: column;
  gap: var(--ai-space-4);
}

.car-detail__market-item {
  display: flex;
  align-items: baseline;
  gap: var(--ai-space-3);

  span { font-size: var(--ai-fs-xs); color: var(--ai-text-3); width: 84px; flex-shrink: 0; }
  b { font-size: 20px; color: var(--ai-text-1); font-weight: var(--ai-fw-semibold); }
  em { font-style: normal; font-size: var(--ai-fs-mini); color: var(--ai-text-4); margin-left: auto; }
}

.car-detail__scores {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: var(--ai-space-3);
  border-top: 1px solid var(--ai-border);
}

.car-detail__params {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 1px;
  background: var(--ai-border);
  border: 1px solid var(--ai-border);
  border-radius: var(--ai-radius-md);
  overflow: hidden;
}

.car-detail__param {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--ai-space-4);
  background: var(--ai-bg-panel);
  min-width: 0;

  b { font-size: 16px; color: var(--ai-text-1); font-weight: var(--ai-fw-medium); }
}

.car-detail__param-label {
  font-size: var(--ai-fs-mini);
  color: var(--ai-text-3);
}

.car-detail__param-unit {
  font-size: var(--ai-fs-mini);
  color: var(--ai-text-4);
}

.car-detail__reviews {
  display: flex;
  flex-direction: column;
  gap: var(--ai-space-4);
}

.car-detail__review {
  padding: var(--ai-space-4);
  border: 1px solid var(--ai-border);
  border-radius: var(--ai-radius-md);
  background: var(--ai-bg-subtle);

  header {
    display: flex;
    align-items: center;
    gap: var(--ai-space-3);
    flex-wrap: wrap;
  }

  p {
    margin-top: 10px;
    font-size: var(--ai-fs-sm);
    color: var(--ai-text-2);
    line-height: var(--ai-lh-loose);
  }
}

.car-detail__review-user {
  font-size: var(--ai-fs-sm);
  color: var(--ai-text-1);
  font-weight: var(--ai-fw-medium);
}

.car-detail__review-time {
  margin-left: auto;
  font-size: var(--ai-fs-mini);
  color: var(--ai-text-4);
}

.car-detail__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--ai-space-4);
}

@media (max-width: 1440px) {
  .car-detail__params { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

@media (max-width: 1280px) {
  .car-detail__hero { grid-template-columns: minmax(0, 1fr); }
  .car-detail__media :deep(.car-thumb) {
    border-right: 0;
    border-bottom: 1px solid var(--ai-border);
  }
  .car-detail__grid--2-1 { grid-template-columns: minmax(0, 1fr); }
  .car-detail__highlights { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 768px) {
  .car-detail__params { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
