<template>
  <div ref="chartRef" class="ai-chart" :style="{ height: cssHeight }" />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { EChartsOption } from 'echarts'
import { useResizeObserver } from '@vueuse/core'
import { CHART, echarts } from '@/charts/theme'

/**
 * 图表基础容器
 * 统一处理：初始化、尺寸自适应、loading、销毁，避免每个图表重复实现
 */
const props = withDefaults(
  defineProps<{
    /** ECharts 配置（由 builders 工厂产出） */
    option: EChartsOption | null
    height?: number | string
    loading?: boolean
    /** 是否合并更新（时间序列追加场景可关闭 notMerge） */
    notMerge?: boolean
  }>(),
  { height: 300, loading: false, notMerge: true }
)

const emit = defineEmits<{
  (e: 'click', params: unknown): void
}>()

const chartRef = ref<HTMLDivElement | null>(null)
const instance = shallowRef<ReturnType<typeof echarts.init> | null>(null)

const cssHeight = computed(() => (typeof props.height === 'number' ? `${props.height}px` : props.height))

function render(): void {
  if (!instance.value || !props.option) return
  instance.value.setOption(props.option, props.notMerge)
}

function toggleLoading(): void {
  if (!instance.value) return
  if (props.loading) {
    instance.value.showLoading('default', {
      text: '数据加载中',
      color: CHART.text,
      textColor: CHART.label,
      maskColor: 'rgba(11,15,22,0.55)',
      fontSize: 12,
      spinnerRadius: 8,
      lineWidth: 2
    })
  } else {
    instance.value.hideLoading()
  }
}

onMounted(() => {
  if (!chartRef.value) return
  instance.value = echarts.init(chartRef.value, undefined, { renderer: 'canvas' })
  instance.value.on('click', (params: unknown) => emit('click', params))
  render()
  toggleLoading()
})

onBeforeUnmount(() => {
  instance.value?.dispose()
  instance.value = null
})

watch(() => props.option, render, { deep: false })
watch(() => props.loading, toggleLoading)
watch(cssHeight, () => instance.value?.resize())

// 容器尺寸变化时自适应（侧边栏折叠、窗口缩放）
useResizeObserver(chartRef, () => instance.value?.resize())

defineExpose({
  resize: () => instance.value?.resize(),
  getInstance: () => instance.value
})
</script>
