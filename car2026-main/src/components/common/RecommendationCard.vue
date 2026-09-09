<template>
  <article class="rec-card ai-panel ai-panel--hoverable" :class="{ 'is-top': rank === 1 }">
    <div class="rec-card__media">
      <CarThumb :brand="item.brand" :color="color" :height="rank === 1 ? 148 : 112" :seed="item.carId" />
      <span class="rec-card__rank" :class="{ 'is-top': rank === 1 }">No.{{ rank }}</span>
    </div>

    <div class="rec-card__body">
      <header class="rec-card__head">
        <div class="rec-card__title">
          <h4 class="ai-truncate">{{ item.carName }}</h4>
          <div class="rec-card__meta">
            <span class="ai-tag ai-tag--brand">{{ formatPrice(item.price) }}</span>
            <span class="ai-tag ai-tag--nev">{{ ENERGY_SHORT[item.energyType] }}</span>
            <span class="ai-tag">{{ item.range ? `续航 ${item.range}km` : '燃油' }}</span>
          </div>
        </div>

        <div class="rec-card__score">
          <div class="rec-card__ring" :style="{ background: ringStyle }">
            <div class="rec-card__ring-inner">
              <b class="ai-num">{{ item.score.toFixed(1) }}</b>
              <span>%</span>
            </div>
          </div>
          <span class="rec-card__score-label">匹配度</span>
        </div>
      </header>

      <p class="rec-card__reason">
        <el-icon :size="13"><MagicStick /></el-icon>
        <span>{{ item.reason }}</span>
      </p>

      <div v-if="showDimensions" class="rec-card__dims">
        <ScoreBar
          v-for="dim in displayDimensions"
          :key="dim.key"
          :label="dim.label"
          :score="dim.score"
          :color="dimColor(dim.score)"
        />
      </div>

      <div class="rec-card__highlights">
        <span v-for="h in item.highlights" :key="h" class="ai-tag ai-tag--purple">{{ h }}</span>
      </div>

      <footer class="rec-card__foot">
        <span class="rec-card__rating">
          <el-rate :model-value="item.rating" disabled size="small" :max="5" />
          <em class="ai-num">{{ item.rating.toFixed(1) }}</em>
        </span>
        <div class="rec-card__actions">
          <el-button size="small" text @click="$router.push(`/predict?carId=${item.carId}`)">销量预测</el-button>
          <el-button size="small" type="primary" plain @click="$router.push(`/cars/${item.carId}`)">查看详情</el-button>
        </div>
      </footer>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MagicStick } from '@element-plus/icons-vue'
import CarThumb from '@/components/car/CarThumb.vue'
import ScoreBar from './ScoreBar.vue'
import type { Recommendation } from '@/types'
import { ENERGY_SHORT } from '@/constants'
import { brandColor } from '@/utils/brand'
import { formatPrice } from '@/utils/format'
import { PALETTE, withAlpha } from '@/charts/theme'

const props = withDefaults(
  defineProps<{
    item: Recommendation
    rank: number
    /** 是否展示维度评分条（第一位推荐默认展开） */
    showDimensions?: boolean
  }>(),
  { showDimensions: false }
)

const color = computed(() => brandColor(props.item.brand))
const ringStyle = computed(
  () => `conic-gradient(${PALETTE[1]} 0% ${props.item.score}%, ${withAlpha('#ffffff', 0.08)} ${props.item.score}% 100%)`
)
const displayDimensions = computed(() => props.item.dimensions.slice(0, 4))

function dimColor(score: number): string {
  if (score >= 85) return PALETTE[1]
  if (score >= 70) return PALETTE[0]
  if (score >= 55) return PALETTE[2]
  return PALETTE[5]
}
</script>

<style scoped lang="scss">
.rec-card {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  overflow: hidden;
  min-width: 0;
}

.rec-card.is-top {
  border-color: var(--ai-border-brand);
  box-shadow: var(--ai-shadow-glow);
}

.rec-card__media {
  position: relative;
  display: flex;
}

.rec-card__media :deep(.car-thumb) {
  border: 0;
  border-radius: 0;
  border-right: 1px solid var(--ai-border);
}

.rec-card__rank {
  position: absolute;
  left: 10px;
  bottom: 10px;
  padding: 2px 8px;
  border-radius: var(--ai-radius-xs);
  background: rgba(11, 15, 22, 0.76);
  border: 1px solid var(--ai-border);
  color: var(--ai-text-2);
  font-size: var(--ai-fs-mini);
  letter-spacing: 0.06em;

  &.is-top {
    color: #fff;
    background: linear-gradient(135deg, var(--ai-brand), var(--ai-nev));
    border-color: transparent;
  }
}

.rec-card__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: var(--ai-space-4) var(--ai-space-5);
  min-width: 0;
}

.rec-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ai-space-4);
}

.rec-card__title h4 {
  font-size: var(--ai-fs-h3);
  font-weight: var(--ai-fw-semibold);
  color: var(--ai-text-1);
}

.rec-card__meta {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.rec-card__score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.rec-card__ring {
  position: relative;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  display: grid;
  place-items: center;
}

.rec-card__ring-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--ai-bg-panel);

  b { font-size: 16px; color: var(--ai-text-1); line-height: 1; }
  span { font-size: var(--ai-fs-mini); color: var(--ai-text-3); }
}

.rec-card__score-label {
  font-size: var(--ai-fs-mini);
  color: var(--ai-text-3);
}

.rec-card__reason {
  display: flex;
  gap: 6px;
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-2);
  line-height: var(--ai-lh-loose);
  padding: 10px 12px;
  border-radius: var(--ai-radius-sm);
  background: var(--ai-bg-subtle);
  border-left: 2px solid var(--ai-brand);

  .el-icon { flex-shrink: 0; margin-top: 3px; color: var(--ai-brand); }
}

.rec-card__dims {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px var(--ai-space-5);
}

.rec-card__highlights {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.rec-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ai-space-3);
  padding-top: 10px;
  border-top: 1px solid var(--ai-border);
  flex-wrap: wrap;
}

.rec-card__rating {
  display: flex;
  align-items: center;
  gap: 8px;

  em { font-style: normal; font-size: var(--ai-fs-xs); color: var(--ai-warn); }
}

.rec-card__actions {
  display: flex;
  gap: var(--ai-space-2);
}

@media (max-width: 900px) {
  .rec-card { grid-template-columns: minmax(0, 1fr); }
  .rec-card__media :deep(.car-thumb) {
    border-right: 0;
    border-bottom: 1px solid var(--ai-border);
  }
  .rec-card__dims { grid-template-columns: minmax(0, 1fr); }
}
</style>
