<script setup>
/**
 * 客制化目标匹配（第 02 区页签②的内容）
 *
 * 目录内没有完全匹配的标准产品时，用历史零件做「客制化目标匹配」：
 * 左侧可拖动拼装的组装台（滚轮缩放 / 空白拖动平移 / 自动组装），
 * 右侧页签：类别（20 类 + 筛选）/ 规格 / 对比 / 上载至 M3。
 */
import { animate } from 'animejs'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import BomPanel from './BomPanel.vue'
import { defaultCatBySlot, partCategories, partSlots } from '../data/site.js'

/* ------------------------------ 工具函数 ------------------------------ */
const nowTime = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/* ------------------------------ 基础几何 ------------------------------ */
const axisY = 280
const MM = 0.42 // mm → SVG 半径单位
const SNAP = 78 // 吸附半径（图面单位）
const ZOOM_MIN = 0.6
const ZOOM_MAX = 3

const catByKey = (key) => partCategories.find((c) => c.key === key)

/* ------------------------------ 选择状态 ------------------------------ */
/** 每个装配位当前选中的类别（类型可重复，按名称区分） */
const activeBySlot = reactive({ ...defaultCatBySlot })
/** 每个类别各自记住选中的历史规格 / 对比基准 */
const pickedByCat = reactive({})
const baselineByCat = reactive({})
partCategories.forEach((c) => {
  pickedByCat[c.key] = 2
  baselineByCat[c.key] = 0
})

/** 右侧正在浏览的类别 */
const activeCat = ref(defaultCatBySlot.flange)
const activeCategory = computed(() => catByKey(activeCat.value))
const slotOf = (key) => catByKey(key)?.slot
const entryOfSlot = (slot) => {
  const c = catByKey(activeBySlot[slot])
  return c ? c.entries[pickedByCat[c.key]] : null
}
const slotName = (key) => partSlots.find((s) => s.key === key)?.name ?? ''

/** 选中类别：同时把它装到对应装配位上 */
function selectCategory(key) {
  activeCat.value = key
  const slot = slotOf(key)
  if (slot) activeBySlot[slot] = key
}

/* ------------------------------ 零件与拖拽 ------------------------------ */
const partDefs = [
  { key: 'shaft', name: '基准轴', slot: null, fixed: true },
  { key: 'housing', name: '轴承座', slot: 'housing', scatter: { x: -230, y: -54 } },
  { key: 'bushing', name: '轴套', slot: 'bushing', scatter: { x: -80, y: 86 } },
  { key: 'gear', name: '齿轮', slot: 'gear', scatter: { x: 10, y: -96 } },
  { key: 'flange', name: '法兰盘', slot: 'flange', scatter: { x: 168, y: 62 } },
  { key: 'cover', name: '端盖', slot: 'cover', scatter: { x: 236, y: -40 } },
]
const parts = reactive(
  partDefs.map((d, i) => ({
    ...d,
    no: String(i + 1),
    x: d.fixed ? 0 : (d.scatter?.x ?? 0),
    y: d.fixed ? 0 : (d.scatter?.y ?? 0),
    flash: false,
  })),
)
const isHome = (p) => !!p && Math.abs(p.x) < 1.5 && Math.abs(p.y) < 1.5
const partOf = (key) => parts.find((p) => p.key === key)
const draggable = computed(() => parts.filter((p) => !p.fixed))
const homeCount = computed(() => draggable.value.filter((p) => isHome(p)).length)
const allHome = computed(() => homeCount.value === draggable.value.length)

const hoverPart = ref('')
const draggingKey = ref('')

/* ------------------------------ 视图（缩放 / 平移） ------------------------------ */
const view = reactive({ scale: 1, x: 0, y: 0 })
const zoomPercent = computed(() => Math.round(view.scale * 100))
const svgEl = ref(null)

/** 屏幕坐标 → SVG 根坐标（不依赖 DOMPoint；无 CTM 时用包围盒近似） */
function toRoot(evt) {
  const svg = svgEl.value
  const ctm = typeof svg?.getScreenCTM === 'function' ? svg.getScreenCTM() : null
  if (ctm) {
    const m = ctm.inverse()
    return {
      x: m.a * evt.clientX + m.c * evt.clientY + m.e,
      y: m.b * evt.clientX + m.d * evt.clientY + m.f,
    }
  }
  const rect = svg?.getBoundingClientRect?.()
  if (!rect?.width) return { x: 0, y: 0 }
  return {
    x: ((evt.clientX - rect.left) / rect.width) * 1000,
    y: ((evt.clientY - rect.top) / rect.height) * 520,
  }
}
function toContent(evt) {
  const p = toRoot(evt)
  return { x: (p.x - view.x) / view.scale, y: (p.y - view.y) / view.scale }
}

function onWheel(evt) {
  const p = toRoot(evt)
  const factor = Math.exp(-evt.deltaY * 0.0015)
  const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, view.scale * factor))
  const k = next / view.scale
  view.x = p.x - k * (p.x - view.x)
  view.y = p.y - k * (p.y - view.y)
  view.scale = next
}
function zoomBy(factor) {
  const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, view.scale * factor))
  const k = next / view.scale
  view.x = 500 - k * (500 - view.x)
  view.y = 280 - k * (280 - view.y)
  view.scale = next
}
function fitView() {
  view.scale = 1
  view.x = 0
  view.y = 0
}

/* ------------------------------ 指针交互 ------------------------------ */
const drag = reactive({ mode: '', key: '', sx: 0, sy: 0, ox: 0, oy: 0 })

function onPointerDown(evt) {
  if (evt.button !== 0) return
  const host = evt.target?.closest?.('[data-part]')
  const key = host?.getAttribute('data-part')
  svgEl.value?.setPointerCapture?.(evt.pointerId)

  if (key) {
    const part = partOf(key)
    if (!part || part.fixed) return
    const c = toContent(evt)
    drag.mode = 'part'
    drag.key = key
    drag.sx = c.x
    drag.sy = c.y
    drag.ox = part.x
    drag.oy = part.y
    draggingKey.value = key
    if (part.slot) activeCat.value = activeBySlot[part.slot]
    return
  }

  // 空白处 → 平移视图
  const p = toRoot(evt)
  drag.mode = 'pan'
  drag.sx = p.x
  drag.sy = p.y
  drag.ox = view.x
  drag.oy = view.y
}

