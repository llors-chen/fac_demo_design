/**
 * 工单存储（部门工作台共用）
 *
 * 层级：客户（1）→ 工单（N）→ 需求版本（N）→ 流程步骤 S1–S5
 * 一个客户可以有多张工单；每张工单各自持有需求版本与流程进度；
 * 客户每次变更需求 = 新建需求版本，S1–S5 重走一遍。通过 localStorage 持久化。
 */
import { flowSteps } from './data.js'

const KEY = 'dsh-workorders-v7'

export const stamp = (d = new Date()) =>
  `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(
    d.getHours(),
  ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

/** 事件类型 → 展示样式 */
export const eventMeta = {
  create: { label: '建单', tone: 'info' },
  customer: { label: '新建客户', tone: 'info' },
  submit: { label: '流转', tone: 'ok' },
  fill: { label: '填报', tone: 'plain' },
  ask: { label: '客户询问', tone: 'warn' },
  answer: { label: '客户答复', tone: 'ok' },
  back: { label: '打回', tone: 'danger' },
  confirm: { label: '确认', tone: 'ok' },
  match: { label: '匹配', tone: 'plain' },
  bom: { label: 'BOM', tone: 'info' },
  capacity: { label: '产能', tone: 'plain' },
  forecast: { label: '预测', tone: 'ok' },
  ack: { label: '回执客户', tone: 'ok' },
  note: { label: '备注', tone: 'plain' },
}

/* ---------------- 记录构造 ---------------- */

const rec = (step, owner, start, end, dur, output, status) => ({
  step,
  owner,
  start,
  end,
  dur,
  output,
  status, // done | doing | todo | back
})

export function buildRecords(overrides = {}) {
  return flowSteps.map((s) => {
    const o = overrides[s.code] || {}
    return rec(
      s.code,
      o.owner || s.owner,
      o.start || '',
      o.end || '',
      o.dur || '',
      o.output || s.name,
      o.status || 'todo',
    )
  })
}

function recordsUpTo(code, state = 'doing', overrides = {}) {
  const i = flowSteps.findIndex((s) => s.code === code)
  const base = {}
  flowSteps.forEach((s, k) => {
    if (k < i) base[s.code] = { status: 'done' }
    else if (k === i) base[s.code] = { status: state }
  })
  const merged = {}
  new Set([...Object.keys(base), ...Object.keys(overrides)]).forEach((k) => {
    merged[k] = { ...(base[k] || {}), ...(overrides[k] || {}) }
  })
  return buildRecords(merged)
}

const filledUpTo = (code, includeSelf = false) => {
  const i = flowSteps.findIndex((s) => s.code === code)
  return Object.fromEntries(flowSteps.map((s, k) => [s.code, k < i + (includeSelf ? 1 : 0)]))
}
const filledAll = () => Object.fromEntries(flowSteps.map((s) => [s.code, true]))
const filledNone = () => Object.fromEntries(flowSteps.map((s) => [s.code, false]))

/* ---------------- 工厂 ---------------- */

/** 生成一个需求版本 */
export function makeVersion(label, payload = {}) {
  const step = payload.step || 'S1'
  const first = flowSteps[0]
  return {
    id: 'V' + (payload.index || 1),
    label,
    createdAt: payload.createdAt || stamp(),
    updatedAt: payload.updatedAt || stamp(),
    note: payload.note || '客户首次提出需求',
    summary: payload.summary || '',
    step,
    stage: flowSteps.find((s) => s.code === step)?.view || 'sales',
    returned: false,
    returnReason: '',
    filled: payload.filled || filledNone(),
    records:
      payload.records ||
      recordsUpTo(step, 'doing', { [step]: { start: payload.createdAt || stamp() } }),
    events: payload.events || [
      {
        time: payload.createdAt || stamp(),
        step: first.code,
        stage: first.view,
        actor: payload.actor || '销售',
        type: 'create',
        action: '建单并录入客户原话（' + label + '）',
        detail: payload.detail || '客户提出需求',
      },
    ],
    docs: payload.docs || [],
  }
}

/** 生成一张工单（承载需求版本与流程进度） */
export function makeOrder(customerName, payload = {}) {
  const step = payload.step || 'S1'
  const stage = flowSteps.find((s) => s.code === step)?.view || 'sales'
  const createdAt = payload.createdAt || stamp()
  const filled = payload.filled || (step === 'S1' ? filledNone() : filledUpTo(step))
  return {
    id: payload.id || nextOrderId([], createdAt),
    customer: customerName,
    title: payload.title || '新建工单',
    product: payload.product || '待定',
    qty: payload.qty || '待定',
    due: payload.due || '待定',
    priority: payload.priority || '中',
    owner: payload.owner || '销售 · 陈工',
    note: payload.note || '',
    createdAt,
    updatedAt: createdAt,
    step,
    stage,
    returned: !!payload.returned,
    returnReason: payload.returnReason || '',
    filled,
    records:
      payload.records ||
      recordsUpTo(step, step === 'S5' ? 'done' : 'doing', { [step]: { start: createdAt } }),
    events: payload.events || [
      {
        time: createdAt,
        step: 'S1',
        stage: 'sales',
        actor: payload.owner || '销售 · 陈工',
        type: 'create',
        action: '新建工单（R01）',
        detail: `${customerName} · ${payload.title || ''} · ${payload.product || ''} · ${payload.qty || ''}`,
      },
    ],
    versions: [
      makeVersion('R01', {
        index: 1,
        createdAt,
        note: payload.note || '客户首次提出需求',
        summary: payload.summary || `${payload.product || ''} · ${payload.qty || ''}`,
        actor: payload.owner || '销售',
        detail: payload.detail || '客户提出需求',
        step,
      }),
    ],
    activeVersion: 'V1',
    docs: payload.docs || [
      { label: 'iCRM', value: payload.icrm || '待生成' },
      { label: '报表', value: '500413 · 待填写' },
    ],
  }
}

/** 生成一个客户（顶层，可挂多张工单） */
export function makeCustomer(payload = {}) {
  const createdAt = payload.createdAt || stamp()
  return {
    id: payload.id || 'CU-' + String(payload.index || 1).padStart(3, '0'),
    customer: payload.customer || '新客户',
    contact: payload.contact || '',
    owner: payload.owner || '销售 · 陈工',
    priority: payload.priority || '中',
    note: payload.note || '',
    createdAt,
    updatedAt: createdAt,
    orders: payload.orders || [],
  }
}

/** 展平所有工单（附带客户信息） */
export function allOrders(list) {
  return (list || []).flatMap((c) =>
    (c.orders || []).map((o) => ({
      ...o,
      customerId: c.id,
      customerName: c.customer,
      contact: c.contact,
      customerPriority: c.priority,
    })),
  )
}

/** 生成工单号：WO-YYYYMMDD-NNN（跨客户查重） */
export function nextOrderId(list, day) {
  const d = day || stamp()
  const [mm, dd] = d.split(' ')[0].split('-')
  const year = new Date().getFullYear()
  const prefix = `WO-${year}${mm}${dd}`
  const used = allOrders(list)
    .map((o) => o.id)
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length + 1), 10) || 0)
  const next = (used.length ? Math.max(...used) : 0) + 1
  return `${prefix}-${String(next).padStart(3, '0')}`
}

/** 按工单号定位 */
export function findOrder(list, orderId) {
  for (const c of list || []) {
    const o = (c.orders || []).find((x) => x.id === orderId)
    if (o) return { customer: c, order: o }
  }
  return null
}

/* ---------------- 种子数据 ---------------- */

/* 客户一：越野机器人客户（王工）· 两张工单 */
const cu1 = makeCustomer({
  id: 'CU-001',
  index: 1,
  customer: '越野机器人客户（王工）',
  contact: '王工 · 138****2210',
  owner: '销售 · 陈工',
  priority: '高',
  createdAt: '09-20 10:00',
})

const o11 = makeOrder('越野机器人客户（王工）', {
  id: 'WO-20261021-001',
  title: '转向推杆 · CANopen 定制',
  product: 'CAHB-22-D2E · CANopen 定制',
  qty: 'EAU 50 pcs',
  due: '样件 8 周',
  priority: '高',
  owner: '销售 · 陈工',
  createdAt: '10-21 09:10',
  step: 'S1',
  icrm: 'iCRM-2026-0451',
  note: '48 V · 3,500 N · 行程 50 · CANopen + M12',
  detail: '客户变更需求：48 V 平台、行程 50 mm、CANopen + 绝对位置反馈、M12 四芯线束',
  docs: [
    { label: 'iCRM', value: 'iCRM-2026-0451' },
    { label: '报表', value: '500413 · 起草中' },
    { label: '附件', value: '3 个（500413 / CAHB-22 规格图 / 现场照片）' },
  ],
})
o11.versions = [
  makeVersion('R01', {
    index: 1,
    createdAt: '10-18 14:20',
    updatedAt: '10-20 16:05',
    note: '客户最初需求：24 V 平台、行程 300 mm（已作废）',
    summary: '24 V · 3,500 N · 行程 300 · 手轮机构保留',
    step: 'S1',
    filled: filledUpTo('S1', true),
    records: recordsUpTo('S1', 'done', {
      S1: {
        start: '10-18 14:20',
        end: '10-20 16:05',
        dur: '2 天',
        status: 'done',
        output: '需求要点 + AI 初判（已作废）',
      },
    }),
    events: [
      {
        time: '10-18 14:20',
        step: 'S1',
        stage: 'sales',
        actor: '销售 · 陈工',
        type: 'create',
        action: '建单并录入客户原话（R01）',
        detail: '24 V 平台 · 行程 300 mm · 保留手轮机构',
      },
      {
        time: '10-20 16:05',
        step: 'S1',
        stage: 'sales',
        actor: '客户 · 王工',
        type: 'note',
        action: '客户变更需求',
        detail: '电池平台改为 48 V，行程缩短到 50 mm，取消手轮机构',
      },
    ],
    docs: [{ label: 'iCRM', value: 'iCRM-2026-0451' }],
  }),
  makeVersion('R02', {
    index: 2,
    createdAt: '10-21 09:10',
    note: '客户变更后重新提交（当前版本）',
    summary: '48 V · 3,500 N · 行程 50 · CANopen + M12',
    detail: '48 V 平台、行程 50 mm、CANopen + 绝对位置反馈、M12 四芯线束',
    step: 'S1',
    docs: [
      { label: 'iCRM', value: 'iCRM-2026-0451' },
      { label: '报表', value: '待重新生成' },
    ],
  }),
]
o11.activeVersion = 'V2'
o11.events = [
  {
    time: '10-21 09:12',
    step: 'S1',
    stage: 'sales',
    actor: '销售 · 陈工',
    type: 'create',
    action: '新建需求版本 R02',
    detail: '客户变更需求：48 V 平台、行程 50 mm、CANopen + 绝对位置反馈、M12 四芯线束',
  },
]

const o12 = makeOrder('越野机器人客户（王工）', {
  id: 'WO-20260915-003',
  title: '示教器推杆 · 标准型',
  product: 'CAHB-20-B3E · 标准型',
  qty: 'EAU 200 pcs',
  due: '首批 10 周',
  priority: '中',
  owner: '销售 · 陈工',
  createdAt: '09-15 09:30',
  step: 'S5',
  icrm: 'iCRM-2026-0388',
  note: '标准型已量产（同一客户的第二张工单）',
  detail: '示教器升降推杆 · 标准型 · EAU 200 pcs',
  filled: filledAll(),
  records: recordsUpTo('S5', 'done', {
    S1: { start: '09-15 09:30', end: '09-15 10:02', dur: '32 min', status: 'done' },
    S2: { start: '09-15 10:30', end: '09-15 11:20', dur: '50 min', status: 'done' },
    S3: { start: '09-15 14:00', end: '09-15 15:10', dur: '1 h 10 min', status: 'done' },
    S4: { start: '09-16 09:00', end: '09-16 11:30', dur: '2 h 30 min', status: 'done' },
    S5: { start: '09-16 15:00', end: '09-16 16:20', dur: '1 h 20 min', status: 'done' },
  }),
  docs: [
    { label: 'iCRM', value: 'iCRM-2026-0388' },
    { label: '报表', value: '500413 R02 · 三方已确认' },
    { label: 'M3 单据', value: 'BOM-20260916-052' },
    { label: '报价单', value: 'Q-20260916-003 · 含税 ￥268,400' },
  ],
})
cu1.orders = [o11, o12]

/* 客户二：华东物流装备（刘工）· 一张工单（已被 AE 打回） */
const cu2 = makeCustomer({
  id: 'CU-002',
  index: 2,
  customer: '华东物流装备（刘工）',
  contact: '刘工 · 139****7788',
  owner: '销售 · 周工',
  priority: '中',
  createdAt: '10-21 08:30',
})
const o21 = makeOrder('华东物流装备（刘工）', {
  id: 'WO-20261021-002',
  title: '输送线推杆 · IP69K 增强',
  product: 'CAHB-20-B3E · IP69K 增强',
  qty: 'EAU 120 pcs',
  due: '样件 6 周',
  priority: '中',
  owner: '销售 · 周工',
  createdAt: '10-21 08:40',
  step: 'S2',
  icrm: 'iCRM-2026-0438',
  note: '客户首次提出需求（IP69K 增强）',
  detail: '物流输送线用推杆 · 24 V 平台 · 要求 IP69K',
})
o21.returned = true
o21.returnReason = '客户未提供静态载荷，且温度口径与平台标准不一致，需销售补充后再填表。'
o21.records = recordsUpTo('S2', 'back', {
  S1: { start: '10-21 08:40', end: '10-21 09:20', dur: '40 min', status: 'done' },
  S2: { start: '10-21 09:52', status: 'back', output: '500413 报表（已打回补充）' },
})
o21.events = [
  {
    time: '10-21 10:26',
    step: 'S2',
    stage: 'ae',
    actor: 'AE · 李工',
    type: 'back',
    action: '打回销售（退回 S1）',
    detail: o21.returnReason,
  },
  {
    time: '10-21 09:52',
    step: 'S2',
    stage: 'ae',
    actor: 'AE · 李工',
    type: 'fill',
    action: '开始填 500413',
    detail: '按 500425 模板预填 4 节',
  },
  {
    time: '10-21 08:40',
    step: 'S1',
    stage: 'sales',
    actor: '销售 · 周工',
    type: 'create',
    action: '新建工单（R01）',
    detail: '物流输送线用推杆 · 24 V 平台 · EAU 120 pcs · 要求 IP69K',
  },
]
o21.versions[0].step = 'S2'
o21.versions[0].stage = 'ae'
o21.versions[0].returned = true
o21.versions[0].returnReason = o21.returnReason
o21.versions[0].filled = filledUpTo('S2')
o21.versions[0].records = o21.records
o21.versions[0].events = o21.events
o21.docs = [
  { label: 'iCRM', value: 'iCRM-2026-0438' },
  { label: '报表', value: '500413 R01 · 待补充' },
  { label: '附件', value: '2 个（客户需求邮件 / 现场视频）' },
]
cu2.orders = [o21]

/* 客户三：极地科考装备（张工）· 一张工单 */
const cu3 = makeCustomer({
  id: 'CU-003',
  index: 3,
  customer: '极地科考装备（张工）',
  contact: '张工 · 137****5566',
  owner: '销售 · 陈工',
  priority: '中',
  createdAt: '10-21 11:00',
})
cu3.orders = [
  makeOrder('极地科考装备（张工）', {
    id: 'WO-20261021-005',
    title: '舱门推杆 · 低温型',
    product: 'CAHB-22-D2E · 低温型',
    qty: 'EAU 30 pcs',
    due: '样件 10 周',
    priority: '中',
    owner: '销售 · 陈工',
    createdAt: '10-21 11:20',
    step: 'S1',
    icrm: 'iCRM-2026-0460',
    note: '-40 ℃ 低温启动',
    detail: '科考设备舱门推杆 · 要求 -40 ℃ 可启动',
  }),
]

/* 客户四：北欧农机（Eric）· 一张工单（三个需求版本） */
const cu4 = makeCustomer({
  id: 'CU-004',
  index: 4,
  customer: '北欧农机（Eric）',
  contact: 'Eric · +46 70 *** 2211',
  owner: '销售 · 陈工',
  priority: '中',
  createdAt: '10-16 09:50',
})
const o41 = makeOrder('北欧农机（Eric）', {
  id: 'WO-20261020-018',
  title: '农机转向推杆 · 标准型批量',
  product: 'CAHB-22-D2E · 标准型',
  qty: 'EAU 300 pcs',
  due: '首批 12 周',
  priority: '中',
  owner: '销售 · 陈工',
  createdAt: '10-20 09:05',
  step: 'S5',
  icrm: 'iCRM-2026-0402',
  note: '最终确认版本（当前）',
  detail: '最终确认：标准型 CAHB-22-D2E · EAU 300 pcs',
  filled: filledAll(),
  records: recordsUpTo('S5', 'done', {
    S1: { start: '10-20 09:05', end: '10-20 09:26', dur: '21 min', status: 'done' },
    S2: { start: '10-20 09:30', end: '10-20 10:14', dur: '44 min', status: 'done' },
    S3: { start: '10-20 10:40', end: '10-20 11:15', dur: '35 min', status: 'done' },
    S4: { start: '10-20 11:15', end: '10-20 15:02', dur: '3 h 47 min', status: 'done' },
    S5: {
      start: '10-20 16:10',
      end: '10-20 17:40',
      dur: '1 h 30 min',
      status: 'done',
      output: '报价单 + 交期预测 + 已回执客户',
    },
  }),
  docs: [
    { label: 'iCRM', value: 'iCRM-2026-0402' },
    { label: '报表', value: '500413 R03 · 三方已确认' },
    { label: 'M3 单据', value: 'BOM-20261020-114' },
    { label: '报价单', value: 'Q-20261020-018 · 含税 ￥412,600' },
  ],
})
o41.versions = [
  makeVersion('R01', {
    index: 1,
    createdAt: '10-16 10:00',
    note: '客户最初需求：行程 200 mm（已作废）',
    summary: '48 V · 3,500 N · 行程 200',
    step: 'S2',
    filled: filledUpTo('S2'),
    records: recordsUpTo('S2', 'doing', { S2: { status: 'doing', output: '500413（版本作废）' } }),
  }),
  makeVersion('R02', {
    index: 2,
    createdAt: '10-17 15:20',
    note: '行程改为 250 mm',
    summary: '48 V · 3,500 N · 行程 250 · 位置反馈',
    step: 'S4',
    filled: filledUpTo('S4'),
    records: recordsUpTo('S4', 'doing', { S4: { status: 'doing' } }),
  }),
  makeVersion('R03', {
    index: 3,
    createdAt: '10-20 09:05',
    note: '最终确认版本（当前）',
    summary: '48 V · 3,500 N · 行程 250 · 标准型 EAU 300',
    step: 'S5',
    filled: filledAll(),
    records: recordsUpTo('S5', 'done'),
    docs: o41.docs,
  }),
]
o41.activeVersion = 'V3'
o41.events = [
  {
    time: '10-20 17:40',
    step: 'S5',
    stage: 'final',
    actor: '销售 · 陈工',
    type: 'ack',
    action: '回执客户并归档（S5 完成）',
    detail: '报价单 Q-20261020-018（含税 ￥412,600）已发送',
  },
  {
    time: '10-20 15:02',
    step: 'S4',
    stage: 'rd',
    actor: '计划 · 吴工',
    type: 'capacity',
    action: '产能评估完成',
    detail: '加权饱和度 84%（推荐 82%），EAU 300 可插单',
  },
  {
    time: '10-20 09:05',
    step: 'S1',
    stage: 'sales',
    actor: '销售 · 陈工',
    type: 'create',
    action: '新建需求版本 R03',
    detail: '标准型 CAHB-22-D2E · EAU 300 pcs',
  },
]
cu4.orders = [o41]

export const seedCustomers = [cu1, cu2, cu3, cu4]

const clone = (v) => JSON.parse(JSON.stringify(v))

/* ---------------- 规范化 ---------------- */

const VALID = flowSteps.map((s) => s.code)
const STAGE_STEP = { sales: 'S1', ae: 'S2', rd: 'S3', final: 'S5' }

function ensureOrder(o) {
  if (!VALID.includes(o.step)) o.step = STAGE_STEP[o.stage] || 'S1'
  const f = filledNone()
  VALID.forEach((code) => {
    f[code] = !!(o.filled || {})[code]
  })
  o.filled = f
  const records = Array.isArray(o.records) ? o.records.filter((r) => VALID.includes(r.step)) : []
  o.records = records.length === VALID.length ? records : buildRecords()
  if (Array.isArray(o.events)) o.events = o.events.filter((e) => !e.step || VALID.includes(e.step))
  if (!Array.isArray(o.versions) || !o.versions.length) {
    o.versions = [makeVersion('R01', { index: 1, step: o.step })]
    o.activeVersion = 'V1'
  } else {
    o.versions.forEach((v) => {
      if (!VALID.includes(v.step)) v.step = 'S1'
      if (!v.filled) v.filled = filledNone()
      if (!Array.isArray(v.records) || v.records.length !== VALID.length) v.records = buildRecords()
      if (Array.isArray(v.events)) v.events = v.events.filter((e) => !e.step || VALID.includes(e.step))
    })
    if (!o.versions.some((v) => v.id === o.activeVersion)) {
      o.activeVersion = o.versions[o.versions.length - 1].id
    }
  }
  if (!o.docs) o.docs = []
  if (!o.title) o.title = o.product || '工单'
  return o
}

/** 规范化客户；兼容 v6（工单 → 客户）结构，自动倒置为 客户 → 工单 */
function ensureCustomer(c, index) {
  if (Array.isArray(c.orders)) {
    c.orders.forEach(ensureOrder)
    if (!c.id) c.id = 'CU-' + String(index + 1).padStart(3, '0')
    return c
  }
  const orders = (c.customers || []).map((old) => {
    const o = {
      ...old,
      customer: old.customer || c.title || '未命名客户',
      title: old.title || old.product || c.title || '工单',
      note: old.note || '',
    }
    delete o.customers
    return ensureOrder(o)
  })
  return makeCustomer({
    id: 'CU-' + String(index + 1).padStart(3, '0'),
    index: index + 1,
    customer: c.title || (orders[0] && orders[0].customer) || '未命名客户',
    owner: c.owner,
    priority: c.priority,
    createdAt: c.createdAt,
    orders,
  })
}

/* ---------------- 持久化 ---------------- */

export function loadCustomers() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed.map(ensureCustomer)
    }
  } catch (e) {
    /* 隐私模式 / 沙箱下忽略 */
  }
  return clone(seedCustomers).map(ensureCustomer)
}

export function saveCustomers(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch (e) {
    /* 忽略写入失败 */
  }
}

export function resetCustomers() {
  try {
    localStorage.removeItem(KEY)
  } catch (e) {
    /* 忽略 */
  }
  return clone(seedCustomers).map(ensureCustomer)
}

/** 顶层新建客户（可同时带第一张工单） */
export function createCustomer(list, payload) {
  const c = makeCustomer({
    index: list.length + 1,
    customer: payload.customer,
    contact: payload.contact,
    owner: payload.owner,
    priority: payload.priority,
    note: payload.note,
  })
  if (payload.order?.title) {
    c.orders.push(
      makeOrder(c.customer, {
        id: nextOrderId(list),
        title: payload.order.title,
        product: payload.order.product,
        qty: payload.order.qty,
        due: payload.order.due,
        priority: payload.priority,
        owner: payload.owner,
        note: payload.order.note,
        summary: payload.order.summary,
        detail: payload.order.detail,
      }),
    )
  }
  list.push(c)
  return c
}

/** 在某客户下新建工单 */
export function createOrder(customer, list, payload) {
  const o = makeOrder(customer.customer, {
    id: nextOrderId(list),
    title: payload.title,
    product: payload.product,
    qty: payload.qty,
    due: payload.due,
    priority: payload.priority || customer.priority,
    owner: payload.owner || customer.owner,
    note: payload.note,
    summary: payload.summary,
    detail: payload.detail,
  })
  customer.orders.push(o)
  customer.updatedAt = stamp()
  return o
}

/* ---------------- 需求版本 ---------------- */

export function snapshotVersion(order) {
  const v = (order.versions || []).find((x) => x.id === order.activeVersion)
  if (!v) return null
  v.step = order.step
  v.stage = order.stage
  v.returned = order.returned
  v.returnReason = order.returnReason
  v.filled = clone(order.filled || {})
  v.records = clone(order.records || [])
  v.events = clone(order.events || [])
  v.docs = clone(order.docs || [])
  v.updatedAt = stamp()
  return v
}

export function activateVersion(order, versionId) {
  const v = (order.versions || []).find((x) => x.id === versionId)
  if (!v) return null
  if (order.activeVersion && order.activeVersion !== versionId) snapshotVersion(order)
  order.activeVersion = v.id
  order.step = VALID.includes(v.step) ? v.step : 'S1'
  order.stage = v.stage
  order.returned = v.returned
  order.returnReason = v.returnReason
  order.filled = clone(v.filled)
  order.records = clone(v.records)
  order.events = clone(v.events)
  order.docs = clone(v.docs)
  order.updatedAt = stamp()
  logEvent(order, {
    step: order.step,
    stage: 'sales',
    actor: '系统',
    type: 'note',
    action: '回溯到需求版本 ' + v.label,
    detail: v.note || '切换需求版本，流程从该版本的进度继续',
  })
  v.updatedAt = stamp()
  return v
}

export function createVersion(order, note, summary) {
  snapshotVersion(order)
  const n = (order.versions || []).length + 1
  const label = 'R' + String(n).padStart(2, '0')
  const v = makeVersion(label, {
    index: n,
    note: note || '客户变更需求',
    summary: summary || '客户需求变更，重新走完整流程',
    detail: (note || '客户变更需求') + (summary ? '：' + summary : ''),
    actor: order.owner || '销售',
    step: 'S1',
    docs: (order.docs || []).map((d) =>
      ['报表', 'M3 单据', '报价单'].includes(d.label) ? { ...d, value: '待重新生成' } : d,
    ),
  })
  order.versions = [...(order.versions || []), v]
  order.activeVersion = v.id
  order.step = 'S1'
  order.stage = 'sales'
  order.returned = false
  order.returnReason = ''
  order.filled = clone(v.filled)
  order.records = clone(v.records)
  order.events = clone(v.events)
  order.docs = clone(v.docs)
  order.updatedAt = stamp()
  return v
}

/* ---------------- 留痕与记录 ---------------- */

export function logEvent(order, event) {
  order.events = [{ time: stamp(), ...event }, ...(order.events || [])]
  order.updatedAt = stamp()
}

export function closeStep(order, code, output, status = 'done') {
  const r = (order.records || []).find((x) => x.step === code)
  if (!r) return
  r.end = stamp()
  r.status = status
  if (output) r.output = output
  if (r.start && !r.dur) r.dur = r.start === r.end ? '—' : `${r.start} → ${r.end}`
}

export function openStep(order, code) {
  const r = (order.records || []).find((x) => x.step === code)
  if (!r) return
  if (!r.start) r.start = stamp()
  r.status = 'doing'
}

/** 导出留痕 CSV */
export function toCsv(order) {
  const head = ['时间', '步骤', '部门', '操作人', '类型', '动作', '详情']
  const rows = (order.events || []).map((e) => [
    e.time,
    e.step || '',
    e.stage || '',
    e.actor,
    eventMeta[e.type]?.label || e.type,
    e.action,
    (e.detail || '').replace(/"/g, '""'),
  ])
  return [head, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
}
