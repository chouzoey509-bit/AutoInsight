<template>
  <div class="ai-page predict">
    <PageHeader
      title="汽车销量预测"
      description="基于历史销量序列与季节因子，由后端预测模型输出未来 3 / 6 / 12 个月的销量走势与置信区间"
      :updated-at="result?.updatedAt"
      source="预测服务 · AutoInsight Forecast"
      :mock="true"
      :breadcrumbs="[{ title: '首页' }, { title: '销量预测' }]"
    >
      <template #actions>
        <el-button :disabled="loading || !predictStore.carId" @click="onReset">
          <el-icon><RefreshLeft /></el-icon>
          <span style="margin-left: 4px">清空结果</span>
        </el-button>
      </template>
    </PageHeader>

    <!-- ---------------- 预测条件 ---------------- -->
    <section class="ai-panel predict__filter">
      <div class="predict__filter-body">
        <div class="predict__field">
          <label class="predict__label">品牌</label>
          <el-select
            v-model="brandId"
            placeholder="全部品牌"
            clearable
            filterable
            style="width: 170px"
            @change="onBrandChange"
          >
            <el-option v-for="b in brandOptions" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </div>

        <div class="predict__field">
          <label class="predict__label">
            车型
            <em>*</em>
          </label>
          <el-select
            v-model="carId"
            placeholder="请选择车型"
            filterable
            style="width: 260px"
            :disabled="!carOptions.length"
          >
            <el-option
              v-for="c in carOptions"
              :key="c.id"
              :label="`${c.brand} ${c.name}`"
              :value="c.id"
            />
          </el-select>
        </div>

        <div class="predict__field">
          <label class="predict__label">预测周期</label>
          <el-radio-group v-model="horizon">
            <el-radio-button v-for="h in PREDICT_HORIZONS" :key="h.value" :value="h.value">
              {{ h.label }}
            </el-radio-button>
          </el-radio-group>
        </div>

        <el-button type="primary" :loading="loading" :disabled="!carId" @click="onRun">
          <el-icon><TrendCharts /></el-icon>
          <span style="margin-left: 4px">开始预测</span>
        </el-button>
      </div>
    </section>

    <!-- ---------------- 结果区 ---------------- -->
    <!-- loading -->
    <section v-if="loading" class="ai-panel predict__panel">
      <header class="ai-panel__header">
        <h3 class="ai-panel__title">预测计算中</h3>
      </header>
      <div class="ai-panel__body">
        <LoadingState variant="chart" :height="320" />
      </div>
    </section>

    <!-- error -->
    <section v-else-if="error" class="ai-panel predict__panel">
      <header class="ai-panel__header">
        <h3 class="ai-panel__title">预测结果</h3>
      </header>
      <div class="ai-panel__body">
        <ErrorState :message="error" description="预测服务未返回结果，请调整条件后重试" @retry="onRun" />
      </div>
    </section>

    <!-- empty -->
    <section v-else-if="!result" class="ai-panel predict__panel">
      <header class="ai-panel__header">
        <h3 class="ai-panel__title">预测结果</h3>
      </header>
      <div class="ai-panel__body">
        <EmptyState
          title="尚未生成预测结果"
          description="选择品牌与车型、指定预测周期后点击「开始预测」，系统将调用 GET /api/predict/sales 返回预测序列"
          :icon="TrendCharts"
        />
      </div>
    </section>

    <!-- success -->
    <template v-else>
      <!-- 模型信息 -->
      <section class="ai-panel predict__meta">
        <div class="predict__meta-list">
          <span class="predict__meta-item">
            <em>预测模型</em>
            <b>{{ result.model }}</b>
          </span>
          <span class="predict__meta-item">
            <em>模型准确率</em>
            <b class="ai-num">{{ (result.accuracy * 100).toFixed(1) }}%</b>
          </span>
          <span class="predict__meta-item">
            <em>预测周期</em>
            <b class="ai-num">{{ result.horizon }} 个月</b>
          </span>
          <span class="predict__meta-item">
            <em>更新时间</em>
            <b class="ai-num">{{ result.updatedAt }}</b>
          </span>
        </div>
        <span class="ai-tag ai-tag--mock">示例数据 · 前端不参与模型计算</span>
      </section>

      <!-- 摘要卡 -->
      <section class="ai-cols ai-cols--4">
        <PredictionCard
          label="预测总销量"
          :value="totalPredicted"
          unit="辆"
          :hint="`未来 ${result.horizon} 个月累计`"
          tone="brand"
          :icon="DataLine"
        />
        <PredictionCard
          label="预测增长率"
          :value="growthText"
          :hint="`相对近 ${result.history.length} 个月均值`"
          :tone="(result.growthRate ?? 0) >= 0 ? 'nev' : 'danger'"
          :icon="TrendCharts"
        />
        <PredictionCard
          label="峰值月份"
          :value="result.peakMonth ?? '--'"
          :hint="`预测最高 ${formatCompact(peakValue)} 辆`"
          tone="warn"
          :icon="Top"
        />
        <PredictionCard
          label="谷值月份"
          :value="result.lowMonth ?? '--'"
          :hint="`预测最低 ${formatCompact(lowValue)} 辆`"
          tone="purple"
          :icon="Bottom"
        />
      </section>

      <!-- 预测趋势图 -->
      <ChartCard
        title="历史销量与预测走势"
        subtitle="实线为历史实际销量，虚线为模型预测值，阴影为 80% 置信区间"
        mock
        :height="400"
      >
        <SalesPredictionChart :history="result.history" :prediction="result.prediction" :height="400" />
      </ChartCard>

      <section class="ai-cols ai-cols--2-1">
        <!-- 预测明细 -->
        <section class="ai-panel predict__panel">
          <header class="ai-panel__header">
            <div>
              <h3 class="ai-panel__title">预测明细</h3>
              <p class="ai-panel__subtitle">逐月预测值及其置信区间</p>
            </div>
            <el-button size="small" @click="exportCsv">
              <el-icon><Download /></el-icon>
              <span style="margin-left: 4px">导出 CSV</span>
            </el-button>
          </header>
          <DataTable
            :data="tableRows"
            :columns="columns"
            :show-pagination="false"
            :show-index="true"
            max-height="360"
          >
            <template #value="{ row }">
              <span class="ai-num predict__value">{{ formatNumber(row.value) }}</span>
            </template>
            <template #interval="{ row }">
              <span class="ai-num predict__interval">
                {{ formatCompact(row.lower) }} ~ {{ formatCompact(row.upper) }}
              </span>
            </template>
            <template #mom="{ row }">
              <span class="ai-num" :class="row.mom >= 0 ? 'ai-up' : 'ai-down'">
                {{ row.mom >= 0 ? '+' : '' }}{{ row.mom.toFixed(1) }}%
              </span>
            </template>
          </DataTable>
        </section>

        <!-- 特征重要性 -->
        <section class="ai-panel predict__panel">
          <header class="ai-panel__header">
            <div>
              <h3 class="ai-panel__title">模型特征重要性</h3>
              <p class="ai-panel__subtitle">反映各因素对预测结果的贡献度</p>
            </div>
          </header>
          <div class="ai-panel__body predict__features">
            <template v-if="result.features?.length">
              <ScoreBar
                v-for="(f, i) in result.features"
                :key="f.name"
                :label="f.name"
                :score="f.importance * 100"
                :color="featureColor(i)"
              />
            </template>
            <EmptyState v-else title="模型未返回特征重要性" compact />
            <p class="predict__features-hint">
              特征重要性用于解释模型输出依据，数值由预测服务随结果一并返回。
            </p>
          </div>
        </section>
      </section>

      <!-- 结论说明 -->
      <section class="ai-panel predict__panel">
        <header class="ai-panel__header">
          <div>
            <h3 class="ai-panel__title">预测结论</h3>
            <p class="ai-panel__subtitle">由前端依据接口返回的预测序列计算生成，不含主观推断</p>
          </div>
        </header>
        <div class="ai-panel__body">
          <ul class="predict__conclusion">
            <li v-for="(line, i) in conclusions" :key="i">
              <span class="predict__conclusion-dot" />
              <p>{{ line }}</p>
            </li>
          </ul>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bottom, DataLine, Download, RefreshLeft, Top, TrendCharts } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import ChartCard from '@/components/common/ChartCard.vue'
