import type { EChartsOption } from 'echarts'
import type { PredictPoint, RegionSalesItem, SeriesPoint } from '@/types'
import {
  CHART,
  CHINA_MAP_NAME,
  PALETTE,
  areaGradient,
  axisBase,
  compactAxisLabel,
  legendBase,
  linearGradient,
  tooltipBase,
  withAlpha
} from './theme'

/**
 * 图表配置工厂
 * ------------------------------------------------------------
 * 页面与图表组件只描述数据，视觉规范统一收敛在这里，
 * 保证全站图表风格一致、可维护。
 */

export interface LineSeriesInput {
  name: string
  data: number[]
  color?: string
  /** 是否填充面积 */
  area?: boolean
  smooth?: boolean
  /** 虚线（用于预测数据） */
  dashed?: boolean
  yAxisIndex?: number
  symbol?: 'circle' | 'none' | 'emptyCircle'
  showSymbol?: boolean
}

export interface LineOptionInput {
  x: string[]
  series: LineSeriesInput[]
  /** y 轴名称 */
  yName?: string[]
  /** 数值格式化：'compact' | 'percent' */
  valueType?: 'compact' | 'percent' | 'plain'
  legend?: boolean
  dataZoom?: boolean
  grid?: Record<string, number | string>
  tooltipTrigger?: 'axis' | 'item'
}

export function buildLineOption(input: LineOptionInput): EChartsOption {
  const { x, series, yName, valueType = 'compact', legend = true, dataZoom = false } = input
  const yAxis = (yName ?? ['']).map((name, i) => ({
    type: 'value' as const,
    name,
    nameTextStyle: { color: CHART.label, fontSize: 11, align: 'left' as const },
    ...axisBase,
    axisLabel: {
      ...axisBase.axisLabel,
      formatter: (v: number) => (valueType === 'percent' ? `${v}%` : valueType === 'compact' ? compactAxisLabel(v) : String(v))
    },
    splitLine: i === 0 ? axisBase.splitLine : { show: false }
  }))

  return {
    color: series.map((s) => s.color).filter(Boolean) as string[],
    tooltip: {
      ...tooltipBase,
      trigger: input.tooltipTrigger ?? 'axis',
      axisPointer: { type: 'line', lineStyle: { color: CHART.axis } },
      valueFormatter: (v) =>
        valueType === 'percent' ? `${Number(v).toFixed(1)}%` : Number(v).toLocaleString('zh-CN')
    },
    legend: legend
      ? { ...legendBase, data: series.map((s) => s.name), type: 'scroll' }
      : undefined,
    grid: { left: 8, right: 12, top: legend ? 34 : 16, bottom: dataZoom ? 44 : 8, containLabel: true, ...input.grid },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: x,
      ...axisBase,
      splitLine: { show: false }
    },
    yAxis,
    dataZoom: dataZoom
      ? [
          { type: 'inside', start: 0, end: 100 },
          {
            type: 'slider',
            height: 18,
            bottom: 8,
            borderColor: 'transparent',
            backgroundColor: 'rgba(255,255,255,0.03)',
            fillerColor: withAlpha(PALETTE[0], 0.12),
            handleStyle: { color: PALETTE[0] },
            textStyle: { color: CHART.label, fontSize: 10 }
          }
        ]
      : undefined,
    series: series.map((s) => ({
      name: s.name,
      type: 'line' as const,
      smooth: s.smooth ?? true,
      symbol: s.symbol ?? 'circle',
      symbolSize: 6,
      showSymbol: s.showSymbol ?? false,
      lineStyle: {
        width: 2,
        color: s.color,
        type: s.dashed ? ('dashed' as const) : ('solid' as const)
      },
      itemStyle: { color: s.color },
      emphasis: { focus: 'series' as const },
      areaStyle: s.area ? { color: areaGradient(s.color ?? PALETTE[0]) } : undefined,
      data: s.data,
      yAxisIndex: s.yAxisIndex ?? 0
    }))
  }
}

export interface BarSeriesInput {
  name: string
  data: number[]
  color?: string
  stack?: string
  barWidth?: number | string
}

