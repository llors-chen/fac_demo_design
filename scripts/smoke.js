/**
 * 冒烟测试（精简版）：jsdom 里挂载首页，验证主链路可交互、无报错
 *   npm run smoke
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
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  }))

for (const [k, v] of Object.entries({
  window,
  document: window.document,
  HTMLElement: window.HTMLElement,
  SVGElement: window.SVGElement,
  Element: window.Element,
  Node: window.Node,
  NodeList: window.NodeList,
  HTMLCollection: window.HTMLCollection,
  CSSStyleDeclaration: window.CSSStyleDeclaration,
  Event: window.Event,
  CustomEvent: window.CustomEvent,
  Document: window.Document,
  ShadowRoot: window.ShadowRoot,
  HTMLInputElement: window.HTMLInputElement,
  HTMLTextAreaElement: window.HTMLTextAreaElement,
})) {
  globalThis[k] = v
}
globalThis.getComputedStyle = window.getComputedStyle.bind(window)
globalThis.IntersectionObserver = undefined
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window)
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window)

const errors = []
const { createApp } = await import('vue')
const { default: App } = await import('../src/App.vue')
const { revealDirective } = await import('../src/directives/reveal.js')

const app = createApp(App)
app.directive('reveal', revealDirective)
app.config.errorHandler = (err, i, info) => errors.push(`${info}: ${err?.message || err}`)
app.mount('#app')

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
await wait(150)

const root = document.getElementById('app')
const q = (s) => root.querySelector(s)
const qa = (s) => [...root.querySelectorAll(s)]
const txt = (s) => q(s)?.textContent.replace(/\s+/g, ' ').trim() || ''
const click = (el) => {
  if (el && typeof el.dispatchEvent === 'function') {
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  }
}
const submit = (form) =>
  form?.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
const type = (input, value) => {
  input.value = value
  input.dispatchEvent(new window.Event('input', { bubbles: true }))
}

const r = {}

/* ---- 结构 ---- */
r.sections = ['req-intake', 'req-flow', 'catalog-chat', 'factory-sim', 'quote-chat'].filter((id) => q(`#${id}`))
r.oldSectionsGone = !q('#compare') && !q('#sheet-01') && !q('#req-align')

/* ---- 01-00 流程化工程细节对齐 ---- */
r.flowSteps = qa('#req-flow .step').length
r.flowDocs = qa('#req-flow .doc').length
r.flowTitle = txt('#req-flow .sec-head__title')
click(qa('#req-flow .step')[3])
await wait(200)
r.flowFormCode = txt('#req-flow .form__badge')
r.flowFormSection = txt('#req-flow .form__section')

/* AE 复核：对照表 + 询问按钮 + 发送 */
click(qa('#req-flow .step')[6])
await wait(200)
r.reviewRows = qa('#req-flow .rtable tbody tr').length
r.reviewAskBtns = qa('#req-flow .rflag--btn').length
r.reviewAsked = qa('#req-flow .rflag--btn.is-asked').length
click(qa('#req-flow .askbox .btn'))
await wait(120)
r.reviewSent = !!q('#req-flow .review__sent')

/* 客户答复 */
click(qa('#req-flow .step')[7])
await wait(200)
r.qaItems = qa('#req-flow .qa__item').length

/* 可行性 + 三方确认单 */
click(qa('#req-flow .step')[8])
await wait(200)
r.flowFeasible = txt('#req-flow .form__section')
r.flowChecks = qa('#req-flow .check').length
click(qa('#req-flow .step')[9])
await wait(200)
r.confirmRows = qa('#req-flow .ctable tbody tr').length
r.confirmParties = qa('#req-flow .parties .party').length

/* ---- 01 需求整理 + 附件 ---- */
r.intakeSample = q('#req-intake .raw')?.value.length || 0
click(q('#req-intake .intake__actions .btn'))
await wait(1800)
r.stages = qa('#req-intake .turn').length
r.roughRows = qa('#req-intake .rough__row').length
r.roughMissing = qa('#req-intake .rough__missing li').length
r.roughVerdict = txt('#req-intake .rough__ok')
r.reqExtracted = txt('#req-intake .rough').includes('CAHB-22')
r.attachments = qa('#req-intake .att').length

/* ---- 02 产品目录匹配分支 ---- */
r.catalogShell = !!q('#catalog-chat .chat-shell')
r.catalogPreInput = txt('#catalog-chat .msg--user .msg__bubble')
r.branches = qa('#catalog-chat .branch').length
r.groups = qa('#catalog-chat .group').length
r.products = qa('#catalog-chat .product').length
r.productBomRows = qa('#catalog-chat .bom__row').length
click(qa('#catalog-chat .product')[2]) // 无图纸产品
await wait(120)
r.emptyState = !!q('#catalog-chat .empty')
click(qa('#catalog-chat .product')[0])
await wait(150)
r.dwgShown = !!q('#catalog-chat .dwg-row')

/* ---- 02 客制化目标匹配分支 ---- */
click(qa('#catalog-chat .branch')[1])
await wait(150)
r.customBar = txt('#catalog-chat .cm__goal')
r.innerTabs = qa('#catalog-chat .tab').length
r.cats = qa('#catalog-chat .cat').length
type(q('#catalog-chat .filter input'), '端盖')
await wait(60)
r.catsFiltered = qa('#catalog-chat .cat').length
type(q('#catalog-chat .filter input'), '')
await wait(60)
const stage = q('#catalog-chat .stage__canvas')
q('#catalog-chat [data-part="gear"]')?.dispatchEvent(
  new window.MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }),
)
await wait(40)
r.dragging = !!stage?.classList.contains('is-dragging')
q('#catalog-chat [data-part="gear"]')?.dispatchEvent(
  new window.MouseEvent('pointerup', { bubbles: true, cancelable: true, button: 0 }),
)
await wait(40)
click(qa('#catalog-chat .stage__bar .btn').find((b) => b.textContent.includes('自动组装')))
await wait(1700)
r.assembled = !!q('#catalog-chat .done')
/* 对话重问不应把分支切回目录 */
type(q('#catalog-chat .chat-input__field'), '需要 ⌀200 法兰盘，配 ⌀50 轴')
submit(q('#catalog-chat .chat-input'))
await wait(1200)
r.branchKept = !!q('#catalog-chat .cm__bar')

