/**
 * 02-00 · 车间模拟数据
 *
 * 200 种库存零件、20 种成品、4 条流水线、人员分布与人力时间报表。
 * 用固定种子的伪随机生成零件/成品状态，保证每次刷新数值一致（便于对照）。
 */

/** 固定种子 LCG，保证数据稳定 */
const makeRandom = (seed) => {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/** 状态：ok 充足 / warn 预警 / short 缺料 / idle 呆滞 */
export const statusMeta = {
  ok: { label: '充足', tone: 'ok' },
  warn: { label: '预警', tone: 'warn' },
  short: { label: '缺料', tone: 'short' },
  idle: { label: '呆滞', tone: 'idle' },
}

/** 4 条流水线 */
export const lines = [
  {
    key: 'A',
    name: 'A 线 · 推杆总装',
    tact: 92,
    wip: 18,
    output: 312,
    staff: 14,
    saturation: 0.86,
    delay: 2.4,
    stations: 6,
    bottleneck: '壳体压装',
  },
  {
    key: 'B',
    name: 'B 线 · 丝杠机加',
    tact: 78,
    wip: 26,
    output: 402,
    staff: 11,
    saturation: 0.93,
    delay: 3.1,
    stations: 5,
    bottleneck: '外圆磨',
  },
  {
    key: 'C',
    name: 'C 线 · 气密与 EMC 检测',
    tact: 104,
    wip: 9,
    output: 268,
    staff: 7,
    saturation: 0.71,
    delay: 0.8,
    stations: 3,
    bottleneck: 'EMC 暗室',
  },
  {
    key: 'D',
    name: 'D 线 · 包装发运',
    tact: 64,
    wip: 6,
    output: 455,
    staff: 5,
    saturation: 0.64,
    delay: 0.3,
    stations: 2,
    bottleneck: '打标贴标',
  },
]

/** 推荐饱和度系数（按瓶颈工序 + 交付目标反推） */
export const RECOMMENDED_SATURATION = 0.82

const FAMILIES = [
  '轴承',
  '丝杠',
  '齿轮箱',
  '电机',
  '壳体',
  '密封件',
  '线束',
  '连接器',
  '紧固件',
  '板金件',
]

/** 200 种库存零件 */
export const parts = (() => {
  const r = makeRandom(20261021)
  return Array.from({ length: 200 }, (_, i) => {
    const family = FAMILIES[i % FAMILIES.length]
    const safety = 60 + Math.round(r() * 140)
    const stock = Math.round(r() * 520)
    let status = 'ok'
    if (stock < safety * 0.45) status = 'short'
    else if (stock < safety) status = 'warn'
    else if (r() < 0.07) status = 'idle'
    return {
      code: `P-${1000 + i}`,
      name: `${family} ${String(i + 1).padStart(3, '0')}`,
      family,
      stock,
      safety,
      status,
      line: lines[i % lines.length].key,
    }
  })
})()

/** 20 种成品状态：wip 在制 / check 待检 / stock 已入库 / ship 待发运 */
export const productStatusMeta = {
  wip: { label: '在制', tone: 'warn' },
  check: { label: '待检', tone: 'idle' },
  stock: { label: '已入库', tone: 'ok' },
  ship: { label: '待发运', tone: 'short' },
}

export const products = (() => {
  const r = makeRandom(4510)
  const models = [
    'CAHB-20-B3E',
    'CAHB-22-D2E',
    'CAHB-22-CAN',
    'CAHB-20-IP69K',
    'CAHB-22-LONG',
  ]
  return Array.from({ length: 20 }, (_, i) => {
    const roll = r()
    const status = roll < 0.35 ? 'stock' : roll < 0.6 ? 'ship' : roll < 0.85 ? 'check' : 'wip'
    return {
      code: `FW-${240 + i}`,
      model: models[i % models.length],
      qty: 20 + Math.round(r() * 180),
      status,
      delay: Math.round(r() * 180) / 10, // 0~18 h
    }
  })
})()

/** 人员分布（按职能） */
export const staffing = [
  { key: 'A', label: 'A 线总装', count: 14, present: 13, color: 'accent' },
  { key: 'B', label: 'B 线机加', count: 11, present: 11, color: 'ink' },
  { key: 'C', label: 'C 线检测', count: 7, present: 6, color: 'mid' },
  { key: 'D', label: 'D 线包装', count: 5, present: 5, color: 'pale' },
  { key: 'WH', label: '仓储物流', count: 6, present: 5, color: 'accent' },
  { key: 'QC', label: '质量与工艺', count: 5, present: 5, color: 'ink' },
  { key: 'MT', label: '设备维护', count: 4, present: 3, color: 'mid' },
]

/** 人力时间报表（白班 8h 基准） */
export const laborRows = [
  { key: 'A', name: 'A 线 · 推杆总装', standard: 96, actual: 108, ot: 12, cost: 4104 },
  { key: 'B', name: 'B 线 · 丝杠机加', standard: 80, actual: 92, ot: 12, cost: 3496 },
  { key: 'C', name: 'C 线 · 气密 / EMC', standard: 54, actual: 58, ot: 4, cost: 2204 },
  { key: 'D', name: 'D 线 · 包装发运', standard: 40, actual: 42, ot: 2, cost: 1596 },
  { key: 'WH', name: '仓储物流', standard: 24, actual: 26, ot: 2, cost: 988 },
  { key: 'QC', name: '质量与工艺', standard: 30, actual: 33, ot: 3, cost: 1254 },
]

/** 班次：影响产出、饱和度、人工单价 */
export const shifts = [
  { key: 'day', label: '白班', outputFactor: 1, satDelta: 0, hourFactor: 1, rate: 38, note: '08:00–17:00' },
  { key: 'night', label: '夜班', outputFactor: 0.72, satDelta: -0.07, hourFactor: 0.72, rate: 51, note: '20:00–05:00（1.35× 津贴）' },
]
