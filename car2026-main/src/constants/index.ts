import type { BudgetRange, CarCategory, ConcernFactor, EnergyType, UserRole, UsageScenario } from '@/types'

/**
 * 业务常量（与后端枚举保持一致）
 * 放在前端 constants 中，避免视图层依赖 mock 数据
 */

export const ENERGY_LABEL: Record<EnergyType, string> = {
  BEV: '纯电',
  PHEV: '插电混动',
  HEV: '油电混动',
  ICE: '燃油'
}

export const ENERGY_SHORT: Record<EnergyType, string> = {
  BEV: '纯电',
  PHEV: '插混',
  HEV: '混动',
  ICE: '燃油'
}

export const ENERGY_COLOR: Record<EnergyType, string> = {
  BEV: '#111111',
  PHEV: '#5f5f5b',
  HEV: '#85857f',
  ICE: '#c2c2bc'
}

export const ENERGY_OPTIONS: { value: EnergyType; label: string }[] = [
  { value: 'BEV', label: '纯电' },
  { value: 'PHEV', label: '插电混动' },
  { value: 'HEV', label: '油电混动' },
  { value: 'ICE', label: '燃油' }
]

export const CAR_CATEGORIES: CarCategory[] = ['轿车', 'SUV', 'MPV', '跑车', '皮卡']

export const BUDGET_OPTIONS: { value: BudgetRange; label: string; min: number; max: number }[] = [
  { value: 'lt10', label: '10万以下', min: 0, max: 10 },
  { value: '10-15', label: '10~15万', min: 10, max: 15 },
  { value: '15-20', label: '15~20万', min: 15, max: 20 },
  { value: '20-30', label: '20~30万', min: 20, max: 30 },
  { value: 'gt30', label: '30万以上', min: 30, max: 1000 }
]

export const USAGE_OPTIONS: { value: UsageScenario; label: string; desc: string }[] = [
  { value: 'commute', label: '通勤代步', desc: '日常上下班、城市短途出行' },
  { value: 'family', label: '家庭用车', desc: '多人出行、儿童安全座椅' },
  { value: 'business', label: '商务接待', desc: '形象气质、乘坐舒适性' },
  { value: 'longtrip', label: '长途自驾', desc: '高速续航、可靠性' },
  { value: 'outdoor', label: '户外越野', desc: '通过性、装载能力' }
]

export const CONCERN_OPTIONS: { value: ConcernFactor; label: string; desc: string }[] = [
  { value: 'price', label: '价格', desc: '购车预算与用车成本' },
  { value: 'range', label: '续航', desc: '续航里程与补能便利性' },
  { value: 'performance', label: '性能', desc: '动力与操控表现' },
  { value: 'space', label: '空间', desc: '乘坐与装载空间' },
  { value: 'intelligence', label: '智能化', desc: '智能座舱与辅助驾驶' },
  { value: 'comfort', label: '舒适性', desc: '底盘滤震与静谧性' }
]

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: '系统管理员',
  analyst: '数据分析师',
  sales: '销售运营',
  user: '普通用户'
}

export const ROLE_OPTIONS: { value: UserRole | 'all'; label: string }[] = [
  { value: 'all', label: '全部角色' },
  { value: 'admin', label: '系统管理员' },
  { value: 'analyst', label: '数据分析师' },
  { value: 'sales', label: '销售运营' },
  { value: 'user', label: '普通用户' }
]

export const PROVINCES = [
  '广东省', '江苏省', '山东省', '浙江省', '河南省', '四川省', '河北省', '湖北省',
  '湖南省', '安徽省', '上海市', '北京市', '福建省', '陕西省', '重庆市', '天津市'
]

export const CITY_MAP: Record<string, string[]> = {
  广东省: ['广州市', '深圳市', '东莞市', '佛山市'],
  江苏省: ['南京市', '苏州市', '无锡市', '常州市'],
  山东省: ['济南市', '青岛市', '烟台市', '潍坊市'],
  浙江省: ['杭州市', '宁波市', '温州市', '嘉兴市'],
  河南省: ['郑州市', '洛阳市', '南阳市'],
  四川省: ['成都市', '绵阳市', '德阳市'],
  河北省: ['石家庄市', '唐山市', '保定市'],
  湖北省: ['武汉市', '宜昌市', '襄阳市'],
  湖南省: ['长沙市', '株洲市', '湘潭市'],
  安徽省: ['合肥市', '芜湖市'],
  上海市: ['上海市'],
  北京市: ['北京市'],
  福建省: ['福州市', '厦门市', '泉州市'],
  陕西省: ['西安市', '咸阳市'],
  重庆市: ['重庆市'],
  天津市: ['天津市']
}

export const PREDICT_HORIZONS: { value: 3 | 6 | 12; label: string }[] = [
  { value: 3, label: '未来 3 个月' },
  { value: 6, label: '未来 6 个月' },
  { value: 12, label: '未来 12 个月' }
]