function onPointerMove(evt) {
  if (!drag.mode) return
  if (drag.mode === 'part') {
    const part = partOf(drag.key)
    if (!part) return
    const c = toContent(evt)
    part.x = drag.ox + (c.x - drag.sx)
    part.y = drag.oy + (c.y - drag.sy)
    return
  }
  const p = toRoot(evt)
  view.x = drag.ox + (p.x - drag.sx)
  view.y = drag.oy + (p.y - drag.sy)
}

function onPointerUp(evt) {
  if (drag.mode === 'part') {
    const part = partOf(drag.key)
    if (part) {
      const moved = Math.hypot(part.x - drag.ox, part.y - drag.oy)
      if (Math.hypot(part.x, part.y) < SNAP) snapHome(part)
      else if (moved < 4) flash(part.key) // 单击零件：闪一下便于定位
    }
  }
  drag.mode = ''
  drag.key = ''
  draggingKey.value = ''
  svgEl.value?.releasePointerCapture?.(evt.pointerId)
}

function snapHome(part) {
  animate(part, { x: 0, y: 0, duration: 320, ease: 'outBack' })
  flash(part.key)
}
function flash(key) {
  const p = partOf(key)
  if (!p) return
  p.flash = true
  window.setTimeout(() => (p.flash = false), 700)
}

/* ------------------------------ 组装动作 ------------------------------ */
function assembleAll() {
  draggable.value.forEach((p, i) => {
    animate(p, {
      x: 0,
      y: 0,
      duration: 700,
      delay: i * 150,
      ease: 'outBack',
      onBegin: () => flash(p.key),
    })
  })
}
function scatterAll() {
  draggable.value.forEach((p, i) => {
    animate(p, {
      x: p.scatter?.x ?? 0,
      y: p.scatter?.y ?? 0,
      duration: 620,
      delay: i * 80,
      ease: 'inOutQuad',
    })
  })
}
function resetView() {
  fitView()
  draggable.value.forEach((p) => animate(p, { x: 0, y: 0, duration: 500, ease: 'inOutQuad' }))
}

/* ------------------------------ 出图几何 ------------------------------ */
const geo = computed(() => {
  const f = entryOfSlot('flange')
  const c = entryOfSlot('cover')
  const b = entryOfSlot('bushing')
  const g = entryOfSlot('gear')
  const h = entryOfSlot('housing')
  return {
    shaft: { x: 70, w: 800, hh: 26 },
    housing: { x: 122, w: 138, hh: 30 + h.dia * MM, bore: h.dia * MM * 0.55 },
    bushing: { x: 372, w: 100, hh: Math.max(b.dia * MM, 9) },
    gear: { x: 496, w: 100, hh: Math.max(g.dia * MM, 14), cx: 546 },
    flange: { x: 292, w: 54, hh: f.dia * MM },
    cover: { x: 620, w: 58, hh: c.dia * MM },
  }
})

const gearTeeth = computed(() => {
  const g = geo.value.gear
  const n = 14
  return Array.from({ length: n }, (_, i) => ({ x: g.x + 6 + (i * (g.w - 12)) / (n - 1) }))
})

const transformOf = (p) => `translate(${p?.x ?? 0} ${p?.y ?? 0})`
const partClass = (p) => ({
  'is-hot': hoverPart.value === p.key || draggingKey.value === p.key,
  'is-flash': p.flash,
  'is-float': !isHome(p),
})

/* ------------------------------ 右侧：页签 ------------------------------ */
const tabs = [
  { key: 'cat', label: '类别', title: '零件类别（20 类）' },
  { key: 'spec', label: '规格', title: '历史规格' },
  { key: 'diff', label: '对比', title: '对比结果' },
  { key: 'upload', label: '上载至M3', title: '上载至 M3 系统' },
]
const activeTab = ref('cat')
const dir = ref(1)

function goTab(key, forceDir) {
  const from = tabs.findIndex((t) => t.key === activeTab.value)
  const to = tabs.findIndex((t) => t.key === key)
  if (to === from || to < 0) return
  dir.value = forceDir ?? (to > from ? 1 : -1)
  activeTab.value = key
}
function stepTab(delta) {
  const i = tabs.findIndex((t) => t.key === activeTab.value)
  goTab(tabs[(i + delta + tabs.length) % tabs.length].key, delta)
}

/* 类别筛选 */
const catQuery = ref('')
const filteredCats = computed(() => {
  const q = catQuery.value.trim().toLowerCase()
  if (!q) return partCategories
  return partCategories.filter((c) =>
    [c.name, c.code, slotName(c.slot), c.material, c.feature]
      .filter(Boolean)
      .some((t) => String(t).toLowerCase().includes(q)),
  )
})

/* 规格与对比 */
const cat = computed(() => activeCategory.value)
const current = computed(() => cat.value.entries[pickedByCat[cat.value.key]])
const base = computed(() => cat.value.entries[baselineByCat[cat.value.key]])

const diffRows = computed(() => {
  const a = base.value
  const b = current.value
  const days = Math.round((new Date(b.date) - new Date(a.date)) / 86400000)
  const dDia = b.dia - a.dia
  const dW = Math.round((b.weight - a.weight) * 100) / 100
  const pct = a.dia ? Math.round((dDia / a.dia) * 100) : 0
  const sign = (n) => (n > 0 ? `+${n}` : `${n}`)
  return [
    { label: cat.value.field, base: `⌀${a.dia}`, cur: `⌀${b.dia}`, delta: `${sign(dDia)} mm / ${sign(pct)}%`, changed: dDia !== 0 },
    { label: '螺栓孔', base: `${a.holes} 孔`, cur: `${b.holes} 孔`, delta: `${sign(b.holes - a.holes)} 孔`, changed: b.holes !== a.holes },
    { label: '重量', base: `${a.weight} kg`, cur: `${b.weight} kg`, delta: `${sign(dW)} kg`, changed: dW !== 0 },
    { label: '版本', base: a.rev, cur: b.rev, delta: `${a.rev} → ${b.rev}`, changed: a.rev !== b.rev },
    { label: '日期', base: a.date, cur: b.date, delta: `${days} 天`, changed: days !== 0 },
  ]
})

const cmpR = (dia) => Math.max(9, Math.min(30, dia * 0.13))

