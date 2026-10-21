<script setup>
/**
 * 首页装配：三段式
 *   ① 报头 + 导航条（SiteHeader）
 *   ② 主体：01 需求粗整理 → 01-00 报表逐节详填 → 02 产品目录检索 chatbot → 02-00 车间模拟看板 → 03 销售回馈与报价 → 04 全流程总览
 *   ③ 收尾 CTA 与页脚（SiteFooter）均已注释隐藏，页面到 03 报价结束
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from './components/AppIcon.vue'
import FactorySim from './components/FactorySim.vue'
import ProcessDashboard from './components/ProcessDashboard.vue'
import ProductCatalogChat from './components/ProductCatalogChat.vue'
import RequirementFlow from './components/RequirementFlow.vue'
import RequirementIntake from './components/RequirementIntake.vue'
import LeadStory from './components/LeadStory.vue'
import SalesQuoteChat from './components/SalesQuoteChat.vue'
// import SiteFooter from './components/SiteFooter.vue'  // 页脚已隐藏
import SiteHeader from './components/SiteHeader.vue'
import { usePageProgress } from './composables/useScrollProgress.js'

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
</script>

<template>
  <SiteHeader />

  <main>
    <LeadStory />

    <!-- 01 销售端 · 客需需求粗整理 -->
    <RequirementIntake />

    <!-- 01-00 流程化 · 销售端工程细节对齐（照报表逐节详填） -->
    <RequirementFlow />

    <!-- 02 产品目录检索 · 图纸与 BOM（chatbot 工具） -->
    <ProductCatalogChat />
    <!-- 02-00 车间模拟 · 产能与人力 -->
    <FactorySim />

    <!-- 03 销售端 · 回馈与报价（chatbot 工具） -->
    <SalesQuoteChat />

    <!-- 04 全流程总览（Dashboard，可点击跳转） -->
    <ProcessDashboard />

    <!-- 收尾条（官网 CTA，已按需求注释隐藏）
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
    -->
  </main>

  <!-- 页脚（四栏链接 / 订阅条 / 版权条，已按需求注释隐藏）
  <SiteFooter />
  -->

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
main {
  padding-bottom: clamp(40px, 6vw, 90px);
}
</style>
