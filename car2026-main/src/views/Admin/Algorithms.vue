<template>
  <div class="ai-page admin-algorithms">
    <PageHeader
      title="算法管理"
      description="管理推荐、预测与舆情三类算法任务的运行状态、版本与调用情况"
      source="示例数据集 · 算法服务"
      :mock="true"
      :breadcrumbs="[{ title: '企业管理后台' }, { title: '算法管理' }]"
    >
      <template #actions>
        <el-button :loading="loading" @click="loadList">
          <el-icon><Refresh /></el-icon>
          <span style="margin-left: 4px">刷新</span>
        </el-button>
      </template>
    </PageHeader>

    <!-- ---------------- 概览 ---------------- -->
    <section class="ai-cols ai-cols--4">
      <StatCard
        label="算法任务总数"
        :value="tasks.length"
        unit="个"
        :change="0"
        tone="brand"
        :loading="loading"
        :icon="Cpu"
      />
      <StatCard
        label="运行中"
        :value="countByStatus('running') + countByStatus('training')"
        unit="个"
        :change="4.2"
        tone="nev"
        :loading="loading"
        :icon="Loading"
      />
      <StatCard
        label="平均准确率"
        :value="avgAccuracy"
        format="percent"
        unit="%"
        :change="1.6"
        tone="cyan"
        :loading="loading"
        :icon="DataAnalysis"
      />
      <StatCard
        label="累计调用"
        :value="totalCalls"
        unit="次"
        :change="12.8"
        tone="purple"
        :loading="loading"
        :icon="TrendCharts"
      />
    </section>

    <ErrorState v-if="error" :message="error" description="算法任务加载失败" @retry="loadList" />

    <LoadingState v-else-if="loading" variant="table" :rows="4" :columns="5" />

    <EmptyState v-else-if="!tasks.length" title="暂无算法任务" compact />

    <!-- ---------------- 任务卡片 ---------------- -->
    <section v-else class="ai-cols ai-cols--3 admin-algorithms__grid">
      <article v-for="task in tasks" :key="task.id" class="admin-algorithms__card ai-panel ai-panel--hoverable">
        <header class="admin-algorithms__head">
          <div class="admin-algorithms__title">
            <span class="admin-algorithms__icon" :style="{ color: typeColor(task.type), background: typeBg(task.type) }">
              <el-icon :size="15"><component :is="typeIcon(task.type)" /></el-icon>
            </span>
            <div>
              <h4>{{ task.name }}</h4>
              <span class="admin-algorithms__type">{{ task.type }} · {{ task.model }}</span>
            </div>
          </div>
          <StatusTag :status="task.status" />
        </header>

        <div class="admin-algorithms__accuracy">
          <div class="admin-algorithms__accuracy-head">
            <span>模型准确率</span>
            <b class="ai-num">{{ (task.accuracy * 100).toFixed(1) }}%</b>
          </div>
          <div class="ai-bar">
            <div class="ai-bar__fill" :style="{ width: `${task.accuracy * 100}%`, background: accuracyColor(task.accuracy) }" />
          </div>
        </div>

        <dl class="admin-algorithms__meta">
          <div>
            <dt>版本</dt>
            <dd class="ai-num">{{ task.version }}</dd>
          </div>
          <div>
            <dt>累计调用</dt>
            <dd class="ai-num">{{ formatNumber(task.calls) }}</dd>
          </div>
          <div>
            <dt>负责人</dt>
            <dd>{{ task.owner }}</dd>
          </div>
          <div>
            <dt>最近运行</dt>
            <dd class="ai-num">{{ formatDateTime(task.lastRunAt) }}</dd>
          </div>
        </dl>

        <footer class="admin-algorithms__foot">
          <el-button
            size="small"
            :type="task.status === 'running' ? 'default' : 'primary'"
            plain
            :loading="pendingId === task.id"
            @click="onToggle(task)"
          >
            {{ task.status === 'running' ? '停止' : '启动' }}
          </el-button>
          <el-button size="small" text @click="onDetail(task)">运行详情</el-button>
        </footer>
      </article>
    </section>

    <!-- ---------------- 说明 ---------------- -->
    <section class="ai-panel admin-algorithms__notice">
      <el-icon :size="15"><InfoFilled /></el-icon>
      <p>
        任务的「启动 / 停止」会调用 <code>PATCH /api/admin/algorithms/:id/status</code>；
        真实环境中后端应校验操作权限并将指令下发至算法调度服务，当前为示例流程。
      </p>
    </section>

    <!-- ---------------- 详情抽屉 ---------------- -->
    <el-drawer v-model="detailVisible" title="算法任务详情" size="420px">
      <div v-if="current" class="admin-algorithms__detail">
        <div class="ai-spec">
          <div class="ai-spec__row">
            <span class="ai-spec__label">任务名称</span>
            <span class="ai-spec__value">{{ current.name }}</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">任务类型</span>
            <span class="ai-spec__value">{{ current.type }}</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">模型</span>
            <span class="ai-spec__value">{{ current.model }}</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">版本</span>
            <span class="ai-spec__value ai-num">{{ current.version }}</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">准确率</span>
            <span class="ai-spec__value ai-num">{{ (current.accuracy * 100).toFixed(1) }}%</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">运行状态</span>
            <span class="ai-spec__value"><StatusTag :status="current.status" /></span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">最近运行</span>
            <span class="ai-spec__value ai-num">{{ formatDateTime(current.lastRunAt) }}</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">累计调用</span>
            <span class="ai-spec__value ai-num">{{ formatNumber(current.calls) }} 次</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">负责人</span>
            <span class="ai-spec__value">{{ current.owner }}</span>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Cpu,
  DataAnalysis,
  InfoFilled,
  Loading,
  MagicStick,
  Refresh,
  TrendCharts,
  ChatDotRound
} from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { adminAlgorithmApi } from '@/api/admin'
import { formatDateTime, formatNumber } from '@/utils/format'
import { PALETTE, withAlpha } from '@/charts/theme'
import type { AlgorithmTask } from '@/types'

