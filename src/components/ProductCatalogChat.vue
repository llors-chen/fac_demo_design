<script setup>
/**
 * 第 02 区 · 产品目录检索 · 图纸与 BOM
 *
 * chatbot 外壳，前置输入：「基于销售的信息检索产品目录，匹配可能的产品并展示图纸 / BOM 信息」
 * 工具 product_catalog_search 分两级检索：
 *   ① 大分类（法兰连接件 / 密封件 / 轴承支撑）
 *   ② 小分类 —— 具体产品（规格 / 材质 / 匹配度 / 库存 / 交期）
 * 选中产品后：**有图纸 / BOM 才展示**（DWG 看图 + 提取 BOM 上载 M3），没有则给出出图申请入口。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import BomPanel from './BomPanel.vue'
import CustomMatchTool from './CustomMatchTool.vue'
import DwgViewer from './DwgViewer.vue'
import { catalogChat, catalogGroups, productBoms } from '../data/site.js'

const nowTime = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const branches = [
  { key: 'catalog', label: '产品目录匹配', hint: '目录内命中标准产品' },
  { key: 'custom', label: '客制化目标匹配', hint: '目录内无匹配 / 需改制' },
]
const activeBranch = ref('catalog')
const activeGroup = ref(catalogGroups[0])
const activeProduct = ref(catalogGroups[0].products[0])
const draft = ref('')
const thinking = ref(false)
const toolFlash = ref(false)
const MAX_ROUNDS = 3
const rounds = ref([
  { q: catalogChat.preInput, a: catalogChat.reply(catalogChat.preInput), time: nowTime() },
])

let replyTimer = null
let flashTimer = null

const allProducts = computed(() => catalogGroups.flatMap((g) => g.products))
const withDwg = computed(() => allProducts.value.filter((p) => p.dwg))
const currentBom = computed(() =>
  activeProduct.value.dwg ? productBoms[activeProduct.value.dwg.bom] || [] : [],
)

function flashTool() {
  toolFlash.value = true
  window.clearTimeout(flashTimer)
  flashTimer = window.setTimeout(() => (toolFlash.value = false), 1100)
}

/** 分支路由：只有需求里明确提到才切换分支，否则保持当前分支 */
function routeBranch(q) {
  if (/客制化|定制|没有匹配|无匹配|改制|拼装|组装/.test(q)) return 'custom'
  if (/目录|标准产品|现货|库存/.test(q)) return 'catalog'
  return null
}

function ask(text) {
  if (thinking.value) return
  const q = (typeof text === 'string' ? text : draft.value).trim() || catalogChat.preInput
  draft.value = ''
  const branch = routeBranch(q)
  if (branch) activeBranch.value = branch
  thinking.value = true
  const round = { q, a: '', time: nowTime() }
  rounds.value.push(round)
  if (rounds.value.length > MAX_ROUNDS) rounds.value.splice(0, rounds.value.length - MAX_ROUNDS)

  window.clearTimeout(replyTimer)
  replyTimer = window.setTimeout(() => {
    round.a = catalogChat.reply(q)
    thinking.value = false
    flashTool()
  }, 900)
}

/** 切换大分类 → 默认选中该类第一个产品 */
function openGroup(group) {
  activeGroup.value = group
  if (group.products[0]) activeProduct.value = group.products[0]
  flashTool()
}

function openProduct(product) {
  activeProduct.value = product
  flashTool()
}

onMounted(() => window.clearTimeout(replyTimer))
onBeforeUnmount(() => {
  window.clearTimeout(replyTimer)
  window.clearTimeout(flashTimer)
})
</script>

