<script setup>
/**
 * 首页装配：三段式
 *   ① 报头 + 导航条（SiteHeader）
 *   ② 主体：头版导语 + 两张定死图纸（滚动描线）+ 第三张 DWG 在线浏览（3:1 图纸助手）
 *   ③ 页脚（SiteFooter）
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from './components/AppIcon.vue'
import ChatPanel from './components/ChatPanel.vue'
import DrawingSheet from './components/DrawingSheet.vue'
import DrawingGearbox from './components/drawings/DrawingGearbox.vue'
import DrawingShaft from './components/drawings/DrawingShaft.vue'
import DwgViewer from './components/DwgViewer.vue'
import LeadStory from './components/LeadStory.vue'
import PartCompare from './components/PartCompare.vue'
import SiteFooter from './components/SiteFooter.vue'
import SiteHeader from './components/SiteHeader.vue'
import { usePageProgress } from './composables/useScrollProgress.js'
import { gearboxBom, shaftNotes } from './data/site.js'

const progress = usePageProgress()
const showTop = ref(false)

function onScroll() {
  showTop.value = window.scrollY > 700
}
function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

const percent = computed(() => Math.round(progress.value * 100))

const gearboxStages = [
  { label: '图框与基准线', at: 0 },
  { label: '壳体与齿轮轮廓', at: 0.12 },
  { label: '剖面线', at: 0.42 },
  { label: '尺寸标注', at: 0.56 },
  { label: '引出标注与标题栏', at: 0.74 },
]

const shaftStages = [
  { label: '图框与中心线', at: 0 },
  { label: '轴轮廓与键槽', at: 0.12 },
  { label: '移出断面剖面线', at: 0.42 },
  { label: '尺寸链与公差', at: 0.56 },
  { label: '剖切标注与标题栏', at: 0.74 },
]
</script>

<template>
  <SiteHeader />

  <main>
    <LeadStory />

    <!-- 图纸 01 -->
    <DrawingSheet
      no="01"
      anchor="sheet-01"
      title="行星齿轮减速箱 · 总装图"
      sheet-no="NY-JS-2026-001"
      scale="1 : 2"
      date="2026-02-14"
      caption="滚动驱动：向下滚动，图纸按 图框 → 轮廓 → 剖面 → 尺寸 → 明细 逐层生成；悬停右侧明细表可高亮零件。"
      :stages="gearboxStages"
      :bom="gearboxBom"
      :summary="[
        '行星传动采用 2Z-X 正号机构：太阳轮输入，行星架输出，内齿圈固定于壳体。',
        '主视图表达齿系布置与均布螺栓孔，B—B 剖视表达壳体壁厚、轴承位与输出轴。',
      ]"
    >
      <template #default="{ highlight }">
        <DrawingGearbox :highlight="highlight" />
      </template>
    </DrawingSheet>

    <!-- 图纸 02 -->
    <DrawingSheet
      no="02"
      anchor="sheet-02"
      title="传动轴 · 零件图"
      sheet-no="NY-ZC-2026-014"
      scale="1 : 1.5"
      date="2026-02-18"
      caption="阶梯轴由八段轴颈组成，尺寸链、表面粗糙度与形位公差随滚动依次落笔；A—A 为键槽处移出断面。"
      :stages="shaftStages"
      :notes="shaftNotes"
      :summary="[
        '基准 A 为两端中心孔轴线，轴承位 ⌀56 与 ⌀60 同轴度 ⌀0.02 A。',
        '键槽 14×9 位于 ⌀80 轴段，长度 130，两侧对称度 0.03。',
      ]"
    >
      <template #default="{ highlight }">
        <DrawingShaft :highlight="highlight" />
      </template>
    </DrawingSheet>

    <!-- 图纸 03：DWG 在线浏览 + 图纸助手（3 : 1） -->
    <section id="sheet-03" class="dwg-section">
      <div class="wrap">
        <header class="dwg-head">
          <span class="dwg-head__no" aria-hidden="true">03</span>
          <div>
            <p class="kicker">设计成果 · 第 03 张 · 在线浏览</p>
            <h3 class="dwg-head__title">法兰盘装配图 · DWG 在线浏览</h3>
          </div>
          <dl class="dwg-head__meta">
            <div><dt class="mono">图号</dt><dd>NY-FL-2026-008</dd></div>
            <div><dt class="mono">图幅</dt><dd>A2 · 1 : 2</dd></div>
            <div><dt class="mono">修订</dt><dd>R3 · 2026-02-20</dd></div>
          </dl>
        </header>

        <div class="dwg-row">
          <DwgViewer file-name="法兰盘装配图.dwg" />
          <ChatPanel />
        </div>

        <p class="dwg-note">
          <AppIcon name="info" :size="14" />
          演示内置一张示例图纸：支持滚轮缩放、拖拽平移、图层开关与两点测量。
          如需接入真实 DWG，可把 <code>&lt;DwgViewer&gt;</code> 的 <code>embed-url</code>
          指向内网转换服务或 ODA / Autodesk Platform Services 的在线视图地址。
        </p>
      </div>
    </section>

    <!-- 图纸 04：历史零件对比 + 组装交互（3 : 1） -->
    <PartCompare />

    <!-- 收尾条 -->
    <section class="outro">
      <div class="wrap outro__in">
        <div>
          <p class="kicker">本期结语</p>
          <h3 class="outro__title">图纸看得清，交期才敢承诺。</h3>
          <p class="outro__text">
            设计成果在线浏览只是第一步：下一步把询价、算价与交付日期预测接到同一张图纸上。
          </p>
        </div>
        <div class="outro__cta">
          <button class="btn btn--solid" type="button">
            <AppIcon name="flask" :size="16" />
            索取样品解决方案
          </button>
          <button class="btn" type="button">
            <AppIcon name="newspaper" :size="16" />
            查看全部图纸
          </button>
        </div>
      </div>
    </section>
  </main>

  <SiteFooter />

  <!-- 阅读进度（右侧竖条） -->
  <div class="rail" aria-hidden="true">
    <span class="rail__label mono">阅读进度</span>
    <span class="rail__track"><span class="rail__fill" :style="{ transform: `scaleY(${progress})` }"></span></span>
    <span class="rail__num mono">{{ percent }}%</span>
  </div>

  <transition name="up">
    <button v-show="showTop" class="totop" type="button" aria-label="回到顶部" @click="toTop">
      <AppIcon name="arrowUp" :size="18" />
    </button>
  </transition>
</template>

<style scoped>
/* 图纸 03 */
.dwg-section {
  padding: clamp(30px, 4.4vw, 64px) 0 0;
}
.dwg-head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: end;
  gap: 10px 20px;
  padding-bottom: 10px;
  border-bottom: 3px double var(--rule-3);
}
.dwg-head__no {
  font-size: clamp(2.2rem, 4vw, 3.4rem);
  font-weight: 700;
  line-height: 0.8;
  color: var(--paper-4);
  -webkit-text-stroke: 1.4px var(--ink);
  opacity: 0.9;
}
.dwg-head__title {
  font-size: clamp(1.3rem, 2.3vw, 2rem);
  letter-spacing: 0.03em;
  margin-top: 2px;
}
.dwg-head__meta {
  display: flex;
  gap: 20px;
  margin: 0;
  text-align: right;
}
.dwg-head__meta dt {
  font-size: 0.58rem;
}
.dwg-head__meta dd {
  margin: 0;
  font-family: var(--mono);
  font-size: 0.86rem;
  font-weight: 700;
}