function pickEntry(catKey, idx) {
  pickedByCat[catKey] = idx
  const slot = slotOf(catKey)
  if (!slot || activeBySlot[slot] !== catKey) return
  const p = partOf(slot)
  if (p && isHome(p)) {
    // 已装入的零件换规格 → 重新插入一次
    p.x = -90
    animate(p, { x: 0, y: 0, duration: 560, ease: 'outBack' })
  }
  flash(slot)
}
function setBaseline() {
  baselineByCat[cat.value.key] = pickedByCat[cat.value.key]
}
function resetBaseline() {
  baselineByCat[cat.value.key] = 0
}

/* ------------------------------ 生成 BOM · 上载至 M3（仅界面） ------------------------------ */
const SLOT_ORDER = ['housing', 'bushing', 'gear', 'flange', 'cover']

/** BOM 依据左侧组装台当前装配的零件与其历史规格生成 */
const bomRows = computed(() => {
  const rows = SLOT_ORDER.map((slot, i) => {
    const key = activeBySlot[slot]
    const c = catByKey(key)
    const e = c.entries[pickedByCat[key]]
    return {
      seq: String(i + 1).padStart(2, '0'),
      code: e.code,
      name: c.name,
      spec: e.label,
      material: c.material,
      qty: 1,
      unit: e.weight,
      total: e.weight,
    }
  })
  rows.push({
    seq: '06',
    code: 'NY-FB-M12',
    name: '六角螺栓组',
    spec: 'M12×6',
    material: '8.8 级',
    qty: 6,
    unit: 0.04,
    total: 0.24,
  })
  return rows
})

const bomSummary = computed(() => ({
  items: bomRows.value.length,
  qty: bomRows.value.reduce((s, r) => s + r.qty, 0),
  weight: Math.round(bomRows.value.reduce((s, r) => s + r.total, 0) * 100) / 100,
}))

const bomState = ref('ready') // ready | generating | uploading | uploaded
const bomStamp = ref(nowTime())
const bomDocNo = ref('')
const m3Notice = ref('')
let bomTimer = null
let noticeTimer = null

function flashNotice(text, ms = 2600) {
  m3Notice.value = text
  window.clearTimeout(noticeTimer)
  noticeTimer = window.setTimeout(() => (m3Notice.value = ''), ms)
}

function generateBom() {
  if (bomState.value === 'generating') return
  bomState.value = 'generating'
  window.clearTimeout(bomTimer)
  bomTimer = window.setTimeout(() => {
    bomState.value = 'ready'
    bomStamp.value = nowTime()
    bomDocNo.value = ''
    flashNotice('BOM 已按当前组装台重新生成（演示）')
  }, 700)
}

function exportBom() {
  flashNotice('BOM 已导出为 CSV（演示）')
}

function uploadBom() {
  if (bomState.value === 'uploading') return
  bomState.value = 'uploading'
  window.clearTimeout(bomTimer)
  bomTimer = window.setTimeout(() => {
    const d = new Date()
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    bomDocNo.value = `BOM-${ymd}-014`
    bomState.value = 'uploaded'
    flashNotice(`BOM 已上载至 M3 · 单据 ${bomDocNo.value}（演示）`, 3200)
  }, 900)
}

/* ------------------------------ 生命周期 ------------------------------ */
onMounted(() => {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    draggable.value.forEach((p) => {
      p.x = 0
      p.y = 0
    })
  }
})
onBeforeUnmount(() => {
  window.clearTimeout(bomTimer)
  window.clearTimeout(noticeTimer)
})
</script>

<template>

  <div class="cm">
    <div class="cm__bar">
      <span class="cm__badge mono">客制化</span>
      <span class="cm__goal">目标：法兰盘 DN160 · 8×⌀13 均布 · 配 ⌀40 轴</span>
      <span class="cm__why">目录内无完全匹配的标准产品（或需改制）→ 用历史零件做目标匹配与组装验证</span>
    </div>

