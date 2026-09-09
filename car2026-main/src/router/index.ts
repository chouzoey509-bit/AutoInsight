import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { UserRole } from '@/types'
import { getToken } from '@/utils/auth'

/**
 * 路由表
 * ------------------------------------------------------------
 * meta.roles   允许访问的角色，为空表示登录即可访问
 * meta.public  无需登录
 * meta.title   菜单 / 面包屑 / 文档标题
 * meta.icon    Element Plus 图标名
 */

const MainLayout = () => import('@/layouts/MainLayout.vue')
const AdminLayout = () => import('@/layouts/AdminLayout.vue')

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/index.vue'),
    meta: { title: '登录', public: true, hidden: true }
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard/index.vue'),
        meta: { title: '数据驾驶舱', icon: 'Odometer', roles: ['admin', 'analyst', 'sales', 'user'] }
      },
      {
        path: 'market',
        name: 'Market',
        component: () => import('@/views/Market/index.vue'),
        meta: { title: '汽车市场分析', icon: 'DataLine', roles: ['admin', 'analyst'] }
      },
      {
        path: 'insight',
        name: 'Insight',
        component: () => import('@/views/Insight/index.vue'),
        meta: { title: '行业洞察', icon: 'DataAnalysis', roles: ['admin', 'analyst'] }
      },
      {
        path: 'cars',
        name: 'Cars',
        component: () => import('@/views/Cars/index.vue'),
        meta: { title: '车型分析', icon: 'Grid', roles: ['admin', 'analyst', 'sales', 'user'] }
      },
      {
        path: 'cars/:id',
        name: 'CarDetail',
        component: () => import('@/views/Cars/Detail.vue'),
        meta: { title: '车型详情', hidden: true, roles: ['admin', 'analyst', 'sales', 'user'] }
      },
      {
        path: 'compare',
        name: 'Compare',
        component: () => import('@/views/Compare/index.vue'),
        meta: { title: '市场对比', icon: 'Operation', roles: ['admin', 'analyst', 'sales', 'user'] }
      },
      {
        path: 'recommend',
        name: 'Recommend',
        component: () => import('@/views/Recommend/index.vue'),
        meta: { title: '智能购车推荐', icon: 'MagicStick', roles: ['admin', 'analyst', 'user'] }
      },
      {
        path: 'predict',
        name: 'Predict',
        component: () => import('@/views/Predict/index.vue'),
        meta: { title: '销量预测', icon: 'TrendCharts', roles: ['admin', 'analyst', 'user'] }
      },
      {
        path: 'sentiment',
        name: 'Sentiment',
        component: () => import('@/views/Sentiment/index.vue'),
        meta: { title: '舆情分析', icon: 'ChatDotRound', roles: ['admin', 'analyst'] }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile/index.vue'),
        meta: { title: '个人中心', hidden: true, roles: ['admin', 'analyst', 'sales', 'user'] }
      }
    ]
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { title: '企业管理后台', icon: 'Setting', roles: ['admin', 'sales'] },
    redirect: '/admin/overview',
    children: [
      {
        path: 'overview',
        name: 'AdminOverview',
        component: () => import('@/views/Admin/Overview.vue'),
        meta: { title: '系统概览', icon: 'DataBoard', roles: ['admin'] }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/Admin/Users.vue'),
        meta: { title: '用户管理', icon: 'User', roles: ['admin'] }
      },
      {
        path: 'brands',
        name: 'AdminBrands',
        component: () => import('@/views/Admin/Brands.vue'),
        meta: { title: '品牌管理', icon: 'Collection', roles: ['admin'] }
      },
      {
        path: 'cars',
        name: 'AdminCars',
        component: () => import('@/views/Admin/CarsManagement.vue'),
        meta: { title: '车型管理', icon: 'Grid', roles: ['admin'] }
      },
      {
        path: 'sales',
        name: 'AdminSales',
        component: () => import('@/views/Admin/SalesData.vue'),
        meta: { title: '销量数据', icon: 'Histogram', roles: ['admin'] }
      },
      {
        path: 'inventory',
        name: 'AdminInventory',
        component: () => import('@/views/Admin/Inventory.vue'),
        meta: { title: '库存管理', icon: 'Box', roles: ['admin', 'sales'] }
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: () => import('@/views/Admin/Orders.vue'),
        meta: { title: '订单管理', icon: 'Tickets', roles: ['admin', 'sales'] }
      },
      {
        path: 'algorithms',
        name: 'AdminAlgorithms',
        component: () => import('@/views/Admin/Algorithms.vue'),
        meta: { title: '算法管理', icon: 'Cpu', roles: ['admin'] }
      },
      {
        path: 'logs',
        name: 'AdminLogs',
        component: () => import('@/views/Admin/Logs.vue'),
        meta: { title: '操作日志', icon: 'Document', roles: ['admin'] }
      },
      {
        path: 'data',
        name: 'AdminData',
        component: () => import('@/views/Admin/Data.vue'),
        meta: { title: '数据管理', icon: 'FolderOpened', roles: ['admin'] }
      }
    ]
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/Error/NotFound.vue'),
    meta: { title: '无访问权限', public: true, hidden: true, forbidden: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/Error/NotFound.vue'),
    meta: { title: '页面不存在', public: true, hidden: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

/** 各角色登录后的落地页 */
export const ROLE_HOME: Record<UserRole, string> = {
  admin: '/dashboard',
  analyst: '/market',
  sales: '/admin/orders',
  user: '/dashboard'
}

/** 保存登录前的目标地址，登录成功后回跳 */
export function roleHome(role: UserRole | undefined): string {
  return ROLE_HOME[role ?? 'user'] ?? '/dashboard'
}

router.beforeEach(async (to, _from, next) => {
  document.title = to.meta.title
    ? `${to.meta.title as string} · AutoInsight`
    : 'AutoInsight · 汽车行业数据智能分析与决策平台'

  if (to.meta.public) {
    // 已登录访问登录页 → 直接回到业务页
    if (to.path === '/login' && getToken()) {
      next({ path: '/dashboard' })
      return
    }
    next()
    return
  }

  if (!getToken()) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // 角色校验在 store 初始化后执行（避免与 Pinia 循环依赖）
  const { useUserStore } = await import('@/stores/user')
  const userStore = useUserStore()
  if (!userStore.profile && userStore.token) {
    await userStore.fetchProfile()
  }

  const roles = to.meta.roles as UserRole[] | undefined
  if (roles && roles.length && !roles.includes(userStore.role)) {
    ElMessage.warning('当前角色无访问权限，已返回首页')
    next({ path: roleHome(userStore.role) })
    return
  }

  next()
})

export default router
