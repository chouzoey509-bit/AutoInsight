import type { Car, CarCategory, EnergyType } from '@/types'
import { BRANDS, BRAND_MAP } from './brands'
import { clamp, createRng, round } from './random'

/**
 * 车型数据生成（158 款在售车型）
 * ------------------------------------------------------------
 * 采用「品牌 + 车型种子 → 派生参数」的方式生成，保证数据逻辑自洽：
 *   - 能源类型必定属于品牌主打能源范围
 *   - 只有新能源车型才有续航 / 电池容量
 *   - 价格与尺寸、功率、续航正相关
 * 后续接真实后端时，本文件整体废弃即可，API 契约不变。
 */

interface ModelSeed {
  name: string
  category: CarCategory
  /** 基准指导价（万元） */
  price: number
  /** 该车型提供的能源版本 */
  energy: EnergyType[]
}

const MODEL_SEEDS: Record<number, ModelSeed[]> = {
  1: [
    { name: '秦PLUS', category: '轿车', price: 9.98, energy: ['PHEV', 'BEV'] },
    { name: '汉', category: '轿车', price: 20.98, energy: ['BEV', 'PHEV'] },
    { name: '宋PLUS', category: 'SUV', price: 15.98, energy: ['BEV', 'PHEV'] },
    { name: '元PLUS', category: 'SUV', price: 13.98, energy: ['BEV'] },
    { name: '海豚', category: '轿车', price: 11.68, energy: ['BEV'] },
    { name: '唐', category: 'SUV', price: 24.98, energy: ['PHEV'] },
    { name: '海鸥', category: '轿车', price: 7.38, energy: ['BEV'] }
  ],
  2: [
    { name: 'Model Y', category: 'SUV', price: 26.39, energy: ['BEV'] },
    { name: 'Model 3', category: '轿车', price: 24.59, energy: ['BEV'] },
    { name: 'Model X', category: 'SUV', price: 83.89, energy: ['BEV'] },
    { name: 'Model S', category: '轿车', price: 78.89, energy: ['BEV'] }
  ],
  3: [
    { name: '朗逸', category: '轿车', price: 12.09, energy: ['ICE'] },
    { name: '帕萨特', category: '轿车', price: 18.99, energy: ['ICE'] },
    { name: '途观L', category: 'SUV', price: 22.38, energy: ['ICE'] },
    { name: '探岳', category: 'SUV', price: 20.49, energy: ['ICE'] },
    { name: 'ID.4 CROZZ', category: 'SUV', price: 19.39, energy: ['BEV'] },
    { name: 'ID.3', category: '轿车', price: 16.29, energy: ['BEV'] }
  ],
  4: [
    { name: '卡罗拉', category: '轿车', price: 11.98, energy: ['ICE', 'HEV'] },
    { name: '凯美瑞', category: '轿车', price: 19.98, energy: ['ICE', 'HEV'] },
    { name: 'RAV4荣放', category: 'SUV', price: 17.68, energy: ['ICE', 'HEV'] },
    { name: '锋兰达', category: 'SUV', price: 12.58, energy: ['ICE'] },
    { name: '亚洲龙', category: '轿车', price: 20.98, energy: ['HEV'] },
    { name: '格瑞维亚', category: 'MPV', price: 31.98, energy: ['HEV'] }
  ],
  5: [
    { name: '雅阁', category: '轿车', price: 17.98, energy: ['ICE'] },
    { name: '思域', category: '轿车', price: 12.99, energy: ['ICE'] },
    { name: 'CR-V', category: 'SUV', price: 18.59, energy: ['ICE', 'HEV'] },
    { name: '皓影', category: 'SUV', price: 18.99, energy: ['ICE', 'HEV'] },
    { name: '艾力绅', category: 'MPV', price: 27.98, energy: ['HEV'] }
  ],
  6: [
    { name: '轩逸', category: '轿车', price: 10.86, energy: ['ICE'] },
    { name: '天籁', category: '轿车', price: 17.98, energy: ['ICE'] },
    { name: '逍客', category: 'SUV', price: 12.59, energy: ['ICE'] },
    { name: '奇骏', category: 'SUV', price: 18.19, energy: ['ICE'] },
    { name: 'ARIYA艾睿雅', category: 'SUV', price: 19.99, energy: ['BEV'] }
  ],
  7: [
    { name: '星越L', category: 'SUV', price: 13.72, energy: ['ICE'] },
    { name: '帝豪', category: '轿车', price: 6.99, energy: ['ICE'] },
    { name: '银河E8', category: '轿车', price: 17.58, energy: ['BEV'] },
    { name: '银河L7', category: 'SUV', price: 13.87, energy: ['PHEV'] },
    { name: '星愿', category: '轿车', price: 7.98, energy: ['BEV'] }
  ],
  8: [
    { name: 'CS75 PLUS', category: 'SUV', price: 12.49, energy: ['ICE'] },
    { name: '逸动', category: '轿车', price: 7.29, energy: ['ICE'] },
    { name: '深蓝SL03', category: '轿车', price: 15.69, energy: ['BEV', 'PHEV'] },
    { name: 'UNI-V', category: '轿车', price: 10.89, energy: ['ICE'] },
    { name: 'Lumin', category: '轿车', price: 4.99, energy: ['BEV'] }
  ],
  9: [
    { name: 'H6', category: 'SUV', price: 11.79, energy: ['ICE', 'PHEV'] },
    { name: '大狗', category: 'SUV', price: 12.98, energy: ['ICE'] },
    { name: '猛龙', category: 'SUV', price: 16.58, energy: ['PHEV'] },
    { name: '枭龙MAX', category: 'SUV', price: 15.98, energy: ['PHEV'] }
  ],
  10: [
    { name: '瑞虎8', category: 'SUV', price: 10.99, energy: ['ICE'] },
    { name: '艾瑞泽8', category: '轿车', price: 9.99, energy: ['ICE'] },
    { name: '捷途旅行者', category: 'SUV', price: 13.99, energy: ['ICE'] },
    { name: '星纪元ET', category: 'SUV', price: 22.98, energy: ['BEV', 'PHEV'] },
    { name: '风云A8', category: '轿车', price: 11.99, energy: ['PHEV'] },
    { name: 'iCAR 03', category: 'SUV', price: 12.98, energy: ['BEV'] }
  ],
  11: [
    { name: '宏光MINIEV', category: '轿车', price: 3.28, energy: ['BEV'] },
    { name: '缤果', category: '轿车', price: 5.98, energy: ['BEV'] },
    { name: '星光', category: '轿车', price: 8.88, energy: ['BEV', 'PHEV'] },
    { name: '星辰', category: 'SUV', price: 6.98, energy: ['ICE'] }
  ],
  12: [
    { name: 'AION S', category: '轿车', price: 14.98, energy: ['BEV'] },
    { name: 'AION Y', category: 'SUV', price: 12.98, energy: ['BEV'] },
    { name: 'AION V', category: 'SUV', price: 17.98, energy: ['BEV'] },
    { name: '昊铂HT', category: 'SUV', price: 22.98, energy: ['BEV'] }
  ],
  13: [
    { name: 'L6', category: 'SUV', price: 24.98, energy: ['PHEV'] },
    { name: 'L7', category: 'SUV', price: 30.18, energy: ['PHEV'] },
    { name: 'L8', category: 'SUV', price: 32.18, energy: ['PHEV'] },
    { name: 'L9', category: 'SUV', price: 42.98, energy: ['PHEV'] },
    { name: 'MEGA', category: 'MPV', price: 52.98, energy: ['BEV'] }
  ],
  14: [
    { name: 'ES6', category: 'SUV', price: 33.8, energy: ['BEV'] },
    { name: 'ET5', category: '轿车', price: 29.8, energy: ['BEV'] },
    { name: 'ES8', category: 'SUV', price: 49.8, energy: ['BEV'] },
    { name: 'EC6', category: 'SUV', price: 35.8, energy: ['BEV'] },
    { name: 'ET7', category: '轿车', price: 42.8, energy: ['BEV'] }
  ],
  15: [
    { name: 'G6', category: 'SUV', price: 20.99, energy: ['BEV'] },
    { name: 'P7', category: '轿车', price: 22.39, energy: ['BEV'] },
    { name: 'G9', category: 'SUV', price: 26.39, energy: ['BEV'] },
    { name: 'X9', category: 'MPV', price: 35.98, energy: ['BEV'] },
    { name: 'MONA M03', category: '轿车', price: 11.98, energy: ['BEV'] }
  ],
  16: [
    { name: 'C11', category: 'SUV', price: 15.58, energy: ['BEV', 'PHEV'] },
    { name: 'C10', category: 'SUV', price: 12.88, energy: ['BEV', 'PHEV'] },
    { name: 'T03', category: '轿车', price: 5.99, energy: ['BEV'] },
    { name: 'C16', category: 'SUV', price: 15.58, energy: ['BEV', 'PHEV'] }
  ],
  17: [
    { name: 'M5', category: 'SUV', price: 24.98, energy: ['PHEV', 'BEV'] },
    { name: 'M7', category: 'SUV', price: 28.98, energy: ['PHEV', 'BEV'] },
    { name: 'M9', category: 'SUV', price: 46.98, energy: ['PHEV', 'BEV'] }
  ],
  18: [
    { name: 'SU7', category: '轿车', price: 21.59, energy: ['BEV'] },
    { name: 'SU7 Pro', category: '轿车', price: 24.59, energy: ['BEV'] },
    { name: 'SU7 Max', category: '轿车', price: 29.99, energy: ['BEV'] },
    { name: 'YU7', category: 'SUV', price: 25.35, energy: ['BEV'] }
  ],
  19: [
    { name: '001', category: '轿车', price: 26.9, energy: ['BEV'] },
    { name: '007', category: '轿车', price: 20.99, energy: ['BEV'] },
    { name: '009', category: 'MPV', price: 43.9, energy: ['BEV'] },
    { name: '7X', category: 'SUV', price: 22.99, energy: ['BEV'] }
  ],
  20: [
    { name: 'S7', category: 'SUV', price: 14.99, energy: ['BEV', 'PHEV'] },
    { name: 'L07', category: '轿车', price: 15.19, energy: ['BEV', 'PHEV'] },
    { name: 'S05', category: 'SUV', price: 11.99, energy: ['BEV'] },
    { name: 'G318', category: 'SUV', price: 17.59, energy: ['PHEV'] }
  ],
  21: [
    { name: '梦想家', category: 'MPV', price: 33.99, energy: ['PHEV', 'BEV'] },
    { name: 'FREE', category: 'SUV', price: 26.69, energy: ['PHEV'] },
    { name: '追光', category: '轿车', price: 28.99, energy: ['PHEV'] }
  ],
  22: [
    { name: '08', category: 'SUV', price: 20.88, energy: ['PHEV'] },
    { name: '03', category: '轿车', price: 15.68, energy: ['ICE'] },
    { name: '09', category: 'SUV', price: 26.59, energy: ['PHEV'] },
    { name: '01', category: 'SUV', price: 16.58, energy: ['ICE'] }
  ],
  23: [
    { name: '3系', category: '轿车', price: 31.99, energy: ['ICE'] },
    { name: '5系', category: '轿车', price: 43.99, energy: ['ICE', 'BEV'] },
    { name: 'X3', category: 'SUV', price: 39.99, energy: ['ICE'] },
    { name: 'X5', category: 'SUV', price: 61.5, energy: ['ICE'] },
    { name: 'i3', category: '轿车', price: 35.39, energy: ['BEV'] }
  ],
  24: [
    { name: 'C级', category: '轿车', price: 33.48, energy: ['ICE'] },
    { name: 'E级', category: '轿车', price: 44.9, energy: ['ICE'] },
    { name: 'GLC', category: 'SUV', price: 42.78, energy: ['ICE'] },
    { name: 'S级', category: '轿车', price: 96.26, energy: ['ICE'] },
    { name: 'EQS', category: '轿车', price: 88.1, energy: ['BEV'] }
  ],
  25: [
    { name: 'A4L', category: '轿车', price: 32.18, energy: ['ICE'] },
    { name: 'A6L', category: '轿车', price: 42.79, energy: ['ICE'] },
    { name: 'Q5L', category: 'SUV', price: 39.88, energy: ['ICE'] },
    { name: 'Q3', category: 'SUV', price: 27.98, energy: ['ICE'] },
    { name: 'e-tron GT', category: '轿车', price: 99.98, energy: ['BEV'] }
  ],
  26: [
    { name: 'XC60', category: 'SUV', price: 39.19, energy: ['ICE'] },
    { name: 'S60', category: '轿车', price: 30.69, energy: ['ICE'] },
    { name: 'XC90', category: 'SUV', price: 63.89, energy: ['PHEV'] },
    { name: 'EX30', category: 'SUV', price: 20.08, energy: ['BEV'] }
  ],
  27: [
    { name: '伊兰特', category: '轿车', price: 9.98, energy: ['ICE'] },
    { name: '途胜', category: 'SUV', price: 16.18, energy: ['ICE'] },
    { name: '胜达', category: 'SUV', price: 20.28, energy: ['ICE'] },
    { name: '菲斯塔', category: '轿车', price: 13.88, energy: ['ICE'] }
  ],
  28: [
    { name: '狮铂拓界', category: 'SUV', price: 17.98, energy: ['ICE'] },
    { name: '赛图斯', category: 'SUV', price: 10.99, energy: ['ICE'] },
    { name: 'EV5', category: 'SUV', price: 14.98, energy: ['BEV'] }
  ],
  29: [
    { name: '君威', category: '轿车', price: 17.58, energy: ['ICE'] },
    { name: '昂科威', category: 'SUV', price: 21.99, energy: ['ICE'] },
    { name: 'GL8', category: 'MPV', price: 23.29, energy: ['ICE'] },
    { name: 'E5', category: 'SUV', price: 16.99, energy: ['BEV'] }
  ],
  30: [
    { name: '锐界', category: 'SUV', price: 24.98, energy: ['ICE'] },
    { name: '蒙迪欧', category: '轿车', price: 15.98, energy: ['ICE'] },
    { name: '探险者', category: 'SUV', price: 30.98, energy: ['ICE'] },
    { name: '电马', category: 'SUV', price: 23.98, energy: ['BEV'] }
  ]
}

