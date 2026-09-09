<template>
  <div class="ai-page recommend">
    <PageHeader
      title="智能购车推荐"
      description="基于预算、能源偏好、用车场景与关注因素，由后端推荐算法输出匹配车型与可解释的推荐理由"
      :updated-at="result?.generatedAt"
      source="推荐服务 · AutoInsight Recommend"
      :mock="true"
      :breadcrumbs="[{ title: '首页' }, { title: '智能购车推荐' }]"
    >
      <template #actions>
        <el-button :disabled="loading" @click="onReset">
          <el-icon><RefreshLeft /></el-icon>
          <span style="margin-left: 4px">重置条件</span>
        </el-button>
      </template>
    </PageHeader>

    <!-- ---------------- 步骤条 ---------------- -->
    <section class="ai-panel recommend__steps">
      <el-steps :active="activeStep" finish-status="success" align-center>
        <el-step title="填写购车需求" description="预算 / 能源 / 场景 / 关注因素" />
        <el-step title="确认需求摘要" description="核对条件后提交算法服务" />
        <el-step title="查看推荐结果" description="匹配度排序与推荐解释" />
      </el-steps>
    </section>

    <!-- ---------------- 第一步：需求表单 ---------------- -->
    <section class="ai-panel">
      <header class="ai-panel__header">
        <div>
          <h3 class="ai-panel__title">第一步 · 填写购车需求</h3>
          <p class="ai-panel__subtitle">条件越具体，算法返回的匹配结果越精准</p>
        </div>
      </header>

      <div class="ai-panel__body recommend__form">
        <div class="recommend__field">
          <label class="recommend__label">
            购车预算
            <em>*</em>
          </label>
          <div class="recommend__budgets">
            <button
              v-for="b in BUDGET_OPTIONS"
              :key="b.value"
              type="button"
              class="recommend__budget"
              :class="{ 'is-active': form.budget === b.value }"
              @click="form.budget = b.value"
            >
              {{ b.label }}
            </button>
          </div>
        </div>

        <div class="recommend__field">
          <label class="recommend__label">
            能源类型
            <em>*</em>
          </label>
          <el-checkbox-group v-model="form.energyTypes">
            <el-checkbox v-for="e in ENERGY_OPTIONS" :key="e.value" :value="e.value" :label="e.value">
              {{ e.label }}
            </el-checkbox>
          </el-checkbox-group>
        </div>

        <div class="recommend__field">
          <label class="recommend__label">
            用车场景
            <em>*</em>
          </label>
          <div class="recommend__usages">
            <button
              v-for="u in usageOptions"
              :key="u.value"
              type="button"
              class="recommend__usage"
              :class="{ 'is-active': form.scenarios.includes(u.value) }"
              @click="toggleScenario(u.value)"
            >
              <span class="recommend__usage-name">{{ u.label }}</span>
              <span class="recommend__usage-desc">{{ u.desc }}</span>
            </button>
          </div>
        </div>

        <div class="recommend__field">
          <label class="recommend__label">所在地区</label>
          <div class="recommend__region">
            <el-select v-model="form.province" placeholder="选择省份" style="width: 160px" @change="onProvinceChange">
              <el-option v-for="p in provinceOptions" :key="p" :label="p" :value="p" />
            </el-select>
            <el-select v-model="form.city" placeholder="选择城市" style="width: 160px">
              <el-option v-for="c in cityOptions" :key="c" :label="c" :value="c" />
            </el-select>
            <span class="recommend__region-hint">地区用于匹配本地补贴政策与补能便利性</span>
          </div>
        </div>

        <div class="recommend__field">
          <label class="recommend__label">
            关注因素权重
            <span class="recommend__label-hint">拖动调整各因素在匹配计算中的重要程度</span>
          </label>
          <div class="recommend__weights">
            <div v-for="c in concernOptions" :key="c.value" class="recommend__weight">
              <div class="recommend__weight-head">
                <span class="recommend__weight-name">{{ c.label }}</span>
                <span class="recommend__weight-value ai-num">{{ form.weights[c.value] }}</span>
              </div>
              <el-slider v-model="form.weights[c.value]" :min="0" :max="100" :step="5" size="small" />
            </div>
          </div>
        </div>

        <div class="recommend__field recommend__field--inline">
          <label class="recommend__label">返回数量</label>
          <el-select v-model="form.topN" style="width: 140px">
            <el-option :value="3" label="前 3 名" />
            <el-option :value="6" label="前 6 名" />
            <el-option :value="9" label="前 9 名" />
          </el-select>
        </div>
      </div>
    </section>

    <!-- ---------------- 第二步：需求摘要 ---------------- -->
    <section class="ai-panel recommend__summary">
      <header class="ai-panel__header">
        <div>
          <h3 class="ai-panel__title">第二步 · 需求摘要</h3>
          <p class="ai-panel__subtitle">确认无误后提交至推荐服务，算法将返回匹配车型与推荐解释</p>
        </div>
      </header>

      <div class="ai-panel__body recommend__summary-body">
        <dl class="recommend__summary-list">
          <div>
            <dt>购车预算</dt>
            <dd>{{ summary.budget }}</dd>
          </div>
          <div>
            <dt>能源类型</dt>
            <dd>{{ summary.energy }}</dd>
          </div>
          <div>
            <dt>用车场景</dt>
            <dd>{{ summary.scenario }}</dd>
          </div>
          <div>
            <dt>所在地区</dt>
            <dd>{{ summary.location }}</dd>
          </div>
          <div>
            <dt>重点关注</dt>
            <dd>{{ summary.factors }}</dd>
          </div>
        </dl>

        <div class="recommend__submit">
          <el-button type="primary" size="large" :loading="loading" :disabled="!valid" @click="onSubmit">
            <el-icon><MagicStick /></el-icon>
            <span style="margin-left: 6px">开始智能推荐</span>
          </el-button>
          <p class="recommend__submit-hint">
            <template v-if="valid">请求体将提交至 POST /api/recommend</template>
            <template v-else>请先选择能源类型与用车场景</template>
          </p>
        </div>
      </div>
    </section>

    <!-- ---------------- 第三步：推荐结果 ---------------- -->
    <section class="recommend__result">
      <!-- loading -->
      <div v-if="loading" class="ai-panel recommend__result-panel">
        <header class="ai-panel__header">
          <h3 class="ai-panel__title">算法计算中</h3>
        </header>
        <div class="ai-panel__body">
          <LoadingState variant="chart" :height="220" />
        </div>
      </div>

      <!-- error -->
      <div v-else-if="error" class="ai-panel recommend__result-panel">
        <header class="ai-panel__header">
          <h3 class="ai-panel__title">第三步 · 推荐结果</h3>
        </header>
        <div class="ai-panel__body">
          <ErrorState :message="error" description="推荐服务未返回结果，请检查条件后重试" @retry="onSubmit" />
        </div>
      </div>

      <!-- empty（未提交） -->
      <div v-else-if="!result" class="ai-panel recommend__result-panel">
        <header class="ai-panel__header">
          <h3 class="ai-panel__title">第三步 · 推荐结果</h3>
        </header>
        <div class="ai-panel__body">
          <EmptyState
            title="尚未生成推荐结果"
            description="填写购车需求并点击「开始智能推荐」，系统会返回按匹配度排序的车型列表"
            :icon="MagicStick"
          />
        </div>
      </div>

      <!-- success -->
      <template v-else>
        <section class="ai-panel recommend__meta">
          <div class="recommend__meta-list">
            <span class="recommend__meta-item">
              <em>算法模型</em>
              <b>{{ result.model }}</b>
            </span>
            <span class="recommend__meta-item">
              <em>请求编号</em>
              <b class="ai-num">{{ result.requestId }}</b>
            </span>
            <span class="recommend__meta-item">
              <em>生成时间</em>
              <b class="ai-num">{{ result.generatedAt }}</b>
            </span>
            <span class="recommend__meta-item">
              <em>返回条数</em>
              <b class="ai-num">{{ result.recommendations.length }}</b>
            </span>
          </div>
          <span class="ai-tag ai-tag--mock">示例数据 · 前端不参与算法计算</span>
        </section>

        <section v-if="result.recommendations.length" class="recommend__top">
          <RecommendationCard :item="result.recommendations[0]" :rank="1" show-dimensions />
        </section>

        <!-- 推荐解释 -->
        <section v-if="topItem" class="ai-panel recommend__panel">
          <header class="ai-panel__header">
            <div>
              <h3 class="ai-panel__title">为什么推荐这辆车</h3>
              <p class="ai-panel__subtitle">
                {{ topItem.brand }} {{ topItem.carName }} 各维度匹配度，数值由推荐服务返回
              </p>
            </div>
            <span class="ai-tag ai-tag--brand">综合匹配 {{ topItem.score.toFixed(1) }}%</span>
          </header>

          <div class="ai-panel__body">
            <div class="recommend__dims">
              <ScoreBar
                v-for="dim in topItem.dimensions"
                :key="dim.key"
                :label="dim.label"
                :score="dim.score"
                :color="dimColor(dim.score)"
              />
            </div>

            <div v-if="topItem.dimensions.some((d) => d.desc)" class="recommend__dim-desc">
              <p v-for="dim in topItem.dimensions.filter((d) => d.desc)" :key="`desc-${dim.key}`">
                <b>{{ dim.label }}：</b>{{ dim.desc }}
              </p>
            </div>

            <div class="recommend__highlights">
              <span class="recommend__highlights-label">命中需求</span>
              <span v-for="h in topItem.highlights" :key="h" class="ai-tag ai-tag--purple">{{ h }}</span>
            </div>
          </div>
        </section>

        <!-- 其余推荐 -->
        <section v-if="rest.length" class="recommend__panel">
          <h3 class="ai-section-title recommend__rest-title">其他推荐车型</h3>
          <div class="ai-cols ai-cols--2">
            <RecommendationCard
              v-for="(item, i) in rest"
              :key="item.carId"
              :item="item"
              :rank="i + 2"
            />
          </div>
        </section>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { MagicStick, RefreshLeft } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ScoreBar from '@/components/common/ScoreBar.vue'
