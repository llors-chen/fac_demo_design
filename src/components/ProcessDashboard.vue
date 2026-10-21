<script setup>
/**
 * 04 · 全流程总览（Dashboard）
 *
 * 顺序链：01 → 01-00 → 02 → 02-00 → 03
 * 每个环节一张可点击卡片，点击平滑滚动到对应区块；箭头处标注交接物。
 */
import AppIcon from './AppIcon.vue'
import { dashKpis, dashNext, dashRisks, dashTrail, flowStages } from '../data/dashboard.js'

const statusMeta = {
  done: { label: '已完成', cls: 'is-done' },
  m3: { label: '已上载 M3', cls: 'is-m3' },
  run: { label: '运行中', cls: 'is-run' },
  doing: { label: '进行中', cls: 'is-doing' },
}

function goto(anchor) {
  document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const total = flowStages.length
</script>

<template>
  <section id="dashboard" class="dash">
    <div class="wrap">
      <header class="sec-head">
        <span class="sec-head__no" aria-hidden="true">04</span>
        <div>
          <p class="kicker">全流程总览 · Process dashboard</p>
          <h3 class="sec-head__title">从客户原话到报价：5 个环节的顺序、交接与状态</h3>
        </div>
        <dl class="sec-head__meta">
          <div><dt class="mono">环节</dt><dd>{{ total }} 个</dd></div>
          <div><dt class="mono">端到端</dt><dd>154 min</dd></div>
          <div><dt class="mono">当前</dt><dd>03 报价</dd></div>
        </dl>
      </header>

      <p class="sec-note">
        点任意环节卡片可直接跳到对应区块。卡片之间的箭头是「交接物」——上一环的输出就是下一环的输入，
        顺序不可跳步（01 初判 → 01-00 需求基线 → 02 图纸/BOM → 02-00 产能约束 → 03 报价与交期）。
      </p>

      <!-- KPI -->
      <div class="dkpis">
        <div v-for="k in dashKpis" :key="k.label" class="dkpi">
          <span class="dkpi__label mono">{{ k.label }}</span>
          <span class="dkpi__value">{{ k.value }}<em>{{ k.unit }}</em></span>
          <span class="dkpi__sub mono">{{ k.sub }}</span>
        </div>
      </div>

      <!-- 顺序链 -->
      <ol class="chain">
        <li v-for="(s, i) in flowStages" :key="s.no" class="chain__item">
          <button class="node" type="button" @click="goto(s.anchor)">
            <span class="node__top">
              <span class="node__no mono">{{ s.no }}</span>
              <span class="node__state mono" :class="statusMeta[s.status].cls">
                {{ statusMeta[s.status].label }}
              </span>
            </span>

            <span class="node__stage mono">{{ s.stage }}</span>
            <span class="node__title">{{ s.title }}</span>
            <span class="node__role">{{ s.role }}</span>

            <span class="node__outputs">
              <em v-for="o in s.outputs" :key="o" class="node__chip">{{ o }}</em>
            </span>

            <span class="node__foot">
              <span class="node__dur mono">{{ s.dur }}</span>
              <span class="node__window mono">{{ s.window }}</span>
              <span class="node__go mono">
                查看
                <AppIcon name="arrowRight" :size="12" />
              </span>
            </span>
          </button>

          <span v-if="i < total - 1" class="chain__link" aria-hidden="true">
            <span class="chain__line"></span>
            <span class="chain__handoff mono">{{ s.handoff }}</span>
            <AppIcon name="chevronRight" :size="14" class="chain__arrow" />
          </span>
        </li>
      </ol>

      <!-- 留痕 + 风险 + 下一步 -->
      <div class="grid3">
        <div class="pane">
          <header class="pane__head">
            <AppIcon name="file" :size="15" />
            <h4 class="pane__title">全链路留痕</h4>
          </header>
          <dl class="trail">
            <div v-for="t in dashTrail" :key="t.label" class="trail__row">
              <dt class="mono">{{ t.label }}</dt>
              <dd>{{ t.value }}</dd>
            </div>
          </dl>
        </div>

        <div class="pane">
          <header class="pane__head">
            <AppIcon name="info" :size="15" />
            <h4 class="pane__title">风险与待确认</h4>
          </header>
          <ul class="risks">
            <li v-for="r in dashRisks" :key="r.text" class="risk" :class="'is-' + r.level">
              <span class="risk__dot"></span>
              {{ r.text }}
            </li>
          </ul>
        </div>

        <div class="pane">
          <header class="pane__head">
            <AppIcon name="check" :size="15" />
            <h4 class="pane__title">下一步动作</h4>
          </header>
          <ol class="next">
            <li v-for="(n, i) in dashNext" :key="n" class="next__item">
              <span class="next__no mono">{{ String(i + 1).padStart(2, '0') }}</span>
              {{ n }}
            </li>
          </ol>
        </div>
      </div>

      <div class="dashfoot">
        <span class="mono">顺序链：01 → 01-00 → 02 → 02-00 → 03</span>
        <button class="btn btn--sm" type="button" @click="goto('req-intake')">
          <AppIcon name="arrowUp" :size="13" />
          回到第一环
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dash {
  padding: clamp(30px, 4.4vw, 64px) 0 0;
}

/* 抬头 */
.sec-head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: end;
  gap: 10px 20px;
  padding-bottom: 10px;
  border-bottom: 3px double var(--rule-3);
}
.sec-head__no {
  font-size: clamp(1.9rem, 3.4vw, 2.9rem);
  font-weight: 700;
  line-height: 0.85;
  color: var(--paper-4);
  -webkit-text-stroke: 1.4px var(--ink);
  opacity: 0.9;
}
.sec-head__title {
  font-size: clamp(1.3rem, 2.3vw, 2rem);
  letter-spacing: 0.03em;
  margin-top: 2px;
}
.sec-head__meta {
  display: flex;
  gap: 20px;
  margin: 0;
  text-align: right;
}
.sec-head__meta dt {
  font-size: 0.58rem;
}
.sec-head__meta dd {
  margin: 0;
  font-family: var(--mono);
  font-size: 0.86rem;
  font-weight: 700;
}
.sec-note {
  margin-top: 12px;
  max-width: 100ch;
  font-size: 0.9rem;
  color: var(--ink-3);
}

