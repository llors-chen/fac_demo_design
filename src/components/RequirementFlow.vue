<script setup>
/**
 * 01-00 · 流程化 · 销售端工程细节对齐
 *
 * 以报表 500413 / 500425「Customer requirement assessment」的章节为骨架（1 → 2 → 3.1~3.5 → 4 → 5），
 * 把"整理客户需求"的过程逐步展示为对话：
 *   左侧：步骤时间线 + 报表章节导航
 *   右侧：当前步骤的对话 → 报表对应章节（含报表原文填写要求）→ 已填内容 / 清单 / 交接单
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import { engineeringFlow } from '../data/flow.js'

const steps = engineeringFlow.steps
const docs = engineeringFlow.docs
const formSections = engineeringFlow.formSections
const idx = ref(0)
const step = computed(() => steps[idx.value])
const progress = computed(() => Math.round(((idx.value + 1) / steps.length) * 100))

let timer = null
const go = (i) => {
  idx.value = Math.max(0, Math.min(steps.length - 1, i))
}
const next = () => go(idx.value + 1)
const prev = () => go(idx.value - 1)

/** 自动演示：每 2.6s 走一步 */
const playing = ref(false)
function togglePlay() {
  if (playing.value) {
    playing.value = false
    window.clearInterval(timer)
    return
  }
  playing.value = true
  go(0)
  timer = window.setInterval(() => {
    if (idx.value >= steps.length - 1) {
      window.clearInterval(timer)
      playing.value = false
      return
    }
    next()
  }, 2600)
}

/** AE 复核：勾选要询问客户的条目（默认勾选标记为 ask 的行） */
const asked = ref(new Set())
const sent = ref(false)

watch(idx, () => {
  const rows = steps[idx.value]?.review?.rows || []
  asked.value = new Set(rows.filter((r) => r.state === 'ask').map((r) => r.id))
  sent.value = false
})

const askedCount = computed(() => asked.value.size)

