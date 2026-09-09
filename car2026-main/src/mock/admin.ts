import type {
  AdminOverview,
  AdminUserItem,
  AlgorithmTask,
  DataFileItem,
  InventoryItem,
  OperationLog,
  OrderItem,
  UserRole,
  UserStatus
} from '@/types'
import { CARS } from './cars'
import { BRANDS } from './brands'
import { MONTHS, NATIONAL_MONTHLY } from './sales'
import { MOCK_UPDATED_AT } from './market'
import { clamp, createRng, round, sum } from './random'

/**
 * 企业管理后台 —— Mock 业务数据
 * 用户、库存、订单、算法任务、操作日志、数据文件
 */

const DEPARTMENTS = ['市场研究中心', '数据分析部', '销售运营部', '算法平台部', '供应链管理部']

const NAMES = [
  '赵启明', '钱嘉树', '孙以宁', '李知微', '周砚清', '吴听澜', '郑云舟', '王砚书',
  '冯叙白', '陈砚舟', '褚望舒', '卫南乔', '蒋星阑', '沈知白', '韩明轩', '杨清让',
  '朱景行', '秦临风', '尤未晞', '许砚洲', '何向东', '吕思远', '施远山', '张澈',
  '孔繁星', '曹砚青', '严听雨', '华子墨', '金若谷', '魏长风'
]

/* ============================ 用户 ============================ */

function buildUsers(): AdminUserItem[] {
  const rng = createRng('users')
  // 前 4 个为演示账号，角色固定，保证登录演示可用
  const fixed: { username: string; nickname: string; role: UserRole }[] = [
    { username: 'admin', nickname: '赵启明', role: 'admin' },
    { username: 'analyst', nickname: '孙以宁', role: 'analyst' },
    { username: 'sales', nickname: '周砚清', role: 'sales' },
    { username: 'user', nickname: '吴听澜', role: 'user' }
  ]

  const list: AdminUserItem[] = fixed.map((f, i) => ({
    id: i + 1,
    username: f.username,
    nickname: f.nickname,
    email: `${f.username}@autoinsight.com`,
    phone: `13${String(rng.int(100000000, 999999999)).slice(0, 9)}`,
    role: f.role,
    status: 'active' as UserStatus,
    department: DEPARTMENTS[i % DEPARTMENTS.length],
    createdAt: '2025-01-12 09:20:31',
    lastLoginAt: '2026-09-02 20:41:05',
    lastLoginIp: '10.12.33.21',
    loginCount: rng.int(120, 860),
    carCount: rng.int(0, 12)
  }))

  for (let i = 4; i < 46; i++) {
    const nickname = NAMES[i % NAMES.length]
    const role = rng.pick<UserRole>(['analyst', 'sales', 'user', 'user', 'sales'])
    const status = rng.pick<UserStatus>(['active', 'active', 'active', 'disabled', 'pending'])
    list.push({
      id: i + 1,
      username: `${role}${1000 + i}`,
      nickname,
      email: `${role}${1000 + i}@autoinsight.com`,
      phone: `13${String(rng.int(100000000, 999999999)).slice(0, 9)}`,
      role,
      status,
      department: rng.pick(DEPARTMENTS),
      createdAt: `${rng.int(2024, 2026)}-${String(rng.int(1, 12)).padStart(2, '0')}-${String(rng.int(1, 28)).padStart(2, '0')} ${String(rng.int(9, 20)).padStart(2, '0')}:${String(rng.int(10, 59)).padStart(2, '0')}:00`,
      lastLoginAt: status === 'pending' ? undefined : `2026-0${rng.int(7, 9)}-${String(rng.int(1, 30)).padStart(2, '0')} ${String(rng.int(8, 22)).padStart(2, '0')}:${String(rng.int(10, 59)).padStart(2, '0')}:00`,
      lastLoginIp: `10.${rng.int(10, 60)}.${rng.int(1, 200)}.${rng.int(1, 250)}`,
      loginCount: rng.int(3, 520),
      carCount: rng.int(0, 20)
    })
  }
  return list
}