export function buildBarOption(input: {
  x: string[]
  series: BarSeriesInput[]
  horizontal?: boolean
  valueType?: 'compact' | 'percent' | 'plain'
  legend?: boolean
  grid?: Record<string, number | string>
  showBackground?: boolean
  label?: boolean
}): EChartsOption {
  const { x, series, horizontal = false, valueType = 'compact', legend = true } = input
  const categoryAxis = {
    type: 'category' as const,
    data: x,
    ...axisBase,
    splitLine: { show: false },
    axisLabel: { ...axisBase.axisLabel, interval: 0 }
  }
  const valueAxis = {
    type: 'value' as const,
    ...axisBase,
    axisLabel: {
      ...axisBase.axisLabel,
      formatter: (v: number) => (valueType === 'percent' ? `${v}%` : valueType === 'compact' ? compactAxisLabel(v) : String(v))
    }
  }

  return {
    tooltip: {
      ...tooltipBase,
      trigger: horizontal ? 'item' : 'axis',
      axisPointer: { type: 'shadow' as const },
      valueFormatter: (v) =>
        valueType === 'percent' ? `${Number(v).toFixed(1)}%` : Number(v).toLocaleString('zh-CN')
    },
    legend: legend ? { ...legendBase, data: series.map((s) => s.name) } : undefined,
    grid: {
      left: 8,
      right: 20,
      top: legend ? 34 : 16,
      bottom: 8,
      containLabel: true,
      ...input.grid
    },
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? categoryAxis : valueAxis,
    series: series.map((s) => ({
      name: s.name,
      type: 'bar' as const,
      barWidth: s.barWidth ?? (series.length > 2 ? 10 : 16),
      barGap: '30%',
      stack: s.stack,
      showBackground: input.showBackground ?? false,
      backgroundStyle: { color: '#f1f1ef', borderRadius: 2 },
      itemStyle: {
        borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
        color: s.color
          ? horizontal
            ? linearGradient(s.color, withAlpha(s.color, 0.55))
            : linearGradient(s.color, withAlpha(s.color, 0.28))
          : undefined
      },
      label: input.label
        ? {
            show: true,
            position: horizontal ? 'right' : 'top',
            color: CHART.textSecondary,
            fontSize: 11,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter: (p: any) => {
              const value = Number(p?.value) || 0
              return valueType === 'percent' ? `${value}%` : compactAxisLabel(value)
            }
          }
        : undefined,
      emphasis: { focus: 'series' as const },
      data: s.data
    }))
  }
}

export function buildPieOption(input: {
  data: { name: string; value: number }[]
  /** 环形内径，如 ['48%','70%'] */
  donut?: boolean
  roseType?: boolean
  colors?: string[]
  unit?: string
  center?: [string, string]
  legend?: boolean
  labelInside?: boolean
}): EChartsOption {
  const { data, donut = true, roseType = false, unit = '', legend = true } = input
  return {
    color: input.colors ?? PALETTE,
    tooltip: {
      ...tooltipBase,
      trigger: 'item',
      formatter: (p: unknown) => {
        const item = p as { name: string; value: number; percent?: number }
        return `${item.name}<br/>${unit}${Number(item.value).toLocaleString('zh-CN')}（${item.percent?.toFixed(1) ?? '--'}%）`
      }
    },
    legend: legend
      ? {
          ...legendBase,
          type: 'scroll',
          orient: 'vertical',
          right: 0,
          top: 'center',
          itemGap: 12,
          formatter: (name: string) => name
        }
      : undefined,
    series: [
      {
        type: 'pie',
        radius: donut ? ['52%', '74%'] : '68%',
        center: input.center ?? (legend ? ['38%', '52%'] : ['50%', '52%']),
        roseType: roseType ? 'radius' : undefined,
        avoidLabelOverlap: true,
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 2,
          borderRadius: 2
        },
        label: input.labelInside
          ? { show: true, position: 'inside', color: '#fff', fontSize: 11, formatter: '{d}%' }
          : {
              show: true,
              color: CHART.textSecondary,
              fontSize: 11,
              formatter: '{b} {d}%'
            },
        labelLine: { show: !input.labelInside, length: 8, length2: 10, lineStyle: { color: CHART.axis } },
        emphasis: {
          scale: true,
          scaleSize: 6,
          label: { color: CHART.text, fontSize: 12, fontWeight: 500 }
        },
        data
      }
    ]
  }
}

export function buildRadarOption(input: {
  indicators: { name: string; max?: number }[]
  series: { name: string; value: number[]; color: string }[]
  max?: number
}): EChartsOption {
  return {
    color: input.series.map((s) => s.color),
    tooltip: { ...tooltipBase, trigger: 'item' },
    legend: { ...legendBase, bottom: 0, top: 'auto', data: input.series.map((s) => s.name) },
    radar: {
      indicator: input.indicators.map((i) => ({ name: i.name, max: i.max ?? input.max ?? 100 })),
      center: ['50%', '48%'],
      radius: '62%',
      splitNumber: 4,
      axisName: { color: CHART.textSecondary, fontSize: 11 },
      axisLine: { lineStyle: { color: CHART.axis } },
      splitLine: { lineStyle: { color: CHART.split } },
      splitArea: {
        areaStyle: { color: ['transparent', 'rgba(17,17,17,0.02)'] }
      }
    },
    series: [
      {
        type: 'radar',
        symbolSize: 5,
        data: input.series.map((s) => ({
          name: s.name,
          value: s.value,
          lineStyle: { width: 2, color: s.color },
          itemStyle: { color: s.color },
          areaStyle: { color: withAlpha(s.color, 0.16) }
        }))
      }
    ]
  }
}