function toggleAsk(id) {
  const next = new Set(asked.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  asked.value = next
}

function sendAsk() {
  sent.value = true
}

const totalMinutes = computed(() => {
  const [h1, m1] = steps[0].time.split(':').map(Number)
  const [h2, m2] = steps[steps.length - 1].time.split(':').map(Number)
  return (h2 * 60 + m2 - (h1 * 60 + m1)) | 0
})

onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <section id="req-flow" class="flow">
    <div class="wrap">
      <header class="sec-head">
        <span class="sec-head__no" aria-hidden="true">01-00</span>
        <div>
          <p class="kicker">销售端 × AE · 报表协同与三方确认</p>
          <h3 class="sec-head__title">流程化 · 销售端工程细节对齐</h3>
        </div>
        <dl class="sec-head__meta">
          <div><dt class="mono">报表</dt><dd>500413 / 500425</dd></div>
          <div><dt class="mono">步骤</dt><dd>{{ steps.length }} 步</dd></div>
          <div><dt class="mono">用时</dt><dd>{{ totalMinutes }} 分钟</dd></div>
        </dl>
      </header>

      <p class="sec-note">
        这一区是「系统辅助销售填表 → AE 二次复核 → 三方确认」：
        系统读客户原话与附件，替销售起草并补齐 500413 的每一节；销售逐节确认；
        随后系统把「客户原文」与「销售整理值」并排交给 AE 复核，AE 对不一致/缺失的条目点按钮勾选「询问客户」，
        由系统合并成一条确认单发给客户；客户答复自动回填。最后输出一张
        <b>客户 / 销售 / AE 三方都已确认</b>的对齐确认单并冻结需求基线——系统全程负责融合与留痕。
      </p>

      <!-- 资料条 -->
      <div class="docs">
        <span class="docs__label mono">参考资料</span>
        <span v-for="d in docs" :key="d.code" class="doc">
          <AppIcon name="file" :size="13" />
          <b class="mono">{{ d.code }}</b>
          <span class="doc__name">{{ d.name }}</span>
          <em class="doc__meta mono">{{ d.meta }}</em>
        </span>
      </div>

      <div class="flow__body">
        <!-- 左：步骤 + 报表结构 -->
        <aside class="rail">
          <div class="rail__head">
            <span class="mono">流程步骤</span>
            <button class="btn btn--sm" type="button" @click="togglePlay">
              <AppIcon :name="playing ? 'minus' : 'arrowRight'" :size="13" />
              {{ playing ? '暂停演示' : '自动演示' }}
            </button>
          </div>

          <ol class="steps">
            <li v-for="(s, i) in steps" :key="s.no">
              <button
                class="step"
                :class="{ 'is-on': i === idx, 'is-done': i < idx }"
                type="button"
                @click="go(i)"
              >
                <span class="step__dot">
                  <AppIcon v-if="i < idx" name="check" :size="11" />
                  <span v-else class="step__no mono">{{ s.no }}</span>
                </span>
                <span class="step__main">
                  <span class="step__title">{{ s.title }}</span>
                  <span class="step__meta mono">{{ s.time }} · {{ s.owner }}</span>
                </span>
                <span v-if="s.form" class="step__form mono">{{ s.form.code }}</span>
              </button>
            </li>
          </ol>

          <div class="rail__form">
            <span class="mono">报表结构 500413</span>
            <ul class="fs">
              <li v-for="f in formSections" :key="f.no" class="fs__item">
                <span class="fs__no mono">{{ f.no }}</span>
                <span class="fs__body">
                  <span class="fs__title">{{ f.title }}<em class="fs__zh">{{ f.zh }}</em></span>
                  <span v-if="f.subs" class="fs__subs">
                    <span v-for="sub in f.subs" :key="sub.no" class="fs__sub">
                      {{ sub.no }} {{ sub.title }}
                    </span>
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </aside>

        <!-- 右：当前步骤 -->
        <div class="stage corner-box">
          <header class="stage__head">
            <span class="stage__no">{{ step.no }}</span>
            <div class="stage__id">
              <h4 class="stage__title">{{ step.title }}</h4>
              <p class="stage__meta mono">{{ step.time }} · 负责：{{ step.owner }}</p>
            </div>
            <span class="stage__progress mono">{{ idx + 1 }} / {{ steps.length }} · {{ progress }}%</span>
            <div class="stage__nav">
              <button class="btn btn--sm" type="button" :disabled="idx === 0" @click="prev">
                <AppIcon name="chevronLeft" :size="13" />
                上一步
              </button>
              <button
                class="btn btn--sm"
                type="button"
                :disabled="idx === steps.length - 1"
                @click="next"
              >
                下一步
                <AppIcon name="chevronRight" :size="13" />
              </button>
            </div>
          </header>

          <!-- 对话 -->
          <div class="thread">
            <div
              v-for="(m, i) in step.messages"
              :key="i"
              class="turn"
              :class="'turn--' + m.role"
            >
              <span class="turn__avatar mono">
                {{ m.role === 'sales' ? '销' : m.role === 'eng' ? '研' : '系' }}
              </span>
              <div class="turn__body">
                <span class="turn__who mono">{{ m.name }}</span>
                <div class="turn__bubble"><p>{{ m.text }}</p></div>
              </div>
            </div>
          </div>

          <!-- 报表章节 -->
          <div v-if="step.form" class="form">
            <header class="form__head">
              <span class="form__badge mono">{{ step.form.code }}</span>
              <span class="form__section">{{ step.form.section }}</span>
              <span class="form__state mono">已填 · 待客户确认</span>
            </header>
            <p class="form__hint mono">报表填写要求：{{ step.form.hint }}</p>
            <dl class="form__rows">
              <div v-for="f in step.form.fields" :key="f[0]" class="form__row">
                <dt class="mono">{{ f[0] }}</dt>
                <dd>{{ f[1] }}</dd>
              </div>
            </dl>
          </div>

          <!-- AE 复核：原文 vs 销售报表逐条对照 -->
          <div v-if="step.review" class="review">
            <header class="review__head">
              <span class="review__badge mono">AE 复核</span>
              <span class="review__title">客户原文 vs 销售整理值 · 逐条二次确认</span>
              <span class="review__hint mono">{{ step.review.hint }}</span>
            </header>

            <table class="rtable">
              <thead>
                <tr>
                  <th>字段</th>
                  <th>客户原文</th>
                  <th>销售整理值</th>
                  <th>AE 结论</th>
                  <th class="rtable__act">处理</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in step.review.rows" :key="r.id" :class="'is-' + r.state">
                  <td class="rtable__field mono">{{ r.field }}</td>
                  <td class="rtable__cust">{{ r.customer }}</td>
                  <td class="rtable__sales">{{ r.sales }}</td>
                  <td class="rtable__ae">{{ r.ae }}</td>
                  <td class="rtable__act">
                    <span v-if="r.state === 'ok'" class="rflag is-ok mono">已确认</span>
                    <button
                      v-else
                      class="rflag rflag--btn mono"
                      :class="{ 'is-asked': asked.has(r.id) }"
                      type="button"
                      @click="toggleAsk(r.id)"
                    >
                      {{ asked.has(r.id) ? '✓ 询问客户' : '询问客户' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="askbox">
              <span class="askbox__label mono">待询问客户（{{ askedCount }}）</span>
              <ul class="askbox__list">
                <li v-for="q in step.review.questions" :key="q.id" :class="{ 'is-on': asked.has(q.rowId) }">
                  {{ q.text }}
                </li>
              </ul>
              <button
                class="btn btn--sm btn--solid"
                type="button"
                :disabled="askedCount === 0 || sent"
                @click="sendAsk"
              >
                <AppIcon name="send" :size="13" />
                {{ sent ? '已发送给客户' : '发送询问（' + askedCount + ' 条）' }}
              </button>
            </div>

            <p v-if="sent" class="review__sent mono">
              ✓ 系统已合并 {{ askedCount }} 个问题，通过微信 + 邮件发给客户（王工），等待答复…
            </p>
          </div>

          <!-- 客户答复回传 -->
          <div v-if="step.answers" class="qa">
            <header class="qa__head">
              <span class="qa__badge mono">客户答复</span>
              <span class="qa__title">系统回填 500413</span>
            </header>
            <ul class="qa__list">
              <li v-for="a in step.answers" :key="a.q" class="qa__item">
                <p class="qa__q"><span class="mono qa__tag">问</span>{{ a.q }}</p>
                <p class="qa__a"><span class="mono qa__tag qa__tag--a">答</span>{{ a.a }}</p>
              </li>
            </ul>
          </div>

          <!-- 三方对齐确认单 -->
          <div v-if="step.confirm" class="confirm">
            <header class="confirm__head">
              <span class="confirm__badge mono">三方确认</span>
              <span class="confirm__title">{{ step.confirm.title }}</span>
              <span class="confirm__stamp mono">{{ step.confirm.stamp }}</span>
            </header>
            <p class="confirm__hint">{{ step.confirm.hint }}</p>

            <table class="ctable">
              <thead>
                <tr>
                  <th>报表章节</th>
                  <th class="ctable__p">客户</th>
                  <th class="ctable__p">销售</th>
                  <th class="ctable__p">AE</th>
                  <th>锁定值</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in step.confirm.rows" :key="r.field">
                  <td class="ctable__field">{{ r.field }}</td>
                  <td class="ctable__p is-cust">{{ r.customer }}</td>
                  <td class="ctable__p">{{ r.sales }}</td>
                  <td class="ctable__p">{{ r.ae }}</td>
                  <td class="ctable__note">{{ r.note }}</td>
                </tr>
              </tbody>
            </table>

            <div class="parties">
              <span v-for="p in step.confirm.parties" :key="p.role" class="party">
                <span class="party__role mono">{{ p.role }}</span>
                <span class="party__name">{{ p.name }}</span>
                <span class="party__state mono">{{ p.status }} · {{ p.time }}</span>
                <AppIcon name="check" :size="13" />
              </span>
            </div>
          </div>

          <!-- 结论清单 -->
          <ul v-if="step.bullets" class="checks">
            <li v-for="b in step.bullets" :key="b.text" class="check" :class="'is-' + b.level">
              <AppIcon :name="b.level === 'ok' ? 'check' : 'info'" :size="13" />
              {{ b.text }}
            </li>
          </ul>

          <!-- 交接单 -->
          <div v-if="step.handoff" class="handoff">
            <span class="handoff__label mono">交接摘要</span>
            <dl class="handoff__grid">
              <div v-for="h in step.handoff" :key="h.label" class="handoff__item">
                <dt class="mono">{{ h.label }}</dt>
                <dd>{{ h.value }}</dd>
              </div>
            </dl>
          </div>

          <!-- 底部进度 -->
          <div class="stage__foot">
            <span class="stage__bar"><i :style="{ width: progress + '%' }"></i></span>
            <span class="mono stage__foot-text">按报表 500413 章节顺序推进</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.flow {
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
  font-size: clamp(1.9rem, 3.4vw, 2.9rem);
  font-weight: 700;
  line-height: 0.85;
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
  max-width: 100ch;
  font-size: 0.9rem;
  color: var(--ink-3);
}

/* 资料条 */
.docs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding: 9px 12px;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: var(--paper-2);
}
.docs__label {
  font-size: 0.52rem;
}
.doc {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-pill);
  background: var(--surface);
  font-size: 0.72rem;
  color: var(--ink-2);
}
.doc b {
  font-size: 0.62rem;
  color: var(--accent-ink);
}
.doc__name {
  color: var(--ink-3);
}
.doc__meta {
  font-size: 0.46rem;
  font-style: normal;
  color: var(--ink-4);
}

/* 主体 */
.flow__body {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: clamp(14px, 2vw, 24px);
  margin-top: 16px;
  align-items: start;
}

/* 左侧时间线 */
.rail {
  display: grid;
  gap: 12px;
}
.rail__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rail__head > span {
  margin-right: auto;
  font-size: 0.52rem;
}
.steps {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 2px;
}
.step {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  width: 100%;
  padding: 7px 8px;
  border: 1px solid transparent;
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  text-align: left;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}
.step:hover {
  background: var(--accent-3);
  transform: translateX(2px);
}
.step.is-on {
  border-color: var(--accent-2);
  background: var(--accent-3);
}
.step.is-done .step__dot {
  color: var(--accent-ink);
  border-color: var(--accent-2);
  background: var(--accent-3);
}
.step__dot {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  flex: none;
  border: 1px solid var(--rule-2);
  border-radius: 50%;
  color: var(--ink-3);
}
.step.is-on .step__dot {
  border-color: var(--accent-ink);
  background: var(--accent);
  color: #fff;
}
.step__no {
  font-size: 0.52rem;
}
.step__main {
  display: grid;
  gap: 1px;
  min-width: 0;
  flex: 1;
}
.step__title {
  font-size: 0.84rem;
  line-height: 1.4;
  color: var(--ink-2);
}
.step.is-on .step__title {
  color: var(--accent-ink);
  font-weight: 700;
}
.step__meta {
  font-size: 0.46rem;
}
.step__form {
  font-size: 0.44rem;
  color: var(--ink-4);
  padding-top: 2px;
}

/* 报表结构 */
.rail__form {
  padding: 10px 12px;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: var(--surface);
}
.rail__form > span {
  display: block;
  font-size: 0.5rem;
  padding-bottom: 7px;
  margin-bottom: 7px;
  border-bottom: 1px dashed var(--rule);
}
.fs {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 7px;
}
.fs__item {
  display: flex;
  gap: 7px;
}
.fs__no {
  font-size: 0.52rem;
  color: var(--accent-ink);
  min-width: 1.6em;
}
.fs__body {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.fs__title {
  font-size: 0.78rem;
  color: var(--ink-2);
}
.fs__zh {
  margin-left: 5px;
  font-size: 0.62rem;
  font-style: normal;
  color: var(--ink-4);
}
.fs__subs {
  display: grid;
  gap: 1px;
  padding-left: 2px;
}
.fs__sub {
  font-size: 0.62rem;
  color: var(--ink-4);
}

/* 右侧舞台 */
.stage {
  padding: 12px 14px 14px;
}
.stage__head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding-bottom: 10px;
  border-bottom: 3px double var(--rule-3);
}
.stage__no {
  display: grid;
  place-items: center;
  min-width: 34px;
  height: 34px;
  padding: 0 8px;
  border-radius: 0 var(--r-sm) 0 var(--r-sm);
  background: var(--ink);
  color: var(--paper);
  font-family: var(--mono);
  font-size: 0.9rem;
}
.stage__id {
  min-width: 0;
  flex: 1;
}
.stage__title {
  font-size: 1.06rem;
  letter-spacing: 0.02em;
}
.stage__meta {
  font-size: 0.5rem;
}
.stage__progress {
  font-size: 0.54rem;
  color: var(--accent-ink);
}
.stage__nav {
  display: flex;
  gap: 6px;
}

/* 对话 */
.thread {
  display: grid;
  gap: 10px;
  padding: 14px 0 4px;
}
.turn {
  display: flex;
  gap: 9px;
  max-width: 90%;
}
.turn--eng {
  margin-left: auto;
  flex-direction: row-reverse;
}
.turn--bot {
  max-width: 96%;
}
.turn__avatar {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  flex: none;
  border: 1px solid var(--accent-2);
  border-radius: 0 var(--r-sm) 0 var(--r-sm);
  background: var(--accent-3);
  color: var(--accent-ink);
  font-size: 0.66rem;
}
.turn--eng .turn__avatar {
  border-color: var(--rule-2);
  background: var(--paper-3);
  color: var(--ink-2);
}
.turn--bot .turn__avatar {
  border-style: dashed;
  border-color: var(--rule-2);
  background: var(--surface);
  color: var(--ink-3);
}
.turn__body {
  display: grid;
  gap: 3px;
  min-width: 0;
}
.turn--eng .turn__body {
  justify-items: end;
}
.turn__who {
  font-size: 0.46rem;
}
.turn__bubble {
  padding: 9px 13px;
  border: 1px solid var(--rule);
  border-radius: var(--r-md) var(--r-md) var(--r-md) 0;
  background: var(--surface);
  font-size: 0.86rem;
  line-height: 1.8;
  color: var(--ink-2);
}
.turn--sales .turn__bubble {
  border-left: 3px solid var(--accent);
}
.turn--eng .turn__bubble {
  border-right: 3px solid var(--ink-2);
  border-radius: var(--r-md) var(--r-md) 0 var(--r-md);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.5)),
    var(--paper-2);
}
.turn--bot .turn__bubble {
  border-style: dashed;
  background: var(--paper-2);
  font-size: 0.82rem;
}

