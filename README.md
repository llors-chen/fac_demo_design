# 精工图谱 · 平湖工厂 · 工业制造官网首页

Vue 3 + Vite 实现的工业制造企业首页，主题为**设计成果图纸在线浏览**。
整体为报纸（印刷品）质感，但色调偏白偏淡：近白纸底 + 墨黑 + 淡绿交互色；
边框语言为**左下 + 右上两个角标边框 + 圆角**，线性图标，宋体排版。

## 快速开始

```bash
npm install          # 安装依赖
npm run dev          # 开发预览（默认 http://127.0.0.1:5273）
npm run build        # 生产构建 → dist/
npm run preview      # 预览构建产物
npm run smoke        # jsdom 冒烟测试（挂载 + 描线动画 + 滚动驱动 + 零件对比区）
npm run check:static # 静态产物自检
```

> Windows 沙箱环境提示：Vite 在受限沙箱下会因 `exec("net use")` 的子进程管道报 `EPERM`，
> 需在放宽权限的终端中运行 `npm run dev` / `npm run build`。

## 页面结构（三段式）

| 段 | 组件 | 说明 |
| --- | --- | --- |
| ① 顶部 | `SiteHeader.vue` | 报头（平湖工厂 / 刊期 / 检索 / 登录）+ 吸顶导航条：工厂信息 / 品牌介绍 / 样品解决方案 / 职业 / 公司 + 企业新闻 & 媒体 / 联系我们。**全部为按钮，不做跳转**，点击仅切换高亮 |
| ② 主体 | `LeadStory.vue` | 头版导语、本期图纸目录（4 条）、数据栏、厂区快讯滚动条 |
| ② 主体 | `DrawingSheet.vue` ×2 | 图纸 01 行星齿轮减速箱总装图、图纸 02 传动轴零件图：**定死的滚动描线动画**（钉住 + 进度驱动） |
| ② 主体 | `DwgViewer.vue` + `ChatPanel.vue` | 图纸 03：DWG 在线浏览窗口（3）: 图纸助手（1） |
| ② 主体 | `PartCompare.vue` | 图纸 04：历史零件对比 + 组装交互（3）: 历史零件选择（1） |
| ③ 页脚 | `SiteFooter.vue` | 公司 / 产品和解决方案 / 企业新闻 & 媒体 / 联系我们 四栏 + 订阅条 + 法务条，**全部为按钮** |

## 滚动交互（图纸 01 / 02）

```
<section class="pin-section">        // 高 210vh
  <div class="pin-body">             // position: sticky
    <slot />                         // 图纸 SVG
```

- `useScrollProgress`：把「钉住元素顶部到达导航条下沿 → 容器滚完」映射为 0~1 的进度。
- `useDrawingAnimation`（anime.js v4）：图纸内元素通过属性声明参与动画
  - `data-draw data-stage="1..5"` → 描线生长（`createDrawable` + `draw`）
  - `data-fade data-stage="1..5"` → 淡入（中心线等虚线，避免与 `stroke-dasharray` 冲突）
  - 阶段窗口：`1 图框基准 → 2 轮廓 → 3 剖面线 → 4 尺寸 → 5 标注与标题栏`
- 滚动进度直接 `timeline.progress = p`（含缓动），实现「滚到哪、画到哪」；
  右上角「自动演示」可让时间轴自行播放一遍。
- 窄屏（≤900px）自动取消钉住，进入视口后播放一次；`prefers-reduced-motion` 下直接展示完整图纸。
- 图纸 01 右侧明细表 hover 会高亮图面中对应零件（`highlight` 作用域插槽透传）。

## DWG 在线浏览窗口

内置一张示例图纸（法兰盘装配图，A2），支持：

- 滚轮缩放（以光标为锚点）、拖拽平移、适合窗口
- 图层开关：轮廓线 / 中心线 / 尺寸标注 / 剖面线 / 图框与标题栏
- 两点测量（按 1 用户单位 ≈ 0.6 mm 换算）、全屏、状态栏坐标与缩放比例
- 加载态、文件标签、修订信息

**接入真实 DWG**：给组件传 `embed-url`，窗口会改为 iframe 嵌入，例如内网转换服务或
ODA / Autodesk Platform Services 的在线视图地址：

```vue
<!-- src/App.vue -->
<DwgViewer file-name="法兰盘装配图.dwg" embed-url="https://viewer.example.com/dwg/NY-FL-2026-008" />
```

## 图纸助手（右侧，比例 3 : 1）

