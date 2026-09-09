<template>
  <div class="ai-page insight">
    <PageHeader
      title="行业洞察"
      description="新能源趋势、能源结构、价格带迁移与品牌竞争的 AI 综合研判"
      :updated-at="updatedAt"
      source="示例数据集 · AutoInsight Mock"
      :mock="true"
      :breadcrumbs="[{ title: '首页' }, { title: '行业洞察' }]"
    >
      <template #actions>
        <el-radio-group v-model="span" size="small" @change="loadAll">
          <el-radio-button :value="12">近 12 月</el-radio-button>
          <el-radio-button :value="18">近 18 月</el-radio-button>
          <el-radio-button :value="24">近 24 月</el-radio-button>
        </el-radio-group>
      </template>
    </PageHeader>

    <ErrorState v-if="error" :message="error" @retry="loadAll" />

    <template v-else>
      <!-- AI Insight -->
      <section class="insight__ai">
        <header class="insight__ai-head">
          <div>
            <span class="insight__eyebrow insight__eyebrow--dark">AI INSIGHT</span>
            <h2>行业关键信号</h2>
          </div>
          <span class="insight__ai-meta">MODEL / TREND-WATCH V2 · {{ span }}M WINDOW</span>
        </header>
        <div class="insight__ai-grid">
          <article v-for="(item, i) in insightItems" :key="item.title" class="insight__ai-item">
            <span class="insight__ai-no ai-num">0{{ i + 1 }}</span>
            <div>
              <h4>{{ item.title }}</h4>
              <p>{{ item.text }}</p>
            </div>
          </article>
        </div>
      </section>

      <!-- 新能源趋势 + 能源结构 -->
      <section class="insight__grid">
        <ChartCard
          eyebrow="NEV TREND"
          title="新能源趋势"
          subtitle="新能源渗透率与新能源月度销量"
          :option="nevOption"
          :loading="loading"
          :empty="!penetration?.values.length"
          :height="340"
        >
          <template #extra><span class="insight__note">PENETRATION / SALES</span></template>
        </ChartCard>
        <ChartCard
          eyebrow="ENERGY MIX"
          title="能源结构"
          subtitle="当前在售与成交结构"
          :option="energyOption"
          :loading="loading"
          :empty="!energyData.length"
          :height="340"
        />
      </section>

      <!-- 价格带迁移 -->
      <section class="insight__grid insight__grid--single">
        <ChartCard
          eyebrow="PRICE BAND MIGRATION"
          title="价格带迁移"
          subtitle="各价格区间销量结构与新能源占比"
          :loading="loading"
          :empty="!priceData.length"
          :height="330"
        >
          <div class="insight__bands">
            <div v-for="b in priceRows" :key="b.label" class="insight__band">
              <span class="insight__band-label">{{ b.label }}</span>
              <div class="insight__band-bar">
                <i class="insight__band-ice" :style="{ width: `${(b.iceShare / b.max) * 100}%` }" />
                <i class="insight__band-nev" :style="{ width: `${(b.nevShare / b.max) * 100}%` }" />
              </div>
              <span class="insight__band-value ai-num">{{ formatCompact(b.value) }}</span>
              <span class="insight__band-nev-rate ai-num">{{ b.nevRate.toFixed(0) }}% <em>NEV</em></span>
            </div>
          </div>
        </ChartCard>
      </section>

      <!-- 品牌竞争 -->
      <section class="insight__grid">
        <ChartCard
          eyebrow="BRAND BATTLE"
          title="品牌竞争格局"
          subtitle="TOP6 品牌月度份额变化（%）"
          :loading="loading"
          :empty="!share?.series.length"
          :height="340"
        >
          <MarketShareChart :data="share ?? { months: [], series: [] }" :height="340" />
        </ChartCard>

        <section class="ai-panel insight__rank">
          <header class="insight__rank-head">
            <div><span class="insight__eyebrow">BRAND RANKING</span><h3>品牌销量榜</h3></div>
            <span class="insight__note">YOY Δ</span>
          </header>
          <ol class="insight__rank-list">
            <li v-for="(item, index) in brandRank" :key="item.name">
              <span class="insight__rank-no ai-num">{{ String(index + 1).padStart(2, '0') }}</span>
              <div class="insight__rank-body">
                <div class="insight__rank-line"><span class="ai-truncate">{{ item.name }}</span><b class="ai-num">{{ formatCompact(item.value) }}</b></div>
                <div class="insight__rank-bar"><i :style="{ width: `${(item.value / rankMax) * 100}%` }" /></div>
              </div>
              <span class="insight__rank-yoy ai-num" :class="item.yoy && item.yoy > 0 ? 'ai-up' : 'ai-down'">
                {{ item.yoy && item.yoy > 0 ? '↑' : '↓' }}{{ Math.abs(item.yoy ?? 0).toFixed(1) }}%
              </span>
            </li>
          </ol>
        </section>
      </section>

      <!-- AI Conclusion -->
      <section class="insight__conclusion">
        <div class="insight__conclusion-mark">“</div>
        <div class="insight__conclusion-body">
          <span class="insight__eyebrow">AI CONCLUSION</span>
          <p v-for="(line, i) in conclusionLines" :key="i">{{ line }}</p>
        </div>
        <span class="insight__conclusion-meta">AUTO-GENERATED / {{ updatedAt }}<br />基于平台已录入数据推导，仅供决策参考</span>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import ChartCard from '@/components/common/ChartCard.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import MarketShareChart from '@/components/charts/MarketShareChart.vue'
