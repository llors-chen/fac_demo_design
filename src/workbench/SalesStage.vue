<script setup>
/**
 * S1 · 需求接收与建档
 *
 * 左侧（2）：链接邮件系统 → 拉取 / 选中正式邮件 → 提取邮件正文与附件要点
 * 右侧（1）：填入初步结论（产品族 / 基型 / 结论 / 待确认）→ 生成模拟需求报表
 * 两栏等高，内部各自滚动。
 */
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { s1Conclusion, s1Extract, s1Mail, s1ReportRows } from './data.js'

const props = defineProps({
  order: { type: Object, required: true },
  active: { type: Boolean, default: true },
  step: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['submit'])

const nowTime = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
const nowStamp = () => {
  const d = new Date()
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${nowTime()}`
}

/* ---------------- 邮件系统 ---------------- */
const connected = ref(false)
const mails = ref(s1Mail.mails.map((m) => ({ ...m, parsed: false })))
const currentId = ref(s1Mail.mails[0].id)
const logs = ref([])
const current = computed(() => mails.value.find((m) => m.id === currentId.value) || mails.value[0])
const parsedCount = computed(() => mails.value.filter((m) => m.parsed).length)
const attachCount = computed(() => mails.value.reduce((s, m) => s + m.attachments.length, 0))

const extracted = ref([])

function log(text) {
  logs.value = [{ time: nowTime(), text }, ...logs.value].slice(0, 5)
}

function connect() {
  connected.value = true
  log('已连接邮件系统 ' + s1Mail.server + '（' + s1Mail.account + '）')
}

function pull() {
  if (!connected.value) return
  const next = mails.value.length + 1
  mails.value.push({
    id: 'M' + next,
    from: '王工 <wang.gang@offroad-robot.com>',
    to: s1Mail.account,
    time: nowStamp(),
    subject: '补充：样件排期与包装要求',
    body: [
      '陈工，',
      '',
      '1）样件请按 8 周排期，如有变化请提前告知；',
      '2）包装按 10 件一箱，箱外标注图号与批次。',
      '',
      '王工',
    ].join('\n'),
    attachments: [],
    parsed: false,
  })
  currentId.value = 'M' + next
  log('已拉取最新邮件 1 封（共 ' + mails.value.length + ' 封）')
}

function parseMail() {
  if (!connected.value) return
  const m = current.value
  m.parsed = true
  const picked = s1Extract.filter((e) => e.source.includes(m.id))
  const merged = [...extracted.value]
  picked.forEach((p) => {
    if (!merged.some((x) => x.key === p.key)) merged.push(p)
  })
  extracted.value = merged
  log('已提取《' + m.subject + '》正文，得到 ' + picked.length + ' 个字段')
}

/* ---------------- 邮件附件 ---------------- */
const fileInput = ref(null)
const dragging = ref(false)

const fmtSize = (bytes) => {
  if (!bytes && bytes !== 0) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB'
  return (Math.round((bytes / 1024 / 1024) * 10) / 10).toFixed(1) + ' MB'
}

function addFiles(list) {
  const files = Array.from(list || [])
  if (!files.length) return
  files.forEach((f) => {
    current.value.attachments.push({
      name: f.name,
      size: fmtSize(f.size),
      uploaded: true,
    })
  })
  log('已上传 ' + files.length + ' 个附件到《' + current.value.subject + '》')
}

function pickFile() {
  fileInput.value?.click()
}

function onFile(e) {
  addFiles(e.target.files)
  e.target.value = ''
}

function onDrop(e) {
  dragging.value = false
  addFiles(e.dataTransfer?.files)
}

function removeAtt(index) {
  const a = current.value.attachments[index]
  current.value.attachments.splice(index, 1)
  log('已删除附件 ' + a.name)
}

/* ---------------- 初步结论 ---------------- */
const concl = ref({ ...s1Conclusion })
const conclReady = computed(() => !!(concl.value.family && concl.value.verdict))

function genConclusion() {
  concl.value = { ...s1Conclusion }
  log('AI 已根据邮件内容生成初步结论（可手工修改）')
}

/* ---------------- 模拟需求报表 ---------------- */
const report = ref(null)

function genReport() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const pick = (k) => extracted.value.find((e) => e.key === k)?.value
  const map = {
    customer: pick('customer'),
    scene: pick('scene'),
    params: pick('params'),
    control: pick('control'),
    env: pick('env'),
    cert: 'CE（UL 暂不要求）',
    biz: pick('biz'),
    verdict: concl.value.verdict,
  }
  report.value = {
    no: `REQ-${ymd}-001`,
    at: nowStamp(),
    rows: s1ReportRows.map((r) => ({ ...r, value: map[r.from] || '—' })),
  }
  log('已生成模拟需求报表 ' + report.value.no)
}

const submit = () => emit('submit')
</script>

<template>
  <div class="s1">
    <!-- 左 2：邮件系统 -->
    <section class="pane pane--mail">
      <header class="pane__head">
        <AppIcon name="mail" :size="15" />
        <h3 class="pane__title">邮件系统 · 提取邮件内容</h3>
        <span class="pane__state mono" :class="{ 'is-on': connected }">
          {{ connected ? s1Mail.server : '未连接' }}
        </span>
        <button class="btn btn--sm" type="button" :disabled="connected" @click="connect">
          <AppIcon name="external" :size="13" />
          {{ connected ? '已连接' : '链接邮件系统' }}
        </button>
      </header>

      <p class="pane__note mono">{{ s1Mail.note }}</p>

      <div class="mail__bar">
        <button class="btn btn--sm" type="button" :disabled="!connected" @click="pull">
          <AppIcon name="refresh" :size="13" />
          拉取最新邮件
        </button>
        <button class="btn btn--sm btn--solid" type="button" :disabled="!connected" @click="parseMail">
          <AppIcon name="download" :size="13" />
          提取邮件内容
        </button>
        <span class="mail__stat mono">
          {{ mails.length }} 封 · 已提取 {{ parsedCount }} · 附件 {{ attachCount }} 个
        </span>
      </div>

      <div class="mail__body">
        <ul class="mlist">
          <li
            v-for="m in mails"
            :key="m.id"
            class="mrow"
            :class="{ 'is-on': m.id === currentId }"
            @click="currentId = m.id"
          >
            <span class="mrow__top">
              <span class="mrow__from">{{ m.from.split(' <')[0] }}</span>
              <span class="mrow__time mono">{{ m.time }}</span>
            </span>
            <span class="mrow__subject">{{ m.subject }}</span>
            <span class="mrow__foot">
              <span class="mrow__flag mono" :class="{ 'is-ok': m.parsed }">
                {{ m.parsed ? '已提取' : '未提取' }}
              </span>
              <span v-if="m.attachments.length" class="mrow__att mono">
                附件 {{ m.attachments.length }}
              </span>
            </span>
          </li>
        </ul>

        <div class="mdetail">
          <header class="mdetail__head">
            <span class="mdetail__subject">{{ current.subject }}</span>
            <span class="mdetail__meta mono">
              {{ current.from }} → {{ current.to }} · {{ current.time }}
            </span>
          </header>
          <pre class="mdetail__body">{{ current.body }}</pre>
          <div v-if="current.attachments.length" class="mdetail__atts">
            <span class="mono">附件</span>
            <span v-for="a in current.attachments" :key="a.name" class="att">
              <AppIcon name="file" :size="12" />
              {{ a.name }} · {{ a.size }}
            </span>
          </div>
        </div>
      </div>

      <!-- 邮件附件区 -->
      <div
        class="attachbox"
        :class="{ 'is-drag': dragging }"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <header class="attachbox__head">
          <AppIcon name="layers" :size="14" />
          <span class="attachbox__label mono">邮件附件（{{ current.attachments.length }}）</span>
          <span class="attachbox__hint mono">点击上传或拖拽文件到此区域</span>
          <button class="btn btn--sm" type="button" :disabled="!active" @click="pickFile">
            <AppIcon name="plus" :size="13" />
            上传附件
          </button>
          <input
            ref="fileInput"
            class="attachbox__file"
            type="file"
            multiple
            @change="onFile"
          />
        </header>

        <ul v-if="current.attachments.length" class="alist">
          <li v-for="(a, i) in current.attachments" :key="a.name + i" class="aitem">
            <AppIcon name="file" :size="14" class="aitem__icon" />
            <span class="aitem__name" :title="a.name">{{ a.name }}</span>
            <span class="aitem__size mono">{{ a.size }}</span>
            <span v-if="a.uploaded" class="aitem__tag mono">新上传</span>
            <button
              class="aitem__del"
              type="button"
              :disabled="!active"
              :title="'删除附件 ' + a.name"
              @click="removeAtt(i)"
            >
              <AppIcon name="close" :size="12" />
            </button>
          </li>
        </ul>
        <p v-else class="attachbox__empty mono">
          该邮件暂无附件 · 可点「上传附件」或把文件拖到这里
        </p>
      </div>

      <div class="extract">
        <span class="extract__label mono">
          提取结果（{{ extracted.length }} / {{ s1Extract.length }}）
        </span>
        <ul v-if="extracted.length" class="extract__list">
          <li v-for="e in extracted" :key="e.key" class="erow">
            <span class="erow__label mono">{{ e.label }}</span>
            <span class="erow__value">{{ e.value }}</span>
            <span class="erow__src mono">{{ e.source }}</span>
          </li>
        </ul>
        <p v-else class="extract__empty mono">
          尚未提取：先在左侧选中一封邮件，再点「提取邮件内容」
        </p>
      </div>

      <div v-if="logs.length" class="mlog">
        <span class="mlog__label mono">操作记录</span>
        <ul class="mlog__list">
          <li v-for="(l, i) in logs" :key="i">
            <span class="mono">{{ l.time }}</span>
            {{ l.text }}
          </li>
        </ul>
      </div>
    </section>

    <!-- 右 1：初步结论 + 模拟需求报表 -->
    <aside class="pane pane--concl">
      <header class="pane__head">
        <AppIcon name="sparkle" :size="15" />
        <h3 class="pane__title">初步结论与需求报表</h3>
      </header>

      <div class="cform">
        <label class="cf">
          <span class="cf__label mono">产品族判断</span>
          <input v-model="concl.family" class="cf__input" :disabled="!active" />
        </label>
        <label class="cf">
          <span class="cf__label mono">推荐基型</span>
          <input v-model="concl.model" class="cf__input" :disabled="!active" />
        </label>
        <label class="cf">
          <span class="cf__label mono">初步结论</span>
          <textarea v-model="concl.verdict" class="cf__area" rows="4" :disabled="!active"></textarea>
        </label>
        <label class="cf">
          <span class="cf__label mono">待客户确认</span>
          <textarea v-model="concl.open" class="cf__area" rows="3" :disabled="!active"></textarea>
        </label>
        <button class="btn btn--sm" type="button" :disabled="!active" @click="genConclusion">
          <AppIcon name="sparkle" :size="13" />
          按邮件内容生成结论
        </button>
      </div>

      <div class="rbox">
        <header class="rbox__head">
          <span class="rbox__title">模拟需求报表</span>
          <span class="rbox__no mono">{{ report ? report.no : '未生成' }}</span>
        </header>
        <button
          class="btn btn--sm btn--solid rbox__btn"
          type="button"
          :disabled="!active || !extracted.length || !conclReady"
          @click="genReport"
        >
          <AppIcon name="newspaper" :size="13" />
          {{ report ? '重新生成报表' : '生成模拟需求报表' }}
        </button>
        <p v-if="!extracted.length" class="rbox__hint mono">需先提取邮件内容</p>
        <p v-else-if="!conclReady" class="rbox__hint mono">需先填写产品族与初步结论</p>

        <table v-if="report" class="rtable">
          <tbody>
            <tr v-for="r in report.rows" :key="r.no">
              <td class="mono rtable__no">{{ r.no }}</td>
              <td class="rtable__label">{{ r.label }}</td>
              <td class="rtable__value">{{ r.value }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="report" class="rbox__foot mono">生成于 {{ report.at }} · 可随工单流转到 S2</p>
      </div>

      <footer class="acts">
        <button
          class="btn btn--sm btn--solid acts__main"
          type="button"
          :disabled="!active || !report"
          @click="submit"
        >
          <AppIcon name="send" :size="13" />
          提交 AE（进入 S2）
        </button>
      </footer>
      <p v-if="!active" class="lock mono">当前不在 S1 步骤，仅供查看</p>
    </aside>
  </div>
</template>

<style scoped>
.s1 {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
  margin-top: 12px;
  align-items: stretch;
}
.pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 560px;
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
.pane__state {
  margin-left: auto;
  font-size: 0.56rem;
  padding: 2px 8px;
  border-radius: var(--r-pill);
  border: 1px solid var(--rule-2);
  color: var(--ink-4);
}
.pane__state.is-on {
  border-color: var(--ok);
  background: var(--ok-soft);
  color: var(--ok);
}
.pane__note {
  margin: 0 0 9px;
  font-size: 0.56rem;
  line-height: 1.6;
  color: var(--ink-4);
}
.lock {
  margin-top: 8px;
  font-size: 0.6rem;
  color: var(--warn);
}
.mail__bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding-bottom: 9px;
}
.mail__stat {
  margin-left: auto;
  font-size: 0.56rem;
  color: var(--ink-4);
}
.mail__body {
  display: grid;
  grid-template-columns: minmax(200px, 0.8fr) minmax(0, 1.4fr);
  gap: 10px;
  min-height: 0;
  flex: 1 1 auto;
}
.mlist {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 4px;
  align-content: start;
  max-height: 300px;
  overflow-y: auto;
}
.mrow {
  display: grid;
  gap: 2px;
  padding: 7px 9px;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm);
  background: var(--paper);
  cursor: pointer;
  transition: border-color 0.16s ease, background 0.16s ease;
}
.mrow:hover {
  border-color: var(--accent);
}
.mrow.is-on {
  border-color: var(--accent);
  background: var(--accent-3);
}
.mrow__top {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.mrow__from {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--ink);
}
.mrow__time {
  margin-left: auto;
  font-size: 0.52rem;
  color: var(--ink-4);
}
.mrow__subject {
  font-size: 0.72rem;
  color: var(--ink-3);
  line-height: 1.45;
}
.mrow__foot {
  display: flex;
  gap: 6px;
  align-items: center;
}
.mrow__flag {
  font-size: 0.5rem;
  padding: 1px 6px;
  border-radius: var(--r-pill);
  border: 1px solid var(--rule-2);
  color: var(--ink-4);
}
.mrow__flag.is-ok {
  border-color: var(--ok);
  background: var(--ok-soft);
  color: var(--ok);
}
.mrow__att {
  font-size: 0.5rem;
  color: var(--info);
}
.mdetail {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm);
  background: var(--paper);
  overflow: hidden;
}
.mdetail__head {
  display: grid;
  gap: 2px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--rule);
  background: var(--paper-3);
}
.mdetail__subject {
  font-size: 0.82rem;
  font-weight: 700;
}
.mdetail__meta {
  font-size: 0.52rem;
  color: var(--ink-4);
}
.mdetail__body {
  flex: 1 1 auto;
  min-height: 180px;
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
  padding: 10px 12px;
  font-family: var(--serif);
  font-size: 0.78rem;
  line-height: 1.85;
  color: var(--ink-2);
  white-space: pre-wrap;
}
.mdetail__atts {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 7px 10px;
  border-top: 1px dashed var(--rule);
  font-size: 0.56rem;
  color: var(--ink-4);
}
.att {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.66rem;
  color: var(--ink-2);
}
.attachbox {
  margin-top: 10px;
  padding: 9px 10px 10px;
  border: 1px dashed var(--rule-2);
  border-radius: var(--r-sm);
  background: var(--paper);
  transition: border-color 0.16s ease, background 0.16s ease;
}
.attachbox.is-drag {
  border-color: var(--accent);
  border-style: solid;
  background: var(--accent-3);
}
.attachbox__head {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
  color: var(--ink-3);
}
.attachbox__label {
  font-size: 0.56rem;
  color: var(--ink-2);
}
.attachbox__hint {
  font-size: 0.5rem;
  color: var(--ink-4);
}
.attachbox__head .btn {
  margin-left: auto;
}
.attachbox__file {
  display: none;
}
.alist {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 4px;
}
.aitem {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr) auto auto 22px;
  gap: 8px;
  align-items: center;
  padding: 5px 7px;
  border: 1px solid var(--rule);
  border-radius: var(--r-xs);
  background: var(--surface);
  font-size: 0.74rem;
}
.aitem__icon {
  color: var(--info);
}
.aitem__name {
  min-width: 0;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.aitem__size {
  font-size: 0.54rem;
  color: var(--ink-4);
}
.aitem__tag {
  font-size: 0.48rem;
  padding: 1px 6px;
  border-radius: var(--r-pill);
  border: 1px solid var(--accent-2);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.aitem__del {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: var(--r-xs);
  color: var(--ink-4);
  transition: all 0.16s ease;
}
.aitem__del:hover {
  background: var(--danger-soft);
  color: var(--danger);
}
.attachbox__empty {
  margin: 7px 0 0;
  font-size: 0.56rem;
  color: var(--ink-4);
}
.extract {
  margin-top: 10px;
  padding-top: 9px;
  border-top: 1px dashed var(--rule);
}
.extract__label {
  font-size: 0.56rem;
  color: var(--ink-4);
}
.extract__list {
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 4px;
  max-height: 190px;
  overflow-y: auto;
}
.erow {
  display: grid;
  grid-template-columns: 8.6em minmax(0, 1fr) auto;
  gap: 8px;
  align-items: baseline;
  padding: 4px 0;
  border-bottom: 1px dotted var(--rule);
}
.erow__label {
  font-size: 0.54rem;
  color: var(--ink-4);
}
.erow__value {
  font-size: 0.74rem;
  line-height: 1.6;
  color: var(--ink-2);
}
.erow__src {
  font-size: 0.5rem;
  color: var(--accent-ink);
}
.extract__empty {
  margin: 6px 0 0;
  font-size: 0.58rem;
  color: var(--ink-4);
}
.mlog {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--rule);
}
.mlog__label {
  font-size: 0.54rem;
  color: var(--ink-4);
}
.mlog__list {
  margin: 5px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 3px;
  font-size: 0.68rem;
  color: var(--ink-3);
}
.mlog__list span {
  color: var(--ink-4);
  margin-right: 6px;
}
.cform {
  display: grid;
  gap: 8px;
}
.cf {
  display: grid;
  gap: 4px;
}
.cf__label {
  font-size: 0.56rem;
  color: var(--ink-4);
}
.cf__input,
.cf__area {
  width: 100%;
  padding: 7px 9px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-xs);
  background: var(--paper);
  font-family: inherit;
  font-size: 0.76rem;
  line-height: 1.6;
  color: var(--ink);
  outline: none;
  resize: vertical;
}
.cf__input:focus,
.cf__area:focus {
  border-color: var(--accent);
  background: var(--surface);
  box-shadow: 0 0 0 3px var(--accent-3);
}
.rbox {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--rule);
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.rbox__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rbox__title {
  font-size: 0.84rem;
  font-weight: 700;
}
.rbox__no {
  margin-left: auto;
  font-size: 0.54rem;
  color: var(--accent-ink);
}
.rbox__btn {
  margin-top: 8px;
  justify-content: center;
}
.rbox__hint {
  margin: 6px 0 0;
  font-size: 0.56rem;
  color: var(--warn);
}
.rtable {
  width: 100%;
  border-collapse: collapse;
  margin-top: 9px;
  font-size: 0.72rem;
}
.rtable td {
  padding: 5px 0;
  border-bottom: 1px dotted var(--rule);
  vertical-align: top;
}
.rtable__no {
  width: 2.4em;
  font-size: 0.52rem;
  color: var(--accent-ink);
}
.rtable__label {
  width: 9.4em;
  font-size: 0.66rem;
  color: var(--ink-3);
}
.rtable__value {
  font-size: 0.72rem;
  line-height: 1.6;
  color: var(--ink-2);
}
.rbox__foot {
  margin: 7px 0 0;
  font-size: 0.54rem;
  color: var(--ink-4);
}
.acts {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--rule);
}
.acts__main {
  width: 100%;
  justify-content: center;
}
@media (max-width: 1180px) {
  .s1 {
    grid-template-columns: 1fr;
  }
  .pane {
    min-height: 0;
  }
  .mail__body {
    grid-template-columns: 1fr;
  }
}
</style>
