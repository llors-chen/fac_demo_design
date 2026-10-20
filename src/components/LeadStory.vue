<script setup>
/**
 * 头版（报纸第一版）：导语 + 本期图纸目录 + 数据栏 + 底部动态条
 */
import AppIcon from './AppIcon.vue'
import { frontStats, sheetIndex } from '../data/site.js'

function goto(anchor) {
  document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const tickerItems = [
  '本月交付 8 套样品解决方案，覆盖 E-Mobility 与工业传动',
  '图纸库新增 216 张设计成果，全部完成版本校核',
  '平湖工厂完成产线换型，交付周期缩短至 7 天',
  '新增 DWG 在线浏览能力：无需安装 CAD 即可批注与查阅',
]
</script>

<template>
  <section class="front" aria-labelledby="front-headline">
    <div class="wrap">
      <div class="front__grid">
        <!-- 头条 -->
        <article class="lead">
          <p class="kicker">本期头条 · 设计成果公开</p>
          <h2 id="front-headline" class="lead__head">
            以图纸为准，<br />把制造讲清楚
          </h2>
          <p class="lead__deck">
            从总装图到零件图，从尺寸链到形位公差：我们把每一份设计成果摊开在纸面上，
            也搬进浏览器里。滚一滚，图纸会自己画出来。
          </p>
          <p class="lead__byline mono">
            本报记者 · 工艺与设计中心 ／ 2026-10-20 ／ 第 001 版
          </p>

          <div class="lead__body cols-2">
            <p class="dropcap">
              工业制造的说服力，从来不在形容词里，而在图纸上：一条中心线定基准，
              一组尺寸链定装配，一行技术要求定热处理。我们把这三样东西放到了网页上——
              不是为了好看，而是为了让销售、研发、生产、客户看到同一张图、同一组数。
            </p>
            <p>
              首页主体按“三段式”展开：最上方是报头与导航条，中间是三份设计成果的滚动展陈，
              最下方是索引式的页脚。前两份图纸为固定动画演示，描线、剖面、标注依次落笔；
              第三份是可直接浏览的 DWG 窗口，右侧配有图纸助手，用于问答与核对。
            </p>
            <p>
              所有图纸均来自真实工程习惯：图框、标题栏、明细表、粗糙度与形位公差符号一应俱全。
              读者不需要安装任何 CAD 软件，也不需要下载附件，就能完成一次“看图—核对—留痕”的闭环。
            </p>
          </div>

          <div class="lead__cta">
            <button class="btn btn--solid" type="button" @click="goto('sheet-01')">
              <AppIcon name="ruler" :size="16" />
              从第一张图看起
            </button>
            <button class="btn" type="button">
              <AppIcon name="download" :size="16" />
              下载企业样本
            </button>
            <button class="btn" type="button">
              <AppIcon name="clock" :size="16" />
              预约工厂参观
            </button>
          </div>
        </article>

        <!-- 右栏：目录 + 数据 -->
        <aside class="index">
          <div class="index__box paper-card">
            <h3 class="index__title">本期图纸目录</h3>
            <ol class="index__list">
              <li v-for="s in sheetIndex" :key="s.no">
                <button class="index__item" type="button" @click="goto(s.anchor)">
                  <span class="index__no mono">{{ s.no }}</span>
                  <span class="index__main">
                    <span class="index__name">{{ s.title }}</span>
                    <span class="index__meta mono">{{ s.meta }}</span>
                    <span class="index__note">{{ s.note }}</span>
                  </span>
                  <AppIcon name="arrowRight" :size="16" class="index__arrow" />
                </button>
              </li>
            </ol>
          </div>

          <div class="index__box index__box--stats">
            <h3 class="index__title">数据栏</h3>
            <dl class="stats">
              <div v-for="s in frontStats" :key="s.label" class="stats__row">
                <dt class="stats__label">{{ s.label }}</dt>
                <dd class="stats__value">
                  {{ s.value }}<span class="stats__unit">{{ s.unit }}</span>
                </dd>
              </div>
            </dl>
            <div class="index__stamp">
              <span class="stamp">已校核 · 2026</span>
            </div>
          </div>
        </aside>
      </div>

      <!-- 动态条 -->
      <div class="ticker" aria-hidden="true">
        <span class="ticker__label mono">厂区快讯</span>
        <div class="ticker__viewport">
          <div class="ticker__track">
            <span v-for="(t, i) in [...tickerItems, ...tickerItems]" :key="i" class="ticker__item">
              {{ t }}<em class="ticker__sep">◆</em>
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.front {
  padding: clamp(26px, 4vw, 54px) 0 clamp(18px, 2.4vw, 30px);
}
.front__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
  gap: clamp(24px, 3.4vw, 52px);
  align-items: start;
}

