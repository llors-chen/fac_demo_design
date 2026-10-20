<script setup>
/**
 * 第 03 区 · 销售端 · 回馈与报价
 *
 * chatbot 外壳，前置输入：「汇总匹配结果，给销售回馈报价与预估交期」
 * 工具 quote_leadtime_eval 汇总第 02 区的匹配结果，输出给销售的回馈：
 *   报价明细（数量档位 / 折扣 / 税） + 预估交期甘特 + 前提与风险 + 可直接转客户的话术。
 * 内容为演示编写，用于展示流程。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import { quoteBaseItems, quoteChat, quoteNotes, quoteTiers, quoteTimeline } from '../data/site.js'

const nowTime = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const tierIndex = ref(0)
const draft = ref('')
const thinking = ref(false)
const toolFlash = ref(false)
const MAX_ROUNDS = 3
const rounds = ref([{ q: quoteChat.preInput, a: quoteChat.reply(quoteChat.preInput), time: nowTime() }])

let replyTimer = null
let flashTimer = null

const tier = computed(() => quoteTiers[tierIndex.value])

/** 报价明细：数量档位影响前两行的数量与折扣 */
const quoteRows = computed(() =>
  quoteBaseItems.map((it) => {
    const qty = it.tiered ? tier.value.qty : it.qty
    const price = it.tiered
      ? Math.round(it.price * (1 - tier.value.discount) * 100) / 100
      : it.price
    return { ...it, qty, price, amount: Math.round(qty * price * 100) / 100 }
  }),
)

const totals = computed(() => {
  const subtotal = Math.round(quoteRows.value.reduce((s, r) => s + r.amount, 0) * 100) / 100
  const tax = Math.round(subtotal * 0.13 * 100) / 100
  return { subtotal, tax, total: Math.round((subtotal + tax) * 100) / 100 }
})

/** 交期甘特：总跨度取最晚完成日 */
const timeline = computed(() =>
  quoteTimeline.map((t) => ({
    ...t,
    days: t.key === 'batch' ? t.days + tier.value.leadDelta : t.days,
    from: t.key === 'batch' ? t.from + tier.value.leadDelta : t.from,
  })),
)
const spanDays = computed(() => Math.max(...timeline.value.map((t) => t.from + t.days)))
const barStyle = (t) => ({
  left: `${(t.from / spanDays.value) * 100}%`,
  width: `${Math.max((t.days / spanDays.value) * 100, 4)}%`,
})

const sampleDays = computed(() => timeline.value.find((t) => t.key === 'sample')?.days ?? 10)
const batchDays = computed(() => {
  const b = timeline.value.find((t) => t.key === 'batch')
  return b ? b.from + b.days : 30
})
const jigDays = computed(() => timeline.value.find((t) => t.key === 'jig')?.days ?? 45)

function flashTool() {
  toolFlash.value = true
  window.clearTimeout(flashTimer)
  flashTimer = window.setTimeout(() => (toolFlash.value = false), 1100)
}

function ask(text) {
  if (thinking.value) return
  const q = (typeof text === 'string' ? text : draft.value).trim() || quoteChat.preInput
  draft.value = ''
  thinking.value = true
  const round = { q, a: '', time: nowTime() }
  rounds.value.push(round)
  if (rounds.value.length > MAX_ROUNDS) rounds.value.splice(0, rounds.value.length - MAX_ROUNDS)

  window.clearTimeout(replyTimer)
  replyTimer = window.setTimeout(() => {
    const t = totals.value
    round.a = `已按「${q}」生成回馈：${tier.value.qty} 件方案含税合计 ￥${t.total.toLocaleString()}（13% 税），预估样件 ${sampleDays.value} 天、首批 ${batchDays.value} 天、专用工装 ${jigDays.value} 天；前提与风险见下方清单。`
    thinking.value = false
    flashTool()
  }, 900)
}

