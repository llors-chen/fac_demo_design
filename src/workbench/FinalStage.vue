<script setup>
/**
 * 回销售 · 预测结果（无对话）
 * 汇总 AE 报表、研发匹配与产能，直接给销售一份可回执客户的结论。
 */
import AppIcon from '../components/AppIcon.vue'
import { forecast } from './data.js'

const props = defineProps({
  order: { type: Object, required: true },
  active: { type: Boolean, default: true },
  step: { type: Object, default: () => ({}) },
  focus: { type: String, default: '' }, // ack（S5 回执归档）
})
const emit = defineEmits(['ack'])

const span = forecast.gantt.reduce((m, g) => Math.max(m, g.from + g.days), 0)
const pct = (v) => (v / span) * 100

const subtotal = forecast.quote.reduce((s, r) => s + r.amount, 0)
const tax = Math.round(subtotal * 0.13 * 100) / 100
const total = subtotal + tax
</script>

<template>
  <div class="fin" :class="'focus-' + (focus || 'quote')">
    <p class="stepinfo mono">
      当前步骤：{{ step.code }} {{ step.name }} · {{ step.owner }}
      <span>— 系统已自动汇总报价与交期，请回执客户并归档</span>
    </p>

    <section class="pane">
      <header class="pane__head">
        <AppIcon name="check" :size="15" />
        <h3 class="pane__title">预测效果 · {{ order.customer }}</h3>
        <span class="pane__sub mono">{{ order.product }} · {{ order.qty }}</span>
      </header>

      <!-- KPI -->
      <div class="kpis">
        <div v-for="k in forecast.kpis" :key="k.label" class="kpi">
          <span class="kpi__label mono">{{ k.label }}</span>
          <span class="kpi__value">{{ k.value }}</span>
          <span class="kpi__sub mono">{{ k.sub }}</span>
        </div>
      </div>

      <div class="grid2">
        <!-- 报价 -->
        <div class="card">
          <header class="card__head">
            <h4 class="card__title">报价明细</h4>
            <span class="card__sub mono">含 13% 税</span>
          </header>
          <table class="qtable">
            <thead>
              <tr>
                <th>项目</th>
                <th>数量</th>
                <th>单价</th>
                <th>金额</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in forecast.quote" :key="r.name">
                <td>{{ r.name }}</td>
                <td class="mono">{{ r.qty }}</td>
                <td class="mono">￥{{ r.price.toLocaleString() }}</td>
                <td class="mono">￥{{ r.amount.toLocaleString() }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3">小计</td>
                <td class="mono">￥{{ subtotal.toLocaleString() }}</td>
              </tr>
              <tr>
                <td colspan="3">税额 13%</td>
                <td class="mono">￥{{ tax.toLocaleString() }}</td>
              </tr>
              <tr class="is-total">
                <td colspan="3">含税合计</td>
                <td class="mono">￥{{ total.toLocaleString() }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- 甘特 -->
        <div class="card">
          <header class="card__head">
            <h4 class="card__title">交期预测</h4>
            <span class="card__sub mono">共 {{ span }} 天</span>
          </header>
          <ul class="gantt">
            <li v-for="g in forecast.gantt" :key="g.label" class="gantt__row">
              <span class="gantt__label">{{ g.label }}</span>
              <span class="gantt__track">
                <i :style="{ left: pct(g.from) + '%', width: pct(g.days) + '%' }"></i>
              </span>
              <span class="gantt__days mono">{{ g.days }}d</span>
            </li>
          </ul>
          <p class="card__foot mono">
            样件 10 天（含控制板打样）· 首批 30 天（工装到位后）；出口管制初筛通过前不承诺批量交期。
          </p>
        </div>
      </div>

      <!-- 结论 -->
      <div class="concl">
        <span class="concl__label mono">结论与建议</span>
        <ol class="concl__list">
          <li v-for="(c, i) in forecast.conclusion" :key="c" class="concl__item">
            <span class="concl__no mono">{{ String(i + 1).padStart(2, '0') }}</span>
            {{ c }}
          </li>
        </ol>
      </div>

      <div v-if="focus === 'ack'" class="archive">
        <span class="archive__label mono">归档留痕（S5）</span>
        <dl class="archive__grid">
          <div v-for="d in order.docs" :key="d.label" class="archive__item">
            <dt class="mono">{{ d.label }}</dt>
            <dd>{{ d.value }}</dd>
          </div>
        </dl>
        <p class="archive__note mono">
          共 {{ (order.events || []).length }} 条流程留痕 · 当前需求版本
          {{ (order.versions || []).find((v) => v.id === order.activeVersion)?.label || 'R01' }} ·
          回执后工单关闭
        </p>
      </div>

      <footer class="acts">
        <p class="acts__note mono">
          预测结果由 AE 报表 + 研发匹配/BOM + 车间产能自动汇总，销售无需再走对话。
        </p>
        <div class="acts__right">
          <button class="btn btn--sm" type="button">
            <AppIcon name="download" :size="13" />
            导出报价单
          </button>
          <button
            class="btn btn--sm btn--solid"
            type="button"
            :disabled="!active"
            @click="emit('ack')"
          >
            <AppIcon name="send" :size="13" />
            {{ active ? '回执客户' : '回执客户（非当前步骤）' }}
          </button>
        </div>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.lock {
  margin: 0 0 8px;
  font-size: 0.6rem;
  color: var(--warn);
}
.stepinfo {
  margin: 0 0 10px;
  font-size: 0.58rem;
  color: var(--accent-ink);
}
.archive {
  margin-top: 12px;
  padding: 11px 12px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-sm);
  background: var(--paper);
}
.archive__label {
  font-size: 0.56rem;
  color: var(--ink-4);
}
.archive__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px 16px;
  margin: 7px 0 0;
}
.archive__item dt {
  font-size: 0.54rem;
  color: var(--ink-4);
}
.archive__item dd {
  margin: 1px 0 0;
  font-size: 0.8rem;
  color: var(--ink-2);
}
.archive__note {
  margin: 8px 0 0;
  padding-top: 7px;
  border-top: 1px dashed var(--rule);
  font-size: 0.56rem;
  color: var(--ink-4);
}
.fin {
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
  margin-bottom: 12px;
  border-bottom: 1px solid var(--rule);
  color: var(--ink-3);
}
.pane__title {
  font-size: 0.98rem;
  color: var(--ink);
}
.pane__sub {
  margin-left: auto;
  font-size: 0.6rem;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}
