<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    align-center
    :close-on-click-modal="false"
    append-to-body
  >
    <div class="confirm-dialog">
      <el-icon v-if="type !== 'none'" class="confirm-dialog__icon" :class="`is-${type}`" :size="22">
        <WarningFilled v-if="type === 'warning' || type === 'danger'" />
        <QuestionFilled v-else />
      </el-icon>
      <div class="confirm-dialog__body">
        <p class="confirm-dialog__text">{{ content }}</p>
        <p v-if="description" class="confirm-dialog__desc">{{ description }}</p>
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">{{ cancelText }}</el-button>
      <el-button :type="type === 'danger' ? 'danger' : 'primary'" :loading="loading" @click="emit('confirm')">
        {{ confirmText }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { QuestionFilled, WarningFilled } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    content?: string
    description?: string
    confirmText?: string
    cancelText?: string
    type?: 'warning' | 'danger' | 'info' | 'none'
    width?: string
    loading?: boolean
  }>(),
  {
    title: '操作确认',
    confirmText: '确定',
    cancelText: '取消',
    type: 'warning',
    width: '420px',
    loading: false
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})
</script>

<style scoped lang="scss">
.confirm-dialog {
  display: flex;
  gap: var(--ai-space-3);
  align-items: flex-start;
}

.confirm-dialog__icon {
  flex-shrink: 0;
  margin-top: 2px;

  &.is-warning { color: var(--ai-warn); }
  &.is-danger { color: var(--ai-danger); }
  &.is-info { color: var(--ai-brand); }
}

.confirm-dialog__body {
  flex: 1;
}

.confirm-dialog__text {
  font-size: var(--ai-fs-body);
  color: var(--ai-text-1);
  line-height: var(--ai-lh-normal);
}

.confirm-dialog__desc {
  margin-top: 6px;
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-3);
}
</style>
