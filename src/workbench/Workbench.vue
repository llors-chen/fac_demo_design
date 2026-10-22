<script setup>
/**
 * 部门工作台（Workbench）
 *
 * 层级：工单（1）→ 客户（N）→ 需求版本管理 → 客户需求版本号（R01/R02…）
 * 版本内部的 S1–S5 用主视图顶部的流程步骤条切换
 * 左侧边栏仿工作区列表；工单与客户都可新建；每个客户各自持有需求版本与流程进度。
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
import OrderForm from './OrderForm.vue'
import CustomerForm from './CustomerForm.vue'
import { departments, flowSteps, stageIndex, stageOfStep, stepIndex, stages } from './data.js'
import {
  activateVersion,
  closeStep,
  createCustomer,
  createOrder,
  createVersion,
  loadOrders,
  logEvent,
  openStep,
  resetOrders,
  saveOrders,
} from './store.js'

const orders = ref(loadOrders())

const params = new URLSearchParams(window.location.search)
const initialOrder = orders.value.find((o) => o.id === params.get('order')) || orders.value[0]
const initialCust =
  initialOrder.customers.find((c) => c.id === params.get('customer')) || initialOrder.customers[0]

const activeOrderId = ref(initialOrder.id)
const activeCustId = ref(initialCust.id)
const view = ref(params.get('view') || initialCust.step || 'S1')
const viewStep = ref(params.get('step') || initialCust.step || 'S1')
const openOrders = ref(new Set([initialOrder.id]))
const openCustomers = ref(new Set([initialCust.id]))
const openReq = ref(new Set([initialCust.id]))
const keyword = ref('')
const searchOpen = ref(false)
const deptFilter = ref('all')
const theme = ref(document.documentElement.getAttribute('data-theme') === 'paper' ? 'paper' : 'tool')
const filling = ref(false)

const order = computed(() => orders.value.find((o) => o.id === activeOrderId.value) || orders.value[0])
const cust = computed(
  () => order.value.customers.find((c) => c.id === activeCustId.value) || order.value.customers[0],
)

const stageIdx = (key) => stageIndex(key)
const recState = (c, key) => {
  const cur = stageIdx(c.stage)
  const i = stageIdx(key)
  if (i < cur) return 'done'
  if (i === cur) return c.returned ? 'back' : 'doing'
  return 'todo'
}
const recLabel = { done: '已完成', doing: '进行中', back: '已打回', todo: '待处理' }
const orderProgress = (c) => Math.round(((stepIndex(c.step || 'S1') + 1) / flowSteps.length) * 100)

/** 任意客户在任意步骤上的状态（侧边栏非当前客户也要显示） */
function stepStateOf(c, code) {
  const i = stepIndex(code)
  const cur = stepIndex(c.step || 'S1')
  if (i < cur) return 'done'
  if (i > cur) return 'todo'
  return c.returned ? 'back' : 'doing'
}

