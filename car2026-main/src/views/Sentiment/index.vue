<template>
  <div class="ai-page sentiment">
    <PageHeader
      title="舆情分析"
      description="汇总用户在车型评价、社区讨论中产生的情感倾向，识别品牌口碑变化与高频关注点"
      :updated-at="overview?.updatedAt"
      source="示例数据集 · 舆情语料"
      :mock="true"
      :breadcrumbs="[{ title: '首页' }, { title: '舆情分析' }]"
    >
      <template #actions>
        <el-button :loading="loading" @click="loadAll">
          <el-icon><Refresh /></el-icon>
          <span style="margin-left: 4px">刷新</span>
        </el-button>
      </template>
    </PageHeader>

    <!-- 数据声明 -->
    <section class="sentiment__notice ai-panel">
      <el-icon :size="16"><InfoFilled /></el-icon>
      <p>
        本页面展示的是<b>示例数据（Mock Data）</b>，用于呈现舆情分析的指标口径与可视化形态。
        接入真实后端后，情感判定将由 NLP 模型服务在服务端完成，前端展示结构保持不变。
      </p>
    </section>

    <!-- ---------------- 核心指标 ---------------- -->
    <section class="ai-cols ai-cols--4">
      <StatCard
        label="评价总量"
        :value="overview?.total ?? 0"
        unit="条"
        :change="12.4"
        :trend="trendPositive.length ? trendPositive : []"
        tone="brand"
        :loading="loading"
        :icon="ChatDotRound"
      />
      <StatCard
        label="正面占比"
        :value="overview?.positiveRate ?? 0"
        format="percent"
        unit="%"
        :change="3.2"
        :trend="positiveRateTrend"
        tone="nev"
        :loading="loading"
        :icon="CircleCheck"
      />
      <StatCard
        label="负面评价"
        :value="overview?.negative ?? 0"
        unit="条"
        :change="-5.8"
        :trend="trendNegative.length ? trendNegative : []"
        tone="danger"
        :loading="loading"
        :icon="WarningFilled"
      />
      <StatCard
        label="平均情感分"
        :value="overview?.avgScore ?? 0"
        format="text"
        :text="(overview?.avgScore ?? 0).toFixed(2)"
        :change="2.1"
        hint="满分 5 分"
        tone="warn"
        :loading="loading"
        :icon="Star"
      />
    </section>

    <ErrorState
      v-if="globalError"
      :message="globalError"
      description="舆情数据加载失败，可点击重新加载"
      @retry="loadAll"
    />

    <template v-else>
      <!-- ---------------- 情感分布 + 趋势 ---------------- -->
      <section class="ai-cols ai-cols--1-2">
        <ChartCard
          title="情感倾向分布"
          subtitle="全部评价样本的情感判定占比"
          mock
          :loading="loading"
          :empty="!slices.length"
          :height="300"
        >
          <SentimentChart :data="slices" :height="300" />
          <template #extra>
            <span class="ai-tag ai-tag--mock">示例数据</span>
          </template>
        </ChartCard>

        <ChartCard
          title="情感趋势变化"
          subtitle="近 12 个月正面 / 中性 / 负面评价量走势"
          mock
          :loading="loading"
          :empty="!trend?.months.length"
          :height="300"
        >
          <SalesTrendChart
            :months="trend?.months ?? []"
            :series="trendSeries"
            :height="300"
            :smooth="true"
          />
        </ChartCard>
      </section>

      <!-- ---------------- 品牌口碑 + 词云 ---------------- -->
      <section class="ai-cols ai-cols--2-1">
        <section class="ai-panel sentiment__panel">
          <header class="ai-panel__header">
            <div>
              <h3 class="ai-panel__title">品牌口碑排行</h3>
              <p class="ai-panel__subtitle">按口碑综合分排序，含正面率与声量</p>
            </div>
            <span class="ai-tag ai-tag--mock">示例数据</span>
          </header>

          <LoadingState v-if="loading" variant="table" :rows="8" :columns="1" />
          <EmptyState v-else-if="!reputation.length" title="暂无口碑数据" compact />
          <div v-else class="sentiment__reputation">
            <div v-for="(item, idx) in reputation" :key="item.brand" class="sentiment__rep-item">
              <span class="sentiment__rep-no" :class="{ 'is-top': idx < 3 }">{{ idx + 1 }}</span>
              <div class="sentiment__rep-body">
                <div class="sentiment__rep-head">
                  <span class="sentiment__rep-name">{{ item.brand }}</span>
                  <span class="sentiment__rep-score ai-num">{{ item.score.toFixed(2) }}</span>
                </div>
                <div class="ai-bar">
                  <div class="ai-bar__fill" :style="{ width: `${(item.score / 5) * 100}%` }" />
                </div>
                <div class="sentiment__rep-meta">
                  <span class="ai-num">正面率 {{ item.positiveRate.toFixed(1) }}%</span>
                  <span class="ai-num">声量 {{ formatCompact(item.mentionCount) }}</span>
                  <span
                    v-if="item.delta !== undefined"
                    class="ai-num"
                    :class="item.delta >= 0 ? 'ai-up' : 'ai-down'"
                  >
                    {{ item.delta >= 0 ? '↑' : '↓' }} {{ Math.abs(item.delta).toFixed(1) }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="ai-panel sentiment__panel">
          <header class="ai-panel__header">
            <div>
              <h3 class="ai-panel__title">热门关键词云</h3>
              <p class="ai-panel__subtitle">字号表示出现频次，点击可筛选对应评价</p>
            </div>
          </header>
          <LoadingState v-if="loading" variant="chart" :height="240" />
          <EmptyState v-else-if="!keywords.length" title="暂无关键词" compact />
          <KeywordCloud v-else :data="keywords" :limit="36" @select="onKeywordSelect" />
        </section>
      </section>

      <!-- ---------------- 正负面关键词 ---------------- -->
      <section class="ai-cols ai-cols--2">
        <section class="ai-panel sentiment__panel">
          <header class="ai-panel__header">
            <div>
              <h3 class="ai-panel__title">正面关键词 TOP10</h3>
              <p class="ai-panel__subtitle">用户评价中高频出现的褒义表述</p>
            </div>
            <span class="ai-tag ai-tag--nev">正面</span>
          </header>
          <div class="ai-panel__body sentiment__kw">
            <LoadingState v-if="loading" variant="text" :rows="8" />
            <EmptyState v-else-if="!positiveKeywords.length" title="暂无正面关键词" compact />
            <div v-for="k in positiveKeywords" :key="k.word" class="sentiment__kw-item">
              <span class="sentiment__kw-word">{{ k.word }}</span>
              <div class="ai-bar sentiment__kw-bar">
                <div
                  class="ai-bar__fill"
                  :style="{ width: `${kwWidth(k.count, positiveKeywords)}%`, background: 'var(--ai-nev)' }"
                />
              </div>
              <span class="sentiment__kw-count ai-num">{{ k.count }}</span>
            </div>
          </div>
        </section>

        <section class="ai-panel sentiment__panel">
          <header class="ai-panel__header">
            <div>
              <h3 class="ai-panel__title">负面关键词 TOP10</h3>
              <p class="ai-panel__subtitle">需重点关注的集中抱怨点</p>
            </div>
            <span class="ai-tag ai-tag--danger">负面</span>
          </header>
          <div class="ai-panel__body sentiment__kw">
            <LoadingState v-if="loading" variant="text" :rows="8" />
            <EmptyState v-else-if="!negativeKeywords.length" title="暂无负面关键词" compact />
            <div v-for="k in negativeKeywords" :key="k.word" class="sentiment__kw-item">
              <span class="sentiment__kw-word">{{ k.word }}</span>
              <div class="ai-bar sentiment__kw-bar">
                <div
                  class="ai-bar__fill"
                  :style="{ width: `${kwWidth(k.count, negativeKeywords)}%`, background: 'var(--ai-danger)' }"
                />
              </div>
              <span class="sentiment__kw-count ai-num">{{ k.count }}</span>
            </div>
          </div>
        </section>
      </section>

      <!-- ---------------- 评价明细 ---------------- -->
      <section class="ai-panel sentiment__panel">
        <header class="ai-panel__header">
          <div>
            <h3 class="ai-panel__title">评价明细</h3>
            <p class="ai-panel__subtitle">支持按情感倾向与关键词筛选原始评价样本</p>
          </div>
          <div class="sentiment__review-filter">
            <el-select
              v-model="reviewQuery.sentiment"
              placeholder="全部情感"
              clearable
              style="width: 130px"
              @change="loadReviews"
            >
              <el-option label="正面" value="positive" />
              <el-option label="中性" value="neutral" />
              <el-option label="负面" value="negative" />
            </el-select>
            <SearchBar
              v-model="reviewQuery.keyword"
              placeholder="搜索评价内容 / 车型"
              width="240px"
              @search="loadReviews"
            />
          </div>
        </header>

        <DataTable
          v-model:page="reviewPage"
          v-model:page-size="reviewPageSize"
          :data="reviews"
          :columns="reviewColumns"
          :loading="reviewLoading"
          :total="reviewTotal"
          empty-text="暂无匹配评价"
          @page-change="onReviewPageChange"
        >
          <template #carName="{ row }">
            <div class="sentiment__car">
              <span class="sentiment__car-brand" :style="{ background: brandColor(row.brand) }">
                {{ row.brand.slice(0, 1) }}
              </span>
              <div class="sentiment__car-info">
                <span class="sentiment__car-name">{{ row.carName }}</span>
                <span class="sentiment__car-meta">{{ row.brand }}</span>
              </div>
            </div>
          </template>

          <template #sentiment="{ row }">
            <StatusTag :status="row.sentiment" />
          </template>

          <template #rating="{ row }">
            <span class="sentiment__rating">
              <el-rate :model-value="row.rating" disabled size="small" />
              <em class="ai-num">{{ row.rating.toFixed(1) }}</em>
            </span>
          </template>

          <template #content="{ row }">
            <p class="sentiment__content ai-clamp-2">{{ row.content }}</p>
          </template>

          <template #createdAt="{ row }">
            <span class="ai-num">{{ formatDate(row.createdAt) }}</span>
          </template>
        </DataTable>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  ChatDotRound,
  CircleCheck,
  InfoFilled,
  Refresh,
  Star,
  WarningFilled
} from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import ChartCard from '@/components/common/ChartCard.vue'
import StatCard from '@/components/common/StatCard.vue'
import DataTable from '@/components/common/DataTable.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import SentimentChart from '@/components/charts/SentimentChart.vue'
import SalesTrendChart from '@/components/charts/SalesTrendChart.vue'
import KeywordCloud from '@/components/charts/KeywordCloud.vue'
import { sentimentApi, reviewApi } from '@/api/sentiment'
import { brandColor } from '@/utils/brand'
import { formatCompact, formatDate } from '@/utils/format'
import { PALETTE } from '@/charts/theme'
import type { BrandReputation, KeywordItem, ReviewItem, SentimentTrend } from '@/types'

