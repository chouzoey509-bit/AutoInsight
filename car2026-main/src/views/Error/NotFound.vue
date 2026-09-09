<template>
  <div class="error-page">
    <div class="error-page__inner">
      <div class="error-page__code">
        <span class="error-page__code-text">{{ code }}</span>
        <span class="error-page__code-glow" />
      </div>

      <h1 class="error-page__title">{{ title }}</h1>
      <p class="error-page__desc">{{ description }}</p>

      <div v-if="detail" class="error-page__detail">
        <el-icon :size="13"><InfoFilled /></el-icon>
        <span>{{ detail }}</span>
      </div>

      <div class="error-page__actions">
        <el-button type="primary" @click="goHome">
          <el-icon><Odometer /></el-icon>
          <span style="margin-left: 4px">返回首页</span>
        </el-button>
        <el-button @click="goBack">
          <el-icon><Back /></el-icon>
          <span style="margin-left: 4px">返回上一页</span>
        </el-button>
        <el-button v-if="isForbidden" plain @click="$router.push('/login')">
          <el-icon><SwitchButton /></el-icon>
          <span style="margin-left: 4px">切换账号</span>
        </el-button>
      </div>

      <ul class="error-page__links">
        <li v-for="item in quickLinks" :key="item.path">
          <router-link :to="item.path">
            <el-icon :size="12"><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Back,
  DataLine,
  Grid,
  InfoFilled,
  MagicStick,
  Odometer,
  SwitchButton,
  TrendCharts
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { ROLE_HOME } from '@/router'

/**
 * 404 / 403 统一页面
 * 通过路由 meta.forbidden 区分「页面不存在」与「无访问权限」
 */

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isForbidden = computed(() => Boolean(route.meta.forbidden))

const code = computed(() => (isForbidden.value ? '403' : '404'))
const title = computed(() => (isForbidden.value ? '无访问权限' : '页面不存在'))
const description = computed(() =>
  isForbidden.value
    ? '当前账号角色无权访问该页面，已为你返回可访问的首页。如需访问请联系系统管理员调整权限。'
    : '你访问的页面地址不存在或已被移除，请检查链接是否正确，或从下方入口继续浏览平台。'
)

const detail = computed(() => {
  if (isForbidden.value) {
    return `当前角色：${userStore.role || '未登录'}`
  }
  return route.fullPath && route.fullPath !== '/' ? `请求地址：${route.fullPath}` : ''
})

const quickLinks = [
  { path: '/dashboard', title: '数据驾驶舱', icon: Odometer },
  { path: '/market', title: '汽车市场分析', icon: DataLine },
  { path: '/cars', title: '车型中心', icon: Grid },
  { path: '/recommend', title: '智能购车推荐', icon: MagicStick },
  { path: '/predict', title: '销量预测', icon: TrendCharts }
]

function goHome(): void {
  const home = userStore.role ? ROLE_HOME[userStore.role] : '/dashboard'
  void router.replace(home)
}

function goBack(): void {
  if (window.history.length > 1) router.back()
  else void router.replace('/dashboard')
}
</script>

<style scoped lang="scss">
.error-page {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: var(--ai-space-8) var(--ai-space-5);
  background:
    radial-gradient(900px 420px at 50% -10%, rgba(46, 124, 246, 0.09), transparent 70%),
    var(--ai-bg-base);
}

.error-page__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 560px;
  animation: ai-fade-up var(--ai-duration-slow) var(--ai-ease) both;
}

.error-page__code {
  position: relative;
  display: grid;
  place-items: center;
  margin-bottom: var(--ai-space-4);
}

.error-page__code-text {
  font-family: var(--ai-font-mono);
  font-size: 108px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.04em;
  background: linear-gradient(135deg, var(--ai-brand), var(--ai-nev));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.error-page__code-glow {
  position: absolute;
  inset: -30% -10%;
  background: radial-gradient(circle at 50% 50%, rgba(46, 124, 246, 0.16), transparent 62%);
  filter: blur(18px);
  pointer-events: none;
}

.error-page__title {
  font-size: var(--ai-fs-h1);
  font-weight: var(--ai-fw-semibold);
  color: var(--ai-text-1);
}

.error-page__desc {
  margin-top: 12px;
  font-size: var(--ai-fs-sm);
  color: var(--ai-text-2);
  line-height: var(--ai-lh-loose);
}

.error-page__detail {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: var(--ai-space-4);
  padding: 6px 12px;
  border: 1px dashed var(--ai-border-dashed);
  border-radius: var(--ai-radius-pill);
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-3);

  .el-icon { color: var(--ai-text-4); }
}

.error-page__actions {
  display: flex;
  align-items: center;
  gap: var(--ai-space-3);
  margin-top: var(--ai-space-6);
  flex-wrap: wrap;
  justify-content: center;
}

.error-page__links {
  display: flex;
  align-items: center;
  gap: var(--ai-space-2);
  margin-top: var(--ai-space-8);
  padding-top: var(--ai-space-5);
  border-top: 1px solid var(--ai-border);
  flex-wrap: wrap;
  justify-content: center;

  a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: var(--ai-radius-sm);
    border: 1px solid var(--ai-border);
    background: var(--ai-bg-subtle);
    font-size: var(--ai-fs-xs);
    color: var(--ai-text-2);
    transition: all var(--ai-duration-base) var(--ai-ease);

    &:hover {
      border-color: var(--ai-border-brand);
      color: #8ab4ff;
      background: var(--ai-brand-ghost);
    }
  }
}
</style>