<template>
  <section id="catalog-chat" class="catalog">
    <div class="wrap">
      <header class="sec-head">
        <span class="sec-head__no" aria-hidden="true">02</span>
        <div>
          <p class="kicker">研发端 · 产品目录检索</p>
          <h3 class="sec-head__title">先定位大分类，再收敛到产品，最后看图纸与 BOM</h3>
        </div>
        <dl class="sec-head__meta">
          <div><dt class="mono">目录</dt><dd>{{ catalogGroups.length }} 大类</dd></div>
          <div><dt class="mono">命中产品</dt><dd>{{ allProducts.length }} 个</dd></div>
          <div><dt class="mono">有图纸 / BOM</dt><dd>{{ withDwg.length }} 个</dd></div>
        </dl>
      </header>

      <p class="sec-note">
        把第 01 区整理好的需求（含客户附件要点）交给助手，它按两级目录检索：
        <b>大分类</b>（法兰连接件 / 密封件 / 轴承支撑）→ <b>小分类</b>（具体产品，含规格、材质、库存与交期）。
        选中产品后，<b>若有图纸 / BOM 才会展开</b>，可直接看图、提取 BOM 并上载至 M3。
      </p>

      <!-- chatbot 外壳 -->
      <div class="chat-shell corner-box">
        <header class="chat-head">
          <span class="chat-head__avatar" aria-hidden="true">
            <AppIcon name="search" :size="18" />
          </span>
          <div class="chat-head__id">
            <h4 class="chat-head__name">{{ catalogChat.name }}</h4>
            <p class="chat-head__role mono">
              {{ catalogChat.role }} · 已接入产品目录 {{ catalogGroups.length }} 大类 /
              {{ allProducts.length }} 个产品
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
              <p>{{ catalogChat.greeting }}</p>
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
                  已调用工具 {{ catalogChat.toolId }} · 参数 { 需求: "{{ r.q }}" }
                </p>
              </div>
              <span class="msg__time mono">{{ r.time }}</span>
            </div>
          </template>

          <div v-if="thinking" class="msg msg--bot">
            <div class="msg__bubble msg__bubble--typing"><span></span><span></span><span></span></div>
            <span class="msg__time mono">正在检索产品目录…</span>
          </div>

          <!-- 工具视图 -->
          <div class="tool" :class="{ 'is-flash': toolFlash }">
            <div class="tool__head">
              <span class="tool__badge mono">工具</span>
              <AppIcon name="grid" :size="15" />
              <span class="tool__name">{{ catalogChat.toolName }}</span>
              <span class="tool__meta mono">
                {{ catalogGroups.length }} 大类 · {{ allProducts.length }} 产品 ·
                {{ withDwg.length }} 个有图纸
              </span>
            </div>

            <!-- 分支页签：目录命中走 ①，未命中 / 需改制走 ② -->
            <div class="branches">
              <button
                v-for="b in branches"
                :key="b.key"
                class="branch"
                :class="{ 'is-on': activeBranch === b.key }"
                type="button"
                @click="activeBranch = b.key"
              >
                <span class="branch__label">{{ b.label }}</span>
                <span class="branch__hint mono">{{ b.hint }}</span>
              </button>
              <span class="branches__note mono">
                客户需求能在目录里检索到 → 走 ①；检索不到或需改制 → 走 ②
              </span>
            </div>

            <!-- ① 产品目录匹配 -->
            <div v-if="activeBranch === 'catalog'" class="branch-pane">
            <!-- ① 大分类 -->
            <div class="level">
              <span class="level__label mono">① 大分类</span>
              <div class="groups">
                <button
                  v-for="g in catalogGroups"
                  :key="g.key"
                  class="group"
                  :class="{ 'is-on': activeGroup.key === g.key }"
                  type="button"
                  @click="openGroup(g)"
                >
                  <AppIcon :name="g.icon" :size="16" />
                  <span class="group__main">
                    <span class="group__name">{{ g.name }}</span>
                    <span class="group__en mono">{{ g.en }}</span>
                  </span>
                  <span class="group__match mono">{{ g.match }}%</span>
                  <span class="group__n mono">{{ g.products.length }} 个产品</span>
                </button>
              </div>
            </div>

            <!-- ② 小分类：具体产品 -->
            <div class="level">
              <span class="level__label mono">② 小分类 · 具体产品</span>
              <div class="products">
                <button
                  v-for="p in activeGroup.products"
                  :key="p.id"
                  class="product"
                  :class="{ 'is-on': activeProduct.id === p.id }"
                  type="button"
                  @click="openProduct(p)"
                >
                  <span class="product__head">
                    <span class="product__name">{{ p.name }}</span>
                    <span class="product__match mono">{{ p.match }}%</span>
                  </span>
                  <span class="product__code mono">{{ p.code }}</span>
                  <span class="product__spec">{{ p.spec }} · {{ p.material }}</span>
                  <span class="product__foot">
                    <span class="product__stock mono">{{ p.stock }} · {{ p.lead }}</span>
                    <span class="product__doc mono" :class="{ 'is-none': !p.dwg }">
                      {{ p.dwg ? '有图纸 / BOM' : '无图纸' }}
                    </span>
                  </span>
                </button>
              </div>
            </div>

            <!-- ③ 选中产品 → 图纸 / BOM（若有） -->
            <div class="detail">
              <div class="detail__bar">
                <span class="detail__label mono">③ 选中产品</span>
                <span class="detail__name">{{ activeProduct.name }}</span>
                <span class="detail__code mono">{{ activeProduct.code }}</span>
                <span class="detail__why">{{ activeProduct.why }}</span>
                <span class="detail__state mono" :class="{ 'is-none': !activeProduct.dwg }">
                  {{ activeProduct.dwg ? '已关联图纸 / BOM' : '暂无图纸 / BOM' }}
                </span>
              </div>

              <!-- 有图纸：DWG + 提取 BOM（3 : 1） -->
              <div v-if="activeProduct.dwg" class="dwg-row">
                <DwgViewer
                  :key="activeProduct.id"
                  :file-name="activeProduct.dwg.file"
                  :rev="activeProduct.dwg.rev"
                  :sheet="activeProduct.dwg.sheet"
                />
                <BomPanel
                  :key="activeProduct.id + '-bom'"
                  variant="card"
                  title="提取 BOM · 上载至 M3"
                  subtitle="从该产品图纸提取 · 物料主数据"
                  action="提取"
                  :doc-suffix="activeProduct.dwg.suffix"
                  :rows="currentBom"
                  lead="从 DWG 图面的标题栏与明细栏提取零件清单，核对后上载至 M3。"
                  hint="提取依据图面明细栏与图号；上载后写入 M3 物料主数据与版本记录，同名不同版本进入校核队列。"
                />
              </div>

              <!-- 无图纸：空态 -->
              <div v-else class="empty">
                <span class="empty__icon"><AppIcon name="file" :size="22" /></span>
                <p class="empty__title">{{ activeProduct.name }} 暂无现成图纸 / BOM</p>
                <p class="empty__text">
                  该产品为按单生产（{{ activeProduct.stock }} · {{ activeProduct.lead }}）。
                  可提交出图申请，或改用同分类下有图纸的相近产品。
                </p>
                <div class="empty__actions">
                  <button class="btn btn--sm btn--solid" type="button">
                    <AppIcon name="send" :size="13" />
                    提交出图申请
                  </button>
                  <button
                    class="btn btn--sm"
                    type="button"
                    @click="openProduct(activeGroup.products.find((p) => p.dwg) || activeProduct)"
                  >
                    <AppIcon name="refresh" :size="13" />
                    改用相近产品
                  </button>
                </div>
              </div>
            </div>
            </div>
            <!-- /.branch-pane ① 产品目录匹配 -->

            <!-- ② 客制化目标匹配（原第 03 区内容） -->
            <div v-else class="branch-pane">
              <CustomMatchTool />
            </div>
          </div>
        </div>

        <!-- 输入 -->
        <form class="chat-input" @submit.prevent="ask()">
          <div class="chat-input__chips">
            <button
              v-for="(s, i) in catalogChat.suggestions"
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
              placeholder="描述检索条件，例如：DN160 法兰盘有没有现货，交期多久"
              aria-label="描述检索条件"
            />
            <button class="btn btn--sm btn--solid" type="submit">
              <AppIcon name="send" :size="14" />
              发送
            </button>
          </div>
          <p class="chat-input__tip mono">
            演示版本：无论输入什么，都会命中同一批目录产品并打开最匹配的一个
          </p>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.catalog {
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
.sec-note b {
  color: var(--ink-2);
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

/* 分支页签 */
.branches {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 2px 12px;
  border-bottom: 1px solid var(--rule);
  margin-bottom: 12px;
}
.branch {
  display: grid;
  gap: 1px;
  padding: 8px 14px;
  border: 1px solid var(--rule);
  border-radius: var(--r-md) 0 var(--r-md) 0;
  background: var(--surface);
  text-align: left;
  transition: background 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
}
.branch:hover {
  background: var(--accent-3);
  transform: translateY(-1px);
}
.branch.is-on {
  border-color: var(--accent-2);
  background: var(--accent-3);
}
.branch__label {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--ink-2);
}
.branch.is-on .branch__label {
  color: var(--accent-ink);
}
.branch__hint {
  font-size: 0.46rem;
}
.branches__note {
  margin-left: auto;
  font-size: 0.5rem;
  color: var(--ink-4);
  text-align: right;
}
.branch-pane {
  display: block;
}

/* 两级目录 */
.level + .level,
.detail {
  margin-top: 12px;
}
.level__label {
  display: inline-block;
  font-size: 0.54rem;
  padding-bottom: 6px;
}
.groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 8px;
}
.group {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: var(--surface);
  text-align: left;
  transition: background 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
}
.group:hover {
  background: var(--accent-3);
  transform: translateY(-1px);
}
.group.is-on {
  border-color: var(--accent-2);
  background: var(--accent-3);
}
.group__main {
  display: grid;
  gap: 1px;
  min-width: 0;
  flex: 1;
}
.group__name {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--ink);
}
.group__en {
  font-size: 0.46rem;
}
.group__match {
  font-size: 0.76rem;
  color: var(--accent-ink);
  font-weight: 700;
}
.group__n {
  font-size: 0.46rem;
  color: var(--ink-4);
  white-space: nowrap;
}

