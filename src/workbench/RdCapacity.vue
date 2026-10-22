<script setup>
/**
 * S4 · 产能与人力评估（研发 · 计划）
 *
 * 独立页面：4 条流水线饱和度（对照推荐系数）、人工延迟、人力工时与成本、插单可行性。
 * 完成后回传销售，进入 S5 客户回执与工单归档。
 */
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { rdMatch } from './data.js'

const props = defineProps({
  order: { type: Object, required: true },
  active: { type: Boolean, default: true },
  step: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['fill'])

const shift = ref('day')
const shifts = [
  { key: 'day', label: '白班', factor: 1, satDelta: 0, hours: rdMatch.labor.hours, cost: rdMatch.labor.cost, rate: 38 },
  { key: 'night', label: '夜班', factor: 0.72, satDelta: -0.07, hours: Math.round(rdMatch.labor.hours * 0.72), cost: 13209, rate: 51 },
]
const cur = computed(() => shifts.find((s) => s.key === shift.value) || shifts[0])

const lines = computed(() =>
  rdMatch.lines.map((l) => {
    const sat = Math.max(0.35, Math.min(1.15, l.sat + cur.value.satDelta))
    return { ...l, sat, output: Math.round(l.output * cur.value.factor) }
  }),
)
const avgSat = computed(() => {
  const staff = lines.value.reduce((s, l) => s + l.staff, 0)
  return lines.value.reduce((s, l) => s + l.sat * l.staff, 0) / staff
})
const tone = (v) => (v > rdMatch.recommended + 0.06 ? 'hot' : v >= rdMatch.recommended ? 'warn' : 'ok')
const totalOutput = computed(() => lines.value.reduce((s, l) => s + l.output, 0))
const unitCost = computed(() => Math.round((cur.value.cost / totalOutput.value) * 100) / 100)
</script>

<template>
  <div class="s4">
    <section class="pane">
      <header class="pane__head">
        <AppIcon name="factory" :size="15" />
        <h3 class="pane__title">S4 产能与人力评估 · {{ order.product }}</h3>
        <div class="shifts">
          <button
            v-for="s in shifts"
            :key="s.key"
            class="shift"
            :class="{ 'is-on': shift === s.key }"
            type="button"
            @click="shift = s.key"
          >
            {{ s.label }}
          </button>
        </div>
      </header>

      <!-- 汇总 -->
      <div class="kpis">
        <div class="kpi kpi--accent">
          <span class="kpi__label mono">加权饱和度</span>
          <span class="kpi__value">{{ Math.round(avgSat * 100) }}<em>%</em></span>
          <span class="kpi__sub mono">推荐 {{ Math.round(rdMatch.recommended * 100) }}%</span>
        </div>
        <div class="kpi">
          <span class="kpi__label mono">今日产出</span>
          <span class="kpi__value">{{ totalOutput.toLocaleString() }}<em>pcs</em></span>
          <span class="kpi__sub mono">4 条线合计</span>
        </div>
        <div class="kpi">
          <span class="kpi__label mono">人力工时</span>
          <span class="kpi__value">{{ cur.hours }}<em>h</em></span>
          <span class="kpi__sub mono">加班 {{ rdMatch.labor.ot }} h</span>
        </div>
        <div class="kpi">
          <span class="kpi__label mono">人工成本</span>
          <span class="kpi__value">￥{{ cur.cost.toLocaleString() }}</span>
          <span class="kpi__sub mono">单价 ￥{{ cur.rate }}/h · 单件 ￥{{ unitCost }}</span>
        </div>
        <div class="kpi">
          <span class="kpi__label mono">插单可行性</span>
          <span class="kpi__value kpi__value--ok">可插单</span>
          <span class="kpi__sub mono">{{ order.qty }} · 占 A 线 3 天</span>
        </div>
      </div>

      <!-- 流水线 -->
      <div class="lines">
        <article v-for="l in lines" :key="l.key" class="line">
          <header class="line__head">
            <span class="line__key mono">{{ l.key }}</span>
            <h4 class="line__name">{{ l.name }}</h4>
            <span class="line__state mono" :class="'is-' + tone(l.sat)">
              {{ l.sat > rdMatch.recommended + 0.06 ? '超载' : l.sat >= rdMatch.recommended ? '偏高' : '正常' }}
            </span>
          </header>
          <div class="sat">
            <span class="sat__bar">
              <i :class="'is-' + tone(l.sat)" :style="{ width: l.sat * 100 + '%' }"></i>
              <em class="sat__mark" :style="{ left: rdMatch.recommended * 100 + '%' }"></em>
            </span>
            <span class="sat__num mono">{{ Math.round(l.sat * 100) }}%</span>
          </div>
          <dl class="line__stats">
            <div><dt class="mono">节拍</dt><dd>{{ l.tact }}s</dd></div>
            <div><dt class="mono">人工延迟</dt><dd>{{ l.delay }}h</dd></div>
            <div><dt class="mono">产出</dt><dd>{{ l.output }}</dd></div>
            <div><dt class="mono">人员</dt><dd>{{ l.staff }}</dd></div>
          </dl>
        </article>
      </div>

      <p class="note mono">
        B 线饱和度 {{ Math.round((rdMatch.lines[1].sat + cur.satDelta) * 100) }}% 为最高，建议把 2 个工位前置到
        A 线空闲时段；{{ order.qty }} 可插单，样件需占用 A 线 1 个工位 3 天。
      </p>

      <footer class="acts">
        <p class="acts__note mono">本步骤产出：产能结论 + 人力成本 + 交期建议。完成后回传销售出预测结果。</p>
        <button class="btn btn--sm btn--solid" type="button" :disabled="!active" @click="emit('fill')">
          <AppIcon name="arrowRight" :size="13" />
          完成评估 · 回传销售
        </button>
      </footer>
      <p v-if="!active" class="pane__lock mono">当前不在 S4 步骤，仅供查看</p>
    </section>
  </div>
</template>

<style scoped>
.s4 {
  margin-top: 12px;
}
.pane {
  border: 1px solid var(--rule-2);
  border-radius: var(--r-md);
  background: var(--surface);
  padding: 12px 14px 14px;
}
.pane__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-bottom: 9px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--rule);
  color: var(--ink-3);
}
.pane__title {
  font-size: 0.96rem;
  color: var(--ink);
}
.pane__lock {
  margin-top: 8px;
  font-size: 0.6rem;
  color: var(--warn);
}
.shifts {
  margin-left: auto;
  display: flex;
  gap: 4px;
}
.shift {
  padding: 4px 10px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-sm);
  background: var(--surface);
  font-size: 0.7rem;
  color: var(--ink-3);
  transition: all 0.16s ease;
}
.shift:hover {
  border-color: var(--accent);
  color: var(--accent-ink);
}
.shift.is-on {
  border-color: var(--accent);
  background: var(--accent-3);
  color: var(--accent-ink);
  font-weight: 700;
}
.kpis {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}
.kpi {
  display: grid;
  gap: 2px;
  padding: 9px 11px;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm);
  background: var(--paper);
}
.kpi--accent {
  border-color: var(--accent-2);
  background: var(--accent-3);
}
.kpi__label {
  font-size: 0.56rem;
  color: var(--ink-4);
}
.kpi__value {
  font-size: 1.2rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.kpi__value em {
  margin-left: 2px;
  font-size: 0.56rem;
  font-style: normal;
  color: var(--ink-3);
}
.kpi__value--ok {
  color: var(--ok);
}
.kpi__sub {
  font-size: 0.54rem;
  color: var(--ink-4);
}
.lines {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.line {
  padding: 10px 12px;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm);
  background: var(--paper);
}
.line__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.line__key {
  display: grid;
  place-items: center;
  width: 24px;
  height: 22px;
  border-radius: var(--r-xs);
  background: var(--ink);
  color: var(--paper);
  font-size: 0.6rem;
}
.line__name {
  font-size: 0.84rem;
}
.line__state {
  margin-left: auto;
  font-size: 0.54rem;
  padding: 1px 7px;
  border-radius: var(--r-pill);
  border: 1px solid var(--rule-2);
  color: var(--ink-3);
}
.line__state.is-ok {
  border-color: var(--ok);
  background: var(--ok-soft);
  color: var(--ok);
}
.line__state.is-warn {
  border-color: var(--warn);
  background: var(--warn-soft);
  color: var(--warn);
}
.line__state.is-hot {
  border-color: var(--danger);
  background: var(--danger-soft);
  color: var(--danger);
}
.sat {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 9px;
}
.sat__bar {
  position: relative;
  flex: 1;
  height: 7px;
  border-radius: var(--r-pill);
  background: var(--paper-3);
}
.sat__bar i {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: var(--r-pill);
  background: var(--ok);
}
.sat__bar i.is-warn {
  background: var(--warn);
}
.sat__bar i.is-hot {
  background: var(--danger);
}
.sat__mark {
  position: absolute;
  top: -4px;
  width: 2px;
  height: 15px;
  background: var(--ink-2);
  opacity: 0.6;
}
.sat__num {
  font-size: 0.68rem;
  min-width: 3em;
  text-align: right;
}
.line__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin: 9px 0 0;
  padding-top: 8px;
  border-top: 1px dotted var(--rule);
}
.line__stats dt {
  font-size: 0.52rem;
  color: var(--ink-4);
}
.line__stats dd {
  margin: 1px 0 0;
  font-size: 0.8rem;
  font-weight: 700;
}
.note {
  margin: 10px 0 0;
  padding: 8px 10px;
  border: 1px dashed var(--rule-2);
  border-radius: var(--r-sm);
  font-size: 0.6rem;
  line-height: 1.7;
  color: var(--ink-3);
}
.acts {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--rule);
}
.acts__note {
  font-size: 0.62rem;
  color: var(--ink-4);
}
@media (max-width: 1080px) {
  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .lines {
    grid-template-columns: 1fr;
  }
}
</style>
