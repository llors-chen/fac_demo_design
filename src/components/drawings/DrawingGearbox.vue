<script setup>
/**
 * 图纸 01 · 行星齿轮减速箱总装图
 *
 * 元素通过 data-draw / data-fade + data-stage 声明动画参与方式：
 *   stage 1 图框与基准线 → 2 轮廓 → 3 剖面线 → 4 尺寸标注 → 5 引出标注与标题栏
 * hoverPart 由外层明细表联动，用于高亮对应零件。
 */
import { computed } from 'vue'
import { hatchLines } from '../../utils/hatch.js'

const props = defineProps({
  highlight: { type: String, default: '' },
})

const hot = (id) => (props.highlight === id ? 'is-hot' : '')

/* ---------------- 主视图几何 ---------------- */
const cx = 300
const cy = 250
const R = { housing: 190, spigot: 178, bolt: 166, ringPitch: 140, ringRoot: 148, sunPitch: 40, sunRoot: 32, planetPitch: 50, planetRoot: 41, planetOrbit: 90 }

const r2 = (n) => Math.round(n * 100) / 100

/** 齿轮“齿”的示意短刻线：在分度圆与齿根圆之间均布 */
function teeth(rIn, rOut, count, ox = cx, oy = cy, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const a = (((i * 360) / count + offset) * Math.PI) / 180
    return {
      x1: r2(ox + rIn * Math.cos(a)),
      y1: r2(oy + rIn * Math.sin(a)),
      x2: r2(ox + rOut * Math.cos(a)),
      y2: r2(oy + rOut * Math.sin(a)),
    }
  })
}

const ringTeeth = teeth(R.ringPitch, R.ringRoot, 28, cx, cy, 6)
const sunTeeth = teeth(R.sunRoot, R.sunPitch, 16, cx, cy, 11)
const planets = [90, 210, 330].map((deg) => {
  const a = (deg * Math.PI) / 180
  const x = r2(cx + R.planetOrbit * Math.cos(a))
  const y = r2(cy + R.planetOrbit * Math.sin(a))
  return { x, y, teeth: teeth(R.planetRoot, R.planetPitch, 14, x, y, 12) }
})
const boltHoles = [30, 90, 150, 210, 270, 330].map((deg) => {
  const a = (deg * Math.PI) / 180
  return { x: r2(cx + R.bolt * Math.cos(a)), y: r2(cy + R.bolt * Math.sin(a)) }
})

/* ---------------- 剖视图 B—B 几何 ---------------- */
const sec = {
  x0: 560,
  y0: 110,
  w: 430,
  h: 280,
  wall: 16,
}
/** 剖面线区域（壳体壁 + 齿轮轮体） */
const hatchAreas = [
  { x: sec.x0, y: sec.y0, w: sec.w, h: sec.wall, gap: 16 },
  { x: sec.x0, y: sec.y0 + sec.h - sec.wall, w: sec.w, h: sec.wall, gap: 16 },
  { x: sec.x0, y: sec.y0 + sec.wall, w: sec.wall, h: sec.h - sec.wall * 2, gap: 16 },
  { x: sec.x0 + sec.w - sec.wall, y: sec.y0 + sec.wall, w: sec.wall, h: sec.h - sec.wall * 2, gap: 16 },
  { x: 620, y: 126, w: 340, h: 30, gap: 14 }, // 内齿圈上
  { x: 620, y: 344, w: 340, h: 30, gap: 14 }, // 内齿圈下
  { x: 704, y: 212, w: 96, h: 76, gap: 14 }, // 太阳轮
  { x: 844, y: 150, w: 30, h: 200, gap: 14 }, // 行星架
]

const hatch = computed(() => hatchAreas.flatMap((a) => hatchLines(a.x, a.y, a.w, a.h, { gap: a.gap })))

