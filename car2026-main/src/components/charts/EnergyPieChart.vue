<template>
  <BaseChart :option="option" :height="height" :loading="loading" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'
import { buildPieOption } from '@/charts/builders'
import type { ProportionItem } from '@/types'

/** 能源类型 / 占比类环形图 */
const props = withDefaults(
  defineProps<{
    data: ProportionItem[]
    height?: number | string
    loading?: boolean
    colors?: string[]
    donut?: boolean
    unit?: string
  }>(),
  { height: 280, loading: false, donut: true, unit: '' }
)

const option = computed<EChartsOption>(() =>
  buildPieOption({
    data: props.data.map((d) => ({ name: d.name, value: d.value })),
    donut: props.donut,
    colors: props.colors,
    unit: props.unit
  })
)
</script>
