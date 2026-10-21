/**
 * 站点文案与结构数据（集中管理，方便替换成真实内容）
 */

/** 顶部导航：仅作按钮，不跳转 */
export const navItems = [
  { key: 'factory', label: '工厂信息', icon: 'factory' },
  { key: 'brand', label: '品牌介绍', icon: 'flag' },
  { key: 'sample', label: '样品解决方案', icon: 'flask' },
  { key: 'career', label: '职业', icon: 'briefcase' },
  { key: 'company', label: '公司', icon: 'building' },
]

export const navSecondary = [
  { key: 'news', label: '企业新闻 & 媒体', icon: 'newspaper' },
  { key: 'contact', label: '联系我们', icon: 'pin' },
]

/** 头版：流程时间记录（每一步的样例时间与状态） */
export const processLog = [
  {
    no: '01',
    anchor: 'req-intake',
    title: '销售端 · 客需需求粗整理',
    meta: '客户原话 → 销售要点 → AE 初判',
    status: '已完成',
    note: '客户口述（越野机器人转向 / 48 V / 3,500 N）+ 5 个附件；销售整理 6 条要点，AE 初判为 CAHB 系列并列出 3 项缺失信息',
    times: [
      { label: '客户口述 + 附件', time: '09:12' },
      { label: 'AE 初判与缺失信息', time: '09:28' },
    ],
  },
  {
    no: '01-00',
    anchor: 'req-flow',
    title: '流程化 · 销售端工程细节对齐',
    meta: '报表 500413 / 500425',
    status: '已完成',
    note: '系统替销售起草并补齐 500413 → 销售逐节确认 → AE 对照客户原文二次复核（3 处勾选询问客户）→ 客户答复回填 → 客户 / 销售 / AE 三方确认单；10 步 / 37 分钟',
    times: [
      { label: '系统起草 500413', time: '09:31' },
      { label: 'AE 复核 · 发出询问', time: '09:57' },
      { label: '三方确认 · 系统归档', time: '10:08' },
    ],
  },
  {
    no: '02',
    anchor: 'catalog-chat',
    title: '产品目录检索 · 图纸与 BOM',
    meta: '3 大类 / 6 个产品 / 3 个有图纸',
    status: '已上载 M3',
    note: '两个分支：① 产品目录匹配（大分类 → 小分类产品 → 有图纸才展开看图与 BOM）；② 客制化目标匹配（历史零件组装与规格对比）',
    times: [
      { label: '提交检索并定位产品', time: '10:52' },
      { label: 'BOM 上载 M3', time: '11:03' },
    ],
  },
  {
    no: '02-00',
    anchor: 'factory-sim',
    title: '车间模拟 · 产能与人力',
    meta: '4 条线 / 200 种零件 / 20 种成品',
    status: '运行中',
    note: '人工延迟饱和度 86%（推荐 82%）· 平均成品延迟 6.8 h · 人力 359 h / 人工成本 ￥13,642',
    times: [
      { label: '白班开班 · 看板刷新', time: '11:40' },
      { label: '切换到夜班复核', time: '11:46' },
    ],
  },
  {
    no: '03',
    anchor: 'quote-chat',
    title: '销售端 · 回馈与报价',
    meta: '含税合计 · 样件交期',
    status: '进行中',
    note: '汇总匹配结果 → 报价明细（数量档位 / 折扣 / 税）+ 预估交期甘特 + 前提与风险 + 转客户话术',
    times: [
      { label: '生成报价与交期', time: '11:10' },
      { label: '销售回馈客户', time: '11:32' },
    ],
  },
]



/** 第 01 区：客户附件信息（销售从客户处获得的 PDF / 图纸 / 图片等） */

/** 第 01 区：书面需求模板、样例与附件（口径：CAHB 电动推杆 / 500413 报表） */

/** 第 01 区：书面需求模板（按 500413 的 1/2/3/4/5 五节组织） */
export const intakeMeta = {
  no: 'REQ-20261021-001',
  state: '待产品目录匹配',
  risk:
    '静态载荷 6,000 N 待按 CAHB-22 曲线校核（可能加加强壳体，成本 +8%）；CANopen 控制板需打样（样件 8 周）；终端境外，出口管制需先做合规初筛',
}

