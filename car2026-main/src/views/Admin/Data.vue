<template>
  <div class="ai-page admin-data">
    <PageHeader
      title="数据管理"
      description="管理车型、销量与评价数据的导入、导出与版本记录。上传文件后由后端解析入库，前端负责展示上传进度与处理结果"
      source="示例数据集 · 数据中心"
      :mock="true"
      :breadcrumbs="[{ title: '企业管理后台' }, { title: '数据管理' }]"
    >
      <template #actions>
        <el-button :loading="loading" @click="loadFiles">
          <el-icon><Refresh /></el-icon>
          <span style="margin-left: 4px">刷新</span>
        </el-button>
      </template>
    </PageHeader>

    <!-- ---------------- 概览 ---------------- -->
    <section class="ai-cols ai-cols--4">
      <StatCard
        label="数据文件总数"
        :value="summary.total"
        unit="个"
        :change="0"
        tone="brand"
        :loading="loading"
        :icon="Files"
      />
      <StatCard
        label="导入成功"
        :value="summary.success"
        unit="个"
        :change="0"
        tone="nev"
        :loading="loading"
        :icon="CircleCheckFilled"
      />
      <StatCard
        label="导入失败"
        :value="summary.failed"
        unit="个"
        :change="0"
        tone="danger"
        :loading="loading"
        :icon="CircleCloseFilled"
      />
      <StatCard
        label="数据总行数"
        :value="summary.totalRows"
        unit="行"
        :change="0"
        tone="cyan"
        :loading="loading"
        :icon="DataLine"
      />
    </section>

    <!-- ---------------- 上传区 ---------------- -->
    <section class="ai-panel admin-data__upload">
      <div class="admin-data__section-head">
        <h3 class="ai-section-title">数据导入</h3>
        <span class="admin-data__hint">支持 CSV / Excel 格式，单文件最大 50MB，实际解析由后端完成</span>
      </div>

      <div class="admin-data__upload-row">
        <!-- 拖拽上传 -->
        <el-upload
          ref="uploadRef"
          class="admin-data__uploader"
          drag
          :auto-upload="false"
          :show-file-list="false"
          :on-change="onFileChange"
          accept=".csv,.xlsx,.xls"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip admin-data__tip">
              支持格式：.csv / .xlsx / .xls · 数据类型选择后上传
            </div>
          </template>
        </el-upload>

        <!-- 上传配置 -->
        <div class="admin-data__config">
          <div class="admin-data__config-row">
            <label class="admin-data__label">数据类型</label>
            <el-select v-model="uploadType" placeholder="选择数据类型" class="admin-data__select">
              <el-option label="车型数据" value="车型数据" />
              <el-option label="销量数据" value="销量数据" />
              <el-option label="评价数据" value="评价数据" />
            </el-select>
          </div>

          <div v-if="pendingFile" class="admin-data__file-info">
            <el-icon class="admin-data__file-icon"><Document /></el-icon>
            <div class="admin-data__file-detail">
              <span class="admin-data__file-name" :title="pendingFile.name">{{ pendingFile.name }}</span>
              <span class="admin-data__file-size">{{ formatFileSize(pendingFile.size) }}</span>
            </div>
            <el-button link type="danger" size="small" @click="clearPending">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>

          <el-button
            type="primary"
            :loading="uploading"
            :disabled="!pendingFile || !uploadType"
            class="admin-data__submit"
            @click="doUpload"
          >
            <el-icon v-if="!uploading"><Upload /></el-icon>
            <span style="margin-left: 4px">{{ uploading ? '上传中…' : '开始上传' }}</span>
          </el-button>
        </div>
      </div>

      <!-- 上传进度 -->
      <div v-if="uploading || uploadProgress > 0" class="admin-data__progress">
        <div class="admin-data__progress-head">
          <span class="admin-data__progress-label">
            {{ uploadStatusText }}
          </span>
          <span class="ai-num">{{ uploadProgress }}%</span>
        </div>
        <div class="ai-bar">
          <div
            class="ai-bar__fill"
            :style="{
              width: `${uploadProgress}%`,
              background: uploadProgress === 100 ? 'var(--ai-nev)' : 'var(--ai-brand)',
              transition: 'width 0.3s ease'
            }"
          />
        </div>
      </div>
    </section>

    <!-- ---------------- 文件列表 ---------------- -->
    <section class="ai-panel admin-data__list-panel">
      <div class="admin-data__section-head">
        <h3 class="ai-section-title">数据文件列表</h3>
        <div class="admin-data__tabs">
          <button
            v-for="t in TYPE_TABS"
            :key="t.value"
            class="admin-data__tab"
            :class="{ 'is-active': activeType === t.value }"
            @click="activeType = t.value"
          >
            {{ t.label }}
            <span class="admin-data__tab-count">{{ countByType(t.value) }}</span>
          </button>
        </div>
      </div>

      <ErrorState
        v-if="error"
        :message="error"
        description="数据文件加载失败"
        @retry="loadFiles"
      />

      <LoadingState v-else-if="loading && !files.length" variant="table" :rows="4" />

      <EmptyState
        v-else-if="!filteredFiles.length"
        title="暂无数据文件"
        description="上传文件后将在此显示"
        compact
      />

      <DataTable
        v-else
        :data="filteredFiles"
        :columns="fileColumns"
        :loading="loading"
        :page="1"
        :page-size="50"
        :total="filteredFiles.length"
        show-index
        empty-text="没有数据文件"
      >
        <template #name="{ row }">
          <div class="admin-data__file-cell">
            <span
              class="admin-data__file-type-icon"
              :style="{ color: typeColor(row.type), background: typeBg(row.type) }"
            >
              {{ row.name.slice(-4).includes('xlsx') || row.name.slice(-3).includes('xls') ? 'XLS' : 'CSV' }}
            </span>
            <div class="admin-data__file-meta">
              <span class="admin-data__file-name" :title="row.name">{{ row.name }}</span>
              <span class="admin-data__file-sub">{{ row.type }}</span>
            </div>
          </div>
        </template>

        <template #size="{ row }">
          <span class="ai-num">{{ formatFileSize(row.size) }}</span>
        </template>

        <template #status="{ row }">
          <StatusTag
            :status="row.status"
            :text="statusText(row.status)"
            :tone="statusTone(row.status)"
          />
        </template>

        <template #progress="{ row }">
          <div v-if="row.status === 'uploading'" class="admin-data__cell-progress">
            <div class="ai-bar">
              <div class="ai-bar__fill" :style="{ width: `${row.progress}%` }" />
            </div>
            <span class="ai-num">{{ row.progress }}%</span>
          </div>
          <span v-else class="ai-num">{{ row.progress }}%</span>
        </template>

        <template #rows="{ row }">
          <span class="ai-num">{{ row.rows ? formatNumber(row.rows) : '—' }}</span>
        </template>

        <template #uploadedAt="{ row }">
          <span class="ai-num">{{ formatDateTime(row.uploadedAt) }}</span>
        </template>

        <template #action="{ row }">
          <el-button
            link
            type="primary"
            size="small"
            :disabled="row.status !== 'success'"
            @click="exportFile(row)"
          >
            导出
          </el-button>
          <el-button
            link
            type="danger"
            size="small"
            @click="confirmDelete(row)"
          >
            删除
          </el-button>
        </template>
      </DataTable>
    </section>

    <!-- ---------------- 删除确认 ---------------- -->
    <ConfirmDialog
      v-model="deleteVisible"
      title="删除数据文件"
      :content="`确定要删除文件「${deleteTarget?.name ?? ''}」吗？此操作不可恢复。`"
      confirm-text="删除"
      type="danger"
      :loading="deleting"
      @confirm="doDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import {
  CircleCheckFilled,
  CircleCloseFilled,
  Close,
  DataLine,
  Document,
  Files,
  Refresh,
  Upload,
  UploadFilled
} from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { adminDataApi } from '@/api/admin'
import { formatDateTime, formatFileSize, formatNumber } from '@/utils/format'
import type { DataFileItem } from '@/types'

