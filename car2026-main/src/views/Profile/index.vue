<template>
  <div class="ai-page profile">
    <PageHeader
      title="个人中心"
      description="管理账号资料，查看收藏车型与浏览记录"
      :breadcrumbs="[{ title: '首页' }, { title: '个人中心' }]"
    >
      <template #actions>
        <el-button @click="openEdit">
          <el-icon><EditPen /></el-icon>
          <span style="margin-left: 4px">编辑资料</span>
        </el-button>
      </template>
    </PageHeader>

    <LoadingState v-if="userStore.loading && !userStore.profile" variant="table" :rows="4" :columns="4" />

    <template v-else-if="userStore.profile">
      <section class="ai-cols ai-cols--2-1">
        <!-- ---------- 基础资料 ---------- -->
        <section class="ai-panel profile__panel">
          <header class="ai-panel__header">
            <div>
              <h3 class="ai-panel__title">账号信息</h3>
              <p class="ai-panel__subtitle">账号基础信息与登录状态</p>
            </div>
          </header>

          <div class="ai-panel__body profile__body">
            <div class="profile__identity">
              <span class="profile__avatar" :style="{ background: avatarBg }">{{ userStore.avatarText }}</span>
              <div class="profile__identity-text">
                <h4 class="profile__nickname">{{ userStore.nickname }}</h4>
                <div class="profile__identity-tags">
                  <StatusTag :status="userStore.role" :dot="false" />
                  <StatusTag :status="userStore.profile.status" />
                  <span class="ai-tag">@{{ userStore.profile.username }}</span>
                </div>
              </div>
            </div>

            <dl class="profile__info">
              <div>
                <dt>所属部门</dt>
                <dd>{{ userStore.profile.department || '--' }}</dd>
              </div>
              <div>
                <dt>邮箱</dt>
                <dd>{{ userStore.profile.email || '--' }}</dd>
              </div>
              <div>
                <dt>手机号</dt>
                <dd class="ai-num">{{ userStore.profile.phone || '--' }}</dd>
              </div>
              <div>
                <dt>注册时间</dt>
                <dd class="ai-num">{{ formatDateTime(userStore.profile.createdAt) }}</dd>
              </div>
              <div>
                <dt>最近登录</dt>
                <dd class="ai-num">{{ formatDateTime(userStore.profile.lastLoginAt) }}</dd>
              </div>
              <div>
                <dt>登录 IP</dt>
                <dd class="ai-num">{{ userStore.profile.lastLoginIp || '--' }}</dd>
              </div>
              <div>
                <dt>累计登录</dt>
                <dd class="ai-num">{{ userStore.profile.loginCount ?? 0 }} 次</dd>
              </div>
              <div>
                <dt>用户 ID</dt>
                <dd class="ai-num">{{ userStore.profile.id }}</dd>
              </div>
            </dl>
          </div>
        </section>

        <!-- ---------- 使用统计 ---------- -->
        <section class="ai-panel profile__panel">
          <header class="ai-panel__header">
            <div>
              <h3 class="ai-panel__title">使用概览</h3>
              <p class="ai-panel__subtitle">本地记录的平台使用情况</p>
            </div>
          </header>

          <div class="ai-panel__body profile__stats">
            <div class="profile__stat">
              <span class="profile__stat-label">收藏车型</span>
              <b class="ai-num">{{ carStore.favoriteCount }}</b>
              <el-button link type="primary" size="small" @click="scrollTo('favorites')">查看</el-button>
            </div>
            <div class="profile__stat">
              <span class="profile__stat-label">浏览记录</span>
              <b class="ai-num">{{ carStore.history.length }}</b>
              <el-button link type="primary" size="small" @click="scrollTo('history')">查看</el-button>
            </div>
            <div class="profile__stat">
              <span class="profile__stat-label">对比栏</span>
              <b class="ai-num">{{ carStore.compareCount }}</b>
              <el-button link type="primary" size="small" @click="$router.push('/compare')">查看</el-button>
            </div>
            <p class="profile__stat-hint">
              收藏、浏览与对比数据保存在浏览器本地，接入后端用户中心后可同步至账号。
            </p>
          </div>
        </section>
      </section>

      <!-- ---------- 收藏车型 ---------- -->
      <section id="favorites" class="profile__panel">
        <header class="profile__section-head">
          <h3 class="ai-section-title">我的收藏</h3>
          <span class="profile__section-count ai-num">{{ favoriteCars.length }} 款</span>
        </header>

        <LoadingState v-if="favoriteLoading" variant="chart" :height="180" />
        <EmptyState
          v-else-if="!favoriteCars.length"
          title="暂无收藏车型"
          description="在车型详情或车型列表中点击收藏，收藏记录会保存在这里"
          :icon="Star"
        >
          <el-button type="primary" plain @click="$router.push('/cars')">去逛逛车型中心</el-button>
        </EmptyState>
        <div v-else class="ai-cols ai-cols--4">
          <CarCard v-for="car in favoriteCars" :key="car.id" :car="car" :in-compare="carStore.inCompare(car.id)" @compare="onCompare">
            <template #default />
          </CarCard>
        </div>
      </section>

      <!-- ---------- 浏览记录 ---------- -->
      <section id="history" class="ai-panel profile__panel">
        <header class="ai-panel__header">
          <div>
            <h3 class="ai-panel__title">浏览记录</h3>
            <p class="ai-panel__subtitle">最近浏览的车型，最多保留 20 条</p>
          </div>
          <el-button size="small" :disabled="!historyCars.length" @click="onClearHistory">
            <el-icon><Delete /></el-icon>
            <span style="margin-left: 4px">清空记录</span>
          </el-button>
        </header>

        <LoadingState v-if="historyLoading" variant="table" :rows="4" :columns="5" />
        <EmptyState v-else-if="!historyCars.length" title="暂无浏览记录" compact />
        <ul v-else class="profile__history">
          <li v-for="car in historyCars" :key="car.id" class="profile__history-item" @click="goDetail(car.id)">
            <span class="profile__history-brand" :style="{ background: brandColor(car.brand) }">
              {{ car.brand.slice(0, 1) }}
            </span>
            <div class="profile__history-info">
              <span class="profile__history-name ai-truncate">{{ car.brand }} {{ car.name }}</span>
              <span class="profile__history-meta">{{ car.category }} · {{ ENERGY_SHORT[car.energyType] }}</span>
            </div>
            <span class="profile__history-price ai-num">{{ car.price.toFixed(2) }} 万</span>
            <span class="profile__history-sales ai-num">{{ formatCompact(car.sales) }} 辆</span>
            <el-icon :size="14" class="profile__history-arrow"><ArrowRight /></el-icon>
          </li>
        </ul>
      </section>
    </template>

    <ErrorState v-else message="用户信息加载失败" description="请重新加载页面或重新登录" @retry="onReload" />

    <!-- ---------- 编辑资料弹窗 ---------- -->
    <el-dialog v-model="editVisible" title="编辑资料" width="460px" align-center>
      <el-form :model="editForm" label-width="76px">
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称" maxlength="20" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="editForm.department" placeholder="请输入所属部门" maxlength="20" />
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight, Delete, EditPen, Star } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import CarCard from '@/components/car/CarCard.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { useUserStore } from '@/stores/user'
import { useCarStore } from '@/stores/car'
import { carApi } from '@/api/cars'
import { userApi } from '@/api/users'
import { ENERGY_SHORT } from '@/constants'
import { brandColor } from '@/utils/brand'
import { formatCompact, formatDateTime } from '@/utils/format'
import { PALETTE } from '@/charts/theme'
import type { Car } from '@/types'

