<template>
  <div class="loading-state" :style="{ height: cssHeight }">
    <template v-if="variant === 'chart'">
      <div class="loading-state__chart">
        <div
          v-for="i in 4"
          :key="i"
          class="ai-skeleton loading-state__bar"
          :style="{ height: `${30 + ((i * 37) % 55)}%`, animationDelay: `${i * 90}ms` }"
        />
      </div>
    </template>

    <template v-else-if="variant === 'table'">
      <div v-for="row in rows" :key="row" class="loading-state__row">
        <div
          v-for="col in columns"
          :key="col"
          class="ai-skeleton loading-state__cell"
          :style="{ width: `${60 + ((row * col * 23) % 40)}%`, animationDelay: `${(row * columns + col) * 40}ms` }"
        />
      </div>
    </template>

    <template v-else-if="variant === 'metric'">
      <div class="ai-skeleton loading-state__line" style="width: 42%" />
      <div class="ai-skeleton loading-state__line loading-state__line--lg" style="width: 68%" />
      <div class="ai-skeleton loading-state__line" style="width: 34%" />
    </template>

    <template v-else>
      <div v-for="row in rows" :key="row" class="ai-skeleton loading-state__line" :style="{ width: `${70 + ((row * 17) % 30)}%` }" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/** 骨架屏：表格 / 图表 / 指标卡 / 文本 */
const props = withDefaults(
  defineProps<{
    variant?: 'table' | 'chart' | 'metric' | 'text'
    rows?: number
    columns?: number
    height?: number | string
  }>(),
  { variant: 'text', rows: 5, columns: 6, height: 'auto' }
)

const cssHeight = computed(() => {
  if (typeof props.height === 'number') return `${props.height}px`
  return props.height === 'auto' ? 'auto' : props.height
})
</script>

<style scoped lang="scss">
.loading-state {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding: var(--ai-space-2) 0;
}

.loading-state__row {
  display: flex;
  gap: 16px;
  align-items: center;
}

.loading-state__cell {
  flex: 1;
  height: 12px;
}

.loading-state__line {
  height: 12px;
}

.loading-state__line--lg { height: 26px; }

.loading-state__chart {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 100%;
  min-height: 160px;
  padding: 0 var(--ai-space-2);
}

.loading-state__bar {
  flex: 1;
  border-radius: var(--ai-radius-sm) var(--ai-radius-sm) 0 0;
}
</style>