/* ---- 02-00 车间模拟 ---- */
r.simLines = qa('#factory-sim .line').length
r.simParts = qa('#factory-sim .pcell').length
r.simProducts = qa('#factory-sim .prow').length
r.simStaff = qa('#factory-sim .srow').length
r.simLabor = qa('#factory-sim .ltable tbody tr').length
r.simKpis = qa('#factory-sim .kpi').length
r.simSatBefore = txt('#factory-sim .kpi--accent .kpi__value')
r.simCostBefore = txt('#factory-sim .ltable tfoot td:last-child')
click(qa('#factory-sim .shift')[1])
await wait(150)
r.simSatAfter = txt('#factory-sim .kpi--accent .kpi__value')
r.simCostAfter = txt('#factory-sim .ltable tfoot td:last-child')
click(qa('#factory-sim .pill')[1])
await wait(100)
r.simDimmed = qa('#factory-sim .pcell.is-dim').length
/* ---- 03 销售回馈与报价 ---- */
r.quoteShell = !!q('#quote-chat .chat-shell')
r.quotePreInput = txt('#quote-chat .msg--user .msg__bubble')
r.quoteRows = qa('#quote-chat .qtable tbody tr').length
r.quoteTotal1 = txt('#quote-chat .qtable tfoot tr.is-total td:last-child')
click(qa('#quote-chat .tier')[1])
await wait(150)
r.quoteTotal2 = txt('#quote-chat .qtable tfoot tr.is-total td:last-child')
r.tiers = qa('#quote-chat .tier').length
r.gantt = qa('#quote-chat .gantt__row').length
r.feedback = txt('#quote-chat .feedback__text').slice(0, 24)
type(q('#quote-chat .chat-input__field'), '客户要 500 件，含税总价和交期是多少')
submit(q('#quote-chat .chat-input'))
await wait(1200)
const quoteBots = qa('#quote-chat .msg--bot .msg__bubble')
r.quoteReply = quoteBots[quoteBots.length - 1]?.textContent.replace(/\s+/g, ' ').trim() || ''

r.errors = errors
console.log(JSON.stringify(r, null, 2))

const fail = (m) => {
  console.error(`❌ ${m}`)
  process.exit(1)
}
if (errors.length) fail('挂载存在错误')
if (r.sections.length !== 5 || !r.oldSectionsGone) fail('区块结构异常')
if (r.sections.join(',') !== 'req-intake,req-flow,catalog-chat,factory-sim,quote-chat') fail('区块顺序异常：' + r.sections.join(','))
if (r.flowSteps !== 9 || r.flowDocs !== 4 || !r.flowTitle.includes('销售端工程细节对齐')) fail('01-00 流程异常')
if (!r.flowFormCode.includes('500413') || !r.flowFormSection.includes('3.2')) fail('01-00 报表章节异常')
if (r.reviewRows !== 7 || r.reviewAskBtns !== 3 || r.reviewAsked !== 3) fail('01-00 AE 复核对照表异常')
if (!r.reviewSent) fail('01-00 询问发送未生效')
if (r.qaItems !== 3) fail('01-00 客户答复异常')
if (!r.flowFeasible.includes('Feasibility')) fail('01-00 可行性章节异常')
if (r.confirmRows !== 9 || r.confirmParties !== 3) fail('01-00 三方确认单异常')
if (r.intakeSample < 80 || !r.roughVerdict.includes('CAHB-22')) fail('01 初判异常')
if (r.stages < 3 || r.roughRows !== 7 || r.roughMissing !== 3) fail('01 粗整理异常')
if (!r.reqExtracted || r.attachments !== 5) fail('01 提取 / 附件异常')
if (!r.catalogShell || r.branches !== 2 || r.groups !== 3 || r.products !== 3) fail('02 目录分支异常')
if (r.productBomRows !== 5 || !r.emptyState || !r.dwgShown) fail('02 产品图纸 / 空态异常')
if (!r.customBar.includes('法兰盘 DN160') || r.innerTabs !== 4 || r.cats !== 20) {
  fail('02 客制化分支异常')
}
if (r.catsFiltered !== 4 || !r.dragging || !r.assembled || !r.branchKept) fail('02 客制化交互异常')
if (r.simLines !== 4 || r.simParts !== 200 || r.simProducts !== 20 || r.simStaff !== 7 || r.simKpis !== 6) fail('02-00 车间模拟异常')
if (r.simLabor !== 6 || r.simSatBefore === r.simSatAfter || r.simCostBefore === r.simCostAfter) fail('02-00 班次联动异常')
if (r.simDimmed < 10) fail('02-00 库存筛选未生效')
if (!r.quoteShell || r.quoteRows !== 4 || r.tiers !== 3 || r.gantt !== 5) fail('03 报价异常')
if (r.quoteTotal1 === r.quoteTotal2) fail('03 数量档位未联动合计')
if (!r.feedback.includes('客户您好')) fail('03 回馈话术缺失')
if (!r.quoteReply.includes('500 件')) fail('03 回馈对话异常')

console.log('✅ 需求整理（模板 + 附件）→ 产品目录检索（目录 / 客制化两分支）→ 销售回馈与报价 主链路正常')
