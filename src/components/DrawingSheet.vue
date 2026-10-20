<script setup>
/**
 * 图纸展陈容器（滚动交互）
 *
 * 结构：高个子 section（200vh）+ sticky 内层 → 滚动进度驱动图纸“落笔”
 * 桌面端：滚动到哪、画到哪；窄屏：进入视口后自动播放一次
 * 明细表行 hover 会高亮图纸中对应零件（通过作用域插槽把 highlight 传给图纸）
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import { useDrawingAnimation } from '../composables/useDrawingAnimation.js'
import { useScrollProgress } from '../composables/useScrollProgress.js'

const props = defineProps({
  no: { type: String, required: true },
  anchor: { type: String, required: true },
  title: { type: String, required: true },
  sheetNo: { type: String, default: '' },
  scale: { type: String, default: '' },
  date: { type: String, default: '' },
  unit: { type: String, default: '精工图谱 · 平湖工厂' },
  caption: { type: String, default: '' },
  stages: { type: Array, default: () => [] },
  summary: { type: Array, default: () => [] },
  bom: { type: Array, default: () => [] },
  notes: { type: Array, default: () => [] },
})

const sectionEl = ref(null)
const pinEl = ref(null)
const hoverPart = ref('')
const isNarrow = ref(false)

const { progress, inView } = useScrollProgress(sectionEl, pinEl, { offset: 74 })
const drive = computed(() => !isNarrow.value)
const { animated, playing, toggleAuto, playOnce } = useDrawingAnimation(pinEl, progress, { drive })

const percent = computed(() => Math.round(progress.value * 100))

const activeStage = computed(() => {
  let idx = 0
  props.stages.forEach((s, i) => {
    if (progress.value >= s.at) idx = i
  })
  return idx
})

let played = false
watch([inView, isNarrow], ([visible, narrow]) => {
  if (narrow && visible && !played) {
    played = true
    playOnce()
  }
})

let mq
function onMq(e) {
  isNarrow.value = e.matches
}
onMounted(() => {
  mq = window.matchMedia('(max-width: 900px)')
  isNarrow.value = mq.matches
  mq.addEventListener('change', onMq)
})
onBeforeUnmount(() => mq?.removeEventListener('change', onMq))
</script>

<template>
  <section :id="anchor" ref="sectionEl" class="pin-section" :data-sheet="no">
    <div ref="pinEl" class="pin-body">
      <div class="wrap sheet">
        <!-- 图纸抬头 -->
        <header class="sheet__head">
          <span class="sheet__no" aria-hidden="true">{{ no }}</span>
          <div class="sheet__titles">
            <p class="kicker">设计成果 · 第 {{ no }} 张</p>
            <h3 class="sheet__title">{{ title }}</h3>
          </div>

          <dl class="sheet__meta">
            <div><dt class="mono">图号</dt><dd>{{ sheetNo }}</dd></div>
            <div><dt class="mono">比例</dt><dd>{{ scale }}</dd></div>
            <div><dt class="mono">日期</dt><dd>{{ date }}</dd></div>
            <div class="sheet__meta-wide"><dt class="mono">单位</dt><dd>{{ unit }}</dd></div>
          </dl>

          <div class="meter" role="group" aria-label="描线进度">
            <div class="meter__row">
              <span class="mono meter__label">描线进度</span>
              <span class="meter__num">{{ percent }}%</span>
              <button class="btn btn--sm meter__btn" type="button" @click="toggleAuto">
                <AppIcon :name="playing ? 'minus' : 'arrowRight'" :size="13" />
                {{ playing ? '暂停演示' : '自动演示' }}
              </button>
            </div>
            <div class="meter__track">
              <span class="meter__fill" :style="{ transform: `scaleX(${progress})` }"></span>
              <span
                v-for="(s, i) in stages"
                :key="i"
                class="meter__tick"
                :class="{ 'is-on': progress >= s.at }"
                :style="{ left: s.at * 100 + '%' }"
              ></span>
            </div>
          </div>
        </header>

        <!-- 图面 + 侧栏 -->
        <div class="sheet__body">
          <figure class="canvas">
            <div class="canvas__paper">
              <span class="corner corner--tr"></span>
              <span class="corner corner--bl"></span>
              <slot :highlight="hoverPart" />
            </div>
            <figcaption v-if="caption" class="canvas__cap">
              <AppIcon name="info" :size="14" />
              {{ caption }}
            </figcaption>
          </figure>

          <aside class="side">
            <!-- 阶段 -->
            <div class="side__block corner-box">
              <h4 class="side__title">出图阶段</h4>
              <ol class="steps">
                <li
                  v-for="(s, i) in stages"
                  :key="i"
                  class="steps__item"
                  :class="{ 'is-on': i === activeStage, 'is-done': progress >= s.at }"
                >
                  <span class="steps__dot">
                    <AppIcon v-if="progress >= s.at && i !== activeStage" name="check" :size="11" />
                  </span>
                  <span class="steps__label">{{ s.label }}</span>
                  <span class="steps__at mono">{{ Math.round(s.at * 100) }}%</span>
                </li>
              </ol>
            </div>

            <!-- 说明 -->
            <div v-if="summary.length" class="side__block corner-box">
              <h4 class="side__title">图面说明</h4>
              <p v-for="(t, i) in summary" :key="i" class="side__text">{{ t }}</p>
            </div>

            <!-- 明细表 -->
            <div v-if="bom.length" class="side__block corner-box">
              <h4 class="side__title">明细表</h4>
              <table class="bom">
                <thead>
                  <tr>
                    <th class="mono">序号</th>
                    <th>名称</th>
                    <th>材料</th>
                    <th class="mono">数量</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in bom"
                    :key="row.no"
                    :class="{ 'is-hot': hoverPart === row.part }"
                    @mouseenter="hoverPart = row.part"
                    @mouseleave="hoverPart = ''"
                    @focusin="hoverPart = row.part"
                    @focusout="hoverPart = ''"
                    tabindex="0"
                  >
                    <td class="mono">{{ row.no }}</td>
                    <td>{{ row.name }}</td>
                    <td class="mono">{{ row.material }}</td>
                    <td class="mono">{{ row.qty }}</td>
                  </tr>
                </tbody>
              </table>
              <p class="side__hint mono">悬停行可在左侧图面高亮对应零件</p>
            </div>

            <!-- 技术要求 -->
            <div v-if="notes.length" class="side__block corner-box">
              <h4 class="side__title">技术要求</h4>
              <ul class="notes">
                <li v-for="(t, i) in notes" :key="i">{{ t }}</li>
              </ul>
            </div>

            <div class="side__block side__block--sign corner-box">
              <div class="sign">
                <span class="mono">设计 张工</span>
                <span class="mono">审核 李工</span>
                <span class="mono">批准 王工</span>
              </div>
              <span class="stamp">已校核</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pin-section {
  position: relative;
  height: 210vh;
}
.pin-body {
  position: sticky;
  top: calc(var(--nav-h) + 12px);
  padding: 18px 0 24px;
}

/* 图纸抬头 */
.sheet__head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas:
    "no titles meta"
    "meter meter meter";
  align-items: end;
  gap: 10px 20px;
  padding-bottom: 10px;
  border-bottom: 3px double var(--rule-3);
}
.sheet__no {
  grid-area: no;
  font-family: var(--serif);
  font-size: clamp(2.2rem, 4vw, 3.4rem);
  font-weight: 700;
  line-height: 0.8;
  color: var(--paper-4);
  -webkit-text-stroke: 1.4px var(--ink);
  opacity: 0.9;
}
.sheet__titles {
  grid-area: titles;
  min-width: 0;
}
.sheet__title {
  font-size: clamp(1.3rem, 2.3vw, 2rem);
  letter-spacing: 0.03em;
  margin-top: 2px;
}
.sheet__meta {
  grid-area: meta;
  display: flex;
  gap: 20px;
  margin: 0;
  text-align: right;
}
.sheet__meta dt {
  font-size: 0.58rem;
}
.sheet__meta dd {
  margin: 0;
  font-family: var(--mono);
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.meter {
  grid-area: meter;
  display: grid;
  gap: 6px;
}
.meter__row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.meter__label {
  font-size: 0.62rem;
}
.meter__num {
  font-family: var(--mono);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--accent-ink);
  font-variant-numeric: tabular-nums;
}
.meter__btn {
  margin-left: auto;
}
.meter__track {
  position: relative;
  height: 5px;
  background: var(--paper-4);
  border-radius: var(--r-pill);
}
.meter__fill {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, var(--accent-2), var(--accent-ink));
  border-radius: var(--r-pill);
  transform-origin: left;
  transform: scaleX(0);
}
.meter__tick {
  position: absolute;
  top: -3px;
  width: 1px;
  height: 11px;
  background: var(--rule-2);
  border-radius: var(--r-pill);
}
.meter__tick.is-on {
  background: var(--accent-ink);
  box-shadow: 0 0 0 2px var(--accent-3);
}

