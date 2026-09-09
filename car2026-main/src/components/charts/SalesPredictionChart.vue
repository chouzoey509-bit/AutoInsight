<template>
  <BaseChart :option="option" :height="height" :loading="loading" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'
import { buildPredictOption } from '@/charts/builders'
import type { PredictPoint, SeriesPoint } from '@/types'

/** 销量预测：历史实线 + 预测虚线 + 置信区间 */
const props = withDefaults(
  defineProps<{
    history: SeriesPoint[]
    prediction: PredictPoint[]
    height?: number | string
    loading?: boolean
  }>(),
  { height: 380, loading: false }
)

const option = computed<EChartsOption>(() =>
  buildPredictOption({
    history: props.history,
    prediction: props.prediction
  })
)
</script>
