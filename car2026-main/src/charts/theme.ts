import * as echarts from 'echarts/core'
import { BarChart, GaugeChart, LineChart, MapChart, PieChart, RadarChart, ScatterChart } from 'echarts/charts'
import type { BarSeriesOption, LineSeriesOption, PieSeriesOption, RadarSeriesOption } from 'echarts/charts'
import {
  DatasetComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  DataZoomComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import chinaGeo from '@/assets/geo/china.json'

/**
 * ECharts 按需注册 + 主题常量
 * 所有图表风格统一从这里取值，避免在组件里写裸色值
 */

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  RadarChart,
  MapChart,
  ScatterChart,
  GaugeChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  VisualMapComponent,
  DatasetComponent,
  MarkLineComponent,
  MarkPointComponent,
  MarkAreaComponent,
  GraphicComponent,
  DataZoomComponent,
  CanvasRenderer
])

/** 中国地图注册（数据源：DataV 官方省级行政区划，含台湾省、香港、澳门、南海诸岛） */
export const CHINA_MAP_NAME = 'china'
try {
  echarts.registerMap(CHINA_MAP_NAME, chinaGeo as never)
} catch {
  // 重复注册忽略
}

export { echarts }
export type { BarSeriesOption, LineSeriesOption, PieSeriesOption, RadarSeriesOption }

/** 图表色板（UI V2 黑白单色系，与 tokens --ai-chart-* 一致） */
export const PALETTE = [
  '#111111',
  '#5f5f5b',
  '#85857f',
  '#a3a39d',
  '#c2c2bc',
  '#444440',
  '#70706b',
  '#9b9b95'
]

export const CHART = {
  text: '#111111',
  textSecondary: '#3f3f3c',
  label: '#7a7a75',
  axis: '#d7d7d3',
  split: '#ecece9',
  tooltipBg: 'rgba(17,17,17,0.96)',
  tooltipBorder: 'rgba(255,255,255,0.14)',
  up: '#3f3f3a',
  down: '#64645f'
} as const

/** 通用 tooltip */
export const tooltipBase = {
  backgroundColor: CHART.tooltipBg,
  borderColor: CHART.tooltipBorder,
  borderWidth: 1,
  padding: [10, 12] as [number, number],
  textStyle: { color: '#ffffff', fontSize: 12 },
  extraCssText: 'border-radius: 2px;'
} as const

/** 通用 legend */
export const legendBase = {
  icon: 'roundRect',
  itemWidth: 10,
  itemHeight: 10,
  itemGap: 16,
  top: 0,
  right: 0,
  textStyle: { color: CHART.textSecondary, fontSize: 12 }
} as const

/** 坐标轴通用样式 */
export const axisBase = {
  axisLine: { lineStyle: { color: CHART.axis } },
  axisTick: { show: false },
  axisLabel: { color: CHART.label, fontSize: 11 },
  splitLine: { lineStyle: { color: CHART.split } }
} as const

/** 面积渐变 */
export function areaGradient(color: string, from = 0.28, to = 0.02) {
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: withAlpha(color, from) },
    { offset: 1, color: withAlpha(color, to) }
  ])
}

/** 横向渐变（柱状图） */
export function linearGradient(color: string, toColor?: string) {
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color },
    { offset: 1, color: toColor ?? withAlpha(color, 0.25) }
  ])
}

/** hex → rgba */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** 数值轴标签格式化：万 / 亿 */
export function compactAxisLabel(value: number): string {
  if (Math.abs(value) >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}亿`
  if (Math.abs(value) >= 10_000) return `${(value / 10_000).toFixed(value % 10000 === 0 ? 0 : 1)}万`
  return String(value)
}