/* 报表章节 */
.form {
  margin-top: 6px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-md) 0 var(--r-md) 0;
  background: var(--surface);
  overflow: hidden;
}
.form__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--rule);
  background: var(--paper-2);
}
.form__badge {
  padding: 2px 8px;
  border-radius: var(--r-pill);
  background: var(--ink);
  color: var(--paper);
  font-size: 0.48rem;
}
.form__section {
  font-size: 0.9rem;
  font-weight: 700;
}
.form__state {
  margin-left: auto;
  font-size: 0.46rem;
  color: var(--accent-ink);
}
.form__hint {
  padding: 8px 12px 0;
  font-size: 0.52rem;
  color: var(--ink-4);
  line-height: 1.6;
}
.form__rows {
  margin: 0;
  padding: 6px 12px 10px;
}
.form__row {
  display: grid;
  grid-template-columns: 10.4em minmax(0, 1fr);
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px dotted var(--rule);
}
.form__row:last-child {
  border-bottom: none;
}
.form__row dt {
  font-size: 0.5rem;
  padding-top: 3px;
}
.form__row dd {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.7;
  color: var(--ink-2);
}

/* 清单 */
.checks {
  display: grid;
  gap: 5px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}
.check {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 7px 10px;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  font-size: 0.8rem;
  line-height: 1.6;
  color: var(--ink-2);
  background: var(--surface);
}
.check.is-ok {
  border-color: var(--accent-2);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.check.is-warn {
  border-color: var(--rule-2);
  background: var(--paper-3);
  color: var(--ink-2);
}
.check.is-risk {
  border-color: var(--rule-2);
  background: var(--paper-2);
  color: var(--ink-3);
}

/* 交接 */
.handoff {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid var(--accent-2);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: var(--accent-3);
}
.handoff__label {
  font-size: 0.5rem;
  color: var(--accent-ink);
}
.handoff__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px 14px;
  margin: 6px 0 0;
}
.handoff__item dt {
  font-size: 0.46rem;
  color: var(--accent-ink);
}
.handoff__item dd {
  margin: 1px 0 0;
  font-size: 0.84rem;
  color: var(--ink);
}

