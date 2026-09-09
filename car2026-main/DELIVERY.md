# AutoInsight 交付文档

## 1. 完整项目目录

```
autoinsight/
├── .env.development           # 开发环境（VITE_USE_MOCK=true）
├── .env.production            # 生产环境（VITE_USE_MOCK=false）
├── .env.example               # 环境变量模板
├── index.html                 # 入口 HTML（含启动 loading）
├── package.json
├── tsconfig.json              # TS 严格模式
├── vite.config.ts             # Vite 配置（alias / proxy / manualChunks）
└── src/
    ├── api/                   # API 层（页面只调这里）
    │   ├── auth.ts            # 登录/注册/个人信息
    │   ├── cars.ts            # 车型列表/详情/销量/相似/评价/CRUD
    │   ├── dashboard.ts       # 驾驶舱 9 个端点
    │   ├── market.ts          # 市场分析 11 个端点 + 销量 4 个端点
    ├── mocks/                 # Mock 数据系统
    │   ├── handlers.ts        # Mock 路由表（与 api/ 一一对应）
    │   ├── index.ts           # Mock Axios Adapter
    │   ├── random.ts          # PRNG + 工具函数
    │   ├── brands.ts          # 30 品牌
    │   ├── cars.ts            # 158 车型
    │   ├── sales.ts           # 24 月销量（校准到 2360 万/年）
    │   ├── market.ts          # Dashboard + Market 聚合
    │   ├── recommend.ts       # 推荐算法 Mock（八维度打分）
    │   ├── predict.ts         # 销量预测 Mock（线性外推+季节+置信带）
    │   ├── sentiment.ts       # 舆情（240 条评价）
    │   └── admin.ts           # 后台（46 用户/160 订单/60 库存/120 日志）
    ├── mock/                  # Mock 路由表（自动加载）
    │   ├── handlers.ts        # 与 API 端点一一对应的 Mock 路由
    │   ├── index.ts           # Mock Axios Adapter
    │   ├── random.ts          # PRNG + 工具函数
    │   ├── brands.ts          # 30 品牌
    │   ├── cars.ts            # 158 车型
    │   ├── sales.ts           # 24 月销量
    │   ├── market.ts          # Dashboard + Market 聚合
    │   ├── recommend.ts       # 推荐算法 Mock
    │   ├── predict.ts         # 销量预测 Mock
    │   └── sentiment.ts       # 舆情 Mock
    ├── recommend.ts           # 推荐 API
    ├── predict.ts             # 预测 API
    ├── sentiment.ts           # 舆情 API
    ├── users.ts              # 个人信息 API
    └── admin.ts              # 后台 API（概览/用户/品牌/车型/销量/库存/订单/算法/日志/数据文件）
    ├── assets/               # 静态资源（地图 GeoJSON）
    ├── charts/               # ECharts 主题 + 图表配置工厂
    │   ├── theme.ts          # 按需注册 ECharts + 中国地图
    │   └── builders.ts       # 折线/柱状/饼图/雷达/地图/仪表盘/散点/预测
    ├── components/
    │   ├── common/           # 公共组件
    │   │   ├── AppPagination.vue
    │   │   ├── ChartCard.vue          # 图表四态容器
    │   │   ├── ConfirmDialog.vue
    │   │   ├── DataTable.vue          # 泛型企业表格
    │   │   ├── EmptyState.vue
    │   │   ├── ErrorState.vue
    │   │   ├── FilterBar.vue
    │   │   ├── FilterField.vue
    │   │   ├── LoadingState.vue       # 骨架屏（table/chart/metric/text）
    │   │   ├── MockBadge.vue
    │   │   ├── PageHeader.vue         # 面包屑+标题+更新时间+来源
    │   │   ├── Pagination.vue
    │   │   ├── PredictionCard.vue
    │   │   ├── RecommendationCard.vue
    │   │   ├── ScoreBar.vue
    │   │   ├── SearchBar.vue
    │   │   ├── StatCard.vue           # 指标卡+Sparkline
    │   │   └── StatusTag.vue
    │   ├── charts/           # 图表组件
    │   │   ├── BaseChart.vue          # ECharts 封装（Resize/Loading/Click）
    │   │   ├── BrandRankingChart.vue
    │   │   ├── DistributionBarChart.vue
    │   │   ├── EnergyPieChart.vue
    │   │   ├── GaugeChart.vue
    │   │   ├── KeywordCloud.vue
    │   │   ├── MarketShareChart.vue
    │   │   ├── RadarCompareChart.vue
    │   │   ├── RegionMapChart.vue
    │   │   ├── SalesPredictionChart.vue
    │   │   ├── SalesTrendChart.vue
    │   │   ├── ScatterChart.vue
    │   │   └── SentimentChart.vue
    │   ├── car/              # 车型业务组件
    │   │   ├── CarCard.vue
    │   │   ├── CarCompareCard.vue
    │   │   └── CarThumb.vue            # 品牌色渐变+SVG 剪影
    │   └── layout/
    │       ├── AdminSidebar.vue
    │       └── AppHeader.vue
    ├── composables/
    │   └── useAsyncData.ts             # loading/error/data 三态封装
    ├── constants/
    │   └── index.ts                    # 能源/类别/预算/用途/关注因素/角色/省份
    ├── layouts/
    │   ├── AdminLayout.vue
    │   └── MainLayout.vue
    ├── router/
    │   └── index.ts                    # 路由守卫 + 角色权限
    ├── stores/
    │   ├── app.ts                      # 侧边栏/通知
    │   ├── car.ts                      # 列表/筛选/详情/对比/收藏/浏览记录
    │   ├── dashboard.ts                # 驾驶舱数据
    │   ├── predict.ts                  # 预测
    │   ├── recommend.ts                # 推荐
    │   └── user.ts                     # 登录/Token/角色
    ├── styles/
    │   ├── base.scss                   # reset + 工具类 + 动画
    │   ├── components.scss             # 面板/标签/栅格/骨架
    │   ├── element.scss                # Element Plus 深色变量覆盖
    │   ├── index.scss
    │   └── tokens.scss                 # 全部 Design Token
    ├── types/
    │   ├── api.ts                      # 通用响应/分页/序列点
    │   ├── business.ts                 # 全部业务实体与枚举
    │   ├── dashboard.ts                # 驾驶舱类型
    │   ├── index.ts
    │   └── table.ts                    # TableColumn
    ├── utils/
    │   ├── auth.ts                     # Token / 缓存用户
    │   ├── brand.ts                    # 品牌主色
    │   ├── format.ts                   # 数字/价格/百分比/日期/相对时间
    │   ├── request.ts                  # Axios + Mock Adapter + 拦截器
    │   └── storage.ts                  # localStorage 封装
    └── views/
        ├── Login/index.vue             # 登录页（演示账号快捷填充）
        ├── Dashboard/index.vue         # 数据驾驶舱（5 指标 + 8 图表）
        ├── Market/index.vue            # 市场分析（筛选联动 7 图表）
        ├── Cars/
        │   ├── index.vue               # 车型中心（企业表格+批量对比）
        │   └── Detail.vue              # 车型详情（参数/销量/评价/相似）
        ├── Compare/index.vue           # 车型对比（参数表+雷达+分析）
        ├── Recommend/index.vue         # 智能推荐（表单→摘要→结果）
        ├── Predict/index.vue           # 销量预测（历史+预测+置信带）
        ├── Sentiment/index.vue         # 舆情分析（环形+趋势+词云）
        ├── Profile/index.vue           # 个人中心（收藏+浏览记录）
        ├── Error/NotFound.vue          # 404
        └── Admin/
            ├── Overview.vue            # 后台驾驶舱
            ├── Users.vue               # 用户管理
            ├── Brands.vue              # 品牌管理
            ├── CarsManagement.vue      # 车型管理 CRUD
            ├── SalesData.vue           # 销量数据
            ├── Inventory.vue           # 库存管理
            ├── Orders.vue              # 订单管理
            ├── Algorithms.vue          # 算法管理
            ├── Logs.vue                # 操作日志
            └── Data.vue                # 数据管理（上传+文件列表）
```