/**
 * 管理后台 · 数据管理
 * 数据来源：GET /api/admin/data-files · POST /api/admin/data/upload · DELETE /api/admin/data-files/:id
 * 注意：实际数据解析入库由后端完成，前端仅负责上传 UI、进度展示与文件列表管理
 */

const TYPE_TABS = [
  { label: '全部', value: 'all' },
  { label: '车型数据', value: '车型数据' },
  { label: '销量数据', value: '销量数据' },
  { label: '评价数据', value: '评价数据' }
]

const files = ref<DataFileItem[]>([])
const loading = ref(false)
const error = ref('')
const activeType = ref('all')

// 上传相关
const uploadType = ref<'车型数据' | '销量数据' | '评价数据'>('车型数据')
const pendingFile = ref<File | null>(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatusText = ref('')

// 删除相关
const deleteVisible = ref(false)
const deleteTarget = ref<DataFileItem | null>(null)
const deleting = ref(false)

const fileColumns = [
  { prop: 'name', label: '文件名', minWidth: 280, slot: 'name' },
  { prop: 'size', label: '大小', width: 110, slot: 'size' },
  { prop: 'status', label: '状态', width: 100, slot: 'status' },
  { prop: 'progress', label: '进度', width: 130, slot: 'progress' },
  { prop: 'rows', label: '数据行数', width: 120, slot: 'rows' },
  { prop: 'uploadedAt', label: '上传时间', width: 180, slot: 'uploadedAt' },
  { prop: 'action', label: '操作', width: 140, fixed: 'right' as const, slot: 'action' }
]

// 概览统计
const summary = computed(() => {
  const total = files.value.length
  const success = files.value.filter((f) => f.status === 'success').length
  const failed = files.value.filter((f) => f.status === 'failed').length
  const totalRows = files.value.reduce((s, f) => s + (f.rows ?? 0), 0)
  return { total, success, failed, totalRows }
})

// 按类型过滤
const filteredFiles = computed(() => {
  if (activeType.value === 'all') return files.value
  return files.value.filter((f) => f.type === activeType.value)
})

function countByType(type: string): number {
  if (type === 'all') return files.value.length
  return files.value.filter((f) => f.type === type).length
}

/** 文件选择回调 */
function onFileChange(file: UploadFile): void {
  if (!file.raw) return
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.raw.size > maxSize) {
    ElMessage.error('文件大小不能超过 50MB')
    return
  }
  const ext = file.raw.name.slice(-5).toLowerCase()
  if (!ext.endsWith('.csv') && !ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
    ElMessage.error('仅支持 CSV / Excel 格式文件')
    return
  }
  pendingFile.value = file.raw
}