/* 头条 */
.lead__head {
  margin-top: 12px;
  font-size: clamp(2.1rem, 5vw, 3.9rem);
  line-height: 1.12;
  letter-spacing: 0.02em;
}
.lead__deck {
  margin-top: 16px;
  padding: 6px 0 6px 16px;
  border-left: 3px solid var(--accent);
  border-radius: 0 var(--r-sm) var(--r-sm) 0;
  font-size: clamp(1rem, 1.4vw, 1.14rem);
  color: var(--ink-2);
  max-width: 62ch;
}
.lead__byline {
  margin-top: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--rule);
  font-size: 0.66rem;
}
.lead__body {
  margin-top: 18px;
  font-size: 1rem;
  color: var(--ink-2);
  text-align: justify;
}
.lead__body p + p {
  margin-top: 0.9em;
}
.lead__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 26px;
}

/* 右栏 */
.index {
  display: grid;
  gap: 18px;
  position: relative;
}
.index__box {
  padding: 18px 18px 16px;
}
.index__box--stats {
  background: var(--paper-3);
}
.index__title {
  font-size: 1.02rem;
  letter-spacing: 0.1em;
  padding-bottom: 8px;
  border-bottom: 3px double var(--rule-3);
}
.index__list {
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
}
.index__item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 12px 6px 12px 8px;
  text-align: left;
  border-bottom: 1px dashed var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  transition: background 0.24s ease, padding-left 0.24s ease;
}
.index__item:hover {
  background: var(--accent-3);
  padding-left: 8px;
}
.index__no {
  font-size: 0.8rem;
  color: var(--accent-ink);
  padding-top: 3px;
}
.index__main {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.index__name {
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--ink);
}
.index__meta {
  font-size: 0.6rem;
}
.index__note {
  font-size: 0.78rem;
  color: var(--ink-3);
  line-height: 1.5;
}
.index__arrow {
  margin-left: auto;
  margin-top: 4px;
  color: var(--ink-4);
  transition: transform 0.24s ease, color 0.24s ease;
}
.index__item:hover .index__arrow {
  color: var(--accent-ink);
  transform: translateX(4px);
}
.stats {
  margin: 10px 0 0;
}
.stats__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px dotted var(--rule-2);
}
.stats__label {
  font-size: 0.86rem;
  color: var(--ink-2);
}
.stats__value {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.stats__unit {
  margin-left: 3px;
  font-size: 0.7rem;
  font-weight: 400;
  color: var(--ink-3);
}
.index__stamp {
  margin-top: 16px;
  text-align: right;
}

/* 动态条 */
.ticker {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: clamp(24px, 3vw, 40px);
  padding-top: 12px;
  border-top: 3px double var(--rule-3);
}
.ticker__label {
  flex: none;
  padding: 3px 10px;
  border: 1px solid var(--ink);
  border-radius: var(--r-pill);
  background: var(--ink);
  color: var(--paper);
  font-size: 0.6rem;
}
.ticker__viewport {
  overflow: hidden;
  flex: 1;
  mask-image: linear-gradient(90deg, transparent, #000 3%, #000 97%, transparent);
}
.ticker__track {
  display: inline-flex;
  gap: 34px;
  white-space: nowrap;
  animation: ticker 46s linear infinite;
}
.ticker__item {
  font-size: 0.86rem;
  color: var(--ink-2);
}
.ticker__sep {
  margin-left: 34px;
  color: var(--accent);
  font-style: normal;
}
@keyframes ticker {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ticker__track {
    animation: none;
  }
}

@media (max-width: 980px) {
  .front__grid {
    grid-template-columns: 1fr;
  }
}
</style>
