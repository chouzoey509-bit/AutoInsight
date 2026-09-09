<template>
  <header class="app-header">
    <div class="app-header__inner">
      <button class="app-header__brand" type="button" @click="router.push('/dashboard')">
        <span class="app-header__logo">AI</span>
        <span class="app-header__brand-copy">
          <strong>AUTOINSIGHT</strong>
          <small>汽车行业数据智能平台</small>
        </span>
      </button>

      <nav class="app-header__nav" aria-label="主导航">
        <button
          v-for="item in menus"
          :key="item.path"
          type="button"
          class="app-header__nav-item"
          :class="{ 'is-active': isActive(item.path) }"
          @click="router.push(item.path)"
        >
          {{ item.title }}
        </button>
      </nav>

      <div class="app-header__actions">
        <span class="app-header__meta">DATA / 2026</span>
        <el-popover placement="bottom-end" :width="340" trigger="click" popper-class="notice-popper">
          <template #reference>
            <button class="app-header__icon-btn" type="button" aria-label="通知">
              <el-badge :value="appStore.unreadCount" :hidden="!appStore.unreadCount" :max="9">
                <el-icon :size="15"><Bell /></el-icon>
              </el-badge>
            </button>
          </template>
          <div class="notice">
            <header class="notice__head">
              <span>通知中心</span>
              <el-button link type="primary" size="small" @click="appStore.markAllRead()">全部已读</el-button>
            </header>
            <ul class="notice__list">
              <li v-for="n in appStore.notices" :key="n.id" class="notice__item" :class="{ 'is-read': n.read }">
                <span class="notice__dot" :class="`is-${n.type}`" />
                <div class="notice__content">
                  <p class="notice__title">{{ n.title }}</p>
                  <p class="notice__desc">{{ n.desc }}</p>
                  <span class="notice__time">{{ n.time }}</span>
                </div>
              </li>
            </ul>
          </div>
        </el-popover>

        <el-dropdown trigger="click" @command="onCommand">
          <button class="app-header__user" type="button">
            <span class="app-header__avatar">{{ userStore.avatarText }}</span>
            <span class="app-header__username">{{ userStore.nickname }}</span>
            <el-icon :size="12"><ArrowDown /></el-icon>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile"><el-icon><User /></el-icon><span>个人中心</span></el-dropdown-item>
              <el-dropdown-item v-if="userStore.isAdmin" command="admin"><el-icon><Setting /></el-icon><span>管理后台</span></el-dropdown-item>
              <el-dropdown-item v-if="userStore.role === 'sales'" command="adminOrders"><el-icon><Tickets /></el-icon><span>订单管理</span></el-dropdown-item>
              <el-dropdown-item command="logout" divided><el-icon><SwitchButton /></el-icon><span>退出登录</span></el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, Bell, Setting, SwitchButton, Tickets, User } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { routes } from '@/router'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const appStore = useAppStore()

const menus = computed(() => {
  const main = routes.find((r) => r.path === '/')
  const children = (main?.children ?? []) as { path: string; meta?: Record<string, unknown> }[]
  return children
    .filter((c) => {
      const meta = c.meta ?? {}
      if (meta.hidden) return false
      const roles = meta.roles as string[] | undefined
      return userStore.hasRole(roles as never)
    })
    .map((c) => ({ path: `/${c.path}`, title: String(c.meta?.title ?? c.path) }))
})

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(`${path}/`)
}

function onCommand(command: string): void {
  if (command === 'profile') void router.push('/profile')
  if (command === 'admin') void router.push('/admin/overview')
  if (command === 'adminOrders') void router.push('/admin/orders')
  if (command === 'logout') {
    void ElMessageBox.confirm('确认退出当前账号？', '退出登录', {
      type: 'warning',
      confirmButtonText: '退出',
      cancelButtonText: '取消'
    }).then(() => {
      userStore.logout()
      void router.push('/login')
    }).catch(() => undefined)
  }
}
</script>

<style scoped lang="scss">
.app-header {
  position: sticky;
  top: 0;
  z-index: var(--ai-z-header);
  height: var(--ai-header-height);
  padding: 0 48px;
  background: var(--ai-bg-panel);
  border-bottom: 1px solid var(--ai-border);
}

.app-header__inner {
  display: flex;
  align-items: center;
  gap: 28px;
  width: 100%;
  max-width: 1344px;
  height: 100%;
  margin: 0 auto;
}

.app-header__brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ai-text-1);
  cursor: pointer;
  text-align: left;
}

.app-header__logo {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  background: var(--ai-brand);
  color: var(--ai-text-inverse);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.app-header__brand-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.1;
}

.app-header__brand-copy strong {
  font-size: 15px;
  letter-spacing: 0.02em;
}

.app-header__brand-copy small {
  color: var(--ai-text-4);
  font-size: 10px;
  font-weight: 400;
}

.app-header__nav {
  display: none;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

/* 侧栏在窄屏隐藏时，顶部导航兜底 */
@media (max-width: 720px) {
  .app-header__nav { display: flex; }
}

.app-header__nav::-webkit-scrollbar { display: none; }

.app-header__nav-item {
  position: relative;
  flex: 0 0 auto;
  padding: 10px 14px;
  border: 0;
  background: transparent;
  color: var(--ai-text-3);
  font-size: 13px;
  cursor: pointer;
  transition: color var(--ai-duration-base) var(--ai-ease);
}

.app-header__nav-item:hover,
.app-header__nav-item.is-active { color: var(--ai-text-1); }

.app-header__nav-item.is-active::after {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 4px;
  height: 2px;
  background: var(--ai-brand);
}

.app-header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
}

.app-header__meta {
  color: var(--ai-text-4);
  font-family: var(--ai-font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
}

.app-header__icon-btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--ai-border);
  background: var(--ai-bg-panel);
  color: var(--ai-text-2);
  cursor: pointer;
}

.app-header__user {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 4px 4px;
  border: 1px solid var(--ai-border);
  background: var(--ai-bg-panel);
  color: var(--ai-text-2);
  cursor: pointer;
}

.app-header__avatar {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  background: var(--ai-brand);
  color: var(--ai-text-inverse);
  font-size: 10px;
  font-weight: 600;
}

.app-header__username {
  max-width: 86px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}

@media (max-width: 1280px) {
  .app-header { padding-inline: 24px; }
  .app-header__inner { gap: 18px; }
  .app-header__brand-copy small,
  .app-header__meta { display: none; }
}

@media (max-width: 900px) {
  .app-header { padding-inline: 16px; }
  .app-header__brand-copy { display: none; }
  .app-header__nav-item { padding-inline: 10px; }
  .app-header__username { display: none; }
}
</style>

<style lang="scss">
.notice__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--ai-border);
  font-size: 13px;
  color: var(--ai-text-1);
  font-weight: 600;
}
.notice__list { max-height: 340px; overflow-y: auto; }
.notice__item { display: flex; gap: 10px; padding: 10px 4px; border-bottom: 1px solid var(--ai-border); }
.notice__item.is-read { opacity: 0.55; }
.notice__dot { width: 6px; height: 6px; margin-top: 6px; flex: 0 0 auto; border-radius: 50%; background: var(--ai-text-3); }
.notice__content { min-width: 0; flex: 1; }
.notice__title { font-size: 12px; color: var(--ai-text-1); }
.notice__desc { margin-top: 3px; font-size: 11px; line-height: 1.5; color: var(--ai-text-3); }
.notice__time { display: block; margin-top: 4px; font-size: 10px; color: var(--ai-text-4); }
</style>
