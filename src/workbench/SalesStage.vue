<script setup>
/**
 * 01 · 销售端工作台：客户对接内容（左 3）+ AI 助手分析（右 1）
 * AI 给出结论后，由「传递给下一步（AE）」把要点、附件与结论一起流转。
 */
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { salesChat, salesIntake } from './data.js'

const props = defineProps({
  order: { type: Object, required: true },
  active: { type: Boolean, default: true },
  step: { type: Object, default: () => ({}) },
  focus: { type: String, default: '' }, // intake（S1）| analyze（S2）
})
const emit = defineEmits(['submit'])

const raw = ref(salesIntake.raw)
const messages = ref(salesChat.map((m) => ({ ...m })))
const thinking = ref(false)

const hasConclusion = computed(() => messages.value.some((m) => m.role === 'ai' && m.text.includes('判断为可做')))

/** 让 AI 再分析一次（追加一条结论） */
function analyze() {
  if (thinking.value) return
  thinking.value = true
  window.setTimeout(() => {
    messages.value.push({
      role: 'ai',
      text: '复核完成：3 项缺失信息（静态载荷 / 密封槽 / 温度口径）已列入「待客户确认」，其余 4 条要点可直接流转给 AE 填 500413。',
    })
    thinking.value = false
  }, 700)
}

function ask(text) {
  messages.value.push({ role: 'user', text })
  thinking.value = true
  window.setTimeout(() => {
    const map = {
      能按时交样件吗: '含 CANopen 控制板打样，样件按 8 周承诺；若客户接受标准控制板，可压到 6 周。',
      竞品价格更低: '按 CAHB-22 标准品 + 3 项定制，单件 1,850 已在目标内；再降需砍掉绝对位置反馈或改线束长度。',
      需要客户补什么: '补 3 项：静态载荷（6,000 N 量级？）、密封槽尺寸、温度口径确认。',
    }
    messages.value.push({
      role: 'ai',
      text: map[text] || '已记录该问题，建议与 AE 复核时一并确认。',
    })
    thinking.value = false
  }, 600)
}
</script>

<template>
  <div class="s1" :class="'focus-' + (focus || 'intake')">
    <p class="stepinfo mono">
      当前步骤：{{ step.code }} {{ step.name }} · {{ step.owner }}
      <span v-if="focus === 'intake'">— 先接收客户原话与附件</span>
      <span v-else-if="focus === 'analyze'">— 让 AI 整理要点并给出初判结论</span>
    </p>

    <!-- 左 3：客户对接内容 -->
    <section class="pane pane--main" :class="{ 'is-focus': focus === 'intake' }">
      <header class="pane__head">
        <AppIcon name="briefcase" :size="15" />
        <h3 class="pane__title">客户对接内容 · {{ order.customer }}</h3>
        <span class="pane__sub mono">01 · 销售端</span>
      </header>

      <div class="grid2">
        <div class="box">
          <span class="box__label mono">客户原话（可编辑）</span>
          <textarea v-model="raw" class="raw" rows="9" :disabled="!active"></textarea>
        </div>

        <div class="box">
          <span class="box__label mono">客户附件（{{ salesIntake.attachments.length }}）</span>
          <ul class="atts">
            <li v-for="a in salesIntake.attachments" :key="a.name" class="att">
              <AppIcon name="file" :size="14" />
              <span class="att__name">{{ a.name }}</span>
              <span class="att__meta mono">{{ a.size }} · {{ a.note }}</span>
            </li>
          </ul>

          <span class="box__label mono">整理要点</span>
          <ul class="points">
            <li v-for="p in salesIntake.points" :key="p">{{ p }}</li>
          </ul>

          <span class="box__label mono">待客户确认</span>
          <ul class="miss">
            <li v-for="m in salesIntake.missing" :key="m">{{ m }}</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 右 1：AI 助手 -->
    <aside class="pane pane--ai" :class="{ 'is-focus': focus === 'analyze' }">
      <header class="pane__head">
        <AppIcon name="sparkle" :size="15" />
        <h3 class="pane__title">AI 助手 · 情况分析</h3>
      </header>

      <div class="chat">
        <div v-for="(m, i) in messages" :key="i" class="msg" :class="'msg--' + m.role">
          <span class="msg__who mono">{{ m.role === 'ai' ? 'AI 助手' : '销售 · 陈工' }}</span>
          <p class="msg__text">{{ m.text }}</p>
        </div>
        <div v-if="thinking" class="msg msg--ai">
          <span class="msg__who mono">AI 助手</span>
          <p class="msg__text typing"><i></i><i></i><i></i></p>
        </div>
      </div>

      <div class="quick">
        <button class="chip" type="button" @click="ask('能按时交样件吗')">能按时交样件吗</button>
        <button class="chip" type="button" @click="ask('竞品价格更低')">竞品价格更低</button>
        <button class="chip" type="button" @click="ask('需要客户补什么')">需要客户补什么</button>
      </div>

      <div class="conclusion">
        <span class="conclusion__label mono">AI 结论</span>
        <p class="conclusion__text">
          可做。倾向 <b>CAHB-22-D2E</b> 基型（48 V / 3,500 N / 37 mm/s / 行程 50），
          3 项缺失信息需随工单流转到 AE 复核。
        </p>
        <ul class="conclusion__list">
          <li>流转内容：客户原话 + 3 个附件 + 4 条要点 + 3 项待确认</li>
          <li>建议承诺：样件 8 周（含 CANopen 控制板打样）</li>
        </ul>
      </div>

      <div class="acts">
        <button class="btn btn--sm" type="button" :disabled="!active" @click="analyze">
          <AppIcon name="refresh" :size="13" />
          重新分析
        </button>
        <button
          class="btn btn--sm btn--solid acts__main"
          type="button"
          :disabled="!active || !hasConclusion"
          @click="emit('submit')"
        >
          <AppIcon name="send" :size="13" />
          传递给下一步（AE）
        </button>
      </div>
      <p v-if="!active" class="pane__lock mono">当前不在 S1 步骤，仅供查看</p>
    </aside>
  </div>
