<template>
  <div class="ai-page admin-users">
    <PageHeader
      title="用户管理"
      description="维护平台账号的角色、状态与基础信息，支持按关键词、角色、状态组合筛选"
      source="示例数据集 · 用户中心"
      :mock="true"
      :breadcrumbs="[{ title: '企业管理后台' }, { title: '用户管理' }]"
    >
      <template #actions>
        <el-button @click="loadList">
          <el-icon><Refresh /></el-icon>
          <span style="margin-left: 4px">刷新</span>
        </el-button>
      </template>
    </PageHeader>

    <!-- ---------------- 筛选 ---------------- -->
    <FilterBar :loading="loading" @search="onSearch" @reset="onReset">
      <FilterField label="关键词">
        <el-input v-model="query.keyword" placeholder="用户名 / 昵称 / 邮箱" clearable />
      </FilterField>
      <FilterField label="角色">
        <el-select v-model="query.role" placeholder="全部角色" clearable>
          <el-option v-for="r in ROLE_OPTIONS" :key="r.value" :label="r.label" :value="r.value" />
        </el-select>
      </FilterField>
      <FilterField label="状态">
        <el-select v-model="query.status" placeholder="全部状态" clearable>
          <el-option label="正常" value="active" />
          <el-option label="已禁用" value="disabled" />
          <el-option label="待审核" value="pending" />
        </el-select>
      </FilterField>
    </FilterBar>

    <!-- ---------------- 列表 ---------------- -->
    <section class="ai-panel admin-users__panel">
      <DataTable
        v-model:page="page"
        v-model:page-size="pageSize"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        show-index
        :default-sort="{ prop: 'createdAt', order: 'descending' }"
        empty-text="没有匹配的用户"
        @page-change="onPageChange"
      >
        <template #nickname="{ row }">
          <div class="admin-users__user">
            <span class="admin-users__avatar">{{ row.nickname.slice(0, 1) }}</span>
            <div class="admin-users__user-info">
              <span class="admin-users__user-name">{{ row.nickname }}</span>
              <span class="admin-users__user-meta">@{{ row.username }}</span>
            </div>
          </div>
        </template>

        <template #role="{ row }">
          <StatusTag :status="row.role" :dot="false" />
        </template>

        <template #status="{ row }">
          <StatusTag :status="row.status" />
        </template>

        <template #createdAt="{ row }">
          <span class="ai-num">{{ formatDate(row.createdAt) }}</span>
        </template>

        <template #lastLoginAt="{ row }">
          <span class="ai-num">{{ row.lastLoginAt ? fromNow(row.lastLoginAt) : '从未登录' }}</span>
        </template>

        <template #action="{ row }">
          <div class="admin-users__actions">
            <el-button link type="primary" size="small" @click="openDetail(row)">查看</el-button>
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button
              link
              size="small"
              :type="row.status === 'disabled' ? 'success' : 'danger'"
              @click="onToggleStatus(row)"
            >
              {{ row.status === 'disabled' ? '启用' : '禁用' }}
            </el-button>
          </div>
        </template>
      </DataTable>
    </section>

    <!-- ---------------- 详情抽屉 ---------------- -->
    <el-drawer v-model="detailVisible" title="用户详情" size="420px">
      <div v-if="current" class="admin-users__detail">
        <div class="admin-users__detail-head">
          <span class="admin-users__detail-avatar">{{ current.nickname.slice(0, 1) }}</span>
          <div>
            <h4>{{ current.nickname }}</h4>
            <p class="ai-num">ID {{ current.id }} · @{{ current.username }}</p>
          </div>
        </div>

        <div class="ai-spec">
          <div class="ai-spec__row">
            <span class="ai-spec__label">角色</span>
            <span class="ai-spec__value"><StatusTag :status="current.role" :dot="false" /></span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">状态</span>
            <span class="ai-spec__value"><StatusTag :status="current.status" /></span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">部门</span>
            <span class="ai-spec__value">{{ current.department || '--' }}</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">邮箱</span>
            <span class="ai-spec__value">{{ current.email }}</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">手机号</span>
            <span class="ai-spec__value ai-num">{{ current.phone || '--' }}</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">注册时间</span>
            <span class="ai-spec__value ai-num">{{ formatDateTime(current.createdAt) }}</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">最近登录</span>
            <span class="ai-spec__value ai-num">{{ formatDateTime(current.lastLoginAt) }}</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">登录 IP</span>
            <span class="ai-spec__value ai-num">{{ current.lastLoginIp || '--' }}</span>
          </div>
          <div class="ai-spec__row">
            <span class="ai-spec__label">累计登录</span>
            <span class="ai-spec__value ai-num">{{ current.loginCount ?? 0 }} 次</span>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- ---------------- 编辑弹窗 ---------------- -->
    <el-dialog v-model="editVisible" title="编辑用户" width="460px" align-center>
      <el-form v-if="editForm" :model="editForm" label-width="76px">
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" maxlength="20" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.role" style="width: 100%">
            <el-option v-for="r in ROLE_OPTIONS.filter((i) => i.value !== 'all')" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" style="width: 100%">
            <el-option label="正常" value="active" />
            <el-option label="已禁用" value="disabled" />
            <el-option label="待审核" value="pending" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="editForm.department" maxlength="20" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" maxlength="11" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import FilterField from '@/components/common/FilterField.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { adminUserApi } from '@/api/admin'
