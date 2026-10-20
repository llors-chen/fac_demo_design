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
    title: '销售端 · 客需需求整理',
    meta: '需求单 REQ-20261020-007',
    status: '已完成',
    note: '客户口语记录 + 5 个客户附件 → 结构化书面需求（产品 / 规格 / 数量 / 交期 / 工况 / 验收 / 风险）',
    times: [
      { label: '收到客户微信记录与附件', time: '09:12' },
      { label: '整理为书面需求单', time: '09:26' },
    ],
  },
  {
    no: '02',
    anchor: 'dwg-chat',
    title: '历史图纸检索 · DWG 在线浏览与 BOM',
    meta: '命中 3 张 · NY-FL-2026-008',
    status: '已上载 M3',
    note: '基于销售信息检索历史图纸 → 在线看图（缩放 / 平移 / 图层 / 测量）→ 提取 BOM → 上载 M3',
    times: [
      { label: '提交检索并打开图纸', time: '10:52' },
      { label: 'BOM 上载 M3', time: '11:03' },
    ],
  },
  {
    no: '03',
    anchor: 'compare',
    title: '需求分析 · 历史可能性展示 · 组装交互',
    meta: '20 类 / 100 个历史规格',
    status: '进行中',
    note: '对话式需求分析 → 调用工具：历史规格对比 + 拖动组装',
    times: [
      { label: '检索历史规格', time: '11:10' },
      { label: '组装方案比对', time: '11:32' },
    ],
  },
]

/** 第 01 区：客户附件信息（销售从客户处获得的 PDF / 图纸 / 图片等） */
export const attachments = [
  {
    id: 'att-1',
    name: '对接面尺寸图.pdf',
    kind: 'pdf',
    size: '3.4 MB',
    from: '王工 · 微信',
    state: '已解析',
    note: '1 页 · 8 处标注',
    key: '对接面 8×⌀13 通孔均布',
  },
  {
    id: 'att-2',
    name: '原法兰盘旧图.dwg',
    kind: 'dwg',
    size: '2.1 MB',
    from: '客户资料库',
    state: '待解析',
    note: 'A2 · V2',
    key: '旧版结构参考',
  },
  {
    id: 'att-3',
    name: '客户邮件截图.png',
    kind: 'img',
    size: '1.2 MB',
    from: '王工 · 微信',
    state: '已识别',
    note: '1920 × 1080',
    key: '交期与数量口径',
  },
  {
    id: 'att-4',
    name: '工况说明.docx',
    kind: 'doc',
    size: '240 KB',
    from: '王工 · 邮件',
    state: '已解析',
    note: '2 页',
    key: '80 ℃ / 3000 r/min / 脂润滑',
  },
  {
    id: 'att-5',
    name: '渗油部位照片.jpg',
    kind: 'img',
    size: '860 KB',
    from: '王工 · 微信',
    state: '已识别',
    note: '4032 × 3024',
    key: '密封面失效位置',
  },
]

/** 第 01 区：从附件中提取到的要点 */
export const attachmentPoints = [
  '对接面 8×⌀13 通孔均布（来自 对接面尺寸图.pdf）',
  '连续工作 80 ℃、转速 ≤ 3000 r/min、脂润滑（来自 工况说明.docx）',
  '渗油发生在原法兰密封面外侧（来自 渗油部位照片.jpg）',
]

/** 第 02 区：历史图纸检索（chatbot 外壳 + 工具） */
export const drawingChat = {
  name: '图纸检索助手',
  role: 'Drawing Finder',
  greeting:
    '你好，我可以基于销售整理出的需求（含客户附件信息）检索历史图纸库，并把命中的 DWG 图面与 BOM 展开给你看。',
  preInput: '基于销售的信息检索历史图纸并展示 dwg 信息',
  toolId: 'history_drawing_search',
  toolName: '历史图纸检索 · DWG 在线浏览与 BOM',
  reply: (q) =>
    `已按「${q}」检索历史图纸库：命中 3 张相似图纸（最高相似度 96%），已打开最匹配的一张，下方可直接看图、提取 BOM 并上载至 M3。`,
  suggestions: [
    '基于销售的信息检索历史图纸并展示 dwg 信息',
    '找 DN160 法兰盘的历史版本，看密封面改过没有',
    '有没有配 ⌀40 轴、8 孔均布的老图可以直接借用',
  ],
}

