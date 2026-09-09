<template>
  <div class="car-thumb" :style="{ height: cssHeight }">
    <svg viewBox="0 0 240 110" preserveAspectRatio="xMidYMid meet" class="car-thumb__svg">
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" :stop-color="color" stop-opacity="0.34" />
          <stop offset="100%" :stop-color="color" stop-opacity="0.05" />
        </linearGradient>
      </defs>

      <rect width="240" height="110" :fill="`url(#${gradientId})`" />

      <!-- 技术感网格 -->
      <g stroke="rgba(255,255,255,0.045)" stroke-width="0.6">
        <line v-for="x in 7" :key="`v${x}`" :x1="x * 30" y1="0" :x2="x * 30" y2="110" />
        <line v-for="y in 3" :key="`h${y}`" x1="0" :y1="y * 27" x2="240" :y2="y * 27" />
      </g>

      <!-- 车身 -->
      <path
        d="M18 78 L27 55 Q31 46 42 43 L71 35 Q97 23 129 23 Q162 23 184 37 L213 46 Q227 50 227 63 L227 78 Z"
        fill="rgba(255,255,255,0.92)"
      />
      <!-- 车窗 -->
      <path d="M74 37 L93 27 Q129 21 159 28 L173 38 Z" fill="rgba(11,15,22,0.62)" />
      <!-- 腰线 -->
      <path d="M30 62 L224 62" stroke="rgba(11,15,22,0.14)" stroke-width="1.2" />
      <!-- 车轮 -->
      <circle cx="66" cy="78" r="17" fill="#0b0f16" />
      <circle cx="66" cy="78" r="7.5" fill="rgba(255,255,255,0.22)" />
      <circle cx="180" cy="78" r="17" fill="#0b0f16" />
      <circle cx="180" cy="78" r="7.5" fill="rgba(255,255,255,0.22)" />
    </svg>

    <div class="car-thumb__brand" :style="{ color }">{{ brand }}</div>
    <div v-if="showName" class="car-thumb__name">{{ name }}</div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 车型图形占位
 * 后端接入后若返回真实 image 字段，可替换为 <img :src="image" />
 * 当前阶段使用品牌主色 + 车身剪影，保证离线可用与视觉统一
 */
const props = withDefaults(
  defineProps<{
    brand: string
    name?: string
    color?: string
    height?: number | string
    showName?: boolean
    /** 用于保证同页面多个实例的渐变 id 唯一 */
    seed?: string | number
  }>(),
  { color: '#2e7cf6', height: 130, showName: false, seed: 'c' }
)

const gradientId = computed(() => `car-thumb-${String(props.seed).replace(/[^a-zA-Z0-9]/g, '')}-${props.brand.length}`)
const cssHeight = computed(() => (typeof props.height === 'number' ? `${props.height}px` : props.height))
</script>

<style scoped lang="scss">
.car-thumb {
  position: relative;
  width: 100%;
  border-radius: var(--ai-radius-sm);
  overflow: hidden;
  background: var(--ai-bg-elevated);
  border: 1px solid var(--ai-border);
}

.car-thumb__svg {
  width: 100%;
  height: 100%;
  display: block;
}

.car-thumb__brand {
  position: absolute;
  left: 10px;
  top: 8px;
  font-size: var(--ai-fs-mini);
  font-weight: var(--ai-fw-semibold);
  letter-spacing: 0.08em;
  opacity: 0.9;
}

.car-thumb__name {
  position: absolute;
  left: 10px;
  bottom: 8px;
  font-size: var(--ai-fs-mini);
  color: var(--ai-text-2);
  max-width: 88%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
