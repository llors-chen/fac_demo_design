<script setup>
/**
 * 工作台侧边栏的下层视图：首页 / 工单总览 / 报告中心 / 措施中心 / 设置
 * 通过 view 属性切换，避免拆成多个页面。
 */
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { flowSteps, stepIndex, stages } from './data.js'
import { saveOrders, stamp, toCsv } from './store.js'

const props = defineProps({
  view: { type: String, required: true }, // home | orders | reports | actions | settings
  orders: { type: Array, required: true },
  activeId: { type: String, default: '' },
  theme: { type: String, default: 'tool' },
})
const emit = defineEmits(['pick', 'reset', 'theme'])

const statusOf = (o) => (o.stage === 'final' ? 'done' : o.returned ? 'back' : 'doing')
const statusLabel = { doing: '进行中', back: '已打回', done: '已完成' }
const progress = (c) => Math.round(((stepIndex(c.step || 'S1') + 1) / flowSteps.length) * 100)

/** 工单 → 客户 展开成行 */
const rows = computed(() =>
  props.orders.flatMap((o) =>
    o.customers.map((c) => ({
      ...c,
      orderId: o.id,
      orderTitle: o.title,
      orderOwner: o.owner,
      orderPriority: o.priority,
    })),
  ),
)

/* 首页 KPI */
const kpi = computed(() => {
  const all = rows.value
  return [
    { label: '工单', value: String(props.orders.length) },
    { label: '客户', value: String(all.length) },
    { label: '进行中', value: String(all.filter((o) => o.stage !== 'final').length) },
    { label: '已打回', value: String(all.filter((o) => o.returned).length) },
    { label: '已完成', value: String(all.filter((o) => o.stage === 'final').length) },
  ]
})

/** 最近留痕（跨工单） */
const recent = computed(() =>
  rows.value
    .flatMap((c) => (c.events || []).map((e) => ({ ...e, orderId: c.orderId, customer: c.customer })))
    .sort((a, b) => (a.time < b.time ? 1 : -1))
    .slice(0, 8),
)

/** 报告中心：按工单汇总单据 */
const docs = computed(() =>
  rows.value.map((c) => ({
    id: c.id,
    orderId: c.orderId,
    customer: c.customer,
    items: c.docs || [],
    updatedAt: c.updatedAt,
  })),
)

/** 措施中心：跨工单的待办与风险 */
const actions = [
  {
    id: 'A1',
    level: 'warn',
    title: '静态载荷 6,000 N 曲线校核',
    owner: '研发 · 李工',
    order: 'WO-20261021-001',
    due: '10-24',
    note: '不足则加强壳体，成本 +8%、交期 +2 周',
  },
  {
    id: 'A2',
    level: 'risk',
    title: '出口管制合规初筛（ECCN）',
    owner: '合规 · 王工',
    order: 'WO-20261021-001',
    due: '10-23',
    note: '未过筛前不承诺批量交期',
  },
  {
    id: 'A3',
    level: 'warn',
    title: '补静态载荷与温度口径后重新填表',
    owner: '销售 · 周工',
    order: 'WO-20261021-002',
    due: '10-22',
    note: 'AE 已打回，需销售向客户补充',
  },
  {
    id: 'A4',
    level: 'ok',
    title: 'B 线 2 个工位前置到 A 线空闲时段',
    owner: '计划 · 吴工',
    order: 'WO-20261020-018',
    due: '10-26',
    note: '降低 B 线 93% 饱和度，缓解加班 12 h',
  },
]

