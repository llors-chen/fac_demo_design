<script setup>
/**
 * 图纸助手（交互窗口，暂不接后端）
 * 宽度与左侧 DWG 窗口构成 3 : 1 的比例；界面可用、功能占位。
 */
import { nextTick, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import { chatMessages, chatSuggestions } from '../data/site.js'

const draft = ref('')
const notice = ref(false)
const listEl = ref(null)
const inputEl = ref(null)
let timer = null

function submit() {
  notice.value = true
  window.clearTimeout(timer)
  timer = window.setTimeout(() => (notice.value = false), 2600)
  nextTick(() => inputEl.value?.focus())
}

function useSuggestion(text) {
  draft.value = text
  inputEl.value?.focus()
}
</script>

<template>
  <aside class="chat">
    <!-- 头部 -->
    <header class="chat__head">
      <span class="chat__avatar" aria-hidden="true">
        <AppIcon name="sparkle" :size="17" />
      </span>
      <div class="chat__id">
        <h3 class="chat__name">图纸助手</h3>
        <p class="chat__sub mono">Draft Copilot · 演示版</p>
      </div>
      <span class="chat__state">
        <span class="chat__dot"></span>
        <span class="mono">在线</span>
      </span>
    </header>

    <!-- 当前上下文 -->
    <div class="chat__ctx">
      <AppIcon name="file" :size="13" />
      <span class="mono chat__ctxname">法兰盘装配图.dwg · V3</span>
    </div>

    <!-- 对话 -->
    <div ref="listEl" class="chat__list scroll-thin">
      <div
        v-for="(m, i) in chatMessages"
        :key="i"
        class="msg"
        :class="m.role === 'user' ? 'msg--user' : 'msg--bot'"
      >
        <div class="msg__bubble">
          <p class="msg__text">{{ m.text }}</p>
          <ul v-if="m.points" class="msg__points">
            <li v-for="(p, j) in m.points" :key="j">{{ p }}</li>
          </ul>
        </div>
        <span class="msg__time mono">{{ m.time }}</span>
      </div>
    </div>

    <!-- 快捷提问 -->
    <div class="chat__chips">
      <button
        v-for="(s, i) in chatSuggestions"
        :key="i"
        class="chip"
        type="button"
        @click="useSuggestion(s)"
      >
        {{ s }}
      </button>
    </div>

    <!-- 输入区 -->
    <form class="chat__form" @submit.prevent="submit">
      <textarea
        ref="inputEl"
        v-model="draft"
        class="chat__input scroll-thin"
        rows="2"
        placeholder="描述你的问题，例如：帮我核对键槽尺寸与公差…"
        @keydown.enter.exact.prevent="submit"
      ></textarea>
      <div class="chat__actions">
        <span class="chat__tip mono">Enter 发送 · Shift+Enter 换行</span>
        <button class="btn btn--sm btn--solid chat__send" type="submit">
          <AppIcon name="send" :size="14" />
          发送
        </button>
      </div>
      <transition name="toast">
        <p v-if="notice" class="chat__notice">
          <AppIcon name="info" :size="14" />
          对话功能开发中，当前仅展示界面。
        </p>
      </transition>
    </form>

    <footer class="chat__foot mono">支持 DWG / DXF / STEP / PDF · 数据不出内网</footer>
  </aside>
</template>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0)), var(--paper-2);
  border: 1px solid var(--rule-2);
  box-shadow: var(--shadow-m);
}

/* 头部 */
.chat__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 3px double var(--rule-3);
}
.chat__avatar {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--accent-ink);
  background: var(--accent-3);
  color: var(--accent-ink);
  flex: none;
}
.chat__id {
  min-width: 0;
}
.chat__name {
  font-size: 1rem;
  letter-spacing: 0.08em;
}
.chat__sub {
  font-size: 0.54rem;
}
.chat__state {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.56rem;
  color: var(--ink-3);
}
.chat__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-3);
  animation: pulse 2.4s ease-in-out infinite;
}
@keyframes pulse {
  50% {
    box-shadow: 0 0 0 6px rgba(140, 191, 116, 0.16);
  }
}

/* 上下文 */
.chat__ctx {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-bottom: 1px dashed var(--rule-2);
  color: var(--ink-3);
}
.chat__ctxname {
  font-size: 0.56rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 消息 */
.chat__list {
  flex: 1;
  min-height: 160px;
  max-height: 46vh;
  overflow-y: auto;
  padding: 12px;
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
  padding: 8px 10px;
  border: 1px solid var(--rule-2);
  background: var(--paper);
  font-size: 0.84rem;
  line-height: 1.65;
  color: var(--ink-2);
}
.msg--bot .msg__bubble {
  border-left: 3px solid var(--accent);
}
.msg--user .msg__bubble {
  background: var(--accent-3);
  border-color: var(--accent-2);
  color: var(--ink);
}
.msg__text {
  white-space: pre-line;
}
.msg__points {
  margin: 6px 0 0;
  padding-left: 1.05em;
  font-size: 0.78rem;
  color: var(--ink-3);
}
.msg__time {
  font-size: 0.5rem;
}

/* 快捷提问 */
.chat__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 12px 10px;
}
.chip {
  padding: 4px 8px;
  border: 1px dashed var(--rule-2);
  font-size: 0.72rem;
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

/* 输入 */
.chat__form {
  position: relative;
  padding: 10px 12px;
  border-top: 1px solid var(--rule-2);
  background: var(--paper-3);
}
.chat__input {
  width: 100%;
  resize: none;
  padding: 8px 10px;
  border: 1px solid var(--rule-2);
  background: var(--paper);
  font-family: var(--serif);
  font-size: 0.84rem;
  line-height: 1.6;
  color: var(--ink);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.chat__input:focus {
  border-color: var(--accent-ink);
  box-shadow: 0 0 0 3px var(--accent-3);
}
.chat__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.chat__tip {
  font-size: 0.5rem;
  margin-right: auto;
}
.chat__notice {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 8px;
  border: 1px solid var(--accent-ink);
  background: var(--accent-3);
  color: var(--accent-ink);
  font-size: 0.76rem;
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.chat__foot {
  padding: 6px 12px;
  border-top: 1px solid var(--rule);
  font-size: 0.5rem;
  text-align: center;
}
</style>