/* KPI */
.dkpis {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}
.dkpi {
  display: grid;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid var(--rule);
  border-radius: 0 var(--r-sm) 0 var(--r-sm);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.4)),
    var(--paper-2);
}
.dkpi__label {
  font-size: 0.5rem;
}
.dkpi__value {
  font-size: 1.55rem;
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.dkpi__value em {
  margin-left: 3px;
  font-size: 0.56rem;
  font-style: normal;
  font-weight: 400;
  color: var(--ink-3);
}
.dkpi__sub {
  font-size: 0.46rem;
  color: var(--ink-4);
}

/* 顺序链 */
.chain {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}
.chain__item {
  position: relative;
  display: flex;
  min-width: 0;
  padding-right: 26px;
}
.node {
  display: grid;
  gap: 4px;
  width: 100%;
  padding: 11px 13px 12px;
  border: 1px solid var(--rule-2);
  border-radius: 0 var(--r-md) 0 var(--r-md);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.55)),
    var(--paper-2);
  text-align: left;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease,
    background 0.2s ease;
}
.node:hover {
  transform: translateY(-2px);
  border-color: var(--accent-2);
  background: var(--accent-3);
  box-shadow: var(--shadow-s);
}
.node__top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.node__no {
  display: grid;
  place-items: center;
  min-width: 34px;
  height: 22px;
  padding: 0 7px;
  border-radius: var(--r-xs);
  background: var(--ink);
  color: var(--paper);
  font-size: 0.56rem;
}
.node__state {
  margin-left: auto;
  font-size: 0.44rem;
  padding: 1px 7px;
  border-radius: var(--r-pill);
  border: 1px solid var(--rule-2);
  color: var(--ink-3);
  white-space: nowrap;
}
.node__state.is-done {
  border-color: var(--ok);
  background: var(--ok-soft);
  color: var(--ok);
}
.node__state.is-m3 {
  border-color: var(--info);
  background: var(--info-soft);
  color: var(--info);
}
.node__state.is-run {
  border-color: var(--warn);
  background: var(--warn-soft);
  color: var(--warn);
}
.node__state.is-doing {
  border-color: var(--accent-ink);
  background: var(--accent);
  color: #fff;
}
.node__stage {
  font-size: 0.44rem;
  color: var(--ink-4);
}
.node__title {
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.4;
}
.node__role {
  font-size: 0.7rem;
  color: var(--ink-3);
}
.node__outputs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}
.node__chip {
  font-style: normal;
  font-size: 0.62rem;
  padding: 1px 7px;
  border-radius: var(--r-pill);
  border: 1px solid var(--rule-2);
  background: var(--surface);
  color: var(--ink-2);
  white-space: nowrap;
}
.node__foot {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px dotted var(--rule);
}
.node__dur {
  font-size: 0.5rem;
  color: var(--ink-2);
}
.node__window {
  font-size: 0.44rem;
  color: var(--ink-4);
}
.node__go {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.46rem;
  color: var(--accent-ink);
}
.node:hover .node__go :deep(svg) {
  transform: translateX(2px);
}

