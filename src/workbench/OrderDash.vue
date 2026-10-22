<script setup>
/**
 * 工单总览 Dashboard
 *
 * 点工单名称进入：工单信息 + S1–S5 流程进度 + 需求版本 + 留痕与单据汇总。
 */
import { computed } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { flowSteps, stepIndex } from './data.js'

const props = defineProps({
  customer: { type: Object, required: true },
  order: { type: Object, required: true },
})
const emit = defineEmits(['flow', 'versions', 'step'])

const curStep = computed(() => props.order.step || 'S1')
const curIndex = computed(() => stepIndex(curStep.value))
const progress = computed(() => Math.round(((curIndex.value + 1) / flowSteps.length) * 100))
const stepState = (code) => {
  const i = stepIndex(code)
  if (i < curIndex.value) return 'done'
  if (i > curIndex.value) return 'todo'
  return props.order.returned ? 'back' : 'doing'
}
const stateLabel = { done: '已完成', doing: '进行中', back: '已打回', todo: '待处理' }

const kpi = computed(() => [
  { label: '当前步骤', value: curStep.value, sub: flowSteps.find((s) => s.code === curStep.value)?.name },
  { label: '流程进度', value: progress.value + '%', sub: `共 ${flowSteps.length} 步` },
  { label: '需求版本', value: String(props.order.versions?.length || 0), sub: '客户每次变更新建' },
  { label: '留痕条数', value: String(props.order.events?.length || 0), sub: '每一步可回溯' },
  { label: '单据留痕', value: String(props.order.docs?.length || 0), sub: 'iCRM / 报表 / BOM / 报价' },
])

const versions = computed(() => [...(props.order.versions || [])].reverse())
const recent = computed(() => (props.order.events || []).slice(0, 8))
const records = computed(() => props.order.records || [])
</script>