/* 底部进度 */
.stage__foot {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--rule);
}
.stage__bar {
  position: relative;
  flex: 1;
  height: 5px;
  border-radius: var(--r-pill);
  background: var(--paper-4);
  overflow: hidden;
}
.stage__bar i {
  position: absolute;
  inset: 0 auto 0 0;
  background: linear-gradient(90deg, var(--accent-2), var(--accent-ink));
  border-radius: var(--r-pill);
  transition: width 0.3s ease;
}
.stage__foot-text {
  font-size: 0.48rem;
}

@media (max-width: 1080px) {
  .flow__body {
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
  .turn {
    max-width: 100%;
  }
}
/* AE 复核对照表 */
.review {
  margin-top: 10px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-md) 0 var(--r-md) 0;
  background: var(--surface);
  overflow: hidden;
}
.review__head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 9px 12px;
  border-bottom: 1px solid var(--rule);
  background: var(--paper-2);
}
.review__badge {
  padding: 2px 8px;
  border-radius: var(--r-pill);
  background: var(--ink);
  color: var(--paper);
  font-size: 0.48rem;
}
.review__title {
  font-size: 0.9rem;
  font-weight: 700;
}
.review__hint {
  width: 100%;
  font-size: 0.5rem;
  color: var(--ink-3);
  line-height: 1.6;
}
.rtable {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.76rem;
}
.rtable th {
  text-align: left;
  font-weight: 400;
  font-size: 0.46rem;
  letter-spacing: 0.06em;
  color: var(--ink-3);
  padding: 6px 8px;
  border-bottom: 1px solid var(--rule-2);
}
.rtable td {
  padding: 7px 8px;
  border-bottom: 1px dotted var(--rule);
  vertical-align: top;
}
.rtable__field {
  font-size: 0.5rem;
  color: var(--accent-ink);
  white-space: nowrap;
}
.rtable__cust {
  color: var(--ink-3);
  width: 26%;
}
.rtable__sales {
  color: var(--ink);
  width: 24%;
}
.rtable__ae {
  color: var(--ink-2);
  width: 20%;
}
.rtable__act {
  text-align: right;
  white-space: nowrap;
}
.rtable tr.is-ask td {
  background: var(--accent-3);
}
.rflag {
  font-size: 0.46rem;
  padding: 2px 8px;
  border-radius: var(--r-pill);
  border: 1px solid var(--rule-2);
  color: var(--ink-3);
}
.rflag.is-ok {
  border-color: var(--accent-2);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.rflag--btn {
  background: var(--surface);
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}
.rflag--btn:hover {
  border-color: var(--ink);
  color: var(--ink);
}
.rflag--btn.is-asked {
  border-color: var(--ink);
  background: var(--ink);
  color: var(--paper);
}
.askbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border-top: 1px solid var(--rule);
  background: var(--paper-2);
}
.askbox__label {
  font-size: 0.5rem;
  padding-top: 3px;
  white-space: nowrap;
}
.askbox__list {
  flex: 1;
  min-width: 220px;
  margin: 0;
  padding-left: 1.05em;
  font-size: 0.74rem;
  line-height: 1.7;
  color: var(--ink-4);
}
.askbox__list li.is-on {
  color: var(--accent-ink);
  font-weight: 700;
}
.review__sent {
  padding: 8px 12px;
  border-top: 1px dashed var(--rule);
  font-size: 0.5rem;
  color: var(--accent-ink);
}