export const intakeTemplate = [
  {
    no: '1',
    title: 'Project introduction',
    zh: '项目介绍',
    items: [
      { key: 'customer', label: '客户 / 来源', value: 'Ewellix 平湖 · 越野机器人客户（王工）', from: 'customer' },
      { key: 'icrm', label: 'iCRM ID', value: 'iCRM-2026-0451' },
      { key: 'project', label: '项目 / 用途', value: '自主机器人转向执行机构 · 电动推杆换型' },
      { key: 'timing', label: 'timing plan', value: '样件 8 周 → 小批 12 周 → SOP 22 周' },
      { key: 'volume', label: 'volume', value: 'EAU 50 pcs', from: 'qty' },
      { key: 'sc', label: 'target SC', value: '目标单价 ≤ ￥1,850 / 件' },
    ],
  },
  {
    no: '2',
    title: 'Application information',
    zh: '应用信息',
    items: [
      {
        key: 'scene',
        label: 'function description',
        value: 'off road autonomous robot，actuator 用于 steering wheel control',
      },
      {
        key: 'env',
        label: 'environment description',
        value: '户外越野：粉尘 / 泥水 / -20~60 ℃ / 强振动',
      },
      { key: 'freq', label: 'frequency of use', value: '每班约 400 次往复，两班制', from: 'freq' },
      { key: 'life', label: 'life expectancy', value: '整机 5 年；推杆往复 ≥ 60 万次', from: 'life' },
    ],
  },
  {
    no: '3',
    title: 'Specifications',
    zh: '规格',
    items: [
      {
        no: '3.1',
        key: 'performance',
        title: 'Performance',
        zh: '性能',
        value:
          '48 V DC（40~55 V）；额定 3,500 N / 峰值 4,500 N；37 mm/s；占空比 20%（85 s on / 340 s off）；额定电流 ≤ 6 A',
        from: 'perf',
      },
      {
        no: '3.2',
        key: 'functions',
        title: 'Functions',
        zh: '功能',
        value: '绝对位置反馈 0~5 V；内置限位 + 外部急停；CANopen；自锁 + 后备螺母',
        from: 'func',
      },
      {
        no: '3.3',
        key: 'interface',
        title: 'Installation interface',
        zh: '安装接口',
        value:
          '行程 50 mm；缩回长 ≈ 366 mm；前叉耳 ⌀12.2 H11 / 后耳环 10 H11；线长 1.5 m；连接器 M12 A 编码 4 芯',
        from: 'iface',
      },
      {
        no: '3.4',
        key: 'tests',
        title: 'Tests',
        zh: '测试',
        value:
          '-40 / +85 ℃；随机振动 5~500 Hz；冲击 30 g / 11 ms；EMC EN 61000-6-2/-6-4；IP66M / IP69K；噪声 ≤ 65 dB(A)',
        from: 'tests',
      },
      {
        no: '3.5',
        key: 'certification',
        title: 'Certification',
        zh: '认证',
        value: 'CE；UL 暂不要求（已写入假设条款）',
        from: 'cert',
      },
    ],
  },
  {
    no: '4',
    title: 'Other',
    zh: '其他',
    items: [
      { key: 'export', label: 'export control', value: '终端在境外 → 需合规初筛（ECCN 初判）', from: 'export' },
      { key: 'pack', label: 'packaging / labeling', value: '单件气泡膜 + 纸箱（10 件/箱）；图号 + 批次 + 序列号激光打标' },
      { key: 'spare', label: 'spare parts', value: '首批随货 2 件备件' },
    ],
  },
  {
    no: '5',
    title: 'Feasibility assessment',
    zh: '可行性评估',
    items: [
      { key: 'verdict', label: '结论', value: '☒ Feasible　☐ Not feasible', from: 'feasible' },
      {
        key: 'base',
        label: 'customization base',
        value: 'CAHB-22-D2E（EW000970459：48 V / 3,500 N / 37 mm/s / 行程 50）',
      },
      {
        key: 'points',
        label: 'customized point',
        value: '① CANopen 控制板　② M12 连接器 + 1.5 m 线束　③ 绝对位置反馈（沿用 22 系列选配）',
      },
      { key: 'open', label: '待校核', value: '静态载荷 6,000 N（按 22 系列曲线）' },
    ],
  },
]

/** 第 01 区：客户口语记录样例（可编辑） */
export const intakeSample = [
  '【越野机器人客户 王工 · iCRM-2026-0451 · 09:12】',
  '我们那台越野自主机器人转向要改成电控，想用你们家的电动推杆直接推方向盘，原来是手轮机构。',
  '电池是 48V 平台，要求额定推力 3500N、峰值 4500N，速度 30mm/s 以上，行程 50 就够了。',
  '主控要 CANopen，还要绝对位置反馈，线束统一 M12 四芯、1.5 米。',
  '户外跑，粉尘泥水都有，-20 到 60 度，震动很大。整机 5 年，推杆得 60 万次以上。',
  '一年 50 套，样件 6 周能不能给？目标单价 1850 以内。CE 就行，UL 先不做。',
].join('\n')

