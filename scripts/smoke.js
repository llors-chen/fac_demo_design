/**
 * 冒烟测试：在 jsdom 中真实挂载首页并跑一遍关键交互
 *   01 需求整理：提交 → 思考态 → 书面需求单（字段来自输入文本）
 *   02 需求对齐：对话逐条播放 / 全部显示 + 对齐结论
 *   03 DWG 在线浏览：提取 BOM → 上载 M3
 *   04 需求分析：对话调用工具、20 类筛选、拖动组装、生成 BOM → 上载 M3、页签切换
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
globalThis.DOMPoint =
  window.DOMPoint ||
  class DOMPoint {
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
app.config.warnHandler = (msg) => warnings.push(msg)
app.mount('#app')

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
await wait(150)

const root = document.getElementById('app')
const html = root.innerHTML
const q = (sel) => root.querySelector(sel)
const qa = (sel) => [...root.querySelectorAll(sel)]
const text = (sel) => q(sel)?.textContent.replace(/\s+/g, ' ').trim() || ''

/* ---------------- 结构 ---------------- */
const sections = ['req-intake', 'dwg-chat', 'compare'].filter((id) => q(`#${id}`))
const legacySections = !!q('#sheet-01') || !!q('#req-align') || !!q('.pin-section')

/* ---------------- 01 需求整理 ---------------- */
const intakeRaw = q('#req-intake .raw')
const intakeSampleLen = intakeRaw?.value.length || 0
q('#req-intake .intake__actions .btn')?.click()
await wait(200)
const intakeThinking = !!q('#req-intake .msg__bubble--typing')
await wait(1100)
const reqCard = q('#req-intake .req')
const reqText = text('#req-intake .req')
const reqFields = qa('#req-intake .req__row').length
const reqExtracted = reqText.includes('DN160') && reqText.includes('⌀40') && reqText.includes('REQ-')
const intakeStepsDone = qa('#req-intake .trace__item.is-done').length

/* ---------------- 01 客户附件信息 ---------------- */
const attachRows = qa('#req-intake .att').length
const attachPoints = qa('#req-intake .attach__list li').length
const attachParsed = qa('#req-intake .att__state.is-done').length
const attachText = text('#req-intake .attach')

/* ---------------- 02 图纸检索 chatbot：DWG + 提取 BOM ---------------- */
const dwgChatShell = !!q('#dwg-chat .chat-shell')
const dwgPreInput = text('#dwg-chat .msg--user .msg__bubble')
const dwgToolInStream = !!q('#dwg-chat .chat-stream .tool')
const dwgHits = qa('#dwg-chat .hit').length
const dwgActiveFirst = q('#dwg-chat .hit.is-on .hit__name')?.textContent.trim() || ''
const viewerFile = q('#dwg-chat .tabs__file.is-on')?.textContent.replace(/\s+/g, ' ').trim() || ''

/* 切换到第 2 张命中图纸 */
qa('#dwg-chat .hit')[1]?.click()
await wait(120)
const dwgActiveAfter = q('#dwg-chat .hit.is-on .hit__name')?.textContent.trim() || ''
const viewerFileAfter = q('#dwg-chat .tabs__file.is-on')?.textContent.replace(/\s+/g, ' ').trim() || ''

/* 重新检索 */
const dwgField = q('#dwg-chat .chat-input__field')
dwgField.value = '找 DN160 法兰盘的历史版本'
dwgField.dispatchEvent(new window.Event('input', { bubbles: true }))
const dwgMsgsBefore = qa('#dwg-chat .msg--user').length
q('#dwg-chat .chat-input').dispatchEvent(
  new window.Event('submit', { bubbles: true, cancelable: true }),
)
await wait(120)
const dwgTyping = !!q('#dwg-chat .msg__bubble--typing')
await wait(1200)
const dwgMsgsAfter = qa('#dwg-chat .msg--user').length
const dwgLastBot = qa('#dwg-chat .msg--bot .msg__bubble').pop()?.textContent || ''
const dwgReplyMatched = dwgLastBot.includes('已按') && dwgLastBot.includes('DN160 法兰盘的历史版本')
const dwgToolFlashed = !!q('#dwg-chat .tool.is-flash')
/* ---------------- 03 DWG：提取 BOM → 上载 M3 ---------------- */
const bomBtn = (scope, t) => qa(`${scope} .bom__actions .btn`).find((b) => b.textContent.includes(t))
const dwgBomPanel = !!q('#dwg-chat .bom-panel--card')
const dwgBomRows = qa('#dwg-chat .bom__row').length
const dwgBomText = text('#dwg-chat .bom')
bomBtn('#dwg-chat', '提取 BOM')?.click()
await wait(900)
const dwgExtracted = text('#dwg-chat .bom__status').includes('已提取 BOM')
bomBtn('#dwg-chat', '上载至')?.click()
await wait(1100)
const dwgStatus = text('#dwg-chat .bom__status')
const dwgUploaded = /已上载至 M3 · 单据 BOM-\d{8}-018/.test(dwgStatus)