/* 交接箭头 */
.chain__link {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 26px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  justify-items: center;
  align-items: center;
  pointer-events: none;
}
.chain__line {
  width: 1px;
  height: 100%;
  background: var(--rule-2);
  grid-row: 1 / -1;
  grid-column: 1;
}
.chain__handoff {
  grid-row: 2;
  grid-column: 1;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 0.4rem;
  color: var(--ink-4);
  background: var(--paper);
  padding: 4px 1px;
  max-height: 100%;
  overflow: hidden;
}
.chain__arrow {
  grid-row: 3;
  grid-column: 1;
  color: var(--ink-4);
  background: var(--paper);
}

/* 三栏 */
.grid3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
  align-items: start;
}
.pane {
  padding: 10px 12px 12px;
  border: 1px solid var(--rule);
  border-radius: 0 var(--r-sm) 0 var(--r-sm);
  background: var(--surface);
  min-width: 0;
}
.pane__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  margin-bottom: 9px;
  border-bottom: 1px solid var(--rule);
  color: var(--ink-3);
}
.pane__title {
  font-size: 0.9rem;
  letter-spacing: 0.04em;
  color: var(--ink);
}
.trail {
  margin: 0;
}
.trail__row {
  display: grid;
  grid-template-columns: 5.6em minmax(0, 1fr);
  gap: 8px;
  padding: 5px 0;
  border-bottom: 1px dotted var(--rule);
}
.trail__row:last-child {
  border-bottom: none;
}
.trail__row dt {
  font-size: 0.48rem;
  padding-top: 2px;
}
.trail__row dd {
  margin: 0;
  font-size: 0.78rem;
  color: var(--ink-2);
  line-height: 1.5;
}
.risks {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.risk {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  font-size: 0.78rem;
  line-height: 1.65;
  color: var(--ink-2);
}
.risk__dot {
  flex: none;
  width: 7px;
  height: 7px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--ink-4);
}
.risk.is-warn .risk__dot {
  background: var(--warn);
}
.risk.is-risk .risk__dot {
  background: var(--danger);
}
.risk.is-ok .risk__dot {
  background: var(--ok);
}
.next {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.next__item {
  display: flex;
  gap: 8px;
  font-size: 0.8rem;
  line-height: 1.6;
  color: var(--ink-2);
}
.next__no {
  flex: none;
  font-size: 0.5rem;
  padding-top: 2px;
  color: var(--accent-ink);
}

.dashfoot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--rule);
}
.dashfoot > span {
  font-size: 0.5rem;
  color: var(--ink-4);
}

@media (max-width: 1180px) {
  .dkpis {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .chain {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .chain__item {
    padding-right: 0;
  }
  .chain__link {
    display: none;
  }
  .grid3 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 430px) {
  .dkpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .chain {
    grid-template-columns: 1fr;
  }
  .node__title {
    font-size: 0.98rem;
  }
  .node__role,
  .node__chip {
    font-size: 0.72rem;
  }
}
</style>
