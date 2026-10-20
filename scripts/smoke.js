/**
 * 冒烟测试：在 jsdom 中真实挂载首页，检查
 *  1) 组件树是否报错（errorHandler / warnHandler）
 *  2) 图纸是否生成了可描线元素（pathLength 由 anime.js createDrawable 写入）
 *  3) 滚动进度是否驱动动画（模拟滚动后 stroke-dasharray 是否变化）
 *
 * 运行： npm run smoke
 */
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
})
const { window } = dom

window.matchMedia =
  window.matchMedia ||
  ((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  }))

globalThis.window = window
globalThis.document = window.document
globalThis.HTMLElement = window.HTMLElement
globalThis.SVGElement = window.SVGElement
globalThis.SVGGeometryElement = window.SVGGeometryElement || window.SVGElement
globalThis.Element = window.Element
globalThis.Node = window.Node
globalThis.NodeList = window.NodeList
globalThis.HTMLCollection = window.HTMLCollection
globalThis.CSSStyleDeclaration = window.CSSStyleDeclaration
globalThis.Event = window.Event
globalThis.CustomEvent = window.CustomEvent
globalThis.Document = window.Document
globalThis.ShadowRoot = window.ShadowRoot
globalThis.HTMLInputElement = window.HTMLInputElement
globalThis.HTMLTextAreaElement = window.HTMLTextAreaElement
globalThis.HTMLSelectElement = window.HTMLSelectElement
globalThis.getComputedStyle = window.getComputedStyle.bind(window)
globalThis.DOMPoint = window.DOMPoint || class DOMPoint {
  constructor(x = 0, y = 0) {
    this.x = x
    this.y = y
  }
  matrixTransform() {
    return this
  }
}
globalThis.IntersectionObserver = undefined
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window)
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window)

const errors = []
const warnings = []

const { createApp } = await import('vue')
const { default: App } = await import('../src/App.vue')
const { revealDirective } = await import('../src/directives/reveal.js')

const app = createApp(App)
app.directive('reveal', revealDirective)
app.config.errorHandler = (err, instance, info) => errors.push(`${info}: ${err?.message || err}`)
app.config.warnHandler = (msg, instance, trace) => warnings.push(msg)
app.mount('#app')

await new Promise((r) => setTimeout(r, 120))

const root = document.getElementById('app')
const html = root.innerHTML