<!-- 工具视图（始终在对话末尾，可拖动组装） -->
        <div class="tool">
          <div class="tool__head">
            <span class="tool__badge mono">工具</span>
            <AppIcon name="ruler" :size="15" />
            <span class="tool__name">客制化目标匹配 · 组装与规格对比</span>
            <span class="tool__meta mono">
              {{ partCategories.length }} 类 · {{ partCategories.length * 5 }} 规格 · {{ partSlots.length }} 装配位
            </span>
          </div>

          <!-- 3 : 1 -->
          <div class="cmp-row">
      <!-- 左：可拖动拼装的组装台 -->
      <div class="stage corner-box">
        <div class="stage__bar">
          <button class="btn btn--sm" type="button" title="放大" @click="zoomBy(1.25)">
            <AppIcon name="zoomIn" :size="14" />
          </button>
          <button class="btn btn--sm" type="button" title="缩小" @click="zoomBy(0.8)">
            <AppIcon name="zoomOut" :size="14" />
          </button>
          <button class="btn btn--sm" type="button" @click="fitView">
            <AppIcon name="fit" :size="14" />
            适合窗口
          </button>
          <span class="stage__sep"></span>
          <button class="btn btn--sm" type="button" @click="assembleAll">
            <AppIcon name="refresh" :size="14" />
            自动组装
          </button>
          <button class="btn btn--sm" type="button" @click="scatterAll">
            <AppIcon name="expand" :size="14" />
            全部散开
          </button>
          <button class="btn btn--sm" type="button" @click="resetView">
            <AppIcon name="pin" :size="14" />
            复位
          </button>
          <span class="stage__state mono">
            已装入 {{ homeCount }}/{{ draggable.length }} · 缩放 {{ zoomPercent }}%
          </span>
        </div>

        <div class="stage__canvas" :class="{ 'is-dragging': draggingKey }">
          <svg
            ref="svgEl"
            viewBox="0 0 1000 520"
            role="img"
            aria-label="可拖动拼装的零件组装台"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @wheel.prevent="onWheel"
          >
            <g :transform="`translate(${view.x} ${view.y}) scale(${view.scale})`">
              <!-- 基准线与装配位引导 -->
              <g class="l-guide">
                <line x1="40" :y1="axisY" x2="960" :y2="axisY" class="cl" />
                <line
                  v-for="g in [geo.housing.x, geo.bushing.x, geo.gear.x, geo.flange.x, geo.cover.x]"
                  :key="'g' + g"
                  :x1="g"
                  y1="60"
                  :x2="g"
                  y2="480"
                  class="guide"
                />
              </g>

              <!-- 固定基准轴 -->
              <g class="l-shaft">
                <rect
                  :x="geo.shaft.x"
                  :y="axisY - geo.shaft.hh"
                  :width="geo.shaft.w"
                  :height="geo.shaft.hh * 2"
                  rx="10"
                />
                <line
                  :x1="geo.shaft.x"
                  :y1="axisY - geo.shaft.hh * 0.5"
                  :x2="geo.shaft.x + geo.shaft.w"
                  :y2="axisY - geo.shaft.hh * 0.5"
                  class="thin"
                />
                <line
                  :x1="geo.shaft.x"
                  :y1="axisY + geo.shaft.hh * 0.5"
                  :x2="geo.shaft.x + geo.shaft.w"
                  :y2="axisY + geo.shaft.hh * 0.5"
                  class="thin"
                />
              </g>

              <!-- 装配位虚线空位（未装入时显示） -->
              <g class="l-ghost">
                <rect
                  v-if="!isHome(partOf('housing'))"
                  :x="geo.housing.x - 14"
                  :y="axisY - geo.housing.hh"
                  :width="geo.housing.w + 28"
                  :height="geo.housing.hh * 2"
                  rx="12"
                />
                <rect
                  v-if="!isHome(partOf('bushing'))"
                  :x="geo.bushing.x"
                  :y="axisY - geo.bushing.hh"
                  :width="geo.bushing.w"
                  :height="geo.bushing.hh * 2"
                  rx="5"
                />
                <rect
                  v-if="!isHome(partOf('gear'))"
                  :x="geo.gear.x"
                  :y="axisY - geo.gear.hh"
                  :width="geo.gear.w"
                  :height="geo.gear.hh * 2"
                  rx="6"
                />
                <rect
                  v-if="!isHome(partOf('flange'))"
                  :x="geo.flange.x"
                  :y="axisY - geo.flange.hh"
                  :width="geo.flange.w"
                  :height="geo.flange.hh * 2"
                  rx="6"
                />
                <rect
                  v-if="!isHome(partOf('cover'))"
                  :x="geo.cover.x"
                  :y="axisY - geo.cover.hh"
                  :width="geo.cover.w + 18"
                  :height="geo.cover.hh * 2"
                  rx="6"
                />
              </g>

              <!-- 1 轴承座 -->
              <g
                data-part="housing"
                :transform="transformOf(partOf('housing'))"
                :class="partClass(partOf('housing'))"
                class="part"
              >
                <rect
                  :x="geo.housing.x"
                  :y="axisY - geo.housing.hh"
                  :width="geo.housing.w"
                  :height="geo.housing.hh * 2"
                  rx="12"
                />
                <circle :cx="geo.housing.x + geo.housing.w / 2" :cy="axisY" :r="geo.housing.bore" />
                <rect
                  :x="geo.housing.x - 14"
                  :y="axisY + geo.housing.hh - 6"
                  :width="geo.housing.w + 28"
                  height="14"
                  rx="7"
                />
                <circle :cx="geo.housing.x - 2" :cy="axisY + geo.housing.hh + 1" r="4" class="thin" />
                <circle
                  :cx="geo.housing.x + geo.housing.w + 2"
                  :cy="axisY + geo.housing.hh + 1"
                  r="4"
                  class="thin"
                />
              </g>

              <!-- 2 轴套 -->
              <g
                data-part="bushing"
                :transform="transformOf(partOf('bushing'))"
                :class="partClass(partOf('bushing'))"
                class="part"
              >
                <rect
                  :x="geo.bushing.x"
                  :y="axisY - geo.bushing.hh"
                  :width="geo.bushing.w"
                  :height="geo.bushing.hh * 2"
                  rx="5"
                />
                <rect
                  :x="geo.bushing.x"
                  :y="axisY - geo.bushing.hh * 0.42"
                  :width="geo.bushing.w"
                  :height="geo.bushing.hh * 0.84"
                  class="thin"
                />
              </g>

              <!-- 3 齿轮 -->
              <g
                data-part="gear"
                :transform="transformOf(partOf('gear'))"
                :class="partClass(partOf('gear'))"
                class="part"
              >
                <rect
                  :x="geo.gear.x"
                  :y="axisY - geo.gear.hh"
                  :width="geo.gear.w"
                  :height="geo.gear.hh * 2"
                  rx="6"
                />
                <line
                  v-for="(t, i) in gearTeeth"
                  :key="'gt' + i"
                  :x1="t.x"
                  :y1="axisY - geo.gear.hh"
                  :x2="t.x"
                  :y2="axisY - geo.gear.hh - 7"
                  class="thin"
                />
                <line
                  v-for="(t, i) in gearTeeth"
                  :key="'gb' + i"
                  :x1="t.x"
                  :y1="axisY + geo.gear.hh"
                  :x2="t.x"
                  :y2="axisY + geo.gear.hh + 7"
                  class="thin"
                />
                <circle :cx="geo.gear.cx" :cy="axisY" r="18" class="thin" />
              </g>

              <!-- 4 法兰盘（含螺栓组） -->
              <g
                data-part="flange"
                :transform="transformOf(partOf('flange'))"
                :class="partClass(partOf('flange'))"
                class="part"
              >
                <rect
                  :x="geo.flange.x"
                  :y="axisY - geo.flange.hh"
                  :width="geo.flange.w"
                  :height="geo.flange.hh * 2"
                  rx="6"
                />
                <line
                  :x1="geo.flange.x"
                  :y1="axisY - geo.flange.hh * 0.45"
                  :x2="geo.flange.x + geo.flange.w"
                  :y2="axisY - geo.flange.hh * 0.45"
                  class="thin"
                />
                <line
                  :x1="geo.flange.x"
                  :y1="axisY + geo.flange.hh * 0.45"
                  :x2="geo.flange.x + geo.flange.w"
                  :y2="axisY + geo.flange.hh * 0.45"
                  class="thin"
                />
                <g v-for="(y, i) in [axisY - geo.flange.hh + 16, axisY + geo.flange.hh - 16]" :key="'b' + i">
                  <rect :x="geo.flange.x - 16" :y="y - 7" width="16" height="14" rx="3" />
                  <path :d="`M${geo.flange.x - 16} ${y - 7} l-10 -3 v20 l10 -3 z`" />
                </g>
              </g>

              <!-- 5 端盖 -->
              <g
                data-part="cover"
                :transform="transformOf(partOf('cover'))"
                :class="partClass(partOf('cover'))"
                class="part"
              >
                <rect
                  :x="geo.cover.x"
                  :y="axisY - geo.cover.hh"
                  :width="geo.cover.w"
                  :height="geo.cover.hh * 2"
                  rx="6"
                />
                <rect
                  :x="geo.cover.x + geo.cover.w"
                  :y="axisY - geo.cover.hh * 0.5"
                  width="18"
                  :height="geo.cover.hh"
                  rx="5"
                />
                <circle :cx="geo.cover.x + geo.cover.w / 2" :cy="axisY - geo.cover.hh + 14" r="5" class="thin" />
                <circle :cx="geo.cover.x + geo.cover.w / 2" :cy="axisY + geo.cover.hh - 14" r="5" class="thin" />
              </g>
            </g>
          </svg>

          <!-- 装配完成印章 -->
          <transition name="stamp">
            <div v-if="allHome" class="done">
              <span class="stamp">装配完成</span>
              <span class="done__sub mono">{{ draggable.length }} 件已全部就位</span>
            </div>
          </transition>

          <p class="stage__hint mono">拖动零件靠近虚线位自动吸附 · 滚轮缩放 · 空白处拖动平移</p>
        </div>

        <!-- 装配清单 -->
        <ol class="steps-bar">
          <li
            v-for="p in parts"
            :key="p.key"
            class="steps-bar__item"
            :class="{ 'is-done': isHome(p), 'is-on': hoverPart === p.key || draggingKey === p.key }"
            @mouseenter="hoverPart = p.key"
            @mouseleave="hoverPart = ''"
            @click="p.fixed ? null : flash(p.key)"
          >
            <span class="steps-bar__no mono">{{ p.no }}</span>
            <span class="steps-bar__name">{{ p.name }}</span>
            <span class="steps-bar__size mono">
              {{ p.fixed ? '基准' : isHome(p) ? '已装入' : '待装入' }}
            </span>
          </li>
        </ol>
      </div>

      <!-- 右：页签面板 -->
      <aside class="picker corner-box">
        <header class="tabs">
          <button
            v-for="t in tabs"
            :key="t.key"
            class="tab"
            :class="{ 'is-on': activeTab === t.key }"
            type="button"
            :title="t.title"
            @click="goTab(t.key)"
          >
            {{ t.label }}
          </button>
          <span class="tabs__nav">
            <button class="tabs__btn" type="button" aria-label="上一个页签" @click="stepTab(-1)">
              <AppIcon name="chevronLeft" :size="14" />
            </button>
            <button class="tabs__btn" type="button" aria-label="下一个页签" @click="stepTab(1)">
              <AppIcon name="chevronRight" :size="14" />
            </button>
          </span>
        </header>

        <div class="ctx">
          <span class="ctx__name">{{ cat.name }}</span>
          <span class="ctx__dot"></span>
          <span class="mono">装配位 {{ slotName(cat.slot) }}</span>
          <span class="ctx__dot"></span>
          <span class="mono">当前 {{ current.label }} · 基准 {{ base.label }}</span>
        </div>

        <div class="tabbody">
          <transition :name="dir > 0 ? 'slide-left' : 'slide-right'" mode="out-in">
            <!-- ① 类别（20 类，可视 5 行 + 筛选） -->
            <section v-if="activeTab === 'cat'" key="cat" class="pane">
              <h4 class="pane__title">
                零件类别
                <span class="pane__sub mono">{{ filteredCats.length }} / {{ partCategories.length }}</span>
              </h4>

              <div class="filter">
                <AppIcon name="search" :size="14" />
                <input
                  v-model="catQuery"
                  class="filter__input"
                  type="search"
                  placeholder="筛选零件：名称 / 图号 / 装配位 / 材料"
                  aria-label="筛选零件"
                />
                <button v-if="catQuery" class="filter__clear" type="button" aria-label="清空" @click="catQuery = ''">
                  <AppIcon name="close" :size="13" />
                </button>
              </div>

              <ul class="cats">
                <li v-for="c in filteredCats" :key="c.key">
                  <button
                    class="cat"
                    :class="{ 'is-on': activeCat === c.key, 'is-used': activeBySlot[c.slot] === c.key }"
                    type="button"
                    @click="selectCategory(c.key)"
                    @mouseenter="hoverPart = c.slot"
                    @mouseleave="hoverPart = ''"
                  >
                    <AppIcon :name="c.icon" :size="16" />
                    <span class="cat__main">
                      <span class="cat__name">{{ c.name }}</span>
                      <span class="cat__meta mono">{{ c.code }} · {{ slotName(c.slot) }}</span>
                    </span>
                    <span v-if="activeBySlot[c.slot] === c.key" class="cat__used mono">装配中</span>
                    <AppIcon name="chevronRight" :size="14" class="cat__arrow" />
                  </button>
                </li>
                <li v-if="!filteredCats.length" class="cats__empty">没有匹配的零件，试试其它关键词。</li>
              </ul>

              <div class="pane__foot">
                <button class="btn btn--sm" type="button" @click="goTab('spec')">
                  查看 {{ cat.name }} 历史规格
                  <AppIcon name="chevronRight" :size="13" />
                </button>
              </div>
              <p class="pane__hint">
                共 {{ partCategories.length }} 类零件（类型可重复，按名称区分），列表最多显示 5 行、其余滚动；
                每类含 5 个历史规格，点击类别即把它装到对应装配位上。
              </p>
            </section>

            <!-- ② 历史规格 -->
            <section v-else-if="activeTab === 'spec'" key="spec" class="pane">
              <h4 class="pane__title">
                历史规格 · {{ cat.name }}
                <span class="pane__sub mono">{{ cat.field }}</span>
              </h4>
              <ul class="hist">
                <li v-for="(e, i) in cat.entries" :key="e.code">
                  <button
                    class="hist__row"
                    :class="{ 'is-on': pickedByCat[cat.key] === i }"
                    type="button"
                    @click="pickEntry(cat.key, i)"
                    @mouseenter="hoverPart = cat.slot"
                    @mouseleave="hoverPart = ''"
                  >
                    <span class="hist__dot" :class="{ 'is-base': baselineByCat[cat.key] === i }"></span>
                    <span class="hist__main">
                      <span class="hist__label">
                        {{ e.label }}
                        <em v-if="baselineByCat[cat.key] === i" class="hist__tag">基准</em>
                      </span>
                      <span class="hist__spec">{{ e.spec }}</span>
                      <span class="hist__meta mono">{{ e.code }} · {{ e.date }} · {{ e.rev }}</span>
                    </span>
                    <AppIcon name="check" :size="14" class="hist__check" />
                  </button>
                </li>
              </ul>

              <div class="tl" role="group" aria-label="历史版本时间线">
                <span class="tl__line"></span>
                <button
                  v-for="(e, i) in cat.entries"
                  :key="'tl' + i"
                  class="tl__dot"
                  :class="{ 'is-base': baselineByCat[cat.key] === i, 'is-cur': pickedByCat[cat.key] === i }"
                  :style="{ left: (i / (cat.entries.length - 1)) * 100 + '%' }"
                  type="button"
                  :title="`${e.rev} · ${e.date} · ${e.label}`"
                  @click="pickEntry(cat.key, i)"
                >
                  <em class="tl__label mono">{{ e.rev }}</em>
                </button>
              </div>
              <p class="tl__dates mono">
                <span>{{ cat.entries[0].date }}</span>
                <span>{{ cat.entries[cat.entries.length - 1].date }}</span>
              </p>

              <div class="hist__actions">
                <button class="btn btn--sm" type="button" @click="setBaseline">
                  <AppIcon name="pin" :size="13" />
                  设为基准
                </button>
                <button class="btn btn--sm" type="button" @click="resetBaseline">
                  <AppIcon name="refresh" :size="13" />
                  重置
                </button>
                <button class="btn btn--sm" type="button" @click="goTab('diff')">
                  看差异
                  <AppIcon name="chevronRight" :size="13" />
                </button>
              </div>
            </section>

            <!-- ③ 对比结果 -->
            <section v-else-if="activeTab === 'diff'" key="diff" class="pane">
              <h4 class="pane__title">对比结果</h4>

              <div class="cmpviz">
                <svg viewBox="0 0 150 76" aria-hidden="true">
                  <circle cx="52" cy="38" :r="cmpR(base.dia)" class="cmpviz__base" />
                  <circle cx="52" cy="38" :r="cmpR(current.dia)" class="cmpviz__cur" />
                  <line x1="52" y1="4" x2="52" y2="72" class="cl" />
                  <line x1="18" y1="38" x2="86" y2="38" class="cl" />
                  <text x="96" y="30" class="tm">基准 {{ base.label }}</text>
                  <text x="96" y="50" class="tm">当前 {{ current.label }}</text>
                </svg>
              </div>

              <table class="diff">
                <tbody>
                  <tr v-for="r in diffRows" :key="r.label" :class="{ 'is-changed': r.changed }">
                    <th>{{ r.label }}</th>
                    <td class="mono diff__base">{{ r.base }}</td>
                    <td class="mono diff__cur">{{ r.cur }}</td>
                    <td class="mono diff__delta">{{ r.delta }}</td>
                  </tr>
                </tbody>
              </table>

              <p class="pane__note">{{ current.note }}</p>
              <p class="pane__code mono">{{ current.code }} · 修订 {{ current.rev }}</p>
            </section>

            <!-- ④ 生成 BOM · 上载至 M3（外观，不做功能） -->
            <section v-else key="upload" class="pane">
              <h4 class="pane__title">
                上载至 M3
                <span class="pane__sub mono">BOM / 物料主数据</span>
              </h4>

              <BomPanel
                action="生成"
                doc-suffix="014"
                :rows="bomRows"
                lead="依据左侧组装台当前的 5 个零件与其历史规格生成 BOM，确认后上载至 M3。"
                hint="BOM 按图号自动匹配 M3 物料编码；上载后写入物料主数据与版本记录，同名不同版本进入校核队列，通过后回写 M3 版本号。"
              />
            </section>
          </transition>
        </div>
      </aside>
          </div>
          <!-- /.cmp-row -->
        </div>
        <!-- /.tool -->
  </div>