/** 第 02 区：检索命中的历史图纸 */
export const drawingHits = [
  {
    id: 'doc-a',
    file: '法兰盘装配图.dwg',
    code: 'NY-FL-2026-008',
    sheet: 'A2 · 1:2',
    rev: 'V3',
    score: 96,
    date: '2026-02-20',
    why: 'DN160 / ⌀40 轴 / 8×⌀13 均布 全部匹配',
    suffix: '021',
  },
  {
    id: 'doc-b',
    file: '法兰盘装配图-旧.dwg',
    code: 'NY-FL-2024-031',
    sheet: 'A2 · 1:2',
    rev: 'V1',
    score: 88,
    date: '2024-08-14',
    why: 'DN160 匹配，孔数为 6×⌀13（需改制）',
    suffix: '018',
  },
  {
    id: 'doc-c',
    file: '端盖装配图.dwg',
    code: 'NY-CV-2025-012',
    sheet: 'A2 · 1:1',
    rev: 'V2',
    score: 74,
    date: '2025-05-06',
    why: '同族端盖结构，可参考密封槽形式',
    suffix: '012',
  },
]
/** 第 01 区：销售端样例输入（口语化原始记录，可编辑） */
export const intakeSample = [
  '【平湖 · 新能源客户 王工 · 微信】09:12',
  '他们那台电驱总成要换法兰盘，原来的老是渗油。要 DN160 那种，配 ⌀40 的轴，',
  '孔他们那边是 8 个孔均布的，对接面定死了不能改。先要 5 件样件，7 天能不能给？',
  '后面批量大概 200 件，交期 25 天左右。工况是连续跑，温度 80 度上下，转速 3000 转以内，',
  '脂润滑。要材质证明，外观不能有毛刺，尺寸按国标来。',
].join('\n')

/** 第 01 区：整理过程（写死的步骤） */
export const intakeSteps = [
  '识别客户与项目',
  '提取产品与规格',
  '补全工况与验收要求',
  '生成书面需求单',
]

/** 第 01 区：书面需求默认字段（未从文本中提取到时使用） */
export const intakeDefaults = {
  no: 'REQ-20261020-007',
  customer: '平湖 · 新能源客户（王工）',
  project: 'E-Mobility 电驱总成 · 法兰盘换型',
  product: '法兰盘 DN160（平焊型）',
  spec: '配 ⌀40 轴，8×⌀13 通孔均布；对接面尺寸以客户图纸为准',
  qty: '样件 5 件；首批 200 件',
  delivery: '样件 7 天；首批 25 天',
  condition: '连续工作 80 ℃，转速 ≤ 3000 r/min，脂润滑',
  acceptance: '尺寸按 GB/T 1804-m，外观无毛刺，附材质证明',
  risk: '对接面孔距需客户确认；8 孔均布需专用分度工装',
}


/** 头版数据栏 */
export const frontStats = [
  { value: '12,480', unit: '张', label: '在库设计图纸' },
  { value: '36', unit: '类', label: '样品解决方案' },
  { value: '99.2', unit: '%', label: '图纸版本一致率' },
  { value: '7', unit: '天', label: '样品平均交付' },
]

/** 页脚：按参考图信息组织，全部为按钮 */
export const footerColumns = [
  {
    title: '公司',
    links: ['品牌故事', '市场与销售', '证书及荣誉'],
  },
  {
    title: '产品和解决方案',
    links: [
      'E-Mobility',
      'Powertrain & Chassis',
      'Vehicle Lifetime Solutions',
      'Bearings & Industrial Solutions',
      '品牌保护',
    ],
  },
  {
    title: '企业新闻 & 媒体',
    links: ['媒体图书馆'],
  },
  {
    title: '联系我们',
    links: ['销售办事处', '工业经销商', '加入我们', '留言板', 'Whistleblowing system'],
  },
]

export const footerLegal = ['隐私政策', '使用条款', 'Cookie 设置', '供应商行为准则']



/**
 * 零件对比数据：20 类零件（类型可重复，用名称区分）× 每类 5 个历史规格
 * 每类都挂在 5 个「装配位」之一上：housing / bushing / gear / flange / cover
 * 左侧组装台按装配位取当前选中的类别与规格来出图。
 */

/** 历史修订时间线（V1 → V5） */
const REV_DATES = ['2022-03-11', '2023-05-08', '2024-06-19', '2025-08-02', '2026-02-14']
const REV_TAGS = ['V1', 'V2', 'V3', 'V4', 'V5']