export function buildMapOption(input: { data: RegionSalesItem[]; unit?: string }): EChartsOption {
  const values = input.data.map((d) => d.value)
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'item',
      formatter: (p: unknown) => {
        const item = p as { name: string; value?: number; data?: RegionSalesItem }
        if (!Number.isFinite(item.value)) return `${item.name}<br/>暂无数据`
        const d = item.data
        return [
          `<div style="font-weight:600;margin-bottom:4px">${item.name}</div>`,
          `销量：${Number(item.value).toLocaleString('zh-CN')} 辆`,
          d?.penetration ? `新能源渗透率：${d.penetration}%` : '',
          d?.yoy ? `同比：${d.yoy > 0 ? '+' : ''}${d.yoy}%` : ''
        ]
          .filter(Boolean)
          .join('<br/>')
      }
    },
    visualMap: {
      min,
      max,
      left: 16,
      bottom: 20,
      calculable: true,
      orient: 'vertical',
      itemWidth: 10,
      itemHeight: 80,
      textStyle: { color: CHART.label, fontSize: 10 },
      inRange: {
        color: ['#ededeb', '#c2c2bc', '#a3a39d', '#70706b', '#111111']
      }
    },
    series: [
      {
        type: 'map',
        map: CHINA_MAP_NAME,
        roam: true,
        zoom: 1.18,
        center: [104.5, 35.5],
        itemStyle: {
          areaColor: '#f1f1ef',
          borderColor: '#ffffff',
          borderWidth: 0.8
        },
        emphasis: {
          label: { show: true, color: '#fff', fontSize: 11 },
          itemStyle: { areaColor: '#111111', borderColor: '#ffffff' }
        },
        select: { disabled: true },
        data: input.data.map((d) => ({ ...d }))
      }
    ]
  }
}

export function buildGaugeOption(input: {
  value: number
  max?: number
  name?: string
  color?: string
}): EChartsOption {
  const max = input.max ?? 100
  const color = input.color ?? PALETTE[1]
  return {
    series: [
      {
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max,
        radius: '92%',
        center: ['50%', '58%'],
        progress: { show: true, width: 10, itemStyle: { color } },
        axisLine: {
          lineStyle: { width: 10, color: [[1, '#ecece9']] }
        },
        axisTick: { distance: -14, length: 4, lineStyle: { color: CHART.axis, width: 1 } },
        splitLine: { distance: -16, length: 8, lineStyle: { color: CHART.axis, width: 1.5 } },
        axisLabel: { distance: 14, color: CHART.label, fontSize: 10 },
        pointer: { icon: 'triangle', width: 8, length: '58%', offsetCenter: [0, '8%'], itemStyle: { color } },
        anchor: { show: true, size: 10, itemStyle: { color, borderColor: '#ffffff', borderWidth: 2 } },
        title: { show: true, offsetCenter: [0, '76%'], color: CHART.label, fontSize: 11 },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '38%'],
          fontSize: 24,
          fontWeight: 600,
          color: CHART.text,
          formatter: (v: number) => `${v.toFixed(1)}%`
        },
        data: [{ value: input.value, name: input.name ?? '' }]
      }
    ]
  }
}

export function buildScatterOption(input: {
  groups: { name: string; data: [number, number, number, string][]; color: string }[]
  xName?: string
  yName?: string
}): EChartsOption {
  return {
    color: input.groups.map((g) => g.color),
    tooltip: {
      ...tooltipBase,
      trigger: 'item',
      formatter: (p: unknown) => {
        const item = p as { data: [number, number, number, string]; seriesName: string; color: string }
        return `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${item.color};margin-right:6px"></span>${item.seriesName}<br/>${item.data[3]}<br/>价格：${item.data[0]} 万元<br/>年销量：${item.data[1].toLocaleString('zh-CN')} 辆<br/>评分：${item.data[2]}`
      }
    },
    legend: { ...legendBase, data: input.groups.map((g) => g.name), type: 'scroll' },
    grid: { left: 8, right: 20, top: 34, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      name: input.xName ?? '指导价（万元）',
      nameTextStyle: { color: CHART.label, fontSize: 11 },
      ...axisBase
    },
    yAxis: {
      type: 'value',
      name: input.yName ?? '年销量（辆）',
      nameTextStyle: { color: CHART.label, fontSize: 11 },
      ...axisBase,
      axisLabel: { ...axisBase.axisLabel, formatter: (v: number) => compactAxisLabel(v) }
    },
    series: input.groups.map((g) => ({
      name: g.name,
      type: 'scatter' as const,
      symbolSize: (data: number[]) => Math.max(6, Math.min(20, (data[2] - 3.5) * 18)),
      itemStyle: {
        color: withAlpha(g.color, 0.72),
        borderColor: g.color,
        borderWidth: 1
      },
      emphasis: { focus: 'series' as const, itemStyle: { color: g.color } },
      data: g.data
    }))
  }
}

