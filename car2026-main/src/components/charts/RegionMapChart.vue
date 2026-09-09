<template>
  <BaseChart :option="option" :height="height" :loading="loading" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'
import { buildMapOption } from '@/charts/builders'
import type { RegionSalesItem } from '@/types'

/**
 * 地区销量地图
 * 地图数据：DataV 官方省级行政区划（含台湾省、香港特别行政区、澳门特别行政区、南海诸岛）
 */
const props = withDefaults(
  defineProps<{
    data: RegionSalesItem[]
    height?: number | string
    loading?: boolean
  }>(),
  { height: 460, loading: false }
)

const option = computed<EChartsOption>(() => buildMapOption({ data: props.data }))
</script>