</template>

<style scoped>

/* 嵌入第 02 区页签后的容器 */
.cm {
  display: grid;
  gap: 10px;
}
.cm__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 9px 12px;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: var(--paper-2);
}
.cm__badge {
  padding: 2px 8px;
  border-radius: var(--r-pill);
  background: var(--accent);
  color: #fff;
  font-size: 0.5rem;
}
.cm__goal {
  font-size: 0.9rem;
  font-weight: 700;
}
.cm__why {
  font-size: 0.74rem;
  color: var(--ink-3);
  flex: 1;
  min-width: 200px;
}
/* 3 : 1 —— 行高以左侧组装台为基准（约占视口 70%） */
.cmp-row {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: clamp(12px, 1.6vw, 22px);
  height: clamp(520px, 70vh, 880px);
}

/* 抬头 */

/* ===== chatbot 外壳 ===== */

/* 对话头部 */

/* 消息流 */

/* 工具视图 */
.tool {
  position: relative;
  padding: 10px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-md) 0 var(--r-md) 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.5)),
    var(--paper);
  box-shadow: var(--shadow-s);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.tool.is-flash {
  border-color: var(--accent-ink);
  box-shadow: 0 0 0 4px var(--accent-3), var(--shadow-m);
}
.tool__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 2px 10px;
  border-bottom: 1px solid var(--rule);
  flex-wrap: wrap;
}
.tool__badge {
  padding: 2px 8px;
  border-radius: var(--r-pill);
  background: var(--ink);
  color: var(--paper);
  font-size: 0.5rem;
}
.tool__name {
  font-size: 0.98rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.tool__meta {
  margin-left: auto;
  font-size: 0.54rem;
}

/* 需求输入 */

/* 3 : 1 —— 行高以左侧组装台为基准（约占视口 70%） */

/* 左侧组装台 */
.stage {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: 12px;
}
.stage__bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--rule);
}
.stage__sep {
  width: 1px;
  height: 18px;
  margin: 0 4px;
  background: var(--rule);
}
.stage__state {
  margin-left: auto;
  font-size: 0.6rem;
  color: var(--accent-ink);
}
.stage__canvas {
  position: relative;
  flex: 1;
  min-height: 0;
  border-radius: var(--r-md) 0 var(--r-md) 0;
  background:
    radial-gradient(rgba(29, 26, 22, 0.05) 1px, transparent 1.2px) 0 0 / 14px 14px,
    linear-gradient(180deg, #ffffff, var(--paper-2));
  overflow: hidden;
}
.stage__canvas.is-dragging {
  cursor: grabbing;
}
.stage__hint {
  position: absolute;
  left: 12px;
  bottom: 8px;
  font-size: 0.5rem;
  pointer-events: none;
}
.stage__canvas svg {
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
  touch-action: none;
  user-select: none;
}
.stage__canvas svg:active {
  cursor: grabbing;
}

/* 图纸元素 */
.stage__canvas :deep(line),
.stage__canvas :deep(circle),
.stage__canvas :deep(rect),
.stage__canvas :deep(path) {
  fill: none;
  stroke: var(--ink);
  stroke-width: 1.5;
  stroke-linejoin: round;
}
.stage__canvas :deep(.thin) {
  stroke-width: 0.8;
  stroke: var(--ink-2);
}
.stage__canvas :deep(.cl) {
  stroke: var(--ink-4);
  stroke-width: 0.8;
  stroke-dasharray: 16 3 2 3;
}
.stage__canvas :deep(.guide) {
  stroke: var(--rule-2);
  stroke-width: 0.7;
  stroke-dasharray: 3 5;
}
.stage__canvas :deep(.l-ghost rect) {
  stroke: var(--accent-2);
  stroke-width: 1.1;
  stroke-dasharray: 5 4;
}
.stage__canvas :deep(.part) {
  cursor: grab;
}
.stage__canvas :deep(.part.is-float) {
  stroke: var(--ink-2);
}
.stage__canvas :deep(.part.is-hot) rect,
.stage__canvas :deep(.part.is-hot) circle,
.stage__canvas :deep(.part.is-hot) path,
.stage__canvas :deep(.part.is-hot) line {
  stroke: var(--accent-ink);
  stroke-width: 2.4;
}
.stage__canvas :deep(.part.is-flash) rect,
.stage__canvas :deep(.part.is-flash) circle,
.stage__canvas :deep(.part.is-flash) path {
  stroke: var(--accent-ink);
  stroke-width: 2.8;
}

/* 装配完成 */
.done {
  position: absolute;
  top: 12px;
  right: 14px;
  display: grid;
  justify-items: end;
  gap: 4px;
  pointer-events: none;
}
.done__sub {
  font-size: 0.5rem;
}
.stamp-enter-active,
.stamp-leave-active {
  transition: opacity 0.3s ease, transform 0.34s cubic-bezier(0.2, 0.7, 0.3, 1);
}
.stamp-enter-from,
.stamp-leave-to {
  opacity: 0;
  transform: scale(0.86) rotate(-8deg);
}

/* 装配清单 */
.steps-bar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}
.steps-bar__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px dashed var(--rule-2);
  border-radius: var(--r-pill);
  font-size: 0.78rem;
  color: var(--ink-3);
  cursor: pointer;
  transition: background 0.25s ease, color 0.25s ease, border-color 0.25s ease;
}
.steps-bar__item.is-done {
  border-style: solid;
  border-color: var(--accent-2);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.steps-bar__item.is-on {
  border-style: solid;
  border-color: var(--accent-ink);
  color: var(--accent-ink);
}
.steps-bar__no {
  font-size: 0.54rem;
}
.steps-bar__size {
  font-size: 0.54rem;
  color: var(--ink-4);
}
.steps-bar__item.is-done .steps-bar__size {
  color: var(--accent-ink);
}

/* 右侧页签面板 */
.picker {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}
.tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 7px 8px 0;
  border-bottom: 1px solid var(--rule);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0));
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs::-webkit-scrollbar {
  display: none;
}
.tab {
  flex: none;
  padding: 7px 11px;
  font-size: 0.82rem;
  color: var(--ink-3);
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: var(--r-sm) var(--r-sm) 0 0;
  transition: background 0.22s ease, color 0.22s ease, border-color 0.22s ease;
}
.tab:hover {
  color: var(--accent-ink);
  background: var(--accent-3);
}
.tab.is-on {
  position: relative;
  background: var(--surface);
  border-color: var(--rule);
  color: var(--ink);
  font-weight: 700;
}
.tab.is-on::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: var(--surface);
}
.tabs__nav {
  margin-left: auto;
  display: flex;
  gap: 4px;
  padding-bottom: 4px;
}
.tabs__btn {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-xs);
  color: var(--ink-2);
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.tabs__btn:hover {
  background: var(--accent-3);
  border-color: var(--accent-2);
  color: var(--accent-ink);
}