import DataTable from '@/components/common/DataTable.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PredictionCard from '@/components/common/PredictionCard.vue'
import ScoreBar from '@/components/common/ScoreBar.vue'
import SalesPredictionChart from '@/components/charts/SalesPredictionChart.vue'
import { usePredictStore } from '@/stores/predict'
import { carApi } from '@/api/cars'
import { PREDICT_HORIZONS } from '@/constants'
import { formatCompact, formatNumber } from '@/utils/format'
import { PALETTE } from '@/charts/theme'
import type { Car, PredictPoint } from '@/types'

/**
 * 汽车销量预测
 * ------------------------------------------------------------
 * 数据来源：GET /api/predict/sales?carId=&horizon=
 * 前端仅负责参数组装、结果渲染与派生指标计算（总量、环比、峰值等）
 */

const route = useRoute()
const router = useRouter()
const predictStore = usePredictStore()

const brandOptions = ref<{ id: number; name: string }[]>([])
const carOptions = ref<Car[]>([])

const brandId = ref<number | undefined>(undefined)
const carId = ref<number | undefined>(predictStore.carId)
const horizon = ref<3 | 6 | 12>(predictStore.horizon)

const result = computed(() => predictStore.result)
const loading = computed(() => predictStore.loading)
const error = computed(() => predictStore.error)