`ChatPanel.vue` 仅为界面：预设问答、快捷提问、输入框与发送按钮。
点击发送只弹出「对话功能开发中」提示，不产生真实问答（按需求暂不实现功能）。
比例由 `App.vue` 中的 `.dwg-row { grid-template-columns: 3fr 1fr }` 控制，
窄屏下改为上下堆叠。

## 目录结构

```
src/
├─ App.vue                     # 三段式装配
├─ main.js                     # 入口 + v-reveal 指令注册
├─ styles/base.css             # 设计令牌（纸/墨/淡绿）、纸纹、按钮、排版工具类
├─ data/site.js                # 导航、页脚、明细表、技术要求、对话文案
├─ directives/reveal.js        # 进入视口浮现
├─ composables/
│  ├─ useScrollProgress.js     # 滚动进度 / 页面阅读进度
│  └─ useDrawingAnimation.js   # anime.js 时间轴 + 阶段窗口 + 滚动驱动
├─ utils/hatch.js              # 工程图 45° 剖面线生成器
└─ components/
   ├─ SiteHeader.vue  LeadStory.vue  DrawingSheet.vue
   ├─ DwgViewer.vue   ChatPanel.vue  SiteFooter.vue  AppIcon.vue
   └─ drawings/
      ├─ DrawingGearbox.vue    # 图纸 01 总装图
      └─ DrawingShaft.vue      # 图纸 02 零件图
```

图标全部为内置线性 SVG（`AppIcon.vue`），不依赖图标库；字体使用系统宋体/等宽字体栈，
无外网字体请求。

## 部署（纯静态，无需后端）

产物只有 3 个文件，`base: './'` 使用相对路径，放根目录或任意子目录都能跑：

```
dist/
├─ index.html            1.2 KB
└─ assets/
   ├─ index-*.js       183 KB（gzip 66 KB）
   └─ index-*.css       41 KB（gzip 8.5 KB）
```

```bash
npm run build        # 产出 dist/
# 把 dist/ 整个目录上传到静态服务器即可
npm run check:static # 本地零依赖起服务自检（确认可独立访问、无外部请求）
```

Nginx 示例（放在子目录 `/drawings/` 时）：

```nginx
location /drawings/ {
    alias   /var/www/nyonic/dist/;
    index   index.html;
    try_files $uri $uri/ /drawings/index.html;
}
```

要点：

- **无路由**：单页无 vue-router，不需要 history fallback 重写规则（上面的 `try_files` 只是兜底）。
- **零外部请求**：字体用系统字体栈，图标是内联 SVG，图纸是内联 SVG，**不请求任何 CDN / 字体 / 图片**，
  内网、离线环境可直接部署。
- **无接口调用**：询价、图纸助手等均未接后端，页面可独立运行。
- 若部署在根目录并希望用绝对路径，把 `vite.config.js` 的 `base` 改成 `'/'` 后重新构建。
- 不要用 `file://` 直接打开 `dist/index.html`（ES Module 受同源策略限制），请走 http 服务。

### 想接真实 DWG 在线浏览

两种路线：

1. **保持纯静态**：用 ODA File Converter / 自研脚本把 DWG 批量转成 SVG（或 DXF→SVG），
   替换 `src/components/drawings/` 下的组件内容，仍然是零依赖静态站点（推荐内网场景）。
2. **接在线服务**：给 `<DwgViewer>` 传 `embed-url` 指向 Autodesk Platform Services、
   ODA 或公司内网的转换/预览服务，窗口会自动切换为 iframe 嵌入（此时需要该服务的可用性）。

## 需求分析 · 历史可能性展示 · 组装交互（第 04 区）

`PartCompare.vue`，位于 DWG 在线浏览块下方。整块**套了一层 chatbot 外壳**：

```
┌ 需求分析助手（Requirement Analyst · 在线）
│  [bot] 你好，我是需求分析助手。描述你的需求…
│  [user] 需要一套 ⌀160 的传动端盖组件，配 ⌀40 轴，8 孔均布…
│  [bot] 已按「…」检索历史图纸库：命中 20 类零件、100 个历史规格…
│        🔧 已调用工具 history_part_search · 参数 { 需求: "…" }
│  ┌ 工具 · 历史可能性展示 · 组装交互 ────────────────┐
│  │  3 : 1  左侧可拖动组装台 ｜ 右侧页签面板           │
│  └──────────────────────────────────────────────────┘
└ [输入行] 需求示例 chips + 输入框 + 发送
```

- **写死的工具调用**：无论用户输入什么需求，助手都会（900ms 思考态后）返回同一段回复并高亮同一个工具视图；
  输入行上方有 3 条需求示例 chips，点一下即当作需求发出。