/* ---------------- URL 同步 ---------------- */
function syncUrl() {
  const q = new URLSearchParams()
  q.set('order', activeOrderId.value)
  q.set('customer', activeCustId.value)
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
const curStep = computed(() => cust.value.step || 'S1')
const curIndex = computed(() => stepIndex(curStep.value))
const stepState = (code) => stepStateOf(cust.value, code)

const viewStepDef = computed(
  () =>
    flowSteps.find((s) => s.code === viewStep.value) ||
    flowSteps.find((s) => s.code === curStep.value) ||
    flowSteps[0],
)
const viewFocus = computed(() => viewStepDef.value.focus || '')

const verItem = computed(() => {
  const vers = cust.value.versions || []
  const cur = vers.find((v) => v.id === cust.value.activeVersion)
  return {
    code: '版本',
    name: '需求版本管理',
    desc: '查看全部需求版本、对比进度、回溯到任意版本；客户每次变更都会新建版本并重走 S1–S5',
    version: cur?.label || 'R01',
    versionCount: vers.length,
  }
})

/** 四级：客户需求版本号（R01 / R02 …），版本内部的 S1–S5 用主视图的步骤条切换 */
const versionItems = computed(() =>
  [...(cust.value.versions || [])]
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
        state:
          v.id === cust.value.activeVersion ? 'current' : v.step === 'S5' ? 'done' : 'history',
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

/** 切到某个需求版本（该版本内部的 S1–S5 进度独立保存） */
function pickVersion(orderId, custId, v) {
  pickCustomer(orderId, custId)
  const target = cust.value.versions.find((x) => x.id === v.id)
  if (!target) return
  if (target.id !== cust.value.activeVersion) {
    activateVersion(cust.value, target.id)
    saveOrders(orders.value)
    say('已切到需求版本 ' + target.label + '（' + (target.note || '') + '）')
  }
  viewStep.value = flowSteps.some((s) => s.code === cust.value.step) ? cust.value.step : 'S1'
  view.value = flowSteps.find((s) => s.code === viewStep.value)?.view || 'sales'
  syncUrl()
}

/** 选中客户并新建需求版本 */
function newVersionFor(orderId, custId) {
  pickCustomer(orderId, custId)
  newVersion()
}

/** 客户变更需求：新建需求版本，从 S1 重新走 */
function newVersion() {
  const v = createVersion(cust.value, '客户变更需求', '')
  saveOrders(orders.value)
  viewStep.value = 'S1'
  view.value = 'sales'
  syncUrl()
  say('已新建需求版本 ' + v.label + '，流程从 S1 重新开始')
}

const visibleOrders = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return orders.value
  return orders.value.filter(
    (o) =>
      o.id.toLowerCase().includes(kw) ||
      o.title.toLowerCase().includes(kw) ||
      o.customers.some(
        (c) => c.customer.toLowerCase().includes(kw) || c.product.toLowerCase().includes(kw),
      ),
  )
})

function visibleCustomers(o) {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw || o.id.toLowerCase().includes(kw) || o.title.toLowerCase().includes(kw)) return o.customers
  return o.customers.filter(
    (c) => c.customer.toLowerCase().includes(kw) || c.product.toLowerCase().includes(kw),
  )
}

/* ---------------- 一键填写 ---------------- */
const FILLABLE = ['sales', 'ae', 'rd', 'final']
const stepFilled = computed(() => !!cust.value.filled?.[viewStep.value])
const showBlank = computed(() => FILLABLE.includes(view.value) && !stepFilled.value)
const needsFill = (item) => !item.filled && item.code === curStep.value

