<template>
  <BaseChart :option="option" :height="height" :loading="loading" @click="(p) => emit('select', p)" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'
import { buildPieOption } from '@/charts/builders'

export interface SentimentSlice {
  name: string
  value: number
  color: string
}

/** 舆情情感占比环形图 */
const props = withDefaults(
  defineProps<{
    data: SentimentSlice[]
    height?: number | string
    loading?: boolean
    labelInside?: boolean
  }>(),
  { height: 260, loading: false, labelInside: false }
)

const emit = defineEmits<{ (e: 'select', params: unknown): void }>()

const option = computed<EChartsOption>(() =>
  buildPieOption({
    data: props.data.map((d) => ({ name: d.name, value: d.value })),
    colors: props.data.map((d) => d.color),
    donut: true,
    unit: '',
    labelInside: props.labelInside
  })
)
</script>
