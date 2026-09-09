<template>
  <div class="ai-page admin-cars">
    <PageHeader
      title="车型管理"
      description="车型主数据的标准增删改查，维护车型基础信息与核心参数"
      source="示例数据集 · 车型库"
      :mock="true"
      :breadcrumbs="[{ title: '企业管理后台' }, { title: '车型管理' }]"
    >
      <template #actions>
        <el-button type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon>
          <span style="margin-left: 4px">新增车型</span>
        </el-button>
      </template>
    </PageHeader>

    <!-- ---------------- 筛选 ---------------- -->
    <FilterBar :loading="loading" @search="onSearch" @reset="onReset">
      <FilterField label="关键词">
        <el-input v-model="query.keyword" placeholder="车型名称 / 代号" clearable />
      </FilterField>
      <FilterField label="品牌">
        <el-select v-model="query.brandId" placeholder="全部品牌" clearable filterable>
          <el-option v-for="b in brandOptions" :key="b.id" :label="b.name" :value="b.id" />
        </el-select>
      </FilterField>
      <FilterField label="能源">
        <el-select v-model="query.energyType" placeholder="全部能源" clearable>
          <el-option v-for="e in ENERGY_OPTIONS" :key="e.value" :label="e.label" :value="e.value" />
        </el-select>
      </FilterField>
      <FilterField label="类别">
        <el-select v-model="query.category" placeholder="全部类别" clearable>
          <el-option v-for="c in CAR_CATEGORIES" :key="c" :label="c" :value="c" />
        </el-select>
      </FilterField>
    </FilterBar>

    <!-- ---------------- 列表 ---------------- -->
    <section class="ai-panel admin-cars__panel">
      <DataTable
        v-model:page="page"
        v-model:page-size="pageSize"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        show-index
        :default-sort="{ prop: 'sales', order: 'descending' }"
        empty-text="没有匹配的车型"
        @page-change="onPageChange"
        @sort-change="onSortChange"
      >
        <template #name="{ row }">
          <div class="admin-cars__car">
            <span class="admin-cars__brand" :style="{ background: brandColor(row.brand) }">
              {{ row.brand.slice(0, 1) }}
            </span>
            <div class="admin-cars__car-info">
              <span class="admin-cars__car-name">{{ row.brand }} {{ row.name }}</span>
              <span class="admin-cars__car-meta ai-num">{{ row.modelCode }}</span>
            </div>
          </div>
        </template>

        <template #price="{ row }">
          <span class="ai-num admin-cars__price">{{ row.price.toFixed(2) }} 万</span>
        </template>

        <template #energyType="{ row }">
          <StatusTag :status="row.energyType" :text="ENERGY_SHORT[row.energyType]" />
        </template>

        <template #range="{ row }">
          <span class="ai-num">{{ row.range ? `${row.range} km` : '—' }}</span>
        </template>

        <template #sales="{ row }">
          <span class="ai-num">{{ formatCompact(row.sales) }}</span>
        </template>

        <template #launchDate="{ row }">
          <span class="ai-num">{{ row.launchDate }}</span>
        </template>

        <template #action="{ row }">
          <div class="admin-cars__actions">
            <el-button link type="primary" size="small" @click="$router.push(`/cars/${row.id}`)">查看</el-button>
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="onDelete(row)">删除</el-button>
          </div>
        </template>
      </DataTable>
    </section>

    <!-- ---------------- 新增 / 编辑 ---------------- -->
    <el-dialog
      v-model="formVisible"
      :title="isEdit ? '编辑车型' : '新增车型'"
      width="720px"
      align-center
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <div class="admin-cars__form-grid">
          <el-form-item label="所属品牌" prop="brandId">
            <el-select v-model="form.brandId" placeholder="请选择品牌" filterable>
              <el-option v-for="b in brandOptions" :key="b.id" :label="b.name" :value="b.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="车型名称" prop="name">
            <el-input v-model="form.name" placeholder="如：汉 EV" maxlength="30" />
          </el-form-item>
          <el-form-item label="车型代号" prop="modelCode">
            <el-input v-model="form.modelCode" placeholder="如：BYD-HAN-EV" maxlength="24" />
          </el-form-item>
          <el-form-item label="车型类别" prop="category">
            <el-select v-model="form.category" placeholder="请选择类别">
              <el-option v-for="c in CAR_CATEGORIES" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
          <el-form-item label="能源类型" prop="energyType">
            <el-select v-model="form.energyType" placeholder="请选择能源类型">
              <el-option v-for="e in ENERGY_OPTIONS" :key="e.value" :label="e.label" :value="e.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="上市时间" prop="launchDate">
            <el-input v-model="form.launchDate" placeholder="YYYY-MM" maxlength="7" />
          </el-form-item>
          <el-form-item label="指导价" prop="price">
            <el-input-number v-model="form.price" :min="0" :max="1000" :step="0.5" :precision="2" />
          </el-form-item>
          <el-form-item label="最低价">
            <el-input-number v-model="form.priceMin" :min="0" :max="1000" :step="0.5" :precision="2" />
          </el-form-item>
          <el-form-item label="最高价">
            <el-input-number v-model="form.priceMax" :min="0" :max="1000" :step="0.5" :precision="2" />
          </el-form-item>
          <el-form-item label="续航(km)">
            <el-input-number v-model="form.range" :min="0" :max="1500" :step="10" />
          </el-form-item>
          <el-form-item label="功率(kW)">
            <el-input-number v-model="form.power" :min="0" :max="1000" :step="5" />
          </el-form-item>
          <el-form-item label="扭矩(N·m)">
            <el-input-number v-model="form.torque" :min="0" :max="2000" :step="10" />
          </el-form-item>
          <el-form-item label="轴距(mm)">
            <el-input-number v-model="form.wheelbase" :min="0" :max="4000" :step="10" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- ---------------- 删除确认 ---------------- -->
    <ConfirmDialog
      v-model="deleteVisible"
      type="danger"
      title="删除车型"
      :content="`确定要删除「${pending?.brand ?? ''} ${pending?.name ?? ''}」吗？`"
      description="删除后该车型及其销量序列将从车型库中移除，操作不可撤销。"
      confirm-text="确认删除"
      :loading="deleting"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import FilterField from '@/components/common/FilterField.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { adminCarApi } from '@/api/admin'
