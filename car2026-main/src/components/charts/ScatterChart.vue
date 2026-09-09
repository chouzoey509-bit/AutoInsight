<template>
  <BaseChart :option="option" :height="height" :loading="loading" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'
import { buildScatterOption } from '@/charts/builders'
import { ENERGY_COLOR, ENERGY_LABEL } from '@/constants'
import type { CarScatterItem, EnergyType } from '@/types'

/** 价格—销量气泡散点图（气泡大小表示用户评分） */
const props = withDefaults(
  defineProps<{
    data: CarScatterItem[]
    height?: number | string
    loading?: boolean
  }>(),
  { height: 320, loading: false }
)

const option = computed<EChartsOption>(() => {
  const groups = new Map<string, [number, number, number, string][]>()
  for (const item of props.data) {
    const list = groups.get(item.energyType) ?? []
    list.push([item.price, item.sales, item.rating, `${item.brand} ${item.name}`])
    groups.set(item.energyType, list)
  }

  const colorOf = (label: string): string => {
    const entry = (Object.entries(ENERGY_LABEL) as [EnergyType, string][]).find(([, v]) => v === label)
    return entry ? ENERGY_COLOR[entry[0]] : '#2e7cf6'
  }

  return buildScatterOption({
    groups: Array.from(groups.entries()).map(([name, data]) => ({
      name,
      data,
      color: colorOf(name)
    }))
  })
})
</script>
