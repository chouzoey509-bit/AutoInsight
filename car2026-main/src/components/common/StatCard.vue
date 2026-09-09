<template>
  <section class="stat-card ai-panel ai-panel--hoverable" :class="{ 'is-loading': loading }">
    <LoadingState v-if="loading" variant="metric" />
    <template v-else>
      <header class="stat-card__head">
        <span class="stat-card__label">{{ label }}</span>
        <span v-if="icon" class="stat-card__icon"><el-icon :size="14"><component :is="iconComponent" /></el-icon></span>
      </header>
      <div class="stat-card__value">
        <span class="ai-metric">{{ displayValue }}</span>
        <span v-if="unit && format !== 'text'" class="ai-metric__unit">{{ unit }}</span>
      </div>
      <footer class="stat-card__foot">
        <span class="stat-card__delta" :class="deltaClass"><span class="stat-card__arrow">{{ arrow }}</span>{{ deltaText }}</span>
        <span v-if="hint" class="stat-card__hint">{{ hint }}</span>
      </footer>
      <div v-if="trend.length" class="stat-card__spark"><BaseChart :option="sparkOption" :height="42" /></div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Odometer } from '@element-plus/icons-vue'
import BaseChart from '@/components/charts/BaseChart.vue'
import LoadingState from './LoadingState.vue'
import type { MetricItem } from '@/types'
import { formatNumber, formatPercent, formatPrice, formatCompact } from '@/utils/format'
import type { EChartsOption } from 'echarts'

const props = withDefaults(defineProps<{
  label: string
  value?: number
  unit?: string
  change?: number
  trend?: number[]
  tone?: MetricItem['tone']
  hint?: string
  format?: MetricItem['format']
  text?: string
  loading?: boolean
  icon?: unknown
}>(), { value: 0, unit: '', change: 0, trend: () => [], tone: 'brand', format: 'int', loading: false })

const iconComponent = computed(() => props.icon ?? Odometer)

/** 数值滚动微动画：600ms 缓出计数 */
const animated = ref(0)
let raf = 0
watch(
  () => props.value,
  (target) => {
    if (props.format === 'text') {
      animated.value = target
      return
    }
    cancelAnimationFrame(raf)
    const from = animated.value
    const start = performance.now()
    const duration = 600
    const step = (now: number): void => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      animated.value = from + (target - from) * eased
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
  },
  { immediate: true }
)

const displayValue = computed(() => {
  if (props.format === 'text') return props.text ?? '--'
  if (props.format === 'percent') return formatPercent(animated.value, 1).replace('%', '')
  if (props.format === 'price') return formatPrice(animated.value, 2).replace('万', '')
  return formatNumber(Math.round(animated.value))
})
const deltaClass = computed(() => (props.change > 0 ? 'ai-up' : props.change < 0 ? 'ai-down' : ''))
const arrow = computed(() => (props.change > 0 ? '↑' : props.change < 0 ? '↓' : '—'))
const deltaText = computed(() => props.format === 'text' ? `份额 ${props.change.toFixed(1)}%` : `${Math.abs(props.change).toFixed(1)}%`)
const toneColor = computed(() => props.change < 0 ? 'var(--ai-down)' : 'var(--ai-brand)')
const sparkOption = computed<EChartsOption>(() => ({
  grid: { left: 0, right: 0, top: 4, bottom: 0 },
  xAxis: { type: 'category', show: false, boundaryGap: false, data: props.trend.map((_, i) => i) },
  yAxis: { type: 'value', show: false, scale: true },
  tooltip: { trigger: 'axis', backgroundColor: '#111111', borderWidth: 0, textStyle: { color: '#ffffff', fontSize: 11 }, formatter: (params: unknown) => formatCompact((params as { value: number }[])[0]?.value ?? 0) },
  series: [{ type: 'line', smooth: true, symbol: 'none', data: props.trend, lineStyle: { width: 1.5, color: toneColor.value } }]
}))
</script>

<style scoped lang="scss">
.stat-card { position: relative; display: flex; min-width: 0; flex-direction: column; gap: 10px; padding: 22px 24px; min-height: 148px; overflow: hidden; background: var(--ai-bg-panel); border: 1px solid var(--ai-border); box-shadow: none; }
.stat-card__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.stat-card__label { color: var(--ai-text-3); font-size: 12px; }
.stat-card__icon { display: grid; place-items: center; width: 28px; height: 28px; border: 1px solid var(--ai-border); color: var(--ai-text-2); }
.stat-card__value { display: flex; align-items: baseline; min-width: 0; line-height: 1; }
.stat-card__foot { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.stat-card__delta { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-family: var(--ai-font-mono); }
.stat-card__hint { color: var(--ai-text-4); font-size: 10px; }
.stat-card__spark { margin: 0 -4px -8px; }
</style>
