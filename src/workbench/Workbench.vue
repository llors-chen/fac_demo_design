<script setup>
/**
 * 部门工作台（Workbench）
 *
 * 层级：客户（1）→ 工单（N）→ 需求版本管理 → 客户需求版本号（R01/R02…）
 * 版本内部的 S1–S5 用主视图顶部的流程步骤条切换。
 */
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import SalesStage from './SalesStage.vue'
import AeStage from './AeStage.vue'
import RdMatch from './RdMatch.vue'
import RdCapacity from './RdCapacity.vue'
import FinalStage from './FinalStage.vue'
import SideViews from './SideViews.vue'
import VersionDashboard from './VersionDashboard.vue'
import EmptyStep from './EmptyStep.vue'
import CustomerDash from './CustomerDash.vue'
import OrderDash from './OrderDash.vue'
import OrderForm from './OrderForm.vue'
import CustomerForm from './CustomerForm.vue'
import { departments, flowSteps, stageIndex, stageOfStep, stepIndex, stages } from './data.js'
import {
  activateVersion,
  closeStep,
  createCustomer,
  createOrder,
  createVersion,
  loadCustomers,
  logEvent,
  openStep,
  resetCustomers,
  saveCustomers,
} from './store.js'

const customers = ref(loadCustomers())

const params = new URLSearchParams(window.location.search)
const initialCustomer =
  customers.value.find((c) => c.id === params.get('customer')) || customers.value[0]
const initialOrder =
  initialCustomer.orders.find((o) => o.id === params.get('order')) || initialCustomer.orders[0]

const activeCustomerId = ref(initialCustomer.id)
const activeOrderId = ref(initialOrder.id)
const view = ref(params.get('view') || initialOrder.step || 'S1')
const viewStep = ref(params.get('step') || initialOrder.step || 'S1')
const openCustomers = ref(new Set([initialCustomer.id]))
const openOrders = ref(new Set([initialOrder.id]))
const openReq = ref(new Set([initialOrder.id]))
const keyword = ref('')
const searchOpen = ref(false)
const deptFilter = ref('all')
const theme = ref(document.documentElement.getAttribute('data-theme') === 'paper' ? 'paper' : 'tool')
const filling = ref(false)

/** 当前客户 */
const customer = computed(
  () => customers.value.find((c) => c.id === activeCustomerId.value) || customers.value[0],
)
/** 当前工单（承载需求版本与流程进度） */
const order = computed(
  () => customer.value.orders.find((o) => o.id === activeOrderId.value) || customer.value.orders[0],
)

/** 全部工单索引（附带客户 id），供总览页反查 */
const ordersIndex = computed(() =>
  customers.value.flatMap((c) =>
    (c.orders || []).map((o) => ({ ...o, customerId: c.id, customerName: c.customer })),
  ),
)

const stageIdx = (key) => stageIndex(key)
const recState = (o, key) => {
  const cur = stageIdx(o.stage)
  const i = stageIdx(key)
  if (i < cur) return 'done'
  if (i === cur) return o.returned ? 'back' : 'doing'
  return 'todo'
}
const recLabel = { done: '已完成', doing: '进行中', back: '已打回', todo: '待处理' }
const orderProgress = (o) => Math.round(((stepIndex(o.step || 'S1') + 1) / flowSteps.length) * 100)

/** 任意工单在任意步骤上的状态 */
function stepStateOf(o, code) {
  const i = stepIndex(code)
  const cur = stepIndex(o.step || 'S1')
  if (i < cur) return 'done'
  if (i > cur) return 'todo'
  return o.returned ? 'back' : 'doing'
}

/* ---------------- URL 同步 ---------------- */
function syncUrl() {
  const q = new URLSearchParams()
  q.set('customer', activeCustomerId.value)
  q.set('order', activeOrderId.value)
  q.set('view', view.value)
  q.set('step', viewStep.value)
  window.history.replaceState(null, '', window.location.pathname + '?' + q.toString())
}
function setView(next) {
  view.value = next
  syncUrl()
}
function setTheme(next) {
  theme.value = next
  document.documentElement.setAttribute('data-theme', next === 'tool' ? 'tool' : 'paper')
  try {
    localStorage.setItem('dsh-theme', next)
  } catch (e) {
    /* 忽略写入失败 */
  }
}

/* ---------------- 步骤 ---------------- */
const curStep = computed(() => order.value.step || 'S1')
const curIndex = computed(() => stepIndex(curStep.value))
const stepState = (code) => stepStateOf(order.value, code)

const viewStepDef = computed(
  () =>
    flowSteps.find((s) => s.code === viewStep.value) ||
    flowSteps.find((s) => s.code === curStep.value) ||
    flowSteps[0],
)
const viewFocus = computed(() => viewStepDef.value.focus || '')

/** 四级：需求版本号 */
const versionItems = computed(() =>
  [...(order.value.versions || [])]
    .reverse()
    .map((v) => {
      const step = flowSteps.find((s) => s.code === (v.step || 'S1')) || flowSteps[0]
      return {
        id: v.id,
        label: v.label,
        step: step.code,
        stepName: step.name,
        dept: step.dept,
        note: v.note,
        summary: v.summary,
        updatedAt: v.updatedAt,
        events: (v.events || []).length,
        state: v.id === order.value.activeVersion ? 'current' : v.step === 'S5' ? 'done' : 'history',
      }
    })
    .filter((it) => {
      const hitDept = deptFilter.value === 'all' || it.dept === deptFilter.value
      const kw = keyword.value.trim().toLowerCase()
      const hitKw =
        !kw ||
        it.label.toLowerCase().includes(kw) ||
        it.stepName.toLowerCase().includes(kw) ||
        (it.summary || '').toLowerCase().includes(kw) ||
        (it.note || '').toLowerCase().includes(kw)
      return hitDept && hitKw
    }),
)