- 页面加载时已预置一轮示例问答，所以工具视图首屏就可见。
- 对话最多保留 4 轮（超出丢弃最早一轮）；工具视图只有**一个实例**，始终挂在对话末尾，不会被重新挂载（组装状态不会丢）。

**工具视图内部**（3 : 1，行高 `clamp(520px, 70vh, 880px)`，窄屏各自 `62vh` 堆叠）：

**左（3）可拖动拼装的组装台** —— 用户自己把零件拼到基准位上：

- 5 个零件（轴承座 / 轴套 / 齿轮 / 法兰盘 / 端盖）+ 固定基准轴；零件上**不显示名称与尺寸**，只留线框
- 拖动零件：跟随指针移动，松手时距离基准位 < `SNAP`（78 图面单位）即自动吸附装入（`outBack` 回弹），
  否则停在原地；单击零件会闪一下便于定位
- 未装入的零件在基准位显示**淡绿虚线空位**，5 件全部就位后右上角盖「装配完成」印章
- **滚轮缩放**（以光标为锚点，0.6×~3×）、**空白处拖动平移**、工具条「放大 / 缩小 / 适合窗口 / 自动组装 / 全部散开 / 复位」
- 底部装配清单显示每件「待装入 / 已装入」，悬停高亮对应零件，点击闪一下
- 不再自动播放动画（改为手动拼装），需要演示时点「自动组装」

**右（1）页签面板** —— 4 个页签，可点击切换，也可用右上角 `‹ ›` 左右循环切换（带方向感滑动过渡）：

| 页签 | 内容 |
| --- | --- |
| 类别 | **20 类零件**（类型可重复，按名称区分）+ 顶部筛选输入行；列表固定高度只显示 5 行，其余滚动 |
| 规格 | 该类 5 个历史规格（图号 / 规格 / 日期 / 修订）+ 版本时间线 V1→V5 + 设为基准 / 重置 |
| 对比 | 基准 ↔ 当前 的同心圆对比图 + 外径 / 螺栓孔 / 重量 / 版本 / 日期差异表 |
| 上传 | 拖拽上传区（外观）、支持格式标签、最近上传列表（已解析 / 转换中带进度条 / 待校核）；点击只提示"功能开发中" |

页签条下方常驻一行上下文（当前类别 · 装配位 · 当前规格 · 基准规格）。

**数据与联动**：20 类零件都挂在 5 个「装配位」上（`slot`），同类可重复（立式/剖分式/法兰式轴承座…）。
点击类别即把它装到对应装配位，左侧图面按该类当前规格重新出图；点历史规格则让该零件重新装入一次并高亮。
数据在 `src/data/site.js`：`partSlots`（装配位）、`CAT_DEFS`（20 类定义）、`SERIES`（尺寸系列）、
`buildEntries()` 自动生成每类 5 条历史规格、`analystChat`（助手文案与写死回复）；
几何换算在 `PartCompare.vue` 的 `geo` computed（`MM = 0.42`）。

## 设计语言（可调）

- 配色令牌在 `src/styles/base.css`：`--paper` 系列为近白纸底，`--ink` 为墨色，`--accent` 为淡绿交互色。
- 角标边框：全局类 `.corner-box`（及 `.paper-card`）只用**右上 + 左下**两段边框，长度由 `--corner` 控制，圆角由 `--r-md` 控制；
  组件里用 `<div class="side__block corner-box">` 这种叠加写法即可复用。
- 圆角令牌：`--r-xs 5px / --r-sm 9px / --r-md 14px / --r-lg 20px / --r-pill`。
- 纸纹与明暗在 `body::before`（噪点，`opacity: .22`）与 `body::after`（极淡渐变），想更"白"就继续调低这两处。

## 自定义提示

- 换配色：改 `src/styles/base.css` 里的 `--paper / --ink / --accent` 系列变量。
- 换工厂名：`SiteHeader.vue`（报头与厂区）、`DrawingSheet.vue` 的 `unit` 默认值、`SiteFooter.vue`（地址与备案行）。
- 换图纸内容：在 `src/components/drawings/` 下新增 SVG 组件，用 `data-draw / data-fade / data-stage`
  标注需要动画的元素，然后在 `App.vue` 的 `DrawingSheet` 插槽中使用。
- 调动画节奏：改 `useDrawingAnimation.js` 中的 `STAGE_WINDOW`。
- 调钉住滚动长度：改 `DrawingSheet.vue` 中 `.pin-section { height: 210vh }`。