## 2. 启动命令

```bash
# 安装依赖
npm install

# 开发模式（Mock 数据）
npm run dev

# 类型检查
npm run type-check

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

## 3. 环境变量配置方式

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_API_BASE_URL` | `/api` | API 基础路径，开发时通过 Vite proxy 转发到后端 |
| `VITE_USE_MOCK` | `true` | `true`=使用 Mock Adapter；`false`=请求真实后端 |
| `VITE_MOCK_DELAY` | `260` | Mock 响应延迟（毫秒），模拟网络 |
| `VITE_APP_TITLE` | `AutoInsight` | 页面标题 |
| `VITE_DEV_PROXY_TARGET` | `http://127.0.0.1:8000` | 开发时 proxy 转发目标（FastAPI） |

**切换到真实后端**：将 `.env.production` 中 `VITE_USE_MOCK` 改为 `false`，设置 `VITE_API_BASE_URL` 为后端地址即可。

## 4. Mock API 说明

Mock 系统通过 **自定义 Axios Adapter** 实现，对业务层完全透明：

- `src/mock/handlers.ts` 定义了与 `src/api/*` 一一对应的路由表
- `src/mock/index.ts` 的 `mockAdapter` 拦截所有 Axios 请求，按 URL + Method 匹配 Mock 路由
- Mock 数据由 `src/mock/` 下的各模块确定性生成（mulberry32 PRNG，刷新数据不跳变）
- 统一返回 `{ code: 0, message: '', data, timestamp }` 结构

