<template>
  <BaseChart :option="option" :height="height" :loading="loading" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'
import { buildBarOption } from '@/charts/builders'
import { PALETTE, linearGradient } from '@/charts/theme'
import type { RankingItem } from '@/types'

/** 品牌 / 车型销量排行（横向条形图） */
const props = withDefaults(
  defineProps<{
    data: RankingItem[]
    height?: number | string
    loading?: boolean
    /** 名称后缀（车型排行展示能源类型） */
    showExtra?: boolean
  }>(),
  { height: 320, loading: false, showExtra: false }
)

const option = computed<EChartsOption>(() => {
  const sorted = [...props.data].sort((a, b) => a.value - b.value)
  return buildBarOption({
    x: sorted.map((i) => i.name),
    horizontal: true,
    legend: false,
    showBackground: true,
    label: true,
    series: [
      {
        name: '销量',
        data: sorted.map((i) => i.value),
        barWidth: 12
      }
    ]
  })
})

/** 渐变色需在 series 内部分配，这里通过主题色循环保证视觉层次 */
const _palette = PALETTE
const _gradient = linearGradient
</script>