/** 第 01 区：整理过程 */
export const intakeSteps = ['客户口述（原话）', '销售整理要点', 'AE 初判与缺失信息']

/** 第 01 区：客户附件（真实参考资料） */
export const attachments = [
  {
    id: 'att-1',
    name: '500413 Customer requirement assessment.pdf',
    kind: 'pdf',
    size: '152 KB',
    from: '客户回传',
    state: '已解析',
    note: 'R02 · 5 节中已填 2 节',
    key: 'EAU 50 pcs / 越野机器人转向控制',
  },
  {
    id: 'att-2',
    name: '500425 Customer requirement assessment.pdf',
    kind: 'pdf',
    size: '124 KB',
    from: '客户提供',
    state: '已解析',
    note: 'R01 · 空白模板',
    key: '报表结构基准（1~5 节）',
  },
  {
    id: 'att-3',
    name: 'EW000970173_CAHB20E_Rev1.1.pdf',
    kind: 'pdf',
    size: '1.1 MB',
    from: '工程提供',
    state: '已解析',
    note: 'Rev 1.1 · 规格图',
    key: 'CAHB-20：24 V / 4,500 N / 5.5 mm/s / 行程 300',
  },
  {
    id: 'att-4',
    name: 'EW000970459_CAHB22E_Rev1.1.pdf',
    kind: 'pdf',
    size: '1.2 MB',
    from: '工程提供',
    state: '已解析',
    note: 'Rev 1.1 · 规格图',
    key: 'CAHB-22：48 V / 3,500 N / 37 mm/s / 行程 50',
  },
  {
    id: 'att-5',
    name: '转向机构现场照片.jpg',
    kind: 'img',
    size: '860 KB',
    from: '王工 · 微信',
    state: '已识别',
    note: '4032 × 3024',
    key: '安装空间与干涉位置',
  },
]

/** 第 01 区：附件要点 */
export const attachmentPoints = [
  'EAU 50 pcs · 越野机器人转向控制（来自 500413 第 1、2 节）',
  'CAHB-22：48 V / 3,500 N / 37 mm/s / 行程 50（来自 EW000970459）',
  'CAHB-20：24 V / 4,500 N / 5.5 mm/s / 行程 300（来自 EW000970173）',
]


/** 第 02 区：产品目录检索（chatbot 外壳 + 工具） */
export const catalogChat = {
  name: '产品目录检索助手',
  role: 'Catalog Finder',
  greeting:
    '你好，我可以基于销售整理出的需求（含客户附件要点）检索产品目录：先定位大分类，再收敛到具体产品；命中产品若有图纸 / BOM，会一并展开。',
  preInput: '基于销售的信息检索产品目录，匹配可能的产品并展示图纸 / BOM 信息',
  toolId: 'product_catalog_search',
  toolName: '产品目录检索 · 图纸与 BOM',
  reply: (q) =>
    `已按「${q}」检索产品目录：命中 2 个大分类、6 个具体产品，其中 4 个产品有图纸 / BOM，已展开最匹配的「平焊法兰 DN160」。`,
  suggestions: [
    '基于销售的信息检索产品目录，匹配可能的产品并展示图纸 / BOM 信息',
    'DN160 法兰盘有没有现货，交期多久',
    '目录里没有完全匹配的，走客制化目标匹配',
  ],
}

