/**
 * 部门工作台 · 数据
 *
 * 标准流程 5 步（S1 → S5）：客户每次变更需求 = 新建需求版本，5 步都要重走一遍。
 * 内部仍用 4 个"部门阶段"（sales / ae / rd / final）承载视图，一个阶段可覆盖多个步骤。
 */

export const departments = [
  { key: 'sales', name: '销售', icon: 'briefcase', desc: '客户对接 · 需求整理 · 回执报价' },
  { key: 'ae', name: 'AE', icon: 'flask', desc: '500413 报表填写 · 三方对齐确认' },
  { key: 'rd', name: '研发', icon: 'gear', desc: '产品匹配 · 图纸/BOM · 产能评估' },
]

/**
 * 标准流程步骤 S1–S5（有效流转步骤）
 *   view  该步骤落在哪个部门视图
 *   tab   视图内的页签（研发分 产品匹配 / 产能评估）
 *   focus 同一视图内的侧重点（销售分 接收 / 回执）
 *
 * 说明：需求整理与初步判断由 AI 在 S1 内自动完成；报价与交期由系统在 S5 自动汇总，
 *      两者都不作为独立流转步骤，因此不占编号。
 */
export const flowSteps = [
  {
    code: 'S1',
    name: '需求接收与建档',
    dept: 'sales',
    view: 'sales',
    focus: 'intake',
    owner: '销售 · 陈工',
    desc: '接收客户原话与附件、AI 整理要点与初判结论，建立工单与需求版本',
  },
  {
    code: 'S2',
    name: '需求报表填报与三方确认',
    dept: 'ae',
    view: 'ae',
    owner: 'AE · 李工',
    desc: '按 500413 逐节填写，客户 / 销售 / AE 三方对齐确认',
  },
  {
    code: 'S3',
    name: '产品匹配与图纸 / BOM',
    dept: 'rd',
    view: 'rd',
    tab: 'match',
    owner: '研发 · 李工',
    desc: '目录匹配基型、生成 BOM 并上载 M3，挂接图纸版本',
  },
  {
    code: 'S4',
    name: '产能与人力评估',
    dept: 'rd',
    view: 'rd',
    tab: 'cap',
    owner: '研发 · 计划',
    desc: '流水线饱和度、人工延迟、人力成本与插单可行性',
  },
  {
    code: 'S5',
    name: '客户回执与工单归档',
    dept: 'sales',
    view: 'final',
    focus: 'ack',
    owner: '销售 · 陈工',
    desc: '系统自动汇总报价与交期，销售回执客户并归档留痕',
  },
]

/** 部门阶段（承载视图；一个阶段覆盖 1–2 个步骤） */
export const stages = [
  { key: 'sales', no: 'S1', dept: 'sales', name: '需求接收与建档', owner: '销售 · 陈工' },
  { key: 'ae', no: 'S2', dept: 'ae', name: '需求报表填报与三方确认', owner: 'AE · 李工' },
  { key: 'rd', no: 'S3–S4', dept: 'rd', name: '产品匹配与产能评估', owner: '研发 · 李工 / 计划' },
  { key: 'final', no: 'S5', dept: 'sales', name: '客户回执与工单归档', owner: '销售 · 陈工' },
]

export const stageIndex = (key) => stages.findIndex((s) => s.key === key)
export const stepIndex = (code) => flowSteps.findIndex((s) => s.code === code)
export const stepOf = (code) => flowSteps.find((s) => s.code === code)
export const stageOfStep = (code) => stepOf(code)?.view || 'sales'
export const stepsOfStage = (stage) => flowSteps.filter((s) => s.view === stage).map((s) => s.code)

