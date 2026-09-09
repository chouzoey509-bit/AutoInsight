import type { Brand, EnergyType } from '@/types'

/**
 * 品牌数据（30 个）
 * ------------------------------------------------------------
 * weight 为市场规模权重，用于生成销量时保持品牌之间的量级关系合理，
 * 避免「小众品牌销量超过头部品牌」这类逻辑矛盾。
 */
export interface BrandSeed extends Brand {
  /** 市场规模权重（相对值） */
  weight: number
}

export const BRANDS: BrandSeed[] = [
  { id: 1, name: '比亚迪', nameEn: 'BYD', country: '中国', group: '自主', color: '#d0202f', foundedYear: 1995, energyFocus: ['BEV', 'PHEV'], weight: 100 },
  { id: 2, name: '特斯拉', nameEn: 'Tesla', country: '美国', group: '新势力', color: '#e31937', foundedYear: 2003, energyFocus: ['BEV'], weight: 58 },
  { id: 3, name: '大众', nameEn: 'Volkswagen', country: '德国', group: '德系', color: '#1c5faa', foundedYear: 1937, energyFocus: ['ICE', 'BEV'], weight: 86 },
  { id: 4, name: '丰田', nameEn: 'Toyota', country: '日本', group: '日系', color: '#d71920', foundedYear: 1937, energyFocus: ['ICE', 'HEV'], weight: 76 },
  { id: 5, name: '本田', nameEn: 'Honda', country: '日本', group: '日系', color: '#0f4da0', foundedYear: 1948, energyFocus: ['ICE', 'HEV'], weight: 50 },
  { id: 6, name: '日产', nameEn: 'Nissan', country: '日本', group: '日系', color: '#c3002f', foundedYear: 1933, energyFocus: ['ICE', 'BEV'], weight: 32 },
  { id: 7, name: '吉利', nameEn: 'Geely', country: '中国', group: '自主', color: '#0b3d91', foundedYear: 1997, energyFocus: ['ICE', 'PHEV', 'BEV'], weight: 68 },
  { id: 8, name: '长安', nameEn: 'Changan', country: '中国', group: '自主', color: '#0d4c8b', foundedYear: 1862, energyFocus: ['ICE', 'PHEV', 'BEV'], weight: 64 },
  { id: 9, name: '哈弗', nameEn: 'Haval', country: '中国', group: '自主', color: '#a01f24', foundedYear: 1984, energyFocus: ['ICE', 'PHEV'], weight: 46 },
  { id: 10, name: '奇瑞', nameEn: 'Chery', country: '中国', group: '自主', color: '#0f5c8c', foundedYear: 1997, energyFocus: ['ICE', 'PHEV', 'BEV'], weight: 56 },
  { id: 11, name: '五菱', nameEn: 'Wuling', country: '中国', group: '自主', color: '#b8232f', foundedYear: 2002, energyFocus: ['BEV', 'ICE'], weight: 44 },
  { id: 12, name: '广汽埃安', nameEn: 'Aion', country: '中国', group: '新势力', color: '#17a2b8', foundedYear: 2017, energyFocus: ['BEV'], weight: 38 },
  { id: 13, name: '理想', nameEn: 'Li Auto', country: '中国', group: '新势力', color: '#1a9c6b', foundedYear: 2015, energyFocus: ['PHEV', 'BEV'], weight: 41 },
  { id: 14, name: '蔚来', nameEn: 'NIO', country: '中国', group: '新势力', color: '#2b6cb0', foundedYear: 2014, energyFocus: ['BEV'], weight: 29 },
  { id: 15, name: '小鹏', nameEn: 'XPeng', country: '中国', group: '新势力', color: '#00a19a', foundedYear: 2014, energyFocus: ['BEV'], weight: 31 },
  { id: 16, name: '零跑', nameEn: 'Leapmotor', country: '中国', group: '新势力', color: '#00a0e9', foundedYear: 2015, energyFocus: ['BEV', 'PHEV'], weight: 25 },
  { id: 17, name: '问界', nameEn: 'AITO', country: '中国', group: '新势力', color: '#c8963e', foundedYear: 2021, energyFocus: ['PHEV', 'BEV'], weight: 37 },
  { id: 18, name: '小米', nameEn: 'Xiaomi', country: '中国', group: '新势力', color: '#ff6900', foundedYear: 2021, energyFocus: ['BEV'], weight: 27 },
  { id: 19, name: '极氪', nameEn: 'ZEEKR', country: '中国', group: '新势力', color: '#6c7a89', foundedYear: 2021, energyFocus: ['BEV'], weight: 21 },
  { id: 20, name: '深蓝', nameEn: 'Deepal', country: '中国', group: '自主', color: '#1f6feb', foundedYear: 2022, energyFocus: ['BEV', 'PHEV'], weight: 19 },
  { id: 21, name: '岚图', nameEn: 'Voyah', country: '中国', group: '自主', color: '#3b5bdb', foundedYear: 2019, energyFocus: ['BEV', 'PHEV'], weight: 11 },
  { id: 22, name: '领克', nameEn: 'Lynk & Co', country: '中国', group: '自主', color: '#5a6472', foundedYear: 2016, energyFocus: ['PHEV', 'ICE'], weight: 23 },
  { id: 23, name: '宝马', nameEn: 'BMW', country: '德国', group: '德系', color: '#0166b1', foundedYear: 1916, energyFocus: ['ICE', 'BEV'], weight: 43 },
  { id: 24, name: '奔驰', nameEn: 'Mercedes-Benz', country: '德国', group: '德系', color: '#2f6fb0', foundedYear: 1926, energyFocus: ['ICE', 'BEV'], weight: 41 },
  { id: 25, name: '奥迪', nameEn: 'Audi', country: '德国', group: '德系', color: '#bb0a30', foundedYear: 1909, energyFocus: ['ICE', 'BEV'], weight: 39 },
  { id: 26, name: '沃尔沃', nameEn: 'Volvo', country: '瑞典', group: '欧系', color: '#003057', foundedYear: 1927, energyFocus: ['ICE', 'PHEV', 'BEV'], weight: 13 },
  { id: 27, name: '现代', nameEn: 'Hyundai', country: '韩国', group: '韩系', color: '#00205b', foundedYear: 1967, energyFocus: ['ICE', 'BEV'], weight: 15 },
  { id: 28, name: '起亚', nameEn: 'Kia', country: '韩国', group: '韩系', color: '#0b3d62', foundedYear: 1944, energyFocus: ['ICE', 'BEV'], weight: 9 },
  { id: 29, name: '别克', nameEn: 'Buick', country: '美国', group: '美系', color: '#003876', foundedYear: 1903, energyFocus: ['ICE', 'PHEV', 'BEV'], weight: 28 },
  { id: 30, name: '福特', nameEn: 'Ford', country: '美国', group: '美系', color: '#00274c', foundedYear: 1903, energyFocus: ['ICE', 'BEV'], weight: 20 }
]

export const BRAND_MAP: Record<number, BrandSeed> = BRANDS.reduce<Record<number, BrandSeed>>((acc, b) => {
  acc[b.id] = b
  return acc
}, {})

export function getBrandName(id: number): string {
  return BRAND_MAP[id]?.name ?? '未知品牌'
}

export function getBrandColor(id: number): string {
  return BRAND_MAP[id]?.color ?? '#2e7cf6'
}

/** 能源类型中文映射 */
export const ENERGY_LABEL: Record<EnergyType, string> = {
  BEV: '纯电',
  PHEV: '插电混动',
  HEV: '油电混动',
  ICE: '燃油'
}

/** 能源类型对应色值（与图表色板一致） */
export const ENERGY_COLOR: Record<EnergyType, string> = {
  BEV: '#16c79a',
  PHEV: '#2e7cf6',
  HEV: '#9a7bff',
  ICE: '#f5a524'
}

export const ENERGY_TYPES: EnergyType[] = ['BEV', 'PHEV', 'HEV', 'ICE']

export const CAR_CATEGORIES = ['轿车', 'SUV', 'MPV', '跑车', '皮卡'] as const