const stateLabel = { current: '当前版本', done: '已完成', history: '历史版本' }

/** 文字限长：超出用省略号（hover 有完整 title） */
const cut = (s, n = 10) => {
  const t = (s || '').trim()
  return t.length > n ? t.slice(0, n) + '…' : t
}

const visibleCustomers = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return customers.value
  return customers.value.filter(
    (c) =>
      c.customer.toLowerCase().includes(kw) ||
      (c.contact || '').toLowerCase().includes(kw) ||
      c.orders.some(
        (o) =>
          o.title.toLowerCase().includes(kw) ||
          o.product.toLowerCase().includes(kw) ||
          o.id.toLowerCase().includes(kw),
      ),
  )
})

function visibleOrders(c) {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw || c.customer.toLowerCase().includes(kw) || (c.contact || '').toLowerCase().includes(kw)) {
    return c.orders
  }
  return c.orders.filter(
    (o) =>
      o.title.toLowerCase().includes(kw) ||
      o.product.toLowerCase().includes(kw) ||
      o.id.toLowerCase().includes(kw),
  )
}

/* ---------------- 一键填写 ---------------- */
const FILLABLE = ['sales', 'ae', 'rd', 'final']
const stepFilled = computed(() => !!order.value.filled?.[viewStep.value])
const showBlank = computed(() => FILLABLE.includes(view.value) && !stepFilled.value)
const needsFill = (item) => !item.filled && item.code === curStep.value

function fillStep(item) {
  const code = item?.code || curStep.value
  if (filling.value) return
  const s = flowSteps.find((x) => x.code === code)
  if (!s) return
  filling.value = true
  order.value.filled = { ...(order.value.filled || {}), [code]: true }
  logEvent(order.value, {
    step: code,
    stage: s.view,
    actor: 'AI 助手',
    type: 'fill',
    action: '一键填写本步骤',
    detail: '按客户原话、附件与平台标准自动填入「' + s.code + ' ' + s.name + '」的全部字段',
  })
  closeStep(order.value, code, s.desc)
  saveCustomers(customers.value)
  say('已一键填写：' + s.code + ' ' + s.name + '，正在流转到下一步…')
  window.setTimeout(() => {
    filling.value = false
    advanceFrom(code)
  }, 1000)
}

/* ---------------- 查看 / 推进 ---------------- */
function gotoStep(code) {
  const s = flowSteps.find((x) => x.code === code)
  if (!s) return
  viewStep.value = code
  view.value = s.view
  syncUrl()
}

function setOrderStep(code) {
  const s = flowSteps.find((x) => x.code === code)
  if (!s) return
  order.value.step = code
  order.value.stage = stageOfStep(code)
  viewStep.value = code
  view.value = s.view
  syncUrl()
}

function advanceFrom(code) {
  const i = stepIndex(code)
  const next = flowSteps[i + 1]
  if (!next) {
    ackCustomer()
    return
  }
  setOrderStep(next.code)
  openStep(order.value, next.code)
}

/* ---------------- 侧边栏交互 ---------------- */
function setOpen(setRef, id, on) {
  const next = new Set(setRef.value)
  if (on) next.add(id)
  else next.delete(id)
  setRef.value = next
}

/**
 * 选中客户（可选同时选中某张工单）
 * @param {string} id 客户 id
 * @param {object} opts { orderId, view } —— view 不传时按工单当前步骤打开流程
 */
function pickCustomer(id, opts = {}) {
  activeCustomerId.value = id
  const c = customers.value.find((x) => x.id === id)
  const o = opts.orderId ? c.orders.find((x) => x.id === opts.orderId) : c.orders[0]
  if (o) {
    activeOrderId.value = o.id
    viewStep.value = o.step || 'S1'
    setOpen(openOrders, o.id, true)
    setOpen(openReq, o.id, true)
  }
  view.value = opts.view || flowSteps.find((s) => s.code === viewStep.value)?.view || 'sales'
  setOpen(openCustomers, id, true)
  syncUrl()
  toast.value = ''
}

/** 选中工单；默认进入该工单总览，传 view 可直达某视图 */
function pickOrder(customerId, orderId, viewName) {
  pickCustomer(customerId, { orderId, view: viewName || 'order' })
}

/** 进入某张工单的当前步骤（流程视图） */
function enterFlow(orderId) {
  const found = ordersIndex.value.find((x) => x.id === orderId)
  if (!found) return
  pickOrder(found.customerId, orderId)
  const o = order.value
  viewStep.value = o.step || 'S1'
  view.value = flowSteps.find((s) => s.code === viewStep.value)?.view || 'sales'
  syncUrl()
}

function clickCustomer(c) {
  const willExpand = !openCustomers.value.has(c.id)
  pickCustomer(c.id, { view: 'customer' })
  setOpen(openCustomers, c.id, willExpand)
}

function clickOrder(c, o) {
  const willExpand = !openOrders.value.has(o.id)
  pickOrder(c.id, o.id, 'order')
  setOpen(openOrders, o.id, willExpand)
}

