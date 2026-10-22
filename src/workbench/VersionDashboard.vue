<script setup>
/**
 * 需求版本管理 Dashboard
 *
 * 客户每次变更需求 = 新建一个需求版本（R0x），该版本需要重新走一遍完整流程（S1 → S5）。
 * 本页用于查看所有版本、对比走到哪一步、回溯到任意版本。
 */
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { flowSteps, stages, stepIndex } from './data.js'
import { activateVersion, createVersion, eventMeta, saveCustomers } from './store.js'

const props = defineProps({
  order: { type: Object, required: true }, // 当前工单
  customers: { type: Array, required: true }, // 顶层客户列表（用于持久化）
})
const emit = defineEmits(['goto', 'say'])

const versions = computed(() => [...(props.order.versions || [])].reverse())
const active = computed(() => props.order.versions?.find((v) => v.id === props.order.activeVersion))

const stageIdx = (key) => stages.findIndex((s) => s.key === key)
const vProgress = (v) => Math.round(((stepIndex(v.step || 'S1') + 1) / flowSteps.length) * 100)
const stepName = (code) => flowSteps.find((s) => s.code === code)?.name || ''
const stepOwner = (code) => flowSteps.find((s) => s.code === code)?.owner || ''
const vState = (v) => (v.id === props.order.activeVersion ? 'current' : v.stage === 'final' ? 'done' : 'history')
const stateLabel = { current: '当前版本', done: '已完成', history: '历史版本' }

const kpi = computed(() => {
  const list = props.order.versions || []
  return [
    { label: '需求版本', value: String(list.length), sub: '客户每次变更都会新建' },
    { label: '当前版本', value: active.value?.label || '—', sub: active.value?.note || '' },
    {
      label: '已完成流程',
      value: String(list.filter((v) => (v.step || 'S1') === 'S5').length),
      sub: '走完 S1–S5 并回执',
    },
    {
      label: '留痕条数',
      value: String(list.reduce((s, v) => s + (v.events?.length || 0), 0)),
      sub: '每个版本各自留痕',
    },
  ]
})

/* 新建版本 */
const showNew = ref(false)
const newNote = ref('')
const newSummary = ref('')

function doCreate() {
  const v = createVersion(props.order, newNote.value.trim(), newSummary.value.trim())
  saveCustomers(props.customers)
  showNew.value = false
  newNote.value = ''
  newSummary.value = ''
  emit('say', '已新建需求版本 ' + v.label + '：流程从 S1 重新开始')
  emit('goto', 'sales')
}

/* 回溯版本 */
function rollback(v) {
  if (v.id === props.order.activeVersion) return
  activateVersion(props.order, v.id)
  saveCustomers(props.customers)
  emit('say', '已回溯到需求版本 ' + v.label + '（' + (v.note || '') + '）')
  emit('goto', v.stage)
}
</script>

