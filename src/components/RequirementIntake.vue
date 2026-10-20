<script setup>
/**
 * 第 01 区 · 销售端 · 客需需求整理
 *
 * 左侧：样例输入（可编辑的口语化客户记录）
 * 右侧：对话形式 —— 提交后助手「整理」为一份结构化书面需求单
 * 写死演示：无论输入什么，都按同一套字段输出；字段会尽量从文本里提取，提取不到用默认值。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import {
  attachmentPoints,
  attachments,
  intakeMeta,
  intakeSample,
  intakeSteps,
  intakeTemplate,
} from '../data/site.js'

/** 附件类型 → 线性图标 */
const iconOf = (kind) => ({ pdf: 'file', dwg: 'ruler', img: 'grid', doc: 'newspaper' })[kind] || 'file'

const attTotal = computed(() => {
  const sum = attachments.reduce((s, a) => s + (parseFloat(a.size) || 0), 0)
  return Math.round(sum * 10) / 10
})
const attParsed = computed(() => attachments.filter((a) => a.state.startsWith('已')).length)

const raw = ref(intakeSample)
const thinking = ref(false)
const stepsDone = ref(intakeSteps.length)
const lastRun = ref('09:26')
const runCount = ref(1)

let timer = null

const nowTime = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * 按模板分类整理：1 Project introduction / 2 Application information / 3 Specifications(3.1~3.5)
 * 能从口语文本里提取到的项用提取值，提取不到用模板默认值。
 */
const sections = computed(() => {
  const t = raw.value || ''
  const all = (re) => {
    const g = re.global ? re : new RegExp(re.source, re.flags + 'g')
    return [...t.matchAll(g)].map((m) => m[0].trim().replace(/\s+/g, ' '))
  }
  const first = (re, fallback) => all(re)[0] || fallback

  const kinds = ['法兰盘', '端盖', '轴承座', '轴套', '齿轮', '传动轴', '密封垫', '平键', '螺栓']
  const kind = kinds.find((k) => t.includes(k))
  const specs = [...new Set(all(/(?:DN|⌀|Φ|M)\s?\d+(?:\.\d+)?/gi).map((s) => s.replace(/\s/g, '')))]
  const qtys = all(/(?:样件|首批|批量|订单|先要)[^，。；;\n]{0,10}\d+\s*(?:件|套|台|个)/g)
  const dels = all(/\d+\s*(?:天|周|个月)/g)
  const conds = all(/(?:温度|℃|度上下|转速|转以内|脂润滑|油润滑|连续跑|连续工作)[^，。；;\n]{0,12}/g)
  const accept = all(/(?:材质证明|证明|国标|GB\/T\s?\d+|外观|毛刺|复检|探伤)[^，。；;\n]{0,10}/g)
  const customer = t.match(/【(.+?)】/)?.[1]
  const holes = t.match(/(\d+)\s*(?:个)?\s*孔[^，。；;\n]{0,8}/)

  const override = {
    customer: customer ? customer.replace(/·/g, ' · ').trim() : null,
    condition: conds.length ? conds.slice(0, 3).join('，') : null,
    qty: qtys.length ? qtys.join('；') : null,
    delivery: dels.length ? dels.join('；') : null,
    interface: specs.length
      ? `${kind ? kind + ' ' : ''}${specs.join(' / ')}${holes ? `；${holes[0]}` : ''}${specs.length < 2 ? '；对接面尺寸以客户图纸为准' : ''}`
      : null,
    tests: accept.length ? accept.slice(0, 3).join('，') : null,
    certification: first(/GB\/T\s?\d+[^\s，。；]*/, null),
  }

  return intakeTemplate.map((sec) => ({
    ...sec,
    items: sec.items.map((it) => ({
      ...it,
      value: (it.from && override[it.from]) || it.value,
      extracted: !!(it.from && override[it.from]),
    })),
  }))
})

const fieldCount = computed(() => sections.value.reduce((s, sec) => s + sec.items.length, 0))
const charCount = computed(() => raw.value.length)

function run() {
  if (thinking.value) return
  thinking.value = true
  stepsDone.value = 0
  window.clearTimeout(timer)
  intakeSteps.forEach((_, i) => {
    window.setTimeout(() => (stepsDone.value = i + 1), 180 * (i + 1))
  })
  timer = window.setTimeout(() => {
    thinking.value = false
    lastRun.value = nowTime()
    runCount.value += 1
  }, 1050)
}

