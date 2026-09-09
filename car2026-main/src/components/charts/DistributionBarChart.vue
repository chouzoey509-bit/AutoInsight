<template>
  <BaseChart :option="option" :height="height" :loading="loading" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'
import { buildBarOption } from '@/charts/builders'
import { PALETTE } from '@/charts/theme'

/** 分布柱状图：价格区间、车型类别、月度分布等 */
const props = withDefaults(
  defineProps<{
    data: { label: string; value: number }[]
    height?: number | string
    loading?: boolean
    horizontal?: boolean
    color?: string
    valueType?: 'compact' | 'percent' | 'plain'
  }>(),
  { height: 280, loading: false, horizontal: false, valueType: 'compact' }
)

const option = computed<EChartsOption>(() =>
  buildBarOption({
    x: props.data.map((d) => d.label),
    horizontal: props.horizontal,
    legend: false,
    showBackground: true,
    label: !props.horizontal,
    valueType: props.valueType,
    series: [
      {
        name: '销量',
        data: props.data.map((d) => d.value),
        color: props.color ?? PALETTE[0],
        barWidth: props.horizontal ? 12 : 22
      }
    ]
  })
)
</script>
