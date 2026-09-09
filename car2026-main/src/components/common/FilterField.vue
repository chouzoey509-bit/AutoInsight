<template>
  <div class="filter-field">
    <label class="filter-field__label">{{ label }}</label>
    <div class="filter-field__control">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
/** 筛选条件字段：统一 label 宽度与控件宽度 */
defineProps<{ label: string }>()
</script>

<style scoped lang="scss">
.filter-field {
  display: flex;
  align-items: center;
  gap: var(--ai-space-3);
  min-width: 0;
}

.filter-field__label {
  flex-shrink: 0;
  width: 62px;
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-3);
  text-align: right;
}

.filter-field__control {
  flex: 1;
  min-width: 0;

  :deep(.el-select),
  :deep(.el-input),
  :deep(.el-date-editor) {
    width: 100%;
  }
}
</style>