/** 各步骤的空白模板（只给结构，一键填写后才有值） */
export const stepOutline = {
  sales: {
    title: '客户对接记录 · 空白模板',
    hint: '把客户原话、附件与整理要点填进来，AI 会给出初判结论',
    sections: [
      {
        name: '客户原话',
        fields: [
          '客户 / 项目',
          '应用场景',
          '关键参数（电压 / 推力 / 速度 / 行程）',
          '数量与交期',
          '定制点',
          '认证与其他',
        ],
      },
      { name: '客户附件', fields: ['需求评估表 500413', '产品规格图', '现场照片'] },
      { name: 'AI 初判', fields: ['产品族判断', '初步结论', '待客户确认项'] },
    ],
  },
  ae: {
    title: '500413 · Customer requirement assessment（空白模板）',
    hint: '按 500413 的 5 个章节逐节填写，系统会与客户原文逐条对照',
    sections: [
      { name: '1. Project introduction', fields: ['iCRM ID', '项目', 'timing plan', 'volume'] },
      { name: '2. Application information', fields: ['function', 'environment', 'frequency', 'life'] },
      {
        name: '3. Specifications',
        fields: [
          '3.1 Performance',
          '3.2 Functions',
          '3.3 Installation interface',
          '3.4 Tests',
          '3.5 Certification',
        ],
      },
      { name: '4. Other', fields: ['export control', 'packaging'] },
      { name: '5. Feasibility assessment', fields: ['结论', 'customization base', 'customized point'] },
    ],
  },
  rd: {
    title: '产品匹配与产能评估 · 空白模板',
    hint: '检索产品目录匹配基型，生成 BOM 并上载 M3，再评估产能与交期',
    sections: [
      {
        name: 'S3 产品匹配与图纸 / BOM',
        fields: ['大分类命中', '候选产品与匹配度', '图纸 / BOM', '交期与库存'],
      },
      { name: 'S4 产能与人力评估', fields: ['流水线饱和度', '人工延迟', '人力工时与成本', '插单可行性'] },
    ],
  },
  final: {
    title: '客户回执与工单归档 · 空白模板',
    hint: '系统自动汇总报表、BOM 与产能生成报价与交期，销售回执客户并归档',
    sections: [
      {
        name: '系统自动汇总 · 报价与交期',
        fields: ['报价明细', '小计 / 税额 / 含税合计', '样件与首批交期', '前提与风险'],
      },
      {
        name: 'S5 客户回执与工单归档',
        fields: ['回执渠道与时间', '客户确认结果', '归档单据', '工单关闭'],
      },
    ],
  },
}

/* ---------------- S1 / S2 销售：客户对接内容 + AI 分析 ---------------- */

export const salesIntake = {
  raw: [
    '【越野机器人客户 王工 · iCRM-2026-0451 · 09:12】',
    '我们那台越野自主机器人转向要改成电控，想用你们家的电动推杆直接推方向盘，原来是手轮机构。',
    '电池是 48V 平台，要求额定推力 3500N、峰值 4500N，速度 30mm/s 以上，行程 50 就够了。',
    '主控要 CANopen，还要绝对位置反馈，线束统一 M12 四芯、1.5 米。',
    '户外跑，粉尘泥水都有，-20 到 60 度，震动很大。整机 5 年，推杆得 60 万次以上。',
    '一年 50 套，样件 6 周能不能给？目标单价 1850 以内。CE 就行，UL 先不做。',
  ].join('\n'),
  attachments: [
    { name: '500413 Customer requirement assessment.pdf', size: '152 KB', note: '客户已填 2 节' },
    { name: 'EW000970459_CAHB22E_Rev1.1.pdf', size: '1.2 MB', note: 'CAHB-22 规格图' },
    { name: '转向机构现场照片.jpg', size: '860 KB', note: '安装空间' },
  ],
  points: [
    '48 V 平台 · 额定 3,500 N / 峰值 4,500 N · 行程 50 mm',
    'CANopen + 绝对位置反馈 + M12 四芯线束',
    '户外粉尘泥水、-20~60 ℃、60 万次寿命',
    'EAU 50 pcs · 目标单价 ≤ ￥1,850 · CE（UL 不做）',
  ],
  missing: ['静态载荷要求', '密封槽尺寸', '温度口径（实际 vs 平台标准）'],
}

export const salesChat = [
  {
    role: 'ai',
    text: '我已读取客户原话、500413 已填部分与 3 个附件。先给出可流转的要点（右侧 4 条），并标出 3 处缺失信息。',
  },
  { role: 'user', text: '这单能做吗？要问客户什么？' },
  {
    role: 'ai',
    text: '判断为可做：属于 CAHB 系列电动推杆，倾向 CAHB-22-D2E 基型（48 V / 3,500 N / 37 mm/s / 行程 50）。需向客户补 3 项：静态载荷、密封槽尺寸、温度口径。',
  },
  {
    role: 'ai',
    text: '另外提示：客户期望样件 6 周，但含 CANopen 控制板打样，建议按 8 周承诺并注明原因。',
  },
]

/* ---------------- S3 AE：报表 + 助手 ---------------- */