function resetSample() {
  raw.value = intakeSample
}

onMounted(() => window.clearTimeout(timer))
onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <section id="req-intake" class="intake">
    <div class="wrap">
      <header class="sec-head">
        <span class="sec-head__no" aria-hidden="true">01</span>
        <div>
          <p class="kicker">销售端 · 客需需求整理</p>
          <h3 class="sec-head__title">把客户的口语记录，整理成一份书面需求</h3>
        </div>
        <dl class="sec-head__meta">
          <div><dt class="mono">来源</dt><dd>微信 / 电话记录</dd></div>
          <div><dt class="mono">整理时间</dt><dd>{{ lastRun }}</dd></div>
          <div><dt class="mono">输出</dt><dd>需求单 ×1</dd></div>
        </dl>
      </header>

      <p class="sec-note">
        左侧是销售拿到的原始记录（可自行编辑），点「提交整理」后，右侧助手会按
        产品 / 规格 / 数量 / 交期 / 工况 / 验收 / 风险 逐项整理成书面需求，供后续研发对齐与排产使用。
      </p>

      <div class="intake__row">
        <!-- 左：样例输入 -->
        <div class="panel corner-box">
          <header class="panel__head">
            <AppIcon name="file" :size="15" />
            <h4 class="panel__title">样例输入 · 原始记录</h4>
            <span class="panel__sub mono">可编辑</span>
          </header>

          <textarea v-model="raw" class="raw scroll-thin" rows="11" aria-label="客户原始记录"></textarea>

          <div class="intake__actions">
            <button class="btn btn--sm btn--solid" type="button" :disabled="thinking" @click="run">
              <AppIcon name="sparkle" :size="14" />
              {{ thinking ? '整理中…' : '提交整理' }}
            </button>
            <button class="btn btn--sm" type="button" @click="resetSample">
              <AppIcon name="refresh" :size="13" />
              恢复样例
            </button>
            <span class="intake__count mono">{{ charCount }} 字</span>
          </div>

          <ol class="trace">
            <li
              v-for="(s, i) in intakeSteps"
              :key="s"
              class="trace__item"
              :class="{ 'is-done': stepsDone > i, 'is-on': thinking && stepsDone === i }"
            >
              <span class="trace__dot">
                <AppIcon v-if="stepsDone > i" name="check" :size="11" />
              </span>
              {{ s }}
            </li>
          </ol>
        </div>

        <!-- 右：对话 + 书面需求 -->
        <div class="panel panel--chat corner-box">
          <header class="panel__head">
            <span class="panel__avatar"><AppIcon name="sparkle" :size="17" /></span>
            <h4 class="panel__title">需求整理助手</h4>
            <span class="panel__sub mono">第 {{ runCount }} 次整理 · {{ lastRun }}</span>
          </header>

          <div class="stream">
            <!-- 销售原始输入 -->
            <div class="msg msg--user">
              <div class="msg__bubble">
                <p class="msg__raw">{{ raw }}</p>
              </div>
              <span class="msg__time mono">销售 · 09:12</span>
            </div>

            <!-- 整理中 -->
            <div v-if="thinking" class="msg msg--bot">
              <div class="msg__bubble msg__bubble--typing"><span></span><span></span><span></span></div>
              <span class="msg__time mono">正在整理为书面需求…</span>
            </div>

            <!-- 整理结果 -->
            <template v-else>
              <div class="msg msg--bot">
                <div class="msg__bubble">
                  <p>
                    已把这段口语记录按模板整理为书面需求：3 个分类、共 {{ fieldCount }} 项；
                    其中规格、数量、交期、工况等按原文提取（带 <em class="msg__mark">已提取</em> 标记），
                    未提及项沿用模板默认值。
                  </p>
                </div>
                <span class="msg__time mono">需求整理助手 · {{ lastRun }}</span>
              </div>

              <div class="req">
                <header class="req__head">
                  <span class="req__badge mono">书面需求</span>
                  <span class="req__no mono">{{ intakeMeta.no }}</span>
                  <span class="req__state mono">{{ intakeMeta.state }}</span>
                </header>

                <section v-for="sec in sections" :key="sec.no" class="req__sec">
                  <h5 class="req__sec-title">
                    <span class="req__sec-no mono">{{ sec.no }}</span>
                    <span class="req__sec-en">{{ sec.title }}</span>
                    <span class="req__sec-zh">{{ sec.zh }}</span>
                  </h5>
                  <dl class="req__body">
                    <div v-for="it in sec.items" :key="it.key" class="req__row">
                      <dt class="mono">
                        <span v-if="it.no" class="req__item-no">{{ it.no }}</span>
                        {{ it.label || it.title }}
                        <em v-if="it.title" class="req__item-en">{{ it.title }}</em>
                      </dt>
                      <dd>
                        {{ it.value }}
                        <em v-if="it.extracted" class="req__flag mono">已提取</em>
                      </dd>
                    </div>
                  </dl>
                </section>

                <div class="req__risk">
                  <AppIcon name="info" :size="13" />
                  <span><b class="mono">风险 / 待确认</b>{{ intakeMeta.risk }}</span>
                </div>

                <footer class="req__foot">
                  <button class="btn btn--sm" type="button">
                    <AppIcon name="download" :size="13" />
                    导出需求单
                  </button>
                  <button class="btn btn--sm" type="button">
                    <AppIcon name="send" :size="13" />
                    转产品目录检索
                  </button>
                  <span class="req__hint mono">下一步：第 02 区 检索产品目录 · 图纸与 BOM</span>
                </footer>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 客户附件信息 -->
      <div class="attach corner-box">
        <header class="attach__head">
          <AppIcon name="layers" :size="15" />
          <h4 class="attach__title">客户附件信息</h4>
          <span class="attach__sub mono">
            {{ attachments.length }} 个附件 · 合计 {{ attTotal }} MB · {{ attParsed }} 个已解析
          </span>
          <button class="btn btn--sm attach__btn" type="button">
            <AppIcon name="download" :size="13" />
            接收新附件
          </button>
        </header>

        <div class="attach__grid">
          <article v-for="a in attachments" :key="a.id" class="att">
            <span class="att__icon" :class="'is-' + a.kind">
              <AppIcon :name="iconOf(a.kind)" :size="17" />
            </span>
            <div class="att__main">
              <p class="att__name">{{ a.name }}</p>
              <p class="att__meta mono">{{ a.size }} · {{ a.from }} · {{ a.note }}</p>
              <p class="att__key">
                <AppIcon name="check" :size="12" />
                {{ a.key }}
              </p>
            </div>
            <span class="att__state mono" :class="{ 'is-done': a.state.startsWith('已') }">
              {{ a.state }}
            </span>
          </article>
        </div>

        <div class="attach__points">
          <span class="attach__points-label mono">附件要点</span>
          <ul class="attach__list">
            <li v-for="p in attachmentPoints" :key="p">{{ p }}</li>
          </ul>
          <span class="attach__hint mono">附件要点会随需求单一起流转给研发与图纸检索</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.intake {
  padding: clamp(30px, 4.4vw, 64px) 0 0;
}

