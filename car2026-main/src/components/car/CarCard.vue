<template>
  <article class="car-card ai-panel ai-panel--hoverable">
    <div class="car-card__media" @click="goDetail">
      <CarThumb :brand="car.brand" :color="color" :height="112" :seed="car.id" />
      <span v-if="car.rank && car.rank <= 10" class="car-card__rank">TOP {{ car.rank }}</span>
    </div>

    <div class="car-card__body">
      <header class="car-card__head" @click="goDetail">
        <h4 class="car-card__name ai-truncate">{{ car.brand }} {{ car.name }}</h4>
        <span class="ai-tag ai-tag--brand">{{ car.category }}</span>
      </header>

      <div class="car-card__price">
        <b class="ai-num">{{ car.price.toFixed(2) }}</b>
        <span class="car-card__unit">万</span>
        <span class="car-card__price-range ai-num">{{ car.priceMin.toFixed(1) }}~{{ car.priceMax.toFixed(1) }}万</span>
      </div>

      <ul class="car-card__specs">
        <li>
          <span>能源</span>
          <i :style="{ color: energyColor }">{{ energyLabel }}</i>
        </li>
        <li>
          <span>续航</span>
          <i class="ai-num">{{ car.range ? `${car.range}km` : '—' }}</i>
        </li>
        <li>
          <span>功率</span>
          <i class="ai-num">{{ car.power }}kW</i>
        </li>
        <li>
          <span>年销量</span>
          <i class="ai-num">{{ formatCompact(car.sales) }}</i>
        </li>
      </ul>

      <div class="car-card__tags">
        <span v-for="tag in car.tags" :key="tag" class="ai-tag">{{ tag }}</span>
      </div>
    </div>

    <footer class="car-card__foot">
      <el-button size="small" text :type="inCompare ? 'primary' : 'default'" @click="emit('compare', car)">
        <el-icon><ScaleToOriginal /></el-icon>
        <span>{{ inCompare ? '已加入对比' : '加入对比' }}</span>
      </el-button>
      <el-button size="small" type="primary" plain @click="goDetail">查看详情</el-button>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ScaleToOriginal } from '@element-plus/icons-vue'
import CarThumb from './CarThumb.vue'
import type { Car } from '@/types'
import { ENERGY_COLOR, ENERGY_LABEL } from '@/constants'
import { brandColor } from '@/utils/brand'
import { formatCompact } from '@/utils/format'

const props = defineProps<{
  car: Car
  inCompare?: boolean
}>()

const emit = defineEmits<{
  (e: 'compare', car: Car): void
}>()

const router = useRouter()

const color = computed(() => brandColor(props.car.brand))
const energyLabel = computed(() => ENERGY_LABEL[props.car.energyType])
const energyColor = computed(() => ENERGY_COLOR[props.car.energyType])

function goDetail(): void {
  void router.push(`/cars/${props.car.id}`)
}
</script>

<style scoped lang="scss">
.car-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: default;
  min-width: 0;
}

.car-card__media {
  position: relative;
  cursor: pointer;
}

.car-card__rank {
  position: absolute;
  right: 8px;
  top: 8px;
  padding: 2px 6px;
  border-radius: var(--ai-radius-xs);
  background: rgba(11, 15, 22, 0.72);
  border: 1px solid var(--ai-border);
  color: var(--ai-warn);
  font-size: var(--ai-fs-mini);
  font-weight: var(--ai-fw-semibold);
  letter-spacing: 0.04em;
}

.car-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: var(--ai-space-4);
  flex: 1;
}

.car-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ai-space-2);
  cursor: pointer;
}

.car-card__name {
  font-size: var(--ai-fs-body);
  font-weight: var(--ai-fw-semibold);
  color: var(--ai-text-1);
  min-width: 0;
}

.car-card__price {
  display: flex;
  align-items: baseline;
  gap: 4px;

  b {
    font-size: 20px;
    font-weight: var(--ai-fw-semibold);
    color: var(--ai-warn);
  }
}

.car-card__unit { font-size: var(--ai-fs-xs); color: var(--ai-text-3); }

.car-card__price-range {
  margin-left: auto;
  font-size: var(--ai-fs-mini);
  color: var(--ai-text-3);
}

.car-card__specs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--ai-fs-xs);
    min-width: 0;
  }

  span { color: var(--ai-text-3); }
  i { font-style: normal; color: var(--ai-text-1); }
}

.car-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.car-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ai-space-2);
  padding: 10px var(--ai-space-4);
  border-top: 1px solid var(--ai-border);
}
</style>
