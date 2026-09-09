<template>
  <div class="ai-state" :class="{ 'ai-state--compact': compact }">
    <div class="ai-state__icon ai-state__icon--danger">
      <el-icon :size="compact ? 18 : 22"><WarningFilled /></el-icon>
    </div>
    <p class="ai-state__title">{{ message || '数据加载失败，请稍后重试' }}</p>
    <p v-if="description" class="ai-state__desc">{{ description }}</p>
    <el-button v-if="retryable" size="small" type="primary" plain @click="emit('retry')">
      <el-icon><Refresh /></el-icon>
      <span style="margin-left: 4px">重新加载</span>
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { Refresh, WarningFilled } from '@element-plus/icons-vue'

withDefaults(
  defineProps<{
    message?: string
    description?: string
    compact?: boolean
    retryable?: boolean
  }>(),
  { compact: false, retryable: true }
)

const emit = defineEmits<{ (e: 'retry'): void }>()
</script>

<style scoped lang="scss">
.ai-state__icon--danger {
  color: var(--ai-danger);
  border-color: rgba(245, 84, 75, 0.28);
  background: var(--ai-danger-soft);
}

.ai-state--compact {
  min-height: 180px;
  padding: var(--ai-space-5);
}
</style>
