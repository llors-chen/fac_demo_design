<script setup>
/**
 * DWG 在线浏览窗口（第三份图纸）
 *
 * - 内置一张示例图纸（法兰盘装配图），支持缩放、平移、图层开关、测量、全屏
 * - 若传入 embedUrl（真实 DWG 在线服务地址），则改为 iframe 嵌入
 *   例如 ODA / Autodesk Platform Services / 内网转换服务：<DwgViewer embed-url="https://…" />
 */
import { computed, onMounted, reactive, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import { hatchLines } from '../utils/hatch.js'

const props = defineProps({
  fileName: { type: String, default: '法兰盘装配图.dwg' },
  rev: { type: String, default: 'V3' },
  sheet: { type: String, default: 'A2 · 1:2' },
  embedUrl: { type: String, default: '' },
})

/* ------------------------------ 视图状态 ------------------------------ */
const svgEl = ref(null)
const canvasEl = ref(null)
const loading = ref(true)
const cursor = reactive({ x: 0, y: 0, inside: false })
const view = reactive({ scale: 1, x: 0, y: 0 })
const panMode = ref(false)
const measureMode = ref(false)
const measurePts = ref([])
const layerPanel = ref(false)

const layers = reactive({
  frame: true,
  outline: true,
  center: true,
  dim: true,
  hatch: true,
})
const layerList = [
  { key: 'outline', label: '轮廓线', color: 'ink' },
  { key: 'center', label: '中心线', color: 'gray' },
  { key: 'dim', label: '尺寸标注', color: 'ink' },
  { key: 'hatch', label: '剖面线', color: 'gray' },
  { key: 'frame', label: '图框与标题栏', color: 'ink' },
]

const zoomPercent = computed(() => Math.round(view.scale * 100))
/** 图纸单位换算（示例：1 用户单位 ≈ 0.6 mm） */
const MM_PER_UNIT = 0.6
const measureLength = computed(() => {
  if (measurePts.value.length < 2) return 0
  const [a, b] = measurePts.value
  return Math.hypot(b.x - a.x, b.y - a.y) * MM_PER_UNIT
})

/* ------------------------------ 图纸几何 ------------------------------ */
const front = { cx: 250, cy: 270, r: 155, bolt: 110, hole: 36 }
const r2 = (n) => Math.round(n * 100) / 100
const boltHoles = Array.from({ length: 8 }, (_, i) => {
  const a = ((22.5 + i * 45) * Math.PI) / 180
  return { x: r2(front.cx + front.bolt * Math.cos(a)), y: r2(front.cy + front.bolt * Math.sin(a)) }
})

const secUpper = 'M540 120 L580 120 L580 190 L640 190 L640 235 L540 235 Z'
const secLower = 'M540 305 L640 305 L640 350 L580 350 L580 420 L540 420 Z'
const secHatch = hatchLines(540, 120, 100, 300, { gap: 14 })

/* ------------------------------ 交互逻辑 ------------------------------ */
function toUser(evt) {
  const svg = svgEl.value
  if (!svg) return { x: 0, y: 0 }
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: 0, y: 0 }
  const inv = ctm.inverse()
  const pt = new DOMPoint(evt.clientX, evt.clientY).matrixTransform(inv)
  return { x: pt.x, y: pt.y }
}

function onMove(evt) {
  const p = toUser(evt)
  cursor.x = Math.round(p.x * 10) / 10
  cursor.y = Math.round(p.y * 10) / 10
  cursor.inside = true
  if (drag.active) {
    const ctm = svgEl.value?.getScreenCTM()
    const k = ctm ? ctm.a || 1 : 1
    view.x = drag.startX + (evt.clientX - drag.cx) / k
    view.y = drag.startY + (evt.clientY - drag.cy) / k
  }
}

const drag = reactive({ active: false, cx: 0, cy: 0, startX: 0, startY: 0 })

function onDown(evt) {
  if (evt.button !== 0) return
  if (measureMode.value) {
    const p = toUser(evt)
    measurePts.value = measurePts.value.length >= 2 ? [p] : [...measurePts.value, p]
    return
  }
  drag.active = true
  drag.cx = evt.clientX
  drag.cy = evt.clientY
  drag.startX = view.x
  drag.startY = view.y
  canvasEl.value?.setPointerCapture?.(evt.pointerId)
}