/* 区块抬头（与其它区块统一） */
.sec-head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: end;
  gap: 10px 20px;
  padding-bottom: 10px;
  border-bottom: 3px double var(--rule-3);
}
.sec-head__no {
  font-size: clamp(2.2rem, 4vw, 3.4rem);
  font-weight: 700;
  line-height: 0.8;
  color: var(--paper-4);
  -webkit-text-stroke: 1.4px var(--ink);
  opacity: 0.9;
}
.sec-head__title {
  font-size: clamp(1.3rem, 2.3vw, 2rem);
  letter-spacing: 0.03em;
  margin-top: 2px;
}
.sec-head__meta {
  display: flex;
  gap: 20px;
  margin: 0;
  text-align: right;
}
.sec-head__meta dt {
  font-size: 0.58rem;
}
.sec-head__meta dd {
  margin: 0;
  font-family: var(--mono);
  font-size: 0.86rem;
  font-weight: 700;
}
.sec-note {
  margin-top: 12px;
  max-width: 96ch;
  font-size: 0.9rem;
  color: var(--ink-3);
}

.intake__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
  gap: clamp(14px, 2vw, 26px);
  margin-top: 18px;
  align-items: start;
}

/* 面板 */
.panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 12px;
}
.panel__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--rule);
  color: var(--ink-3);
}
.panel__title {
  font-size: 0.98rem;
  letter-spacing: 0.06em;
  color: var(--ink);
}
.panel__sub {
  margin-left: auto;
  font-size: 0.54rem;
}
.panel__avatar {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--accent-2);
  border-radius: 0 var(--r-sm) 0 var(--r-sm);
  background: var(--accent-3);
  color: var(--accent-ink);
  flex: none;
}