/** 尺寸系列：同类不同结构复用，保证图面比例协调 */
const SERIES = {
  housing: {
    dia: [80, 100, 120, 150, 180],
    len: [130, 140, 152, 170, 190],
    holes: [2, 2, 4, 4, 4],
    holeDia: [12, 12, 14, 16, 18],
    bore: [40, 50, 60, 75, 90],
    weight: [3.6, 5.2, 7.4, 11.8, 17.6],
  },
  bushing: {
    dia: [20, 25, 30, 40, 50],
    len: [30, 40, 45, 60, 70],
    holes: [0, 0, 0, 0, 0],
    holeDia: [0, 0, 0, 0, 0],
    bore: [14, 18, 22, 30, 38],
    weight: [0.08, 0.14, 0.22, 0.48, 0.86],
  },
  gear: {
    dia: [30, 48, 70, 96, 144],
    len: [18, 22, 26, 32, 40],
    holes: [0, 0, 0, 0, 0],
    holeDia: [0, 0, 0, 0, 0],
    bore: [12, 16, 20, 25, 30],
    weight: [0.12, 0.34, 0.82, 1.9, 5.6],
  },
  flange: {
    dia: [80, 100, 120, 160, 200],
    len: [16, 20, 24, 32, 40],
    holes: [4, 4, 6, 8, 8],
    holeDia: [9, 11, 11, 13, 18],
    bore: [20, 25, 30, 40, 50],
    weight: [0.9, 1.4, 2.2, 4.6, 7.8],
  },
  cover: {
    dia: [72, 90, 110, 140, 170],
    len: [12, 16, 20, 24, 28],
    holes: [4, 4, 6, 6, 8],
    holeDia: [6, 8, 8, 10, 12],
    bore: [20, 25, 30, 40, 50],
    weight: [0.4, 0.7, 1.2, 2.1, 3.4],
  },
}

/** 装配位（左侧组装台的 5 个零件 + 固定基准轴） */
export const partSlots = [
  { key: 'housing', name: '轴承座', icon: 'building' },
  { key: 'bushing', name: '轴套', icon: 'minus' },
  { key: 'gear', name: '齿轮', icon: 'gear' },
  { key: 'flange', name: '法兰盘', icon: 'grid' },
  { key: 'cover', name: '端盖', icon: 'layers' },
]