function clearPending(): void {
  pendingFile.value = null
  uploadProgress.value = 0
}

/** 模拟上传过程（实际调用后端接口，后端返回成功后标记完成） */
async function doUpload(): Promise<void> {
  if (!pendingFile.value || !uploadType.value) {
    ElMessage.warning('请选择文件并指定数据类型')
    return
  }

  uploading.value = true
  uploadProgress.value = 0
  uploadStatusText.value = '正在上传文件…'

  const file = pendingFile.value

  // 模拟前端上传进度（实际生产中应使用 axios onUploadProgress）
  const progressTimer = setInterval(() => {
    if (uploadProgress.value < 90) {
      uploadProgress.value += Math.random() * 15
      if (uploadProgress.value > 90) uploadProgress.value = 90
    }
  }, 200)

  try {
    uploadStatusText.value = '后端正在解析数据…'
    uploadProgress.value = 95

    const result = await adminDataApi.upload({
      name: file.name,
      size: file.size,
      type: uploadType.value
    })

    uploadProgress.value = 100
    uploadStatusText.value = '上传成功'
    clearInterval(progressTimer)

    // 将新文件添加到列表顶部
    files.value.unshift(result)
    ElMessage.success(`「${file.name}」上传成功，已导入 ${result.rows ?? 0} 行数据`)

    // 重置上传状态
    setTimeout(() => {
      pendingFile.value = null
      uploadProgress.value = 0
      uploadStatusText.value = ''
    }, 1500)
  } catch (e) {
    clearInterval(progressTimer)
    uploadStatusText.value = '上传失败'
    ElMessage.error(e instanceof Error ? e.message : '文件上传失败，请稍后重试')
    // 不清除 pendingFile，允许用户重试
  } finally {
    uploading.value = false
  }
}

/** 加载文件列表 */
async function loadFiles(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const res = await adminDataApi.files()
    files.value = res
  } catch (e) {
    error.value = e instanceof Error ? e.message : '数据文件列表加载失败'
    files.value = []
  } finally {
    loading.value = false
  }
}

/** 确认删除 */
function confirmDelete(row: DataFileItem): void {
  deleteTarget.value = row
  deleteVisible.value = true
}

/** 执行删除 */
async function doDelete(): Promise<void> {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await adminDataApi.remove(deleteTarget.value.id)
    files.value = files.value.filter((f) => f.id !== deleteTarget.value!.id)
    ElMessage.success(`已删除文件「${deleteTarget.value.name}」`)
    deleteVisible.value = false
    deleteTarget.value = null
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '删除失败')
  } finally {
    deleting.value = false
  }
}