import RecommendationCard from '@/components/common/RecommendationCard.vue'
import { useRecommendStore } from '@/stores/recommend'
import { recommendApi } from '@/api/recommend'
import { BUDGET_OPTIONS, CONCERN_OPTIONS, CITY_MAP, ENERGY_OPTIONS, PROVINCES, USAGE_OPTIONS } from '@/constants'
import { PALETTE } from '@/charts/theme'
import type { ConcernFactor, UsageScenario } from '@/types'

/**
 * 智能购车推荐
 * ------------------------------------------------------------
 * 前端职责：收集需求 → POST /api/recommend → 展示结果
 * 所有匹配度与推荐理由均由后端算法返回，前端不做任何模型计算或结论伪造
 */

const store = useRecommendStore()
const form = store.form
const result = computed(() => store.result)
const loading = computed(() => store.loading)
const error = computed(() => store.error)
const summary = computed(() => store.summary)
const topItem = computed(() => store.top)
const rest = computed(() => store.rest)

/** 选项优先取后端接口，失败时回退到前端常量 */
const usageOptions = ref<{ value: UsageScenario; label: string; desc: string }[]>([...USAGE_OPTIONS])
const concernOptions = ref<{ value: ConcernFactor; label: string; desc: string }[]>([...CONCERN_OPTIONS])
const provinceOptions = ref<string[]>([...PROVINCES])

