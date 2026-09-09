<template>
  <span class="ai-tag ai-tag--mock" :title="title">
    <el-icon :size="11"><InfoFilled /></el-icon>
    <span>{{ text }}</span>
  </span>
</template>

<script setup lang="ts">
import { InfoFilled } from '@element-plus/icons-vue'

/**
 * 示例数据标识
 * 所有使用 Mock 数据的位置统一展示，避免被误认为真实实时数据
 */
withDefaults(
  defineProps<{
    text?: string
    title?: string
  }>(),
  {
    text: '示例数据',
    title: '当前为前端内置示例数据，接入真实后端后将自动替换为业务数据'
  }
)
</script>