/* 设置 */
const csvAll = () => {
  const all = rows.value
    .map((c) => `# ${c.orderId} / ${c.id} ${c.customer}\n${toCsv(c)}`)
    .join('\n\n')
  const blob = new Blob(['\uFEFF' + all], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `工单留痕-${stamp().replace(/[ :]/g, '')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const copied = ref('')
function exportJson() {
  const blob = new Blob([JSON.stringify(props.orders, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'workorders.json'
  a.click()
  URL.revokeObjectURL(url)
  copied.value = '已导出 workorders.json'
  window.setTimeout(() => (copied.value = ''), 2400)
}

function closeAll() {
  rows.value.forEach((o) => {
    if (o.stage !== 'final') {
      o.stage = 'final'
      o.events = [
        {
          time: stamp(),
          stage: 'final',
          actor: '系统',
          type: 'note',
          action: '批量归档',
          detail: '管理员在设置页批量关闭工单',
        },
        ...o.events,
      ]
      o.updatedAt = stamp()
    }
  })
  saveOrders(props.orders)
}
</script>

<template>
  <!-- 首页 -->
  <div v-if="view === 'home'" class="sv">
    <div class="kpis">
      <div v-for="k in kpi" :key="k.label" class="kpi">
        <span class="kpi__label mono">{{ k.label }}</span>
        <span class="kpi__value">{{ k.value }}</span>
      </div>
    </div>

    <div class="two">
      <div class="card">
        <header class="card__head">
          <h3 class="card__title">我的工单</h3>
          <button
          class="btn btn--sm"
          type="button"
          @click="emit('pick', orders[0].id, orders[0].customers[0].id, orders[0].customers[0].stage)"
        >
            进入工单工作台
          </button>
        </header>
        <ul class="olist">
          <li
            v-for="o in rows"
            :key="o.id"
            class="orow"
            @click="emit('pick', o.orderId, o.id, o.stage)"
          >
            <span class="orow__id mono">{{ o.id }}</span>
            <span class="orow__cust">{{ o.customer }}</span>
            <span class="orow__stage mono" :class="'is-' + statusOf(o)">
              {{ statusLabel[statusOf(o)] }}
            </span>
            <span class="orow__bar"><i :style="{ width: progress(o) + '%' }"></i></span>
            <span class="orow__pct mono">{{ progress(o) }}%</span>
          </li>
        </ul>
      </div>

      <div class="card">
        <header class="card__head">
          <h3 class="card__title">最近留痕</h3>
          <span class="card__sub mono">跨工单</span>
        </header>
        <ul class="feed">
          <li v-for="(e, i) in recent" :key="i" class="feed__item">
            <span class="feed__time mono">{{ e.time }}</span>
            <div>
              <p class="feed__action">{{ e.action }}</p>
              <p class="feed__meta mono">{{ e.orderId }} · {{ e.actor }}</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <!-- 工单总览 -->
  <div v-else-if="view === 'orders'" class="sv">
    <div class="card">
      <header class="card__head">
        <h3 class="card__title">全部工单</h3>
        <span class="card__sub mono">{{ orders.length }} 张 · 点行进入该工单</span>
      </header>
      <table class="table">
        <thead>
          <tr>
            <th>工单号</th>
            <th>客户 / 产品</th>
            <th>数量 · 交期</th>
            <th>当前阶段</th>
            <th>进度</th>
            <th>负责人</th>
            <th>更新</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in orders" :key="o.id" :class="{ 'is-on': o.id === activeId }">
            <td>
              <span class="mono oid">{{ o.orderId }}</span>
              <span class="oid2 mono">{{ o.id }}</span>
              <span class="pri mono" :class="{ 'is-high': o.priority === '高' }">{{ o.priority }}</span>
            </td>
            <td>
              <span class="cust">{{ o.customer }}</span>
              <span class="prod mono">{{ o.product }}</span>
            </td>
            <td class="mono">{{ o.qty }}<br />{{ o.due }}</td>
            <td>
              <span class="stage mono" :class="'is-' + statusOf(o)">
                {{ stages.find((s) => s.key === o.stage).no }} {{ statusLabel[statusOf(o)] }}
              </span>
            </td>
            <td>
              <span class="bar"><i :style="{ width: progress(o) + '%' }"></i></span>
              <span class="pct mono">{{ progress(o) }}%</span>
            </td>
            <td class="mono">{{ o.owner }}</td>
            <td class="mono">{{ o.updatedAt }}</td>
            <td class="ops">
              <button class="btn btn--sm" type="button" @click="emit('pick', o.orderId, o.id, o.stage)">
                处理
              </button>
              <button class="btn btn--sm" type="button" @click="emit('pick', o.orderId, o.id, 'versions')">
                版本/留痕
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- 报告中心 -->
  <div v-else-if="view === 'reports'" class="sv">
    <div class="cards">
      <div v-for="d in docs" :key="d.id" class="card">
        <header class="card__head">
          <h3 class="card__title">{{ d.customer }}</h3>
          <span class="card__sub mono">{{ d.orderId }} / {{ d.id }} · 更新 {{ d.updatedAt }}</span>
        </header>
        <ul class="doclist">
          <li v-for="it in d.items" :key="it.label" class="docrow">
            <AppIcon name="file" :size="14" />
            <span class="docrow__label mono">{{ it.label }}</span>
            <span class="docrow__value">{{ it.value }}</span>
          </li>
          <li v-if="!d.items.length" class="docrow mono">暂无单据</li>
        </ul>
        <footer class="card__foot">
          <button class="btn btn--sm" type="button" @click="emit('pick', d.orderId, d.id, 'versions')">
            <AppIcon name="external" :size="12" />
            查看版本与留痕
          </button>
        </footer>
      </div>
    </div>
  </div>

  <!-- 措施中心 -->
  <div v-else-if="view === 'actions'" class="sv">
    <div class="card">
      <header class="card__head">
        <h3 class="card__title">待办与风险</h3>
        <span class="card__sub mono">{{ actions.length }} 项</span>
      </header>
      <ul class="alist">
        <li v-for="a in actions" :key="a.id" class="aitem" :class="'is-' + a.level">
          <span class="aitem__dot"></span>
          <div class="aitem__body">
            <p class="aitem__title">{{ a.title }}</p>
            <p class="aitem__note">{{ a.note }}</p>
            <p class="aitem__meta mono">{{ a.id }} · {{ a.order }} · {{ a.owner }} · 截止 {{ a.due }}</p>
          </div>
          <button class="btn btn--sm" type="button" @click="emit('pick', a.order, '', 'versions')">查看版本</button>
        </li>
      </ul>
    </div>
  </div>

  <!-- 设置 -->
  <div v-else class="sv">
    <div class="card">
      <header class="card__head">
        <h3 class="card__title">界面主题</h3>
      </header>
      <div class="setrow">
        <p class="setrow__text">
          工作台默认使用「工具」主题（白底、无衬线、语义色）。切到「演示」可看印刷纸感皮肤。
        </p>
        <div class="seg">
          <button class="seg__btn" :class="{ 'is-on': theme === 'paper' }" type="button" @click="emit('theme', 'paper')">
            演示
          </button>
          <button class="seg__btn" :class="{ 'is-on': theme === 'tool' }" type="button" @click="emit('theme', 'tool')">
            工具
          </button>
        </div>
      </div>
    </div>

    <div class="card">
      <header class="card__head">
        <h3 class="card__title">数据与留痕</h3>
      </header>
      <div class="setrow">
        <p class="setrow__text">导出全部工单的流程留痕（CSV）或原始数据（JSON）；也可重置为初始演示数据。</p>
        <div class="setrow__acts">
          <button class="btn btn--sm" type="button" @click="csvAll">
            <AppIcon name="download" :size="13" />
            导出全部留痕
          </button>
          <button class="btn btn--sm" type="button" @click="exportJson">
            <AppIcon name="download" :size="13" />
            导出 JSON
          </button>
          <button class="btn btn--sm" type="button" @click="emit('reset')">
            <AppIcon name="refresh" :size="13" />
            重置演示数据
          </button>
        </div>
      </div>
      <p v-if="copied" class="setrow__done mono">{{ copied }}</p>
    </div>

    <div class="card">
      <header class="card__head">
        <h3 class="card__title">批量操作</h3>
      </header>
      <div class="setrow">
        <p class="setrow__text">把所有未完成工单标记为已完成并归档（会写入留痕）。</p>
        <button class="btn btn--sm" type="button" @click="closeAll">
          <AppIcon name="check" :size="13" />
          批量归档
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sv {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}
.kpis {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
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
  font-size: 1.4rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.two,
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
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
  gap: 10px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--rule);
  background: var(--paper-2);
}
.card__title {
  font-size: 0.9rem;
}
.card__sub {
  font-size: 0.58rem;
  color: var(--ink-4);
}
.card__head .btn {
  margin-left: auto;
}
.card__foot {
  padding: 9px 12px;
  border-top: 1px solid var(--rule);
}

/* 首页工单行 */
.olist,
.feed,
.doclist,
.alist {
  margin: 0;
  padding: 0;
  list-style: none;
}
.orow {
  display: grid;
  grid-template-columns: 8.6em minmax(0, 1fr) 4.4em 80px 3em;
  gap: 8px;
  align-items: center;
  padding: 9px 12px;
  border-bottom: 1px dotted var(--rule);
  cursor: pointer;
  transition: background 0.16s ease;
}
.orow:hover {
  background: var(--accent-3);
}
.orow__id {
  font-size: 0.6rem;
  color: var(--ink-3);
}
.orow__cust {
  font-size: 0.82rem;
  font-weight: 700;
}
.orow__stage {
  font-size: 0.54rem;
  text-align: center;
  padding: 1px 0;
  border-radius: var(--r-pill);
  border: 1px solid var(--rule-2);
  color: var(--ink-3);
}
.orow__stage.is-doing {
  border-color: var(--accent);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.orow__stage.is-back {
  border-color: var(--danger);
  background: var(--danger-soft);
  color: var(--danger);
}
.orow__stage.is-done {
  border-color: var(--ok);
  background: var(--ok-soft);
  color: var(--ok);
}
.orow__bar,
.bar {
  display: block;
  height: 5px;
  border-radius: var(--r-pill);
  background: var(--paper-3);
  overflow: hidden;
}
.orow__bar i,
.bar i {
  display: block;
  height: 100%;
  background: var(--accent);
}
.orow__pct,
.pct {
  font-size: 0.54rem;
  color: var(--ink-4);
}

/* 最近留痕 */
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
  font-size: 0.8rem;
  font-weight: 700;
}
.feed__meta {
  margin: 1px 0 0;
  font-size: 0.54rem;
  color: var(--ink-4);
}

/* 表格 */
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.74rem;
}
.table th {
  text-align: left;
  font-weight: 400;
  font-size: 0.56rem;
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
.table tr.is-on {
  background: var(--accent-3);
}
.oid {
  font-size: 0.62rem;
  font-weight: 700;
}
.oid2 {
  display: block;
  font-size: 0.52rem;
  color: var(--ink-4);
}
.pri {
  margin-left: 6px;
  font-size: 0.5rem;
  padding: 1px 6px;
  border-radius: var(--r-pill);
  border: 1px solid var(--rule-2);
  color: var(--ink-4);
}
.pri.is-high {
  border-color: var(--danger);
  color: var(--danger);
}
.cust {
  display: block;
  font-weight: 700;
}
.prod {
  font-size: 0.54rem;
  color: var(--ink-4);
}
.stage {
  font-size: 0.56rem;
  padding: 2px 8px;
  border-radius: var(--r-pill);
  border: 1px solid var(--rule-2);
  color: var(--ink-3);
  white-space: nowrap;
}
.stage.is-doing {
  border-color: var(--accent);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.stage.is-back {
  border-color: var(--danger);
  background: var(--danger-soft);
  color: var(--danger);
}
.stage.is-done {
  border-color: var(--ok);
  background: var(--ok-soft);
  color: var(--ok);
}
.ops {
  display: flex;
  gap: 5px;
}

/* 报告中心 */
.docrow {
  display: grid;
  grid-template-columns: 16px 5.6em minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px dotted var(--rule);
  color: var(--ink-3);
}
.docrow__label {
  font-size: 0.56rem;
  color: var(--ink-4);
}
.docrow__value {
  font-size: 0.78rem;
  color: var(--ink-2);
}

/* 措施中心 */
.aitem {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
  padding: 10px 12px;
  border-bottom: 1px dotted var(--rule);
}
.aitem__dot {
  width: 9px;
  height: 9px;
  margin-top: 5px;
  border-radius: 50%;
  background: var(--ink-4);
}
.aitem.is-warn .aitem__dot {
  background: var(--warn);
}
.aitem.is-risk .aitem__dot {
  background: var(--danger);
}
.aitem.is-ok .aitem__dot {
  background: var(--ok);
}
.aitem__title {
  margin: 0;
  font-size: 0.84rem;
  font-weight: 700;
}
.aitem__note {
  margin: 2px 0 0;
  font-size: 0.74rem;
  color: var(--ink-3);
}
.aitem__meta {
  margin: 3px 0 0;
  font-size: 0.54rem;
  color: var(--ink-4);
}

/* 设置 */
.setrow {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 11px 12px;
}
.setrow__text {
  flex: 1;
  min-width: 240px;
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.65;
  color: var(--ink-2);
}
.setrow__acts {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.setrow__done {
  padding: 0 12px 10px;
  font-size: 0.56rem;
  color: var(--ok);
}
.seg {
  display: inline-flex;
  padding: 2px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-pill);
  background: var(--paper);
}
.seg__btn {
  padding: 3px 12px;
  border-radius: var(--r-pill);
  font-size: 0.74rem;
  color: var(--ink-3);
}
.seg__btn.is-on {
  background: var(--ink);
  color: var(--paper);
}

@media (max-width: 1080px) {
  .kpis {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 760px) {
  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
  .orow {
    grid-template-columns: 1fr auto;
    row-gap: 4px;
  }
}
</style>
