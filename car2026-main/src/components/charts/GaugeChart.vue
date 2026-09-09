<template>
  <BaseChart :option="option" :height="height" :loading="loading" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'
import { buildGaugeOption } from '@/charts/builders'
import { PALETTE } from '@/charts/theme'

/** 仪表盘：新能源渗透率、模型准确率等 */
const props = withDefaults(
  defineProps<{
    value: number
    max?: number
    name?: string
    color?: string
    height?: number | string
    loading?: boolean
  }>(),
  { max: 100, name: '', color: PALETTE[1], height: 220, loading: false }
)

const option = computed<EChartsOption>(() =>
  buildGaugeOption({
    value: props.value,
    max: props.max,
    name: props.name,
    color: props.color
  })
)
</script>