/* 上下文条 */
.ctx {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-bottom: 1px dashed var(--rule);
  font-size: 0.6rem;
  color: var(--ink-3);
  overflow: hidden;
  white-space: nowrap;
}
.ctx__name {
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--ink);
}
.ctx__dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);
  flex: none;
}

/* 页签内容 */
.tabbody {
  position: relative;
  flex: 1;
  min-height: 0;
}
.pane {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  padding: 12px;
  scrollbar-width: thin;
  scrollbar-color: var(--rule-2) transparent;
}
.pane::-webkit-scrollbar {
  width: 8px;
}
.pane::-webkit-scrollbar-thumb {
  background: var(--rule-2);
  border: 3px solid transparent;
  background-clip: content-box;
  border-radius: var(--r-pill);
}
.pane__title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 0.94rem;
  letter-spacing: 0.1em;
  padding-bottom: 6px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--rule);
}
.pane__sub {
  margin-left: auto;
  font-size: 0.54rem;
}
.pane__subtitle {
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  color: var(--ink-2);
  margin: 14px 0 6px;
}
.pane__foot {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.pane__hint {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--rule);
  font-size: 0.76rem;
  color: var(--ink-3);
  line-height: 1.7;
}
.pane__note {
  margin-top: 10px;
  font-size: 0.78rem;
  color: var(--ink-2);
  line-height: 1.6;
}
.pane__code {
  margin-top: 4px;
  font-size: 0.54rem;
}

