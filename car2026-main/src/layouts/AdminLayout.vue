<template>
  <div class="admin-layout">
    <AdminSidebar :collapsed="appStore.adminSidebarCollapsed" @toggle="appStore.toggleAdminSidebar()" />

    <div class="admin-layout__main">
      <header class="admin-layout__topbar">
        <div class="admin-layout__crumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">AutoInsight</el-breadcrumb-item>
            <el-breadcrumb-item>企业管理后台</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="admin-layout__actions">
          <el-button size="small" @click="$router.push('/dashboard')">
            <el-icon><Odometer /></el-icon>
            <span style="margin-left: 4px">返回数据平台</span>
          </el-button>
          <StatusTag :status="userStore.role" :dot="false" />
          <span class="admin-layout__user">{{ userStore.nickname }}</span>
        </div>
      </header>

      <main class="admin-layout__body">
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
import { useRoute } from 'vue-router'
import { Odometer } from '@element-plus/icons-vue'
import AdminSidebar from '@/components/layout/AdminSidebar.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()

const currentTitle = computed(() => String(route.meta.title ?? ''))
</script>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--ai-bg-base);
}

.admin-layout__main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.admin-layout__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ai-space-4);
  height: var(--ai-header-height);
  padding: 0 var(--ai-space-6);
  border-bottom: 1px solid var(--ai-border);
  background: rgba(11, 15, 22, 0.86);
  backdrop-filter: blur(14px);
  flex-shrink: 0;
}

.admin-layout__crumb {
  min-width: 0;

  :deep(.el-breadcrumb__item) { font-size: var(--ai-fs-xs); }
}

.admin-layout__actions {
  display: flex;
  align-items: center;
  gap: var(--ai-space-3);
  flex-shrink: 0;
}

.admin-layout__user {
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-2);
}

.admin-layout__body {
  flex: 1;
  min-width: 0;
  overflow-x: hidden;
}

@media (max-width: 1024px) {
  .admin-layout__topbar { padding: 0 var(--ai-space-4); }
  .admin-layout__user { display: none; }
}
</style>