const cityOptions = computed(() => CITY_MAP[form.province] ?? [])

const activeStep = computed(() => {
  if (result.value) return 2
  if (store.submitted) return 1
  return 0
})

const valid = computed(() => form.energyTypes.length > 0 && form.scenarios.length > 0)

function toggleScenario(value: UsageScenario): void {
  const idx = form.scenarios.indexOf(value)
  if (idx >= 0) form.scenarios.splice(idx, 1)
  else form.scenarios.push(value)
}

function onProvinceChange(province: string): void {
  const cities = CITY_MAP[province]
  form.city = cities?.length ? cities[0] : ''
}

async function onSubmit(): Promise<void> {
  if (!valid.value) return
  await store.submit()
}

function onReset(): void {
  store.reset()
}

function dimColor(score: number): string {
  if (score >= 85) return PALETTE[1]
  if (score >= 70) return PALETTE[0]
  if (score >= 55) return PALETTE[2]
  return PALETTE[5]
}

onMounted(async () => {
  try {
    const options = await recommendApi.options()
    if (options.usages?.length) usageOptions.value = options.usages as { value: UsageScenario; label: string; desc: string }[]
    if (options.concerns?.length) concernOptions.value = options.concerns as { value: ConcernFactor; label: string; desc: string }[]
    if (options.provinces?.length) provinceOptions.value = options.provinces
  } catch {
    /* 选项接口不可用时保留前端常量 */
  }
})
</script>

<style scoped lang="scss">
.recommend__steps {
  padding: var(--ai-space-5) var(--ai-space-5) var(--ai-space-2);
}

/* ---------- 表单 ---------- */
.recommend__form {
  display: flex;
  flex-direction: column;
  gap: var(--ai-space-5);
}

.recommend__field--inline {
  display: flex;
  align-items: center;
  gap: var(--ai-space-4);
}

.recommend__label {
  display: flex;
  align-items: center;
  gap: var(--ai-space-2);
  margin-bottom: 12px;
  font-size: var(--ai-fs-sm);
  color: var(--ai-text-1);
  font-weight: var(--ai-fw-medium);

  em { color: var(--ai-danger); font-style: normal; }
}

.recommend__label-hint {
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-4);
  font-weight: var(--ai-fw-normal);
}

.recommend__budgets {
  display: flex;
  gap: var(--ai-space-2);
  flex-wrap: wrap;
}

