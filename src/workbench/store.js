/**
 * 工单存储（部门工作台共用）
 *
 * 层级：工单（1）→ 客户（N）→ 需求版本（N）→ 流程步骤 S1–S5
 * 一张工单可挂多个客户，每个客户各自持有需求版本与流程进度；
 * 客户每次变更需求 = 新建需求版本，S1–S5 重走一遍。通过 localStorage 持久化。
 */
import { flowSteps } from './data.js'

const KEY = 'dsh-workorders-v6'

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

/** 生成一个客户（工单下的需求方） */
export function makeCustomer(orderId, index, payload = {}) {
  const step = payload.step || 'S1'
  const stage = flowSteps.find((s) => s.code === step)?.view || 'sales'
  const createdAt = payload.createdAt || stamp()
  const filled = payload.filled || (step === 'S1' ? filledNone() : filledUpTo(step))
  const cust = {
    id: `${orderId}-C${index}`,
    customer: payload.customer || '新客户',
    contact: payload.contact || '',
    product: payload.product || '待定',
    qty: payload.qty || '待定',
    due: payload.due || '待定',
    priority: payload.priority || '中',
    owner: payload.owner || '销售 · 陈工',
    createdAt,
    updatedAt: createdAt,
    step,
    stage,
    returned: false,
    returnReason: '',
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
        action: '新建客户并建单（R01）',
        detail: `${payload.customer || '新客户'} · ${payload.product || '待定'} · ${payload.qty || ''}`,
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
  return cust
}

/** 生成一张工单 */
export function makeOrder(payload = {}) {
  const createdAt = payload.createdAt || stamp()
  return {
    id: payload.id || nextOrderId([], createdAt),
    title: payload.title || '新建工单',
    owner: payload.owner || '销售 · 陈工',
    priority: payload.priority || '中',
    note: payload.note || '',
    createdAt,
    updatedAt: createdAt,
    customers: payload.customers || [],
  }
}

/** 生成工单号：WO-YYYYMMDD-NNN */
export function nextOrderId(orders, day) {
  const d = day || stamp()
  const [mm, dd] = d.split(' ')[0].split('-')
  const year = new Date().getFullYear()
  const prefix = `WO-${year}${mm}${dd}`
  const used = orders
    .map((o) => o.id)
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length + 1), 10) || 0)
  const next = (used.length ? Math.max(...used) : 0) + 1
  return `${prefix}-${String(next).padStart(3, '0')}`
}

/* ---------------- 种子数据 ---------------- */