function onUp(evt) {
  drag.active = false
  canvasEl.value?.releasePointerCapture?.(evt.pointerId)
}

function onWheel(evt) {
  const p = toUser(evt)
  const factor = Math.exp(-evt.deltaY * 0.0016)
  const next = Math.min(6, Math.max(0.4, view.scale * factor))
  const k = next / view.scale
  view.x = p.x - k * (p.x - view.x)
  view.y = p.y - k * (p.y - view.y)
  view.scale = next
}

function zoomBy(factor) {
  const cx = 500
  const cy = 320
  const next = Math.min(6, Math.max(0.4, view.scale * factor))
  const k = next / view.scale
  view.x = cx - k * (cx - view.x)
  view.y = cy - k * (cy - view.y)
  view.scale = next
}

function fit() {
  view.scale = 1
  view.x = 0
  view.y = 0
}

async function toggleFullscreen() {
  const el = canvasEl.value
  if (!el) return
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await el.requestFullscreen()
  } catch {
    /* 浏览器不支持时忽略 */
  }
}

onMounted(() => {
  window.setTimeout(() => (loading.value = false), 620)
})

defineExpose({ fit, zoomBy })
</script>

<template>
  <div class="viewer">
    <!-- 文件标签 -->
    <div class="tabs">
      <span class="tabs__file is-on">
        <AppIcon name="file" :size="14" />
        {{ fileName }}
        <em class="tabs__badge mono">{{ rev }}</em>
      </span>
      <button class="tabs__file" type="button">
        <AppIcon name="file" :size="14" />
        端盖-A2.dwg
      </button>
      <button class="tabs__file" type="button">
        <AppIcon name="file" :size="14" />
        主动轴.dwg
      </button>
      <span class="tabs__spacer"></span>
      <span class="tabs__meta mono">{{ sheet }} · mm · 修订 {{ rev }}</span>
    </div>

    <!-- 工具栏 -->
    <div class="tools">
      <button class="tools__btn" type="button" title="放大" @click="zoomBy(1.25)">
        <AppIcon name="zoomIn" :size="16" />
      </button>
      <button class="tools__btn" type="button" title="缩小" @click="zoomBy(0.8)">
        <AppIcon name="zoomOut" :size="16" />
      </button>
      <button class="tools__btn" type="button" title="适合窗口" @click="fit">
        <AppIcon name="fit" :size="16" />
      </button>
      <span class="tools__sep"></span>
      <button
        class="tools__btn"
        :class="{ 'is-on': panMode }"
        type="button"
        title="平移"
        @click="panMode = !panMode"
      >
        <AppIcon name="hand" :size="16" />
      </button>
      <button
        class="tools__btn"
        :class="{ 'is-on': measureMode }"
        type="button"
        title="测量"
        @click="((measureMode = !measureMode), (measurePts = []))"
      >
        <AppIcon name="ruler" :size="16" />
      </button>
      <button
        class="tools__btn"
        :class="{ 'is-on': layerPanel }"
        type="button"
        title="图层"
        @click="layerPanel = !layerPanel"
      >
        <AppIcon name="layers" :size="16" />
      </button>
      <span class="tools__sep"></span>
      <button class="tools__btn" type="button" title="全屏" @click="toggleFullscreen">
        <AppIcon name="expand" :size="16" />
      </button>
      <button class="tools__btn" type="button" title="重绘">
        <AppIcon name="refresh" :size="16" />
      </button>

      <span class="tools__hint mono">
        {{ measureMode ? '点击两点测量距离' : '滚轮缩放 · 拖拽平移' }}
      </span>
    </div>

    <!-- 图面 -->
    <div
      ref="canvasEl"
      class="canvas"
      :class="{ 'is-pan': panMode, 'is-measure': measureMode, 'is-dragging': drag.active }"
      @pointermove="onMove"
      @pointerleave="cursor.inside = false"
      @pointerdown="onDown"
      @pointerup="onUp"
      @pointercancel="onUp"
      @wheel.prevent="onWheel"
    >
      <!-- 真实 DWG 在线服务：配置 embedUrl 后启用 -->
      <iframe
        v-if="props.embedUrl"
        class="canvas__frame"
        :src="props.embedUrl"
        :title="fileName"
        loading="lazy"
      ></iframe>

      <svg v-else ref="svgEl" class="dwg" viewBox="0 0 1000 640" role="img" aria-label="法兰盘装配图">
        <defs>
          <clipPath id="flangeSec">
            <path :d="secUpper" />
            <path :d="secLower" />
          </clipPath>
        </defs>
        <g :transform="`translate(${view.x} ${view.y}) scale(${view.scale})`">
          <!-- 图框与标题栏 -->
          <g v-show="layers.frame" class="l-frame">
            <rect x="10" y="10" width="980" height="620" class="bold" />
            <rect x="24" y="24" width="952" height="592" class="thin" />
            <rect x="700" y="460" width="276" height="156" class="bold" />
            <line x1="700" y1="494" x2="976" y2="494" />
            <line x1="700" y1="524" x2="976" y2="524" />
            <line x1="700" y1="554" x2="976" y2="554" />
            <line x1="700" y1="584" x2="976" y2="584" />
            <line x1="760" y1="494" x2="760" y2="616" class="thin" />
            <line x1="850" y1="494" x2="850" y2="616" class="thin" />
            <line x1="910" y1="494" x2="910" y2="616" class="thin" />
            <text x="712" y="484" class="tt">法兰盘 装配图</text>
            <text x="708" y="514" class="tl">图号</text>
            <text x="768" y="514" class="tm">NY-FL-2026-008</text>
            <text x="858" y="514" class="tl">比例</text>
            <text x="918" y="514" class="tm">1 : 2</text>
            <text x="708" y="544" class="tl">材料</text>
            <text x="768" y="544" class="tm">HT200</text>
            <text x="858" y="544" class="tl">重量</text>
            <text x="918" y="544" class="tm">14.2 kg</text>
            <text x="708" y="574" class="tl">设计</text>
            <text x="768" y="574" class="tm">张工</text>
            <text x="858" y="574" class="tl">审核</text>
            <text x="918" y="574" class="tm">李工</text>
            <text x="708" y="606" class="tl">版本</text>
            <text x="768" y="606" class="tm">V3</text>
            <text x="858" y="606" class="tl">日期</text>
            <text x="918" y="606" class="tm">2026-02-20</text>
          </g>

          <!-- 主视图 -->
          <g v-show="layers.outline" class="l-outline">
            <circle :cx="front.cx" :cy="front.cy" :r="front.r" class="bold" />
            <circle :cx="front.cx" :cy="front.cy" r="140" class="thin" />
            <circle :cx="front.cx" :cy="front.cy" r="136" class="thin" />
            <circle :cx="front.cx" :cy="front.cy" :r="front.hole" class="bold" />
            <circle
              v-for="(h, i) in boltHoles"
              :key="'v' + i"
              :cx="h.x"
              :cy="h.y"
              r="9"
            />
            <!-- 剖视图轮廓 -->
            <path :d="secUpper" class="bold" />
            <path :d="secLower" class="bold" />
          </g>

          <!-- 中心线 -->
          <g v-show="layers.center" class="l-center">
            <line :x1="front.cx - 200" :y1="front.cy" :x2="front.cx + 200" :y2="front.cy" class="cl" />
            <line :x1="front.cx" :y1="front.cy - 200" :x2="front.cx" :y2="front.cy + 200" class="cl" />
            <circle :cx="front.cx" :cy="front.cy" :r="front.bolt" class="cl" />
            <line x1="512" y1="270" x2="680" y2="270" class="cl" />
            <line x1="560" y1="100" x2="560" y2="440" class="cl" />
          </g>

          <!-- 剖面线 -->
          <g v-show="layers.hatch" class="l-hatch">
            <g clip-path="url(#flangeSec)">
              <line
                v-for="(h, i) in secHatch"
                :key="'h' + i"
                :x1="h.x1"
                :y1="h.y1"
                :x2="h.x2"
                :y2="h.y2"
              />
            </g>
          </g>

          <!-- 尺寸标注 -->
          <g v-show="layers.dim" class="l-dim">
            <!-- 主视图 ⌀310 -->
            <line x1="95" y1="430" x2="95" y2="470" class="thin" />
            <line x1="405" y1="430" x2="405" y2="470" class="thin" />
            <line x1="95" y1="462" x2="405" y2="462" />
            <polygon points="95,462 104.2,459.8 104.2,464.2" class="fill" />
            <polygon points="405,462 395.8,459.8 395.8,464.2" class="fill" />
            <text x="250" y="455" text-anchor="middle" class="tm">⌀310</text>

            <!-- 螺栓孔组 -->
            <line x1="424" y1="146" x2="334" y2="190" />
            <text x="430" y="140" class="tm">8×⌀18 EQS</text>
            <text x="430" y="158" class="tm">分度圆 ⌀220</text>

            <!-- 剖视图尺寸 -->
            <line x1="540" y1="420" x2="540" y2="500" class="thin" />
            <line x1="580" y1="420" x2="580" y2="470" class="thin" />
            <line x1="540" y1="452" x2="580" y2="452" />
            <polygon points="540,452 549.2,449.8 549.2,454.2" class="fill" />
            <polygon points="580,452 570.8,449.8 570.8,454.2" class="fill" />
            <text x="560" y="445" text-anchor="middle" class="tm">40</text>

            <line x1="540" y1="500" x2="540" y2="500" />
            <line x1="540" y1="498" x2="640" y2="498" />
            <polygon points="540,498 549.2,495.8 549.2,500.2" class="fill" />
            <polygon points="640,498 630.8,495.8 630.8,500.2" class="fill" />
            <text x="590" y="491" text-anchor="middle" class="tm">100</text>

            <!-- 孔径与凸台 -->
            <line x1="538" y1="237" x2="470" y2="222" />
            <text x="416" y="218" class="tm">⌀72</text>
            <line x1="642" y1="190" x2="700" y2="160" />
            <text x="704" y="156" class="tm">⌀160</text>

            <!-- 密封槽 -->
            <line x1="150" y1="118" x2="96" y2="70" />
            <text x="100" y="64" class="tm">密封槽 2×1.5</text>
          </g>

          <!-- 测量 -->
          <g v-if="measurePts.length" class="l-measure">
            <line
              v-if="measurePts.length === 2"
              :x1="measurePts[0].x"
              :y1="measurePts[0].y"
              :x2="measurePts[1].x"
              :y2="measurePts[1].y"
            />
            <circle v-for="(p, i) in measurePts" :key="'m' + i" :cx="p.x" :cy="p.y" r="4" />
            <text
              v-if="measurePts.length === 2"
              :x="(measurePts[0].x + measurePts[1].x) / 2 + 10"
              :y="(measurePts[0].y + measurePts[1].y) / 2 - 8"
              class="tm"
            >
              {{ measureLength.toFixed(1) }} mm
            </text>
          </g>
        </g>
      </svg>

      <!-- 图层面板 -->
      <transition name="pop">
        <div v-show="layerPanel" class="layerpanel">
          <p class="layerpanel__title mono">图层</p>
          <label v-for="l in layerList" :key="l.key" class="layerpanel__row">
            <input v-model="layers[l.key]" type="checkbox" />
            <span class="layerpanel__swatch" :class="'is-' + l.color"></span>
            <span>{{ l.label }}</span>
          </label>
          <p class="layerpanel__foot mono">共 {{ layerList.length }} 个图层</p>
        </div>
      </transition>

      <!-- 加载态 -->
      <transition name="fade">
        <div v-if="loading" class="loader">
          <AppIcon name="refresh" :size="22" class="loader__spin" />
          <p class="loader__text">正在解析 DWG 并生成视图…</p>
          <div class="loader__track"><span></span></div>
        </div>
      </transition>

      <!-- 比例尺 / 提示 -->
      <div class="overlay overlay--scale">
        <span class="overlay__bar"></span>
        <span class="mono">50 mm</span>
      </div>
      <div v-if="measureMode" class="overlay overlay--tip mono">测量模式：依次点击两点</div>
    </div>

    <!-- 状态栏 -->
    <div class="statusbar">
      <span class="mono">X: {{ cursor.inside ? cursor.x.toFixed(1) : '—' }}</span>
      <span class="mono">Y: {{ cursor.inside ? cursor.y.toFixed(1) : '—' }}</span>
      <span class="statusbar__sep"></span>
      <span class="mono">缩放 {{ zoomPercent }}%</span>
      <span class="mono">单位 mm</span>
      <span class="mono">图层 {{ Object.values(layers).filter(Boolean).length }}/{{ layerList.length }}</span>
      <span class="statusbar__spacer"></span>
      <button v-if="measurePts.length" class="linkbtn statusbar__link" type="button" @click="measurePts = []">
        清除测量
      </button>
      <span class="statusbar__dot" :class="{ 'is-on': !loading }"></span>
      <span class="mono">{{ loading ? '加载中' : '已就绪' }}</span>
    </div>
  </div>
