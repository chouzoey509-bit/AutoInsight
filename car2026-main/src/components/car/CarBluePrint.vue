<template>
  <div class="blueprint">
    <svg v-for="view in views" :key="view.key" class="blueprint__view" :viewBox="view.box" :aria-label="view.label" preserveAspectRatio="xMidYMid meet">
      <g :fill="ink" :fill-rule="'evenodd'">
        <path :d="view.d" />
      </g>
    </svg>
    <span class="blueprint__caption">{{ caption }}</span>
  </div>
</template>

<script setup lang="ts">
import sidePath from '@/assets/intro/car-side.svg?raw'
import frontPath from '@/assets/intro/car-front.svg?raw'
import topPath from '@/assets/intro/car-top.svg?raw'

/**
 * 汽车三视图蓝图（正侧 / 正前 / 俯视）
 * SVG 源文件为单 path 剪影，通过 ?raw 提取 path 与 viewBox，
 * 填充色跟随 ink 属性，保证黑白视觉系统下任意底色可用。
 */
withDefaults(
  defineProps<{
    /** 描线颜色 */
    ink?: string
    caption?: string
  }>(),
  { ink: '#111111', caption: 'THREE-VIEW BLUEPRINT · 1 : 1' }
)

const extract = (raw: string): { box: string; d: string } => {
  const box = raw.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 2048 1880'
  const d = raw.match(/ d="([^"]+)"/)?.[1] ?? ''
  return { box, d }
}

const side = extract(sidePath)
const front = extract(frontPath)
const top = extract(topPath)

const views = [
  { key: 'side', label: '侧视图', box: side.box, d: side.d },
  { key: 'front', label: '前视图', box: front.box, d: front.d },
  { key: 'top', label: '俯视图', box: top.box, d: top.d }
]
</script>

<style scoped lang="scss">
.blueprint {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ai-space-3);
  width: 100%;
}

.blueprint__view {
  width: 100%;
  height: auto;
  padding: 8px;
  background:
    linear-gradient(rgba(17, 17, 17, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(17, 17, 17, 0.035) 1px, transparent 1px);
  background-size: 22px 22px;
  border: 1px solid var(--ai-border);
}

.blueprint__caption {
  grid-column: 1 / -1;
  color: var(--ai-text-4);
  font-family: var(--ai-font-mono);
  font-size: 9px;
  letter-spacing: 0.12em;
  text-align: right;
}

@media (max-width: 768px) {
  .blueprint { grid-template-columns: minmax(0, 1fr); }
}
</style>
