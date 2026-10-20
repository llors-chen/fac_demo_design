<script setup>
/**
 * 第 02 区 · 历史图纸检索 · DWG 在线浏览与 BOM
 *
 * chatbot 外壳：前置输入为「基于销售的信息检索历史图纸并展示 dwg 信息」，
 * 助手调用工具 history_drawing_search，把「检索结果 + DWG 在线浏览 + 提取 BOM」作为工具展开。
 * 写死演示：无论输入什么，都会命中同一批历史图纸并打开最匹配的一张。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import BomPanel from './BomPanel.vue'
import DwgViewer from './DwgViewer.vue'
import { drawingChat, drawingHits, dwgBom } from '../data/site.js'

const nowTime = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const activeDoc = ref(drawingHits[0])
const draft = ref('')
const thinking = ref(false)
const toolFlash = ref(false)
const MAX_ROUNDS = 3
const rounds = ref([
  {
    q: drawingChat.preInput,
    a: drawingChat.reply(drawingChat.preInput),
    time: nowTime(),
  },
])

let replyTimer = null
let flashTimer = null

const docCount = computed(() => drawingHits.length)

function ask(text) {
  if (thinking.value) return
  const q = (typeof text === 'string' ? text : draft.value).trim() || drawingChat.preInput
  draft.value = ''
  thinking.value = true
  const round = { q, a: '', time: nowTime() }
  rounds.value.push(round)
  if (rounds.value.length > MAX_ROUNDS) rounds.value.splice(0, rounds.value.length - MAX_ROUNDS)

  window.clearTimeout(replyTimer)
  replyTimer = window.setTimeout(() => {
    round.a = drawingChat.reply(q)
    thinking.value = false
    toolFlash.value = true
    window.clearTimeout(flashTimer)
    flashTimer = window.setTimeout(() => (toolFlash.value = false), 1100)
  }, 900)
}

function openDoc(doc) {
  activeDoc.value = doc
  toolFlash.value = true
  window.clearTimeout(flashTimer)
  flashTimer = window.setTimeout(() => (toolFlash.value = false), 1100)
}

onMounted(() => window.clearTimeout(replyTimer))
onBeforeUnmount(() => {
  window.clearTimeout(replyTimer)
  window.clearTimeout(flashTimer)
})
</script>

<template>
  <section id="dwg-chat" class="dwgchat">
    <div class="wrap">
      <header class="sec-head">
        <span class="sec-head__no" aria-hidden="true">02</span>
        <div>
          <p class="kicker">研发端 · 历史图纸检索</p>
          <h3 class="sec-head__title">基于销售信息，检索历史图纸并展示 DWG 信息</h3>
        </div>
        <dl class="sec-head__meta">
          <div><dt class="mono">检索范围</dt><dd>12,480 张</dd></div>
          <div><dt class="mono">命中</dt><dd>{{ docCount }} 张</dd></div>
          <div><dt class="mono">最高相似度</dt><dd>96%</dd></div>
        </dl>
      </header>

      <p class="sec-note">
        把第 01 区整理好的需求（含客户附件要点）交给助手，它会检索历史图纸库、按相似度排序，
        并把命中的 DWG 图面、BOM 提取与上载 M3 作为工具在对话中展开。
      </p>

      <!-- chatbot 外壳 -->
      <div class="chat-shell corner-box">
        <header class="chat-head">
          <span class="chat-head__avatar" aria-hidden="true">
            <AppIcon name="search" :size="18" />
          </span>
          <div class="chat-head__id">
            <h4 class="chat-head__name">{{ drawingChat.name }}</h4>
            <p class="chat-head__role mono">
              {{ drawingChat.role }} · 已接入图纸库 12,480 张 · 支持 DWG / DXF
            </p>
          </div>
          <span class="chat-head__state">
            <span class="chat-head__dot"></span>
            <span class="mono">在线</span>
          </span>
        </header>

        <div class="chat-stream">
          <div class="msg msg--bot">
            <div class="msg__bubble">
              <p>{{ drawingChat.greeting }}</p>
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
                  已调用工具 {{ drawingChat.toolId }} · 参数 { 需求: "{{ r.q }}" }
                </p>
              </div>
              <span class="msg__time mono">{{ r.time }}</span>
            </div>
          </template>

          <div v-if="thinking" class="msg msg--bot">
            <div class="msg__bubble msg__bubble--typing"><span></span><span></span><span></span></div>
            <span class="msg__time mono">正在检索历史图纸…</span>
          </div>

          <!-- 工具视图 -->
          <div class="tool" :class="{ 'is-flash': toolFlash }">
            <div class="tool__head">
              <span class="tool__badge mono">工具</span>
              <AppIcon name="ruler" :size="15" />
              <span class="tool__name">{{ drawingChat.toolName }}</span>
              <span class="tool__meta mono">
                命中 {{ docCount }} 张 · 当前 {{ activeDoc.code }} {{ activeDoc.rev }}
              </span>
            </div>

            <!-- 检索结果 -->
            <ul class="hits">
              <li v-for="d in drawingHits" :key="d.id">
                <button
                  class="hit"
                  :class="{ 'is-on': activeDoc.id === d.id }"
                  type="button"
                  @click="openDoc(d)"
                >
                  <span class="hit__score mono">{{ d.score }}<em>%</em></span>
                  <span class="hit__main">
                    <span class="hit__name">
                      {{ d.file }}
                      <em class="hit__rev mono">{{ d.rev }}</em>
                    </span>
                    <span class="hit__meta mono">{{ d.code }} · {{ d.sheet }} · {{ d.date }}</span>
                    <span class="hit__why">{{ d.why }}</span>
                  </span>
                  <span class="hit__open mono">{{ activeDoc.id === d.id ? '展示中' : '打开' }}</span>
                  <AppIcon name="chevronRight" :size="14" class="hit__arrow" />
                </button>
              </li>
            </ul>

            <!-- 3 : 1 看图 + 提取 BOM -->
            <div class="dwg-row">
              <DwgViewer :key="activeDoc.id" :file-name="activeDoc.file" :rev="activeDoc.rev" :sheet="activeDoc.sheet" />
              <BomPanel
                variant="card"
                title="提取 BOM · 上载至 M3"
                subtitle="从当前图纸提取 · 物料主数据"
                action="提取"
                :doc-suffix="activeDoc.suffix"
                :rows="dwgBom"
                lead="从 DWG 图面的标题栏与明细栏提取零件清单，核对后上载至 M3。"
                hint="提取依据图面明细栏与图号；上载后写入 M3 物料主数据与版本记录，同名不同版本进入校核队列。"
              />
            </div>
          </div>
        </div>

        <!-- 输入 -->
        <form class="chat-input" @submit.prevent="ask()">
          <div class="chat-input__chips">
            <button
              v-for="(s, i) in drawingChat.suggestions"
              :key="i"
              class="chip"
              type="button"
              @click="ask(s)"
            >
              {{ s }}
            </button>
          </div>
          <div class="chat-input__row">
            <AppIcon name="search" :size="16" />
            <input
              v-model="draft"
              class="chat-input__field"
              type="text"
              placeholder="描述检索条件，例如：找 DN160 法兰盘的历史图纸，看密封面改过没有"
              aria-label="描述检索条件"
            />
            <button class="btn btn--sm btn--solid" type="submit">
              <AppIcon name="send" :size="14" />
              发送
            </button>
          </div>
          <p class="chat-input__tip mono">
            演示版本：无论输入什么，都会检索同一批历史图纸并打开最匹配的一张
          </p>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dwgchat {
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
.chat-head__id {
  min-width: 0;
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
  padding: 10px;
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

/* 检索结果 */
.hits {
  display: grid;
  gap: 4px;
  margin: 10px 0 12px;
  padding: 0;
  list-style: none;
}
.hit {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 9px 12px;
  border: 1px solid transparent;
  border-bottom: 1px dashed var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  text-align: left;
  transition: background 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
}
.hit:hover {
  background: var(--accent-3);
  transform: translateX(2px);
}
.hit.is-on {
  background: var(--accent-3);
  border-color: var(--accent-2);
}
.hit__score {
  display: grid;
  place-items: center;
  width: 46px;
  height: 38px;
  flex: none;
  border: 1px solid var(--accent-2);
  border-radius: 0 var(--r-sm) 0 var(--r-sm);
  background: var(--surface);
  color: var(--accent-ink);
  font-size: 0.9rem;
  font-weight: 700;
}
.hit__score em {
  font-size: 0.46rem;
  font-style: normal;
}
.hit__main {
  display: grid;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.hit__name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--ink);
}
.hit__rev {
  font-size: 0.48rem;
  font-style: normal;
  padding: 1px 5px;
  border-radius: var(--r-pill);
  background: var(--paper-3);
  color: var(--ink-3);
}
.hit__meta {
  font-size: 0.5rem;
}
.hit__why {
  font-size: 0.74rem;
  color: var(--ink-3);
}
.hit__open {
  font-size: 0.5rem;
  color: var(--ink-4);
  white-space: nowrap;
}
.hit.is-on .hit__open {
  color: var(--accent-ink);
}
.hit__arrow {
  color: var(--ink-4);
  flex: none;
}
.hit.is-on .hit__arrow {
  color: var(--accent-ink);
}

/* 3 : 1 */
.dwg-row {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: clamp(12px, 1.6vw, 22px);
  height: clamp(440px, 74vh, 720px);
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

@media (max-width: 980px) {
  .dwg-row {
    grid-template-columns: 1fr;
    height: auto;
  }
  .dwg-row > :first-child {
    height: 62vh;
    min-height: 380px;
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