export const USERS: AdminUserItem[] = buildUsers()

/** 演示账号密码（登录页提示使用） */
export const DEMO_ACCOUNTS: { username: string; password: string; role: UserRole; desc: string }[] = [
  { username: 'admin', password: 'admin123', role: 'admin', desc: '系统管理员 · 全部权限' },
  { username: 'analyst', password: 'analyst123', role: 'analyst', desc: '数据分析师 · 分析与预测' },
  { username: 'sales', password: 'sales123', role: 'sales', desc: '销售运营 · 车型与订单' },
  { username: 'user', password: 'user123', role: 'user', desc: '普通用户 · 浏览与推荐' }
]

/* ============================ 库存 ============================ */

function buildInventory(): InventoryItem[] {
  const rng = createRng('inventory')
  const warehouses = ['华东中心仓', '华南中心仓', '华北中心仓', '西南分仓', '华中分仓']
  return CARS.slice(0, 60).map((car, i) => {
    const monthly = Math.max(50, Math.round(car.lastMonthSales))
    const quantity = Math.round(monthly * rng.float(0.6, 2.4))
    const turnoverDays = round((quantity / monthly) * 30, 1)
    return {
      id: i + 1,
      carId: car.id,
      carName: `${car.brand} ${car.name}`,
      brand: car.brand,
      quantity,
      inbound: Math.round(monthly * rng.float(0.1, 0.8)),
      monthlySales: monthly,
      turnoverDays,
      warehouse: rng.pick(warehouses),
      status: turnoverDays < 25 ? '紧张' : turnoverDays < 45 ? '偏低' : '充足'
    }
  })
}

export const INVENTORY: InventoryItem[] = buildInventory()

/* ============================ 订单 ============================ */

