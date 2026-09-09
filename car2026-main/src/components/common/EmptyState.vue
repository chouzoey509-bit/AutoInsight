<template>
  <div class="ai-state" :class="{ 'ai-state--compact': compact }">
    <div class="ai-state__icon">
      <el-icon :size="compact ? 18 : 22"><component :is="iconComponent" /></el-icon>
    </div>
    <p class="ai-state__title">{{ title }}</p>
    <p v-if="description" class="ai-state__desc">{{ description }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DocumentDelete } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    icon?: unknown
    compact?: boolean
  }>(),
  { title: '暂无数据', compact: false }
)

const iconComponent = computed(() => props.icon ?? DocumentDelete)
</script>

<style scoped lang="scss">
.ai-state--compact {
  min-height: 180px;
  padding: var(--ai-space-5);
}
</style>
