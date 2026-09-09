<template>
  <div class="compare-card ai-panel">
    <!-- 已选车型 -->
    <template v-if="car">
      <div class="compare-card__media">
        <CarThumb :brand="car.brand" :color="color" :height="96" :seed="car.id" />
        <button class="compare-card__remove" type="button" title="移出对比" @click="emit('remove', slotNo)">
          <el-icon :size="12"><Close /></el-icon>
        </button>
      </div>
      <div class="compare-card__body">
        <h4 class="compare-card__name ai-truncate">{{ car.brand }} {{ car.name }}</h4>
        <p class="compare-card__price">
          <b class="ai-num">{{ car.price.toFixed(2) }}</b> 万
        </p>
        <div class="compare-card__tags">
          <span class="ai-tag">{{ car.category }}</span>
          <span class="ai-tag ai-tag--nev">{{ ENERGY_LABEL[car.energyType] }}</span>
        </div>
      </div>
    </template>

    <!-- 空位：选择车型 -->
    <div v-else class="compare-card__empty">
      <el-icon :size="20"><Plus /></el-icon>
      <p class="compare-card__empty-title">选择车型 {{ slotNo }}</p>
      <el-select
        v-model="selected"
        placeholder="从列表中选择"
        size="small"
        filterable
        clearable
        @change="onSelect"
      >
        <el-option
          v-for="item in options"
          :key="item.id"
          :label="`${item.brand} ${item.name}`"
          :value="item.id"
        />
      </el-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Close, Plus } from '@element-plus/icons-vue'
import CarThumb from './CarThumb.vue'
import type { Car } from '@/types'
import { ENERGY_LABEL } from '@/constants'
import { brandColor } from '@/utils/brand'

/** 对比位卡片：已选车型展示 or 空位选择 */
const props = defineProps<{
  car?: Car | null
  slotNo: number
  options: Car[]
}>()

const emit = defineEmits<{
  (e: 'select', slotNo: number, carId: number): void
  (e: 'remove', slotNo: number): void
}>()

const selected = ref<number | undefined>(undefined)
const color = computed(() => (props.car ? brandColor(props.car.brand) : '#2e7cf6'))

function onSelect(carId: number | undefined): void {
  if (!carId) return
  emit('select', props.slotNo, carId)
  selected.value = undefined
}
</script>

<style scoped lang="scss">
.compare-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.compare-card__media {
  position: relative;
}

.compare-card__remove {
  position: absolute;
  right: 8px;
  top: 8px;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--ai-border);
  background: rgba(11, 15, 22, 0.72);
  color: var(--ai-text-2);
  cursor: pointer;
  transition: all var(--ai-duration-base) var(--ai-ease);

  &:hover {
    color: var(--ai-danger);
    border-color: rgba(245, 84, 75, 0.4);
  }
}

.compare-card__body {
  padding: var(--ai-space-3) var(--ai-space-4) var(--ai-space-4);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.compare-card__name {
  font-size: var(--ai-fs-sm);
  font-weight: var(--ai-fw-semibold);
  color: var(--ai-text-1);
}

.compare-card__price {
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-3);

  b {
    font-size: 18px;
    color: var(--ai-warn);
    font-weight: var(--ai-fw-semibold);
  }
}

.compare-card__tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.compare-card__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: var(--ai-space-6) var(--ai-space-4);
  color: var(--ai-text-3);
  min-height: 186px;
  border: 1px dashed var(--ai-border-dashed);
  border-radius: var(--ai-radius-md);
  margin: 6px;
}

.compare-card__empty-title {
  font-size: var(--ai-fs-xs);
}
</style>