/** 第 02 区：产品目录（大分类 → 小分类产品；部分产品有图纸 / BOM） */
export const catalogGroups = [
  {
    key: 'flange',
    name: '法兰连接件',
    en: 'Flange connections',
    icon: 'grid',
    match: 96,
    products: [
      {
        id: 'p-ff-160',
        name: '平焊法兰 DN160',
        code: 'NY-FF-160',
        spec: 'DN160 · 厚 32 · A 型',
        material: 'Q235B',
        match: 96,
        stock: '现货 120 件',
        lead: '3 天',
        why: 'DN160 / ⌀40 轴 / 8×⌀13 均布 全部匹配；对接面形式与客户图纸一致',
        dwg: {
          file: '法兰盘装配图.dwg',
          code: 'NY-FL-2026-008',
          sheet: 'A2 · 1:2',
          rev: 'V3',
          suffix: '021',
          bom: 'dwgBom',
        },
      },
      {
        id: 'p-fw-160',
        name: '对焊法兰 DN160',
        code: 'NY-FW-160',
        spec: 'DN160 · 厚 32 · B 型',
        material: '16Mn',
        match: 91,
        stock: '现货 46 件',
        lead: '5 天',
        why: 'DN160 匹配；对焊结构强度更高，需确认对接面坡口',
        dwg: {
          file: '法兰盘对焊装配图.dwg',
          code: 'NY-FL-2025-042',
          sheet: 'A2 · 1:2',
          rev: 'V2',
          suffix: '019',
          bom: 'dwgBom',
        },
      },
      {
        id: 'p-fn-160',
        name: '带颈法兰 DN160',
        code: 'NY-FN-160',
        spec: 'DN160 · 厚 32 · C 型',
        material: '20 钢',
        match: 84,
        stock: '按单生产',
        lead: '12 天',
        why: 'DN160 匹配，带颈加强；无现成图纸，需出图',
      },
    ],
  },
  {
    key: 'seal',
    name: '密封件',
    en: 'Seals',
    icon: 'layers',
    match: 88,
    products: [
      {
        id: 'p-se-160',
        name: '端面密封垫 ⌀160',
        code: 'NY-SE-160',
        spec: '⌀160 / ⌀80 · 厚 2',
        material: '耐油橡胶',
        match: 88,
        stock: '现货 300 件',
        lead: '2 天',
        why: '与 DN160 法兰端面配合，可直接替换原密封垫',
      },
      {
        id: 'p-os-040',
        name: '骨架油封 FB 40×62×8',
        code: 'NY-OS-040',
        spec: '40 × 62 × 8',
        material: 'NBR + 弹簧',
        match: 76,
        stock: '现货 88 件',
        lead: '4 天',
        why: '配 ⌀40 轴；若渗油来自轴颈可一并更换',
        dwg: {
          file: '油封座装配图.dwg',
          code: 'NY-OS-2024-007',
          sheet: 'A3 · 1:1',
          rev: 'V1',
          suffix: '011',
          bom: 'sealBom',
        },
      },
    ],
  },
  {
    key: 'bearing',
    name: '轴承支撑',
    en: 'Bearing supports',
    icon: 'building',
    match: 72,
    products: [
      {
        id: 'p-bs-120',
        name: '立式轴承座 H1-120',
        code: 'NY-BS-120',
        spec: '中心高 120 · 配 6212',
        material: '铸铁 HT200',
        match: 72,
        stock: '现货 18 件',
        lead: '7 天',
        why: '同族支撑结构；本次需求未明确要求，作为备选',
        dwg: {
          file: '轴承座装配图.dwg',
          code: 'NY-BS-2026-003',
          sheet: 'A2 · 1:1.5',
          rev: 'V3',
          suffix: '008',
          bom: 'bearingBom',
        },
      },
    ],
  },
]

/** 各产品图纸对应的 BOM */
/** 第 03 区：销售回馈与报价（chatbot 外壳 + 报价 / 交期工具） */
export const quoteChat = {
  name: '报价与交期助手',
  role: 'Quote & Lead Time',
  greeting:
    '我可以把第 02 区的匹配结果（标准产品或客制化方案）汇总成一份给销售的回馈：报价明细、预估交期、前提与风险，可直接转客户。',
  preInput: '汇总匹配结果，给销售回馈报价与预估交期',
  toolId: 'quote_leadtime_eval',
  toolName: '报价单 · 预估交期 · 风险提示',
  reply: (q) =>
    `已按「${q}」生成回馈：含税合计 ￥35,030（13% 税），预估样件 10 天、首批 30 天、专用工装 45 天；前提与风险见下方清单。`,
  suggestions: [
    '汇总匹配结果，给销售回馈报价与预估交期',
    '客户要 200 件，含税总价多少',
    '样件最快几天能给客户',
  ],
}

/** 数量档位：影响折扣与首批交期 */
export const quoteTiers = [
  { qty: 200, label: '200 件', discount: 0, leadDelta: 0, note: '首批标准批量' },
  { qty: 500, label: '500 件', discount: 0.05, leadDelta: 5, note: '≥500 件享 5% 折扣' },
  { qty: 1000, label: '1000 件', discount: 0.08, leadDelta: 12, note: '≥1000 件享 8% 折扣' },
]

/** 报价明细（基础行，数量随档位变化） */
export const quoteBaseItems = [
  { no: '01', name: '平焊法兰 DN160', code: 'NY-FF-160', unit: '件', price: 86, tiered: true, note: '标准产品 · 材料现货' },
  { no: '02', name: '端面密封垫 ⌀160', code: 'NY-SE-160', unit: '件', price: 6, tiered: true, note: '随法兰配套' },
  { no: '03', name: '样件（手工分度）', code: 'NY-FF-160-S', unit: '件', qty: 5, price: 120, note: '先行验证，10 天交付' },
  { no: '04', name: '专用分度工装', code: 'NY-JIG-160', unit: '套', qty: 1, price: 12000, note: '一次性 · 计入项目开发费' },
]

