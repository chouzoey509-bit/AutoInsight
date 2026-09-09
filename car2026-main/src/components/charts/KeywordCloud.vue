<template>
  <div class="keyword-cloud">
    <transition-group name="cloud">
      <button
        v-for="item in displayItems"
        :key="item.word"
        type="button"
        class="keyword-cloud__item"
        :class="`is-${item.sentiment}`"
        :style="itemStyle(item)"
        @click="emit('select', item)"
      >
        {{ item.word }}
        <em class="ai-num">{{ item.count }}</em>
      </button>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { KeywordItem } from '@/types'

/**
 * 关键词云（DOM 实现）
 * 不引入第三方词云库，避免额外依赖；字号按频次插值，布局使用 flex 流式排布
 */
const props = withDefaults(
  defineProps<{
    data: KeywordItem[]
    limit?: number
  }>(),
  { limit: 40 }
)

const emit = defineEmits<{ (e: 'select', item: KeywordItem): void }>()

const displayItems = computed(() => {
  const list = [...props.data].sort((a, b) => b.count - a.count).slice(0, props.limit)
  // 打散排序，避免同情感词连续堆叠
  return list.sort((a, b) => (a.word.length % 3) - (b.word.length % 3))
})

const max = computed(() => Math.max(...props.data.map((d) => d.count), 1))
const min = computed(() => Math.min(...props.data.map((d) => d.count), 0))

function itemStyle(item: KeywordItem): Record<string, string> {
  const ratio = (item.count - min.value) / Math.max(1, max.value - min.value)
  const size = 12 + ratio * 16
  const opacity = 0.62 + ratio * 0.38
  return {
    fontSize: `${size.toFixed(1)}px`,
    opacity: opacity.toFixed(2),
    animationDelay: `${(item.word.length % 8) * 60}ms`
  }
}
</script>

<style scoped lang="scss">
.keyword-cloud {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px 16px;
  padding: var(--ai-space-5);
  min-height: 220px;
}

.keyword-cloud__item {
  position: relative;
  padding: 2px 4px;
  border: 0;
  background: transparent;
  color: var(--ai-text-1);
  font-weight: var(--ai-fw-medium);
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: transform var(--ai-duration-base) var(--ai-ease), color var(--ai-duration-base) var(--ai-ease);
  animation: ai-fade-up var(--ai-duration-slow) var(--ai-ease) both;

  em {
    margin-left: 4px;
    font-size: 10px;
    font-style: normal;
    color: var(--ai-text-4);
  }

  &:hover {
    transform: translateY(-2px) scale(1.04);
  }

  &.is-positive { color: #6fe3c0; }
  &.is-negative { color: #ff8a82; }
  &.is-neutral { color: var(--ai-text-2); }
}
</style>
