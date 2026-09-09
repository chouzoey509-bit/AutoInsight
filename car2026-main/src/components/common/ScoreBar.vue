<template>
  <div class="score-bar">
    <div class="score-bar__head">
      <span class="score-bar__label">{{ label }}</span>
      <span class="score-bar__value ai-num">{{ displayValue }}</span>
    </div>
    <div class="ai-bar">
      <div class="ai-bar__fill" :style="{ width: `${clamped}%`, background: barColor }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PALETTE, withAlpha } from '@/charts/theme'

/** 评分条：用于推荐解释、车型对比、参数打分 */
const props = withDefaults(
  defineProps<{
    label: string
    /** 0~100 */
    score: number
    max?: number
    suffix?: string
    color?: string
    /** 是否显示原始数值 */
    showValue?: boolean
  }>(),
  { max: 100, suffix: '', color: '', showValue: true }
)

const clamped = computed(() => Math.max(0, Math.min(100, (props.score / props.max) * 100)))
const barColor = computed(() =>
  props.color
    ? `linear-gradient(90deg, ${props.color}, ${withAlpha(props.color, 0.45)})`
    : `linear-gradient(90deg, ${PALETTE[0]}, ${PALETTE[1]})`
)
const displayValue = computed(() => `${props.score.toFixed(0)}${props.suffix}`)
</script>

<style scoped lang="scss">
.score-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.score-bar__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ai-space-2);
}

.score-bar__label {
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-3);
}

.score-bar__value {
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-1);
}
</style>
