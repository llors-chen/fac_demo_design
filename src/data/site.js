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

/** 头版导读：三段式主体中的三份图纸 */
export const sheetIndex = [
  {
    no: '01',
    anchor: 'sheet-01',
    title: '行星齿轮减速箱 · 总装图',
    meta: 'NY-JS-2026-001 / 1:2',
    note: '轮廓、中心线、剖面与明细逐层生成',
  },
  {
    no: '02',
    anchor: 'sheet-02',
    title: '传动轴 · 零件图',
    meta: 'NY-ZC-2026-014 / 1:1.5',
    note: '尺寸链、粗糙度与形位公差依次落笔',
  },
  {
    no: '03',
    anchor: 'sheet-03',
    title: '法兰盘装配图 · DWG 在线浏览',
    meta: 'NY-FL-2026-008 / A2',
    note: '可缩放、可图层控制，右侧接入图纸助手',
  },
  {
    no: '04',
    anchor: 'compare',
    title: '需求分析 · 历史可能性展示 · 组装交互',
    meta: '5 类 × 5 规格',
    note: '逐件装入动画 + 与基准版本差异对比',
  },
]

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

/** 图纸 01 明细表（悬停可联动高亮图面零件） */
export const gearboxBom = [
  { no: '01', name: '壳体', material: 'HT250', qty: 1, part: '01' },
  { no: '02', name: '内齿圈', material: '42CrMo', qty: 1, part: '02' },
  { no: '03', name: '行星轮', material: '20CrMnTi', qty: 3, part: '03' },
  { no: '04', name: '太阳轮', material: '20CrMnTi', qty: 1, part: '04' },
  { no: '05', name: '输出轴', material: '40Cr', qty: 1, part: '05' },
]

/** 图纸 02 技术要求 */
export const shaftNotes = [
  '1. 未注圆角 R2，未注倒角 C1.5。',
  '2. 调质处理 HB220~250，硬度均匀性 ≤ 20HB。',
  '3. 键槽 14×9，按 GB/T 1095 加工，两侧对称度 0.03。',
  '4. 轴承位 ⌀56 与 ⌀60 同轴度 ⌀0.02 A，Ra1.6。',
  '5. 螺纹 M48×2 按 GB/T 196 加工，去毛刺锐边。',
]

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
  kicker: '设计成果 · 第 04 区 · 需求分析',
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