const count = (re) => (html.match(re) || []).length
const drawables = count(/pathLength=/g)
const draws = count(/data-draw/g)
const fades = count(/data-fade/g)
const sections = count(/class="pin-section/g)
const compareParts = root.querySelectorAll('#compare .steps-bar__item').length
const tabs = [...root.querySelectorAll('#compare .tab')]
const cats = root.querySelectorAll('#compare .cat').length

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

/* —— 组装台：拖动交互 + 自动组装 —— */
const stage = root.querySelector('#compare .stage__canvas')
const gearPart = root.querySelector('#compare [data-part="gear"]')
const pointer = (type, el) => {
  const evt = new window.MouseEvent(type, { bubbles: true, cancelable: true, button: 0 })
  el.dispatchEvent(evt)
}
pointer('pointerdown', gearPart)
await wait(40)
const draggingClass = stage.classList.contains('is-dragging')
pointer('pointerup', gearPart)
await wait(40)
const dragReleased = !stage.classList.contains('is-dragging')

const assembleBtn = [...root.querySelectorAll('#compare .stage__bar .btn')].find((b) =>
  b.textContent.includes('自动组装'),
)
assembleBtn?.click()
await wait(1700)
const assembledStamp = !!root.querySelector('#compare .done')
const stageState = root.querySelector('#compare .stage__state')?.textContent.replace(/\s+/g, ' ').trim()

/* —— 类别筛选输入行 —— */
const filterInput = root.querySelector('#compare .filter__input')
filterInput.value = '端盖'
filterInput.dispatchEvent(new window.Event('input', { bubbles: true }))
await wait(60)
const catsFiltered = root.querySelectorAll('#compare .cat').length
filterInput.value = ''
filterInput.dispatchEvent(new window.Event('input', { bubbles: true }))
await wait(60)
const catsAll = root.querySelectorAll('#compare .cat').length

/* 逐个切换右侧页签，确认各面板内容都能渲染 */
const clickTab = async (label) => {
  tabs.find((t) => t.textContent.trim() === label)?.click()
  await wait(360) // 等过渡动画结束（mode="out-in"）
}
await clickTab('规格')
const histRows = root.querySelectorAll('#compare .hist__row').length
await clickTab('对比')
const diffRows = root.querySelectorAll('#compare .diff tbody tr').length
await clickTab('上传')
const dropzones = root.querySelectorAll('#compare .drop').length
const uploadRows = root.querySelectorAll('#compare .upload').length
await clickTab('类别')

/* —— chatbot 外壳：需求分析 → 调用工具 —— */
const chatShell = !!root.querySelector('#compare .chat-shell')
const toolInStream = !!root.querySelector('#compare .chat-stream .tool')
const toolCallLine = !!root.querySelector('#compare .tool-call')
const sectionTitle = root.querySelector('#compare .cmp-head__title')?.textContent.trim()
const userMsgsBefore = root.querySelectorAll('#compare .msg--user').length

const field = root.querySelector('#compare .chat-input__field')
field.value = '需要 ⌀200 法兰盘，配 ⌀50 轴，8 孔均布'
field.dispatchEvent(new window.Event('input', { bubbles: true }))
const form = root.querySelector('#compare .chat-input')
form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
await wait(120)
const typingShown = !!root.querySelector('#compare .msg__bubble--typing')
await wait(1200)
const userMsgsAfter = root.querySelectorAll('#compare .msg--user').length
const lastBot = [...root.querySelectorAll('#compare .msg--bot .msg__bubble')].pop()?.textContent || ''
const replyMatched = lastBot.includes('已按') && lastBot.includes('⌀200 法兰盘')
const toolFlashed = !!root.querySelector('#compare .tool.is-flash')
const sheets = ['sheet-01', 'sheet-02', 'sheet-03', 'compare'].filter((id) =>
  root.querySelector(`#${id}`),
)

// 模拟滚动：把 sheet-01 移到视口顶部附近，检查描线进度是否推进（jsdom 无布局，需注入 rect）
const sheet01 = root.querySelector('#sheet-01')
const svgLine = sheet01?.querySelector('svg [data-draw]')
const before = svgLine?.getAttribute('stroke-dasharray')
const allBefore = [...root.querySelectorAll('svg [data-draw]')].map((el) =>
  el.getAttribute('stroke-dasharray'),
)
window.scrollY = 600
if (sheet01) {
  Object.defineProperty(sheet01, 'getBoundingClientRect', {
    value: () => ({ top: 0, bottom: 1300, height: 1300, left: 0, right: 0, width: 1200 }),
  })
  window.dispatchEvent(new window.Event('scroll'))
  await new Promise((r) => setTimeout(r, 150))
}
const after = svgLine?.getAttribute('stroke-dasharray')
const allAfter = [...root.querySelectorAll('svg [data-draw]')].map((el) =>
  el.getAttribute('stroke-dasharray'),
)
const changed = allAfter.filter((v, i) => v !== allBefore[i]).length

const report = {
  errors,
  warnings: warnings.slice(0, 8),
  sections,
  sheets,
  draws,
  fades,
  drawables,
  compareParts,
  tabs: tabs.length,
  cats,
  catsAll,
  catsFiltered,
  draggingClass,
  dragReleased,
  assembledStamp,
  stageState,
  histRows,
  diffRows,
  dropzones,
  uploadRows,
  chatShell,
  toolInStream,
  toolCallLine,
  sectionTitle,
  userMsgsBefore,
  userMsgsAfter,
  typingShown,
  replyMatched,
  toolFlashed,
  progressDriven: before !== after,
  changedDrawables: changed,
  sampleBefore: before,
  sampleAfter: after,
  htmlLength: html.length,
}
console.log(JSON.stringify(report, null, 2))

if (errors.length) {
  console.error('❌ 挂载存在错误')
  process.exit(1)
}
if (drawables === 0 || changed === 0) {
  console.error('❌ 描线动画未接入（createDrawable / 滚动驱动失败）')
  process.exit(1)
}
if (compareParts !== 6 || catsAll !== 20 || tabs.length !== 4) {
  console.error('❌ 零件对比区渲染异常（装配件 / 类别 / 页签数量不符）')
  process.exit(1)
}
if (catsFiltered !== 4) {
  console.error('❌ 类别筛选输入行未生效（筛选“端盖”应得 4 类）')
  process.exit(1)
}
if (!draggingClass || !dragReleased) {
  console.error('❌ 拖动交互未生效（pointerdown/up 状态未切换）')
  process.exit(1)
}
if (!assembledStamp) {
  console.error('❌ 自动组装未完成（未出现“装配完成”印章）')
  process.exit(1)
}
if (histRows !== 5 || diffRows !== 5 || dropzones !== 1 || uploadRows !== 4) {
  console.error('❌ 右侧页签内容异常（历史规格 / 对比行 / 上传区）')
  process.exit(1)
}
if (!chatShell || !toolInStream || !toolCallLine) {
  console.error('❌ chatbot 外壳异常（对话容器 / 工具视图 / 工具调用行）')
  process.exit(1)
}
if (sectionTitle !== '需求分析 · 历史可能性展示 · 组装交互') {
  console.error(`❌ 区块标题未更新：${sectionTitle}`)
  process.exit(1)
}
if (!typingShown || userMsgsAfter !== userMsgsBefore + 1 || !replyMatched || !toolFlashed) {
  console.error('❌ 需求分析对话流程异常（思考态 / 用户消息 / 写死回复 / 工具高亮）')
  process.exit(1)
}
console.log('✅ 挂载、描线动画、滚动驱动、拖动组装、20 类筛选、页签与需求分析对话均正常')