</template>

<style scoped>
.viewer {
  display: flex;
  flex-direction: column;
  background: var(--paper-2);
  border: 1px solid var(--rule);
  border-radius: 0 var(--r-md) 0 var(--r-md);
  box-shadow: var(--shadow-m);
  overflow: hidden;
  min-height: 0;
}

/* 文件标签 */
.tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px 0;
  border-bottom: 1px solid var(--rule-2);
  background: var(--paper-3);
  overflow-x: auto;
}
.tabs__file {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  font-size: 0.84rem;
  color: var(--ink-3);
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: var(--r-sm) var(--r-sm) 0 0;
  white-space: nowrap;
  transition: background 0.2s ease, color 0.2s ease;
}
.tabs__file:hover {
  color: var(--accent-ink);
  background: var(--accent-3);
}
.tabs__file.is-on {
  background: var(--paper);
  border-color: var(--rule-2);
  color: var(--ink);
  font-weight: 700;
  position: relative;
}
.tabs__file.is-on::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: var(--paper);
}
.tabs__badge {
  font-size: 0.56rem;
  color: var(--accent-ink);
}
.tabs__spacer {
  flex: 1;
}
.tabs__meta {
  font-size: 0.58rem;
  padding-bottom: 6px;
  white-space: nowrap;
}