<template>
  <div class="vd">
    <!-- KPI -->
    <div class="kpis">
      <div v-for="k in kpi" :key="k.label" class="kpi">
        <span class="kpi__label mono">{{ k.label }}</span>
        <span class="kpi__value">{{ k.value }}</span>
        <span class="kpi__sub mono">{{ k.sub }}</span>
      </div>
      <button class="newbtn" type="button" @click="showNew = !showNew">
        <AppIcon name="plus" :size="14" />
        客户变更需求 · 新建版本
      </button>
    </div>

    <!-- 新建版本表单 -->
    <div v-if="showNew" class="newbox">
      <div class="newbox__row">
        <label class="newbox__field">
          <span class="mono">变更说明</span>
          <input v-model="newNote" class="newbox__input" placeholder="例：客户变更需求（电池改 48 V）" />
        </label>
        <label class="newbox__field">
          <span class="mono">需求摘要</span>
          <input v-model="newSummary" class="newbox__input" placeholder="例：48 V · 3,500 N · 行程 50 · CANopen" />
        </label>
      </div>
      <div class="newbox__acts">
        <p class="newbox__note mono">
          新建后会：① 把当前版本状态存档；② 生成新版本 R0x；③ 流程从 S1 需求接收与建档重新走一遍。
        </p>
        <button class="btn btn--sm" type="button" @click="showNew = false">取消</button>
        <button class="btn btn--sm btn--solid" type="button" @click="doCreate">
          <AppIcon name="check" :size="13" />
          创建并切换
        </button>
      </div>
    </div>

    <!-- 版本表 -->
    <div class="card">
      <header class="card__head">
        <h3 class="card__title">需求版本（{{ versions.length }}）</h3>
        <span class="card__sub mono">{{ order.customer }} · {{ order.id }}</span>
      </header>
      <table class="vtable">
        <thead>
          <tr>
            <th>版本</th>
            <th>需求摘要</th>
            <th>变更说明</th>
            <th>创建 / 更新</th>
            <th>当前走到</th>
            <th>进度</th>
            <th>留痕</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in versions" :key="v.id" :class="'is-' + vState(v)">
            <td>
              <span class="vlabel mono">{{ v.label }}</span>
            </td>
            <td class="vsummary">{{ v.summary }}</td>
            <td class="vnote">{{ v.note }}</td>
            <td class="mono">{{ v.createdAt }}<br />{{ v.updatedAt }}</td>
            <td>
              <span class="vstage mono">{{ v.step || 'S1' }}</span>
              <span class="vstagename">{{ stepName(v.step || 'S1') }}</span>
            </td>
            <td>
              <span class="vbar"><i :style="{ width: vProgress(v) + '%' }"></i></span>
              <span class="vpct mono">{{ vProgress(v) }}%</span>
            </td>
            <td class="mono">{{ v.events?.length || 0 }} 条</td>
            <td>
              <span class="vstate mono" :class="'is-' + vState(v)">{{ stateLabel[vState(v)] }}</span>
            </td>
            <td class="vops">
              <button class="btn btn--sm" type="button" @click="emit('goto', v.stage)">
                查看流程
              </button>
              <button
                class="btn btn--sm"
                type="button"
                :disabled="v.id === order.activeVersion"
                @click="rollback(v)"
              >
                <AppIcon name="refresh" :size="12" />
                回溯
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 版本时间线 -->
    <div class="card">
      <header class="card__head">
        <h3 class="card__title">版本时间线</h3>
        <span class="card__sub mono">每个版本的流程留痕（倒序）</span>
      </header>
      <ol class="timeline">
        <li v-for="v in versions" :key="v.id" class="tl" :class="'is-' + vState(v)">
          <span class="tl__dot"></span>
          <div class="tl__body">
            <div class="tl__top">
              <span class="tl__label mono">{{ v.label }}</span>
              <span class="tl__state mono">{{ stateLabel[vState(v)] }}</span>
              <span class="tl__time mono">{{ v.createdAt }} → {{ v.updatedAt }}</span>
              <span class="tl__stage mono">{{ v.step || 'S1' }} {{ stepName(v.step || 'S1') }}</span>
            </div>
            <p class="tl__summary">{{ v.summary }}</p>
            <p class="tl__note">{{ v.note }}</p>
            <ul class="tl__events">
              <li v-for="(e, i) in v.events || []" :key="i">
                <span class="mono">{{ e.time }}</span>
                <span class="mono tl__step">{{ e.step || '' }}</span>
                <b>{{ e.action }}</b>
                <span class="tl__actor mono">{{ e.actor }}</span>
                <span class="tl__type mono">{{ eventMeta[e.type]?.label || e.type }}</span>
              </li>
            </ul>

            <ul class="tl__records">
              <li v-for="r in v.records || []" :key="r.step">
                <span class="mono">{{ r.step }}</span>
                <span class="tl__rname">{{ stepName(r.step) }}</span>
                <span class="tl__rout">{{ r.output }}</span>
                <span class="tl__rstate mono" :class="'is-' + r.status">
                  {{ { done: '已完成', doing: '进行中', back: '已打回', todo: '待处理' }[r.status] }}
                </span>
              </li>
            </ul>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.vd {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}