function clickReq(c, o) {
  const willExpand = !openReq.value.has(o.id)
  pickOrder(c.id, o.id)
  setOpen(openReq, o.id, willExpand)
  if (willExpand) pickSide('versions')
}

function pickVersion(customerId, orderId, v) {
  pickOrder(customerId, orderId)
  const target = order.value.versions.find((x) => x.id === v.id)
  if (!target) return
  if (target.id !== order.value.activeVersion) {
    activateVersion(order.value, target.id)
    saveCustomers(customers.value)
    say('已切到需求版本 ' + target.label + '（' + (target.note || '') + '）')
  }
  viewStep.value = flowSteps.some((s) => s.code === order.value.step) ? order.value.step : 'S1'
  view.value = flowSteps.find((s) => s.code === viewStep.value)?.view || 'sales'
  syncUrl()
}

function newVersionFor(customerId, orderId) {
  pickOrder(customerId, orderId)
  newVersion()
}

function newVersion() {
  const v = createVersion(order.value, '客户变更需求', '')
  saveCustomers(customers.value)
  viewStep.value = 'S1'
  view.value = 'sales'
  syncUrl()
  say('已新建需求版本 ' + v.label + '，流程从 S1 重新开始')
}

function pickStep(item) {
  if (item.code) viewStep.value = item.code
  view.value = item.view
  syncUrl()
}
function pickSide(v) {
  view.value = v
  syncUrl()
}

function openNewOrder(customerId) {
  if (customerId) activeCustomerId.value = customerId
  pickSide('new-order')
}

const toast = ref('')
let toastTimer = null
function say(text) {
  toast.value = text
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = ''), 3200)
}
const persist = () => saveCustomers(customers.value)

function onCustomerCreated(payload) {
  const c = createCustomer(customers.value, payload)
  persist()
  activeCustomerId.value = c.id
  const o = c.orders[0]
  if (o) {
    activeOrderId.value = o.id
    viewStep.value = 'S1'
    setOpen(openOrders, o.id, true)
    setOpen(openReq, o.id, true)
  }
  setOpen(openCustomers, c.id, true)
  view.value = 'sales'
  syncUrl()
  say('已创建客户「' + c.customer + '」' + (o ? '，并建工单 ' + o.id : '（暂无工单，可再新建工单）'))
}

function onOrderCreated(payload) {
  const o = createOrder(customer.value, customers.value, payload)
  persist()
  activeOrderId.value = o.id
  viewStep.value = 'S1'
  view.value = 'sales'
  setOpen(openCustomers, customer.value.id, true)
  setOpen(openOrders, o.id, true)
  setOpen(openReq, o.id, true)
  syncUrl()
  say('已在客户「' + customer.value.customer + '」下创建工单 ' + o.id + '，流程从 S1 开始')
}

/* ---------------- 流程推进 ---------------- */
function submitToAe() {
  closeStep(order.value, 'S1', '邮件提取 + 初步结论 + 模拟需求报表')
  order.value.stage = 'ae'
  order.value.step = 'S2'
  viewStep.value = 'S2'
  order.value.returned = false
  order.value.returnReason = ''
  order.value.docs = order.value.docs.map((d) =>
    d.label === '报表' ? { ...d, value: '500413 · 填报中' } : d,
  )
  logEvent(order.value, {
    step: 'S1',
    stage: 'sales',
    actor: '销售 · 陈工',
    type: 'submit',
    action: '提交 AE（进入 S2）',
    detail: '邮件提取结果 + 初步结论 + 模拟需求报表一并流转',
  })
  openStep(order.value, 'S2')
  persist()
  setView('ae')
  say('已提交 AE：邮件提取结果、初步结论与模拟需求报表已一并流转')
}

function returnToSales(reason) {
  const text = reason || '报表信息不足，需销售补充后重新提交。'
  closeStep(order.value, 'S2', '500413 报表（被打回）', 'back')
  order.value.stage = 'sales'
  order.value.step = 'S1'
  viewStep.value = 'S1'
  order.value.returned = true
  order.value.returnReason = text
  logEvent(order.value, {
    step: 'S2',
    stage: 'ae',
    actor: 'AE · 李工',
    type: 'back',
    action: '打回销售（退回 S1）',
    detail: text,
  })
  openStep(order.value, 'S1')
  persist()
  setView('sales')
  say('已打回销售，打回原因已记录在工单上')
}

function sendToRd() {
  closeStep(order.value, 'S2', '500413 R03 + 三方确认单')
  order.value.stage = 'rd'
  order.value.step = 'S3'
  viewStep.value = 'S3'
  order.value.returned = false
  order.value.docs = order.value.docs.map((d) =>
    d.label === '报表' ? { ...d, value: '500413 R03 · 三方已确认' } : d,
  )
  logEvent(order.value, {
    step: 'S2',
    stage: 'ae',
    actor: 'AE · 李工',
    type: 'submit',
    action: '发送研发（进入 S3）',
    detail: '报表确认完毕（5 节齐全，三方确认单已生成）',
  })
  openStep(order.value, 'S3')
  persist()
  setView('rd')
  say('报表已确认并发送研发：进入 S3 产品匹配与图纸 / BOM')
}