/**
 * 管理后台 · 算法管理
 * 数据来源：GET /api/admin/algorithms · PATCH /api/admin/algorithms/:id/status
 */

const tasks = ref<AlgorithmTask[]>([])
const loading = ref(false)
const error = ref('')
const pendingId = ref<number | null>(null)

const current = ref<AlgorithmTask | null>(null)
const detailVisible = ref(false)

const TYPE_META: Record<AlgorithmTask['type'], { color: string; icon: unknown }> = {
  推荐: { color: PALETTE[3], icon: MagicStick },
  预测: { color: PALETTE[0], icon: TrendCharts },
  舆情: { color: PALETTE[1], icon: ChatDotRound }
}

function typeColor(type: AlgorithmTask['type']): string {
  return TYPE_META[type]?.color ?? PALETTE[0]
}

function typeBg(type: AlgorithmTask['type']): string {
  return withAlpha(TYPE_META[type]?.color ?? PALETTE[0], 0.12)
}

function typeIcon(type: AlgorithmTask['type']): unknown {
  return TYPE_META[type]?.icon ?? Cpu
}

function accuracyColor(acc: number): string {
  if (acc >= 0.9) return 'var(--ai-nev)'
  if (acc >= 0.8) return 'var(--ai-brand)'
  if (acc >= 0.7) return 'var(--ai-warn)'
  return 'var(--ai-danger)'
}

const countByStatus = (status: AlgorithmTask['status']): number =>
  tasks.value.filter((t) => t.status === status).length

const avgAccuracy = computed(() =>
  tasks.value.length ? (tasks.value.reduce((s, t) => s + t.accuracy, 0) / tasks.value.length) * 100 : 0
)

const totalCalls = computed(() => tasks.value.reduce((s, t) => s + t.calls, 0))

async function loadList(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    tasks.value = await adminAlgorithmApi.list()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '算法任务加载失败，请稍后重试'
    tasks.value = []
  } finally {
    loading.value = false
  }
}

async function onToggle(task: AlgorithmTask): Promise<void> {
  const next: AlgorithmTask['status'] = task.status === 'running' ? 'idle' : 'running'
  pendingId.value = task.id
  try {
    const updated = await adminAlgorithmApi.updateStatus(task.id, next)
    const idx = tasks.value.findIndex((t) => t.id === updated.id)
    if (idx >= 0) tasks.value[idx] = updated
    ElMessage.success(next === 'running' ? `${task.name} 已启动` : `${task.name} 已停止`)
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '状态更新失败')
  } finally {
    pendingId.value = null
  }
}

function onDetail(task: AlgorithmTask): void {
  current.value = task
  detailVisible.value = true
}

onMounted(() => {
  void loadList()
})
</script>

<style scoped lang="scss">
.admin-algorithms__grid {
  align-items: stretch;
}

.admin-algorithms__card {
  display: flex;
  flex-direction: column;
  gap: var(--ai-space-4);
  padding: var(--ai-space-4) var(--ai-space-5);
  min-width: 0;
}

.admin-algorithms__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ai-space-3);
}

.admin-algorithms__title {
  display: flex;
  align-items: center;
  gap: var(--ai-space-3);
  min-width: 0;

  h4 {
    font-size: var(--ai-fs-body);
    font-weight: var(--ai-fw-semibold);
    color: var(--ai-text-1);
  }
}

.admin-algorithms__icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--ai-radius-sm);
  flex-shrink: 0;
}

.admin-algorithms__type {
  display: block;
  margin-top: 4px;
  font-size: var(--ai-fs-mini);
  color: var(--ai-text-4);
}

.admin-algorithms__accuracy-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 7px;
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-3);

  b { color: var(--ai-text-1); font-weight: var(--ai-fw-medium); }
}

.admin-algorithms__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ai-space-3);
  margin: 0;

  dt {
    font-size: var(--ai-fs-mini);
    color: var(--ai-text-4);
    margin-bottom: 4px;
  }

  dd {
    margin: 0;
    font-size: var(--ai-fs-xs);
    color: var(--ai-text-1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.admin-algorithms__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ai-space-2);
  padding-top: var(--ai-space-3);
  border-top: 1px solid var(--ai-border);
}

.admin-algorithms__notice {
  display: flex;
  align-items: flex-start;
  gap: var(--ai-space-3);
  padding: var(--ai-space-3) var(--ai-space-5);

  .el-icon { flex-shrink: 0; margin-top: 2px; color: var(--ai-brand); }

  p {
    font-size: var(--ai-fs-xs);
    color: var(--ai-text-2);
    line-height: var(--ai-lh-loose);
  }

  code {
    padding: 1px 5px;
    border-radius: var(--ai-radius-xs);
    background: var(--ai-bg-subtle);
    border: 1px solid var(--ai-border);
    font-family: var(--ai-font-mono);
    font-size: 11px;
    color: #8ab4ff;
  }
}
</style>