.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
  gap: 8px;
  align-items: stretch;
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
  font-size: 1.35rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.kpi__sub {
  font-size: 0.54rem;
  color: var(--ink-4);
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

.newbox {
  border: 1px solid var(--accent);
  border-radius: var(--r-md);
  background: var(--accent-3);
  padding: 11px 12px 12px;
  display: grid;
  gap: 9px;
}
.newbox__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 10px;
}
.newbox__field {
  display: grid;
  gap: 4px;
  font-size: 0.56rem;
  color: var(--accent-ink);
}
.newbox__input {
  padding: 7px 9px;
  border: 1px solid var(--accent-2);
  border-radius: var(--r-xs);
  background: var(--surface);
  font-family: inherit;
  font-size: 0.8rem;
  color: var(--ink);
  outline: none;
}
.newbox__input:focus {
  border-color: var(--accent);
}
.newbox__acts {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.newbox__note {
  flex: 1;
  min-width: 220px;
  margin: 0;
  font-size: 0.56rem;
  line-height: 1.6;
  color: var(--accent-ink);
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

/* 版本表 */
.vtable {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.74rem;
}
.vtable th {
  text-align: left;
  font-weight: 400;
  font-size: 0.54rem;
  color: var(--ink-4);
  padding: 7px 10px;
  border-bottom: 1px solid var(--rule-2);
  background: var(--paper-3);
}
.vtable td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--rule);
  vertical-align: middle;
}
.vtable tr.is-current {
  background: var(--accent-3);
}
.vlabel {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--r-xs);
  background: var(--ink);
  color: var(--paper);
}
.vsummary {
  font-weight: 700;
  color: var(--ink);
}
.vnote {
  color: var(--ink-3);
  font-size: 0.7rem;
}
.vstage {
  font-size: 0.6rem;
  font-weight: 700;
  color: var(--accent-ink);
  margin-right: 5px;
}
.vstagename {
  font-size: 0.72rem;
  color: var(--ink-2);
}
.vbar {
  display: block;
  width: 72px;
  height: 5px;
  border-radius: var(--r-pill);
  background: var(--paper-3);
  overflow: hidden;
}
.vbar i {
  display: block;
  height: 100%;
  background: var(--accent);
}
.vpct {
  font-size: 0.52rem;
  color: var(--ink-4);
}
.vstate {
  font-size: 0.54rem;
  padding: 1px 7px;
  border-radius: var(--r-pill);
  border: 1px solid var(--rule-2);
  color: var(--ink-4);
  white-space: nowrap;
}
.vstate.is-current {
  border-color: var(--accent);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.vstate.is-done {
  border-color: var(--ok);
  background: var(--ok-soft);
  color: var(--ok);
}
.vops {
  display: flex;
  gap: 5px;
}

/* 时间线 */
.timeline {
  margin: 0;
  padding: 12px 14px;
  list-style: none;
}
.tl {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  gap: 10px;
  padding-bottom: 14px;
  position: relative;
}
.tl::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 14px;
  bottom: 0;
  width: 1px;
  background: var(--rule-2);
}
.tl:last-child {
  padding-bottom: 0;
}
.tl:last-child::before {
  display: none;
}
.tl__dot {
  width: 9px;
  height: 9px;
  margin-top: 5px;
  border-radius: 50%;
  background: var(--ink-4);
  box-shadow: 0 0 0 3px var(--surface);
}
.tl.is-current .tl__dot {
  background: var(--accent);
}
.tl.is-done .tl__dot {
  background: var(--ok);
}
.tl__body {
  display: grid;
  gap: 3px;
  min-width: 0;
}
.tl__top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.tl__label {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: var(--r-xs);
  background: var(--paper-3);
  color: var(--ink-2);
}
.tl.is-current .tl__label {
  background: var(--accent);
  color: #fff;
}
.tl__state,
.tl__time,
.tl__stage {
  font-size: 0.54rem;
  color: var(--ink-4);
}
.tl__summary {
  margin: 0;
  font-size: 0.84rem;
  font-weight: 700;
}
.tl__note {
  margin: 0;
  font-size: 0.74rem;
  color: var(--ink-3);
}
.tl__events {
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 4px;
}
.tl__events li {
  display: flex;
  align-items: baseline;
  gap: 7px;
  flex-wrap: wrap;
  font-size: 0.7rem;
  color: var(--ink-3);
}
.tl__events b {
  font-size: 0.76rem;
  color: var(--ink-2);
}
.tl__step {
  font-size: 0.5rem;
  padding: 0 5px;
  border-radius: var(--r-xs);
  background: var(--paper-3);
  color: var(--accent-ink);
}
.tl__actor,
.tl__type {
  font-size: 0.52rem;
  color: var(--ink-4);
}
.tl__records {
  margin: 6px 0 0;
  padding: 7px 0 0;
  list-style: none;
  display: grid;
  gap: 4px;
  border-top: 1px dashed var(--rule);
}
.tl__records li {
  display: grid;
  grid-template-columns: 3.4em minmax(0, 1fr) auto auto;
  gap: 8px;
  align-items: center;
  font-size: 0.68rem;
  color: var(--ink-3);
}
.tl__rname {
  color: var(--ink-2);
}
.tl__rout {
  font-size: 0.66rem;
  color: var(--ink-4);
}
.tl__rstate {
  font-size: 0.5rem;
  padding: 1px 6px;
  border-radius: var(--r-pill);
  border: 1px solid var(--rule-2);
  color: var(--ink-4);
  white-space: nowrap;
}
.tl__rstate.is-done {
  border-color: var(--ok);
  background: var(--ok-soft);
  color: var(--ok);
}
.tl__rstate.is-doing {
  border-color: var(--accent);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.tl__rstate.is-back {
  border-color: var(--danger);
  background: var(--danger-soft);
  color: var(--danger);
}

@media (max-width: 1180px) {
  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .newbtn {
    grid-column: 1 / -1;
    padding: 10px;
  }
}
@media (max-width: 760px) {
  .vtable {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
}
</style>