function pickTier(i) {
  tierIndex.value = i
  flashTool()
}

const money = (n) => `￥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

onMounted(() => window.clearTimeout(replyTimer))
onBeforeUnmount(() => {
  window.clearTimeout(replyTimer)
  window.clearTimeout(flashTimer)
})
</script>

<template>
  <section id="quote-chat" class="quote">
    <div class="wrap">
      <header class="sec-head">
        <span class="sec-head__no" aria-hidden="true">03</span>
        <div>
          <p class="kicker">销售端 · 回馈与报价</p>
          <h3 class="sec-head__title">给销售一份可直接转客户的回馈：报价、交期与风险</h3>
        </div>
        <dl class="sec-head__meta">
          <div><dt class="mono">含税合计</dt><dd>{{ money(totals.total) }}</dd></div>
          <div><dt class="mono">样件交期</dt><dd>{{ sampleDays }} 天</dd></div>
          <div><dt class="mono">首批交期</dt><dd>{{ batchDays }} 天</dd></div>
        </dl>
      </header>

      <p class="sec-note">
        产品匹配完成后进入本区：助手把匹配结果汇总为销售回馈 —— 报价明细（可按数量档位调整折扣）、
        预估交期甘特（图纸确认 / 样件 / 客户验证 / 工装 / 首批）、前提与风险清单，以及一段可直接转客户的话术。
      </p>

      <!-- chatbot 外壳 -->
      <div class="chat-shell corner-box">
        <header class="chat-head">
          <span class="chat-head__avatar" aria-hidden="true">
            <AppIcon name="sparkle" :size="18" />
          </span>
          <div class="chat-head__id">
            <h4 class="chat-head__name">{{ quoteChat.name }}</h4>
            <p class="chat-head__role mono">{{ quoteChat.role }} · 已接入价格库与产能日历</p>
          </div>
          <span class="chat-head__state">
            <span class="chat-head__dot"></span>
            <span class="mono">在线</span>
          </span>
        </header>

        <div class="chat-stream">
          <div class="msg msg--bot">
            <div class="msg__bubble">
              <p>{{ quoteChat.greeting }}</p>
            </div>
            <span class="msg__time mono">{{ rounds[0]?.time }}</span>
          </div>

          <template v-for="(r, i) in rounds" :key="'r' + i">
            <div class="msg msg--user">
              <div class="msg__bubble">
                <p>{{ r.q }}</p>
              </div>
              <span class="msg__time mono">{{ r.time }}</span>
            </div>
            <div v-if="r.a" class="msg msg--bot">
              <div class="msg__bubble">
                <p>{{ r.a }}</p>
                <p class="tool-call mono">
                  <AppIcon name="gear" :size="12" />
                  已调用工具 {{ quoteChat.toolId }} · 参数 { 需求: "{{ r.q }}" }
                </p>
              </div>
              <span class="msg__time mono">{{ r.time }}</span>
            </div>
          </template>

          <div v-if="thinking" class="msg msg--bot">
            <div class="msg__bubble msg__bubble--typing"><span></span><span></span><span></span></div>
            <span class="msg__time mono">正在核算价格与产能…</span>
          </div>

          <!-- 工具视图 -->
          <div class="tool" :class="{ 'is-flash': toolFlash }">
            <div class="tool__head">
              <span class="tool__badge mono">工具</span>
              <AppIcon name="file" :size="15" />
              <span class="tool__name">{{ quoteChat.toolName }}</span>
              <span class="tool__meta mono">
                档位 {{ tier.label }} · 含税 {{ money(totals.total) }}
              </span>
            </div>

            <div class="quote-grid">
              <!-- 左：报价单 -->
              <div class="card">
                <div class="card__head">
                  <span class="mono">报价单 QUO-20261020-032</span>
                  <div class="tiers">
                    <button
                      v-for="(t, i) in quoteTiers"
                      :key="t.qty"
                      class="tier"
                      :class="{ 'is-on': tierIndex === i }"
                      type="button"
                      @click="pickTier(i)"
                    >
                      {{ t.label }}
                    </button>
                  </div>
                </div>

                <table class="qtable">
                  <thead>
                    <tr>
                      <th class="mono">序号</th>
                      <th>项目</th>
                      <th class="mono">数量</th>
                      <th class="mono">单价</th>
                      <th class="mono">金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in quoteRows" :key="r.no">
                      <td class="mono">{{ r.no }}</td>
                      <td>
                        <span class="qtable__name">{{ r.name }}</span>
                        <span class="qtable__note mono">{{ r.code }} · {{ r.note }}</span>
                      </td>
                      <td class="mono">{{ r.qty }} {{ r.unit }}</td>
                      <td class="mono">{{ money(r.price) }}</td>
                      <td class="mono qtable__amount">{{ money(r.amount) }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="4" class="qtable__label">小计</td>
                      <td class="mono">{{ money(totals.subtotal) }}</td>
                    </tr>
                    <tr>
                      <td colspan="4" class="qtable__label">增值税 13%</td>
                      <td class="mono">{{ money(totals.tax) }}</td>
                    </tr>
                    <tr class="is-total">
                      <td colspan="4" class="qtable__label">含税合计</td>
                      <td class="mono">{{ money(totals.total) }}</td>
                    </tr>
                  </tfoot>
                </table>

                <p class="card__hint mono">{{ tier.note }} · 价格有效期 30 天</p>
              </div>

              <!-- 右：交期 + 前提风险 -->
              <div class="side">
                <div class="card">
                  <div class="card__head">
                    <span class="mono">预估交期 · 共 {{ spanDays }} 天</span>
                  </div>
                  <ul class="gantt">
                    <li v-for="t in timeline" :key="t.key" class="gantt__row">
                      <span class="gantt__label">{{ t.label }}</span>
                      <span class="gantt__track">
                        <span class="gantt__bar" :style="barStyle(t)"></span>
                      </span>
                      <span class="gantt__days mono">{{ t.days }} 天</span>
                      <span class="gantt__note mono">{{ t.note }}</span>
                    </li>
                  </ul>
                  <p class="card__hint mono">
                    样件 {{ sampleDays }} 天 · 工装 {{ jigDays }} 天 · 首批 {{ batchDays }} 天
                  </p>
                </div>

                <div class="card">
                  <div class="card__head"><span class="mono">前提与风险</span></div>
                  <h5 class="mini mono">报价前提</h5>
                  <ul class="list">
                    <li v-for="t in quoteNotes.basis" :key="t">{{ t }}</li>
                  </ul>
                  <h5 class="mini mono">风险提示</h5>
                  <ul class="list list--risk">
                    <li v-for="t in quoteNotes.risks" :key="t">{{ t }}</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- 给客户的话术 + 动作 -->
            <div class="feedback">
              <span class="feedback__label mono">可直接转客户的话术</span>
              <p class="feedback__text">{{ quoteNotes.feedback }}</p>
              <div class="feedback__actions">
                <button class="btn btn--sm btn--solid" type="button">
                  <AppIcon name="send" :size="13" />
                  发送给销售
                </button>
                <button class="btn btn--sm" type="button">
                  <AppIcon name="check" :size="13" />
                  转审批
                </button>
                <button class="btn btn--sm" type="button">
                  <AppIcon name="download" :size="13" />
                  导出报价单
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入 -->
        <form class="chat-input" @submit.prevent="ask()">
          <div class="chat-input__chips">
            <button
              v-for="(s, i) in quoteChat.suggestions"
              :key="i"
              class="chip"
              type="button"
              @click="ask(s)"
            >
              {{ s }}
            </button>
          </div>
          <div class="chat-input__row">
            <AppIcon name="sparkle" :size="16" />
            <input
              v-model="draft"
              class="chat-input__field"
              type="text"
              placeholder="例如：客户要 500 件，含税总价和交期是多少"
              aria-label="描述报价需求"
            />
            <button class="btn btn--sm btn--solid" type="submit">
              <AppIcon name="send" :size="14" />
              发送
            </button>
          </div>
          <p class="chat-input__tip mono">演示版本：报价与交期为依据当前档位写死生成，用于展示流程</p>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.quote {
  padding: clamp(30px, 4.4vw, 64px) 0 0;
}

/* 区块抬头 */
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

/* chatbot 外壳 */
.chat-shell {
  margin-top: 18px;
  padding: 0;
  overflow: hidden;
}
.chat-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 3px double var(--rule-3);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0));
}
.chat-head__avatar {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--accent-2);
  border-radius: 0 var(--r-sm) 0 var(--r-sm);
  background: var(--accent-3);
  color: var(--accent-ink);
  flex: none;
}
.chat-head__name {
  font-size: 1.06rem;
  letter-spacing: 0.08em;
}
.chat-head__role {
  font-size: 0.56rem;
}
.chat-head__state {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.58rem;
  color: var(--ink-3);
}
.chat-head__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-3);
  animation: chatPulse 2.4s ease-in-out infinite;
}
@keyframes chatPulse {
  50% {
    box-shadow: 0 0 0 7px rgba(163, 207, 138, 0.16);
  }
}

.chat-stream {
  display: grid;
  gap: 14px;
  padding: 18px 16px 6px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0)),
    var(--paper-2);
}
.msg {
  display: grid;
  gap: 4px;
  max-width: min(72ch, 86%);
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
  font-size: 0.92rem;
  line-height: 1.75;
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
.msg__time {
  font-size: 0.5rem;
}
.tool-call {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 5px 9px;
  border: 1px dashed var(--accent-2);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: var(--accent-3);
  color: var(--accent-ink);
  font-size: 0.54rem;
  word-break: break-all;
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

/* 工具视图 */
.tool {
  padding: 12px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-md) 0 var(--r-md) 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.5)),
    var(--paper);
  box-shadow: var(--shadow-s);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.tool.is-flash {
  border-color: var(--accent-ink);
  box-shadow: 0 0 0 4px var(--accent-3), var(--shadow-m);
}
.tool__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 2px 10px;
  border-bottom: 1px solid var(--rule);
  flex-wrap: wrap;
}
.tool__badge {
  padding: 2px 8px;
  border-radius: var(--r-pill);
  background: var(--ink);
  color: var(--paper);
  font-size: 0.5rem;
}
.tool__name {
  font-size: 0.98rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.tool__meta {
  margin-left: auto;
  font-size: 0.54rem;
}

.quote-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: clamp(12px, 1.6vw, 20px);
  margin-top: 12px;
  align-items: start;
}
.card {
  border: 1px solid var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: var(--surface);
  overflow: hidden;
}
.side {
  display: grid;
  gap: 12px;
}
.card__head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 12px;
  border-bottom: 1px solid var(--rule);
  background: var(--paper-2);
  font-size: 0.54rem;
}
.card__hint {
  padding: 8px 12px;
  border-top: 1px dashed var(--rule);
  font-size: 0.5rem;
}
.tiers {
  margin-left: auto;
  display: flex;
  gap: 4px;
}
.tier {
  padding: 3px 9px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-pill);
  font-size: 0.68rem;
  color: var(--ink-3);
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.tier:hover {
  background: var(--accent-3);
  color: var(--accent-ink);
}
.tier.is-on {
  border-color: var(--accent-2);
  background: var(--accent-3);
  color: var(--accent-ink);
  font-weight: 700;
}

/* 报价表 */
.qtable {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.qtable th {
  text-align: left;
  font-weight: 400;
  font-size: 0.5rem;
  letter-spacing: 0.1em;
  color: var(--ink-3);
  padding: 7px 8px;
  border-bottom: 1px solid var(--rule-2);
}
.qtable td {
  padding: 8px;
  border-bottom: 1px dotted var(--rule);
  vertical-align: top;
}
.qtable__name {
  display: block;
  font-size: 0.86rem;
  color: var(--ink);
}
.qtable__note {
  display: block;
  font-size: 0.46rem;
  margin-top: 2px;
}
.qtable__amount {
  text-align: right;
  font-weight: 700;
}
.qtable tfoot td {
  border-bottom: none;
  padding: 6px 8px;
}
.qtable__label {
  text-align: right;
  font-size: 0.76rem;
  color: var(--ink-3);
}
.qtable tfoot tr.is-total td {
  padding-top: 8px;
  font-size: 0.9rem;
  color: var(--accent-ink);
  font-weight: 700;
  border-top: 3px double var(--rule-3);
}

/* 甘特 */
.gantt {
  margin: 0;
  padding: 10px 12px 4px;
  list-style: none;
  display: grid;
  gap: 9px;
}
.gantt__row {
  display: grid;
  grid-template-columns: 9.6em minmax(60px, 1fr) 3.2em;
  gap: 8px;
  align-items: center;
}
.gantt__label {
  font-size: 0.78rem;
  color: var(--ink-2);
}
.gantt__track {
  position: relative;
  height: 10px;
  border-radius: var(--r-pill);
  background: var(--paper-3);
  overflow: hidden;
}
.gantt__bar {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: var(--r-pill);
  background: linear-gradient(90deg, var(--accent-2), var(--accent-ink));
}
.gantt__days {
  font-size: 0.6rem;
  text-align: right;
  color: var(--accent-ink);
}
.gantt__note {
  grid-column: 1 / -1;
  font-size: 0.46rem;
  padding-left: 0.2em;
}

/* 前提与风险 */
.mini {
  font-size: 0.5rem;
  padding: 8px 12px 4px;
  color: var(--ink-3);
}
.list {
  margin: 0;
  padding: 0 12px 10px 1.9em;
  font-size: 0.78rem;
  line-height: 1.7;
  color: var(--ink-2);
}
.list--risk {
  color: var(--accent-ink);
}

/* 回馈话术 */
.feedback {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid var(--accent-2);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: var(--accent-3);
}
.feedback__label {
  font-size: 0.5rem;
  color: var(--accent-ink);
}
.feedback__text {
  margin-top: 4px;
  font-size: 0.86rem;
  line-height: 1.8;
  color: var(--ink);
}
.feedback__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

/* 输入 */
.chat-input {
  padding: 12px 16px 14px;
  border-top: 1px solid var(--rule-2);
  background: var(--paper-3);
}
.chat-input__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.chip {
  padding: 4px 10px;
  border: 1px dashed var(--rule-2);
  border-radius: var(--r-pill);
  font-size: 0.74rem;
  color: var(--ink-3);
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}
.chip:hover {
  background: var(--accent-3);
  border-color: var(--accent-ink);
  border-style: solid;
  color: var(--accent-ink);
  transform: translateY(-1px);
}
.chat-input__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 8px 8px 14px;
  border: 1px solid var(--rule);
  border-radius: var(--r-md);
  background: var(--surface);
  color: var(--ink-3);
  transition: border-color 0.22s ease, box-shadow 0.22s ease;
}
.chat-input__row:focus-within {
  border-color: var(--accent-ink);
  box-shadow: 0 0 0 3px var(--accent-3);
}
.chat-input__field {
  flex: 1;
  min-width: 0;
  border: none;
  background: none;
  outline: none;
  font-family: var(--serif);
  font-size: 0.94rem;
  color: var(--ink);
}
.chat-input__field::placeholder {
  color: var(--ink-4);
}
.chat-input__tip {
  margin-top: 8px;
  font-size: 0.52rem;
  text-align: center;
}

@media (max-width: 1080px) {
  .quote-grid {
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
