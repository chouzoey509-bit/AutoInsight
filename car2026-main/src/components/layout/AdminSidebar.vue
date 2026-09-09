<template>
  <aside class="admin-sidebar" :class="{ 'is-collapsed': collapsed }">
    <div class="admin-sidebar__head">
      <span class="admin-sidebar__title">{{ collapsed ? '管理' : '企业管理后台' }}</span>
      <button class="admin-sidebar__collapse" type="button" @click="emit('toggle')">
        <el-icon :size="14">
          <Fold v-if="!collapsed" />
          <Expand v-else />
        </el-icon>
      </button>
    </div>

    <el-scrollbar class="admin-sidebar__scroll">
      <el-menu
        :default-active="activePath"
        :collapse="collapsed"
        :collapse-transition="false"
        unique-opened
        router
      >
        <el-menu-item v-for="item in menus" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-scrollbar>

    <div class="admin-sidebar__foot">
      <div v-if="!collapsed" class="admin-sidebar__tip">
        <el-icon :size="13"><InfoFilled /></el-icon>
        <span>示例数据环境，仅用于功能演示</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Box, Collection, Cpu, DataBoard, Document, Expand, Fold,
  Grid, Histogram, InfoFilled, Setting, Tickets, User
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { routes } from '@/router'

defineProps<{ collapsed?: boolean }>()
const emit = defineEmits<{ (e: 'toggle'): void }>()

const route = useRoute()
const userStore = useUserStore()

/** 图标名 → 组件映射（图标名来自路由 meta.icon） */
const ICONS: Record<string, unknown> = {
  DataBoard, User, Collection, Grid, Histogram, Box, Tickets, Cpu, Document, FolderOpened: Document, Setting
}

/** 后台菜单：来自 /admin 路由子项，按角色过滤 */
const menus = computed(() => {
  const admin = routes.find((r) => r.path === '/admin')
  const children = (admin?.children ?? []) as { path: string; meta?: Record<string, unknown> }[]
  return children
    .filter((c) => {
      const roles = (c.meta?.roles ?? []) as string[]
      return userStore.hasRole(roles as never)
    })
    .map((c) => ({
      path: `/admin/${c.path}`,
      title: String(c.meta?.title ?? c.path),
      icon: ICONS[String(c.meta?.icon ?? 'Document')] ?? Document
    }))
})

const activePath = computed(() => route.path)
</script>

<style scoped lang="scss">
.admin-sidebar {
  display: flex;
  flex-direction: column;
  width: var(--ai-sidebar-width);
  flex-shrink: 0;
  background: var(--ai-bg-panel);
  border-right: 1px solid var(--ai-border);
  transition: width var(--ai-duration-base) var(--ai-ease);

  &.is-collapsed { width: var(--ai-sidebar-collapsed); }
}

.admin-sidebar__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ai-space-2);
  height: var(--ai-header-height);
  padding: 0 var(--ai-space-4);
  border-bottom: 1px solid var(--ai-border);
  flex-shrink: 0;
}

.admin-sidebar__title {
  font-size: var(--ai-fs-sm);
  font-weight: 600;
  color: var(--ai-text-1);
  white-space: nowrap;
  overflow: hidden;
}

.admin-sidebar__collapse {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: var(--ai-radius-xs);
  border: 1px solid var(--ai-border);
  background: transparent;
  color: var(--ai-text-3);
  cursor: pointer;
  flex-shrink: 0;

  &:hover { color: var(--ai-text-1); border-color: var(--ai-border-strong); }
}

.admin-sidebar__scroll {
  flex: 1;
  padding: var(--ai-space-3) var(--ai-space-2);

  :deep(.el-menu) { background: transparent; }
  :deep(.el-menu-item) { position: relative; margin-bottom: 2px; }
}

.admin-sidebar__foot {
  padding: var(--ai-space-3) var(--ai-space-4);
  border-top: 1px solid var(--ai-border);
}

.admin-sidebar__tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--ai-fs-mini);
  color: var(--ai-text-4);
  line-height: 1.4;
}
</style>