/* 工具栏 */
.tools {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--rule);
  background: var(--paper);
}
.tools__btn {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid transparent;
  border-radius: var(--r-xs) var(--r-xs) var(--r-xs) var(--r-xs);
  color: var(--ink-2);
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.tools__btn:hover {
  background: var(--accent-3);
  border-color: var(--accent-ink);
  color: var(--accent-ink);
}
.tools__btn.is-on {
  background: var(--accent-3);
  border-color: var(--accent-ink);
  color: var(--accent-ink);
}
.tools__sep {
  width: 1px;
  height: 18px;
  margin: 0 5px;
  background: var(--rule-2);
}
.tools__hint {
  margin-left: auto;
  font-size: 0.56rem;
  color: var(--ink-4);
}

/* 图面 */
.canvas {
  position: relative;
  flex: 1;
  min-height: 320px;
  overflow: hidden;
  background:
    radial-gradient(rgba(22, 19, 14, 0.07) 1px, transparent 1.2px) 0 0 / 12px 12px,
    linear-gradient(180deg, #fbf6ea, var(--paper-2));
  cursor: default;
  touch-action: none;
  user-select: none;
}
.canvas.is-pan,
.canvas.is-dragging {
  cursor: grab;
}
.canvas.is-dragging {
  cursor: grabbing;
}
.canvas.is-measure {
  cursor: crosshair;
}
.canvas__frame {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}
.dwg {
  width: 100%;
  height: 100%;
  color: var(--ink);
}
.dwg :deep(line),
.dwg :deep(circle),
.dwg :deep(rect),
.dwg :deep(path),
.dwg :deep(polygon) {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.dwg :deep(.thin) {
  stroke-width: 0.7;
}
.dwg :deep(.bold) {
  stroke-width: 2.1;
}
.dwg :deep(.cl) {
  stroke: var(--ink-3);
  stroke-width: 0.7;
  stroke-dasharray: 16 3 2 3;
}
.dwg :deep(.l-hatch line) {
  stroke: var(--ink-3);
  stroke-width: 0.6;
}
.dwg :deep(.l-dim line) {
  stroke: var(--ink-2);
  stroke-width: 0.7;
}
.dwg :deep(.l-dim .thin) {
  stroke-width: 0.5;
}
.dwg :deep(.fill) {
  fill: var(--ink);
  stroke: none;
}
.dwg :deep(.l-measure line) {
  stroke: var(--accent-ink);
  stroke-width: 1.6;
  stroke-dasharray: 8 4;
}
.dwg :deep(.l-measure circle) {
  fill: var(--accent-ink);
  stroke: var(--paper);
  stroke-width: 1.5;
}
.dwg :deep(.l-measure text) {
  fill: var(--accent-ink);
  font-weight: 700;
}
.dwg :deep(text) {
  fill: var(--ink);
  stroke: none;
  font-family: var(--serif);
  font-size: 14px;
}
.dwg :deep(.tm) {
  font-family: var(--mono);
  font-size: 13px;
  letter-spacing: 0.04em;
}
.dwg :deep(.tt) {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.06em;
}
.dwg :deep(.tl) {
  font-size: 12px;
  fill: var(--ink-3);
}

/* 图层面板 */
.layerpanel {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 172px;
  padding: 10px 12px 8px;
  background: color-mix(in srgb, var(--paper) 94%, #fff);
  border: 1px solid var(--rule);
  border-radius: 0 var(--r-md) 0 var(--r-md);
  box-shadow: var(--shadow-m);
}
.layerpanel__title {
  font-size: 0.58rem;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--rule);
  margin-bottom: 6px;
}
.layerpanel__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 0.82rem;
  cursor: pointer;
}
.layerpanel__row input {
  accent-color: var(--accent-ink);
}
.layerpanel__swatch {
  width: 12px;
  height: 2px;
  background: var(--ink);
}
.layerpanel__swatch.is-gray {
  background: var(--ink-3);
}
.layerpanel__foot {
  margin-top: 6px;
  font-size: 0.54rem;
}

/* 加载态 */
.loader {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 10px;
  background: color-mix(in srgb, var(--paper) 88%, transparent);
  backdrop-filter: blur(2px);
}
.loader__spin {
  color: var(--accent-ink);
  animation: spin 1.1s linear infinite;
}
.loader__text {
  font-size: 0.86rem;
  color: var(--ink-2);
}
.loader__track {
  width: 190px;
  height: 4px;
  background: var(--paper-4);
  border-radius: var(--r-pill);
  overflow: hidden;
}
.loader__track span {
  display: block;
  width: 40%;
  height: 100%;
  background: var(--accent-ink);
  animation: slide 1.1s ease-in-out infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(250%);
  }
}

/* 浮层 */
.overlay {
  position: absolute;
  pointer-events: none;
}
.overlay--scale {
  left: 12px;
  bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.56rem;
  color: var(--ink-3);
}
.overlay__bar {
  display: block;
  width: 52px;
  height: 7px;
  border: 1px solid var(--ink-3);
  border-top: none;
}
.overlay--tip {
  top: 10px;
  left: 12px;
  padding: 3px 9px;
  background: var(--accent-3);
  border: 1px solid var(--accent-2);
  border-radius: var(--r-pill);
  color: var(--accent-ink);
  font-size: 0.56rem;
}

/* 状态栏 */
.statusbar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 6px 10px;
  border-top: 1px solid var(--rule-2);
  background: var(--paper-3);
  font-size: 0.56rem;
  overflow-x: auto;
}
.statusbar__sep {
  width: 1px;
  height: 12px;
  background: var(--rule-2);
}
.statusbar__spacer {
  flex: 1;
}
.statusbar__link {
  font-size: 0.72rem;
  white-space: nowrap;
}
.statusbar__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ink-4);
}
.statusbar__dot.is-on {
  background: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-3);
}

.pop-enter-active,
.pop-leave-active,
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