/** 20 类零件定义（labels 为 5 个历史规格名称，extra 为可选补充说明） */
const CAT_DEFS = [
  /* —— 轴承座 —— */
  { key: 'housing-vert', name: '立式轴承座', slot: 'housing', icon: 'building', code: 'NY-BS', material: '铸铁 HT200', feature: '单螺栓固定', labels: ['H1-080', 'H1-100', 'H1-120', 'H1-150', 'H1-180'], extra: ['配 6208', '配 6210', '配 6212', '配 6215', '配 6218'] },
  { key: 'housing-split', name: '剖分式轴承座', slot: 'housing', icon: 'layers', code: 'NY-BP', material: '铸铁 HT250', feature: '剖分面精铣', labels: ['H2-100', 'H2-120', 'H2-150', 'H2-180', 'H2-200'], extra: ['配 22210', '配 22212', '配 22215', '配 22218', '配 22220'] },
  { key: 'housing-flange', name: '法兰式轴承座', slot: 'housing', icon: 'grid', code: 'NY-BF', material: '铸钢 ZG270', feature: '四孔法兰安装', labels: ['H3-060', 'H3-080', 'H3-100', 'H3-120', 'H3-140'], extra: ['配 6206', '配 6208', '配 6210', '配 6212', '配 6214'] },
  { key: 'housing-pillow', name: '带座外球面轴承', slot: 'housing', icon: 'minus', code: 'NY-UC', material: '铸铁 HT200', feature: '外球面自调心', labels: ['UCP-205', 'UCP-206', 'UCP-207', 'UCP-208', 'UCP-210'], extra: ['轴径 ⌀25', '轴径 ⌀30', '轴径 ⌀35', '轴径 ⌀40', '轴径 ⌀50'] },
  /* —— 轴套 —— */
  { key: 'bush-bronze', name: '铜合金轴套', slot: 'bushing', icon: 'minus', code: 'NY-BU', material: '锡青铜 ZQSn6-6-3', feature: '整体铸造', labels: ['⌀20×30', '⌀25×40', '⌀30×45', '⌀40×60', '⌀50×70'] },
  { key: 'bush-bimetal', name: '双金属轴套', slot: 'bushing', icon: 'layers', code: 'NY-BB', material: '钢背 + 铜合金', feature: '复合烧结', labels: ['⌀20×25', '⌀25×30', '⌀30×40', '⌀40×50', '⌀50×60'] },
  { key: 'bush-oilless', name: '含油轴套', slot: 'bushing', icon: 'grid', code: 'NY-BO', material: '粉末冶金', feature: '浸油率 ≥ 18%', labels: ['⌀20×20', '⌀25×25', '⌀30×30', '⌀40×40', '⌀50×50'] },
  { key: 'bush-nylon', name: '尼龙轴套', slot: 'bushing', icon: 'minus', code: 'NY-BN', material: 'MC 尼龙', feature: '自润滑 · 耐腐蚀', labels: ['⌀20×35', '⌀25×45', '⌀30×50', '⌀40×65', '⌀50×75'] },
  /* —— 齿轮 —— */
  { key: 'gear-spur', name: '直齿圆柱齿轮', slot: 'gear', icon: 'gear', code: 'NY-GS', material: '20CrMnTi', feature: '磨齿 6 级', labels: ['m1.5 z20', 'm2 z24', 'm2.5 z28', 'm3 z32', 'm4 z36'] },
  { key: 'gear-helical', name: '斜齿圆柱齿轮', slot: 'gear', icon: 'gear', code: 'NY-GH', material: '20CrMnTi', feature: '磨齿 6 级 · 螺旋角 12°', labels: ['m1.5 z22', 'm2 z26', 'm2.5 z30', 'm3 z34', 'm4 z38'] },
  { key: 'gear-internal', name: '内齿圈', slot: 'gear', icon: 'gear', code: 'NY-GI', material: '42CrMo', feature: '调质 + 氮化', labels: ['m2 z40', 'm2.5 z44', 'm3 z48', 'm3.5 z52', 'm4 z56'] },
  { key: 'gear-sprocket', name: '链轮', slot: 'gear', icon: 'gear', code: 'NY-SP', material: '45 钢', feature: '齿面高频淬火', labels: ['08B z17', '08B z21', '10A z19', '12A z21', '16A z19'] },
  /* —— 法兰盘 —— */
  { key: 'flange-flat', name: '平焊法兰', slot: 'flange', icon: 'grid', code: 'NY-FF', material: 'Q235B', feature: '角焊缝连接', variant: 'A 型', labels: ['DN80', 'DN100', 'DN120', 'DN160', 'DN200'] },
  { key: 'flange-weld', name: '对焊法兰', slot: 'flange', icon: 'grid', code: 'NY-FW', material: '16Mn', feature: '对接全焊透', variant: 'B 型', labels: ['DN80', 'DN100', 'DN120', 'DN160', 'DN200'] },
  { key: 'flange-neck', name: '带颈法兰', slot: 'flange', icon: 'grid', code: 'NY-FN', material: '20 钢', feature: '带颈加强', variant: 'C 型', labels: ['DN80', 'DN100', 'DN120', 'DN160', 'DN200'] },
  { key: 'flange-thread', name: '螺纹法兰', slot: 'flange', icon: 'grid', code: 'NY-FT', material: '35CrMo', feature: '螺纹密封', variant: 'D 型', labels: ['DN80', 'DN100', 'DN120', 'DN160', 'DN200'] },
  /* —— 端盖 —— */
  { key: 'cover-flat', name: '平端盖', slot: 'cover', icon: 'layers', code: 'NY-CF', material: 'HT150', feature: '防尘平盖', variant: '平盖', labels: ['⌀72', '⌀90', '⌀110', '⌀140', '⌀170'] },
  { key: 'cover-boss', name: '凸缘端盖', slot: 'cover', icon: 'layers', code: 'NY-CB', material: 'HT200', feature: '带凸台定位', variant: '凸盖', labels: ['⌀72', '⌀90', '⌀110', '⌀140', '⌀170'] },
  { key: 'cover-seal', name: '密封端盖', slot: 'cover', icon: 'layers', code: 'NY-CS', material: 'HT200', feature: '含骨架油封位', variant: '密封盖', labels: ['⌀72', '⌀90', '⌀110', '⌀140', '⌀170'] },
  { key: 'cover-split', name: '分体端盖', slot: 'cover', icon: 'layers', code: 'NY-CP', material: '铝合金 6061', feature: '两半对合', variant: '分体盖', labels: ['⌀72', '⌀90', '⌀110', '⌀140', '⌀170'] },
]

const pad3 = (n) => String(n).padStart(3, '0')