interface PredictRow extends PredictPoint {
  mom: number
}

const tableRows = computed<PredictRow[]>(() => {
  const list = result.value?.prediction ?? []
  return list.map((p, i) => {
    const prev = i === 0 ? (result.value?.history.at(-1)?.value ?? p.value) : list[i - 1].value
    return { ...p, mom: prev ? ((p.value - prev) / prev) * 100 : 0 }
  })
})

const columns = [
  { prop: 'month', label: '预测月份', minWidth: 110 },
  { prop: 'value', label: '预测销量（辆）', minWidth: 140, align: 'right' as const, slot: 'value' },
  { prop: 'interval', label: '置信区间', minWidth: 160, slot: 'interval' },
  { prop: 'mom', label: '环比', minWidth: 90, align: 'right' as const, slot: 'mom' }
]

const totalPredicted = computed(() =>
  formatNumber((result.value?.prediction ?? []).reduce((sum, p) => sum + p.value, 0))
)

const growthText = computed(() => {
  const rate = result.value?.growthRate
  if (rate === undefined) return '--'
  return `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}%`
})

const peakValue = computed(() => {
  const p = result.value?.prediction.find((i) => i.month === result.value?.peakMonth)
  return p?.value ?? 0
})

const lowValue = computed(() => {
  const p = result.value?.prediction.find((i) => i.month === result.value?.lowMonth)
  return p?.value ?? 0
})

const conclusions = computed<string[]>(() => {
  const r = result.value
  if (!r) return []
  const lines: string[] = []
  const total = r.prediction.reduce((s, p) => s + p.value, 0)
  const avg = total / Math.max(1, r.prediction.length)
  const historyAvg = r.history.reduce((s, h) => s + h.value, 0) / Math.max(1, r.history.length)

  lines.push(
    `模型 ${r.model}（准确率 ${(r.accuracy * 100).toFixed(1)}%）预测 ${r.carName} 未来 ${r.horizon} 个月累计销量约 ${formatCompact(total)} 辆，月均 ${formatCompact(avg)} 辆。`
  )

  const diff = avg - historyAvg
  lines.push(
    diff >= 0
      ? `月均预测值较历史 ${r.history.length} 个月均值（${formatCompact(historyAvg)} 辆）高出 ${formatCompact(diff)} 辆，整体呈上行趋势。`
      : `月均预测值较历史 ${r.history.length} 个月均值（${formatCompact(historyAvg)} 辆）低 ${formatCompact(Math.abs(diff))} 辆，整体呈下行压力。`
  )

  if (r.peakMonth) {
    lines.push(
      `预测峰值出现在 ${r.peakMonth}（约 ${formatCompact(peakValue.value)} 辆）${
        r.lowMonth ? `，谷值出现在 ${r.lowMonth}（约 ${formatCompact(lowValue.value)} 辆）` : ''
      }，建议据此安排生产与库存节奏。`
    )
  }

  const widthAvg =
    r.prediction.reduce((s, p) => s + (((p.upper ?? p.value) - (p.lower ?? p.value)) / Math.max(1, p.value)) * 100, 0) /
    Math.max(1, r.prediction.length)
  lines.push(
    `置信区间平均宽度为 ±${(widthAvg / 2).toFixed(1)}%，周期越长不确定性越高；建议结合 ${
      r.horizon >= 12 ? '季度' : '月度'
    }滚动预测持续修正。`
  )

  return lines
})