/** 销量预测：历史实线 + 预测虚线 + 置信区间 */
export function buildPredictOption(input: {
  history: SeriesPoint[]
  prediction: PredictPoint[]
  historyName?: string
  predictName?: string
}): EChartsOption {
  const x = [...input.history.map((h) => h.month), ...input.prediction.map((p) => p.month)]
  const historyData: (number | null)[] = [
    ...input.history.map((h) => h.value),
    ...input.prediction.map(() => null as null)
  ]
  const predictData: (number | null)[] = [
    ...input.history.map(() => null as null),
    ...input.prediction.map((p) => p.value)
  ]
  // 预测线与历史线首尾相接，避免断点
  if (input.history.length && input.prediction.length) {
    historyData[input.history.length - 1] = input.history[input.history.length - 1].value
    predictData[input.history.length - 1] = input.history[input.history.length - 1].value
  }
  const lower = input.prediction.map((p) => p.lower ?? p.value)
  const upper = input.prediction.map((p) => p.upper ?? p.value)

  return {
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: CHART.axis } },
      valueFormatter: (v) => (v === null || v === undefined ? '--' : Number(v).toLocaleString('zh-CN'))
    },
    legend: {
      ...legendBase,
      data: [input.historyName ?? '历史销量', input.predictName ?? '预测销量', '置信区间']
    },
    grid: { left: 8, right: 12, top: 40, bottom: 8, containLabel: true },
    xAxis: { type: 'category', data: x, boundaryGap: false, ...axisBase, splitLine: { show: false } },
    yAxis: {
      type: 'value',
      ...axisBase,
      axisLabel: { ...axisBase.axisLabel, formatter: (v: number) => compactAxisLabel(v) }
    },
    series: [
      {
        name: '置信区间',
        type: 'line',
        data: [...input.history.map((): null => null), ...upper] as (number | null)[],
        lineStyle: { opacity: 0 },
        stack: 'band',
        symbol: 'none',
        showSymbol: false,
        tooltip: { show: false },
        silent: true,
        z: 1
      },
      {
        name: '置信区间',
        type: 'line',
        data: [...input.history.map((): null => null), ...lower] as (number | null)[],
        lineStyle: { opacity: 0 },
        areaStyle: { color: withAlpha(PALETTE[1], 0.14) },
        stack: 'band',
        symbol: 'none',
        showSymbol: false,
        tooltip: { show: false },
        silent: true,
        z: 1
      },
      {
        name: input.historyName ?? '历史销量',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2.4, color: PALETTE[0] },
        itemStyle: { color: PALETTE[0] },
        areaStyle: { color: areaGradient(PALETTE[0], 0.18, 0.01) },
        data: historyData,
        z: 3
      },
      {
        name: input.predictName ?? '预测销量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.4, color: PALETTE[1], type: 'dashed' },
        itemStyle: { color: PALETTE[1] },
        data: predictData,
        z: 4,
        markLine: {
          silent: true,
          symbol: 'none',
          label: { show: false },
          lineStyle: { color: CHART.axis, type: 'dashed' },
          data: input.history.length ? [{ xAxis: input.history.length - 1 }] : []
        }
      }
    ]
  }
}

/** 仪表盘式小型环形进度（品牌份额等场景） */
export function buildProgressRingOption(input: {
  value: number
  color?: string
  name?: string
}): EChartsOption {
  const color = input.color ?? PALETTE[0]
  return {
    series: [
      {
        type: 'pie',
        radius: ['78%', '92%'],
        center: ['50%', '50%'],
        silent: true,
        label: { show: false },
        data: [
          { value: input.value, itemStyle: { color } },
          { value: 100 - input.value, itemStyle: { color: '#ecece9' } }
        ]
      }
    ]
  }
}