/** 交期预估（甘特：from 为起始天，days 为工期） */
export const quoteTimeline = [
  { key: 'dwg', label: '图纸与工艺确认', from: 0, days: 2, note: '含客户确认孔距与密封槽' },
  { key: 'sample', label: '样件制作（手工分度）', from: 0, days: 10, note: '样件 5 件，可提前插单' },
  { key: 'verify', label: '客户装机验证', from: 10, days: 5, note: '客户现场，可与工装并行' },
  { key: 'jig', label: '专用分度工装设计与制造', from: 0, days: 45, note: '一次性投入，关键路径' },
  { key: 'batch', label: '首批生产（工装到位后）', from: 45, days: 30, note: '含三坐标首件复检' },
]

export const quoteNotes = {
  basis: [
    '材料价格按 2026-10 月度价，有效期 30 天',
    '工装费一次性计入项目开发费，不随数量摊销',
    '样件手工分度；首批必须上专用工装',
    '报价含 13% 增值税，运费按实际另计',
  ],
  risks: [
    '对接面孔距未书面确认前不排产',
    '8 孔均布首件需三坐标复检，可能追加 1~2 天',
    '若客户接受 6 孔方案，可省去工装（-￥12,000 / -15 天）',
  ],
  feedback:
    '客户您好：DN160 法兰盘方案已评估完成 —— 样件 5 件 10 天内交付，首批 200 件 30 天；因对接面为 8 孔均布，需新增一套专用分度工装（一次性 ￥12,000）。含税总价 ￥35,030，报价有效期 30 天。',
}
export const productBoms = {
  dwgBom: [
    { seq: '01', code: 'NY-FL-160', name: '法兰盘', spec: 'DN160', material: 'Q235B', qty: 1, unit: 4.6, total: 4.6 },
    { seq: '02', code: 'NY-CV-140', name: '端盖', spec: '⌀140', material: 'HT200', qty: 1, unit: 2.1, total: 2.1 },
    { seq: '03', code: 'NY-SE-160', name: '端面密封垫', spec: '⌀160 / ⌀80', material: '耐油橡胶', qty: 1, unit: 0.08, total: 0.08 },
    { seq: '04', code: 'NY-KY-014', name: '平键', spec: '14×9', material: '45 钢', qty: 1, unit: 0.12, total: 0.12 },
    { seq: '05', code: 'NY-FB-M12', name: '六角螺栓组', spec: 'M12×6', material: '8.8 级', qty: 8, unit: 0.04, total: 0.32 },
  ],
  sealBom: [
    { seq: '01', code: 'NY-OS-040', name: '骨架油封', spec: 'FB 40×62×8', material: 'NBR', qty: 1, unit: 0.06, total: 0.06 },
    { seq: '02', code: 'NY-SH-040', name: '油封座', spec: '⌀62 / ⌀40', material: 'HT200', qty: 1, unit: 0.42, total: 0.42 },
    { seq: '03', code: 'NY-SR-040', name: '弹簧挡圈', spec: '⌀40', material: '65Mn', qty: 1, unit: 0.02, total: 0.02 },
  ],
  bearingBom: [
    { seq: '01', code: 'NY-BS-120', name: '立式轴承座', spec: 'H1-120', material: 'HT200', qty: 1, unit: 7.4, total: 7.4 },
    { seq: '02', code: 'NY-BR-6212', name: '深沟球轴承', spec: '6212', material: 'GCr15', qty: 1, unit: 0.78, total: 0.78 },
    { seq: '03', code: 'NY-OC-120', name: '油杯', spec: 'M10×1', material: '黄铜', qty: 1, unit: 0.05, total: 0.05 },
    { seq: '04', code: 'NY-FB-M16', name: '地脚螺栓组', spec: 'M16×4', material: '8.8 级', qty: 4, unit: 0.09, total: 0.36 },
  ],
}
/** 第 01 区：销售端样例输入（口语化原始记录，可编辑） */

/** 头版数据栏 */
export const frontStats = [
	{
		value: "12,480",
		unit: "张",
		label: "在库设计图纸"
	},
	{
		value: "36",
		unit: "类",
		label: "样品解决方案"
	},
	{
		value: "99.2",
		unit: "%",
		label: "图纸版本一致率"
	},
	{
		value: "7",
		unit: "天",
		label: "样品平均交付"
	}
];

