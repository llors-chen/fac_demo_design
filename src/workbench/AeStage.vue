<script setup>
/**
 * 01-00 · AE 工作台：报表填写（左 3）+ AI 助手（右 1）
 * 左下角「打回销售」（需填原因）；右下角「确认」+「发送研发」。
 */
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { aeChat, reportSections } from './data.js'

const props = defineProps({
  order: { type: Object, required: true },
  active: { type: Boolean, default: true },
  step: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['back', 'confirm', 'send'])

/** 报表字段（可编辑） */
const sections = ref(
  reportSections.map((s) => ({ ...s, items: s.items.map((it) => ({ ...it })) })),
)
const messages = ref(aeChat.map((m) => ({ ...m })))
const thinking = ref(false)

/** 需要问客户的条目（默认勾选带 warn 的） */
const asked = ref(
  new Set(
    sections.value
      .flatMap((s) => s.items)
      .filter((i) => i.warn)
      .map((i) => i.key),
  ),
)
const askedCount = computed(() => asked.value.size)

function toggleAsk(key) {
  const next = new Set(asked.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  asked.value = next
}

/** 打回 */
const backOpen = ref(false)
const backReason = ref('')

function doBack() {
  emit('back', backReason.value.trim())
  backOpen.value = false
  backReason.value = ''
}

/** 发送客户确认单（模拟） */
const sent = ref(false)
function sendAsk() {
  sent.value = true
  messages.value.push({
    role: 'ai',
    text: `已把 ${askedCount.value} 个问题合并成一条确认单发给客户；客户答复后我会自动回填对应字段。`,
  })
}

/** 确认 */
const confirmed = ref(false)
function doConfirm() {
  confirmed.value = true
  messages.value.push({
    role: 'ai',
    text: '已确认：报表 5 节齐全，三方确认单生成完毕（客户 / 销售 / AE）。可以发送研发。',
  })
  emit('confirm')
}

/** 统计 */
const total = computed(() => sections.value.reduce((s, x) => s + x.items.length, 0))
const warnCount = computed(() =>
  sections.value.reduce((s, x) => s + x.items.filter((i) => i.warn).length, 0),
)
</script>

<template>
  <div class="ae">
    <!-- 左 3：报表 -->
    <section class="pane pane--main">
      <header class="pane__head">
        <AppIcon name="flask" :size="15" />
        <h3 class="pane__title">500413 · Customer requirement assessment</h3>
        <span class="pane__sub mono">
          {{ total }} 个字段 · {{ warnCount }} 处待确认 · {{ order.customer }}
        </span>
      </header>

      <div class="forms">
        <section v-for="s in sections" :key="s.no" class="fsec">
          <header class="fsec__head">
            <span class="fsec__no mono">{{ s.no }}</span>
            <h4 class="fsec__title">{{ s.title }}</h4>
            <span class="fsec__zh">{{ s.zh }}</span>
          </header>

          <div class="frows">
            <div
              v-for="it in s.items"
              :key="it.key"
              class="frow"
              :class="{ 'is-warn': it.warn, 'is-asked': asked.has(it.key) }"
            >
              <span class="frow__label mono">
                <em v-if="it.no" class="frow__no">{{ it.no }}</em>
                {{ it.label }}
              </span>
              <input v-model="it.value" class="frow__input" :disabled="!active" />
              <span class="frow__src mono">{{ { customer: '客户', sales: '销售', system: '系统' }[it.from] }}</span>
              <button
                v-if="it.warn"
                class="frow__ask mono"
                :class="{ 'is-on': asked.has(it.key) }"
                type="button"
                :disabled="!active"
                @click="toggleAsk(it.key)"
              >
                {{ asked.has(it.key) ? '✓ 问客户' : '问客户' }}
              </button>
            </div>
          </div>
        </section>
      </div>

      <!-- 左下角：打回 -->
      <footer class="acts">
        <div class="acts__left">
          <button class="btn btn--sm btn--danger" type="button" :disabled="!active" @click="backOpen = !backOpen">
            <AppIcon name="arrowLeft" :size="13" />
            打回销售
          </button>
          <div v-if="backOpen" class="backbox">
            <textarea
              v-model="backReason"
              class="backbox__input"
              rows="3"
              placeholder="填写打回原因（会记录在工单上并通知销售）"
            ></textarea>
            <div class="backbox__acts">
              <button class="btn btn--sm" type="button" @click="backOpen = false">取消</button>
              <button class="btn btn--sm btn--danger" type="button" @click="doBack">确认打回</button>
            </div>
          </div>
        </div>

        <div class="acts__right">
          <button class="btn btn--sm" type="button" :disabled="!active || sent" @click="sendAsk">
            <AppIcon name="send" :size="13" />
            {{ sent ? '已发客户确认单' : `发客户确认（${askedCount}）` }}
          </button>
          <button class="btn btn--sm" type="button" :disabled="!active" @click="doConfirm">
            <AppIcon name="check" :size="13" />
            {{ confirmed ? '已确认' : '确认' }}
          </button>
          <button
            class="btn btn--sm btn--solid"
            type="button"
            :disabled="!active || !confirmed"
            @click="emit('send')"
          >
            <AppIcon name="arrowRight" :size="13" />
            发送研发
          </button>
        </div>
      </footer>
      <p v-if="!active" class="pane__lock mono">当前不在 S2 步骤，仅供查看</p>
    </section>

    <!-- 右 1：AI 助手 -->
    <aside class="pane pane--ai">
      <header class="pane__head">
        <AppIcon name="sparkle" :size="15" />
        <h3 class="pane__title">AI 助手 · 报表校验</h3>
      </header>

      <div class="chat">
        <div v-for="(m, i) in messages" :key="i" class="msg" :class="'msg--' + m.role">
          <span class="msg__who mono">{{ m.role === 'ai' ? 'AI 助手' : 'AE · 李工' }}</span>
          <p class="msg__text">{{ m.text }}</p>
        </div>
        <div v-if="thinking" class="msg msg--ai">
          <span class="msg__who mono">AI 助手</span>
          <p class="msg__text">分析中…</p>
        </div>
      </div>

      <div class="check">
        <span class="check__label mono">原文 vs 报表 对照</span>
        <ul class="check__list">
          <li class="is-ok">3.1 电压 / 推力 —— 与客户原话一致</li>
          <li class="is-ask">3.1 static load —— 客户未提及，需询问</li>
          <li class="is-ask">3.4 温度 —— 客户 -20~60 ℃，报表按平台标准</li>
          <li class="is-ask">3.3 密封槽 —— 客户未给尺寸</li>
          <li class="is-ok">3.5 认证 —— CE 是、UL 不做</li>
        </ul>
      </div>

      <div class="conclusion">
        <span class="conclusion__label mono">AI 建议</span>
        <p class="conclusion__text">
          勾选 3 条发起客户确认；确认后回填并生成三方确认单。若客户 24 h 未回，可先按平台标准填并标注假设。
        </p>
      </div>

      <p class="pane__tip mono">
        底部：左侧「打回销售」可附原因退回 01；右侧「确认」后再「发送研发」进入 02 / 02-00。
      </p>
    </aside>
  </div>
</template>

<style scoped>
.ae {
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
.pane__lock,
.pane__tip {
  font-size: 0.6rem;
  color: var(--ink-4);
  line-height: 1.6;
}
.pane__lock {
  color: var(--warn);
}

/* 报表 */
.forms {
  display: grid;
  gap: 12px;
}
.fsec {
  border: 1px solid var(--rule);
  border-radius: var(--r-sm);
  overflow: hidden;
}
.fsec__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background: var(--paper-3);
  border-bottom: 1px solid var(--rule);
}
.fsec__no {
  display: grid;
  place-items: center;
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  border-radius: var(--r-xs);
  background: var(--ink);
  color: var(--paper);
  font-size: 0.56rem;
}
.fsec__title {
  font-size: 0.86rem;
}
.fsec__zh {
  font-size: 0.64rem;
  color: var(--ink-4);
}
.frows {
  display: grid;
}
.frow {
  display: grid;
  grid-template-columns: 11.6em minmax(0, 1fr) auto auto;
  gap: 8px;
  align-items: center;
  padding: 5px 10px;
  border-bottom: 1px dotted var(--rule);
}
.frow:last-child {
  border-bottom: none;
}
.frow.is-warn {
  background: var(--warn-soft);
}
.frow__label {
  font-size: 0.6rem;
  color: var(--ink-3);
  display: flex;
  align-items: center;
  gap: 4px;
}
.frow__no {
  font-style: normal;
  color: var(--accent-ink);
}
.frow__input {
  min-width: 0;
  padding: 5px 8px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-xs);
  background: var(--surface);
  font-family: inherit;
  font-size: 0.8rem;
  color: var(--ink);
  outline: none;
}
.frow__input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-3);
}
.frow.is-warn .frow__input {
  border-color: var(--warn);
}
.frow__src {
  font-size: 0.52rem;
  padding: 1px 6px;
  border-radius: var(--r-pill);
  border: 1px solid var(--rule-2);
  color: var(--ink-4);
}
.frow__ask {
  font-size: 0.54rem;
  padding: 2px 8px;
  border-radius: var(--r-pill);
  border: 1px solid var(--rule-2);
  background: var(--surface);
  color: var(--ink-3);
  transition: all 0.16s ease;
}
.frow__ask:hover {
  border-color: var(--ink);
  color: var(--ink);
}
.frow__ask.is-on {
  border-color: var(--warn);
  background: var(--warn);
  color: #fff;
}

