<template>
  <span class="ai-tag" :class="[`ai-tag--${tone}`]">
    <span v-if="dot" class="ai-tag__dot" />
    <slot>{{ text }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OrderStatus, SentimentLabel, UserRole, UserStatus } from '@/types'

type TagTone = 'default' | 'brand' | 'nev' | 'warn' | 'danger' | 'purple' | 'mock'

const props = withDefaults(
  defineProps<{
    /** 可直接传业务状态值，自动映射文案与配色 */
    status?: UserStatus | OrderStatus | SentimentLabel | UserRole | string
    tone?: TagTone
    text?: string
    dot?: boolean
  }>(),
  { tone: 'default', dot: true }
)

const STATUS_MAP: Record<string, { text: string; tone: TagTone }> = {
  // 用户状态
  active: { text: '正常', tone: 'nev' },
  disabled: { text: '已禁用', tone: 'danger' },
  pending: { text: '待审核', tone: 'warn' },
  // 订单状态
  paid: { text: '已付款', tone: 'brand' },
  delivered: { text: '已交付', tone: 'nev' },
  cancelled: { text: '已取消', tone: 'default' },
  // 情感
  positive: { text: '正面', tone: 'nev' },
  neutral: { text: '中性', tone: 'default' },
  negative: { text: '负面', tone: 'danger' },
  // 角色
  admin: { text: '管理员', tone: 'purple' },
  analyst: { text: '分析师', tone: 'brand' },
  sales: { text: '销售运营', tone: 'warn' },
  user: { text: '普通用户', tone: 'default' },
  // 算法任务
  running: { text: '运行中', tone: 'nev' },
  training: { text: '训练中', tone: 'brand' },
  idle: { text: '空闲', tone: 'default' },
  failed: { text: '异常', tone: 'danger' },
  // 库存
  充足: { text: '库存充足', tone: 'nev' },
  偏低: { text: '库存偏低', tone: 'warn' },
  紧张: { text: '库存紧张', tone: 'danger' },
  // 结果
  success: { text: '成功', tone: 'nev' }
}

const mapped = computed(() => (props.status ? STATUS_MAP[props.status] : undefined))
const finalTone = computed(() => mapped.value?.tone ?? props.tone)
const finalText = computed(() => props.text ?? mapped.value?.text ?? String(props.status ?? ''))
</script>
