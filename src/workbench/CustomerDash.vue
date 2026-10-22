<script setup>
/**
 * 客户总览 Dashboard
 *
 * 点客户名称进入：客户信息 + 该客户名下所有工单的进度、版本、留痕与单据汇总。
 */
import { computed } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { flowSteps, stepIndex } from './data.js'

const props = defineProps({
  customer: { type: Object, required: true },
})
const emit = defineEmits(['flow', 'versions', 'new-order', 'orders'])

const orders = computed(() => props.customer.orders || [])
const progress = (o) => Math.round(((stepIndex(o.step || 'S1') + 1) / flowSteps.length) * 100)
const stepName = (code) => flowSteps.find((s) => s.code === code)?.name || code
const statusOf = (o) => (o.step === 'S5' ? 'done' : o.returned ? 'back' : 'doing')
const statusLabel = { doing: '进行中', back: '已打回', done: '已完成' }

const kpi = computed(() => {
  const list = orders.value
  const versions = list.reduce((s, o) => s + (o.versions?.length || 0), 0)
  const events = list.reduce((s, o) => s + (o.events?.length || 0), 0)
  const docs = list.reduce((s, o) => s + (o.docs?.length || 0), 0)
  return [
    { label: '工单数', value: String(list.length) },
    { label: '进行中', value: String(list.filter((o) => o.step !== 'S5').length) },
    { label: '已打回', value: String(list.filter((o) => o.returned).length) },
    { label: '需求版本', value: String(versions) },
    { label: '留痕条数', value: String(events) },
    { label: '单据留痕', value: String(docs) },
  ]
})

const recent = computed(() =>
  orders.value
    .flatMap((o) => (o.events || []).map((e) => ({ ...e, orderId: o.id, orderTitle: o.title })))
    .sort((a, b) => (a.time < b.time ? 1 : -1))
    .slice(0, 8),
)

const docsByOrder = computed(() =>
  orders.value.map((o) => ({ id: o.id, title: o.title, docs: o.docs || [] })),
)
</script>

<template>
  <div class="cd">
    <!-- KPI -->
    <div class="kpis">
      <div v-for="k in kpi" :key="k.label" class="kpi">
        <span class="kpi__label mono">{{ k.label }}</span>
        <span class="kpi__value">{{ k.value }}</span>
      </div>
      <button class="newbtn" type="button" @click="emit('new-order')">
        <AppIcon name="plus" :size="14" />
        新建工单
      </button>
    </div>

    <!-- 客户信息 -->
    <div class="card">
      <header class="card__head">
        <AppIcon name="users" :size="15" />
        <h3 class="card__title">客户信息</h3>
        <span class="card__sub mono">{{ customer.id }}</span>
      </header>
      <dl class="info">
        <div class="info__item">
          <dt class="mono">客户名称</dt>
          <dd>{{ customer.customer }}</dd>
        </div>
        <div class="info__item">
          <dt class="mono">联系人</dt>
          <dd>{{ customer.contact || '—' }}</dd>
        </div>
        <div class="info__item">
          <dt class="mono">跟进人</dt>
          <dd>{{ customer.owner }}</dd>
        </div>
        <div class="info__item">
          <dt class="mono">客户优先级</dt>
          <dd>{{ customer.priority }}</dd>
        </div>
        <div class="info__item">
          <dt class="mono">建档时间</dt>
          <dd>{{ customer.createdAt }}</dd>
        </div>
        <div class="info__item">
          <dt class="mono">最近更新</dt>
          <dd>{{ customer.updatedAt }}</dd>
        </div>
        <div class="info__item info__item--wide">
          <dt class="mono">备注</dt>
          <dd>{{ customer.note || '—' }}</dd>
        </div>
      </dl>
    </div>

    <!-- 工单列表 -->
    <div class="card">
      <header class="card__head">
        <AppIcon name="layers" :size="15" />
        <h3 class="card__title">该客户名下的工单（{{ orders.length }}）</h3>
        <span class="card__sub mono">点「进入流程」跳到该工单当前步骤</span>
      </header>
      <table class="table">
        <thead>
          <tr>
            <th>工单号 / 标题</th>
            <th>产品</th>
            <th>数量 · 交期</th>
            <th>当前步骤</th>
            <th>进度</th>
            <th>版本</th>
            <th>更新</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in orders" :key="o.id">
            <td>
              <span class="oid mono">{{ o.id }}</span>
              <span class="otitle">{{ o.title }}</span>
            </td>
            <td class="mono small">{{ o.product }}</td>
            <td class="mono small">{{ o.qty }}<br />{{ o.due }}</td>
            <td>
              <span class="ostage mono" :class="'is-' + statusOf(o)">
                {{ o.step }} {{ stepName(o.step) }}
              </span>
            </td>
            <td>
              <span class="bar"><i :style="{ width: progress(o) + '%' }"></i></span>
              <span class="pct mono">{{ progress(o) }}%</span>
            </td>
            <td class="mono small">
              {{ (o.versions.find((v) => v.id === o.activeVersion) || {}).label || 'R01' }} ·
              {{ o.versions.length }} 版
            </td>
            <td class="mono small">{{ o.updatedAt }}</td>
            <td class="ops">
              <button class="btn btn--sm btn--solid" type="button" @click="emit('flow', o.id)">
                <AppIcon name="arrowRight" :size="12" />
                进入流程
              </button>
              <button class="btn btn--sm" type="button" @click="emit('versions', o.id)">
                版本管理
              </button>
            </td>
          </tr>
          <tr v-if="!orders.length">
            <td colspan="8" class="empty mono">该客户暂无工单，可点右上角「新建工单」</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="two">
      <!-- 最近动态 -->
      <div class="card">
        <header class="card__head">
          <AppIcon name="clock" :size="15" />
          <h3 class="card__title">最近动态</h3>
          <span class="card__sub mono">跨该客户全部工单</span>
        </header>
        <ul class="feed">
          <li v-for="(e, i) in recent" :key="i" class="feed__item">
            <span class="feed__time mono">{{ e.time }}</span>
            <div>
              <p class="feed__action">{{ e.action }}</p>
              <p class="feed__meta mono">{{ e.orderId }} · {{ e.actor }}</p>
            </div>
          </li>
          <li v-if="!recent.length" class="empty mono">暂无留痕</li>
        </ul>
      </div>

      <!-- 单据汇总 -->
      <div class="card">
        <header class="card__head">
          <AppIcon name="file" :size="15" />
          <h3 class="card__title">单据与资料</h3>
        </header>
        <div class="docgroups">
          <div v-for="d in docsByOrder" :key="d.id" class="docgroup">
            <p class="docgroup__title mono">{{ d.id }} · {{ d.title }}</p>
            <ul class="docgroup__list">
              <li v-for="it in d.docs" :key="it.label">
                <span class="mono">{{ it.label }}</span>
                {{ it.value }}
              </li>
              <li v-if="!d.docs.length" class="mono empty">暂无单据</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cd {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}