/* 页签切换动画 */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: opacity 0.2s ease, transform 0.26s cubic-bezier(0.2, 0.7, 0.3, 1);
}
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(22px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-22px);
}
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-22px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(22px);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.24s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 筛选输入行 */
.filter {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  margin-bottom: 10px;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: var(--surface);
  color: var(--ink-3);
  transition: border-color 0.22s ease, box-shadow 0.22s ease;
}
.filter:focus-within {
  border-color: var(--accent-ink);
  box-shadow: 0 0 0 3px var(--accent-3);
}
.filter__input {
  flex: 1;
  min-width: 0;
  border: none;
  background: none;
  outline: none;
  font-family: var(--serif);
  font-size: 0.84rem;
  color: var(--ink);
}
.filter__input::placeholder {
  color: var(--ink-4);
}
.filter__clear {
  display: grid;
  place-items: center;
  color: var(--ink-4);
}
.filter__clear:hover {
  color: var(--accent-ink);
}

/* 类别列表：可视 5 行，其余滚动 */
.cats {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 230px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--rule-2) transparent;
}
.cats::-webkit-scrollbar {
  width: 8px;
}
.cats::-webkit-scrollbar-thumb {
  background: var(--rule-2);
  border: 3px solid transparent;
  background-clip: content-box;
  border-radius: var(--r-pill);
}
.cats__empty {
  padding: 12px 4px;
  font-size: 0.8rem;
  color: var(--ink-4);
}
.cat {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  height: 44px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-bottom: 1px dashed var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  color: var(--ink-2);
  text-align: left;
  transition: background 0.22s ease, color 0.22s ease, border-color 0.22s ease;
}
.cat:hover {
  background: var(--accent-3);
  color: var(--accent-ink);
}
.cat.is-on {
  background: var(--accent-3);
  border-color: var(--accent-2);
  color: var(--accent-ink);
  font-weight: 700;
}
.cat__main {
  display: grid;
  gap: 1px;
  min-width: 0;
  flex: 1;
}
.cat__name {
  font-size: 0.88rem;
  line-height: 1.2;
}
.cat__meta {
  font-size: 0.5rem;
}
.cat__used {
  font-size: 0.48rem;
  padding: 1px 5px;
  border-radius: var(--r-pill);
  background: var(--accent);
  color: #fff;
  white-space: nowrap;
}
.cat__arrow {
  color: var(--ink-4);
  flex: none;
}
.cat:hover .cat__arrow,
.cat.is-on .cat__arrow {
  color: var(--accent-ink);
}