function finishRd() {
  closeStep(order.value, 'S4', 'BOM 已上载 M3 + 产能评估')
  order.value.stage = 'final'
  order.value.step = 'S5'
  viewStep.value = 'S5'
  order.value.docs = [
    ...order.value.docs.filter((d) => !['M3 单据', '报价单'].includes(d.label)),
    { label: 'M3 单据', value: 'BOM-20261021-021' },
    { label: '报价单', value: '生成中' },
  ]
  logEvent(order.value, {
    step: 'S4',
    stage: 'rd',
    actor: '研发 · 李工',
    type: 'capacity',
    action: '完成评估并回传销售（进入 S5）',
    detail: 'BOM 已上载 M3（BOM-20261021-021）；加权饱和度 86%，可插单',
  })
  openStep(order.value, 'S5')
  persist()
  setView('final')
  say('研发已完成匹配与产能评估，结果回传销售')
}

function ackCustomer() {
  closeStep(order.value, 'S5', '报价单 + 交期预测 + 已回执客户')
  order.value.step = 'S5'
  order.value.docs = order.value.docs.map((d) =>
    d.label === '报价单' ? { ...d, value: 'Q-20261021-001 · 含税 ￥35,030' } : d,
  )
  logEvent(order.value, {
    step: 'S5',
    stage: 'final',
    actor: '销售 · 陈工',
    type: 'ack',
    action: '回执客户并归档（S5 完成）',
    detail: '报价单 Q-20261021-001（含税 ￥35,030）+ 交期预测已发送（微信 + 邮件）',
  })
  persist()
  say('预测结果已回执客户，工单保持可追溯')
}

function resetAll() {
  customers.value = resetCustomers()
  const c = customers.value[0]
  const o = c.orders[0]
  activeCustomerId.value = c.id
  activeOrderId.value = o.id
  openCustomers.value = new Set([c.id])
  openOrders.value = new Set([o.id])
  openReq.value = new Set([o.id])
  viewStep.value = o.step || 'S1'
  view.value = 'sales'
  syncUrl()
  say('演示数据已重置为初始状态')
}

/* ---------------- 视图标题 ---------------- */
const SIDE_VIEWS = ['home', 'orders', 'reports', 'actions', 'settings']
/** 只有这些视图属于"某张工单的流程"，才显示 S1–S5 步骤条 */
const STEP_VIEWS = ['sales', 'ae', 'rd', 'final']
const active = computed(
  () =>
    STEP_VIEWS.includes(view.value) &&
    view.value === order.value.stage &&
    viewStep.value === curStep.value,
)
const currentStage = computed(() => stages.find((s) => s.key === order.value.stage))
const progress = computed(() => orderProgress(order.value))

const VIEW_META = {
  customer: { no: '客户', title: '客户总览', owner: '客户信息、名下工单与动态' },
  order: { no: '工单', title: '工单总览', owner: '工单信息、流程进度与需求版本' },
  versions: { no: '版本', title: '需求版本管理 · Dashboard', owner: '客户每次变更 = 新版本，重走 S1–S5' },
  'new-order': { no: '新建', title: '新建工单', owner: '在当前客户下新增工单' },
  'new-customer': { no: '新建', title: '新建客户', owner: '录入客户与首个工单' },
}
const SIDE_META = {
  home: { no: '首页', title: '首页', owner: '我的客户、工单与最近动态' },
  orders: { no: '总览', title: '工单总览', owner: '全部客户、工单与进度' },
  reports: { no: '报告', title: '报告中心', owner: '各工单的单据与资料' },
  actions: { no: '措施', title: '措施中心', owner: '待办、风险与责任人' },
  settings: { no: '设置', title: '设置', owner: '主题、数据与留痕导出' },
}
const viewTitle = computed(() => {
  if (VIEW_META[view.value]) return VIEW_META[view.value].title
  if (SIDE_META[view.value]) return SIDE_META[view.value].title
  return viewStepDef.value.name
})
const viewNo = computed(() => {
  if (VIEW_META[view.value]) return VIEW_META[view.value].no
  if (SIDE_META[view.value]) return SIDE_META[view.value].no
  return viewStepDef.value.code
})
const viewOwner = computed(() => {
  if (VIEW_META[view.value]) return VIEW_META[view.value].owner
  if (SIDE_META[view.value]) return SIDE_META[view.value].owner
  return viewStepDef.value.owner
})
</script>

