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
const click = (el) => el?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
const submit = (form) =>
  form?.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
const type = (input, value) => {
  input.value = value
  input.dispatchEvent(new window.Event('input', { bubbles: true }))
}

const r = {}

/* ---- 结构 ---- */
r.sections = ['req-intake', 'catalog-chat', 'quote-chat'].filter((id) => q(`#${id}`))
r.oldSectionsGone = !q('#compare') && !q('#sheet-01') && !q('#req-align')

/* ---- 01 需求整理 + 附件 ---- */
r.intakeSample = q('#req-intake .raw')?.value.length || 0
click(q('#req-intake .intake__actions .btn'))
await wait(1200)
r.reqSections = qa('#req-intake .req__sec').length
r.reqFields = qa('#req-intake .req__row').length
r.reqSubs = qa('#req-intake .req__item-no')
  .map((e) => e.textContent.trim())
  .join(',')
r.reqTitle1 = txt('#req-intake .req__sec-title')
r.reqExtracted = txt('#req-intake .req').includes('DN160')
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
if (r.sections.length !== 3 || !r.oldSectionsGone) fail('区块结构异常')
if (r.intakeSample < 80 || r.reqSections !== 3 || r.reqFields !== 13) fail('01 需求整理异常')
if (r.reqSubs !== '3.1,3.2,3.3,3.4,3.5' || !r.reqTitle1.includes('Project introduction')) {
  fail('01 模板分类异常')
}
if (!r.reqExtracted || r.attachments !== 5) fail('01 提取 / 附件异常')
if (!r.catalogShell || r.branches !== 2 || r.groups !== 3 || r.products !== 3) fail('02 目录分支异常')
if (r.productBomRows !== 5 || !r.emptyState || !r.dwgShown) fail('02 产品图纸 / 空态异常')
if (!r.customBar.includes('法兰盘 DN160') || r.innerTabs !== 4 || r.cats !== 20) {
  fail('02 客制化分支异常')
}
if (r.catsFiltered !== 4 || !r.dragging || !r.assembled || !r.branchKept) fail('02 客制化交互异常')
if (!r.quoteShell || r.quoteRows !== 4 || r.tiers !== 3 || r.gantt !== 5) fail('03 报价异常')
if (r.quoteTotal1 === r.quoteTotal2) fail('03 数量档位未联动合计')
if (!r.feedback.includes('客户您好')) fail('03 回馈话术缺失')
if (!r.quoteReply.includes('500 件')) fail('03 回馈对话异常')

console.log('✅ 需求整理（模板 + 附件）→ 产品目录检索（目录 / 客制化两分支）→ 销售回馈与报价 主链路正常')
