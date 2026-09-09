/** 品牌视觉工具：为品牌分配稳定的主色（离线可用，不依赖 mock 数据） */

const BRAND_COLORS: Record<string, string> = {
  比亚迪: '#d0202f',
  特斯拉: '#e31937',
  大众: '#1c5faa',
  丰田: '#d71920',
  本田: '#0f4da0',
  日产: '#c3002f',
  吉利: '#0b3d91',
  长安: '#0d4c8b',
  哈弗: '#a01f24',
  奇瑞: '#0f5c8c',
  五菱: '#b8232f',
  广汽埃安: '#17a2b8',
  理想: '#1a9c6b',
  蔚来: '#2b6cb0',
  小鹏: '#00a19a',
  零跑: '#00a0e9',
  问界: '#c8963e',
  小米: '#ff6900',
  极氪: '#6c7a89',
  深蓝: '#1f6feb',
  岚图: '#3b5bdb',
  领克: '#5a6472',
  宝马: '#0166b1',
  奔驰: '#2f6fb0',
  奥迪: '#bb0a30',
  沃尔沃: '#003057',
  现代: '#00205b',
  起亚: '#0b3d62',
  别克: '#003876',
  福特: '#00274c'
}

const FALLBACK_PALETTE = [
  '#2e7cf6', '#16c79a', '#f5a524', '#9a7bff', '#35c4d8',
  '#f5544b', '#4fd1c5', '#8a94ff', '#6c7a89', '#c8963e'
]

function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function brandColor(brand: string): string {
  return BRAND_COLORS[brand] ?? FALLBACK_PALETTE[hash(brand) % FALLBACK_PALETTE.length]
}