<template>
  <div class="wb">
    <!-- 顶栏 -->
    <header class="wb__top">
      <div class="wb__brand">
        <span class="wb__mark"><AppIcon name="factory" :size="20" /></span>
        <div>
          <h1 class="wb__title">部门工作台</h1>
          <p class="wb__sub">客户 → 工单 → 需求版本 → 标准流程 S1–S5</p>
        </div>
      </div>

      <div class="wb__order">
        <span class="wb__orderid mono">{{ order.id }}</span>
        <span class="wb__chip mono">{{ customer.customer }}</span>
        <span class="wb__chip mono">{{ order.product }}</span>
        <span class="wb__chip mono">{{ order.qty }}</span>
        <span class="wb__chip mono" :class="{ 'is-high': order.priority === '高' }">
          优先级 {{ order.priority }}
        </span>
      </div>

      <div class="wb__topright">
        <span class="wb__state mono">
          {{ currentStage.no }} · {{ recLabel[recState(order, order.stage)] }}
        </span>
        <a class="wb__link mono" href="./index.html">流程演示页 →</a>
      </div>
    </header>

    <div class="wb__body">
      <!-- 侧边栏 -->
      <aside class="ws">
        <header class="ws__head">
          <h2 class="ws__title">工作区</h2>
          <div class="ws__icons">
            <button class="icon" type="button" title="搜索" @click="searchOpen = !searchOpen">
              <AppIcon name="search" :size="15" />
            </button>
            <button
              class="icon"
              type="button"
              title="部门筛选"
              @click="deptFilter = deptFilter === 'all' ? 'rd' : 'all'"
            >
              <AppIcon name="overflow" :size="15" />
            </button>
            <button class="icon" type="button" title="新建客户" @click="pickSide('new-customer')">
              <AppIcon name="plus" :size="15" />
            </button>
          </div>
        </header>

        <div v-if="searchOpen" class="ws__searchbox">
          <AppIcon name="search" :size="13" />
          <input v-model="keyword" class="ws__search" placeholder="搜索客户 / 工单 / 版本" />
          <select v-model="deptFilter" class="ws__dept">
            <option value="all">全部部门</option>
            <option v-for="d in departments" :key="d.key" :value="d.key">{{ d.name }}</option>
          </select>
        </div>

        <div class="ws__list">
          <button class="row" :class="{ 'is-on': view === 'home' }" type="button" @click="pickSide('home')">
            <AppIcon name="grid" :size="14" class="row__lead" />
            <span class="row__text" title="我的客户、工单与最近动态">首页</span>
          </button>

          <!-- 一级：客户 -->
          <div v-for="c in visibleCustomers" :key="c.id" class="grp">
            <div
              class="grp__head"
              :class="{ 'is-on': c.id === activeCustomerId }"
              :title="c.customer + ' · ' + c.contact + ' · ' + c.orders.length + ' 张工单'"
              @click="clickCustomer(c)"
            >
              <span class="iconbtn" aria-hidden="true">
                <AppIcon name="users" :size="14" class="grp__icon" />
              </span>
              <span class="grp__name">{{ cut(c.customer) }}</span>
              <span class="grp__tools">
                <button
                  class="icon icon--sm"
                  type="button"
                  title="在该客户下新建工单"
                  @click.stop="openNewOrder(c.id)"
                >
                  <AppIcon name="plus" :size="13" />
                </button>
              </span>
            </div>

            <!-- 二级：工单 -->
            <div v-if="openCustomers.has(c.id)" class="lv2">
              <div
                v-for="o in visibleOrders(c)"
                :key="o.id"
                class="ord"
                :class="{ 'is-on': o.id === activeOrderId }"
              >
                <div
                  class="grp__head grp__head--ord"
                  :title="o.id + ' · ' + o.title + ' · ' + o.product + ' · ' + o.qty + ' · ' + o.due"
                  @click="clickOrder(c, o)"
                >
                  <span class="iconbtn" aria-hidden="true">
                    <AppIcon name="layers" :size="14" class="grp__icon" />
                  </span>
                  <span class="grp__name">{{ cut(o.title) }}</span>
                  <span class="grp__tools">
                    <span class="mini mono">{{ o.step }}</span>
                    <span v-if="o.returned" class="mini mini--back mono">打回</span>
                  </span>
                </div>

                <div v-if="openOrders.has(o.id)" class="lv3">
                  <!-- 三级：需求版本管理 -->
                  <div
                    class="grp__head grp__head--req"
                    :class="{ 'is-on': o.id === activeOrderId && view === 'versions' }"
                    title="查看全部需求版本、对比进度、回溯到任意版本"
                    @click="clickReq(c, o)"
                  >
                    <span class="iconbtn" aria-hidden="true">
                      <AppIcon name="refresh" :size="14" class="grp__icon" />
                    </span>
                    <span class="grp__name">需求版本管理</span>
                    <span class="grp__tools">
                      <span class="mini mono">
                        {{ (o.versions.find((v) => v.id === o.activeVersion) || {}).label || 'R01' }} ·
                        {{ o.versions.length }} 版
                      </span>
                    </span>
                  </div>

                  <!-- 四级：需求版本号 -->
                  <ul v-if="openReq.has(o.id)" class="items">
                    <li v-for="v in versionItems" :key="v.id" class="item-wrap">
                      <button
                        class="item"
                        :class="[
                          'is-' + (v.state === 'current' ? 'doing' : v.state === 'done' ? 'done' : 'todo'),
                          { 'is-on': o.id === activeOrderId && v.id === o.activeVersion },
                        ]"
                        type="button"
                        :title="
                          v.label +
                          ' ' +
                          (v.summary || v.note || '') +
                          ' · 当前走到 ' +
                          v.step +
                          ' ' +
                          v.stepName +
                          ' · 更新 ' +
                          v.updatedAt
                        "
                        @click="pickVersion(c.id, o.id, v)"
                      >
                        <span class="item__text">
                          {{ v.label }} · {{ cut(v.summary || v.note) }}
                        </span>
                        <span class="item__meta mono">
                          {{ v.state === 'current' ? v.step : stateLabel[v.state] }}
                        </span>
                      </button>
                    </li>
                    <li class="item-wrap">
                      <button
                        class="item item--add"
                        type="button"
                        title="客户变更需求：新建需求版本并从 S1 重新走一遍"
                        @click="newVersionFor(c.id, o.id)"
                      >
                        <span class="item__text">＋ 新建需求版本</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <button class="addcust" type="button" @click="openNewOrder(c.id)">
                <AppIcon name="plus" :size="12" />
                新建工单
              </button>
            </div>
          </div>

          <button
            class="row"
            :class="{ 'is-on': view === 'new-customer' }"
            type="button"
            @click="pickSide('new-customer')"
          >
            <AppIcon name="plus" :size="14" class="row__lead" />
            <span class="row__text" title="创建客户并录入首个工单">新建客户</span>
          </button>
          <button class="row" :class="{ 'is-on': view === 'settings' }" type="button" @click="pickSide('settings')">
            <AppIcon name="gear" :size="14" class="row__lead" />
            <span class="row__text">设置</span>
            <AppIcon name="chevronRight" :size="13" class="row__tail" />
          </button>
        </div>
      </aside>

      <!-- 主视图 -->
      <main class="stage">
        <div class="stage__head">
          <span class="stage__no mono">{{ viewNo }}</span>
          <div class="stage__id">
            <h2 class="stage__title">{{ viewTitle }}</h2>
            <p class="stage__meta mono">
              <template v-if="view === 'customer'">
                {{ customer.customer }} · {{ customer.orders.length }} 张工单 · {{ viewOwner }}
              </template>
              <template v-else-if="view !== 'new-customer'">
                {{ order.id }} · {{ customer.customer }} · {{ viewOwner }}
              </template>
              <template v-else>{{ viewOwner }}</template>
              <template v-if="STEP_VIEWS.includes(view)">
                · {{ showBlank ? '空白模板' : active ? '可操作' : '仅供查看' }}
              </template>
            </p>
          </div>
          <span v-if="view !== 'new-customer'" class="stage__prog mono">{{ progress }}%</span>
        </div>

        <!-- 步骤条（仅工单流程视图显示） -->
        <ol v-if="STEP_VIEWS.includes(view)" class="stepbar">
          <li
            v-for="(s, i) in flowSteps"
            :key="s.code"
            class="stepbar__item"
            :class="['is-' + stepState(s.code), { 'is-on': viewStep === s.code }]"
          >
            <span class="stepbar__wrap">
              <button
                v-if="!order.filled?.[s.code] && s.code === curStep"
                class="stepbar__fill"
                type="button"
                title="一键填写本步骤"
                @click.stop="fillStep({ code: s.code })"
              >
                <AppIcon name="sparkle" :size="12" />
              </button>
              <button
                class="stepbar__btn"
                type="button"
                :title="s.code + ' ' + s.name + ' · ' + s.owner"
                @click="gotoStep(s.code)"
              >
                <span class="stepbar__code mono">{{ s.code }}</span>
                <span class="stepbar__name">{{ s.name }}</span>
              </button>
            </span>
            <span v-if="i < flowSteps.length - 1" class="stepbar__arrow" aria-hidden="true">›</span>
          </li>
        </ol>

        <div
          v-if="order.returned && order.stage === 'sales' && viewStep === 'S1' && !showBlank"
          class="banner"
        >
          <AppIcon name="info" :size="15" />
          <div><b>AE 已打回：</b>{{ order.returnReason }}</div>
        </div>

        <!-- 新建客户 / 工单 -->
        <CustomerForm
          v-if="view === 'new-customer'"
          :customers="customers"
          @create="onCustomerCreated"
          @cancel="pickSide('orders')"
        />
        <OrderForm
          v-else-if="view === 'new-order'"
          :customer="customer"
          :customers="customers"
          @create="onOrderCreated"
          @cancel="pickOrder(customer.id, order.id)"
        />

        <!-- 客户总览 -->
        <CustomerDash
          v-if="view === 'customer'"
          :customer="customer"
          @flow="enterFlow($event)"
          @versions="(id) => { pickOrder(customer.id, id); setView('versions') }"
          @new-order="openNewOrder(customer.id)"
        />

        <!-- 工单总览 -->
        <OrderDash
          v-else-if="view === 'order'"
          :customer="customer"
          :order="order"
          @flow="enterFlow(order.id)"
          @versions="setView('versions')"
          @step="(code) => { gotoStep(code) }"
        />

        <!-- 空白模板 -->
        <EmptyStep
          v-else-if="showBlank"
          :view="view"
          :order="order"
          :step="viewStepDef"
          :busy="filling"
          @fill="fillStep({ code: viewStep })"
        />

        <!-- 版本看板 -->
        <VersionDashboard
          v-else-if="view === 'versions'"
          :order="order"
          :customers="customers"
          @goto="(k) => gotoStep(k)"
          @say="say"
        />

        <!-- 下层视图 -->
        <SideViews
          v-else-if="SIDE_VIEWS.includes(view)"
          :view="view"
          :customers="customers"
          :active-id="order.id"
          :theme="theme"
          @pick="
            (customerId, orderId, v) => {
              if (orderId) pickOrder(customerId, orderId)
              setView(v)
            }
          "
          @reset="resetAll"
          @theme="setTheme"
          @new-customer="pickSide('new-customer')"
          @new-order="openNewOrder($event)"
        />

        <!-- 各步骤 -->
        <SalesStage
          v-else-if="view === 'sales'"
          :order="order"
          :active="active"
          :step="viewStepDef"
          :focus="viewFocus"
          @submit="submitToAe"
        />
        <FinalStage
          v-else-if="view === 'final'"
          :order="order"
          :active="active"
          :step="viewStepDef"
          :focus="viewFocus"
          @ack="ackCustomer"
        />
        <AeStage
          v-else-if="view === 'ae'"
          :order="order"
          :active="active"
          :step="viewStepDef"
          @back="returnToSales"
          @confirm="say('报表已确认：3 处客户询问已回填，三方确认单已生成')"
          @send="sendToRd"
        />
        <RdMatch
          v-else-if="view === 'rd' && viewStep === 'S3'"
          :order="order"
          :active="active"
          :step="viewStepDef"
          @fill="fillStep({ code: 'S3' })"
        />
        <RdCapacity
          v-else-if="view === 'rd'"
          :order="order"
          :active="active"
          :step="viewStepDef"
          @fill="fillStep({ code: 'S4' })"
        />
      </main>
    </div>

    <transition name="toast">
      <p v-if="toast" class="wb__toast">{{ toast }}</p>
    </transition>
  </div>