/** 页脚栏目 */
export const footerColumns = [
	{
		title: "公司",
		links: [
			"品牌故事",
			"市场与销售",
			"证书及荣誉"
		]
	},
	{
		title: "产品和解决方案",
		links: [
			"E-Mobility",
			"Powertrain & Chassis",
			"Vehicle Lifetime Solutions",
			"Bearings & Industrial Solutions",
			"品牌保护"
		]
	},
	{
		title: "企业新闻 & 媒体",
		links: ["媒体图书馆"]
	},
	{
		title: "联系我们",
		links: [
			"销售办事处",
			"工业经销商",
			"加入我们",
			"留言板",
			"Whistleblowing system"
		]
	}
];

export const footerLegal = [
	"隐私政策",
	"使用条款",
	"Cookie 设置",
	"供应商行为准则"
];

/* ===== 客制化目标匹配用到的零件目录（20 类 × 5 规格） ===== */
const REV_DATES = [
	"2022-03-11",
	"2023-05-08",
	"2024-06-19",
	"2025-08-02",
	"2026-02-14"
];
const REV_TAGS = ["V1", "V2", "V3", "V4", "V5"];

const SERIES = {
	housing: {
		dia: [
			80,
			100,
			120,
			150,
			180
		],
		len: [
			130,
			140,
			152,
			170,
			190
		],
		holes: [
			2,
			2,
			4,
			4,
			4
		],
		holeDia: [
			12,
			12,
			14,
			16,
			18
		],
		bore: [
			40,
			50,
			60,
			75,
			90
		],
		weight: [
			3.6,
			5.2,
			7.4,
			11.8,
			17.6
		]
	},
	bushing: {
		dia: [
			20,
			25,
			30,
			40,
			50
		],
		len: [
			30,
			40,
			45,
			60,
			70
		],
		holes: [
			0,
			0,
			0,
			0,
			0
		],
		holeDia: [
			0,
			0,
			0,
			0,
			0
		],
		bore: [
			14,
			18,
			22,
			30,
			38
		],
		weight: [
			.08,
			.14,
			.22,
			.48,
			.86
		]
	},
	gear: {
		dia: [
			30,
			48,
			70,
			96,
			144
		],
		len: [
			18,
			22,
			26,
			32,
			40
		],
		holes: [
			0,
			0,
			0,
			0,
			0
		],
		holeDia: [
			0,
			0,
			0,
			0,
			0
		],
		bore: [
			12,
			16,
			20,
			25,
			30
		],
		weight: [
			.12,
			.34,
			.82,
			1.9,
			5.6
		]
	},
	flange: {
		dia: [
			80,
			100,
			120,
			160,
			200
		],
		len: [
			16,
			20,
			24,
			32,
			40
		],
		holes: [
			4,
			4,
			6,
			8,
			8
		],
		holeDia: [
			9,
			11,
			11,
			13,
			18
		],
		bore: [
			20,
			25,
			30,
			40,
			50
		],
		weight: [
			.9,
			1.4,
			2.2,
			4.6,
			7.8
		]
	},
	cover: {
		dia: [
			72,
			90,
			110,
			140,
			170
		],
		len: [
			12,
			16,
			20,
			24,
			28
		],
		holes: [
			4,
			4,
			6,
			6,
			8
		],
		holeDia: [
			6,
			8,
			8,
			10,
			12
		],
		bore: [
			20,
			25,
			30,
			40,
			50
		],
		weight: [
			.4,
			.7,
			1.2,
			2.1,
			3.4
		]
	}
};

export const partSlots = [
	{
		key: "housing",
		name: "轴承座",
		icon: "building"
	},
	{
		key: "bushing",
		name: "轴套",
		icon: "minus"
	},
	{
		key: "gear",
		name: "齿轮",
		icon: "gear"
	},
	{
		key: "flange",
		name: "法兰盘",
		icon: "grid"
	},
	{
		key: "cover",
		name: "端盖",
		icon: "layers"
	}
];