function featureColor(index: number): string {
  return PALETTE[index % PALETTE.length]
}

/* ---------------- 交互 ---------------- */

async function loadBrands(): Promise<void> {
  try {
    const res = await carApi.options()
    brandOptions.value = res.brands
  } catch {
    brandOptions.value = []
  }
}

async function loadCars(targetBrand?: number): Promise<void> {
  try {
    const res = await carApi.list({
      brandId: targetBrand,
      page: 1,
      pageSize: 60,
      sortBy: 'sales',
      sortOrder: 'desc'
    })
    carOptions.value = res.list
  } catch {
    carOptions.value = []
  }
}

function onBrandChange(value: number | undefined): void {
  carId.value = undefined
  void loadCars(value)
}

async function onRun(): Promise<void> {
  if (carId.value === undefined) return
  await predictStore.run({ carId: carId.value, horizon: horizon.value })
}

function onReset(): void {
  predictStore.reset()
}

function exportCsv(): void {
  const rows = [
    ['预测月份', '预测销量(辆)', '置信下界', '置信上界', '环比(%)'],
    ...tableRows.value.map((r) => [
      r.month,
      String(r.value),
      String(r.lower ?? ''),
      String(r.upper ?? ''),
      r.mom.toFixed(1)
    ])
  ]
  const csv = `\uFEFF${rows.map((r) => r.join(',')).join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `autoinsight-prediction-${result.value?.carId ?? 'result'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

watch(
  () => predictStore.carId,
  (v) => {
    if (v !== undefined && carId.value === undefined) carId.value = v
  }
)

onMounted(async () => {
  await loadBrands()

  // 支持从推荐结果 / 车型详情跳转携带 ?carId=
  const queryCarId = Number(route.query.carId)
  const targetId = Number.isFinite(queryCarId) && queryCarId > 0 ? queryCarId : predictStore.carId

  if (targetId !== undefined) {
    try {
      const car = await carApi.detail(targetId)
      brandId.value = car.brandId
      await loadCars(car.brandId)
      carId.value = car.id
      await onRun()
    } catch {
      await loadCars()
    }
  } else {
    await loadCars()
  }

  // 清理 query，避免刷新重复触发
  if (route.query.carId) {
    void router.replace({ path: route.path })
  }
})
</script>

<style scoped lang="scss">
.predict__filter {
  padding: var(--ai-space-4) var(--ai-space-5);
}

.predict__filter-body {
  display: flex;
  align-items: flex-end;
  gap: var(--ai-space-5);
  flex-wrap: wrap;
}

.predict__field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.predict__label {
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-3);

  em { color: var(--ai-danger); font-style: normal; }
}

.predict__panel {
  overflow: hidden;
}

.predict__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ai-space-4);
  padding: var(--ai-space-3) var(--ai-space-5);
  flex-wrap: wrap;
}

.predict__meta-list {
  display: flex;
  align-items: center;
  gap: var(--ai-space-6);
  flex-wrap: wrap;
}

.predict__meta-item {
  display: flex;
  flex-direction: column;
  gap: 3px;

  em {
    font-style: normal;
    font-size: var(--ai-fs-mini);
    color: var(--ai-text-4);
  }

  b {
    font-size: var(--ai-fs-sm);
    color: var(--ai-text-1);
    font-weight: var(--ai-fw-medium);
  }
}

.predict__value {
  color: var(--ai-brand);
  font-weight: var(--ai-fw-medium);
}

.predict__interval {
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-3);
}

.predict__features {
  display: flex;
  flex-direction: column;
  gap: var(--ai-space-4);
}

.predict__features-hint {
  padding-top: var(--ai-space-3);
  border-top: 1px solid var(--ai-border);
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-3);
  line-height: var(--ai-lh-loose);
}

.predict__conclusion {
  display: flex;
  flex-direction: column;
  gap: var(--ai-space-3);

  li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  p {
    flex: 1;
    font-size: var(--ai-fs-sm);
    color: var(--ai-text-2);
    line-height: var(--ai-lh-loose);
  }
}

.predict__conclusion-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  margin-top: 7px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ai-brand), var(--ai-nev));
}

@media (max-width: 768px) {
  .predict__filter-body { flex-direction: column; align-items: stretch; }
}
</style>