/**
 * 个人中心
 * 资料展示与编辑（PUT /api/users/me）、收藏车型、浏览记录
 */

const router = useRouter()
const userStore = useUserStore()
const carStore = useCarStore()

const favoriteCars = ref<Car[]>([])
const historyCars = ref<Car[]>([])
const favoriteLoading = ref(false)
const historyLoading = ref(false)

const editVisible = ref(false)
const saving = ref(false)
const editForm = reactive({ nickname: '', email: '', phone: '', department: '' })

const avatarBg = computed(() => {
  const name = userStore.nickname || 'U'
  return PALETTE[name.charCodeAt(0) % PALETTE.length]
})

/** 批量拉取车型详情（收藏 / 浏览记录只保存 id） */
async function fetchCars(ids: number[]): Promise<Car[]> {
  if (!ids.length) return []
  const results = await Promise.allSettled(ids.map((id) => carApi.detail(id)))
  return results
    .filter((r): r is PromiseFulfilledResult<Car> => r.status === 'fulfilled')
    .map((r) => r.value)
}

async function loadFavorites(): Promise<void> {
  favoriteLoading.value = true
  try {
    favoriteCars.value = await fetchCars(carStore.favorites)
  } finally {
    favoriteLoading.value = false
  }
}

async function loadHistory(): Promise<void> {
  historyLoading.value = true
  try {
    historyCars.value = await fetchCars(carStore.history)
  } finally {
    historyLoading.value = false
  }
}

function openEdit(): void {
  const p = userStore.profile
  if (!p) return
  editForm.nickname = p.nickname ?? ''
  editForm.email = p.email ?? ''
  editForm.phone = p.phone ?? ''
  editForm.department = p.department ?? ''
  editVisible.value = true
}