function buildOrders(): OrderItem[] {
  const rng = createRng('orders')
  const salespeople = NAMES.slice(0, 12)
  const regions = ['华东', '华南', '华北', '华中', '西南', '西北', '东北']
  const list: OrderItem[] = []
  for (let i = 0; i < 160; i++) {
    const car = rng.pick(CARS)
    const status = rng.pick<OrderItem['status']>(['pending', 'paid', 'delivered', 'delivered', 'cancelled'])
    const monthIdx = rng.int(MONTHS.length - 3, MONTHS.length - 1)
    list.push({
      id: i + 1,
      orderNo: `AI${MONTHS[monthIdx].replace('-', '')}${String(rng.int(10000, 99999))}`,
      carId: car.id,
      carName: `${car.brand} ${car.name}`,
      brand: car.brand,
      customer: rng.pick(NAMES),
      amount: round(car.price * rng.float(0.9, 1.08), 2),
      status,
      region: rng.pick(regions),
      createdAt: `${MONTHS[monthIdx]}-${String(rng.int(1, 28)).padStart(2, '0')} ${String(rng.int(9, 20)).padStart(2, '0')}:${String(rng.int(10, 59)).padStart(2, '0')}`,
      salesperson: rng.pick(salespeople)
    })
  }
  return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export const ORDERS: OrderItem[] = buildOrders()

/* ============================ 算法任务 ============================ */

export const ALGORITHMS: AlgorithmTask[] = [
  {
    id: 1,
    name: '智能购车推荐排序',
    type: '推荐',
    model: 'AutoRec-CarRanking',
    version: 'v2.3.1',
    accuracy: 0.913,
    status: 'running',
    lastRunAt: '2026-09-03 08:00:00',
    calls: 184_320,
    owner: '算法平台部 · 陈砚舟'
  },
  {
    id: 2,
    name: '车型销量时序预测',
    type: '预测',
    model: 'XGBoost',
    version: 'v1.8.0',
    accuracy: 0.906,
    status: 'running',
    lastRunAt: '2026-09-03 06:30:00',
    calls: 46_780,
    owner: '算法平台部 · 秦临风'
  },
  {
    id: 3,
    name: '中长期销量预测',
    type: '预测',
    model: 'LSTM + 季节融合',
    version: 'v0.9.4',
    accuracy: 0.872,
    status: 'training',
    lastRunAt: '2026-09-02 22:15:00',
    calls: 3_260,
    owner: '算法平台部 · 秦临风'
  },
  {
    id: 4,
    name: '舆情情感分类',
    type: '舆情',
    model: 'BERT-wwm',
    version: 'v3.0.2',
    accuracy: 0.941,
    status: 'running',
    lastRunAt: '2026-09-03 07:45:00',
    calls: 92_150,
    owner: '算法平台部 · 尤未晞'
  },
  {
    id: 5,
    name: '价格弹性预估',
    type: '预测',
    model: 'LightGBM',
    version: 'v1.2.0',
    accuracy: 0.848,
    status: 'idle',
    lastRunAt: '2026-08-29 03:00:00',
    calls: 12_040,
    owner: '市场研究中心 · 孙以宁'
  },
  {
    id: 6,
    name: '相似车型召回',
    type: '推荐',
    model: 'Item2Vec',
    version: 'v1.1.5',
    accuracy: 0.886,
    status: 'failed',
    lastRunAt: '2026-09-01 04:20:00',
    calls: 8_930,
    owner: '算法平台部 · 陈砚舟'
  }
]

/* ============================ 操作日志 ============================ */

const ACTIONS: { action: string; module: string; result: 'success' | 'failed' }[] = [
  { action: '登录系统', module: '认证', result: 'success' },
  { action: '导出市场分析报表', module: '市场分析', result: 'success' },
  { action: '新增车型', module: '车型管理', result: 'success' },
  { action: '编辑车型参数', module: '车型管理', result: 'success' },
  { action: '删除车型', module: '车型管理', result: 'failed' },
  { action: '执行销量预测', module: '销量预测', result: 'success' },
  { action: '调用智能推荐', module: '智能推荐', result: 'success' },
  { action: '导入销量数据', module: '数据管理', result: 'success' },
  { action: '禁用用户账号', module: '用户管理', result: 'success' },
  { action: '更新算法版本', module: '算法管理', result: 'success' },
  { action: '导出用户列表', module: '用户管理', result: 'success' },
  { action: '调整库存阈值', module: '库存管理', result: 'failed' }
]

function buildLogs(): OperationLog[] {
  const rng = createRng('logs')
  const list: OperationLog[] = []
  for (let i = 0; i < 120; i++) {
    const a = rng.pick(ACTIONS)
    const monthIdx = rng.int(MONTHS.length - 2, MONTHS.length - 1)
    list.push({
      id: i + 1,
      operator: rng.pick(NAMES),
      action: a.action,
      module: a.module,
      target: rng.pick(CARS)?.name,
      ip: `10.${rng.int(10, 60)}.${rng.int(1, 200)}.${rng.int(1, 250)}`,
      result: a.result,
      createdAt: `${MONTHS[monthIdx]}-${String(rng.int(1, 28)).padStart(2, '0')} ${String(rng.int(8, 22)).padStart(2, '0')}:${String(rng.int(10, 59)).padStart(2, '0')}:${String(rng.int(10, 59)).padStart(2, '0')}`,
      detail: a.result === 'failed' ? '目标资源被占用，操作已回滚' : undefined
    })
  }
  return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export const LOGS: OperationLog[] = buildLogs()

/* ============================ 数据文件 ============================ */

export const DATA_FILES: DataFileItem[] = [
  { id: 1, name: 'car_models_2026Q3.csv', size: 2_480_128, type: '车型数据', status: 'success', progress: 100, uploadedAt: '2026-09-01 09:12:00', rows: 158 },
  { id: 2, name: 'sales_monthly_2024_2026.xlsx', size: 8_912_384, type: '销量数据', status: 'success', progress: 100, uploadedAt: '2026-09-01 09:20:00', rows: 3792 },
  { id: 3, name: 'customer_reviews_2026Q3.csv', size: 1_240_576, type: '评价数据', status: 'success', progress: 100, uploadedAt: '2026-08-30 16:40:00', rows: 240 },
  { id: 4, name: 'brand_master.csv', size: 86_016, type: '车型数据', status: 'failed', progress: 62, uploadedAt: '2026-08-28 11:02:00', message: '第 31 行品牌编码重复，导入中断' },
  { id: 5, name: 'region_sales_2026Q3.xlsx', size: 3_670_016, type: '销量数据', status: 'success', progress: 100, uploadedAt: '2026-08-27 14:35:00', rows: 408 }
]

/* ============================ 后台概览 ============================ */

export function getAdminOverview(): AdminOverview {
  const rng = createRng('admin-overview')
  const lastMonth = NATIONAL_MONTHLY[NATIONAL_MONTHLY.length - 1]
  return {
    todaySales: Math.round(lastMonth / 30),
    monthSales: lastMonth,
    inventory: sum(INVENTORY.map((i) => i.quantity)),
    newUsers: rng.int(38, 168),
    newOrders: rng.int(120, 480),
    recommendCount: rng.int(1200, 3600),
    predictTasks: rng.int(60, 260),
    deltas: {
      todaySales: round(rng.float(-4, 12), 1),
      monthSales: round(rng.float(-2, 9), 1),
      inventory: round(rng.float(-6, 4), 1),
      newUsers: round(rng.float(2, 18), 1),
      newOrders: round(rng.float(-3, 14), 1),
      recommendCount: round(rng.float(5, 26), 1),
      predictTasks: round(rng.float(-8, 16), 1)
    },
    updatedAt: MOCK_UPDATED_AT,
    isMock: true
  }
}

/** 后台销售趋势（近 12 个月） */
export function getAdminSalesTrend() {
  const rng = createRng('admin-sales-trend')
  const from = MONTHS.length - 12
  return {
    months: MONTHS.slice(from),
    sales: NATIONAL_MONTHLY.slice(from),
    orders: MONTHS.slice(from).map((_, i) => Math.round(NATIONAL_MONTHLY[from + i] / clamp(rng.float(1.4, 2.1), 1, 3)))
  }
}

/** 订单状态分布 */
export function getOrderStatus() {
  const counts: Record<string, number> = { pending: 0, paid: 0, delivered: 0, cancelled: 0 }
  ORDERS.forEach((o) => {
    counts[o.status] = (counts[o.status] ?? 0) + 1
  })
  return [
    { name: '待处理', value: counts.pending },
    { name: '已付款', value: counts.paid },
    { name: '已交付', value: counts.delivered },
    { name: '已取消', value: counts.cancelled }
  ]
}

/** 后台车型销量排行 */
export function getAdminCarRanking(limit = 8) {
  return [...CARS]
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limit)
    .map((c) => ({ name: `${c.brand} ${c.name}`, value: c.sales, brand: c.brand }))
}

/** 库存趋势（模拟近 12 个月月末库存） */
export function getInventoryTrend() {
  const rng = createRng('admin-inventory-trend')
  const from = MONTHS.length - 12
  const total = sum(INVENTORY.map((i) => i.quantity))
  return {
    months: MONTHS.slice(from),
    data: MONTHS.slice(from).map((_, i) => Math.round(total * (0.86 + i * 0.014 + rng.float(-0.03, 0.03))))
  }
}

export const BRAND_ADMIN_LIST = BRANDS.map((b) => ({
  ...b,
  status: (b.annualSales ?? 0) > 200_000 ? 'active' : 'active'
}))