/** 情感环形图数据项（与 SentimentChart 的 props 结构一致） */
interface SentimentSlice {
  name: string
  value: number
  color: string
}

/**
 * 舆情分析
 * ------------------------------------------------------------
 * 数据来源：/api/sentiment · /api/sentiment/trend · /api/sentiment/keywords
 *          /api/sentiment/brand-reputation · /api/reviews
 * 情感判定由服务端 NLP 模型完成，前端只做展示；当前为 Mock 数据，页面已明确标注
 */

const loading = ref(false)
const globalError = ref('')

const overview = ref<Awaited<ReturnType<typeof sentimentApi.overview>> | null>(null)
const trend = ref<SentimentTrend | null>(null)
const keywords = ref<KeywordItem[]>([])
const reputation = ref<BrandReputation[]>([])

/* ---------------- 情感分布 ---------------- */

const slices = computed<SentimentSlice[]>(() => {
  const o = overview.value
  if (!o) return []
  return [
    { name: '正面', value: o.positive, color: PALETTE[1] },
    { name: '中性', value: o.neutral, color: PALETTE[2] },
    { name: '负面', value: o.negative, color: PALETTE[5] }
  ]
})

const trendPositive = computed(() => trend.value?.positive ?? [])
const trendNeutral = computed(() => trend.value?.neutral ?? [])
const trendNegative = computed(() => trend.value?.negative ?? [])

