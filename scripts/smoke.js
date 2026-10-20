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
const sheets = ['sheet-01', 'sheet-02', 'sheet-03'].filter((id) => root.querySelector(`#${id}`))

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
console.log('✅ 挂载、描线动画与滚动驱动均正常')
