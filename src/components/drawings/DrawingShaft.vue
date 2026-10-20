<script setup>
/**
 * 图纸 02 · 传动轴零件图
 * 阶梯轴轮廓由 segments 数据生成，尺寸链、粗糙度与形位公差按工程制图习惯布置。
 */
import { computed } from 'vue'
import { hatchLines } from '../../utils/hatch.js'

const props = defineProps({
  highlight: { type: String, default: '' },
})

const AXIS = 300
const r2 = (n) => Math.round(n * 100) / 100

/** 轴段：x0~x1，半径 r（对应 ⌀2r） */
const segments = [
  { x0: 140, x1: 210, r: 22, dia: '⌀44' },
  { x0: 210, x1: 268, r: 28, dia: '⌀56' },
  { x0: 268, x1: 306, r: 34, dia: '' },
  { x0: 306, x1: 566, r: 40, dia: '⌀80' },
  { x0: 566, x1: 624, r: 34, dia: '' },
  { x0: 624, x1: 762, r: 30, dia: '⌀60' },
  { x0: 762, x1: 836, r: 24, dia: 'M48×2' },
  { x0: 836, x1: 900, r: 18, dia: '⌀36' },
]

/** 上母线（含 45° 倒角与台阶面） */
const topPath = computed(() => {
  const pts = []
  segments.forEach((s, i) => {
    const y = AXIS - s.r
    if (i === 0) pts.push(`M${s.x0 + 3} ${y + 3}`, `L${s.x0} ${y}`)
    else pts.push(`L${s.x0} ${y}`)
    pts.push(`L${s.x1} ${y}`)
  })
  return pts.join(' ')
})

/** 下母线 */
const bottomPath = computed(() => {
  const pts = []
  segments.forEach((s, i) => {
    const y = AXIS + s.r
    if (i === 0) pts.push(`M${s.x0 + 3} ${y - 3}`, `L${s.x0} ${y}`)
    else pts.push(`L${s.x0} ${y}`)
    pts.push(`L${s.x1} ${y}`)
  })
  return pts.join(' ')
})

/** 台阶面（竖直的肩面） */
const shoulders = computed(() =>
  segments.slice(1).map((s, i) => {
    const prev = segments[i]
    return { x: s.x0, y1: AXIS - prev.r, y2: AXIS - s.r, y3: AXIS + prev.r, y4: AXIS + s.r }
  }),
)

/** 中心孔（两端） */
const centerHoles = [
  'M140 293 L154 297 L154 303 L140 307',
  'M900 287 L886 297 L886 303 L900 313',
]

/** 键槽（上母线开槽，右端为半圆） */
const keyway = 'M362 246 L492 246 A7 7 0 0 1 492 260 L362 260 Z'

/** 尺寸链（长度） */
const chain = [
  { x0: 140, x1: 210, text: '70', y: 382 },
  { x0: 210, x1: 306, text: '96', y: 382 },
  { x0: 306, x1: 566, text: '260', y: 382 },
  { x0: 566, x1: 762, text: '196', y: 382 },
  { x0: 762, x1: 900, text: '138', y: 382 },
]

/** 直径尺寸（引出在轴上方，交错排布） */
const diaDims = [
  { x0: 140, x1: 210, y: 240, top: 278, text: '⌀44' },
  { x0: 210, x1: 268, y: 216, top: 272, text: '⌀56' },
  { x0: 306, x1: 566, y: 236, top: 260, text: '⌀80' },
  { x0: 624, x1: 762, y: 212, top: 270, text: '⌀60' },
  { x0: 762, x1: 836, y: 232, top: 276, text: 'M48×2' },
  { x0: 836, x1: 900, y: 208, top: 282, text: '⌀36' },
]

/** 表面粗糙度符号：底部顶点落在表面上 */
function ra(x, y, label) {
  return {
    path: `M${x - 6} ${y - 10} L${x} ${y} L${x + 6} ${y - 10} M${x + 6} ${y - 10} L${x + 22} ${y - 10}`,
    label,
    lx: x + 2,
    ly: y - 14,
  }
}
const roughness = [ra(240, 272, 'Ra1.6'), ra(330, 260, 'Ra0.8'), ra(700, 270, 'Ra3.2')]

/** A—A 移出断面（带键槽缺口） */
const secA = { cx: 470, cy: 530, r: 40, kw: 7, kd: 9 }
const secAHatch = computed(() =>
  hatchLines(secA.cx - secA.r - 2, secA.cy - secA.r - 12, secA.r * 2 + 4, secA.r * 2 + 16, { gap: 13 }),
)