import { ROLE_OPTIONS } from '@/constants'
import { formatDate, formatDateTime, fromNow } from '@/utils/format'
import type { AdminUserItem, UserRole, UserStatus } from '@/types'

/**
 * 管理后台 · 用户管理
 * 数据来源：GET /api/admin/users · PUT /api/admin/users/:id · PATCH /api/admin/users/:id/status
 */

const list = ref<AdminUserItem[]>([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)

const query = reactive<{ keyword: string; role: string; status: string }>({
  keyword: '',
  role: '',
  status: ''
})

const columns = [
  { prop: 'nickname', label: '用户', minWidth: 200, slot: 'nickname' },
  { prop: 'role', label: '角色', width: 110, slot: 'role' },
  { prop: 'status', label: '状态', width: 100, slot: 'status' },
  { prop: 'department', label: '部门', width: 130 },
  { prop: 'email', label: '邮箱', minWidth: 200, showOverflowTooltip: true },
  { prop: 'createdAt', label: '注册时间', width: 120, sortable: true, slot: 'createdAt' },
  { prop: 'lastLoginAt', label: '最近登录', width: 120, slot: 'lastLoginAt' },
  { prop: 'action', label: '操作', width: 180, fixed: 'right' as const, slot: 'action' }
]

/* ---------------- 详情 / 编辑 ---------------- */

const current = ref<AdminUserItem | null>(null)
const detailVisible = ref(false)
const editVisible = ref(false)
const saving = ref(false)
const editForm = ref<{
  id: number
  nickname: string
  role: UserRole
  status: UserStatus
  department: string
  email: string
  phone: string
} | null>(null)

function openDetail(row: AdminUserItem): void {
  current.value = row
  detailVisible.value = true
}

function openEdit(row: AdminUserItem): void {
  editForm.value = {
    id: row.id,
    nickname: row.nickname,
    role: row.role,
    status: row.status,
    department: row.department ?? '',
    email: row.email,
    phone: row.phone ?? ''
  }
  editVisible.value = true
}

async function onSave(): Promise<void> {
  if (!editForm.value) return
  saving.value = true
  try {
    const updated = await adminUserApi.update(editForm.value.id, {
      nickname: editForm.value.nickname,
      role: editForm.value.role,
      status: editForm.value.status,
      department: editForm.value.department,
      email: editForm.value.email,
      phone: editForm.value.phone
    })
    const idx = list.value.findIndex((u) => u.id === updated.id)
    if (idx >= 0) list.value[idx] = updated
    editVisible.value = false
    ElMessage.success('用户信息已更新')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

async function onToggleStatus(row: AdminUserItem): Promise<void> {
  const next: UserStatus = row.status === 'disabled' ? 'active' : 'disabled'
  try {
    await ElMessageBox.confirm(
      `确定要${next === 'disabled' ? '禁用' : '启用'}用户「${row.nickname}」吗？`,
      '状态变更确认',
      { type: next === 'disabled' ? 'warning' : 'info', confirmButtonText: '确定', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  try {
    const updated = await adminUserApi.updateStatus(row.id, next)
    const idx = list.value.findIndex((u) => u.id === updated.id)
    if (idx >= 0) list.value[idx] = updated
    ElMessage.success(next === 'disabled' ? '已禁用该用户' : '已启用该用户')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '状态更新失败')
  }
}

/* ---------------- 列表加载 ---------------- */

async function loadList(): Promise<void> {
  loading.value = true
  try {
    const res = await adminUserApi.list({
      page: page.value,
      pageSize: pageSize.value,
      keyword: query.keyword || undefined,
      role: query.role || undefined,
      status: query.status || undefined
    })
    list.value = res.list
    total.value = res.total
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '用户列表加载失败')
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function onSearch(): void {
  page.value = 1
  void loadList()
}

function onReset(): void {
  query.keyword = ''
  query.role = ''
  query.status = ''
  page.value = 1
  void loadList()
}

function onPageChange({ page: p, pageSize: s }: { page: number; pageSize: number }): void {
  page.value = p
  pageSize.value = s
  void loadList()
}

onMounted(() => {
  void loadList()
})
</script>

<style scoped lang="scss">
.admin-users__panel {
  overflow: hidden;
}

.admin-users__user {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.admin-users__avatar {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--ai-brand-ghost);
  border: 1px solid var(--ai-border-brand);
  color: #8ab4ff;
  font-size: var(--ai-fs-xs);
  font-weight: 600;
  flex-shrink: 0;
}

.admin-users__user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.35;
}

.admin-users__user-name {
  font-size: var(--ai-fs-sm);
  color: var(--ai-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-users__user-meta {
  font-size: 10px;
  color: var(--ai-text-4);
}

.admin-users__actions {
  display: flex;
  gap: 2px;
}

.admin-users__detail {
  display: flex;
  flex-direction: column;
  gap: var(--ai-space-5);
}

.admin-users__detail-head {
  display: flex;
  align-items: center;
  gap: var(--ai-space-4);

  h4 {
    font-size: var(--ai-fs-h3);
    font-weight: var(--ai-fw-semibold);
    color: var(--ai-text-1);
  }

  p {
    margin-top: 4px;
    font-size: var(--ai-fs-xs);
    color: var(--ai-text-3);
  }
}

.admin-users__detail-avatar {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: var(--ai-radius-md);
  background: var(--ai-brand-ghost);
  border: 1px solid var(--ai-border-brand);
  color: #8ab4ff;
  font-size: 18px;
  font-weight: var(--ai-fw-semibold);
  flex-shrink: 0;
}
</style>
