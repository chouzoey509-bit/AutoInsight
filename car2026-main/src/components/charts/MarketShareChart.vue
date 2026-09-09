<template>
  <BaseChart :option="option" :height="height" :loading="loading" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'
import { buildLineOption, type LineSeriesInput } from '@/charts/builders'
import { PALETTE } from '@/charts/theme'
import type { MultiSeries } from '@/types'

/** 市场份额趋势（堆叠面积，单位 %） */
const props = withDefaults(
  defineProps<{
    data: MultiSeries
    height?: number | string
    loading?: boolean
  }>(),
  { height: 320, loading: false }
)

const option = computed<EChartsOption>(() => {
  const series: LineSeriesInput[] = props.data.series.map((s, i) => ({
    name: s.name,
    data: s.data,
    color: PALETTE[i % PALETTE.length],
    area: true,
    smooth: true
  }))
  return buildLineOption({
    x: props.data.months,
    series,
    valueType: 'percent',
    legend: true
  })
})
</script>