/** 尺寸箭头 */
const arrow = (x, y, dir) => {
  const s = 4.6
  if (dir === 'left') return `${x},${y} ${x + s * 2},${y - s * 0.6} ${x + s * 2},${y + s * 0.6}`
  if (dir === 'right') return `${x},${y} ${x - s * 2},${y - s * 0.6} ${x - s * 2},${y + s * 0.6}`
  if (dir === 'up') return `${x},${y} ${x - s * 0.6},${y + s * 2} ${x + s * 0.6},${y + s * 2}`
  return `${x},${y} ${x - s * 0.6},${y - s * 2} ${x + s * 0.6},${y - s * 2}`
}
</script>

<template>
  <svg class="dwg" viewBox="0 0 1040 660" role="img" aria-label="传动轴零件图">
    <defs>
      <clipPath id="shaftSecA">
        <circle :cx="secA.cx" :cy="secA.cy" :r="secA.r" />
        <rect :x="secA.cx - secA.kw" :y="secA.cy - secA.r - secA.kd" :width="secA.kw * 2" :height="secA.kd + 2" />
      </clipPath>
    </defs>

    <!-- ============ 图框（阶段 1） ============ -->
    <g class="l-frame">
      <rect x="14" y="14" width="1012" height="632" data-draw data-stage="1" />
      <rect x="30" y="30" width="980" height="600" data-draw data-stage="1" class="thin" />
    </g>

    <!-- ============ 中心线（阶段 1） ============ -->
    <g class="l-center">
      <line x1="96" y1="300" x2="946" y2="300" data-fade data-stage="1" class="cl" />
      <line :x1="secA.cx - 62" :y1="secA.cy" :x2="secA.cx + 62" :y2="secA.cy" data-fade data-stage="1" class="cl" />
      <line :x1="secA.cx" :y1="secA.cy - 62" :x2="secA.cx" :y2="secA.cy + 62" data-fade data-stage="1" class="cl" />
    </g>

    <!-- ============ 轴轮廓（阶段 2） ============ -->
    <g class="l-outline">
      <path :d="topPath" data-draw data-stage="2" class="bold" />
      <path :d="bottomPath" data-draw data-stage="2" class="bold" />
      <line x1="140" y1="281" x2="140" y2="319" data-draw data-stage="2" class="bold" />
      <line x1="900" y1="285" x2="900" y2="315" data-draw data-stage="2" class="bold" />
      <line
        v-for="(s, i) in shoulders"
        :key="'sh' + i"
        :x1="s.x"
        :y1="s.y1"
        :x2="s.x"
        :y2="s.y2"
        data-draw
        data-stage="2"
      />
      <line
        v-for="(s, i) in shoulders"
        :key="'shb' + i"
        :x1="s.x"
        :y1="s.y3"
        :x2="s.x"
        :y2="s.y4"
        data-draw
        data-stage="2"
      />
      <path v-for="(d, i) in centerHoles" :key="'ch' + i" :d="d" data-draw data-stage="2" class="thin" />
      <path :d="keyway" data-draw data-stage="2" />
      <!-- 移出断面 A—A -->
      <circle :cx="secA.cx" :cy="secA.cy" :r="secA.r" data-draw data-stage="2" />
      <path
        :d="`M${secA.cx - secA.kw} ${secA.cy - secA.r} L${secA.cx - secA.kw} ${secA.cy - secA.r - secA.kd} L${secA.cx + secA.kw} ${secA.cy - secA.r - secA.kd} L${secA.cx + secA.kw} ${secA.cy - secA.r}`"
        data-draw
        data-stage="2"
      />
    </g>

    <!-- ============ 剖面线（阶段 3） ============ -->
    <g class="l-hatch" clip-path="url(#shaftSecA)">
      <line
        v-for="(h, i) in secAHatch"
        :key="'h' + i"
        :x1="h.x1"
        :y1="h.y1"
        :x2="h.x2"
        :y2="h.y2"
        data-draw
        data-stage="3"
      />
    </g>

    <!-- ============ 尺寸标注（阶段 4） ============ -->
    <g class="l-dim">
      <!-- 长度尺寸链 -->
      <template v-for="(c, i) in chain" :key="'c' + i">
        <line :x1="c.x0" y1="346" :x2="c.x0" :y2="c.y + 8" data-fade data-stage="4" class="thin" />
        <line :x1="c.x1" y1="346" :x2="c.x1" :y2="c.y + 8" data-fade data-stage="4" class="thin" />
        <line :x1="c.x0" :y1="c.y" :x2="c.x1" :y2="c.y" data-fade data-stage="4" />
        <polygon :points="arrow(c.x0, c.y, 'left')" data-fade data-stage="4" class="fill" />
        <polygon :points="arrow(c.x1, c.y, 'right')" data-fade data-stage="4" class="fill" />
        <text :x="(c.x0 + c.x1) / 2" :y="c.y - 7" text-anchor="middle" data-fade data-stage="4" class="tm">
          {{ c.text }}
        </text>
      </template>

      <!-- 总长 760 -->
      <line x1="140" y1="348" x2="140" y2="438" data-fade data-stage="4" class="thin" />
      <line x1="900" y1="348" x2="900" y2="438" data-fade data-stage="4" class="thin" />
      <line x1="140" y1="430" x2="900" y2="430" data-fade data-stage="4" />
      <polygon :points="arrow(140, 430, 'left')" data-fade data-stage="4" class="fill" />
      <polygon :points="arrow(900, 430, 'right')" data-fade data-stage="4" class="fill" />
      <text x="520" y="423" text-anchor="middle" data-fade data-stage="4" class="tm">760</text>

      <!-- 直径尺寸 -->
      <template v-for="(d, i) in diaDims" :key="'d' + i">
        <line :x1="d.x0" :y1="d.top" :x2="d.x0" :y2="d.y - 8" data-fade data-stage="4" class="thin" />
        <line :x1="d.x1" :y1="d.top" :x2="d.x1" :y2="d.y - 8" data-fade data-stage="4" class="thin" />
        <line :x1="d.x0" :y1="d.y" :x2="d.x1" :y2="d.y" data-fade data-stage="4" />
        <polygon :points="arrow(d.x0, d.y, 'left')" data-fade data-stage="4" class="fill" />
        <polygon :points="arrow(d.x1, d.y, 'right')" data-fade data-stage="4" class="fill" />
        <text :x="(d.x0 + d.x1) / 2" :y="d.y - 7" text-anchor="middle" data-fade data-stage="4" class="tm">
          {{ d.text }}
        </text>
      </template>

      <!-- 形位公差框 -->
      <g>
        <line x1="204" y1="176" x2="240" y2="272" data-fade data-stage="4" />
        <rect x="170" y="150" width="130" height="26" data-fade data-stage="4" />
        <line x1="240" y1="150" x2="240" y2="176" data-fade data-stage="4" class="thin" />
        <text x="178" y="169" data-fade data-stage="4" class="tm">⌀0.02</text>
        <text x="252" y="169" data-fade data-stage="4" class="tm">A</text>
      </g>

      <!-- 表面粗糙度 -->
      <g v-for="(s, i) in roughness" :key="'ra' + i">
        <path :d="s.path" data-fade data-stage="4" class="thin" />
        <text :x="s.lx" :y="s.ly" data-fade data-stage="4" class="tm">{{ s.label }}</text>
      </g>

      <!-- 倒角 -->
      <line x1="138" y1="283" x2="118" y2="288" data-fade data-stage="4" />
      <text x="92" y="292" data-fade data-stage="4" class="tm">C1.5</text>
      <line x1="902" y1="284" x2="922" y2="279" data-fade data-stage="4" />
      <text x="926" y="276" data-fade data-stage="4" class="tm">C1.5</text>

      <!-- 键槽深度注法（局部） -->
      <line x1="430" y1="246" x2="470" y2="120" data-fade data-stage="4" />
      <text x="476" y="118" data-fade data-stage="4" class="tm">键槽 14×9</text>
      <text x="476" y="136" data-fade data-stage="4" class="tm">深 9 −0.1</text>
    </g>

    <!-- ============ 剖切标注 / 标题栏（阶段 5） ============ -->
    <g class="l-note">
      <g>
        <line x1="380" y1="196" x2="380" y2="420" data-fade data-stage="5" class="bold" />
        <polygon :points="arrow(380, 200, 'left')" data-fade data-stage="5" class="fill" />
        <polygon :points="arrow(380, 416, 'left')" data-fade data-stage="5" class="fill" />
        <text x="392" y="196" data-fade data-stage="5" class="tb">A</text>
        <text x="392" y="428" data-fade data-stage="5" class="tb">A</text>
      </g>
      <text :x="secA.cx - 26" :y="secA.cy + 88" data-fade data-stage="5" class="tb">A—A</text>

      <!-- 技术要求 -->
      <g class="notesblock">
        <text x="60" y="478" data-fade data-stage="5" class="th">技术要求</text>
        <text x="60" y="502" data-fade data-stage="5" class="ts">1. 未注圆角 R2，未注倒角 C1.5。</text>
        <text x="60" y="524" data-fade data-stage="5" class="ts">2. 调质处理 HB220~250，硬度均匀性 ≤ 20HB。</text>
        <text x="60" y="546" data-fade data-stage="5" class="ts">3. 键槽 14×9 按 GB/T 1095 加工，两侧对称度 0.03。</text>
        <text x="60" y="568" data-fade data-stage="5" class="ts">4. 轴承位 ⌀56 与 ⌀60 同轴度 ⌀0.02 A，Ra1.6。</text>
        <text x="60" y="590" data-fade data-stage="5" class="ts">5. 螺纹 M48×2 按 GB/T 196 加工，去毛刺锐边。</text>
      </g>

      <!-- 标题栏 -->
      <g class="titleblock">
        <rect x="640" y="452" width="370" height="178" data-draw data-stage="5" class="bold" />
        <line x1="640" y1="486" x2="1010" y2="486" data-fade data-stage="5" />
        <line x1="640" y1="520" x2="1010" y2="520" data-fade data-stage="5" />
        <line x1="640" y1="554" x2="1010" y2="554" data-fade data-stage="5" />
        <line x1="640" y1="588" x2="1010" y2="588" data-fade data-stage="5" />
        <line x1="700" y1="486" x2="700" y2="630" data-fade data-stage="5" class="thin" />
        <line x1="810" y1="486" x2="810" y2="630" data-fade data-stage="5" class="thin" />
        <line x1="920" y1="486" x2="920" y2="630" data-fade data-stage="5" class="thin" />

        <text x="654" y="476" data-fade data-stage="5" class="tt">传动轴 零件图</text>

        <text x="650" y="508" data-fade data-stage="5" class="tl">图号</text>
        <text x="708" y="508" data-fade data-stage="5" class="tm">NY-ZC-2026-014</text>
        <text x="820" y="508" data-fade data-stage="5" class="tl">比例</text>
        <text x="930" y="508" data-fade data-stage="5" class="tm">1 : 1.5</text>

        <text x="650" y="542" data-fade data-stage="5" class="tl">材料</text>
        <text x="708" y="542" data-fade data-stage="5" class="tm">40Cr</text>
        <text x="820" y="542" data-fade data-stage="5" class="tl">重量</text>
        <text x="930" y="542" data-fade data-stage="5" class="tm">12.6 kg</text>

        <text x="650" y="576" data-fade data-stage="5" class="tl">设计</text>
        <text x="708" y="576" data-fade data-stage="5" class="tm">陈工</text>
        <text x="820" y="576" data-fade data-stage="5" class="tl">审核</text>
        <text x="930" y="576" data-fade data-stage="5" class="tm">李工</text>

        <text x="650" y="614" data-fade data-stage="5" class="tl">批准</text>
        <text x="708" y="614" data-fade data-stage="5" class="tm">王工</text>
        <text x="820" y="614" data-fade data-stage="5" class="tl">日期</text>
        <text x="930" y="614" data-fade data-stage="5" class="tm">2026-02-18</text>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.dwg {
  width: 100%;
  height: auto;
  color: var(--ink);
}
.dwg :deep(line),
.dwg :deep(circle),
.dwg :deep(rect),
.dwg :deep(path),
.dwg :deep(polygon) {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: stroke 0.25s ease, stroke-width 0.25s ease;
}
.dwg :deep(.thin) {
  stroke-width: 0.7;
}
.dwg :deep(.bold) {
  stroke-width: 2.2;
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
.dwg :deep(.tb) {
  font-family: var(--mono);
  font-size: 14px;
  font-weight: 700;
}
.dwg :deep(.tt) {
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 0.06em;
}
.dwg :deep(.tl) {
  font-size: 12.5px;
  fill: var(--ink-3);
}
.dwg :deep(.l-note line) {
  stroke: var(--ink-2);
  stroke-width: 0.7;
}
.dwg :deep(.th) {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.dwg :deep(.ts) {
  font-size: 12.5px;
  fill: var(--ink-2);
}
.dwg :deep(.is-hot) {
  stroke: var(--accent-ink);
  stroke-width: 3;
}
</style>