export const reportSections = [
  {
    no: '1',
    title: 'Project introduction',
    zh: '项目介绍',
    items: [
      { key: 'icrm', label: 'iCRM ID', value: 'iCRM-2026-0451', from: 'system' },
      { key: 'project', label: '项目', value: '自主机器人转向执行机构 · 推杆换型', from: 'system' },
      { key: 'timing', label: 'timing plan', value: '样件 8 周 → 小批 12 周 → SOP 22 周', from: 'sales' },
      { key: 'volume', label: 'volume', value: 'EAU 50 pcs', from: 'customer' },
    ],
  },
  {
    no: '2',
    title: 'Application information',
    zh: '应用信息',
    items: [
      {
        key: 'scene',
        label: 'function',
        value: 'off road autonomous robot · steering wheel control',
        from: 'customer',
      },
      { key: 'env', label: 'environment', value: '户外越野：粉尘 / 泥水 / 强振动', from: 'customer' },
      { key: 'freq', label: 'frequency', value: '每班约 400 次往复 · 两班制', from: 'system' },
      { key: 'life', label: 'life', value: '整机 5 年 · 推杆往复 ≥ 60 万次', from: 'customer' },
    ],
  },
  {
    no: '3',
    title: 'Specifications',
    zh: '规格',
    items: [
      {
        no: '3.1',
        key: 'perf',
        label: 'Performance',
        value: '48 V DC / 3,500 N / 37 mm/s / 20% duty',
        from: 'customer',
        warn: true,
      },
      {
        no: '3.2',
        key: 'func',
        label: 'Functions',
        value: 'CANopen · 绝对位置反馈 · 自锁 + 后备螺母',
        from: 'customer',
      },
      {
        no: '3.3',
        key: 'iface',
        label: 'Installation interface',
        value: '行程 50 mm · M12 四芯 · 线长 1.5 m',
        from: 'customer',
      },
      {
        no: '3.4',
        key: 'tests',
        label: 'Tests',
        value: '-40 / +85 ℃（平台标准）· IP66M/IP69K · 60 万次',
        from: 'system',
        warn: true,
      },
      { no: '3.5', key: 'cert', label: 'Certification', value: 'CE；UL 暂不要求', from: 'customer' },
    ],
  },
  {
    no: '4',
    title: 'Other',
    zh: '其他',
    items: [
      {
        key: 'export',
        label: 'export control',
        value: '终端在境外 → 需合规初筛（ECCN 初判）',
        from: 'system',
        warn: true,
      },
      { key: 'pack', label: 'packaging', value: '单件气泡膜 + 纸箱（10 件/箱）', from: 'sales' },
    ],
  },
]

export const aeChat = [
  {
    role: 'ai',
    text: '报表已按 500413 预填：销售确认过的 4 节 + 系统按规格图补的 3.1/3.4/4。带 ⚠ 的 3 处需要你判断是否问客户。',
  },
  { role: 'user', text: '哪几处和客户原文对不上？' },
  {
    role: 'ai',
    text: '① 3.1 static load 客户未提及；② 3.4 温度客户说 -20~60 ℃，报表按平台 -40/+85 ℃ 填；③ 3.3 密封槽客户只提"渗油"，未给尺寸。',
  },
  { role: 'ai', text: '建议：勾选这 3 条发起客户确认；确认后我自动回填并生成三方确认单。' },
]

/* ---------------- S4 / S5 研发：产品匹配 + 产能评估 ---------------- */