/** 导出文件（模拟下载） */
function exportFile(row: DataFileItem): void {
  ElMessage.info(`正在导出「${row.name}」…`)
  // 模拟下载（实际生产中由后端提供下载链接）
  const blob = new Blob([`文件名: ${row.name}\n类型: ${row.type}\n行数: ${row.rows ?? 0}\n导出时间: ${new Date().toISOString()}`], {
    type: 'text/plain;charset=utf-8;'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = row.name.replace(/\.(csv|xlsx|xls)$/, '_export.txt')
  link.click()
  URL.revokeObjectURL(url)
}

// 工具函数
function statusText(status: DataFileItem['status']): string {
  const map: Record<string, string> = {
    success: '导入成功',
    failed: '导入失败',
    uploading: '上传中',
    pending: '待处理'
  }
  return map[status] ?? status
}

function statusTone(status: DataFileItem['status']): 'nev' | 'danger' | 'brand' | 'warn' {
  const map: Record<string, 'nev' | 'danger' | 'brand' | 'warn'> = {
    success: 'nev',
    failed: 'danger',
    uploading: 'brand',
    pending: 'warn'
  }
  return map[status] ?? 'warn'
}

function typeColor(type: string): string {
  const map: Record<string, string> = {
    '车型数据': 'var(--ai-brand)',
    '销量数据': 'var(--ai-nev)',
    '评价数据': 'var(--ai-purple)'
  }
  return map[type] ?? 'var(--ai-text-secondary)'
}

function typeBg(type: string): string {
  const map: Record<string, string> = {
    '车型数据': 'rgba(59, 130, 246, 0.12)',
    '销量数据': 'rgba(16, 185, 129, 0.12)',
    '评价数据': 'rgba(139, 92, 246, 0.12)'
  }
  return map[type] ?? 'rgba(148, 163, 184, 0.12)'
}

onMounted(() => {
  void loadFiles()
})
</script>

<style scoped lang="scss">
.admin-data__upload {
  margin-bottom: 24px;
}

.admin-data__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.admin-data__hint {
  color: var(--ai-text-tertiary);
  font-size: var(--ai-fs-sm);
}

.admin-data__upload-row {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 20px;
  align-items: start;
}

@media (max-width: 768px) {
  .admin-data__upload-row {
    grid-template-columns: 1fr;
  }
}

/* 上传器样式覆盖 */
.admin-data__uploader {
  width: 100%;

  :deep(.el-upload-dragger) {
    width: 100%;
    padding: 32px 20px;
  }
}

.admin-data__tip {
  color: var(--ai-text-tertiary);
  font-size: var(--ai-fs-xs);
  margin-top: 6px;
}

.admin-data__config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.admin-data__config-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.admin-data__label {
  font-size: var(--ai-fs-sm);
  color: var(--ai-text-secondary);
  font-weight: 500;
}

.admin-data__select {
  width: 100%;
}

.admin-data__file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--ai-bg-subtle);
  border: 1px solid var(--ai-border);
  border-radius: var(--ai-radius-sm);
}

.admin-data__file-icon {
  color: var(--ai-brand);
  font-size: 18px;
  flex-shrink: 0;
}

.admin-data__file-detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.admin-data__file-name {
  font-size: var(--ai-fs-sm);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-data__file-size {
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-tertiary);
}

.admin-data__submit {
  width: 100%;
}

.admin-data__progress {
  margin-top: 16px;
}

.admin-data__progress-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.admin-data__progress-label {
  font-size: var(--ai-fs-sm);
  color: var(--ai-text-secondary);
}

/* 文件列表 */
.admin-data__list-panel {
  overflow: hidden;
}

.admin-data__tabs {
  display: flex;
  gap: 4px;
}

.admin-data__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border: 1px solid var(--ai-border);
  border-radius: var(--ai-radius-pill);
  background: transparent;
  color: var(--ai-text-secondary);
  font-size: var(--ai-fs-sm);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--ai-brand);
    color: var(--ai-brand);
  }

  &.is-active {
    background: var(--ai-brand);
    border-color: var(--ai-brand);
    color: #fff;
  }
}

.admin-data__tab-count {
  font-size: var(--ai-fs-xs);
  opacity: 0.8;
}

/* 表格内文件单元格 */
.admin-data__file-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.admin-data__file-type-icon {
  display: grid;
  place-items: center;
  min-width: 44px;
  height: 28px;
  padding: 0 6px;
  border-radius: var(--ai-radius-xs);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.admin-data__file-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin-data__file-sub {
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-tertiary);
}

.admin-data__cell-progress {
  display: flex;
  align-items: center;
  gap: 8px;

  .ai-bar {
    flex: 1;
    min-width: 60px;
  }

  span {
    font-size: var(--ai-fs-xs);
    color: var(--ai-text-secondary);
  }
}
</style>