const c1 = makeCustomer('WO-20261021-001', 1, {
  customer: '越野机器人客户（王工）',
  contact: '王工 · 138****2210',
  product: 'CAHB-22-D2E · CANopen 定制',
  qty: 'EAU 50 pcs',
  due: '样件 8 周',
  priority: '高',
  createdAt: '10-21 09:10',
  note: '客户最初需求：24 V 平台、行程 300 mm（已作废）',
  summary: '48 V · 3,500 N · 行程 50 · CANopen + M12',
  step: 'S1',
  icrm: 'iCRM-2026-0451',
  docs: [
    { label: 'iCRM', value: 'iCRM-2026-0451' },
    { label: '报表', value: '500413 · 起草中' },
    { label: '附件', value: '3 个（500413 / CAHB-22 规格图 / 现场照片）' },
  ],
})
c1.versions = [
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
c1.activeVersion = 'V2'
c1.events = [
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

const c2 = makeCustomer('WO-20261021-001', 2, {
  customer: '华东物流装备（刘工）',
  contact: '刘工 · 139****7788',
  product: 'CAHB-20-B3E · IP69K 增强',
  qty: 'EAU 120 pcs',
  due: '样件 6 周',
  priority: '中',
  owner: '销售 · 周工',
  createdAt: '10-21 08:40',
  step: 'S2',
  note: '客户首次提出需求（IP69K 增强）',
  summary: '24 V · IP69K · EAU 120 pcs',
  detail: '物流输送线用推杆 · 24 V 平台 · 要求 IP69K',
  icrm: 'iCRM-2026-0438',
})
c2.returned = true
c2.returnReason = '客户未提供静态载荷，且温度口径与平台标准不一致，需销售补充后再填表。'
c2.records = recordsUpTo('S2', 'back', {
  S1: { start: '10-21 08:40', end: '10-21 09:20', dur: '40 min', status: 'done' },
  S2: { start: '10-21 09:52', status: 'back', output: '500413 报表（已打回补充）' },
})
c2.events = [
  {
    time: '10-21 10:26',
    step: 'S2',
    stage: 'ae',
    actor: 'AE · 李工',
    type: 'back',
    action: '打回销售（退回 S1）',
    detail: c2.returnReason,
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
    action: '新建客户并建单（R01）',
    detail: '物流输送线用推杆 · 24 V 平台 · EAU 120 pcs · 要求 IP69K',
  },
]
c2.versions[0].step = 'S2'
c2.versions[0].stage = 'ae'
c2.versions[0].returned = true
c2.versions[0].returnReason = c2.returnReason
c2.versions[0].filled = filledUpTo('S2')
c2.versions[0].records = c2.records
c2.versions[0].events = c2.events
c2.docs = [
  { label: 'iCRM', value: 'iCRM-2026-0438' },
  { label: '报表', value: '500413 R01 · 待补充' },
  { label: '附件', value: '2 个（客户需求邮件 / 现场视频）' },
]

const c3 = makeCustomer('WO-20261021-001', 3, {
  customer: '极地科考装备（张工）',
  contact: '张工 · 137****5566',
  product: 'CAHB-22-D2E · 低温型',
  qty: 'EAU 30 pcs',
  due: '样件 10 周',
  priority: '中',
  owner: '销售 · 陈工',
  createdAt: '10-21 11:20',
  step: 'S1',
  note: '客户首次提出需求（-40 ℃ 低温启动）',
  summary: '-40 ℃ 低温 · EAU 30 pcs',
  detail: '科考设备舱门推杆 · 要求 -40 ℃ 可启动',
  icrm: 'iCRM-2026-0460',
})

const c4 = makeCustomer('WO-20261020-018', 1, {
  customer: '北欧农机（Eric）',
  contact: 'Eric · +46 70 *** 2211',
  product: 'CAHB-22-D2E · 标准型',
  qty: 'EAU 300 pcs',
  due: '首批 12 周',
  priority: '中',
  createdAt: '10-20 09:05',
  step: 'S5',
  note: '最终确认版本（当前）',
  summary: '48 V · 3,500 N · 行程 250 · 标准型 EAU 300',
  detail: '最终确认：标准型 CAHB-22-D2E · EAU 300 pcs',
  icrm: 'iCRM-2026-0402',
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
c4.versions = [
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
    docs: c4.docs,
  }),
]
c4.activeVersion = 'V3'
c4.events = [
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

export const seedOrders = [
  makeOrder({
    id: 'WO-20261021-001',
    title: '越野机器人转向推杆 · CANopen 定制项目',
    owner: '销售 · 陈工',
    priority: '高',
    note: '同批项目下有三个需求方，各自推进需求版本与流程',
    createdAt: '10-21 09:10',
    customers: [c1, c2, c3],
  }),
  makeOrder({
    id: 'WO-20261020-018',
    title: '北欧农机转向推杆 · 标准型批量',
    owner: '销售 · 陈工',
    priority: '中',
    createdAt: '10-20 09:05',
    customers: [c4],
  }),
]

const clone = (v) => JSON.parse(JSON.stringify(v))

/* ---------------- 规范化 ---------------- */

const VALID = flowSteps.map((s) => s.code)
const STAGE_STEP = { sales: 'S1', ae: 'S2', rd: 'S3', final: 'S5' }

function ensureCustomer(cust) {
  if (!VALID.includes(cust.step)) cust.step = STAGE_STEP[cust.stage] || 'S1'
  const f = filledNone()
  VALID.forEach((code) => {
    f[code] = !!(cust.filled || {})[code]
  })
  cust.filled = f
  const records = Array.isArray(cust.records) ? cust.records.filter((r) => VALID.includes(r.step)) : []
  cust.records = records.length === VALID.length ? records : buildRecords()
  if (Array.isArray(cust.events)) cust.events = cust.events.filter((e) => !e.step || VALID.includes(e.step))
  if (!Array.isArray(cust.versions) || !cust.versions.length) {
    cust.versions = [makeVersion('R01', { index: 1, step: cust.step })]
    cust.activeVersion = 'V1'
  } else {
    cust.versions.forEach((v) => {
      if (!VALID.includes(v.step)) v.step = 'S1'
      if (!v.filled) v.filled = filledNone()
      if (!Array.isArray(v.records) || v.records.length !== VALID.length) v.records = buildRecords()
      if (Array.isArray(v.events)) v.events = v.events.filter((e) => !e.step || VALID.includes(e.step))
    })
    if (!cust.versions.some((v) => v.id === cust.activeVersion)) {
      cust.activeVersion = cust.versions[cust.versions.length - 1].id
    }
  }
  if (!cust.docs) cust.docs = []
  return cust
}

function ensureOrder(o) {
  if (!Array.isArray(o.customers) || !o.customers.length) {
    const legacy = {
      ...o,
      customer: o.customer || o.title || '未命名客户',
      contact: o.contact || '',
      product: o.product || '待定',
      qty: o.qty || '待定',
      due: o.due || '待定',
      id: `${o.id}-C1`,
    }
    delete legacy.customers
    o.customers = [legacy]
  }
  o.customers.forEach(ensureCustomer)
  if (!o.title) o.title = `${o.customers[0].customer} · ${o.customers[0].product}`
  if (!o.owner) o.owner = o.customers[0].owner || '销售 · 陈工'
  if (!o.priority) o.priority = '中'
  return o
}

/* ---------------- 持久化 ---------------- */

export function loadOrders() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed.map(ensureOrder)
    }
  } catch (e) {
    /* 隐私模式 / 沙箱下忽略 */
  }
  return clone(seedOrders).map(ensureOrder)
}