/* ---------------- 04 需求分析 · 组装交互 ---------------- */
const chatShell = !!q('#compare .chat-shell')
const toolInStream = !!q('#compare .chat-stream .tool')
const sectionTitle = text('#compare .cmp-head__title')

const tabs = qa('#compare .tab')
const clickTab = async (label) => {
  tabs.find((t) => t.textContent.trim() === label)?.click()
  await wait(360)
}

const catsAll = qa('#compare .cat').length
const filterInput = q('#compare .filter input')
filterInput.value = '端盖'
filterInput.dispatchEvent(new window.Event('input', { bubbles: true }))
await wait(60)
const catsFiltered = qa('#compare .cat').length
filterInput.value = ''
filterInput.dispatchEvent(new window.Event('input', { bubbles: true }))
await wait(60)

const stage = q('#compare .stage__canvas')
const pointer = (type, el) =>
  el.dispatchEvent(new window.MouseEvent(type, { bubbles: true, cancelable: true, button: 0 }))
pointer('pointerdown', q('#compare [data-part="gear"]'))
await wait(40)
const draggingClass = stage.classList.contains('is-dragging')
pointer('pointerup', q('#compare [data-part="gear"]'))
await wait(40)
const dragReleased = !stage.classList.contains('is-dragging')

qa('#compare .stage__bar .btn')
  .find((b) => b.textContent.includes('自动组装'))
  ?.click()
await wait(1700)
const assembledStamp = !!q('#compare .done')
const stageState = text('#compare .stage__state')

/* 需求分析对话 */
const field = q('#compare .chat-input__field')
field.value = '需要 ⌀200 法兰盘，配 ⌀50 轴，8 孔均布'
field.dispatchEvent(new window.Event('input', { bubbles: true }))
const userMsgsBefore = qa('#compare .msg--user').length
q('#compare .chat-input').dispatchEvent(
  new window.Event('submit', { bubbles: true, cancelable: true }),
)
await wait(120)
const typingShown = !!q('#compare .msg__bubble--typing')
await wait(1200)
const userMsgsAfter = qa('#compare .msg--user').length
const lastBot = qa('#compare .msg--bot .msg__bubble').pop()?.textContent || ''
const replyMatched = lastBot.includes('已按') && lastBot.includes('⌀200 法兰盘')
const toolFlashed = !!q('#compare .tool.is-flash')

/* 页签：规格 / 对比 / 上载至 M3 */
await clickTab('规格')
const histRows = qa('#compare .hist__row').length
await clickTab('对比')
const diffRows = qa('#compare .diff tbody tr').length
await clickTab('上载至M3')
const m3Targets = qa('#compare .target__row').length
const bomRowCount = qa('#compare .bom__row').length
const bomHasHousing = text('#compare .bom').includes('NY-BS-120')
bomBtn('#compare', '生成 BOM')?.click()
await wait(150)
const bomGenerating = text('#compare .bom__status').includes('正在生成')
await wait(900)
const bomReady = text('#compare .bom__status').includes('已生成 BOM')
bomBtn('#compare', '上载至')?.click()
await wait(1100)
const m3Status = text('#compare .bom__status')
const m3Uploaded = /已上载至 M3 · 单据 BOM-\d{8}-014/.test(m3Status)
const m3Notice = !!q('#compare .bom-panel__notice')
await clickTab('类别')

/* ---------------- 报告 ---------------- */
const report = {
  errors,
  warnings: warnings.slice(0, 8),
  sections,
  legacySections,
  intakeSampleLen,
  intakeThinking,
  intakeStepsDone,
  reqCard: !!reqCard,
  reqFields,
  reqExtracted,
  attachRows,
  attachPoints,
  attachParsed,
  attachHasDwg: attachText.includes('原法兰盘旧图.dwg'),
  dwgChatShell,
  dwgPreInput,
  dwgToolInStream,
  dwgHits,
  dwgActiveFirst,
  dwgActiveAfter,
  viewerFile,
  viewerFileAfter,
  dwgTyping,
  dwgMsgsBefore,
  dwgMsgsAfter,
  dwgReplyMatched,
  dwgToolFlashed,  dwgBomPanel,
  dwgBomRows,
  dwgBomHasFlange: dwgBomText.includes('NY-FL-160'),
  dwgExtracted,
  dwgUploaded,
  chatShell,
  toolInStream,
  sectionTitle,
  tabs: tabs.length,
  catsAll,
  catsFiltered,
  draggingClass,
  dragReleased,
  assembledStamp,
  stageState,
  userMsgsBefore,
  userMsgsAfter,
  typingShown,
  replyMatched,
  toolFlashed,
  histRows,
  diffRows,
  m3Targets,
  bomRowCount,
  bomHasHousing,
  bomGenerating,
  bomReady,
  m3Uploaded,
  m3Notice,
  htmlLength: html.length,
}
console.log(JSON.stringify(report, null, 2))