/* 图面与侧栏 */
.sheet__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: clamp(16px, 2.4vw, 34px);
  margin-top: 16px;
  align-items: start;
}
.canvas {
  margin: 0;
}
.canvas__paper {
  position: relative;
  padding: clamp(8px, 1.2vw, 16px);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.52)),
    var(--paper-2);
  border-radius: 0 var(--r-md) 0 var(--r-md);
  box-shadow: var(--shadow-m);
}
/* 图幅自适应：宽高都不超出可视区域 */
.canvas__paper :deep(svg) {
  width: 100%;
  max-height: min(58vh, 640px);
}
/* 仅保留右上 + 左下两个角标 */
.corner {
  position: absolute;
  width: var(--corner);
  height: var(--corner);
  border: 0 solid var(--rule-2);
  pointer-events: none;
}
.corner--tr {
  top: 0;
  right: 0;
  border-top-width: 1px;
  border-right-width: 1px;
  border-top-right-radius: var(--r-md);
}
.corner--bl {
  bottom: 0;
  left: 0;
  border-bottom-width: 1px;
  border-left-width: 1px;
  border-bottom-left-radius: var(--r-md);
}
.canvas__cap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 0.82rem;
  color: var(--ink-3);
}

/* 侧栏 */
.side {
  display: grid;
  gap: 14px;
}
.side__block {
  --corner: 34px;
  padding: 12px 14px;
}
.side__title {
  font-size: 0.94rem;
  letter-spacing: 0.12em;
  padding-bottom: 6px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--rule-2);
}
.side__text {
  font-size: 0.86rem;
  color: var(--ink-2);
  line-height: 1.7;
}
.side__text + .side__text {
  margin-top: 6px;
}
.side__hint {
  margin-top: 8px;
  font-size: 0.58rem;
}
.steps {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 7px;
}
.steps__item {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 0.86rem;
  color: var(--ink-4);
  transition: color 0.25s ease, transform 0.25s ease;
}
.steps__item.is-done {
  color: var(--ink-2);
}
.steps__item.is-on {
  color: var(--accent-ink);
  font-weight: 700;
  transform: translateX(3px);
}
.steps__dot {
  display: grid;
  place-items: center;
  width: 14px;
  height: 14px;
  border: 1px solid currentColor;
  border-radius: 50%;
  flex: none;
}
.steps__item.is-on .steps__dot {
  background: var(--accent-3);
}
.steps__at {
  margin-left: auto;
  font-size: 0.56rem;
}