/** 能源版本后缀（仅多版本车型使用，避免名称重复） */
const ENERGY_SUFFIX: Record<EnergyType, string> = {
  BEV: '纯电版',
  PHEV: '插混版',
  HEV: '双擎版',
  ICE: ''
}

/** 能源版本相对基准价的溢价（万元） */
const ENERGY_PRICE_DELTA: Record<EnergyType, number> = {
  BEV: 0,
  PHEV: 0.8,
  HEV: 1.4,
  ICE: 0
}

const CATEGORY_FACTOR: Record<CarCategory, number> = {
  轿车: 1,
  SUV: 1.16,
  MPV: 0.42,
  跑车: 0.08,
  皮卡: 0.18
}

const ENERGY_FACTOR: Record<EnergyType, number> = {
  BEV: 1.16,
  PHEV: 1.26,
  HEV: 0.84,
  ICE: 0.9
}

const CATEGORY_SEATS: Record<CarCategory, number> = {
  轿车: 5,
  SUV: 5,
  MPV: 7,
  跑车: 4,
  皮卡: 5
}

/** 按类别生成车身尺寸（mm） */
function buildDimensions(category: CarCategory, price: number, rng: ReturnType<typeof createRng>) {
  const p = clamp(price, 4, 100)
  switch (category) {
    case 'SUV':
      return {
        length: Math.round(4500 + p * 9.5 + rng.float(-40, 60)),
        width: Math.round(1860 + p * 1.6 + rng.float(-15, 20)),
        height: Math.round(1620 + p * 2.2 + rng.float(-20, 30)),
        wheelbase: Math.round(2660 + p * 7.2 + rng.float(-20, 40))
      }
    case 'MPV':
      return {
        length: Math.round(4900 + p * 6 + rng.float(-40, 60)),
        width: Math.round(1880 + p * 1.4 + rng.float(-15, 20)),
        height: Math.round(1760 + p * 1.6 + rng.float(-20, 30)),
        wheelbase: Math.round(2930 + p * 5.4 + rng.float(-20, 40))
      }
    case '皮卡':
      return {
        length: Math.round(5350 + p * 4 + rng.float(-40, 60)),
        width: Math.round(1880 + p * 1.5 + rng.float(-15, 20)),
        height: Math.round(1860 + p * 1.2 + rng.float(-20, 30)),
        wheelbase: Math.round(3150 + p * 3 + rng.float(-20, 40))
      }
    case '跑车':
      return {
        length: Math.round(4400 + p * 6 + rng.float(-40, 60)),
        width: Math.round(1900 + p * 1.2 + rng.float(-15, 20)),
        height: Math.round(1280 + rng.float(0, 60)),
        wheelbase: Math.round(2620 + p * 5 + rng.float(-20, 40))
      }
    default:
      return {
        length: Math.round(4620 + p * 9 + rng.float(-40, 60)),
        width: Math.round(1800 + p * 1.5 + rng.float(-15, 20)),
        height: Math.round(1450 + p * 1.1 + rng.float(-20, 30)),
        wheelbase: Math.round(2650 + p * 7.6 + rng.float(-20, 40))
      }
  }
}