/* ---------------- 断言 ---------------- */
const fail = (msg) => {
  console.error(`❌ ${msg}`)
  process.exit(1)
}

if (errors.length) fail('挂载存在错误')
if (sections.length !== 3) fail(`区块缺失：${sections.join(', ')}`)
if (legacySections) fail('已移除的区块仍存在（#sheet-01 / #req-align / .pin-section）')

if (intakeSampleLen < 80) fail('01 样例输入为空')
if (!intakeThinking || !reqCard) fail('01 提交整理流程异常（思考态 / 书面需求单）')
if (reqFields !== 9) fail(`01 书面需求字段数异常：${reqFields}`)
if (!reqExtracted) fail('01 未从输入文本中提取到规格（DN160 / ⌀40）')
if (intakeStepsDone !== 4) fail(`01 整理步骤未全部完成：${intakeStepsDone}`)

if (attachRows !== 5 || attachPoints !== 3 || attachParsed !== 4) {
  fail(`01 附件板块异常：rows=${attachRows} points=${attachPoints} parsed=${attachParsed}`)
}
if (!attachText.includes('原法兰盘旧图.dwg')) fail('01 附件列表缺少 DWG 附件')

if (!dwgChatShell || !dwgToolInStream) fail('02 对话外壳 / 工具视图缺失')
if (!dwgPreInput.includes('基于销售的信息检索历史图纸并展示 dwg 信息')) {
  fail(`02 前置输入异常：${dwgPreInput}`)
}
if (dwgHits !== 3) fail(`02 检索命中数异常：${dwgHits}`)
if (!dwgActiveFirst.includes('法兰盘装配图.dwg') || !viewerFile.includes('法兰盘装配图.dwg')) {
  fail(`02 默认展示图纸异常：hit=${dwgActiveFirst} viewer=${viewerFile}`)
}
if (!dwgActiveAfter.includes('旧') || !viewerFileAfter.includes('旧')) {
  fail(`02 切换命中图纸未联动看图器：hit=${dwgActiveAfter} viewer=${viewerFileAfter}`)
}
if (dwgMsgsAfter !== dwgMsgsBefore + 1 || !dwgTyping || !dwgReplyMatched || !dwgToolFlashed) {
  fail('02 检索对话流程异常')
}
if (!dwgBomPanel || dwgBomRows !== 6) fail(`03 BOM 面板异常：rows=${dwgBomRows}`)
if (!dwgExtracted || !dwgUploaded) fail(`03 提取 / 上载流程异常：${dwgStatus}`)

if (!chatShell || !toolInStream) fail('04 对话外壳 / 工具视图缺失')
if (sectionTitle !== '需求分析 · 历史可能性展示 · 组装交互') fail(`04 标题异常：${sectionTitle}`)
if (tabs.length !== 4 || catsAll !== 20) {
  fail(`04 页签或类别数量异常：tabs=${tabs.length} cats=${catsAll}`)
}
if (catsFiltered !== 4) fail(`04 类别筛选未生效：${catsFiltered}`)
if (!draggingClass || !dragReleased) fail('04 拖动交互未生效')
if (!assembledStamp) fail('04 自动组装未完成')
if (userMsgsAfter !== userMsgsBefore + 1 || !typingShown || !replyMatched || !toolFlashed) {
  fail('04 需求分析对话流程异常')
}
if (histRows !== 5 || diffRows !== 5) fail('04 规格 / 对比页签内容异常')
if (m3Targets !== 3 || bomRowCount !== 6 || !bomHasHousing) fail('04 BOM 内容异常')
if (!bomGenerating || !bomReady || !m3Uploaded || !m3Notice) {
  fail(`04 BOM 上载流程异常：${m3Status}`)
}

console.log('✅ 需求整理（含附件）→ 图纸检索 chatbot（DWG + 提取 BOM）→ 需求分析与组装 全链路交互正常')