/** 剖视图中内齿圈的内向齿 */
const secRingTeethTop = Array.from({ length: 21 }, (_, i) => ({ x: 632 + i * 16, y1: 156, y2: 166 }))
const secRingTeethBottom = Array.from({ length: 21 }, (_, i) => ({ x: 632 + i * 16, y1: 344, y2: 334 }))
const secSunTeethTop = Array.from({ length: 8 }, (_, i) => ({ x: 716 + i * 11, y1: 212, y2: 200 }))
const secSunTeethBottom = Array.from({ length: 8 }, (_, i) => ({ x: 716 + i * 11, y1: 288, y2: 300 }))

/** 尺寸箭头（实心小三角） */
const arrow = (x, y, dir) => {
  const s = 4.6
  if (dir === 'left') return `${x},${y} ${x + s * 2},${y - s * 0.6} ${x + s * 2},${y + s * 0.6}`
  if (dir === 'right') return `${x},${y} ${x - s * 2},${y - s * 0.6} ${x - s * 2},${y + s * 0.6}`
  if (dir === 'up') return `${x},${y} ${x - s * 0.6},${y + s * 2} ${x + s * 0.6},${y + s * 2}`
  return `${x},${y} ${x - s * 0.6},${y - s * 2} ${x + s * 0.6},${y - s * 2}`
}
</script>

