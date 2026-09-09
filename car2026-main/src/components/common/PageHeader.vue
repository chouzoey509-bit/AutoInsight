<template>
  <header class="page-header">
    <div class="page-header__main">
      <div class="page-header__title-row">
        <h1 class="page-header__title">{{ title }}</h1>
        <slot name="tags" />
      </div>

      <div class="page-header__meta">
        <span v-if="updatedAt" class="page-header__meta-item">
          {{ updatedAt }}
        </span>
        <span v-if="source" class="page-header__meta-item">
          <span class="page-header__dot" />
          {{ source }}
        </span>
        <slot name="meta" />
      </div>
    </div>

    <div class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    updatedAt?: string
    source?: string
    mock?: boolean
    breadcrumbs?: { title: string }[]
  }>(),
  { breadcrumbs: () => [] }
)
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ai-space-4);
  flex-wrap: wrap;
  min-height: 54px;
}

.page-header__title-row {
  display: flex;
  align-items: center;
  gap: var(--ai-space-3);
  flex-wrap: wrap;
}

.page-header__title {
  font-size: var(--ai-fs-h1);
  font-weight: var(--ai-fw-semibold);
  color: var(--ai-text-1);
  letter-spacing: 0;
  line-height: 1.25;
}

.page-header__meta {
  display: flex;
  align-items: center;
  gap: var(--ai-space-3);
  margin-top: 6px;
  flex-wrap: wrap;
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-4);
}

.page-header__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.page-header__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--ai-nev);
}

.page-header__actions {
  display: flex;
  align-items: center;
  gap: var(--ai-space-3);
  flex-wrap: wrap;
}
</style>