/* 明细表 */
.bom {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.bom th {
  text-align: left;
  font-weight: 400;
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  color: var(--ink-3);
  padding: 0 6px 6px 0;
  border-bottom: 1px solid var(--rule-2);
}
.bom td {
  padding: 6px 6px 6px 0;
  border-bottom: 1px dotted var(--rule);
  transition: background 0.2s ease, color 0.2s ease;
}
.bom tr {
  cursor: default;
}
.bom tbody tr:hover td,
.bom tbody tr.is-hot td {
  background: var(--accent-3);
  color: var(--accent-ink);
}

/* 技术要求 */
.notes {
  margin: 0;
  padding-left: 1.1em;
  font-size: 0.82rem;
  color: var(--ink-2);
  line-height: 1.7;
}
.notes li + li {
  margin-top: 4px;
}

.side__block--sign {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.sign {
  display: grid;
  gap: 3px;
}
.sign span {
  font-size: 0.6rem;
}

@media (max-width: 1180px) {
  .sheet__body {
    grid-template-columns: minmax(0, 1fr) 280px;
  }
}
@media (max-width: 900px) {
  .pin-section {
    height: auto;
  }
  .pin-body {
    position: static;
    padding-top: 26px;
  }
  .sheet__head {
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas:
      "no titles"
      "meta meta"
      "meter meter";
  }
  .sheet__meta {
    text-align: left;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 14px;
  }
  .sheet__body {
    grid-template-columns: 1fr;
  }
}
</style>