function fillStep(item) {
  const code = item?.code || curStep.value
  if (filling.value) return
  const s = flowSteps.find((x) => x.code === code)
  if (!s) return
  filling.value = true
  cust.value.filled = { ...(cust.value.filled || {}), [code]: true }
  logEvent(cust.value, {
    step: code,
    stage: s.view,
    actor: 'AI 助手',
    type: 'fill',
    action: '一键填写本步骤',
    detail: '按客户原话、附件与平台标准自动填入「' + s.code + ' ' + s.name + '」的全部字段',
  })
  closeStep(cust.value, code, s.desc)
  saveOrders(orders.value)
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

function setCustStep(code) {
  const s = flowSteps.find((x) => x.code === code)
  if (!s) return
  cust.value.step = code
  cust.value.stage = stageOfStep(code)
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
  setCustStep(next.code)
  openStep(cust.value, next.code)
}

/* ---------------- 侧边栏交互 ---------------- */
function toggle(setRef, id) {
  const next = new Set(setRef.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  setRef.value = next
}
const toggleOrder = (id) => toggle(openOrders, id)
const toggleCustomer = (id) => toggle(openCustomers, id)
const toggleReq = (id) => toggle(openReq, id)

function pickOrder(id) {
  activeOrderId.value = id
  const o = orders.value.find((x) => x.id === id)
  const c = o.customers[0]
  if (c) {
    activeCustId.value = c.id
    viewStep.value = c.step || 'S1'
    view.value = flowSteps.find((s) => s.code === viewStep.value)?.view || 'sales'
    openCustomers.value = new Set([...openCustomers.value, c.id])
    openReq.value = new Set([...openReq.value, c.id])
  }
  openOrders.value = new Set([...openOrders.value, id])
  syncUrl()
  toast.value = ''
}

function pickCustomer(orderId, custId) {
  activeOrderId.value = orderId
  activeCustId.value = custId
  const o = orders.value.find((x) => x.id === orderId)
  const c = o.customers.find((x) => x.id === custId)
  viewStep.value = c.step || 'S1'
  view.value = flowSteps.find((s) => s.code === viewStep.value)?.view || 'sales'
  openOrders.value = new Set([...openOrders.value, orderId])
  openCustomers.value = new Set([...openCustomers.value, custId])
  openReq.value = new Set([...openReq.value, custId])
  syncUrl()
  toast.value = ''
}

/** 文字限长：超出用省略号（hover 有完整 title） */
const cut = (s, n = 10) => {
  const t = (s || '').trim()
  return t.length > n ? t.slice(0, n) + '…' : t
}

/** 显式设置某个展开状态（避免 pick* 的强制展开与 toggle 相互抵消） */
function setOpen(setRef, id, on) {
  const next = new Set(setRef.value)
  if (on) next.add(id)
  else next.delete(id)
  setRef.value = next
}

/** 整行点击：未展开则展开并选中，已展开则收起 */
function clickOrder(o) {
  const willExpand = !openOrders.value.has(o.id)
  pickOrder(o.id)
  setOpen(openOrders, o.id, willExpand)
}

function clickCustomer(o, cst) {
  const willExpand = !openCustomers.value.has(cst.id)
  pickCustomer(o.id, cst.id)
  setOpen(openCustomers, cst.id, willExpand)
}

function clickReq(o, cst) {
  const willExpand = !openReq.value.has(cst.id)
  pickCustomer(o.id, cst.id)
  setOpen(openReq, cst.id, willExpand)
  if (willExpand) pickSide('versions')
}

/** 在该工单下新建客户 */
function openNewCustomer(orderId) {
  activeOrderId.value = orderId
  pickSide('new-customer')
}

/** 打开某客户的需求版本看板 */
function openVersions(orderId, custId) {
  pickCustomer(orderId, custId)
  pickSide('versions')
}

/** 选中客户并查看某步骤 */
function pickCustStep(orderId, custId, item) {
  pickCustomer(orderId, custId)
  pickStep(item)
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

const toast = ref('')
let toastTimer = null
function say(text) {
  toast.value = text
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = ''), 3200)
}
const persist = () => saveOrders(orders.value)

/* ---------------- 新建工单 / 客户 ---------------- */
function onOrderCreated(payload) {
  const o = createOrder(orders.value, payload)
  persist()
  activeOrderId.value = o.id
  const c = o.customers[0]
  if (c) {
    activeCustId.value = c.id
    viewStep.value = 'S1'
    openCustomers.value = new Set([...openCustomers.value, c.id])
    openReq.value = new Set([...openReq.value, c.id])
  }
  openOrders.value = new Set([...openOrders.value, o.id])
  view.value = 'sales'
  syncUrl()
  say('已创建工单 ' + o.id + (c ? '，并录入客户「' + c.customer + '」' : '（暂无客户，可再新建客户）'))
}

function onCustomerCreated(payload) {
  const c = createCustomer(order.value, payload)
  persist()
  activeCustId.value = c.id
  viewStep.value = 'S1'
  view.value = 'sales'
  openOrders.value = new Set([...openOrders.value, order.value.id])
  openCustomers.value = new Set([...openCustomers.value, c.id])
  openReq.value = new Set([...openReq.value, c.id])
  syncUrl()
  say('已在 ' + order.value.id + ' 下创建客户「' + c.customer + '」，流程从 S1 开始')
}

/* ---------------- 流程推进（写履历） ---------------- */
function submitToAe() {
  closeStep(cust.value, 'S1', '需求要点 + 3 个附件 + AI 初判')
  cust.value.stage = 'ae'
  cust.value.step = 'S2'
  viewStep.value = 'S2'
  cust.value.returned = false
  cust.value.returnReason = ''
  cust.value.docs = cust.value.docs.map((d) =>
    d.label === '报表' ? { ...d, value: '500413 · 填报中' } : d,
  )
  logEvent(cust.value, {
    step: 'S1',
    stage: 'sales',
    actor: '销售 · 陈工',
    type: 'submit',
    action: '提交 AE（进入 S2）',
    detail: '需求要点 + 3 个附件 + AI 结论一并流转；3 项待客户确认已随单传递',
  })
  openStep(cust.value, 'S2')
  persist()
  setView('ae')
  say('已提交 AE：需求要点 + 3 个附件 + AI 结论已一并流转')
}

function returnToSales(reason) {
  const text = reason || '报表信息不足，需销售补充后重新提交。'
  closeStep(cust.value, 'S2', '500413 报表（被打回）', 'back')
  cust.value.stage = 'sales'
  cust.value.step = 'S1'
  viewStep.value = 'S1'
  cust.value.returned = true
  cust.value.returnReason = text
  logEvent(cust.value, {
    step: 'S2',
    stage: 'ae',
    actor: 'AE · 李工',
    type: 'back',
    action: '打回销售（退回 S1）',
    detail: text,
  })
  openStep(cust.value, 'S1')
  persist()
  setView('sales')
  say('已打回销售，打回原因已记录在工单上')
}

function sendToRd() {
  closeStep(cust.value, 'S2', '500413 R03 + 三方确认单')
  cust.value.stage = 'rd'
  cust.value.step = 'S3'
  viewStep.value = 'S3'
  cust.value.returned = false
  cust.value.docs = cust.value.docs.map((d) =>
    d.label === '报表' ? { ...d, value: '500413 R03 · 三方已确认' } : d,
  )
  logEvent(cust.value, {
    step: 'S2',
    stage: 'ae',
    actor: 'AE · 李工',
    type: 'submit',
    action: '发送研发（进入 S3）',
    detail: '报表确认完毕（5 节齐全，三方确认单已生成）',
  })
  openStep(cust.value, 'S3')
  persist()
  setView('rd')
  say('报表已确认并发送研发：进入 S3 产品匹配与图纸 / BOM')
}

function finishRd() {
  closeStep(cust.value, 'S4', 'BOM 已上载 M3 + 产能评估')
  cust.value.stage = 'final'
  cust.value.step = 'S5'
  viewStep.value = 'S5'
  cust.value.docs = [
    ...cust.value.docs.filter((d) => !['M3 单据', '报价单'].includes(d.label)),
    { label: 'M3 单据', value: 'BOM-20261021-021' },
    { label: '报价单', value: '生成中' },
  ]
  logEvent(cust.value, {
    step: 'S4',
    stage: 'rd',
    actor: '研发 · 李工',
    type: 'capacity',
    action: '完成评估并回传销售（进入 S5）',
    detail: 'BOM 已上载 M3（BOM-20261021-021）；加权饱和度 86%，可插单',
  })
  openStep(cust.value, 'S5')
  persist()
  setView('final')
  say('研发已完成匹配与产能评估，结果回传销售')
}

function ackCustomer() {
  closeStep(cust.value, 'S5', '报价单 + 交期预测 + 已回执客户')
  cust.value.step = 'S5'
  cust.value.docs = cust.value.docs.map((d) =>
    d.label === '报价单' ? { ...d, value: 'Q-20261021-001 · 含税 ￥35,030' } : d,
  )
  logEvent(cust.value, {
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
  orders.value = resetOrders()
  const o = orders.value[0]
  const c = o.customers[0]
  activeOrderId.value = o.id
  activeCustId.value = c.id
  openOrders.value = new Set([o.id])
  openCustomers.value = new Set([c.id])
  openReq.value = new Set([c.id])
  viewStep.value = c.step || 'S1'
  view.value = 'sales'
  syncUrl()
  say('演示数据已重置为初始状态')
}

/* ---------------- 视图标题 ---------------- */
const SIDE_VIEWS = ['home', 'orders', 'reports', 'actions', 'settings']
const active = computed(
  () =>
    !SIDE_VIEWS.includes(view.value) &&
    view.value !== 'versions' &&
    view.value === cust.value.stage &&
    viewStep.value === curStep.value,
)
const currentStage = computed(() => stages.find((s) => s.key === cust.value.stage))
const progress = computed(() => orderProgress(cust.value))

const VIEW_META = {
  versions: { no: '版本', title: '需求版本管理 · Dashboard', owner: '客户每次变更 = 新版本，重走 S1–S5' },
  'new-order': { no: '新建', title: '新建工单', owner: '录入工单与首个客户' },
  'new-customer': { no: '新建', title: '新建客户', owner: '在当前工单下新增需求方' },
}
const SIDE_META = {
  home: { no: '首页', title: '首页', owner: '我的工单与最近动态' },
  orders: { no: '总览', title: '工单总览', owner: '全部工单、客户与进度' },
  reports: { no: '报告', title: '报告中心', owner: '各客户的单据与资料' },
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
          <p class="wb__sub">工单 → 客户 → 需求版本 → 标准流程 S1–S5</p>
        </div>
      </div>

      <div class="wb__order">
        <span class="wb__orderid mono">{{ order.id }}</span>
        <span class="wb__chip mono">{{ cust.customer }}</span>
        <span class="wb__chip mono">{{ cust.product }}</span>
        <span class="wb__chip mono">{{ cust.qty }}</span>
        <span class="wb__chip mono" :class="{ 'is-high': cust.priority === '高' }">
          优先级 {{ cust.priority }}
        </span>
      </div>

      <div class="wb__topright">
        <span class="wb__state mono">
          {{ currentStage.no }} · {{ recLabel[recState(cust, cust.stage)] }}
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
            <button class="icon" type="button" title="新建工单" @click="pickSide('new-order')">
              <AppIcon name="plus" :size="15" />
            </button>
          </div>
        </header>

        <div v-if="searchOpen" class="ws__searchbox">
          <AppIcon name="search" :size="13" />
          <input v-model="keyword" class="ws__search" placeholder="搜索工单 / 客户 / 步骤" />
          <select v-model="deptFilter" class="ws__dept">
            <option value="all">全部部门</option>
            <option v-for="d in departments" :key="d.key" :value="d.key">{{ d.name }}</option>
          </select>
        </div>

        <div class="ws__list">
          <button class="row" :class="{ 'is-on': view === 'home' }" type="button" @click="pickSide('home')">
            <AppIcon name="grid" :size="14" class="row__lead" />
            <span class="row__text" title="我的工单与最近动态">首页</span>
          </button>

          <!-- 一级：工单 -->
          <div v-for="o in visibleOrders" :key="o.id" class="grp">
            <div
              class="grp__head"
              :class="{ 'is-on': o.id === activeOrderId }"
              :title="o.id + ' · ' + o.title + ' · ' + o.customers.length + ' 个客户'"
              @click="clickOrder(o)"
            >
              <span class="iconbtn" aria-hidden="true">
                <AppIcon name="layers" :size="14" class="grp__icon" />
              </span>
              <span class="grp__name">{{ cut(o.title) }}</span>
              <span class="grp__tools">
                <button
                  class="icon icon--sm"
                  type="button"
                  title="在该工单下新建客户"
                  @click.stop="openNewCustomer(o.id)"
                >
                  <AppIcon name="plus" :size="13" />
                </button>
              </span>
            </div>

            <!-- 二级：客户 -->
            <div v-if="openOrders.has(o.id)" class="lv2">
              <div
                v-for="c in visibleCustomers(o)"
                :key="c.id"
                class="cust"
                :class="{ 'is-on': c.id === activeCustId }"
              >
                <div
                  class="grp__head grp__head--cust"
                  :title="c.customer + ' · ' + c.product + ' · ' + c.qty + ' · ' + c.contact"
                  @click="clickCustomer(o, c)"
                >
                  <span class="iconbtn" aria-hidden="true">
                    <AppIcon name="users" :size="14" class="grp__icon" />
                  </span>
                  <span class="grp__name">{{ cut(c.customer) }}</span>
                  <span class="grp__tools">
                    <span class="mini mono">{{ c.step }}</span>
                    <span v-if="c.returned" class="mini mini--back mono">打回</span>
                  </span>
                </div>

                <div v-if="openCustomers.has(c.id)" class="lv3">
                  <!-- 三级：需求版本管理 -->
                  <div
                    class="grp__head grp__head--req"
                    :class="{ 'is-on': c.id === activeCustId && view === 'versions' }"
                    :title="verItem.desc"
                    @click="clickReq(o, c)"
                  >
                    <span class="iconbtn" aria-hidden="true">
                      <AppIcon name="refresh" :size="14" class="grp__icon" />
                    </span>
                    <span class="grp__name">需求版本管理</span>
                    <span class="grp__tools">
                      <span class="mini mono">
                        {{ (c.versions.find((v) => v.id === c.activeVersion) || {}).label || 'R01' }} ·
                        {{ c.versions.length }} 版
                      </span>
                    </span>
                  </div>

                  <!-- 四级：客户需求版本号 -->
                  <ul v-if="openReq.has(c.id)" class="items">
                    <li v-for="v in versionItems" :key="v.id" class="item-wrap">
                      <button
                        class="item"
                        :class="[
                          'is-' + (v.state === 'current' ? 'doing' : v.state === 'done' ? 'done' : 'todo'),
                          { 'is-on': c.id === activeCustId && v.id === c.activeVersion },
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
                        @click="pickVersion(o.id, c.id, v)"
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
                        @click="newVersionFor(o.id, c.id)"
                      >
                        <span class="item__text">＋ 新建需求版本</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <button class="addcust" type="button" @click="openNewCustomer(o.id)">
                <AppIcon name="plus" :size="12" />
                新建客户
              </button>
            </div>
          </div>

          <button class="row" :class="{ 'is-on': view === 'new-order' }" type="button" @click="pickSide('new-order')">
            <AppIcon name="plus" :size="14" class="row__lead" />
            <span class="row__text" title="创建工单并录入首个客户">新建工单</span>
          </button>
          <button class="row" :class="{ 'is-on': view === 'orders' }" type="button" @click="pickSide('orders')">
            <AppIcon name="file" :size="14" class="row__lead" />
            <span class="row__text" title="全部工单、客户与进度">工单总览</span>
          </button>
          <button class="row" :class="{ 'is-on': view === 'reports' }" type="button" @click="pickSide('reports')">
            <AppIcon name="newspaper" :size="14" class="row__lead" />
            <span class="row__text" title="各客户的单据与资料">报告中心</span>
          </button>
          <button class="row" :class="{ 'is-on': view === 'actions' }" type="button" @click="pickSide('actions')">
            <AppIcon name="flag" :size="14" class="row__lead" />
            <span class="row__text" title="待办、风险与责任人">措施中心</span>
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
              {{ order.id }} · {{ cust.customer }} · {{ viewOwner }}
              <template v-if="!SIDE_VIEWS.includes(view) && view !== 'versions'">
                · {{ showBlank ? '空白模板' : active ? '可操作' : '仅供查看' }}
              </template>
            </p>
          </div>
          <span class="stage__prog mono">{{ progress }}%</span>
        </div>

        <!-- 步骤条 -->
        <ol class="stepbar">
          <li
            v-for="(s, i) in flowSteps"
            :key="s.code"
            class="stepbar__item"
            :class="['is-' + stepState(s.code), { 'is-on': viewStep === s.code }]"
          >
            <span class="stepbar__wrap">
              <button
                v-if="!cust.filled?.[s.code] && s.code === curStep"
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

        <div v-if="cust.returned && cust.stage === 'sales' && viewStep === 'S1' && !showBlank" class="banner">
          <AppIcon name="info" :size="15" />
          <div><b>AE 已打回：</b>{{ cust.returnReason }}</div>
        </div>

        <!-- 新建工单 / 客户 -->
        <OrderForm
          v-if="view === 'new-order'"
          :orders="orders"
          @create="onOrderCreated"
          @cancel="pickSide('orders')"
        />
        <CustomerForm
          v-else-if="view === 'new-customer'"
          :order="order"
          @create="onCustomerCreated"
          @cancel="pickCustomer(order.id, cust.id)"
        />

        <!-- 空白模板 -->
        <EmptyStep
          v-else-if="showBlank"
          :view="view"
          :order="cust"
          :step="viewStepDef"
          :busy="filling"
          @fill="fillStep({ code: viewStep })"
        />

        <!-- 版本看板 -->
        <VersionDashboard
          v-else-if="view === 'versions'"
          :order="cust"
          :orders="orders"
          @goto="(k) => gotoStep(k)"
          @say="say"
        />

        <!-- 下层视图 -->
        <SideViews
          v-else-if="SIDE_VIEWS.includes(view)"
          :view="view"
          :orders="orders"
          :active-id="cust.id"
          :theme="theme"
          @pick="(orderId, custId, v) => { if (custId) pickCustomer(orderId, custId); setView(v) }"
          @reset="resetAll"
          @theme="setTheme"
          @new-order="pickSide('new-order')"
        />

        <!-- 各步骤 -->
        <SalesStage
          v-else-if="view === 'sales'"
          :order="cust"
          :active="active"
          :step="viewStepDef"
          :focus="viewFocus"
          @submit="submitToAe"
        />
        <FinalStage
          v-else-if="view === 'final'"
          :order="cust"
          :active="active"
          :step="viewStepDef"
          :focus="viewFocus"
          @ack="ackCustomer"
        />
        <AeStage
          v-else-if="view === 'ae'"
          :order="cust"
          :active="active"
          :step="viewStepDef"
          @back="returnToSales"
          @confirm="say('报表已确认：3 处客户询问已回填，三方确认单已生成')"
          @send="sendToRd"
        />
        <RdMatch
          v-else-if="view === 'rd' && viewStep === 'S3'"
          :order="cust"
          :active="active"
          :step="viewStepDef"
          @fill="fillStep({ code: 'S3' })"
        />
        <RdCapacity
          v-else-if="view === 'rd'"
          :order="cust"
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

/* 侧边栏 */
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

/* 三级分组行 */
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
.grp__head:active {
  background: var(--accent-3);
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
.cust {
  min-width: 0;
}
.cust.is-on > .grp__head--cust {
  background: var(--paper-3);
}
.grp__head--cust .grp__name {
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

/* 四级步骤 */
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
.item__fill {
  display: grid;
  place-items: center;
  width: 17px;
  height: 17px;
  flex: none;
  border-radius: var(--r-xs);
  background: var(--accent);
  color: #fff;
}
.item__fill:hover {
  filter: brightness(1.06);
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

/* 主视图 */
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

/* 需求版本行 */
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

/* 步骤条：包一层放一键填写 */
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
</style>
