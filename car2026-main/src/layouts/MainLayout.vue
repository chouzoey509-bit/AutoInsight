<template>
  <div class="main-layout">
    <aside class="main-layout__sidebar">
      <button class="main-layout__brand" type="button" aria-label="返回首页" @click="router.push('/dashboard')">AI</button>

      <nav class="main-layout__side-nav" aria-label="主导航">
        <button
          v-for="item in sideMenus"
          :key="item.path"
          type="button"
          class="main-layout__side-item"
          :class="{ 'is-active': isActive(item.path) }"
          :title="item.title"
          :aria-label="item.title"
          @click="router.push(item.path)"
        >
          <el-icon :size="17"><component :is="item.icon" /></el-icon>
        </button>
      </nav>

      <button class="main-layout__side-user" type="button" :title="userStore.nickname" @click="router.push('/profile')">
        {{ userStore.avatarText }}
      </button>
    </aside>

    <div class="main-layout__content">
      <AppHeader />
      <main class="main-layout__body">
        <router-view v-slot="{ Component }">
          <transition name="fade-up" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DataAnalysis, DataLine, Grid, MagicStick, Odometer, Operation, TrendCharts } from '@element-plus/icons-vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import { routes } from '@/router'
import { useUserStore } from '@/stores/user'

/**
 * UI V2 布局：88px 独立图标侧栏 + 72px 顶部信息栏
 * 侧栏承载全部主导航，Header 只保留品牌与用户区
 */
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const iconMap: Record<string, unknown> = { Odometer, DataLine, DataAnalysis, Grid, Operation, MagicStick, TrendCharts }

const sideMenus = computed(() => {
  const main = routes.find((r) => r.path === '/')
  const children = (main?.children ?? []) as { path: string; meta?: Record<string, unknown> }[]
  return children
    .filter((c) => {
      const meta = c.meta ?? {}
      if (meta.hidden) return false
      const roles = meta.roles as string[] | undefined
      return userStore.hasRole(roles as never)
    })
    .map((c) => ({ path: `/${c.path}`, title: String(c.meta?.title ?? c.path), icon: iconMap[String(c.meta?.icon ?? 'Grid')] ?? Grid }))
})

function isActive(path: string): boolean { return route.path === path || route.path.startsWith(`${path}/`) }
</script>

<style scoped lang="scss">
.main-layout { min-height: 100vh; background: var(--ai-bg-base); color: var(--ai-text-1); }

.main-layout__sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: var(--ai-z-sidebar);
  display: flex;
  width: var(--ai-sidebar-width);
  flex-direction: column;
  align-items: center;
  padding: 16px 0 20px;
  border-right: 1px solid var(--ai-border);
  background: var(--ai-bg-panel);
}

.main-layout__brand {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  background: var(--ai-brand);
  color: var(--ai-text-inverse);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
}

.main-layout__side-nav {
  display: flex;
  flex: 1;
  width: 100%;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-top: 36px;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar { display: none; }
}

.main-layout__side-item {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--ai-text-4);
  cursor: pointer;
  transition: color var(--ai-duration-base) var(--ai-ease), background var(--ai-duration-base) var(--ai-ease), border-color var(--ai-duration-base) var(--ai-ease);
}

.main-layout__side-item:hover { color: var(--ai-text-1); border-color: var(--ai-border); }

.main-layout__side-item.is-active {
  background: var(--ai-brand);
  border-color: var(--ai-brand);
  color: var(--ai-text-inverse);
}

.main-layout__side-user {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-top: 12px;
  border: 1px solid var(--ai-border);
  background: var(--ai-bg-subtle);
  color: var(--ai-text-2);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color var(--ai-duration-base) var(--ai-ease);

  &:hover { border-color: var(--ai-border-strong); }
}

.main-layout__content { min-width: 0; min-height: 100vh; margin-left: var(--ai-sidebar-width); }

.main-layout__body { width: 100%; min-width: 0; overflow-x: hidden; }

@media (max-width: 900px) {
  .main-layout__sidebar { width: 64px; }
  .main-layout__content { margin-left: 64px; }
}

@media (max-width: 720px) {
  .main-layout__sidebar { display: none; }
  .main-layout__content { margin-left: 0; }
}
</style>