/** 生成车型标签 */
function buildTags(car: Omit<Car, 'tags'>): string[] {
  const tags: string[] = []
  if (car.price <= 12) tags.push('高性价比')
  if (car.range >= 600) tags.push('超长续航')
  else if (car.range >= 450) tags.push('长续航')
  if (car.power >= 300) tags.push('强动力')
  if (car.category === 'SUV' && car.wheelbase >= 2900) tags.push('大空间')
  if (car.category === 'MPV') tags.push('宜商宜家')
  if (car.intelligenceScore >= 86) tags.push('智能座舱')
  if (car.launchYear >= 2025) tags.push('年度新车')
  if (car.energyType === 'PHEV') tags.push('可油可电')
  if (car.rating >= 4.7) tags.push('口碑优良')
  return tags.slice(0, 3)
}

function buildCars(): Car[] {
  const cars: Car[] = []
  let id = 1

  for (const brand of BRANDS) {
    const seeds = MODEL_SEEDS[brand.id] ?? []
    for (const seed of seeds) {
      const multi = seed.energy.length > 1
      for (const energy of seed.energy) {
        const displayName = multi ? `${seed.name} ${ENERGY_SUFFIX[energy]}` : seed.name
        const rng = createRng(`${brand.id}-${displayName}`)
        const price = round(seed.price + (multi ? ENERGY_PRICE_DELTA[energy] : 0), 2)

        // 续航与电池：仅新能源车型具备
        let range = 0
        let battery = 0
        if (energy === 'BEV') {
          range = Math.round(clamp(300 + price * 11 + rng.float(-30, 70), 300, 780))
          battery = round(range / 6.2 + rng.float(-3, 6), 1)
        } else if (energy === 'PHEV') {
          range = Math.round(clamp(55 + price * 4.2 + rng.float(-15, 25), 55, 240))
          battery = round(clamp(9 + price * 0.7 + rng.float(-2, 4), 8, 45), 1)
        }

        const power = Math.round(
          clamp(
            energy === 'BEV'
              ? 120 + price * 6.6 + rng.float(-20, 45)
              : energy === 'PHEV'
                ? 110 + price * 5.8 + rng.float(-15, 35)
                : 85 + price * 3.9 + rng.float(-10, 30),
            70,
            780
          )
        )
        const torque = Math.round(power * rng.float(1.7, 2.2))
        const dims = buildDimensions(seed.category, price, rng)
        const launchYear = rng.int(2020, 2026)
        const launchMonth = rng.int(1, 12)

        const isNew = energy === 'BEV' || energy === 'PHEV'
        const intelligenceScore = Math.round(
          clamp((isNew ? 74 : 56) + price * 0.42 + rng.float(-6, 12), 40, 99)
        )
        const comfortScore = Math.round(clamp(52 + price * 0.45 + rng.float(-8, 14), 40, 99))
        const spaceScore = Math.round(
          clamp(48 + (dims.wheelbase - 2600) * 0.06 + (seed.category === 'MPV' ? 14 : 0) + rng.float(-8, 12), 40, 99)
        )
        const performanceScore = Math.round(clamp(38 + power * 0.075 + rng.float(-8, 12), 30, 99))
        const rating = round(clamp(3.9 + (intelligenceScore + comfortScore) / 700 + rng.float(-0.12, 0.22), 3.6, 4.9), 1)

        const base: Omit<Car, 'tags'> = {
          id,
          brandId: brand.id,
          brand: brand.name,
          name: displayName,
          modelCode: `${brand.nameEn.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)}-${String(id).padStart(3, '0')}`,
          category: seed.category,
          energyType: energy,
          price,
          priceMin: round(price * rng.float(0.86, 0.94), 2),
          priceMax: round(price * rng.float(1.02, 1.12), 2),
          range,
          battery,
          power,
          torque,
          wheelbase: dims.wheelbase,
          length: dims.length,
          width: dims.width,
          height: dims.height,
          seats: CATEGORY_SEATS[seed.category],
          launchDate: `${launchYear}-${String(launchMonth).padStart(2, '0')}`,
          launchYear,
          sales: 0,
          lastMonthSales: 0,
          rating,
          intelligenceScore,
          comfortScore,
          spaceScore,
          performanceScore,
          reviewCount: rng.int(120, 8600)
        }

        cars.push({ ...base, tags: buildTags(base) })
        id += 1
      }
    }
  }

  return cars
}