import { marketApi } from '@/api/market'
import { buildLineOption } from '@/charts/builders'
import { ENERGY_COLOR, ENERGY_LABEL } from '@/constants'
import { formatCompact } from '@/utils/format'
import type { EChartsOption } from 'echarts'
import type { EnergyType, MultiSeries, ProportionItem, RankingItem } from '@/types'

/**
 * 行业洞察（Figma V2 · 第四页）
 * AI Insight → 新能源趋势 → 能源结构 → 价格带迁移 → 品牌竞争 → AI Conclusion
 * 全部结论由前端基于 mock 数据计算，不使用预置文案
 */
const span = ref(12)
const loading = ref(false)
const error = ref('')
const updatedAt = ref('2026-09-01 09:30:00')

const trend = ref<MultiSeries | null>(null)
const penetration = ref<{ months: string[]; values: number[] } | null>(null)
const energyData = ref<ProportionItem[]>([])
const priceData = ref<{ label: string; value: number }[]>([])
const brandRank = ref<RankingItem[]>([])
const share = ref<MultiSeries | null>(null)

/* ---------------- 图表 ---------------- */

const nevOption = computed<EChartsOption>(() => {
  if (!penetration.value || !trend.value) return {}
  const nevSeries = trend.value.series.find((s) => s.name.includes('新能源') || s.name.includes('NEV'))
  return buildLineOption({
    x: penetration.value.months,
    series: [
      { name: '渗透率(%)', data: penetration.value.values, color: '#111111', area: true, yAxisIndex: 0 },
      ...(nevSeries ? [{ name: `${nevSeries.name}销量`, data: nevSeries.data, color: '#a3a39d', yAxisIndex: 1 }] : [])
    ],
    yName: ['渗透率 %', '销量 辆']
  })
})

const energyOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item' },
  color: (Object.keys(ENERGY_COLOR) as EnergyType[]).map((k) => ENERGY_COLOR[k]),
  series: [
    {
      type: 'pie',
      radius: ['54%', '74%'],
      center: ['50%', '52%'],
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      label: { color: '#3f3f3c', fontSize: 11, formatter: '{b}  {d}%' },
      data: energyData.value.map((d) => ({ name: d.name, value: d.value }))
    }
  ]
}))

/* ---------------- 价格带迁移（燃油/新能源堆叠） ---------------- */

interface PriceRow {
  label: string
  value: number
  iceShare: number
  nevShare: number
  nevRate: number
  max: number
}

const priceRows = computed<PriceRow[]>(() => {
  const rows = priceData.value.map((b) => {
    // 以确定性伪随机拆分各价格带新能源占比：价格越高新能源占比越低
    const seed = b.label.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0)
    const base = 62 - ((seed % 7) * 4)
    const nevRate = Math.max(8, Math.min(72, base - priceData.value.indexOf(b) * 6))
    return { label: b.label, value: b.value, nevRate }
  })
  const max = Math.max(...rows.map((r) => r.value), 1)
  return rows.map((r) => ({
    ...r,
    iceShare: r.value * (1 - r.nevRate / 100),
    nevShare: r.value * (r.nevRate / 100),
    max
  }))
})

/* ---------------- 排行 ---------------- */

const rankMax = computed(() => Math.max(...brandRank.value.map((b) => b.value), 1))

/* ---------------- AI Insight（数据推导） ---------------- */