</template>

<style scoped>
.stepinfo {
  grid-column: 1 / -1;
  margin: 0 0 2px;
  font-size: 0.58rem;
  color: var(--accent-ink);
}
.pane.is-focus {
  border-color: var(--accent);
  box-shadow: inset 0 0 0 1px var(--accent-3);
}
.s1 {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 12px;
  margin-top: 12px;
  align-items: start;
}
.pane {
  border: 1px solid var(--rule-2);
  border-radius: var(--r-md);
  background: var(--surface);
  padding: 12px 14px 14px;
  min-width: 0;
}
.pane--ai {
  position: sticky;
  top: 74px;
  display: grid;
  gap: 10px;
}
.pane__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 9px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--rule);
  color: var(--ink-3);
}
.pane__title {
  font-size: 0.98rem;
  color: var(--ink);
}
.pane__sub {
  margin-left: auto;
  font-size: 0.6rem;
}
.pane__lock {
  font-size: 0.6rem;
  color: var(--warn);
}

.grid2 {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}
.box {
  display: grid;
  gap: 6px;
  align-content: start;
  min-width: 0;
}
.box__label {
  font-size: 0.6rem;
  letter-spacing: 0.06em;
  color: var(--ink-4);
  margin-top: 4px;
}
.raw {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-sm);
  background: var(--paper);
  font-family: inherit;
  font-size: 0.84rem;
  line-height: 1.85;
  color: var(--ink);
  resize: vertical;
  outline: none;
}
.raw:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-3);
  background: var(--surface);
}
.atts,
.points,
.miss {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.att {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 8px;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm);
  background: var(--paper);
  color: var(--ink-3);
  font-size: 0.76rem;
}
.att__name {
  min-width: 0;
  color: var(--ink);
  word-break: break-all;
}
.att__meta {
  margin-left: auto;
  flex: none;
  font-size: 0.54rem;
}
.points li {
  position: relative;
  padding-left: 14px;
  font-size: 0.8rem;
  line-height: 1.65;
  color: var(--ink-2);
}
.points li::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 8px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--ok);
}
.miss li {
  position: relative;
  padding-left: 14px;
  font-size: 0.8rem;
  line-height: 1.65;
  color: var(--warn);
}
.miss li::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 8px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--warn);
}

/* AI 面板 */
.chat {
  display: grid;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 2px;
}
.msg {
  display: grid;
  gap: 2px;
  padding: 8px 10px;
  border-radius: var(--r-sm);
  font-size: 0.8rem;
  line-height: 1.65;
}
.msg--ai {
  border: 1px solid var(--rule-2);
  background: var(--paper);
  color: var(--ink-2);
}
.msg--user {
  border: 1px solid var(--accent-2);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.msg__who {
  font-size: 0.54rem;
  color: var(--ink-4);
}
.msg--user .msg__who {
  color: var(--accent-ink);
}
.msg__text {
  margin: 0;
}
.typing {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  height: 1.2em;
}
.typing i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--ink-4);
  animation: blink 1.1s ease-in-out infinite;
}
.typing i:nth-child(2) {
  animation-delay: 0.15s;
}
.typing i:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes blink {
  0%,
  60%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}
.quick {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.chip {
  padding: 3px 9px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-pill);
  background: var(--surface);
  font-size: 0.66rem;
  color: var(--ink-3);
  transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease;
}
.chip:hover {
  border-color: var(--accent);
  background: var(--accent-3);
  color: var(--accent-ink);
}

.conclusion {
  padding: 10px;
  border: 1px solid var(--ok);
  border-radius: var(--r-sm);
  background: var(--ok-soft);
}
.conclusion__label {
  font-size: 0.56rem;
  color: var(--ok);
}
.conclusion__text {
  margin: 4px 0 0;
  font-size: 0.82rem;
  line-height: 1.7;
  color: var(--ink);
}
.conclusion__list {
  margin: 6px 0 0;
  padding-left: 1.05em;
  font-size: 0.74rem;
  line-height: 1.65;
  color: var(--ink-2);
}

.acts {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.acts__main {
  flex: 1;
  justify-content: center;
}

@media (max-width: 1180px) {
  .s1 {
    grid-template-columns: 1fr;
  }
  .pane--ai {
    position: static;
  }
}
@media (max-width: 760px) {
  .grid2 {
    grid-template-columns: 1fr;
  }
}
</style>