</template>

<style scoped>
.wb {
  min-height: 100vh;
  background: var(--paper);
  color: var(--ink);
}
.wb__top {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  padding: 10px 18px;
  border-bottom: 1px solid var(--rule-2);
  background: var(--surface);
  position: sticky;
  top: 0;
  z-index: 20;
}
.wb__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.wb__mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-sm);
  color: var(--accent-ink);
  background: var(--accent-3);
}
.wb__title {
  font-size: 1.02rem;
}
.wb__sub {
  font-size: 0.66rem;
  color: var(--ink-4);
}
.wb__order {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.wb__orderid {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: var(--r-xs);
  background: var(--ink);
  color: var(--paper);
}
.wb__chip {
  font-size: 0.62rem;
  padding: 3px 8px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-pill);
  color: var(--ink-3);
  background: var(--paper);
}
.wb__chip.is-high {
  border-color: var(--danger);
  background: var(--danger-soft);
  color: var(--danger);
}
.wb__topright {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}
.wb__state {
  font-size: 0.62rem;
  padding: 4px 10px;
  border-radius: var(--r-pill);
  border: 1px solid var(--accent-2);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.wb__link {
  font-size: 0.62rem;
  color: var(--ink-3);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.wb__link:hover {
  color: var(--accent-ink);
}
.wb__body {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  align-items: start;
}
.ws {
  position: sticky;
  top: 57px;
  align-self: start;
  max-height: calc(100vh - 57px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 8px 24px;
  border-right: 1px solid var(--rule-2);
  background: var(--paper-2);
}
.ws__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px 10px;
}
.ws__title {
  font-size: 1.02rem;
  font-weight: 700;
}
.ws__icons {
  margin-left: auto;
  display: flex;
  gap: 2px;
}
.icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: var(--r-sm);
  color: var(--ink-3);
  transition: background 0.16s ease, color 0.16s ease;
}
.icon:hover {
  background: var(--paper-3);
  color: var(--accent-ink);
}
.icon--sm {
  width: 22px;
  height: 22px;
}
.ws__searchbox {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 4px 8px;
  padding: 5px 8px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-sm);
  background: var(--surface);
  color: var(--ink-3);
}
.ws__search {
  flex: 1;
  min-width: 0;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 0.76rem;
  color: var(--ink);
  outline: none;
}
.ws__dept {
  border: none;
  background: none;
  font-family: inherit;
  font-size: 0.68rem;
  color: var(--ink-3);
  outline: none;
  cursor: pointer;
}
.ws__list {
  display: grid;
  gap: 1px;
  min-width: 0;
}
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px;
  border-radius: var(--r-sm);
  font-size: 0.88rem;
  color: var(--ink-2);
  text-align: left;
  transition: background 0.16s ease, color 0.16s ease;
}
.row:hover {
  background: var(--paper-3);
}
.row.is-on {
  background: var(--accent-3);
  color: var(--accent-ink);
  font-weight: 700;
}
.row__lead {
  flex: none;
  color: var(--ink-4);
}
.row.is-on .row__lead {
  color: var(--accent-ink);
}
.row__text {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row__tail {
  color: var(--ink-4);
}
.grp {
  display: grid;
  margin: 2px 0;
  min-width: 0;
}
.grp__head {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px;
  border-radius: var(--r-sm);
  cursor: pointer;
  transition: background 0.16s ease;
}
.grp__head:hover {
  background: var(--paper-3);
}
.grp__head.is-on {
  background: var(--paper-3);
}
.grp__head:active {
  background: var(--accent-3);
}
.iconbtn {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  flex: none;
  border-radius: var(--r-xs);
  color: var(--ink-3);
  transition: color 0.16s ease, transform 0.16s ease;
  pointer-events: none;
}
.grp__head:hover .iconbtn {
  color: var(--accent-ink);
  transform: translateY(-1px);
}
.grp__icon {
  flex: none;
}
.grp__name {
  flex: 1 1 auto;
  min-width: 0;
  text-align: left;
  font-size: 0.88rem;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.grp__tools {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.16s ease;
}
.grp__head:hover .grp__tools,
.grp__head--req .grp__tools {
  opacity: 1;
}
.mini {
  font-size: 0.52rem;
  padding: 1px 6px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-pill);
  color: var(--ink-4);
  white-space: nowrap;
}
.mini--back {
  border-color: var(--danger);
  background: var(--danger-soft);
  color: var(--danger);
}
.lv2 {
  min-width: 0;
  padding-left: 8px;
}
.ord {
  min-width: 0;
}
.ord.is-on > .grp__head--ord {
  background: var(--paper-3);
}
.grp__head--ord .grp__name {
  font-size: 0.84rem;
  color: var(--ink-2);
}
.lv3 {
  min-width: 0;
  padding-left: 12px;
}
.grp__head--req {
  border-left: 3px solid transparent;
  border-radius: var(--r-xs);
}
.grp__head--req .grp__name {
  font-weight: 700;
}
.grp__head--req.is-on {
  background: var(--accent-3);
}
.addcust {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 2px 0 6px 30px;
  padding: 4px 9px;
  border: 1px dashed var(--rule-2);
  border-radius: var(--r-sm);
  font-size: 0.68rem;
  color: var(--ink-3);
  transition: all 0.16s ease;
}
.addcust:hover {
  border-color: var(--accent);
  border-style: solid;
  color: var(--accent-ink);
  background: var(--accent-3);
}
.items {
  margin: 0;
  padding: 0 0 4px 14px;
  list-style: none;
  display: grid;
  gap: 2px;
  min-width: 0;
}
.item-wrap {
  min-width: 0;
}
.item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 6px;
  align-items: center;
  width: 100%;
  min-width: 0;
  padding: 6px 8px 6px 7px;
  border-radius: var(--r-xs);
  border-left: 3px solid transparent;
  text-align: left;
  transition: background 0.16s ease, box-shadow 0.16s ease;
}
.item:hover {
  filter: brightness(0.985);
}
.item.is-todo {
  background: var(--info-soft);
  border-left-color: var(--info);
}
.item.is-back {
  background: var(--danger-soft);
  border-left-color: var(--danger);
}
.item.is-doing {
  background: var(--accent-3);
  border-left-color: var(--accent);
}
.item.is-done {
  background: var(--paper-3);
  border-left-color: var(--rule-2);
}
.item.is-on {
  box-shadow: inset 0 0 0 1px var(--accent);
}
.item.is-on .item__text {
  color: var(--ink);
  font-weight: 700;
}
.item--add {
  background: transparent;
  border-left-color: transparent;
  border: 1px dashed var(--rule-2);
  color: var(--ink-3);
}
.item--add:hover {
  border-color: var(--accent);
  border-style: solid;
  background: var(--accent-3);
  color: var(--accent-ink);
}
.item--add .item__text {
  color: inherit;
  font-size: 0.76rem;
}
.item__text {
  min-width: 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item__meta {
  max-width: 3.4em;
  font-size: 0.5rem;
  color: var(--ink-4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: right;
}
.stage {
  padding: 16px 18px 40px;
  min-width: 0;
}
.stage__head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--rule-2);
}
.stage__no {
  display: grid;
  place-items: center;
  min-width: 44px;
  height: 28px;
  padding: 0 9px;
  border-radius: var(--r-sm);
  background: var(--ink);
  color: var(--paper);
  font-size: 0.68rem;
}
.stage__title {
  font-size: 1.12rem;
}
.stage__meta {
  font-size: 0.62rem;
  color: var(--ink-4);
}
.stage__prog {
  margin-left: auto;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--accent-ink);
}
.stepbar {
  display: flex;
  align-items: stretch;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  overflow-x: auto;
}
.stepbar__item {
  display: flex;
  align-items: center;
  min-width: 0;
}
.stepbar__wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}
.stepbar__fill {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  flex: none;
  border-radius: var(--r-xs);
  background: var(--accent);
  color: #fff;
  transition: transform 0.16s ease, filter 0.16s ease;
}
.stepbar__fill:hover {
  transform: scale(1.08);
  filter: brightness(1.06);
}
.stepbar__btn {
  display: grid;
  gap: 1px;
  padding: 6px 10px;
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  text-align: left;
  transition: background 0.16s ease, border-color 0.16s ease;
}
.stepbar__btn:hover {
  background: var(--paper-3);
}
.stepbar__code {
  font-size: 0.56rem;
  color: var(--ink-4);
}
.stepbar__name {
  font-size: 0.74rem;
  color: var(--ink-3);
  white-space: nowrap;
}
.stepbar__item.is-done .stepbar__code {
  color: var(--ok);
}
.stepbar__item.is-done .stepbar__name {
  color: var(--ink-2);
}
.stepbar__item.is-doing .stepbar__btn {
  border-color: var(--accent);
  background: var(--accent-3);
}
.stepbar__item.is-doing .stepbar__code,
.stepbar__item.is-doing .stepbar__name {
  color: var(--accent-ink);
  font-weight: 700;
}
.stepbar__item.is-todo .stepbar__name {
  color: var(--ink-4);
}
.stepbar__item.is-back .stepbar__btn {
  border-color: var(--danger);
  background: var(--danger-soft);
}
.stepbar__item.is-back .stepbar__name {
  color: var(--danger);
}
.stepbar__item.is-on .stepbar__btn {
  box-shadow: inset 0 0 0 1px var(--accent);
}
.stepbar__arrow {
  padding: 0 2px;
  color: var(--ink-4);
  font-size: 0.9rem;
}
.banner {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid var(--danger);
  border-radius: var(--r-sm);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 0.8rem;
  line-height: 1.65;
}
.wb__toast {
  position: fixed;
  left: 50%;
  bottom: 26px;
  transform: translateX(-50%);
  padding: 10px 16px;
  border-radius: var(--r-sm);
  background: var(--ink);
  color: var(--paper);
  font-size: 0.82rem;
  box-shadow: 0 8px 24px rgba(31, 35, 41, 0.24);
  z-index: 40;
  max-width: 88vw;
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
@media (max-width: 1080px) {
  .wb__body {
    grid-template-columns: 1fr;
  }
  .ws {
    position: static;
    max-height: none;
    border-right: none;
    border-bottom: 1px solid var(--rule-2);
  }
}
</style>