/** 由类别定义生成 5 条历史规格 */
function buildEntries(def) {
  const s = SERIES[def.slot]
  return def.labels.map((label, i) => {
    const dia = s.dia[i]
    const len = s.len[i]
    const holes = s.holes[i]
    let spec = ''
    let note = ''
    if (def.slot === 'housing') {
      spec = `中心高 ${dia} · ${def.extra?.[i] ?? ''}`.trim()
      note = `${def.material}，${def.feature}`
    } else if (def.slot === 'bushing') {
      spec = `内 ⌀${s.bore[i]} · L${len}`
      note = `${def.material}，${def.feature}`
    } else if (def.slot === 'gear') {
      spec = `⌀${dia} · 齿宽 ${len}`
      note = `${def.material}，${def.feature}`
    } else if (def.slot === 'flange') {
      spec = `${def.variant} · 厚 ${len}`
      note = `配 ⌀${s.bore[i]} 轴，${holes}×⌀${s.holeDia[i]} 通孔`
    } else {
      spec = `${def.variant} · 厚 ${len}`
      note = `${def.material}，${def.feature}`
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
      note,
    }
  })
}

export const partCategories = CAT_DEFS.map((def) => ({
  ...def,
  field: def.slot === 'housing' ? '中心高' : def.slot === 'gear' ? '分度圆' : '外径',
  entries: buildEntries(def),
}))

/** 按装配位取默认类别（每类第一个） */
export const defaultCatBySlot = partSlots.reduce((acc, s) => {
  const first = partCategories.find((c) => c.slot === s.key)
  if (first) acc[s.key] = first.key
  return acc
}, {})
/** 装配顺序（左侧动画按此顺序逐件装入） */
export const assemblyOrder = partSlots.map((s) => s.key)

/** 零件对比区文案 */
export const compareIntro = {
  kicker: '研发端 · 第 03 区 · 需求分析',
  title: '需求分析 · 历史可能性展示 · 组装交互',
  note: '在下方对话里描述需求（演示版本写死：无论输入什么需求，都会调用同一个工具），助手会把「历史可能性展示 · 组装交互」作为工具在对话中展开。',
}

/** 需求分析助手：开场白与写死的工具回复 */
export const analystChat = {
  name: '需求分析助手',
  role: 'Requirement Analyst',
  greeting:
    '你好，我是需求分析助手。描述你的需求（零件类型 / 尺寸 / 工况 / 交期），我会检索历史图纸库，并把可用的方案以工具形式展开。',
  toolName: '历史可能性展示 · 组装交互',
  toolId: 'history_part_search',
  seedQuestion: '需要一套 ⌀160 的传动端盖组件，配 ⌀40 轴，8 孔均布，希望有历史版本可以对比',
  reply: (q) =>
    `已按「${q}」检索历史图纸库：命中 20 类零件、100 个历史规格，工具「历史可能性展示 · 组装交互」已在下方展开——左侧可拖动零件完成组装、滚轮缩放，右侧可切换类别 / 规格 / 对比 / 上传。`,
  suggestions: [
    '需要 ⌀160 法兰盘，配 ⌀40 轴，8 孔均布',
    '找 H1-150 轴承座的历史版本，对比重量变化',
    '轴套想从铜合金换成双金属，有历史规格吗',
  ],
}

/** DWG 在线浏览（法兰盘装配图）从图面明细栏提取的 BOM */
export const dwgBom = [
  { seq: '01', code: 'NY-FL-160', name: '法兰盘', spec: 'DN160', material: 'Q235B', qty: 1, unit: 4.6, total: 4.6 },
  { seq: '02', code: 'NY-CV-140', name: '端盖', spec: '⌀140', material: 'HT200', qty: 1, unit: 2.1, total: 2.1 },
  { seq: '03', code: 'NY-BS-120', name: '轴承座', spec: 'H1-120', material: 'HT200', qty: 1, unit: 7.4, total: 7.4 },
  { seq: '04', code: 'NY-SE-080', name: '密封垫', spec: '⌀80', material: '耐油橡胶', qty: 2, unit: 0.06, total: 0.12 },
  { seq: '05', code: 'NY-KY-014', name: '平键', spec: '14×9', material: '45 钢', qty: 1, unit: 0.12, total: 0.12 },
  { seq: '06', code: 'NY-FB-M12', name: '六角螺栓组', spec: 'M12×6', material: '8.8 级', qty: 8, unit: 0.04, total: 0.32 },
]