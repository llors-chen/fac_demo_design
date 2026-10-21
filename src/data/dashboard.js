/**
 * 04 · 全流程总览（Dashboard）
 *
 * 把 01 → 01-00 → 02 → 02-00 → 03 的顺序、角色、产出、耗时与交接物摊在一屏，
 * 每个环节可点击跳转到对应区块。
 */

export const flowStages = [
  {
    no: '01',
    anchor: 'req-intake',
    title: '需求粗整理',
    role: '客户 → 销售 → AE',
    stage: '需求阶段',
    dur: '16 min',
    window: '09:12 → 09:28',
    outputs: ['客户原话速记', 'AE 初判'],
    handoff: '初判 + 5 个附件',
    status: 'done',
  },
  {
    no: '01-00',
    anchor: 'req-flow',
    title: '报表协同与三方确认',
    role: '系统 / 销售 / AE / 客户',
    stage: '需求阶段',
    dur: '37 min',
    window: '09:31 → 10:08',
    outputs: ['500413 R03', '三方确认单'],
    handoff: '需求基线 REQ-20261021-001',
    status: 'done',
  },
  {
    no: '02',
    anchor: 'catalog-chat',
    title: '产品目录检索 · 图纸 / BOM',
    role: '系统 / 研发',
    stage: '技术与物料',
    dur: '11 min',
    window: '10:52 → 11:03',
    outputs: ['命中 3 个产品', 'BOM 上载 M3'],
    handoff: 'BOM + 图纸版本',
    status: 'm3',
  },
  {
    no: '02-00',
    anchor: 'factory-sim',
    title: '车间模拟 · 产能与人力',
    role: '计划 / 生产',
    stage: '技术与物料',
    dur: '6 min',
    window: '11:40 → 11:46',
    outputs: ['饱和度 86%', '人力 359 h'],
    handoff: '产能约束与交期建议',
    status: 'run',
  },
  {
    no: '03',
    anchor: 'quote-chat',
    title: '销售回馈与报价',
    role: '销售',
    stage: '商务',
    dur: '22 min',
    window: '11:10 → 11:32',
    outputs: ['报价 ￥35,030', '交期 10 / 30 天'],
    handoff: '回馈客户 → 转审批',
    status: 'doing',
  },
]

export const dashKpis = [
  { label: '端到端时长', value: '154', unit: 'min', sub: '09:12 → 11:46' },
  { label: '流程环节', value: '5', unit: '个', sub: '需求 2 · 技术 2 · 商务 1' },
  { label: '参与角色', value: '4', unit: '方', sub: '客户 / 销售 / AE / 系统' },
  { label: '关键产出', value: '5', unit: '份', sub: '初判 · 报表 · BOM · 看板 · 报价' },
  { label: '决策点', value: '2', unit: '处', sub: 'Feasible 判定 · 报价审批' },
]

export const dashTrail = [
  { label: 'iCRM', value: 'iCRM-2026-0451' },
  { label: '报表', value: '500413 R03 · 5 节全部确认' },
  { label: '需求基线', value: 'REQ-20261021-001（R03）' },
  { label: 'M3 单据', value: 'BOM-20261021-021' },
  { label: '三方签署', value: '客户 10:06 · 销售 10:07 · AE 10:08' },
]

export const dashRisks = [
  { level: 'warn', text: '静态载荷 6,000 N 待按 CAHB-22 曲线校核，可能触发加强壳体（成本 +8%）' },
  { level: 'risk', text: '出口管制需先做合规初筛，未过筛前不承诺批量交期' },
  { level: 'ok', text: 'B 线加班 12 h 为人力最大项，建议把 2 个工位前置到 A 线空闲时段' },
]

export const dashNext = [
  '研发：控制板 CANopen 打样启动（样件 8 周倒排）',
  '销售：把报价单与交期发客户，确认 30 天内下单',
  '计划：按 EAU 50 pcs 预留 A 线产能，工装费用单列',
]