/* 底部动作条 */
.acts {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--rule);
}
.acts__left,
.acts__right {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  flex-wrap: wrap;
}
.acts__left {
  position: relative;
}
.backbox {
  position: absolute;
  left: 0;
  top: calc(100% + 6px);
  z-index: 10;
  width: min(360px, 80vw);
  padding: 10px;
  border: 1px solid var(--danger);
  border-radius: var(--r-sm);
  background: var(--surface);
  box-shadow: 0 8px 24px rgba(31, 35, 41, 0.14);
  display: grid;
  gap: 8px;
}
.backbox__input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-xs);
  font-family: inherit;
  font-size: 0.78rem;
  line-height: 1.6;
  resize: vertical;
  outline: none;
}
.backbox__input:focus {
  border-color: var(--danger);
}
.backbox__acts {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}
.btn--danger {
  border-color: var(--danger);
  color: var(--danger);
}
.btn--danger:hover {
  background: var(--danger-soft);
}

/* AI 面板 */
.chat {
  display: grid;
  gap: 8px;
  max-height: 260px;
  overflow-y: auto;
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
.msg__text {
  margin: 0;
}
.check {
  padding: 9px 10px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-sm);
  background: var(--paper);
}
.check__label {
  font-size: 0.56rem;
  color: var(--ink-4);
}
.check__list {
  display: grid;
  gap: 4px;
  margin: 6px 0 0;
  padding-left: 1.05em;
  font-size: 0.74rem;
  line-height: 1.6;
  color: var(--ink-2);
}
.check__list li.is-ok {
  color: var(--ok);
}
.check__list li.is-ask {
  color: var(--warn);
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

@media (max-width: 1180px) {
  .ae {
    grid-template-columns: 1fr;
  }
  .pane--ai {
    position: static;
  }
}
@media (max-width: 760px) {
  .frow {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  .frow__label {
    font-size: 0.66rem;
  }
  .frow__src,
  .frow__ask {
    justify-self: start;
  }
  .acts__right {
    width: 100%;
  }
  .acts__right .btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