/** 全部车型（158 款） */
export const CARS: Car[] = buildCars()

export const CAR_MAP: Record<number, Car> = CARS.reduce<Record<number, Car>>((acc, c) => {
  acc[c.id] = c
  return acc
}, {})

/** 车型月销量基础量级（供 sales.ts 生成时间序列） */
export function getCarSalesBase(car: Car): number {
  const brand = BRAND_MAP[car.brandId]
  const rng = createRng(`base-${car.id}`)
  const priceFactor = clamp(1.65 - car.price / 42, 0.32, 1.65)
  const base =
    (brand?.weight ?? 20) *
    CATEGORY_FACTOR[car.category] *
    priceFactor *
    ENERGY_FACTOR[car.energyType] *
    rng.float(0.55, 1.5) *
    100
  return base
}

/** 车型列表筛选（与后端 /api/cars 行为保持一致） */
export interface CarFilter {
  keyword?: string
  brandId?: number
  energyType?: EnergyType
  category?: CarCategory
  priceMin?: number
  priceMax?: number
  year?: number
}

export function filterCars(list: Car[], f: CarFilter): Car[] {
  const kw = f.keyword?.trim().toLowerCase()
  return list.filter((c) => {
    if (kw) {
      const hay = `${c.brand}${c.name}${c.modelCode}${c.category}`.toLowerCase()
      if (!hay.includes(kw)) return false
    }
    if (f.brandId && c.brandId !== f.brandId) return false
    if (f.energyType && c.energyType !== f.energyType) return false
    if (f.category && c.category !== f.category) return false
    if (typeof f.priceMin === 'number' && c.price < f.priceMin) return false
    if (typeof f.priceMax === 'number' && c.price > f.priceMax) return false
    if (f.year && c.launchYear !== f.year) return false
    return true
  })
}

/** 价格区间分桶（万元） */
export const PRICE_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: '10万以下', min: 0, max: 10 },
  { label: '10-15万', min: 10, max: 15 },
  { label: '15-20万', min: 15, max: 20 },
  { label: '20-30万', min: 20, max: 30 },
  { label: '30-50万', min: 30, max: 50 },
  { label: '50万以上', min: 50, max: 100000 }
]

export function getPriceBucketLabel(price: number): string {
  return PRICE_BUCKETS.find((b) => price >= b.min && price < b.max)?.label ?? '50万以上'
}
