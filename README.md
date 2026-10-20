# 精工图谱 · 工业制造官网首页

Vue 3 + Vite 实现的工业制造企业首页，主题为**设计成果图纸在线浏览**。
整体为报纸（印刷品）质感：米黄纸底 + 黑墨 + 淡绿交互色，线性图标，宋体排版。

## 快速开始

```bash
npm install          # 安装依赖
npm run dev          # 开发预览（默认 http://127.0.0.1:5273）
npm run build        # 生产构建 → dist/
npm run preview      # 预览构建产物
npm run smoke        # jsdom 冒烟测试（挂载 + 描线动画 + 滚动驱动）
```

> Windows 沙箱环境提示：Vite 在受限沙箱下会因 `exec("net use")` 的子进程管道报 `EPERM`，
> 需在放宽权限的终端中运行 `npm run dev` / `npm run build`。

## 页面结构（三段式）

| 段 | 组件 | 说明 |
| --- | --- | --- |
| ① 顶部 | `SiteHeader.vue` | 报头（刊期/检索/登录）+ 吸顶导航条：工厂信息 / 品牌介绍 / 样品解决方案 / 职业 / 公司 + 企业新闻 & 媒体 / 联系我们。**全部为按钮，不做跳转**，点击仅切换高亮 |
| ② 主体 | `LeadStory.vue` | 头版导语、本期图纸目录、数据栏、厂区快讯滚动条 |
| ② 主体 | `DrawingSheet.vue` ×2 | 图纸 01 行星齿轮减速箱总装图、图纸 02 传动轴零件图：**定死的滚动描线动画**（钉住 + 进度驱动） |
| ② 主体 | `DwgViewer.vue` + `ChatPanel.vue` | 图纸 03：DWG 在线浏览窗口（3）: 图纸助手（1） |
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

## 自定义提示

- 换配色：改 `src/styles/base.css` 里的 `--paper / --ink / --accent` 系列变量。
- 换图纸内容：在 `src/components/drawings/` 下新增 SVG 组件，用 `data-draw / data-fade / data-stage`
  标注需要动画的元素，然后在 `App.vue` 的 `DrawingSheet` 插槽中使用。
- 调动画节奏：改 `useDrawingAnimation.js` 中的 `STAGE_WINDOW`。
- 调钉住滚动长度：改 `DrawingSheet.vue` 中 `.pin-section { height: 210vh }`。