<template>
  <svg class="dwg" viewBox="0 0 1040 660" role="img" aria-label="行星齿轮减速箱总装图">
    <!-- ============ 图框（阶段 1） ============ -->
    <g class="l-frame">
      <rect x="14" y="14" width="1012" height="632" data-draw data-stage="1" />
      <rect x="30" y="30" width="980" height="600" data-draw data-stage="1" class="thin" />
    </g>

    <!-- ============ 中心线与基准（阶段 1，虚线用淡入） ============ -->
    <g class="l-center">
      <line x1="86" y1="250" x2="514" y2="250" data-fade data-stage="1" class="cl" />
      <line x1="300" y1="40" x2="300" y2="460" data-fade data-stage="1" class="cl" />
      <circle cx="300" cy="250" r="166" data-fade data-stage="1" class="cl" />
      <line x1="536" y1="250" x2="1000" y2="250" data-fade data-stage="1" class="cl" />
      <g v-for="(p, i) in planets" :key="'pc' + i">
        <line :x1="p.x - 66" :y1="p.y" :x2="p.x + 66" :y2="p.y" data-fade data-stage="1" class="cl" />
        <line :x1="p.x" :y1="p.y - 66" :x2="p.x" :y2="p.y + 66" data-fade data-stage="1" class="cl" />
      </g>
      <line x1="560" y1="96" x2="990" y2="96" data-fade data-stage="1" class="cl" />
    </g>

    <!-- ============ 主视图轮廓（阶段 2） ============ -->
    <g class="l-outline">
      <!-- 壳体 -->
      <circle cx="300" cy="250" r="190" data-draw data-stage="2" class="bold" :class="hot('01')" />
      <circle cx="300" cy="250" r="178" data-draw data-stage="2" class="thin" :class="hot('01')" />
      <circle
        v-for="(h, i) in boltHoles"
        :key="'bh' + i"
        :cx="h.x"
        :cy="h.y"
        r="9"
        data-draw
        data-stage="2"
        :class="hot('01')"
      />
      <!-- 内齿圈 -->
      <circle cx="300" cy="250" r="140" data-draw data-stage="2" :class="hot('02')" />
      <circle cx="300" cy="250" r="148" data-draw data-stage="2" class="thin" :class="hot('02')" />
      <line
        v-for="(t, i) in ringTeeth"
        :key="'rt' + i"
        :x1="t.x1"
        :y1="t.y1"
        :x2="t.x2"
        :y2="t.y2"
        data-draw
        data-stage="2"
        class="thin"
        :class="hot('02')"
      />
      <!-- 行星轮 -->
      <g v-for="(p, i) in planets" :key="'pl' + i" :class="hot('03')">
        <circle :cx="p.x" :cy="p.y" r="50" data-draw data-stage="2" />
        <circle :cx="p.x" :cy="p.y" r="41" data-draw data-stage="2" class="thin" />
        <line
          v-for="(t, j) in p.teeth"
          :key="'pt' + i + '-' + j"
          :x1="t.x1"
          :y1="t.y1"
          :x2="t.x2"
          :y2="t.y2"
          data-draw
          data-stage="2"
          class="thin"
        />
      </g>
      <!-- 太阳轮 -->
      <circle cx="300" cy="250" r="40" data-draw data-stage="2" :class="hot('04')" />
      <circle cx="300" cy="250" r="32" data-draw data-stage="2" class="thin" :class="hot('04')" />
      <line
        v-for="(t, i) in sunTeeth"
        :key="'st' + i"
        :x1="t.x1"
        :y1="t.y1"
        :x2="t.x2"
        :y2="t.y2"
        data-draw
        data-stage="2"
        class="thin"
        :class="hot('04')"
      />
      <!-- 输出轴与键槽 -->
      <circle cx="300" cy="250" r="22" data-draw data-stage="2" :class="hot('05')" />
      <path d="M292 232 h16 v-8 h-16 z" data-draw data-stage="2" class="thin" :class="hot('05')" />
    </g>

    <!-- ============ 剖视图 B—B（阶段 2） ============ -->
    <g class="l-section">
      <rect x="560" y="110" width="430" height="280" data-draw data-stage="2" class="bold" :class="hot('01')" />
      <rect x="576" y="126" width="398" height="248" data-draw data-stage="2" :class="hot('01')" />
      <!-- 内齿圈 -->
      <rect x="620" y="126" width="340" height="30" data-draw data-stage="2" :class="hot('02')" />
      <rect x="620" y="344" width="340" height="30" data-draw data-stage="2" :class="hot('02')" />
      <line
        v-for="(t, i) in secRingTeethTop"
        :key="'srt' + i"
        :x1="t.x"
        :y1="t.y1"
        :x2="t.x"
        :y2="t.y2"
        data-draw
        data-stage="2"
        class="thin"
        :class="hot('02')"
      />
      <line
        v-for="(t, i) in secRingTeethBottom"
        :key="'srb' + i"
        :x1="t.x"
        :y1="t.y1"
        :x2="t.x"
        :y2="t.y2"
        data-draw
        data-stage="2"
        class="thin"
        :class="hot('02')"
      />
      <!-- 输入轴 -->
      <rect x="576" y="238" width="84" height="24" data-draw data-stage="2" />
      <!-- 轴承 A / B -->
      <g>
        <rect x="660" y="220" width="44" height="60" data-draw data-stage="2" />
        <line x1="660" y1="220" x2="704" y2="280" data-draw data-stage="2" class="thin" />
        <line x1="704" y1="220" x2="660" y2="280" data-draw data-stage="2" class="thin" />
      </g>
      <g>
        <rect x="800" y="220" width="44" height="60" data-draw data-stage="2" />
        <line x1="800" y1="220" x2="844" y2="280" data-draw data-stage="2" class="thin" />
        <line x1="844" y1="220" x2="800" y2="280" data-draw data-stage="2" class="thin" />
      </g>
      <!-- 太阳轮 -->
      <rect x="704" y="212" width="96" height="76" data-draw data-stage="2" :class="hot('04')" />
      <line
        v-for="(t, i) in secSunTeethTop"
        :key="'sst' + i"
        :x1="t.x"
        :y1="t.y1"
        :x2="t.x"
        :y2="t.y2"
        data-draw
        data-stage="2"
        class="thin"
        :class="hot('04')"
      />
      <line
        v-for="(t, i) in secSunTeethBottom"
        :key="'ssb' + i"
        :x1="t.x"
        :y1="t.y1"
        :x2="t.x"
        :y2="t.y2"
        data-draw
        data-stage="2"
        class="thin"
        :class="hot('04')"
      />
      <!-- 行星架 -->
      <rect x="844" y="150" width="30" height="200" data-draw data-stage="2" />
      <!-- 输出轴 -->
      <rect x="874" y="234" width="100" height="32" data-draw data-stage="2" :class="hot('05')" />
      <path d="M900 234 h18 v-9 h-18 z" data-draw data-stage="2" class="thin" :class="hot('05')" />
    </g>

    <!-- ============ 剖面线（阶段 3） ============ -->
    <g class="l-hatch">
      <line
        v-for="(h, i) in hatch"
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
      <!-- 主视图 ⌀372 -->
      <line x1="110" y1="440" x2="110" y2="486" data-fade data-stage="4" class="thin" />
      <line x1="490" y1="440" x2="490" y2="486" data-fade data-stage="4" class="thin" />
      <line x1="110" y1="478" x2="490" y2="478" data-fade data-stage="4" />
      <polygon :points="arrow(110, 478, 'left')" data-fade data-stage="4" class="fill" />
      <polygon :points="arrow(490, 478, 'right')" data-fade data-stage="4" class="fill" />
      <text x="300" y="471" text-anchor="middle" data-fade data-stage="4" class="tm">⌀372</text>

      <!-- 主视图 ⌀296（内齿圈齿根圆） -->
      <line x1="152" y1="430" x2="152" y2="512" data-fade data-stage="4" class="thin" />
      <line x1="448" y1="430" x2="448" y2="512" data-fade data-stage="4" class="thin" />
      <line x1="152" y1="504" x2="448" y2="504" data-fade data-stage="4" />
      <polygon :points="arrow(152, 504, 'left')" data-fade data-stage="4" class="fill" />
      <polygon :points="arrow(448, 504, 'right')" data-fade data-stage="4" class="fill" />
      <text x="300" y="497" text-anchor="middle" data-fade data-stage="4" class="tm">⌀296</text>

      <!-- 螺栓孔组 -->
      <line x1="104" y1="176" x2="170" y2="136" data-fade data-stage="4" />
      <text x="42" y="172" data-fade data-stage="4" class="tm">6×⌀18</text>
      <text x="42" y="190" data-fade data-stage="4" class="tm">EQS</text>

      <!-- 太阳轮直径 -->
      <line x1="352" y1="300" x2="470" y2="386" data-fade data-stage="4" />
      <text x="476" y="392" data-fade data-stage="4" class="tm">⌀80</text>

      <!-- 剖视图：总高 280 -->
      <line x1="560" y1="110" x2="534" y2="110" data-fade data-stage="4" class="thin" />
      <line x1="560" y1="390" x2="534" y2="390" data-fade data-stage="4" class="thin" />
      <line x1="540" y1="110" x2="540" y2="390" data-fade data-stage="4" />
      <polygon :points="arrow(540, 110, 'up')" data-fade data-stage="4" class="fill" />
      <polygon :points="arrow(540, 390, 'down')" data-fade data-stage="4" class="fill" />
      <text
        x="532"
        y="250"
        text-anchor="middle"
        transform="rotate(-90 532 250)"
        data-fade
        data-stage="4"
        class="tm"
      >
        280
      </text>

      <!-- 剖视图：总长 430 -->
      <line x1="560" y1="390" x2="560" y2="424" data-fade data-stage="4" class="thin" />
      <line x1="990" y1="390" x2="990" y2="424" data-fade data-stage="4" class="thin" />
      <line x1="560" y1="418" x2="990" y2="418" data-fade data-stage="4" />
      <polygon :points="arrow(560, 418, 'left')" data-fade data-stage="4" class="fill" />
      <polygon :points="arrow(990, 418, 'right')" data-fade data-stage="4" class="fill" />
      <text x="775" y="411" text-anchor="middle" data-fade data-stage="4" class="tm">430</text>

      <!-- 剖切符号 B—B -->
      <g>
        <line x1="86" y1="250" x2="86" y2="228" data-fade data-stage="4" class="bold" />
        <polygon :points="arrow(86, 250, 'right')" data-fade data-stage="4" class="fill" />
        <text x="78" y="222" data-fade data-stage="4" class="tb">B</text>
        <line x1="514" y1="250" x2="514" y2="228" data-fade data-stage="4" class="bold" />
        <polygon :points="arrow(514, 250, 'left')" data-fade data-stage="4" class="fill" />
        <text x="508" y="222" data-fade data-stage="4" class="tb">B</text>
      </g>
    </g>

    <!-- ============ 引出标注 / 标题栏（阶段 5） ============ -->
    <g class="l-note">
      <g>
        <line x1="103" y1="105" x2="157" y2="131" data-fade data-stage="5" />
        <circle cx="92" cy="96" r="11" data-fade data-stage="5" />
        <text x="92" y="100.5" text-anchor="middle" data-fade data-stage="5" class="tb">1</text>
      </g>
      <g>
        <line x1="418" y1="108" x2="370" y2="129" data-fade data-stage="5" />
        <circle cx="430" cy="100" r="11" data-fade data-stage="5" />
        <text x="430" y="104.5" text-anchor="middle" data-fade data-stage="5" class="tb">2</text>
      </g>
      <g>
        <line x1="139" y1="349" x2="180" y2="250" data-fade data-stage="5" />
        <circle cx="128" cy="360" r="11" data-fade data-stage="5" />
        <text x="128" y="364.5" text-anchor="middle" data-fade data-stage="5" class="tb">3</text>
      </g>
      <g>
        <line x1="207" y1="420" x2="272" y2="278" data-fade data-stage="5" />
        <circle cx="198" cy="432" r="11" data-fade data-stage="5" />
        <text x="198" y="436.5" text-anchor="middle" data-fade data-stage="5" class="tb">4</text>
      </g>
      <g>
        <line x1="912" y1="207" x2="912" y2="232" data-fade data-stage="5" />
        <circle cx="912" cy="196" r="11" data-fade data-stage="5" />
        <text x="912" y="200.5" text-anchor="middle" data-fade data-stage="5" class="tb">5</text>
      </g>

      <!-- 剖视图名称 -->
      <text x="600" y="86" data-fade data-stage="5" class="tb">B—B</text>

      <!-- 技术要求 -->
      <g class="notesblock">
        <text x="60" y="556" data-fade data-stage="5" class="th">技术要求</text>
        <text x="60" y="580" data-fade data-stage="5" class="ts">1. 装配前壳体、内齿圈清洗，不得有铁屑与毛刺。</text>
        <text x="60" y="600" data-fade data-stage="5" class="ts">2. 齿面啮合侧隙 0.12~0.24，按 GB/T 10095 检验。</text>
        <text x="60" y="620" data-fade data-stage="5" class="ts">3. 注入 N220 工业齿轮油至油标中线，空载跑合 30 min。</text>
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

        <text x="654" y="476" data-fade data-stage="5" class="tt">行星齿轮减速箱 总装图</text>

        <text x="650" y="508" data-fade data-stage="5" class="tl">图号</text>
        <text x="708" y="508" data-fade data-stage="5" class="tm">NY-JS-2026-001</text>
        <text x="820" y="508" data-fade data-stage="5" class="tl">比例</text>
        <text x="930" y="508" data-fade data-stage="5" class="tm">1 : 2</text>

        <text x="650" y="542" data-fade data-stage="5" class="tl">材料</text>
        <text x="708" y="542" data-fade data-stage="5" class="tm">HT250</text>
        <text x="820" y="542" data-fade data-stage="5" class="tl">重量</text>
        <text x="930" y="542" data-fade data-stage="5" class="tm">86.4 kg</text>

        <text x="650" y="576" data-fade data-stage="5" class="tl">设计</text>
        <text x="708" y="576" data-fade data-stage="5" class="tm">张工</text>
        <text x="820" y="576" data-fade data-stage="5" class="tl">审核</text>
        <text x="930" y="576" data-fade data-stage="5" class="tm">李工</text>

        <text x="650" y="614" data-fade data-stage="5" class="tl">批准</text>
        <text x="708" y="614" data-fade data-stage="5" class="tm">王工</text>
        <text x="820" y="614" data-fade data-stage="5" class="tl">日期</text>
        <text x="930" y="614" data-fade data-stage="5" class="tm">2026-02-14</text>
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
  letter-spacing: 0.02em;
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
.dwg :deep(.l-note circle) {
  stroke: var(--ink);
  stroke-width: 1;
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
/* 明细表联动高亮 */
.dwg :deep(.is-hot) {
  stroke: var(--accent-ink);
  stroke-width: 3;
}
.dwg :deep(.is-hot.thin) {
  stroke-width: 2;
}
</style>