/* 原始记录输入 */
.raw {
  width: 100%;
  resize: vertical;
  padding: 12px;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: var(--surface);
  font-family: var(--serif);
  font-size: 0.9rem;
  line-height: 1.9;
  color: var(--ink);
  outline: none;
  transition: border-color 0.22s ease, box-shadow 0.22s ease;
}
.raw:focus {
  border-color: var(--accent-ink);
  box-shadow: 0 0 0 3px var(--accent-3);
}
.intake__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}
.intake__count {
  margin-left: auto;
  font-size: 0.54rem;
}
.trace {
  display: grid;
  gap: 7px;
  margin: 14px 0 0;
  padding: 12px 0 0;
  list-style: none;
  border-top: 1px dashed var(--rule);
}
.trace__item {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 0.84rem;
  color: var(--ink-4);
  transition: color 0.25s ease, transform 0.25s ease;
}
.trace__item.is-done {
  color: var(--ink-2);
}
.trace__item.is-on {
  color: var(--accent-ink);
  font-weight: 700;
  transform: translateX(3px);
}
.trace__dot {
  display: grid;
  place-items: center;
  width: 14px;
  height: 14px;
  border: 1px solid currentColor;
  border-radius: 50%;
  flex: none;
}
.trace__item.is-done .trace__dot {
  background: var(--accent-3);
  color: var(--accent-ink);
}

/* 对话流 */
.stream {
  display: grid;
  gap: 12px;
  align-content: start;
}
.msg {
  display: grid;
  gap: 4px;
  max-width: 94%;
}
.msg--user {
  justify-self: end;
  justify-items: end;
}
.msg__bubble {
  padding: 10px 14px;
  border: 1px solid var(--rule);
  border-radius: var(--r-md) var(--r-md) var(--r-md) 0;
  background: var(--surface);
  font-size: 0.9rem;
  line-height: 1.8;
  color: var(--ink-2);
  box-shadow: var(--shadow-s);
}
.msg--bot .msg__bubble {
  border-left: 3px solid var(--accent);
}
.msg--user .msg__bubble {
  border-radius: var(--r-md) var(--r-md) 0 var(--r-md);
  background: var(--accent-3);
  border-color: var(--accent-2);
  color: var(--ink);
}
.msg__raw {
  white-space: pre-line;
  font-size: 0.86rem;
}
.msg__time {
  font-size: 0.5rem;
}
.msg__bubble--typing {
  display: inline-flex;
  gap: 5px;
  padding: 14px 16px;
}
.msg__bubble--typing span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  animation: typing 1.2s ease-in-out infinite;
}
.msg__bubble--typing span:nth-child(2) {
  animation-delay: 0.16s;
}
.msg__bubble--typing span:nth-child(3) {
  animation-delay: 0.32s;
}
@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

