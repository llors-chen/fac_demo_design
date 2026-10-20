<script setup>
/**
 * BOM 面板 · 上载至 M3（共用组件）
 *
 * 两处复用：
 *   1) DWG 在线浏览右侧（variant="card"，action="提取"）：从图面标题栏 / 明细栏提取 BOM
 *   2) 第 04 区工具视图「上载至M3」页签（variant="plain"，action="生成"）：按组装台生成 BOM
 *
 * 仅界面演示：生成 / 提取 / 导出 / 上载 均为前端状态切换，不产生真实数据。
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  variant: { type: String, default: 'plain' }, // plain（嵌在页签里）| card（独立卡片）
  title: { type: String, default: '上载至 M3' },
  subtitle: { type: String, default: 'BOM / 物料主数据' },
  lead: { type: String, default: '' },
  hint: { type: String, default: '' },
  action: { type: String, default: '生成' }, // 生成 | 提取
  rows: { type: Array, default: () => [] },
  docSuffix: { type: String, default: '014' },
  targets: {
    type: Array,
    default: () => [
      { label: '目标系统', value: 'M3 · 平湖工厂', icon: 'grid' },
      { label: 'BOM 库位', value: '物料主数据 / 2026', icon: 'layers' },
      { label: '版本策略', value: '按图号自动升版', icon: 'check', accent: true },
    ],
  },
})

const nowTime = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const summary = computed(() => ({
  items: props.rows.length,
  qty: props.rows.reduce((s, r) => s + (r.qty || 0), 0),
  weight: Math.round(props.rows.reduce((s, r) => s + (r.total || 0), 0) * 100) / 100,
}))

const state = ref('ready') // ready | working | uploading | uploaded
const stamp = ref(nowTime())
const docNo = ref('')
const notice = ref('')
let workTimer = null
let noticeTimer = null

const actionLabel = computed(() => (state.value === 'working' ? `${props.action}中…` : `${props.action} BOM`))
const uploadLabel = computed(() =>
  state.value === 'uploading' ? '正在上载…' : state.value === 'uploaded' ? '重新上载' : '上载至 M3',
)

function flashNotice(text, ms = 2600) {
  notice.value = text
  window.clearTimeout(noticeTimer)
  noticeTimer = window.setTimeout(() => (notice.value = ''), ms)
}

/** 生成 / 提取 BOM */
function work() {
  if (state.value === 'working') return
  state.value = 'working'
  window.clearTimeout(workTimer)
  workTimer = window.setTimeout(() => {
    state.value = 'ready'
    stamp.value = nowTime()
    docNo.value = ''
    flashNotice(`BOM 已${props.action}（演示）· 共 ${summary.value.items} 项`)
  }, 700)
}

function exportCsv() {
  flashNotice('BOM 已导出为 CSV（演示）')
}

function upload() {
  if (state.value === 'uploading') return
  state.value = 'uploading'
  window.clearTimeout(workTimer)
  workTimer = window.setTimeout(() => {
    const d = new Date()
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    docNo.value = `BOM-${ymd}-${props.docSuffix}`
    state.value = 'uploaded'
    flashNotice(`BOM 已上载至 M3 · 单据 ${docNo.value}（演示）`, 3200)
  }, 900)
}

onBeforeUnmount(() => {
  window.clearTimeout(workTimer)
  window.clearTimeout(noticeTimer)
})
</script>

<template>
  <div class="bom-panel" :class="`bom-panel--${variant}`">
    <!-- 卡片形态：自带抬头 -->
    <header v-if="variant === 'card'" class="bom-panel__head">
      <span class="bom-panel__badge mono">BOM</span>
      <div class="bom-panel__id">
        <h4 class="bom-panel__title">{{ title }}</h4>
        <p class="bom-panel__sub mono">{{ subtitle }}</p>
      </div>
      <span class="bom-panel__sum mono">
        {{ summary.items }} 项 · {{ summary.qty }} 件
      </span>
    </header>

    <div class="bom-panel__body scroll-thin">
      <p v-if="lead" class="bom-panel__lead">{{ lead }}</p>

      <!-- BOM 预览 -->
      <div class="bom-card">
        <div class="bom-card__head">
          <span class="mono">BOM 预览</span>
          <span class="bom-card__sum mono">
            {{ summary.items }} 项 · {{ summary.qty }} 件 · {{ summary.weight }} kg
          </span>
        </div>
        <ul class="bom">
          <li v-for="r in rows" :key="r.seq + r.code" class="bom__row">
            <span class="bom__seq mono">{{ r.seq }}</span>
            <span class="bom__main">
              <span class="bom__name">
                {{ r.name }}
                <em class="bom__spec mono">{{ r.spec }}</em>
              </span>
              <span class="bom__meta mono">{{ r.code }} · {{ r.material }}</span>
            </span>
            <span class="bom__qty mono">×{{ r.qty }}</span>
            <span class="bom__wt mono">{{ r.total }} kg</span>
          </li>
        </ul>
        <div class="bom-card__foot">
          <span class="mono">合计</span>
          <span class="mono">{{ summary.qty }} 件 · {{ summary.weight }} kg</span>
        </div>
      </div>

      <!-- 上载目标（外观） -->
      <div class="target">
        <span v-for="t in targets" :key="t.label" class="target__row">
          <span class="target__label mono">{{ t.label }}</span>
          <span class="target__value" :class="{ 'target__value--accent': t.accent }">
            <AppIcon :name="t.icon" :size="13" />
            {{ t.value }}
          </span>
        </span>
      </div>

      <!-- 动作 -->
      <div class="bom__actions">
        <button class="btn btn--sm" type="button" :disabled="state === 'working'" @click="work">
          <AppIcon name="refresh" :size="13" />
          {{ actionLabel }}
        </button>
        <button class="btn btn--sm" type="button" @click="exportCsv">
          <AppIcon name="download" :size="13" />
          导出 CSV
        </button>
        <button class="btn btn--sm btn--solid" type="button" :disabled="state === 'uploading'" @click="upload">
          <AppIcon name="send" :size="13" />
          {{ uploadLabel }}
        </button>
      </div>

      <!-- 状态 -->
      <p class="bom__status mono" :class="{ 'is-ok': state === 'uploaded' }">
        <AppIcon :name="state === 'uploaded' ? 'check' : 'info'" :size="13" />
        <span v-if="state === 'working'">正在{{ action }} BOM…</span>
        <span v-else-if="state === 'uploading'">正在上载至 M3…</span>
        <span v-else-if="state === 'uploaded'">已上载至 M3 · 单据 {{ docNo }}</span>
        <span v-else>已{{ action }} BOM · {{ stamp }}</span>
      </p>

      <p v-if="hint" class="bom-panel__hint">{{ hint }}</p>

      <transition name="fade">
        <p v-if="notice" class="bom-panel__notice">
          <AppIcon name="info" :size="14" />
          {{ notice }}
        </p>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.bom-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 卡片形态 */