async function onSave(): Promise<void> {
  saving.value = true
  try {
    const updated = await userApi.updateProfile({
      nickname: editForm.nickname,
      email: editForm.email,
      phone: editForm.phone,
      department: editForm.department
    })
    userStore.profile = updated
    editVisible.value = false
    ElMessage.success('资料已更新')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

function onClearHistory(): void {
  carStore.clearHistory()
  historyCars.value = []
  ElMessage.success('浏览记录已清空')
}

function goDetail(id: number): void {
  void router.push(`/cars/${id}`)
}

function onCompare(car: Car): void {
  const res = carStore.toggleCompare(car.id)
  if (!res.ok) {
    ElMessage.warning(res.message)
    return
  }
  ElMessage.success(carStore.inCompare(car.id) ? `已加入对比：${car.name}` : `已移出对比：${car.name}`)
}

function scrollTo(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function onReload(): Promise<void> {
  await userStore.fetchProfile()
}

watch(
  () => [...carStore.favorites],
  () => {
    void loadFavorites()
  }
)

onMounted(async () => {
  if (!userStore.profile && userStore.token) {
    await userStore.fetchProfile()
  }
  await Promise.all([loadFavorites(), loadHistory()])
})
</script>

<style scoped lang="scss">
.profile__panel {
  overflow: hidden;
  min-width: 0;
}

.profile__body {
  display: flex;
  flex-direction: column;
  gap: var(--ai-space-5);
}

.profile__identity {
  display: flex;
  align-items: center;
  gap: var(--ai-space-4);
  padding-bottom: var(--ai-space-4);
  border-bottom: 1px solid var(--ai-border);
}

.profile__avatar {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: var(--ai-radius-md);
  color: #fff;
  font-size: 20px;
  font-weight: var(--ai-fw-semibold);
  flex-shrink: 0;
}

.profile__identity-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.profile__nickname {
  font-size: var(--ai-fs-h3);
  font-weight: var(--ai-fw-semibold);
  color: var(--ai-text-1);
}

.profile__identity-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.profile__info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--ai-space-4) var(--ai-space-5);
  margin: 0;

  div { min-width: 0; }

  dt {
    font-size: var(--ai-fs-xs);
    color: var(--ai-text-3);
    margin-bottom: 5px;
  }

  dd {
    margin: 0;
    font-size: var(--ai-fs-sm);
    color: var(--ai-text-1);
    word-break: break-all;
  }
}

/* ---------- 使用概览 ---------- */
.profile__stats {
  display: flex;
  flex-direction: column;
  gap: var(--ai-space-3);
}

.profile__stat {
  display: flex;
  align-items: center;
  gap: var(--ai-space-3);
  padding: 10px var(--ai-space-3);
  border: 1px solid var(--ai-border);
  border-radius: var(--ai-radius-sm);
  background: var(--ai-bg-subtle);

  b {
    font-size: 18px;
    color: var(--ai-text-1);
    margin-left: auto;
  }
}

.profile__stat-label {
  font-size: var(--ai-fs-sm);
  color: var(--ai-text-2);
}

.profile__stat-hint {
  margin-top: var(--ai-space-2);
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-4);
  line-height: var(--ai-lh-loose);
}

/* ---------- 收藏 ---------- */
.profile__section-head {
  display: flex;
  align-items: center;
  gap: var(--ai-space-3);
  margin-bottom: var(--ai-space-3);
}

.profile__section-count {
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-3);
}

/* ---------- 浏览记录 ---------- */
.profile__history {
  display: flex;
  flex-direction: column;
}

.profile__history-item {
  display: flex;
  align-items: center;
  gap: var(--ai-space-3);
  padding: 12px var(--ai-space-5);
  border-bottom: 1px solid var(--ai-border);
  cursor: pointer;
  transition: background var(--ai-duration-base) var(--ai-ease);

  &:last-child { border-bottom: 0; }

  &:hover {
    background: var(--ai-bg-subtle);

    .profile__history-arrow { color: var(--ai-brand); transform: translateX(2px); }
  }
}

.profile__history-brand {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: var(--ai-radius-xs);
  color: #fff;
  font-size: var(--ai-fs-xs);
  font-weight: 600;
  flex-shrink: 0;
}

.profile__history-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
  line-height: 1.35;
}

.profile__history-name {
  font-size: var(--ai-fs-sm);
  color: var(--ai-text-1);
}

.profile__history-meta {
  font-size: 10px;
  color: var(--ai-text-4);
}

.profile__history-price {
  flex-shrink: 0;
  font-size: var(--ai-fs-xs);
  color: var(--ai-warn);
}

.profile__history-sales {
  flex-shrink: 0;
  width: 78px;
  text-align: right;
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-3);
}

.profile__history-arrow {
  flex-shrink: 0;
  color: var(--ai-text-4);
  transition: all var(--ai-duration-base) var(--ai-ease);
}

@media (max-width: 768px) {
  .profile__history-sales { display: none; }
}
</style>