.kpis {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr)) auto;
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
.newbtn {
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
.newbtn:hover {
  filter: brightness(1.06);
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
  margin-left: auto;
  font-size: 0.56rem;
  color: var(--ink-4);
}
.info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
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
  padding: 8px 10px;
  border-bottom: 1px solid var(--rule);
  vertical-align: middle;
}
.oid {
  display: block;
  font-size: 0.58rem;
  color: var(--ink-4);
}
.otitle {
  font-size: 0.82rem;
  font-weight: 700;
}
.small {
  font-size: 0.6rem;
  color: var(--ink-3);
}
.ostage {
  font-size: 0.54rem;
  padding: 2px 7px;
  border-radius: var(--r-pill);
  border: 1px solid var(--rule-2);
  color: var(--ink-3);
  white-space: nowrap;
}
.ostage.is-doing {
  border-color: var(--accent);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.ostage.is-back {
  border-color: var(--danger);
  background: var(--danger-soft);
  color: var(--danger);
}
.ostage.is-done {
  border-color: var(--ok);
  background: var(--ok-soft);
  color: var(--ok);
}
.bar {
  display: block;
  width: 80px;
  height: 5px;
  border-radius: var(--r-pill);
  background: var(--paper-3);
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  background: var(--accent);
}
.pct {
  font-size: 0.52rem;
  color: var(--ink-4);
}
.ops {
  display: flex;
  gap: 5px;
}
.empty {
  color: var(--ink-4);
  font-size: 0.62rem;
  text-align: center;
  padding: 14px 0;
}
.two {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
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
.feed__meta {
  margin: 1px 0 0;
  font-size: 0.52rem;
  color: var(--ink-4);
}
.docgroups {
  display: grid;
  gap: 10px;
  padding: 11px 12px 12px;
}
.docgroup__title {
  margin: 0 0 4px;
  font-size: 0.56rem;
  color: var(--accent-ink);
}
.docgroup__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 3px;
}
.docgroup__list li {
  display: flex;
  gap: 8px;
  font-size: 0.74rem;
  color: var(--ink-2);
}
.docgroup__list span {
  font-size: 0.54rem;
  color: var(--ink-4);
  min-width: 4.6em;
}
@media (max-width: 1180px) {
  .kpis {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .newbtn {
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