import { carApi } from '@/api/cars'
import { CAR_CATEGORIES, ENERGY_OPTIONS, ENERGY_SHORT } from '@/constants'
import { brandColor } from '@/utils/brand'
import { formatCompact } from '@/utils/format'
import type { Car, CarCategory, EnergyType } from '@/types'

/**
 * 管理后台 · 车型管理
 * 数据来源：GET /api/admin/cars · POST /api/cars · PUT /api/cars/:id · DELETE /api/cars/:id
 */

const list = ref<Car[]>([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const brandOptions = ref<{ id: number; name: string }[]>([])

const query = reactive<{ keyword: string; brandId: number | ''; energyType: string; category: string }>({
  keyword: '',
  brandId: '',
  energyType: '',
  category: ''
})
const sortBy = ref('sales')
const sortOrder = ref<'asc' | 'desc'>('desc')

const columns = [
  { prop: 'name', label: '车型', minWidth: 220, slot: 'name' },
  { prop: 'category', label: '类别', width: 90 },
  { prop: 'energyType', label: '能源', width: 110, slot: 'energyType' },
  { prop: 'price', label: '指导价', width: 110, sortable: true, slot: 'price' },
  { prop: 'range', label: '续航', width: 100, sortable: true, slot: 'range' },
  { prop: 'power', label: '功率', width: 100, sortable: true },
  { prop: 'launchDate', label: '上市时间', width: 110, slot: 'launchDate' },
  { prop: 'sales', label: '年销量', width: 110, sortable: true, slot: 'sales' },
  { prop: 'action', label: '操作', width: 170, fixed: 'right' as const, slot: 'action' }
]

/* ---------------- 表单 ---------------- */

interface CarForm {
  id?: number
  brandId: number | undefined
  name: string
  modelCode: string
  category: CarCategory | ''
  energyType: EnergyType | ''
  launchDate: string
  price: number
  priceMin: number
  priceMax: number
  range: number
  power: number
  torque: number
  wheelbase: number
}

const emptyForm = (): CarForm => ({
  brandId: undefined,
  name: '',
  modelCode: '',
  category: '',
  energyType: '',
  launchDate: '',
  price: 0,
  priceMin: 0,
  priceMax: 0,
  range: 0,
  power: 0,
  torque: 0,
  wheelbase: 0
})

const formRef = ref<FormInstance>()
const form = reactive<CarForm>(emptyForm())
const formVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)

const rules: FormRules<CarForm> = {
  brandId: [{ required: true, message: '请选择所属品牌', trigger: 'change' }],
  name: [{ required: true, message: '请输入车型名称', trigger: 'blur' }],
  modelCode: [{ required: true, message: '请输入车型代号', trigger: 'blur' }],
  category: [{ required: true, message: '请选择车型类别', trigger: 'change' }],
  energyType: [{ required: true, message: '请选择能源类型', trigger: 'change' }],
  launchDate: [
    { required: true, message: '请输入上市时间', trigger: 'blur' },
    { pattern: /^\d{4}-\d{2}$/, message: '格式应为 YYYY-MM', trigger: 'blur' }
  ],
  price: [{ required: true, message: '请输入指导价', trigger: 'blur' }]
}

function openCreate(): void {
  Object.assign(form, emptyForm())
  isEdit.value = false
  formVisible.value = true
  formRef.value?.clearValidate()
}

function openEdit(row: Car): void {
  Object.assign(form, {
    id: row.id,
    brandId: row.brandId,
    name: row.name,
    modelCode: row.modelCode,
    category: row.category,
    energyType: row.energyType,
    launchDate: row.launchDate,
    price: row.price,
    priceMin: row.priceMin,
    priceMax: row.priceMax,
    range: row.range,
    power: row.power,
    torque: row.torque,
    wheelbase: row.wheelbase
  })
  isEdit.value = true
  formVisible.value = true
  formRef.value?.clearValidate()
}

async function onSave(): Promise<void> {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const payload: Partial<Car> = {
    brandId: form.brandId,
    name: form.name,
    modelCode: form.modelCode,
    category: form.category as CarCategory,
    energyType: form.energyType as EnergyType,
    launchDate: form.launchDate,
    launchYear: Number(form.launchDate.slice(0, 4)) || undefined,
    price: form.price,
    priceMin: form.priceMin,
    priceMax: form.priceMax,
    range: form.range,
    power: form.power,
    torque: form.torque,
    wheelbase: form.wheelbase
  }

  saving.value = true
  try {
    if (isEdit.value && form.id !== undefined) {
      await adminCarApi.update(form.id, payload)
      ElMessage.success('车型已更新')
    } else {
      await adminCarApi.create(payload)
      ElMessage.success('车型已创建')
    }
    formVisible.value = false
    await loadList()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

/* ---------------- 删除 ---------------- */

const pending = ref<Car | null>(null)
const deleteVisible = ref(false)
const deleting = ref(false)

function onDelete(row: Car): void {
  pending.value = row
  deleteVisible.value = true
}

async function confirmDelete(): Promise<void> {
  if (!pending.value) return
  deleting.value = true
  try {
    await adminCarApi.remove(pending.value.id)
    ElMessage.success('车型已删除')
    deleteVisible.value = false
    pending.value = null
    await loadList()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '删除失败，请稍后重试')
  } finally {
    deleting.value = false
  }
}

/* ---------------- 列表 ---------------- */

async function loadList(): Promise<void> {
  loading.value = true
  try {
    const res = await adminCarApi.list({
      page: page.value,
      pageSize: pageSize.value,
      keyword: query.keyword || undefined,
      brandId: query.brandId === '' ? undefined : query.brandId,
      energyType: query.energyType || undefined,
      category: query.category || undefined,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    })
    list.value = res.list
    total.value = res.total
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '车型列表加载失败')
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function onSearch(): void {
  page.value = 1
  void loadList()
}

function onReset(): void {
  query.keyword = ''
  query.brandId = ''
  query.energyType = ''
  query.category = ''
  page.value = 1
  void loadList()
}

function onPageChange({ page: p, pageSize: s }: { page: number; pageSize: number }): void {
  page.value = p
  pageSize.value = s
  void loadList()
}

function onSortChange({ prop, order }: { prop: string; order: string }): void {
  sortBy.value = prop || 'sales'
  sortOrder.value = (order || 'desc') as 'asc' | 'desc'
  void loadList()
}

onMounted(async () => {
  try {
    const res = await carApi.options()
    brandOptions.value = res.brands
  } catch {
    brandOptions.value = []
  }
  await loadList()
})
</script>

<style scoped lang="scss">
.admin-cars__panel {
  overflow: hidden;
}

.admin-cars__car {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.admin-cars__brand {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: var(--ai-radius-xs);
  color: #fff;
  font-size: var(--ai-fs-xs);
  font-weight: 600;
  flex-shrink: 0;
}

.admin-cars__car-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.35;
}

.admin-cars__car-name {
  font-size: var(--ai-fs-sm);
  color: var(--ai-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-cars__car-meta {
  font-size: 10px;
  color: var(--ai-text-4);
}

.admin-cars__price {
  color: var(--ai-warn);
  font-weight: var(--ai-fw-medium);
}

.admin-cars__actions {
  display: flex;
  gap: 2px;
}

.admin-cars__form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 var(--ai-space-5);

  :deep(.el-form-item) { margin-bottom: 18px; }
  :deep(.el-select),
  :deep(.el-input-number) { width: 100%; }
}

@media (max-width: 768px) {
  .admin-cars__form-grid { grid-template-columns: minmax(0, 1fr); }
}
</style>