.bom-panel--card {
  height: 100%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.5)),
    var(--paper-2);
  border: 1px solid var(--rule);
  border-radius: 0 var(--r-md) 0 var(--r-md);
  box-shadow: var(--shadow-m);
  overflow: hidden;
}
.bom-panel__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 3px double var(--rule-3);
}
.bom-panel__badge {
  padding: 2px 8px;
  border-radius: var(--r-pill);
  background: var(--ink);
  color: var(--paper);
  font-size: 0.5rem;
  flex: none;
}
.bom-panel__id {
  min-width: 0;
}
.bom-panel__title {
  font-size: 0.98rem;
  letter-spacing: 0.04em;
}
.bom-panel__sub {
  font-size: 0.52rem;
}
.bom-panel__sum {
  margin-left: auto;
  font-size: 0.54rem;
  color: var(--accent-ink);
  white-space: nowrap;
}
.bom-panel__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px;
}

.bom-panel__lead {
  font-size: 0.8rem;
  color: var(--ink-3);
  line-height: 1.7;
  margin-bottom: 10px;
}

/* BOM 表 */
.bom-card {
  border: 1px solid var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: var(--surface);
  overflow: hidden;
}
.bom-card__head,
.bom-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  background: var(--paper-2);
  font-size: 0.54rem;
}
.bom-card__head {
  border-bottom: 1px solid var(--rule);
}
.bom-card__foot {
  border-top: 1px solid var(--rule);
  color: var(--ink-2);
}
.bom-card__sum {
  color: var(--accent-ink);
}
.bom {
  margin: 0;
  padding: 0;
  list-style: none;
}
.bom__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-bottom: 1px dotted var(--rule);
  transition: background 0.2s ease;
}
.bom__row:last-child {
  border-bottom: none;
}
.bom__row:hover {
  background: var(--accent-3);
}
.bom__seq {
  font-size: 0.52rem;
  color: var(--accent-ink);
  min-width: 1.4em;
}
.bom__main {
  display: grid;
  gap: 1px;
  min-width: 0;
  flex: 1;
}
.bom__name {
  font-size: 0.8rem;
  color: var(--ink);
  display: flex;
  align-items: baseline;
  gap: 5px;
  flex-wrap: wrap;
}
.bom__spec {
  font-size: 0.5rem;
  color: var(--ink-3);
}
.bom__meta {
  font-size: 0.48rem;
}
.bom__qty {
  font-size: 0.58rem;
  color: var(--ink-3);
  white-space: nowrap;
}
.bom__wt {
  font-size: 0.56rem;
  color: var(--ink-2);
  white-space: nowrap;
  min-width: 3.6em;
  text-align: right;
}

/* 上载目标 */
.target {
  display: grid;
  gap: 5px;
  padding: 9px 11px;
  margin-top: 10px;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.4)),
    var(--paper-2);
}
.target__row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.target__label {
  font-size: 0.52rem;
  min-width: 4.6em;
}
.target__value {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  color: var(--ink-2);
}
.target__value--accent {
  color: var(--accent-ink);
}

/* 动作与状态 */
.bom__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.bom__status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 6px 10px;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: var(--paper-2);
  font-size: 0.54rem;
  color: var(--ink-3);
}
.bom__status.is-ok {
  border-color: var(--accent-2);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.bom-panel__hint {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--rule);
  font-size: 0.76rem;
  color: var(--ink-3);
  line-height: 1.7;
}
.bom-panel__notice {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 6px 10px;
  border: 1px solid var(--accent-2);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: var(--accent-3);
  color: var(--accent-ink);
  font-size: 0.76rem;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.24s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