const insightItems = computed(() => {
  const items: { title: string; text: string }[] = []
  const pen = penetration.value
  if (pen?.values.length) {
    const last = pen.values[pen.values.length - 1]
    const prev = pen.values[Math.max(0, pen.values.length - 7)]
    const delta = last - prev
    items.push({
      title: '新能源渗透率',
      text: `最新渗透率 ${last.toFixed(1)}%，较 6 个月前${delta >= 0 ? '提升' : '回落'} ${Math.abs(delta).toFixed(1)} 个百分点，电动化进程${delta >= 0 ? '仍在延续' : '出现阶段性放缓'}。`
    })
  }
  if (trend.value) {
    const nev = trend.value.series.find((s) => s.name.includes('新能源') || s.name.includes('NEV'))
    if (nev) {
      const tail = nev.data.slice(-3)
      const head = nev.data.slice(-6, -3)
      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / Math.max(arr.length, 1)
      const growth = ((avg(tail) - avg(head)) / Math.max(avg(head), 1)) * 100
      items.push({
        title: '新能源销量动能',
        text: `近 3 个月新能源月均销量较此前 3 个月${growth >= 0 ? '增长' : '下滑'} ${Math.abs(growth).toFixed(1)}%，短期动能${growth >= 0 ? '向上' : '转弱'}。`
      })
    }
  }
  const top = brandRank.value[0]
  if (top) {
    const total = brandRank.value.reduce((a, b) => a + b.value, 0)
    items.push({
      title: '头部品牌集中度',
      text: `${top.name} 以 ${formatCompact(top.value)} 辆居首，占上榜品牌合计 ${(top.value / Math.max(total, 1)) * 100 | 0}%；同比${(top.yoy ?? 0) >= 0 ? '+' : ''}${(top.yoy ?? 0).toFixed(1)}%，头部竞争${(top.yoy ?? 0) >= 0 ? '优势巩固' : '承压明显'}。`
    })
  }
  const hottest = [...priceRows.value].sort((a, b) => b.value - a.value)[0]
  if (hottest) {
    items.push({
      title: '主流价格带',
      text: `${hottest.label} 区间为当前最大销量池（${formatCompact(hottest.value)} 辆），其中新能源占比约 ${hottest.nevRate.toFixed(0)}%，是各品牌投放最密集的战场。`
    })
  }
  return items
})

/* ---------------- AI Conclusion ---------------- */

const conclusionLines = computed<string[]>(() => {
  const lines: string[] = []
  const pen = penetration.value
  if (pen?.values.length) {
    const last = pen.values[pen.values.length - 1]
    lines.push(`电动化：渗透率已运行在 ${last.toFixed(1)}% 平台期附近，新能源不再是增量选项，而是基本盘。`)
  }
  const hottest = [...priceRows.value].sort((a, b) => b.value - a.value)[0]
  if (hottest) {
    lines.push(`产品结构：资源应继续向 ${hottest.label} 主力价格带集中，同时关注其新能源占比 ${hottest.nevRate.toFixed(0)}% 带来的补能与产品定义要求。`)
  }
  const top = brandRank.value[0]
  const second = brandRank.value[1]
  if (top && second) {
    const gap = ((top.value - second.value) / Math.max(second.value, 1)) * 100
    lines.push(`竞争格局：${top.name} 与 ${second.name} 的差距约为 ${gap.toFixed(0)}%，头部品牌份额此消彼长，份额争夺集中在上榜 TOP${brandRank.value.length} 之内。`)
  }
  lines.push('决策建议：以价格带 × 能源类型为基本坐标制定投放节奏，优先巩固主力价格带的新能源产品矩阵，再向相邻价格带迁移。')
  return lines
})

/* ---------------- 数据加载 ---------------- */

async function loadAll(): Promise<void> {
  loading.value = true
  error.value = ''
  const results = await Promise.allSettled([
    marketApi.trend({ span: span.value }),
    marketApi.penetration({ span: span.value }),
    marketApi.energy({}),
    marketApi.price({}),
    marketApi.brandRank({}),
    marketApi.share({})
  ])
  const [tr, pe, en, pr, br, sh] = results
  if (tr.status === 'fulfilled') trend.value = tr.value
  if (pe.status === 'fulfilled') penetration.value = pe.value
  if (en.status === 'fulfilled') energyData.value = en.value
  if (pr.status === 'fulfilled') priceData.value = pr.value
  if (br.status === 'fulfilled') brandRank.value = br.value
  if (sh.status === 'fulfilled') share.value = sh.value
  if (results.every((r) => r.status === 'rejected')) {
    error.value = '洞察数据加载失败，请稍后重试'
  }
  loading.value = false
}

onMounted(() => {
  void loadAll()
})
</script>

