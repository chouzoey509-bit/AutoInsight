<template>
  <section class="ai-panel chart-card">
    <header class="ai-panel__header">
      <div class="chart-card__title-wrap">
        <span class="chart-card__eyebrow">{{ eyebrow }}</span>
        <h3 class="ai-panel__title">{{ title }}</h3>
        <p v-if="subtitle" class="chart-card__subtitle">{{ subtitle }}</p>
      </div>
      <div class="chart-card__extra"><slot name="extra" /></div>
    </header>
    <div class="chart-card__body" :style="{ padding: flush ? '0' : 'var(--ai-space-4)' }">
      <ErrorState v-if="error" :message="error" compact @retry="emit('retry')" />
      <EmptyState v-else-if="empty" :description="emptyText" compact />
      <LoadingState v-else-if="loading" variant="chart" :height="height" />
      <slot v-else><BaseChart :option="option ?? null" :height="height" /></slot>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import BaseChart from '@/components/charts/BaseChart.vue'
import EmptyState from './EmptyState.vue'
import ErrorState from './ErrorState.vue'
import LoadingState from './LoadingState.vue'

defineProps<{
  title: string
  subtitle?: string
  eyebrow?: string
  option?: EChartsOption | null
  height?: number | string
  loading?: boolean
  empty?: boolean
  emptyText?: string
  error?: string
  mock?: boolean
  flush?: boolean
}>()
const emit = defineEmits<{ (e: 'retry'): void }>()
</script>

<style scoped lang="scss">
.chart-card { display: flex; flex-direction: column; min-width: 0; overflow: hidden; background: var(--ai-bg-panel); border: 1px solid var(--ai-border); box-shadow: none; }
.chart-card__title-wrap { min-width: 0; }
.chart-card__eyebrow { display: block; margin-bottom: 7px; color: var(--ai-text-4); font-family: var(--ai-font-mono); font-size: 9px; letter-spacing: .12em; text-transform: uppercase; }
.ai-panel__title { font-size: 18px; font-weight: 600; letter-spacing: -.01em; }
.chart-card__subtitle { margin-top: 4px; color: var(--ai-text-4); font-size: 11px; line-height: 1.5; }
.chart-card__extra { display: flex; align-items: center; gap: var(--ai-space-2); flex-shrink: 0; }
.chart-card__body { flex: 1; min-height: 0; min-width: 0; }
</style>
