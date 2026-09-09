<template>
  <BaseChart :option="option" :height="height" :loading="loading" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'
import { buildLineOption, type LineSeriesInput } from '@/charts/builders'
import { PALETTE } from '@/charts/theme'

/** 销量趋势图（折线 / 面积） */
const props = withDefaults(
  defineProps<{
    months: string[]
    series: { name: string; data: number[]; color?: string; dashed?: boolean; area?: boolean }[]
    height?: number | string
    loading?: boolean
    valueType?: 'compact' | 'percent' | 'plain'
    dataZoom?: boolean
    smooth?: boolean
  }>(),
  { height: 300, loading: false, valueType: 'compact', dataZoom: false, smooth: true }
)

const option = computed<EChartsOption>(() => {
  const inputs: LineSeriesInput[] = props.series.map((s, i) => ({
    name: s.name,
    data: s.data,
    color: s.color ?? PALETTE[i % PALETTE.length],
    area: s.area ?? i === 0,
    dashed: s.dashed,
    smooth: props.smooth
  }))
  return buildLineOption({
    x: props.months,
    series: inputs,
    valueType: props.valueType,
    dataZoom: props.dataZoom
  })
})
</script>