/* 书面需求单 */
.req {
  border: 1px solid var(--rule-2);
  border-radius: var(--r-md) 0 var(--r-md) 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.5)),
    var(--paper-2);
  box-shadow: var(--shadow-s);
  overflow: hidden;
}
.req__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 3px double var(--rule-3);
}
.req__badge {
  padding: 2px 8px;
  border-radius: var(--r-pill);
  background: var(--ink);
  color: var(--paper);
  font-size: 0.5rem;
}
.req__no {
  font-size: 0.68rem;
  color: var(--ink-2);
}
.req__state {
  margin-left: auto;
  padding: 2px 8px;
  border: 1px solid var(--accent-2);
  border-radius: var(--r-pill);
  background: var(--accent-3);
  color: var(--accent-ink);
  font-size: 0.5rem;
}
.req__sec {
  padding: 10px 12px 2px;
}
.req__sec + .req__sec {
  border-top: 1px dashed var(--rule);
}
.req__sec-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
  padding-bottom: 6px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--rule);
}
.req__sec-no {
  display: grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: var(--r-xs);
  background: var(--ink);
  color: var(--paper);
  font-size: 0.56rem;
}
.req__sec-en {
  color: var(--ink);
}
.req__sec-zh {
  font-size: 0.72rem;
  font-weight: 400;
  color: var(--ink-3);
}
.req__body {
  margin: 0;
  padding: 0;
}
.req__row {
  display: grid;
  grid-template-columns: 8.6em minmax(0, 1fr);
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px dotted var(--rule);
}
.req__row:last-child {
  border-bottom: none;
}
.req__row dt {
  font-size: 0.52rem;
  padding-top: 3px;
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-wrap: wrap;
}
.req__item-no {
  font-size: 0.5rem;
  color: var(--accent-ink);
}
.req__item-en {
  font-size: 0.46rem;
  font-style: normal;
  color: var(--ink-4);
}
.req__row dd {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.7;
  color: var(--ink-2);
}
.req__flag {
  margin-left: 6px;
  font-size: 0.44rem;
  font-style: normal;
  padding: 1px 5px;
  border-radius: var(--r-pill);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.req__risk {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 10px 12px 0;
  padding: 8px 10px;
  border: 1px solid var(--accent-2);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: var(--accent-3);
  color: var(--accent-ink);
  font-size: 0.78rem;
  line-height: 1.65;
}
.req__risk b {
  margin-right: 6px;
  font-size: 0.5rem;
}
.msg__mark {
  font-style: normal;
  font-size: 0.62rem;
  padding: 1px 5px;
  border-radius: var(--r-pill);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.req__foot {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border-top: 1px solid var(--rule);
  background: var(--paper-3);
}
.req__hint {
  margin-left: auto;
  font-size: 0.5rem;
}

/* 客户附件信息 */
.attach {
  margin-top: clamp(14px, 2vw, 24px);
  padding: 12px 14px 14px;
}
.attach__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--rule);
  color: var(--ink-3);
}
.attach__title {
  font-size: 0.98rem;
  letter-spacing: 0.06em;
  color: var(--ink);
}
.attach__sub {
  margin-left: auto;
  font-size: 0.54rem;
}
.attach__btn {
  margin-left: 6px;
}
.attach__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
}
.att {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: var(--surface);
  transition: border-color 0.22s ease, background 0.22s ease, transform 0.22s ease;
}
.att:hover {
  border-color: var(--accent-2);
  background: var(--accent-3);
  transform: translateY(-1px);
}
.att__icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: none;
  border: 1px solid var(--rule-2);
  border-radius: 0 var(--r-sm) 0 var(--r-sm);
  background: var(--paper-2);
  color: var(--ink-2);
}
.att__icon.is-pdf {
  border-color: var(--accent-2);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.att__icon.is-dwg {
  border-color: var(--rule-2);
  background: var(--paper-3);
}
.att__main {
  min-width: 0;
  flex: 1;
  display: grid;
  gap: 2px;
}
.att__name {
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--ink);
  word-break: break-all;
}
.att__meta {
  font-size: 0.48rem;
}
.att__key {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: var(--ink-3);
  line-height: 1.5;
}
.att__state {
  font-size: 0.46rem;
  padding: 2px 6px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-pill);
  color: var(--ink-3);
  white-space: nowrap;
  flex: none;
}
.att__state.is-done {
  border-color: var(--accent-2);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.attach__points {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--rule);
}
.attach__points-label {
  font-size: 0.54rem;
  padding-top: 3px;
}
.attach__list {
  flex: 1;
  min-width: 260px;
  margin: 0;
  padding-left: 1.05em;
  font-size: 0.8rem;
  line-height: 1.7;
  color: var(--ink-2);
}
.attach__hint {
  font-size: 0.48rem;
  padding-top: 3px;
}

@media (max-width: 1080px) {
  .intake__row {
    grid-template-columns: 1fr;
  }
  .sec-head {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .sec-head__meta {
    grid-column: 1 / -1;
    text-align: left;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 14px;
  }
}
</style>