<template>
  <div class="od">
    <!-- KPI -->
    <div class="kpis">
      <div v-for="k in kpi" :key="k.label" class="kpi">
        <span class="kpi__label mono">{{ k.label }}</span>
        <span class="kpi__value">{{ k.value }}</span>
        <span class="kpi__sub mono">{{ k.sub }}</span>
      </div>
      <button class="flowbtn" type="button" @click="emit('flow')">
        <AppIcon name="arrowRight" :size="14" />
        进入当前步骤（{{ curStep }}）
      </button>
    </div>

    <div v-if="order.returned" class="alert">
      <AppIcon name="info" :size="15" />
      <div><b>已被 AE 打回：</b>{{ order.returnReason }}</div>
    </div>

    <div class="two">
      <!-- 工单信息 -->
      <div class="card">
        <header class="card__head">
          <AppIcon name="layers" :size="15" />
          <h3 class="card__title">工单信息</h3>
          <span class="card__sub mono">{{ order.id }}</span>
        </header>
        <dl class="info">
          <div class="info__item">
            <dt class="mono">客户</dt>
            <dd>{{ customer.customer }}</dd>
          </div>
          <div class="info__item">
            <dt class="mono">工单标题</dt>
            <dd>{{ order.title }}</dd>
          </div>
          <div class="info__item">
            <dt class="mono">产品 / 型号</dt>
            <dd>{{ order.product }}</dd>
          </div>
          <div class="info__item">
            <dt class="mono">数量</dt>
            <dd>{{ order.qty }}</dd>
          </div>
          <div class="info__item">
            <dt class="mono">交期</dt>
            <dd>{{ order.due }}</dd>
          </div>
          <div class="info__item">
            <dt class="mono">负责人</dt>
            <dd>{{ order.owner }}</dd>
          </div>
          <div class="info__item">
            <dt class="mono">优先级</dt>
            <dd>{{ order.priority }}</dd>
          </div>
          <div class="info__item">
            <dt class="mono">建档 / 更新</dt>
            <dd>{{ order.createdAt }} / {{ order.updatedAt }}</dd>
          </div>
          <div class="info__item info__item--wide">
            <dt class="mono">备注</dt>
            <dd>{{ order.note || '—' }}</dd>
          </div>
        </dl>
      </div>

      <!-- 流程进度 -->
      <div class="card">
        <header class="card__head">
          <AppIcon name="check" :size="15" />
          <h3 class="card__title">流程进度 S1–S5</h3>
          <span class="card__sub mono">{{ progress }}%</span>
        </header>
        <ul class="steps">
          <li
            v-for="s in flowSteps"
            :key="s.code"
            class="srow"
            :class="'is-' + stepState(s.code)"
          >
            <span class="srow__code mono">{{ s.code }}</span>
            <span class="srow__body">
              <span class="srow__name">{{ s.name }}</span>
              <span class="srow__meta mono">
                {{ s.owner }}
                <template v-if="records.find((r) => r.step === s.code)?.dur">
                  · 耗时 {{ records.find((r) => r.step === s.code).dur }}
                </template>
              </span>
            </span>
            <span class="srow__state mono">{{ stateLabel[stepState(s.code)] }}</span>
            <button class="srow__go" type="button" title="查看该步骤" @click="emit('step', s.code)">
              <AppIcon name="chevronRight" :size="13" />
            </button>
          </li>
        </ul>
      </div>
    </div>

    <div class="two">
      <!-- 需求版本 -->
      <div class="card">
        <header class="card__head">
          <AppIcon name="refresh" :size="15" />
          <h3 class="card__title">需求版本（{{ versions.length }}）</h3>
          <button class="btn btn--sm card__btn" type="button" @click="emit('versions')">
            进入版本管理
          </button>
        </header>
        <table class="table">
          <thead>
            <tr>
              <th>版本</th>
              <th>需求摘要</th>
              <th>走到</th>
              <th>留痕</th>
              <th>更新</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in versions" :key="v.id" :class="{ 'is-on': v.id === order.activeVersion }">
              <td>
                <span class="vlabel mono">{{ v.label }}</span>
                <span v-if="v.id === order.activeVersion" class="vtag mono">当前</span>
              </td>
              <td class="vsum">{{ v.summary || v.note }}</td>
              <td class="mono small">{{ v.step }}</td>
              <td class="mono small">{{ (v.events || []).length }} 条</td>
              <td class="mono small">{{ v.updatedAt }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 最近留痕 -->
      <div class="card">
        <header class="card__head">
          <AppIcon name="clock" :size="15" />
          <h3 class="card__title">最近留痕</h3>
          <span class="card__sub mono">共 {{ (order.events || []).length }} 条</span>
        </header>
        <ul class="feed">
          <li v-for="(e, i) in recent" :key="i" class="feed__item">
            <span class="feed__time mono">{{ e.time }}</span>
            <div>
              <p class="feed__action">
                <span class="feed__step mono">{{ e.step }}</span>
                {{ e.action }}
              </p>
              <p class="feed__meta mono">{{ e.actor }} · {{ e.detail }}</p>
            </div>
          </li>
          <li v-if="!recent.length" class="empty mono">暂无留痕</li>
        </ul>
      </div>
    </div>

    <!-- 单据留痕 -->
    <div class="card">
      <header class="card__head">
        <AppIcon name="file" :size="15" />
        <h3 class="card__title">单据与资料留痕</h3>
      </header>
      <dl class="docs">
        <div v-for="d in order.docs" :key="d.label" class="docs__row">
          <dt class="mono">{{ d.label }}</dt>
          <dd>{{ d.value }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<style scoped>
.od {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}
.kpis {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr)) auto;
  gap: 8px;
}
.kpi {
  display: grid;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm);
  background: var(--surface);
}
.kpi__label {
  font-size: 0.56rem;
  color: var(--ink-4);
}
.kpi__value {
  font-size: 1.3rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.kpi__sub {
  font-size: 0.52rem;
  color: var(--ink-4);
}
.flowbtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 16px;
  border-radius: var(--r-sm);
  background: var(--accent);
  color: #fff;
  font-size: 0.86rem;
  font-weight: 700;
}
.flowbtn:hover {
  filter: brightness(1.06);
}
.alert {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 10px 12px;
  border: 1px solid var(--danger);
  border-radius: var(--r-sm);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 0.8rem;
  line-height: 1.65;
}
.two {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}
.card {
  border: 1px solid var(--rule-2);
  border-radius: var(--r-md);
  background: var(--surface);
  overflow: hidden;
}
.card__head {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--rule);
  background: var(--paper-2);
  color: var(--ink-3);
}
.card__title {
  font-size: 0.9rem;
  color: var(--ink);
}
.card__sub {
  font-size: 0.56rem;
  color: var(--ink-4);
}
.card__btn {
  margin-left: auto;
}
.info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px 16px;
  margin: 0;
  padding: 11px 12px 12px;
}
.info__item--wide {
  grid-column: 1 / -1;
}
.info__item dt {
  font-size: 0.54rem;
  color: var(--ink-4);
}
.info__item dd {
  margin: 2px 0 0;
  font-size: 0.82rem;
  color: var(--ink-2);
}
.steps {
  margin: 0;
  padding: 6px 8px 8px;
  list-style: none;
  display: grid;
  gap: 2px;
}
.srow {
  display: grid;
  grid-template-columns: 2.6em minmax(0, 1fr) auto 22px;
  gap: 8px;
  align-items: center;
  padding: 7px 8px;
  border-radius: var(--r-xs);
  border-left: 3px solid transparent;
}
.srow.is-done {
  background: var(--paper-3);
  border-left-color: var(--rule-2);
}
.srow.is-doing {
  background: var(--accent-3);
  border-left-color: var(--accent);
}
.srow.is-back {
  background: var(--danger-soft);
  border-left-color: var(--danger);
}
.srow.is-todo {
  background: var(--info-soft);
  border-left-color: var(--info);
}
.srow__code {
  font-size: 0.6rem;
  color: var(--accent-ink);
}
.srow__body {
  display: grid;
  gap: 1px;
  min-width: 0;
}
.srow__name {
  font-size: 0.82rem;
  color: var(--ink-2);
}
.srow.is-doing .srow__name {
  font-weight: 700;
  color: var(--ink);
}
.srow__meta {
  font-size: 0.52rem;
  color: var(--ink-4);
}
.srow__state {
  font-size: 0.52rem;
  color: var(--ink-4);
  white-space: nowrap;
}
.srow__go {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: var(--r-xs);
  color: var(--ink-4);
}
.srow__go:hover {
  background: var(--surface);
  color: var(--accent-ink);
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.74rem;
}
.table th {
  text-align: left;
  font-weight: 400;
  font-size: 0.54rem;
  color: var(--ink-4);
  padding: 7px 10px;
  border-bottom: 1px solid var(--rule-2);
  background: var(--paper-3);
}
.table td {
  padding: 7px 10px;
  border-bottom: 1px solid var(--rule);
}
.table tr.is-on {
  background: var(--accent-3);
}
.vlabel {
  font-size: 0.6rem;
  font-weight: 700;
}
.vtag {
  margin-left: 5px;
  font-size: 0.46rem;
  padding: 1px 5px;
  border-radius: var(--r-pill);
  border: 1px solid var(--accent-2);
  color: var(--accent-ink);
}
.vsum {
  font-size: 0.72rem;
  color: var(--ink-2);
}
.small {
  font-size: 0.58rem;
  color: var(--ink-3);
}
.feed {
  margin: 0;
  padding: 0;
  list-style: none;
}
.feed__item {
  display: grid;
  grid-template-columns: 5.4em minmax(0, 1fr);
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px dotted var(--rule);
}
.feed__time {
  font-size: 0.54rem;
  color: var(--ink-4);
  padding-top: 2px;
}
.feed__action {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
}
.feed__step {
  font-size: 0.5rem;
  padding: 1px 5px;
  margin-right: 5px;
  border-radius: var(--r-xs);
  background: var(--paper-3);
  color: var(--accent-ink);
}
.feed__meta {
  margin: 1px 0 0;
  font-size: 0.52rem;
  color: var(--ink-4);
  line-height: 1.55;
}
.docs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px 16px;
  margin: 0;
  padding: 11px 12px 12px;
}
.docs__row dt {
  font-size: 0.54rem;
  color: var(--ink-4);
}
.docs__row dd {
  margin: 1px 0 0;
  font-size: 0.8rem;
  color: var(--ink-2);
}
.empty {
  color: var(--ink-4);
  font-size: 0.62rem;
  text-align: center;
  padding: 14px 0;
}
@media (max-width: 1180px) {
  .kpis {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .flowbtn {
    grid-column: 1 / -1;
    padding: 10px;
  }
  .two {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 760px) {
  .table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
}
</style>
