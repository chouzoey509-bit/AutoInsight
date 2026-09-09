<template>
  <div class="predict-card ai-panel ai-panel--hoverable">
    <header class="predict-card__head">
      <span class="predict-card__label">{{ label }}</span>
      <span class="predict-card__icon" :style="{ color, background: iconBg }">
        <el-icon :size="14"><component :is="iconComponent" /></el-icon>
      </span>
    </header>

    <div class="predict-card__value">
      <span class="ai-metric">{{ value }}</span>
      <span v-if="unit" class="ai-metric__unit">{{ unit }}</span>
    </div>

    <footer class="predict-card__foot">
      <span v-if="hint" class="predict-card__hint">{{ hint }}</span>
      <slot name="extra" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TrendCharts } from '@element-plus/icons-vue'
import { PALETTE, withAlpha } from '@/charts/theme'

/** 预测摘要卡：增长率 / 峰值月 / 模型准确率等 */
const props = withDefaults(
  defineProps<{
    label: string
    value: string | number
    unit?: string
    hint?: string
    tone?: 'brand' | 'nev' | 'warn' | 'danger' | 'purple'
    icon?: unknown
  }>(),
  { tone: 'brand' }
)

const iconComponent = computed(() => props.icon ?? TrendCharts)

const TONE: Record<string, string> = {
  brand: PALETTE[0],
  nev: PALETTE[1],
  warn: PALETTE[2],
  danger: PALETTE[5],
  purple: PALETTE[3]
}

const color = computed(() => TONE[props.tone] ?? PALETTE[0])
const iconBg = computed(() => withAlpha(color.value, 0.12))
</script>

<style scoped lang="scss">
.predict-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: var(--ai-space-4) var(--ai-space-5);
  min-width: 0;
}

.predict-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ai-space-2);
}

.predict-card__label {
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-3);
}

.predict-card__icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: var(--ai-radius-sm);
}

.predict-card__value {
  display: flex;
  align-items: baseline;
  line-height: 1;
}

.predict-card__hint {
  font-size: var(--ai-fs-mini);
  color: var(--ai-text-4);
}
</style>
