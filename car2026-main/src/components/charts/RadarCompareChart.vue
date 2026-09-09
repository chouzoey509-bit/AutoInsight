<template>
  <BaseChart :option="option" :height="height" :loading="loading" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'
import { buildRadarOption } from '@/charts/builders'
import { PALETTE } from '@/charts/theme'

/** 车型对比雷达图 */
const props = withDefaults(
  defineProps<{
    indicators: { name: string; max?: number }[]
    series: { name: string; value: number[]; color?: string }[]
    height?: number | string
    loading?: boolean
    max?: number
  }>(),
  { height: 340, loading: false, max: 100 }
)

const option = computed<EChartsOption>(() =>
  buildRadarOption({
    indicators: props.indicators,
    max: props.max,
    series: props.series.map((s, i) => ({
      name: s.name,
      value: s.value,
      color: s.color ?? PALETTE[i % PALETTE.length]
    }))
  })
)
</script>
