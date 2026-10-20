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

/** 图纸助手（暂不做功能，仅界面） */
export const chatSuggestions = [
  '这张图的材料与热处理是什么？',
  '帮我核对 ⌀18 孔的位置公差',
  '导出这张图的 BOM 明细',
  '对比 V2 与 V3 的差异',
]

export const chatMessages = [
  {
    role: 'bot',
    time: '09:24',
    text: '你好，我是图纸助手。已载入当前窗口的 DWG（法兰盘装配图 / V3）。可以问我尺寸、公差、材料、版本差异或明细表。',
  },
  {
    role: 'user',
    time: '09:25',
    text: '这版相比 V2 改了什么？',
  },
  {
    role: 'bot',
    time: '09:25',
    text: '检测到 3 处修订：① 中心孔由 ⌀76 改为 ⌀80；② 均布孔由 6×⌀16 改为 8×⌀18，分度圆 ⌀230；③ 增加密封槽 2×1.5。修订记录见标题栏 R3。',
    points: ['中心孔 ⌀76 → ⌀80', '均布孔 6×⌀16 → 8×⌀18', '新增密封槽 2×1.5'],
  },
]