.products {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 8px;
}
.product {
  display: grid;
  gap: 3px;
  padding: 10px 12px;
  border: 1px solid var(--rule);
  border-bottom: 1px dashed var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: var(--surface);
  text-align: left;
  transition: background 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
}
.product:hover {
  background: var(--accent-3);
  transform: translateY(-1px);
}
.product.is-on {
  border-color: var(--accent-2);
  background: var(--accent-3);
}
.product__head {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.product__name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--ink);
  flex: 1;
}
.product__match {
  font-size: 0.72rem;
  color: var(--accent-ink);
  font-weight: 700;
}
.product__code {
  font-size: 0.48rem;
}
.product__spec {
  font-size: 0.76rem;
  color: var(--ink-3);
}
.product__foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}
.product__stock {
  font-size: 0.46rem;
}
.product__doc {
  margin-left: auto;
  font-size: 0.44rem;
  padding: 1px 6px;
  border-radius: var(--r-pill);
  border: 1px solid var(--accent-2);
  background: var(--accent-3);
  color: var(--accent-ink);
  white-space: nowrap;
}
.product__doc.is-none {
  border-color: var(--rule-2);
  background: var(--paper-3);
  color: var(--ink-4);
}

/* 详情 */
.detail__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 9px 12px;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: var(--paper-2);
}
.detail__label {
  font-size: 0.54rem;
}
.detail__name {
  font-size: 0.94rem;
  font-weight: 700;
}
.detail__code {
  font-size: 0.5rem;
}
.detail__why {
  font-size: 0.76rem;
  color: var(--ink-3);
  flex: 1;
  min-width: 200px;
}
.detail__state {
  font-size: 0.46rem;
  padding: 2px 7px;
  border-radius: var(--r-pill);
  border: 1px solid var(--accent-2);
  background: var(--accent-3);
  color: var(--accent-ink);
  white-space: nowrap;
}
.detail__state.is-none {
  border-color: var(--rule-2);
  background: var(--paper-3);
  color: var(--ink-3);
}

/* 3 : 1 */
.dwg-row {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: clamp(12px, 1.6vw, 22px);
  height: clamp(440px, 74vh, 720px);
  margin-top: 12px;
}

/* 空态 */
.empty {
  display: grid;
  justify-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 26px 18px;
  border: 1px dashed var(--rule-2);
  border-radius: var(--r-md) 0 var(--r-md) 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.4)),
    var(--paper-2);
  text-align: center;
}
.empty__icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border: 1px solid var(--rule-2);
  border-radius: 0 var(--r-sm) 0 var(--r-sm);
  background: var(--paper-3);
  color: var(--ink-3);
}
.empty__title {
  font-size: 1rem;
  font-weight: 700;
}
.empty__text {
  max-width: 62ch;
  font-size: 0.84rem;
  color: var(--ink-3);
  line-height: 1.7;
}
.empty__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 4px;
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
