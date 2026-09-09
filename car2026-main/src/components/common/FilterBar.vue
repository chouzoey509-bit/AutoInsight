<template>
  <section class="filter-bar ai-panel">
    <div class="filter-bar__body">
      <slot />
    </div>
    <div class="filter-bar__actions">
      <slot name="actions" />
      <el-button :disabled="loading" @click="emit('reset')">
        <el-icon><RefreshLeft /></el-icon>
        <span class="filter-bar__btn-text">重置</span>
      </el-button>
      <el-button type="primary" :loading="loading" @click="emit('search')">
        <el-icon><Search /></el-icon>
        <span class="filter-bar__btn-text">查询</span>
      </el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RefreshLeft, Search } from '@element-plus/icons-vue'

/** 筛选条：条件区自适应栅格 + 固定操作区 */
withDefaults(defineProps<{ loading?: boolean }>(), { loading: false })

const emit = defineEmits<{
  (e: 'search'): void
  (e: 'reset'): void
}>()
</script>

<style scoped lang="scss">
.filter-bar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--ai-space-4);
  padding: var(--ai-space-4) var(--ai-space-5);
  flex-wrap: wrap;
}

.filter-bar__body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--ai-space-3) var(--ai-space-4);
  flex: 1;
  min-width: 260px;
}

.filter-bar__actions {
  display: flex;
  align-items: center;
  gap: var(--ai-space-2);
  flex-shrink: 0;
  padding-bottom: 2px;
}

.filter-bar__btn-text {
  margin-left: 4px;
}

@media (max-width: 768px) {
  .filter-bar__body { grid-template-columns: minmax(0, 1fr); }
  .filter-bar__actions { width: 100%; justify-content: flex-end; }
}
</style>