const positiveRateTrend = computed(() => {
  const t = trend.value
  if (!t) return []
  return t.months.map((_, i) => {
    const total = (t.positive[i] ?? 0) + (t.neutral[i] ?? 0) + (t.negative[i] ?? 0)
    return total ? Number((((t.positive[i] ?? 0) / total) * 100).toFixed(1)) : 0
  })
})

const trendSeries = computed(() => [
  { name: '正面', data: trendPositive.value, color: PALETTE[1], area: true },
  { name: '中性', data: trendNeutral.value, color: PALETTE[2], area: false },
  { name: '负面', data: trendNegative.value, color: PALETTE[5], area: false }
])

/* ---------------- 关键词 ---------------- */

const positiveKeywords = computed(() =>
  keywords.value.filter((k) => k.sentiment === 'positive').sort((a, b) => b.count - a.count).slice(0, 10)
)

const negativeKeywords = computed(() =>
  keywords.value.filter((k) => k.sentiment === 'negative').sort((a, b) => b.count - a.count).slice(0, 10)
)

function kwWidth(count: number, list: KeywordItem[]): number {
  const max = Math.max(...list.map((k) => k.count), 1)
  return (count / max) * 100
}

/* ---------------- 评价明细 ---------------- */

const reviews = ref<ReviewItem[]>([])
const reviewTotal = ref(0)
const reviewLoading = ref(false)
const reviewPage = ref(1)
const reviewPageSize = ref(10)
const reviewQuery = reactive<{ sentiment: string; keyword: string }>({ sentiment: '', keyword: '' })