/* 3 : 1 —— 左侧 DWG 窗口 : 右侧图纸助手 */
.dwg-row {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: clamp(12px, 1.6vw, 22px);
  height: clamp(440px, 74vh, 720px);
  margin-top: 18px;
}
.dwg-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
  font-size: 0.82rem;
  color: var(--ink-3);
}
.dwg-note code {
  font-family: var(--mono);
  font-size: 0.76rem;
  padding: 1px 6px;
  background: var(--paper-3);
  border: 1px solid var(--rule);
  border-radius: var(--r-xs);
}

/* 收尾 */
.outro {
  margin-top: clamp(30px, 4vw, 56px);
  padding: clamp(20px, 2.6vw, 34px) 0;
  border-top: 1px solid var(--rule-2);
  border-bottom: 1px solid var(--rule-2);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0)), var(--paper-2);
}
.outro__in {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 26px;
  flex-wrap: wrap;
}
.outro__title {
  font-size: clamp(1.4rem, 2.6vw, 2.1rem);
  margin-top: 6px;
}
.outro__text {
  margin-top: 8px;
  max-width: 56ch;
  font-size: 0.94rem;
  color: var(--ink-2);
}
.outro__cta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 阅读进度 */
.rail {
  position: fixed;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: grid;
  justify-items: center;
  gap: 8px;
  z-index: 50;
}
.rail__label {
  font-size: 0.5rem;
  writing-mode: vertical-rl;
  letter-spacing: 0.3em;
  color: var(--ink-4);
}
.rail__track {
  position: relative;
  width: 4px;
  height: 120px;
  background: var(--paper-4);
  border-radius: var(--r-pill);
}
.rail__fill {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--accent-2), var(--accent-ink));
  border-radius: var(--r-pill);
  transform-origin: top;
}
.rail__num {
  font-size: 0.5rem;
  color: var(--accent-ink);
}

/* 回到顶部 */
.totop {
  position: fixed;
  right: 14px;
  bottom: 20px;
  z-index: 50;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--rule-2);
  border-radius: 0 var(--r-md) 0 var(--r-md);
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-s);
  transition: background 0.22s ease, color 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
}
.totop:hover {
  background: var(--accent-3);
  border-color: var(--accent-ink);
  color: var(--accent-ink);
  transform: translateY(-3px);
}
.up-enter-active,
.up-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}
.up-enter-from,
.up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 1180px) {
  .rail {
    display: none;
  }
}
@media (max-width: 980px) {
  /* 窄屏改为上下堆叠，比例关系改为 3:1 的高度分配 */
  .dwg-row {
    grid-template-columns: 1fr;
    height: auto;
  }
  .dwg-row > :first-child {
    height: 62vh;
    min-height: 380px;
  }
  .dwg-head {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .dwg-head__meta {
    grid-column: 1 / -1;
    text-align: left;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 14px;
  }
}
</style>
