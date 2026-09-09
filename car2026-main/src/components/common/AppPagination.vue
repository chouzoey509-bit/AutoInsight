<template>
  <el-pagination
    :current-page="page"
    :page-size="pageSize"
    :total="total"
    :page-sizes="pageSizes"
    :layout="layout"
    :pager-count="pagerCount"
    background
    @current-change="onCurrent"
    @size-change="onSize"
  />
</template>

<script setup lang="ts">
/** 统一分页组件（全站分页交互与文案保持一致） */
const props = withDefaults(
  defineProps<{
    page: number
    pageSize: number
    total: number
    pageSizes?: number[]
    layout?: string
    pagerCount?: number
  }>(),
  {
    pageSizes: () => [10, 20, 50, 100],
    layout: 'total, sizes, prev, pager, next, jumper',
    pagerCount: 7
  }
)

const emit = defineEmits<{
  (e: 'update:page', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'change', payload: { page: number; pageSize: number }): void
}>()

function onCurrent(value: number): void {
  emit('update:page', value)
  emit('change', { page: value, pageSize: props.pageSize })
}

function onSize(value: number): void {
  emit('update:pageSize', value)
  emit('change', { page: 1, pageSize: value })
}
</script>