const reviewColumns = [
  { prop: 'carName', label: '车型', minWidth: 200, slot: 'carName' },
  { prop: 'user', label: '用户', width: 120 },
  { prop: 'rating', label: '评分', width: 150, slot: 'rating' },
  { prop: 'sentiment', label: '情感', width: 100, slot: 'sentiment' },
  { prop: 'content', label: '评价内容', minWidth: 320, slot: 'content' },
  { prop: 'likes', label: '点赞', width: 90, align: 'right' as const },
  { prop: 'createdAt', label: '评价时间', width: 120, slot: 'createdAt' }
]

async function loadReviews(): Promise<void> {
  reviewLoading.value = true
  try {
    const res = await reviewApi.list({
      page: reviewPage.value,
      pageSize: reviewPageSize.value,
      sentiment: reviewQuery.sentiment || undefined,
      keyword: reviewQuery.keyword || undefined
    })
    reviews.value = res.list
    reviewTotal.value = res.total
  } catch (e) {
    reviews.value = []
    reviewTotal.value = 0
  } finally {
    reviewLoading.value = false
  }
}

function onReviewPageChange({ page, pageSize }: { page: number; pageSize: number }): void {
  reviewPage.value = page
  reviewPageSize.value = pageSize
  void loadReviews()
}

function onKeywordSelect(item: KeywordItem): void {
  reviewQuery.keyword = item.word
  reviewPage.value = 1
  void loadReviews()
}

/* ---------------- 数据加载 ---------------- */