.kpi {
  display: grid;
  gap: 2px;
  padding: 10px 11px;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm);
  background: var(--paper);
}
.kpi__label {
  font-size: 0.56rem;
  color: var(--ink-4);
}
.kpi__value {
  font-size: 1.18rem;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.kpi__sub {
  font-size: 0.54rem;
  color: var(--ink-4);
}

.grid2 {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  margin-top: 12px;
  align-items: start;
}
.card {
  border: 1px solid var(--rule);
  border-radius: var(--r-sm);
  overflow: hidden;
}
.card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--paper-3);
  border-bottom: 1px solid var(--rule);
}
.card__title {
  font-size: 0.86rem;
}
.card__sub {
  margin-left: auto;
  font-size: 0.56rem;
  color: var(--ink-4);
}
.card__foot {
  margin: 0;
  padding: 8px 10px;
  border-top: 1px dashed var(--rule);
  font-size: 0.6rem;
  line-height: 1.7;
  color: var(--ink-3);
}

.qtable {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.76rem;
}
.qtable th {
  text-align: left;
  font-weight: 400;
  font-size: 0.56rem;
  color: var(--ink-4);
  padding: 6px 10px;
  border-bottom: 1px solid var(--rule);
}
.qtable td {
  padding: 6px 10px;
  border-bottom: 1px dotted var(--rule);
}
.qtable td:not(:first-child) {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.qtable tfoot td {
  border-bottom: none;
  color: var(--ink-3);
}
.qtable tfoot tr.is-total td {
  border-top: 1px solid var(--rule-2);
  color: var(--accent-ink);
  font-weight: 700;
  font-size: 0.86rem;
}

.gantt {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 10px;
  list-style: none;
}
.gantt__row {
  display: grid;
  grid-template-columns: 6.4em minmax(0, 1fr) 3em;
  gap: 8px;
  align-items: center;
  font-size: 0.74rem;
}
.gantt__label {
  color: var(--ink-2);
}
.gantt__track {
  position: relative;
  height: 12px;
  border-radius: var(--r-xs);
  background: var(--paper-3);
}
.gantt__track i {
  position: absolute;
  top: 2px;
  bottom: 2px;
  border-radius: var(--r-xs);
  background: var(--accent);
}
.gantt__days {
  font-size: 0.6rem;
  color: var(--ink-3);
  text-align: right;
}

.concl {
  margin-top: 12px;
  padding: 11px 12px;
  border: 1px solid var(--ok);
  border-radius: var(--r-sm);
  background: var(--ok-soft);
}
.concl__label {
  font-size: 0.58rem;
  color: var(--ok);
}
.concl__list {
  display: grid;
  gap: 5px;
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
}
.concl__item {
  display: flex;
  gap: 8px;
  font-size: 0.82rem;
  line-height: 1.7;
  color: var(--ink);
}
.concl__no {
  flex: none;
  font-size: 0.56rem;
  padding-top: 3px;
  color: var(--ok);
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
.acts__right {
  display: flex;
  gap: 6px;
}

@media (max-width: 1180px) {
  .kpis {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .grid2 {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 760px) {
  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .qtable {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
  .acts__right {
    width: 100%;
  }
  .acts__right .btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