export const rdMatch = {
  groups: [
    {
      name: '电动推杆',
      en: 'Linear actuators',
      match: 96,
      products: [
        {
          name: 'CAHB-22-D2E-0500366',
          code: 'EW000970459',
          spec: '48 V · 3,500 N · 37 mm/s · 行程 50',
          match: 96,
          stock: '现货',
          lead: '4 周',
          dwg: true,
        },
        {
          name: 'CAHB-20-B3E-3000509',
          code: 'EW000970173',
          spec: '24 V · 4,500 N · 5.5 mm/s · 行程 300',
          match: 78,
          stock: '现货',
          lead: '3 周',
          dwg: true,
        },
        {
          name: 'CAHB-22-CAN 定制',
          code: 'CAHB-22-CAN',
          spec: '48 V · 3,500 N · CANopen',
          match: 94,
          stock: '按单',
          lead: '样件 8 周',
          dwg: true,
        },
      ],
    },
    {
      name: '附件与线束',
      en: 'Accessories',
      match: 90,
      products: [
        {
          name: 'M12 A 编码四芯线束 1.5 m',
          code: 'NY-CB-M12',
          spec: '4 × 0.75 mm²',
          match: 90,
          stock: '现货',
          lead: '1 周',
          dwg: false,
        },
        {
          name: '前后安装叉耳组件',
          code: 'NY-MT-C22',
          spec: '⌀12.2 H11 / 10 H11',
          match: 82,
          stock: '现货',
          lead: '2 周',
          dwg: false,
        },
      ],
    },
  ],
  bom: [
    { seq: '01', code: 'MTR-4835', name: '无刷电机 48 V', qty: 1, unit: 0.9 },
    { seq: '02', code: 'GBX-2212', name: '行星齿轮箱 i=12', qty: 1, unit: 1.1 },
    { seq: '03', code: 'SCR-1604', name: '梯形丝杠 Tr16×4', qty: 1, unit: 0.85 },
    { seq: '04', code: 'HSG-C22', name: '铝壳体（阳极氧化）', qty: 1, unit: 1.2 },
    { seq: '05', code: 'PCB-CAN', name: 'CANopen 控制板（定制）', qty: 1, unit: 0.12 },
    { seq: '06', code: 'CBL-M12', name: 'M12 四芯线束 1.5 m', qty: 1, unit: 0.14 },
  ],
  lines: [
    { key: 'A', name: 'A 线 · 推杆总装', tact: 92, sat: 0.86, delay: 2.4, staff: 14, output: 312 },
    { key: 'B', name: 'B 线 · 丝杠机加', tact: 78, sat: 0.93, delay: 3.1, staff: 11, output: 402 },
    { key: 'C', name: 'C 线 · 气密 / EMC', tact: 104, sat: 0.71, delay: 0.8, staff: 7, output: 268 },
    { key: 'D', name: 'D 线 · 包装发运', tact: 64, sat: 0.64, delay: 0.3, staff: 5, output: 455 },
  ],
  recommended: 0.82,
  labor: { hours: 359, ot: 35, cost: 13642, efficiency: 90.3 },
}

export const rdChat = [
  {
    role: 'ai',
    text: '按需求基线检索产品目录：命中 2 个大分类、5 个产品，其中 3 个有图纸 / BOM。最匹配 CAHB-22-D2E（96%）。',
  },
  { role: 'user', text: '产能能接吗？' },
  {
    role: 'ai',
    text: '车间看板：加权人工延迟饱和度 86%（推荐 82%），B 线 93% 已偏高；EAU 50 pcs 可插单，样件需占用 A 线 1 个工位 3 天。',
  },
  { role: 'ai', text: 'BOM 已生成并上载 M3（BOM-20261021-021），可直接回传销售做报价。' },
]

/* ---------------- S5 回销售：预测结果与回执 ---------------- */

export const forecast = {
  kpis: [
    { label: '含税报价', value: '￥35,030', sub: '13% 税 · 有效期 30 天' },
    { label: '样件交期', value: '10 天', sub: '手工分度 · 含控制板打样' },
    { label: '首批交期', value: '30 天', sub: '工装到位后' },
    { label: '产能饱和度', value: '86%', sub: '推荐 82% · B 线偏高' },
    { label: '单件人工成本', value: '￥9.50', sub: '人力 359 h / ￥13,642' },
    { label: '风险项', value: '3 项', sub: '载荷校核 · 出口管制 · 加班' },
  ],
  quote: [
    { name: 'CAHB-22-D2E（标准）', qty: 50, price: 1850, amount: 92500 },
    { name: 'CANopen 控制板 NRE', qty: 1, price: 18000, amount: 18000 },
    { name: 'M12 四芯线束', qty: 50, price: 120, amount: 6000 },
  ],
  gantt: [
    { label: '控制板打样', from: 0, days: 21 },
    { label: '样件装配', from: 21, days: 7 },
    { label: '客户验证', from: 28, days: 14 },
    { label: '工装与治具', from: 0, days: 28 },
    { label: '小批生产', from: 28, days: 42 },
  ],
  conclusion: [
    '推荐按 CAHB-22-D2E 定制：CANopen + M12 四芯 + 绝对位置反馈，三项均为已做过项目的改动。',
    '静态载荷 6,000 N 需按 22 系列曲线校核，若不足则加强壳体（成本 +8%、交期 +2 周），报价已按加强版预留。',
    '建议对客户承诺：样件 10 天、首批 30 天；出口管制初筛通过前不承诺批量交期。',
  ],
}