async function loadAll(): Promise<void> {
  loading.value = true
  globalError.value = ''
  try {
    const [o, t, k, r] = await Promise.all([
      sentimentApi.overview(),
      sentimentApi.trend(),
      sentimentApi.keywords(),
      sentimentApi.brandReputation(10)
    ])
    overview.value = o
    trend.value = t
    keywords.value = k
    reputation.value = r
  } catch (e) {
    globalError.value = e instanceof Error ? e.message : '舆情数据加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
  await loadReviews()
}

onMounted(() => {
  void loadAll()
})
</script>

<style scoped lang="scss">
.sentiment__notice {
  display: flex;
  align-items: flex-start;
  gap: var(--ai-space-3);
  padding: var(--ai-space-3) var(--ai-space-5);
  border-color: rgba(245, 165, 36, 0.28);
  background: var(--ai-warn-soft);

  .el-icon { flex-shrink: 0; margin-top: 2px; color: var(--ai-warn); }

  p {
    font-size: var(--ai-fs-xs);
    color: var(--ai-text-2);
    line-height: var(--ai-lh-loose);
  }

  b { color: var(--ai-warn); }
}

.sentiment__panel {
  overflow: hidden;
  min-width: 0;
}

/* ---------- 品牌口碑 ---------- */
.sentiment__reputation {
  padding: var(--ai-space-4) var(--ai-space-5);
  display: flex;
  flex-direction: column;
  gap: var(--ai-space-3);
}

.sentiment__rep-item {
  display: flex;
  align-items: center;
  gap: var(--ai-space-3);
}

.sentiment__rep-no {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: var(--ai-radius-xs);
  background: var(--ai-bg-subtle);
  border: 1px solid var(--ai-border);
  font-size: var(--ai-fs-mini);
  color: var(--ai-text-3);

  &.is-top {
    color: var(--ai-warn);
    border-color: rgba(245, 165, 36, 0.32);
    background: var(--ai-warn-soft);
  }
}

.sentiment__rep-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sentiment__rep-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ai-space-2);
}

.sentiment__rep-name {
  font-size: var(--ai-fs-sm);
  color: var(--ai-text-1);
}

.sentiment__rep-score {
  font-size: var(--ai-fs-sm);
  color: var(--ai-warn);
  font-weight: var(--ai-fw-semibold);
}

.sentiment__rep-meta {
  display: flex;
  align-items: center;
  gap: var(--ai-space-4);
  font-size: var(--ai-fs-mini);
  color: var(--ai-text-4);
}

/* ---------- 关键词条 ---------- */
.sentiment__kw {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sentiment__kw-item {
  display: flex;
  align-items: center;
  gap: var(--ai-space-3);
}

.sentiment__kw-word {
  flex-shrink: 0;
  width: 84px;
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sentiment__kw-bar {
  flex: 1;
  min-width: 0;
}

.sentiment__kw-count {
  flex-shrink: 0;
  width: 42px;
  text-align: right;
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-3);
}

/* ---------- 评价明细 ---------- */
.sentiment__review-filter {
  display: flex;
  align-items: center;
  gap: var(--ai-space-3);
  flex-wrap: wrap;
}

.sentiment__car {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.sentiment__car-brand {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: var(--ai-radius-xs);
  color: #fff;
  font-size: var(--ai-fs-mini);
  font-weight: 600;
  flex-shrink: 0;
}

.sentiment__car-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.35;
}

.sentiment__car-name {
  font-size: var(--ai-fs-sm);
  color: var(--ai-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sentiment__car-meta {
  font-size: 10px;
  color: var(--ai-text-4);
}

.sentiment__rating {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  em {
    font-style: normal;
    font-size: var(--ai-fs-xs);
    color: var(--ai-warn);
  }
}

.sentiment__content {
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-2);
  line-height: var(--ai-lh-normal);
}

@media (max-width: 768px) {
  .sentiment__kw-word { width: 68px; }
}
</style>