/* 历史规格 */
.hist {
  margin: 0;
  padding: 0;
  list-style: none;
}
.hist__row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  padding: 9px 8px;
  text-align: left;
  border-bottom: 1px dashed var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  transition: background 0.22s ease, color 0.22s ease;
}
.hist__row:hover {
  background: var(--accent-3);
}
.hist__row.is-on {
  background: var(--accent-3);
  color: var(--accent-ink);
}
.hist__dot {
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border: 1px solid var(--rule-2);
  border-radius: 50%;
  flex: none;
}
.hist__dot.is-base {
  background: var(--ink);
  border-color: var(--ink);
}
.hist__row.is-on .hist__dot {
  border-color: var(--accent-ink);
  background: var(--accent);
}
.hist__main {
  display: grid;
  gap: 1px;
  min-width: 0;
}
.hist__label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 700;
}
.hist__tag {
  font-family: var(--mono);
  font-size: 0.5rem;
  font-style: normal;
  letter-spacing: 0.1em;
  padding: 1px 5px;
  border-radius: var(--r-pill);
  background: var(--ink);
  color: var(--paper);
}
.hist__spec {
  font-size: 0.74rem;
  color: var(--ink-3);
}
.hist__meta {
  font-size: 0.5rem;
}
.hist__check {
  margin-left: auto;
  margin-top: 4px;
  color: var(--accent-ink);
  opacity: 0;
  transition: opacity 0.2s ease;
}
.hist__row.is-on .hist__check {
  opacity: 1;
}
.hist__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid var(--rule);
}

/* 时间线 */
.tl {
  position: relative;
  height: 34px;
  margin: 12px 8px 0;
}
.tl__line {
  position: absolute;
  left: 0;
  right: 0;
  top: 9px;
  height: 2px;
  border-radius: var(--r-pill);
  background: var(--paper-4);
}
.tl__dot {
  position: absolute;
  top: 4px;
  width: 12px;
  height: 12px;
  margin-left: -6px;
  border: 1px solid var(--rule-2);
  border-radius: 50%;
  background: var(--surface);
  transition: background 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
}
.tl__dot:hover {
  border-color: var(--accent-ink);
  transform: scale(1.15);
}
.tl__dot.is-base {
  background: var(--ink);
  border-color: var(--ink);
}
.tl__dot.is-cur {
  background: var(--accent);
  border-color: var(--accent-ink);
  box-shadow: 0 0 0 3px var(--accent-3);
}
.tl__label {
  position: absolute;
  left: 50%;
  top: 14px;
  transform: translateX(-50%);
  font-size: 0.5rem;
  font-style: normal;
  color: var(--ink-4);
  white-space: nowrap;
}
.tl__dot.is-cur .tl__label {
  color: var(--accent-ink);
  font-weight: 700;
}
.tl__dates {
  display: flex;
  justify-content: space-between;
  font-size: 0.5rem;
  margin-bottom: 6px;
}

/* 对比 */
.cmpviz {
  margin-bottom: 8px;
}
.cmpviz svg {
  width: 100%;
  height: auto;
}
.cmpviz :deep(circle) {
  fill: none;
}
.cmpviz :deep(.cmpviz__base) {
  stroke: var(--ink-4);
  stroke-width: 1.2;
  stroke-dasharray: 4 3;
}
.cmpviz :deep(.cmpviz__cur) {
  stroke: var(--accent-ink);
  stroke-width: 1.8;
}
.cmpviz :deep(.cl) {
  stroke: var(--rule-2);
  stroke-width: 0.8;
  stroke-dasharray: 12 3 2 3;
}
.cmpviz :deep(text) {
  fill: var(--ink-3);
  font-family: var(--mono);
  font-size: 10px;
}
.diff {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.76rem;
}
.diff th {
  text-align: left;
  font-weight: 400;
  color: var(--ink-3);
  padding: 5px 4px 5px 0;
  border-bottom: 1px dotted var(--rule);
}
.diff td {
  padding: 5px 4px;
  border-bottom: 1px dotted var(--rule);
  white-space: nowrap;
}
.diff tr.is-changed .diff__delta {
  color: var(--accent-ink);
  font-weight: 700;
}
.diff__base {
  color: var(--ink-4);
}
.diff__delta {
  text-align: right;
  font-size: 0.66rem;
}

@media (max-width: 1180px) {
  .cmp-row {
    grid-template-columns: 3fr 1.15fr;
  }
}
@media (max-width: 980px) {
  .cmp-row {
    grid-template-columns: 1fr;
    height: auto;
  }
  .stage {
    height: clamp(420px, 62vh, 620px);
  }
  .picker {
    height: clamp(420px, 62vh, 620px);
  }
  .cmp-head {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .cmp-head__meta {
    grid-column: 1 / -1;
    text-align: left;
    justify-content: flex-start;
    gap: 14px;
  }
}
</style>