export function saveOrders(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch (e) {
    /* 忽略写入失败 */
  }
}

export function resetOrders() {
  try {
    localStorage.removeItem(KEY)
  } catch (e) {
    /* 忽略 */
  }
  return clone(seedOrders).map(ensureOrder)
}

/** 新建工单（可同时带第一个客户） */
export function createOrder(list, payload) {
  const order = makeOrder({
    id: payload.id || nextOrderId(list),
    title: payload.title,
    owner: payload.owner,
    priority: payload.priority,
    note: payload.note,
  })
  if (payload.customer?.customer) {
    order.customers.push(
      makeCustomer(order.id, 1, {
        ...payload.customer,
        owner: payload.owner,
        priority: payload.priority,
      }),
    )
  }
  list.unshift(order)
  return order
}

/** 在工单下新建客户 */
export function createCustomer(order, payload) {
  const cust = makeCustomer(order.id, (order.customers?.length || 0) + 1, payload)
  order.customers.push(cust)
  order.updatedAt = stamp()
  return cust
}

/* ---------------- 需求版本 ---------------- */

export function snapshotVersion(cust) {
  const v = (cust.versions || []).find((x) => x.id === cust.activeVersion)
  if (!v) return null
  v.step = cust.step
  v.stage = cust.stage
  v.returned = cust.returned
  v.returnReason = cust.returnReason
  v.filled = clone(cust.filled || {})
  v.records = clone(cust.records || [])
  v.events = clone(cust.events || [])
  v.docs = clone(cust.docs || [])
  v.updatedAt = stamp()
  return v
}

export function activateVersion(cust, versionId) {
  const v = (cust.versions || []).find((x) => x.id === versionId)
  if (!v) return null
  if (cust.activeVersion && cust.activeVersion !== versionId) snapshotVersion(cust)
  cust.activeVersion = v.id
  cust.step = VALID.includes(v.step) ? v.step : 'S1'
  cust.stage = v.stage
  cust.returned = v.returned
  cust.returnReason = v.returnReason
  cust.filled = clone(v.filled)
  cust.records = clone(v.records)
  cust.events = clone(v.events)
  cust.docs = clone(v.docs)
  cust.updatedAt = stamp()
  logEvent(cust, {
    step: cust.step,
    stage: 'sales',
    actor: '系统',
    type: 'note',
    action: '回溯到需求版本 ' + v.label,
    detail: v.note || '切换需求版本，流程从该版本的进度继续',
  })
  v.updatedAt = stamp()
  return v
}

export function createVersion(cust, note, summary) {
  snapshotVersion(cust)
  const n = (cust.versions || []).length + 1
  const label = 'R' + String(n).padStart(2, '0')
  const v = makeVersion(label, {
    index: n,
    note: note || '客户变更需求',
    summary: summary || '客户需求变更，重新走完整流程',
    detail: (note || '客户变更需求') + (summary ? '：' + summary : ''),
    actor: cust.owner || '销售',
    step: 'S1',
    docs: (cust.docs || []).map((d) =>
      ['报表', 'M3 单据', '报价单'].includes(d.label) ? { ...d, value: '待重新生成' } : d,
    ),
  })
  cust.versions = [...(cust.versions || []), v]
  cust.activeVersion = v.id
  cust.step = 'S1'
  cust.stage = 'sales'
  cust.returned = false
  cust.returnReason = ''
  cust.filled = clone(v.filled)
  cust.records = clone(v.records)
  cust.events = clone(v.events)
  cust.docs = clone(v.docs)
  cust.updatedAt = stamp()
  return v
}

/* ---------------- 留痕与记录 ---------------- */

export function logEvent(cust, event) {
  cust.events = [{ time: stamp(), ...event }, ...(cust.events || [])]
  cust.updatedAt = stamp()
}

export function closeStep(cust, code, output, status = 'done') {
  const r = (cust.records || []).find((x) => x.step === code)
  if (!r) return
  r.end = stamp()
  r.status = status
  if (output) r.output = output
  if (r.start && !r.dur) r.dur = r.start === r.end ? '—' : `${r.start} → ${r.end}`
}

export function openStep(cust, code) {
  const r = (cust.records || []).find((x) => x.step === code)
  if (!r) return
  if (!r.start) r.start = stamp()
  r.status = 'doing'
}

/** 导出留痕 CSV */
export function toCsv(cust) {
  const head = ['时间', '步骤', '部门', '操作人', '类型', '动作', '详情']
  const rows = (cust.events || []).map((e) => [
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