.recommend__budget {
  min-width: 96px;
  padding: 8px 18px;
  border: 1px solid var(--ai-border);
  border-radius: var(--ai-radius-sm);
  background: var(--ai-bg-subtle);
  color: var(--ai-text-2);
  font-size: var(--ai-fs-sm);
  cursor: pointer;
  transition: all var(--ai-duration-base) var(--ai-ease);

  &:hover { border-color: var(--ai-border-strong); color: var(--ai-text-1); }

  &.is-active {
    border-color: var(--ai-border-brand);
    background: var(--ai-brand-ghost);
    color: #8ab4ff;
  }
}

.recommend__usages {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--ai-space-3);
}

.recommend__usage {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px var(--ai-space-4);
  border: 1px solid var(--ai-border);
  border-radius: var(--ai-radius-sm);
  background: var(--ai-bg-subtle);
  text-align: left;
  cursor: pointer;
  transition: all var(--ai-duration-base) var(--ai-ease);

  &:hover { border-color: var(--ai-border-strong); }

  &.is-active {
    border-color: rgba(22, 199, 154, 0.42);
    background: var(--ai-nev-soft);
  }
}

.recommend__usage-name {
  font-size: var(--ai-fs-sm);
  color: var(--ai-text-1);
  font-weight: var(--ai-fw-medium);
}

.recommend__usage-desc {
  font-size: var(--ai-fs-mini);
  color: var(--ai-text-4);
  line-height: 1.5;
}

.recommend__region {
  display: flex;
  align-items: center;
  gap: var(--ai-space-3);
  flex-wrap: wrap;
}

.recommend__region-hint {
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-4);
}

.recommend__weights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--ai-space-4) var(--ai-space-6);
}

.recommend__weight-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.recommend__weight-name {
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-2);
}

.recommend__weight-value {
  font-size: var(--ai-fs-xs);
  color: var(--ai-brand);
}

/* ---------- 摘要 ---------- */
.recommend__summary-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ai-space-6);
  flex-wrap: wrap;
}

.recommend__summary-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--ai-space-4) var(--ai-space-6);
  flex: 1;
  min-width: 260px;
  margin: 0;

  div { min-width: 0; }

  dt {
    font-size: var(--ai-fs-xs);
    color: var(--ai-text-3);
    margin-bottom: 5px;
  }

  dd {
    margin: 0;
    font-size: var(--ai-fs-body);
    color: var(--ai-text-1);
    font-weight: var(--ai-fw-medium);
  }
}

.recommend__submit {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.recommend__submit-hint {
  font-size: var(--ai-fs-mini);
  color: var(--ai-text-4);
}

/* ---------- 结果 ---------- */
.recommend__result {
  display: flex;
  flex-direction: column;
  gap: var(--ai-space-5);
}

.recommend__result-panel {
  overflow: hidden;
}

.recommend__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ai-space-4);
  padding: var(--ai-space-3) var(--ai-space-5);
  flex-wrap: wrap;
}

.recommend__meta-list {
  display: flex;
  align-items: center;
  gap: var(--ai-space-6);
  flex-wrap: wrap;
}

.recommend__meta-item {
  display: flex;
  flex-direction: column;
  gap: 3px;

  em {
    font-style: normal;
    font-size: var(--ai-fs-mini);
    color: var(--ai-text-4);
  }

  b {
    font-size: var(--ai-fs-sm);
    color: var(--ai-text-1);
    font-weight: var(--ai-fw-medium);
  }
}

.recommend__top {
  display: grid;
}

.recommend__panel {
  overflow: hidden;
}

.recommend__dims {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--ai-space-4) var(--ai-space-6);
}

.recommend__dim-desc {
  margin-top: var(--ai-space-5);
  padding-top: var(--ai-space-4);
  border-top: 1px solid var(--ai-border);
  display: flex;
  flex-direction: column;
  gap: 8px;

  p {
    font-size: var(--ai-fs-xs);
    color: var(--ai-text-2);
    line-height: var(--ai-lh-loose);
  }

  b { color: var(--ai-text-1); font-weight: var(--ai-fw-medium); }
}

.recommend__highlights {
  display: flex;
  align-items: center;
  gap: var(--ai-space-2);
  margin-top: var(--ai-space-4);
  flex-wrap: wrap;
}

.recommend__highlights-label {
  font-size: var(--ai-fs-xs);
  color: var(--ai-text-3);
  margin-right: 2px;
}

.recommend__rest-title {
  margin-bottom: var(--ai-space-3);
}

@media (max-width: 768px) {
  .recommend__summary-body { flex-direction: column; align-items: stretch; }
  .recommend__submit { align-items: stretch; }
}
</style>
