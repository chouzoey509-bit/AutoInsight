<template>
  <div class="search-bar">
    <el-input
      v-model="model"
      :placeholder="placeholder"
      clearable
      :style="{ width: width }"
      @keyup.enter="emit('search', model)"
      @clear="emit('search', '')"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>
    <el-button type="primary" @click="emit('search', model)">搜索</el-button>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Search } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    width?: string
  }>(),
  { placeholder: '请输入关键词搜索', width: '280px' }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'search', value: string): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: (v: string) => emit('update:modelValue', v)
})
</script>

<style scoped lang="scss">
.search-bar {
  display: flex;
  align-items: center;
  gap: var(--ai-space-2);
  flex-wrap: wrap;
}
</style>