/* 客户答复 */
.qa {
  margin-top: 10px;
  border: 1px solid var(--accent-2);
  border-radius: var(--r-md) 0 var(--r-md) 0;
  background: var(--accent-3);
  overflow: hidden;
}
.qa__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--accent-2);
}
.qa__badge {
  padding: 2px 8px;
  border-radius: var(--r-pill);
  background: var(--accent-ink);
  color: #fff;
  font-size: 0.48rem;
}
.qa__title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--accent-ink);
}
.qa__list {
  margin: 0;
  padding: 8px 12px 10px;
  list-style: none;
  display: grid;
  gap: 8px;
}
.qa__item {
  display: grid;
  gap: 2px;
}
.qa__q,
.qa__a {
  display: flex;
  gap: 7px;
  font-size: 0.8rem;
  line-height: 1.65;
  color: var(--ink);
}
.qa__tag {
  flex: none;
  font-size: 0.44rem;
  padding: 1px 5px;
  border-radius: var(--r-xs);
  background: var(--paper);
  color: var(--ink-3);
  height: 1.6em;
}
.qa__tag--a {
  background: var(--accent-ink);
  color: #fff;
}
.qa__a {
  color: var(--accent-ink);
}

/* 三方确认单 */
.confirm {
  margin-top: 10px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-md) 0 var(--r-md) 0;
  background: var(--surface);
  overflow: hidden;
}
.confirm__head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 9px 12px;
  border-bottom: 3px double var(--rule-3);
  background: var(--paper-2);
}
.confirm__badge {
  padding: 2px 8px;
  border-radius: var(--r-pill);
  background: var(--ink);
  color: var(--paper);
  font-size: 0.48rem;
}
.confirm__title {
  font-size: 0.94rem;
  font-weight: 700;
}
.confirm__stamp {
  margin-left: auto;
  font-size: 0.5rem;
  color: var(--accent-ink);
  border: 1px solid var(--accent-2);
  border-radius: var(--r-pill);
  background: var(--accent-3);
  padding: 2px 9px;
}
.confirm__hint {
  padding: 8px 12px 0;
  font-size: 0.52rem;
  color: var(--ink-3);
  line-height: 1.7;
}
.ctable {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.76rem;
  margin-top: 6px;
}
.ctable th {
  text-align: left;
  font-weight: 400;
  font-size: 0.46rem;
  letter-spacing: 0.06em;
  color: var(--ink-3);
  padding: 6px 8px;
  border-bottom: 1px solid var(--rule-2);
}
.ctable td {
  padding: 6px 8px;
  border-bottom: 1px dotted var(--rule);
}
.ctable__field {
  color: var(--ink-2);
  white-space: nowrap;
}
.ctable__p {
  text-align: center;
  width: 9%;
  color: var(--accent-ink);
  font-size: 0.66rem;
}
.ctable__p.is-cust {
  color: var(--ink);
}
.ctable__note {
  color: var(--ink-3);
  font-size: 0.68rem;
}
.parties {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border-top: 1px dashed var(--rule);
  background: var(--paper-2);
}
.party {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 10px;
  border: 1px solid var(--accent-2);
  border-radius: var(--r-pill);
  background: var(--surface);
  color: var(--accent-ink);
  font-size: 0.76rem;
}
.party__role {
  font-size: 0.44rem;
  color: var(--ink-3);
}
.party__name {
  font-weight: 700;
  color: var(--ink);
}
.party__state {
  font-size: 0.46rem;
}

</style>