const CAT_DEFS = [
	{
		key: "housing-vert",
		name: "立式轴承座",
		slot: "housing",
		icon: "building",
		code: "NY-BS",
		material: "铸铁 HT200",
		feature: "单螺栓固定",
		labels: [
			"H1-080",
			"H1-100",
			"H1-120",
			"H1-150",
			"H1-180"
		],
		extra: [
			"配 6208",
			"配 6210",
			"配 6212",
			"配 6215",
			"配 6218"
		]
	},
	{
		key: "housing-split",
		name: "剖分式轴承座",
		slot: "housing",
		icon: "layers",
		code: "NY-BP",
		material: "铸铁 HT250",
		feature: "剖分面精铣",
		labels: [
			"H2-100",
			"H2-120",
			"H2-150",
			"H2-180",
			"H2-200"
		],
		extra: [
			"配 22210",
			"配 22212",
			"配 22215",
			"配 22218",
			"配 22220"
		]
	},
	{
		key: "housing-flange",
		name: "法兰式轴承座",
		slot: "housing",
		icon: "grid",
		code: "NY-BF",
		material: "铸钢 ZG270",
		feature: "四孔法兰安装",
		labels: [
			"H3-060",
			"H3-080",
			"H3-100",
			"H3-120",
			"H3-140"
		],
		extra: [
			"配 6206",
			"配 6208",
			"配 6210",
			"配 6212",
			"配 6214"
		]
	},
	{
		key: "housing-pillow",
		name: "带座外球面轴承",
		slot: "housing",
		icon: "minus",
		code: "NY-UC",
		material: "铸铁 HT200",
		feature: "外球面自调心",
		labels: [
			"UCP-205",
			"UCP-206",
			"UCP-207",
			"UCP-208",
			"UCP-210"
		],
		extra: [
			"轴径 ⌀25",
			"轴径 ⌀30",
			"轴径 ⌀35",
			"轴径 ⌀40",
			"轴径 ⌀50"
		]
	},
	{
		key: "bush-bronze",
		name: "铜合金轴套",
		slot: "bushing",
		icon: "minus",
		code: "NY-BU",
		material: "锡青铜 ZQSn6-6-3",
		feature: "整体铸造",
		labels: [
			"⌀20×30",
			"⌀25×40",
			"⌀30×45",
			"⌀40×60",
			"⌀50×70"
		]
	},
	{
		key: "bush-bimetal",
		name: "双金属轴套",
		slot: "bushing",
		icon: "layers",
		code: "NY-BB",
		material: "钢背 + 铜合金",
		feature: "复合烧结",
		labels: [
			"⌀20×25",
			"⌀25×30",
			"⌀30×40",
			"⌀40×50",
			"⌀50×60"
		]
	},
	{
		key: "bush-oilless",
		name: "含油轴套",
		slot: "bushing",
		icon: "grid",
		code: "NY-BO",
		material: "粉末冶金",
		feature: "浸油率 ≥ 18%",
		labels: [
			"⌀20×20",
			"⌀25×25",
			"⌀30×30",
			"⌀40×40",
			"⌀50×50"
		]
	},
	{
		key: "bush-nylon",
		name: "尼龙轴套",
		slot: "bushing",
		icon: "minus",
		code: "NY-BN",
		material: "MC 尼龙",
		feature: "自润滑 · 耐腐蚀",
		labels: [
			"⌀20×35",
			"⌀25×45",
			"⌀30×50",
			"⌀40×65",
			"⌀50×75"
		]
	},
	{
		key: "gear-spur",
		name: "直齿圆柱齿轮",
		slot: "gear",
		icon: "gear",
		code: "NY-GS",
		material: "20CrMnTi",
		feature: "磨齿 6 级",
		labels: [
			"m1.5 z20",
			"m2 z24",
			"m2.5 z28",
			"m3 z32",
			"m4 z36"
		]
	},
	{
		key: "gear-helical",
		name: "斜齿圆柱齿轮",
		slot: "gear",
		icon: "gear",
		code: "NY-GH",
		material: "20CrMnTi",
		feature: "磨齿 6 级 · 螺旋角 12°",
		labels: [
			"m1.5 z22",
			"m2 z26",
			"m2.5 z30",
			"m3 z34",
			"m4 z38"
		]
	},
	{
		key: "gear-internal",
		name: "内齿圈",
		slot: "gear",
		icon: "gear",
		code: "NY-GI",
		material: "42CrMo",
		feature: "调质 + 氮化",
		labels: [
			"m2 z40",
			"m2.5 z44",
			"m3 z48",
			"m3.5 z52",
			"m4 z56"
		]
	},
	{
		key: "gear-sprocket",
		name: "链轮",
		slot: "gear",
		icon: "gear",
		code: "NY-SP",
		material: "45 钢",
		feature: "齿面高频淬火",
		labels: [
			"08B z17",
			"08B z21",
			"10A z19",
			"12A z21",
			"16A z19"
		]
	},
	{
		key: "flange-flat",
		name: "平焊法兰",
		slot: "flange",
		icon: "grid",
		code: "NY-FF",
		material: "Q235B",
		feature: "角焊缝连接",
		variant: "A 型",
		labels: [
			"DN80",
			"DN100",
			"DN120",
			"DN160",
			"DN200"
		]
	},
	{
		key: "flange-weld",
		name: "对焊法兰",
		slot: "flange",
		icon: "grid",
		code: "NY-FW",
		material: "16Mn",
		feature: "对接全焊透",
		variant: "B 型",
		labels: [
			"DN80",
			"DN100",
			"DN120",
			"DN160",
			"DN200"
		]
	},
	{
		key: "flange-neck",
		name: "带颈法兰",
		slot: "flange",
		icon: "grid",
		code: "NY-FN",
		material: "20 钢",
		feature: "带颈加强",
		variant: "C 型",
		labels: [
			"DN80",
			"DN100",
			"DN120",
			"DN160",
			"DN200"
		]
	},
	{
		key: "flange-thread",
		name: "螺纹法兰",
		slot: "flange",
		icon: "grid",
		code: "NY-FT",
		material: "35CrMo",
		feature: "螺纹密封",
		variant: "D 型",
		labels: [
			"DN80",
			"DN100",
			"DN120",
			"DN160",
			"DN200"
		]
	},
	{
		key: "cover-flat",
		name: "平端盖",
		slot: "cover",
		icon: "layers",
		code: "NY-CF",
		material: "HT150",
		feature: "防尘平盖",
		variant: "平盖",
		labels: [
			"⌀72",
			"⌀90",
			"⌀110",
			"⌀140",
			"⌀170"
		]
	},
	{
		key: "cover-boss",
		name: "凸缘端盖",
		slot: "cover",
		icon: "layers",
		code: "NY-CB",
		material: "HT200",
		feature: "带凸台定位",
		variant: "凸盖",
		labels: [
			"⌀72",
			"⌀90",
			"⌀110",
			"⌀140",
			"⌀170"
		]
	},
	{
		key: "cover-seal",
		name: "密封端盖",
		slot: "cover",
		icon: "layers",
		code: "NY-CS",
		material: "HT200",
		feature: "含骨架油封位",
		variant: "密封盖",
		labels: [
			"⌀72",
			"⌀90",
			"⌀110",
			"⌀140",
			"⌀170"
		]
	},
	{
		key: "cover-split",
		name: "分体端盖",
		slot: "cover",
		icon: "layers",
		code: "NY-CP",
		material: "铝合金 6061",
		feature: "两半对合",
		variant: "分体盖",
		labels: [
			"⌀72",
			"⌀90",
			"⌀110",
			"⌀140",
			"⌀170"
		]
	}
];