**演示账号**：
| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| admin | admin | admin123 | 全部页面 |
| analyst | analyst | analyst123 | 分析/预测/推荐/Dashboard |
| sales | sales | sales123 | 车型/订单/库存 |
| user | user | user123 | 首页/车型/对比/推荐/预测 |

## 5. 后端 API 对接说明

1. 后端需实现 `src/api/` 中定义的所有接口
2. 统一响应格式：`{ code: number, message: string, data: T }`，`code=0` 表示成功
3. `code=401` 触发自动退出并跳转登录页
4. 分页接口返回 `{ list: T[], total: number, page: number, pageSize: number }`
5. 开发时设置 `VITE_DEV_PROXY_TARGET` 指向 FastAPI 地址，Vite 会自动转发 `/api/*`
6. 生产环境设置 `VITE_API_BASE_URL` 为后端完整地址

## 6. 已完成页面清单

| # | 页面 | 路径 | 状态 |
|---|------|------|------|
| 1 | 登录页 | /login | ✅ |
| 2 | 数据驾驶舱 | /dashboard | ✅ |
| 3 | 汽车市场分析 | /market | ✅ |
| 4 | 车型中心 | /cars | ✅ |
| 5 | 车型详情 | /cars/:id | ✅ |
| 6 | 车型对比 | /compare | ✅ |
| 7 | 智能购车推荐 | /recommend | ✅ |
| 8 | 销量预测 | /predict | ✅ |
| 9 | 舆情分析 | /sentiment | ✅ |
| 10 | 个人中心 | /profile | ✅ |
| 11 | 404 页面 | /* | ✅ |
| 12 | 后台-系统概览 | /admin/overview | ✅ |
| 13 | 后台-用户管理 | /admin/users | ✅ |
| 14 | 后台-品牌管理 | /admin/brands | ✅ |
| 15 | 后台-车型管理 | /admin/cars | ✅ |
| 16 | 后台-销量数据 | /admin/sales | ✅ |
| 17 | 后台-库存管理 | /admin/inventory | ✅ |
| 18 | 后台-订单管理 | /admin/orders | ✅ |
| 19 | 后台-算法管理 | /admin/algorithms | ✅ |
| 20 | 后台-操作日志 | /admin/logs | ✅ |
| 21 | 后台-数据管理 | /admin/data | ✅ |

**TypeScript 类型检查**：✅ 零错误
**生产构建**：✅ 成功

## 7. 后端需提供的数据字段清单

### 认证
```
POST /api/auth/login
  Request:  { username: string, password: string }
  Response: { token: string, user: { id, username, role, nickname, avatar? } }

GET /api/users/me
  Response: { id, username, role, nickname, avatar?, createdAt, lastLoginAt? }
```

### 驾驶舱
```
GET /api/dashboard/overview
  Response: { metrics: MetricItem[], hotBrands: string[] }
  MetricItem: { label, value, unit?, change?, trend?: number[], tone?, format? }

GET /api/dashboard/trend?span=18
  Response: { months: string[], series: SeriesItem[], yoy?: number[] }

GET /api/dashboard/brand-ranking?limit=10
  Response: RankingItem[] { name, value, share?, yoy?, extra? }

GET /api/dashboard/energy
  Response: { items: ProportionItem[], trend?: MultiSeries }

GET /api/dashboard/region?span=12
  Response: RegionSalesItem[] { name, value, yoy?, penetration? }

GET /api/dashboard/price
  Response: { buckets: { label, value }[] }

GET /api/dashboard/growth
  Response: { months, marketSize, growthRate }

GET /api/dashboard/car-ranking?limit=10
  Response: { name, value, brand }[]

GET /api/dashboard/scatter?limit=60
  Response: CarScatterItem[] { name, price, sales, energy }
```

### 车型
```
GET /api/cars?page=1&pageSize=10&keyword=&brandId=&energyType=&category=&year=&sortBy=sales&sortOrder=desc
  Response: PageResult<Car>
  Car: { id, name, brand, brandId, price, energyType, range?, battery?, power, torque?,
         length, width, height, wheelbase, category, launchYear, launchMonth?,
         intelligenceScore, comfortScore, spaceScore, performanceScore, rating,
         sales, lastMonthSales, rank, tags? }

GET /api/cars/:id
GET /api/cars/:id/sales?span=18
  Response: { carId, carName, points: SeriesPoint[], yoy?: number[] }

GET /api/cars/:id/similar?limit=4
GET /api/cars/:id/reviews?page=1&pageSize=10
POST /api/cars, PUT /api/cars/:id, DELETE /api/cars/:id
```

### 市场
```
GET /api/market/trend?year=&month=&brandId=&energyType=&region=&span=12
GET /api/market/share
GET /api/market/penetration
GET /api/market/region
GET /api/market/energy
GET /api/market/price
GET /api/market/brand-rank
GET /api/market/category
GET /api/market/category-trend
```

### 推荐
```
GET /api/recommend/options
POST /api/recommend
  Request: { budget, energyTypes, scenarios, province, city, weights, topN? }
  Response: { summary, recommendations: Recommendation[] }
  Recommendation: { carId, carName, brand, image?, score, reason, scores: ScoreDimension[], highlights? }
```

### 预测
```
GET /api/predict/sales?carId=1&horizon=6
  Response: { carId, model, accuracy, history: PredictPoint[], prediction: PredictPoint[],
              growthRate, peakMonth, lowMonth, features?: {name,value}[], updatedAt }
  PredictPoint: { month, value, lower?, upper? }
```

### 舆情
```
GET /api/sentiment/overview
  Response: { positive, neutral, negative, total }
GET /api/sentiment/trend?span=12
GET /api/sentiment/keywords
  Response: { positive: KeywordItem[], negative: KeywordItem[], hot: KeywordItem[] }
GET /api/sentiment/brand-reputation
GET /api/reviews?page=1&pageSize=10&sentiment=&brand=
```

### 后台
```
GET /api/admin/overview
GET /api/admin/sales-trend
GET /api/admin/order-status
GET /api/admin/car-ranking?limit=8
GET /api/admin/inventory-trend
GET /api/admin/users?page=&pageSize=&keyword=&role=&status=
PUT /api/admin/users/:id, PATCH /api/admin/users/:id/status
GET /api/admin/brands?page=&pageSize=&keyword=&group=&sortBy=&sortOrder=
GET /api/admin/cars?page=&pageSize=&keyword=&brandId=&energyType=&category=&sortBy=&sortOrder=
GET /api/admin/sales?page=&pageSize=&span=
GET /api/admin/inventory?page=&pageSize=&keyword=&status=&sortBy=&sortOrder=
GET /api/admin/orders?page=&pageSize=&keyword=&status=
GET /api/admin/algorithms
PATCH /api/admin/algorithms/:id/status
GET /api/admin/logs?page=&pageSize=&keyword=&module=&result=
GET /api/admin/data-files?type=
POST /api/admin/data/upload
DELETE /api/admin/data-files/:id
```