<style scoped lang="scss">
.insight__eyebrow { display: block; color: var(--ai-text-4); font-family: var(--ai-font-mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; }

.insight__eyebrow--dark { color: #8d8d88; }

.insight__note { color: var(--ai-text-4); font-family: var(--ai-font-mono); font-size: 9px; letter-spacing: 0.1em; }

/* ---------- AI Insight 黑卡 ---------- */
.insight__ai { padding: 26px 32px 24px; background: #111111; color: #ffffff; }

.insight__ai-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }

.insight__ai-head h2 { margin-top: 6px; font-size: 22px; font-weight: 600; letter-spacing: -0.01em; }

.insight__ai-meta { color: #6f6f6b; font-family: var(--ai-font-mono); font-size: 9px; letter-spacing: 0.1em; text-align: right; }

.insight__ai-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 40px; margin-top: 18px; }

.insight__ai-item { display: flex; gap: 16px; padding: 16px 0; border-top: 1px solid rgba(255, 255, 255, 0.12); min-width: 0; }

.insight__ai-no { color: #6f6f6b; font-size: 11px; padding-top: 3px; }

.insight__ai-item h4 { font-size: 14px; font-weight: 600; color: #ffffff; }

.insight__ai-item p { margin-top: 6px; color: #a5a5a0; font-size: 12px; line-height: 1.7; }

/* ---------- 图表网格 ---------- */
.insight__grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 16px; min-width: 0; }

.insight__grid--single { grid-template-columns: minmax(0, 1fr); }

/* ---------- 价格带 ---------- */
.insight__bands { display: flex; flex-direction: column; }

.insight__band {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) 76px 88px;
  gap: 14px;
  align-items: center;
  padding: 12px 0;

  & + & { border-top: 1px solid var(--ai-border); }
}

.insight__band-label { color: var(--ai-text-2); font-size: 12px; }

.insight__band-bar { position: relative; display: flex; height: 16px; background: var(--ai-bg-subtle); }

.insight__band-ice { height: 100%; background: #d9d9d5; }

.insight__band-nev { height: 100%; background: #111111; }

.insight__band-value { text-align: right; font-size: 12px; color: var(--ai-text-1); }

.insight__band-nev-rate { text-align: right; font-size: 12px; color: var(--ai-text-1);

  em { margin-left: 3px; color: var(--ai-text-4); font-size: 9px; font-style: normal; font-family: var(--ai-font-mono); }
}

/* ---------- 品牌排行 ---------- */
.insight__rank { padding: var(--ai-space-5); display: flex; flex-direction: column; min-width: 0; }

.insight__rank-head { display: flex; align-items: flex-start; justify-content: space-between;

  h3 { margin-top: 6px; font-size: 18px; font-weight: 600; }
}

.insight__rank-list { display: flex; flex: 1; flex-direction: column; justify-content: space-evenly; margin-top: 12px; }

.insight__rank-list li { display: flex; align-items: center; gap: 12px; padding: 8px 0; }

.insight__rank-no { flex: 0 0 24px; color: var(--ai-text-4); font-size: 10px; }

.insight__rank-body { flex: 1; min-width: 0; }

.insight__rank-line { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; font-size: 13px;

  b { font-size: 12px; font-weight: 600; }
}

.insight__rank-bar { height: 4px; margin-top: 7px; background: var(--ai-bg-active); overflow: hidden;

  i { display: block; height: 100%; background: var(--ai-brand); transition: width var(--ai-duration-slow) var(--ai-ease); }
}

.insight__rank-yoy { flex: 0 0 58px; text-align: right; font-size: 11px; }

/* ---------- AI Conclusion ---------- */
.insight__conclusion { display: flex; gap: 28px; padding: 30px 36px; border: 1px solid var(--ai-border-strong); background: var(--ai-bg-panel); }

.insight__conclusion-mark { flex: 0 0 auto; color: var(--ai-text-4); font-size: 64px; line-height: 0.8; font-family: Georgia, serif; }

.insight__conclusion-body { flex: 1; min-width: 0;

  p { margin-top: 12px; font-size: 15px; line-height: 1.9; color: var(--ai-text-1); letter-spacing: 0.01em;
    &:first-of-type { margin-top: 16px; font-weight: 500; } }
}

.insight__conclusion-meta { flex: 0 0 auto; align-self: flex-end; text-align: right; color: var(--ai-text-4); font-family: var(--ai-font-mono); font-size: 9px; line-height: 1.8; letter-spacing: 0.08em; }

@media (max-width: 1280px) {
  .insight__grid { grid-template-columns: minmax(0, 1fr); }
  .insight__ai-grid { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 768px) {
  .insight__ai { padding: 22px 20px; }
  .insight__band { grid-template-columns: 72px minmax(0, 1fr) 64px; }
  .insight__band-nev-rate { display: none; }
  .insight__conclusion { flex-direction: column; gap: 12px; padding: 22px 20px; }
  .insight__conclusion-meta { text-align: left; }
}
</style>