const pad3 = (n) => String(n).padStart(3, "0");

function buildEntries(def) {
	const s = SERIES[def.slot];
	return def.labels.map((label, i) => {
		const dia = s.dia[i];
		const len = s.len[i];
		const holes = s.holes[i];
		let spec = "";
		let note = "";
		if (def.slot === "housing") {
			spec = `中心高 ${dia} · ${def.extra?.[i] ?? ""}`.trim();
			note = `${def.material}，${def.feature}`;
		} else if (def.slot === "bushing") {
			spec = `内 ⌀${s.bore[i]} · L${len}`;
			note = `${def.material}，${def.feature}`;
		} else if (def.slot === "gear") {
			spec = `⌀${dia} · 齿宽 ${len}`;
			note = `${def.material}，${def.feature}`;
		} else if (def.slot === "flange") {
			spec = `${def.variant} · 厚 ${len}`;
			note = `配 ⌀${s.bore[i]} 轴，${holes}×⌀${s.holeDia[i]} 通孔`;
		} else {
			spec = `${def.variant} · 厚 ${len}`;
			note = `${def.material}，${def.feature}`;
		}
		return {
			code: `${def.code}-${pad3(dia)}`,
			label,
			spec,
			dia,
			len,
			holes,
			holeDia: s.holeDia[i],
			bore: s.bore[i],
			weight: s.weight[i],
			rev: REV_TAGS[i],
			date: REV_DATES[i],
			note
		};
	});
}

export const partCategories = CAT_DEFS.map((def) => ({
	...def,
	field: def.slot === "housing" ? "中心高" : def.slot === "gear" ? "分度圆" : "外径",
	entries: buildEntries(def)
}));

export const defaultCatBySlot = partSlots.reduce((acc, s) => {
	const first = partCategories.find((c) => c.slot === s.key);
	if (first) acc[s.key] = first.key;
	return acc;
}, {});

export const assemblyOrder = partSlots.map((s) => s.key)