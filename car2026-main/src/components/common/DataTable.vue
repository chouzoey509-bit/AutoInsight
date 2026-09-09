<template>
  <div class="data-table">
    <div v-if="$slots.toolbar" class="ai-table-toolbar">
      <slot name="toolbar" />
    </div>

    <el-table
      v-loading="loading"
      :data="data"
      :row-key="rowKey"
      :height="height"
      :max-height="maxHeight"
      :default-sort="defaultSort"
      stripe
      size="default"
      @selection-change="(val: T[]) => emit('selection-change', val)"
      @sort-change="onSortChange"
    >
      <el-table-column v-if="selectable" type="selection" width="46" :selectable="selectableRow" />
      <el-table-column v-if="showIndex" type="index" label="#" width="58" align="center" />

      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        :align="col.align ?? 'left'"
        :fixed="col.fixed"
        :sortable="col.sortable ? 'custom' : false"
        :show-overflow-tooltip="col.showOverflowTooltip ?? false"
      >
        <template #default="scope">
          <slot :name="col.slot ?? col.prop" :row="scope.row as T" :index="scope.$index" :value="getField(scope.row, col.prop)">
            {{ col.formatter ? col.formatter(scope.row as T) : display(scope.row, col.prop) }}
          </slot>
        </template>
      </el-table-column>

      <template #empty>
        <EmptyState :title="emptyText" :description="emptyDesc" compact />
      </template>
    </el-table>

    <div v-if="showPagination && total > 0" class="data-table__footer">
      <span class="data-table__total">
        共 <b class="ai-num">{{ total }}</b> 条
        <template v-if="selectedCount"> · 已选 <b class="ai-num">{{ selectedCount }}</b> 条</template>
      </span>
      <AppPagination
        v-model:page="pageModel"
        v-model:page-size="pageSizeModel"
        :total="total"
        @change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends object">
import { computed } from 'vue'
import AppPagination from './AppPagination.vue'
import EmptyState from './EmptyState.vue'
import type { TableColumn } from '@/types/table'

/**
 * 企业级数据表格
 * 基于 Element Plus Table 封装：分页、排序、多选、空态、工具栏
 */

const props = withDefaults(
  defineProps<{
    data: T[]
    columns: TableColumn<T>[]
    loading?: boolean
    total?: number
    page?: number
    pageSize?: number
    rowKey?: string
    height?: number | string
    maxHeight?: number | string
    selectable?: boolean
    showIndex?: boolean
    showPagination?: boolean
    selectedCount?: number
    emptyText?: string
    emptyDesc?: string
    defaultSort?: { prop: string; order: 'ascending' | 'descending' }
    selectableRow?: (row: T, index: number) => boolean
  }>(),
  {
    loading: false,
    total: 0,
    page: 1,
    pageSize: 10,
    rowKey: 'id',
    selectable: false,
    showIndex: false,
    showPagination: true,
    selectedCount: 0,
    emptyText: '暂无数据'
  }
)

const emit = defineEmits<{
  (e: 'selection-change', rows: T[]): void
  (e: 'update:page', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'page-change', payload: { page: number; pageSize: number }): void
  (e: 'sort-change', payload: { prop: string; order: 'asc' | 'desc' | '' }): void
}>()

const pageModel = computed({
  get: () => props.page,
  set: (v: number) => emit('update:page', v)
})

const pageSizeModel = computed({
  get: () => props.pageSize,
  set: (v: number) => emit('update:pageSize', v)
})

function onPageChange(payload: { page: number; pageSize: number }): void {
  emit('page-change', payload)
}

function onSortChange({ prop, order }: { prop: string | null; order: 'ascending' | 'descending' | null }): void {
  emit('sort-change', {
    prop: prop ?? '',
    order: order === 'ascending' ? 'asc' : order === 'descending' ? 'desc' : ''
  })
}

/** 安全读取字段（模板中无法直接索引泛型对象） */
function getField(row: unknown, path: string): unknown {
  if (row && typeof row === 'object') {
    return (row as Record<string, unknown>)[path]
  }
  return undefined
}

function display(row: unknown, path: string): string {
  const value = getField(row, path)
  if (value === undefined || value === null || value === '') return '--'
  return String(value)
}
</script>

<style scoped lang="scss">
.data-table {
  width: 100%;
  min-width: 0;
}

.data-table__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ai-space-4);
  padding: var(--ai-space-3) var(--ai-space-4);
  border-top: 1px solid var(--ai-border);
  flex-wrap: wrap;
}

.data-table__total {
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-3);

  b { color: var(--ai-text-1); font-weight: var(--ai-fw-medium); }
}
</style>
