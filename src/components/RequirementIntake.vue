<script setup>
/**
 * 01 · 销售端 · 客需需求粗整理
 *
 * 业务流程：客户说话 → 销售整理要点 → AE 初判（哪一类产品、还缺什么）
 * 输出是一份"粗"的初判，不填完整表单；详细表单填写在 01-00 按报表 500413 逐节完成。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import { attachmentPoints, attachments, intakeMeta, intakeSample, intakeSteps } from '../data/site.js'

/** 附件类型 → 线性图标 */
const iconOf = (kind) => ({ pdf: 'file', dwg: 'ruler', img: 'grid', doc: 'newspaper' })[kind] || 'file'

const attTotal = computed(() => {
  const mb = (size) => {
    const v = parseFloat(size) || 0
    return /KB/i.test(size) ? v / 1024 : v
  }
  return Math.round(attachments.reduce((s, a) => s + mb(a.size), 0) * 10) / 10
})
const attParsed = computed(() => attachments.filter((a) => a.state.startsWith('已')).length)

const raw = ref(intakeSample)
const stage = ref(3) // 0 客户口述 → 1 销售整理 → 2 AE 初判中 → 3 初判卡
const lastRun = ref('09:28')
const runCount = ref(1)
let timers = []

const nowTime = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 从客户原话里抽取初判所需的关键信息（抽不到就给默认值） */
const rough = computed(() => {
  const t = raw.value || ''
  const g1 = (re) => (t.match(re) || [])[1] || null
  const customer = t.match(/【(.+?)】/)?.[1]

  const voltage = g1(/(\d{2,3})\s*V\b/i)
  const force = g1(/(\d{3,4})\s*N\b/)
  const speed = g1(/(\d+(?:\.\d+)?)\s*mm\/s/i)
  const stroke = g1(/行程\s*(\d+)/)
  const eau = t.match(/EAU\s*(\d+)/i)?.[1] || t.match(/(\d+)\s*套/)?.[1]
  const weeks = g1(/样件\s*(\d+)\s*周/)
  const canopen = /CANopen/i.test(t)
  const posFb = /位置反馈/.test(t)
  const m12 = /M12/i.test(t)
  const ulNo = /UL\s*(?:先|暂)不/.test(t)

  const params =
    [
      voltage && `${voltage} V`,
      force && `${force} N`,
      speed && `${speed} mm/s`,
      stroke && `行程 ${stroke} mm`,
    ]
      .filter(Boolean)
      .join(' / ') || '48 V / 3,500 N / 30 mm/s / 行程 50 mm'

  const changes = [canopen && 'CANopen 控制板', m12 && 'M12 四芯线束', posFb && '绝对位置反馈'].filter(
    Boolean,
  )
  const who = customer ? customer.replace(/·/g, ' · ').trim() : '越野机器人客户（王工）'

  return {
    customer: who,
    icrm: 'iCRM-2026-0451',
    family: '电动推杆（线性执行器）· CAHB 系列',
    scene: 'off-road autonomous robot · steering wheel control',
    params,
    qty: eau ? `EAU ${eau} pcs` : 'EAU 50 pcs',
    lead: weeks ? `样件 ${weeks} 周` : '样件 6 周（待评估）',
    verdict: `可做，倾向 CAHB-22-D2E 基型${changes.length ? `；${changes.length} 处需改（${changes.join(' / ')}）` : ''}`,
    missing: [
      '静态载荷要求（客户只给了额定 / 峰值推力）',
      '环境温度上限：客户说 -20~60 ℃，与平台 -40/+85 ℃ 需确认取舍',
      ulNo ? '认证范围：CE 是、UL 不做 —— 需客户书面确认' : '认证范围：CE / UL 是否都要',
    ],
    bullets: [
      `客户 / 项目：${who}；越野自主机器人转向执行机构换型`,
      '应用：off-road autonomous robot，推杆推方向盘（原手轮机构）',
      `关键参数：${params}`,
      `数量 / 交期：${eau ? `EAU ${eau} pcs` : 'EAU 50 pcs'}；${weeks ? `样件 ${weeks} 周` : '样件 6 周'}；目标单价 ≤ ￥1,850`,
      `定制点：${changes.length ? changes.join('、') : '暂无明确定制点，待 AE 判断'}`,
      `认证 / 其他：${ulNo ? 'CE 即可、UL 暂不做' : '认证待确认'}；户外粉尘泥水、强振动`,
    ],
  }
})

const charCount = computed(() => raw.value.length)

function clearTimers() {
  timers.forEach((t) => window.clearTimeout(t))
  timers = []
}

/** 重新整理：客户口述 → 销售整理 → AE 初判 → 初判卡 */
function run() {
  clearTimers()
  stage.value = 0
  stage.value = 1
  timers.push(window.setTimeout(() => (stage.value = 2), 700))
  timers.push(
    window.setTimeout(() => {
      stage.value = 3
      lastRun.value = nowTime()
      runCount.value += 1
    }, 1500),
  )
}

onMounted(() => clearTimers())
onBeforeUnmount(() => clearTimers())
</script>

<template>
  <section id="req-intake" class="intake">
    <div class="wrap">
      <header class="sec-head">
        <span class="sec-head__no" aria-hidden="true">01</span>
        <div>
          <p class="kicker">销售端 · 客需需求粗整理</p>
          <h3 class="sec-head__title">客户说话 → 销售整理 → AE 初判</h3>
        </div>
        <dl class="sec-head__meta">
          <div><dt class="mono">iCRM</dt><dd>{{ rough.icrm }}</dd></div>
          <div><dt class="mono">初判时间</dt><dd>{{ lastRun }}</dd></div>
          <div><dt class="mono">下一步</dt><dd>01-00 详填表单</dd></div>
        </dl>
      </header>

      <p class="sec-note">
        第一步不做完整表单，只把客户的原话整理成可流转的要点：客户怎么说（原话）→ 销售整理成 6 条要点 →
        AE 凭经验初判产品族、给出初步结论、列出缺失信息。确认「能做 / 要做」之后，才进入
        <a class="sec-link" href="#req-flow">01-00 按报表 500413 逐节详填</a>。
      </p>

      <div class="intake__row">
        <!-- 左：客户原话 -->
        <div class="panel corner-box">
          <header class="panel__head">
            <AppIcon name="mail" :size="15" />
            <h4 class="panel__title">客户原话 · 原始记录</h4>
            <span class="panel__sub mono">可编辑</span>
          </header>

          <textarea v-model="raw" class="raw scroll-thin" rows="10" aria-label="客户原始记录"></textarea>

          <div class="intake__actions">
            <button class="btn btn--sm btn--solid" type="button" @click="run">
              <AppIcon name="sparkle" :size="14" />
              重新整理
            </button>
            <button class="btn btn--sm" type="button" @click="raw = intakeSample">
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
              :class="{ 'is-done': stage > i, 'is-on': stage === i }"
            >
              <span class="trace__dot">
                <AppIcon v-if="stage > i" name="check" :size="11" />
              </span>
              {{ s }}
            </li>
          </ol>
        </div>

        <!-- 右：三段对话 + AE 初判卡 -->
        <div class="panel panel--chat corner-box">
          <header class="panel__head">
            <span class="panel__avatar"><AppIcon name="users" :size="17" /></span>
            <h4 class="panel__title">需求粗整理 · 三段对话</h4>
            <span class="panel__sub mono">第 {{ runCount }} 次 · {{ lastRun }}</span>
          </header>

          <div class="stream">
            <!-- ① 客户口述 -->
            <div class="turn turn--cust">
              <span class="turn__avatar mono">客</span>
              <div class="turn__body">
                <span class="turn__who mono">客户 · 王工（微信语音转写）</span>
                <div class="turn__bubble">
                  <p class="turn__raw">{{ raw }}</p>
                </div>
              </div>
            </div>

            <!-- ② 销售整理 -->
            <div v-if="stage >= 1" class="turn turn--sales">
              <span class="turn__avatar mono">销</span>
              <div class="turn__body">
                <span class="turn__who mono">销售 · 陈工 · 09:20</span>
                <div class="turn__bubble">
                  <p>我把客户的话拆成 6 条，你看下有没有理解偏的：</p>
                  <ul class="turn__list">
                    <li v-for="b in rough.bullets" :key="b">{{ b }}</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- ③ AE 初判 -->
            <div v-if="stage === 2" class="turn turn--ae">
              <span class="turn__avatar mono">AE</span>
              <div class="turn__body">
                <span class="turn__who mono">AE · 李工</span>
                <div class="turn__bubble turn__bubble--typing"><span></span><span></span><span></span></div>
              </div>
            </div>
            <div v-else-if="stage >= 3" class="turn turn--ae">
              <span class="turn__avatar mono">AE</span>
              <div class="turn__body">
                <span class="turn__who mono">AE · 李工 · 09:28</span>
                <div class="turn__bubble">
                  <p>
                    方向没问题，属于 <b>CAHB 系列电动推杆</b>。先给个初判：能做，倾向
                    <b>CAHB-22-D2E</b> 基型（48 V / 3,500 N / 37 mm/s / 行程 50）。
                  </p>
                  <p class="turn__ask">但要填 500413 还缺 3 项，需要你跟客户确认：</p>
                  <ul class="turn__list turn__list--ask">
                    <li v-for="m in rough.missing" :key="m">{{ m }}</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- ④ AE 初判卡（粗） -->
            <div v-if="stage >= 3" class="rough">
              <header class="rough__head">
                <span class="rough__badge mono">AE 初判</span>
                <span class="rough__no mono">{{ intakeMeta.no }}</span>
                <span class="rough__state mono">粗整理 · 待详细表单确认</span>
              </header>
              <dl class="rough__body">
                <div class="rough__row">
                  <dt class="mono">客户 / iCRM</dt>
                  <dd>{{ rough.customer }} · {{ rough.icrm }}</dd>
                </div>
                <div class="rough__row">
                  <dt class="mono">产品族</dt>
                  <dd>{{ rough.family }}</dd>
                </div>
                <div class="rough__row">
                  <dt class="mono">应用</dt>
                  <dd>{{ rough.scene }}</dd>
                </div>
                <div class="rough__row">
                  <dt class="mono">关键参数 <em class="rough__flag">口述</em></dt>
                  <dd>{{ rough.params }}</dd>
                </div>
                <div class="rough__row">
                  <dt class="mono">数量 / 交期</dt>
                  <dd>{{ rough.qty }} · {{ rough.lead }}</dd>
                </div>
                <div class="rough__row">
                  <dt class="mono">初步结论</dt>
                  <dd class="rough__ok">{{ rough.verdict }}</dd>
                </div>
                <div class="rough__row">
                  <dt class="mono">缺失信息</dt>
                  <dd>
                    <ul class="rough__missing">
                      <li v-for="m in rough.missing" :key="m">{{ m }}</li>
                    </ul>
                  </dd>
                </div>
              </dl>
              <footer class="rough__foot">
                <button class="btn btn--sm" type="button">
                  <AppIcon name="download" :size="13" />
                  导出初判
                </button>
                <a class="btn btn--sm btn--solid" href="#req-flow">
                  <AppIcon name="arrowRight" :size="13" />
                  进入 01-00 逐节详填
                </a>
                <span class="rough__hint mono">粗整理到此为止 · 详细表单见 01-00</span>
              </footer>
            </div>
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
          <span class="attach__hint mono">附件要点会随初判一起流转给 01-00 详填与后续检索</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.intake {
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
  max-width: 100ch;
  font-size: 0.9rem;
  color: var(--ink-3);
}
.sec-link {
  color: var(--accent-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
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

/* 原始记录 */
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

/* 三段对话 */
.stream {
  display: grid;
  gap: 12px;
  align-content: start;
}
.turn {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 9px;
}
.turn__avatar {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--rule-2);
  border-radius: 0 var(--r-sm) 0 var(--r-sm);
  background: var(--paper-3);
  color: var(--ink-2);
  font-size: 0.62rem;
  margin-top: 14px;
}
.turn--sales .turn__avatar {
  border-color: var(--accent-2);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.turn--ae .turn__avatar {
  border-color: var(--ink);
  background: var(--ink);
  color: var(--paper);
}
.turn__body {
  display: grid;
  gap: 3px;
  min-width: 0;
}
.turn__who {
  font-size: 0.48rem;
}
.turn__bubble {
  padding: 10px 13px;
  border: 1px solid var(--rule);
  border-radius: var(--r-md) var(--r-md) var(--r-md) 0;
  background: var(--surface);
  font-size: 0.88rem;
  line-height: 1.8;
  color: var(--ink-2);
}
.turn--cust .turn__bubble {
  background: var(--paper-2);
  border-style: dashed;
}
.turn--sales .turn__bubble {
  border-left: 3px solid var(--accent);
}
.turn--ae .turn__bubble {
  border-left: 3px solid var(--ink);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.55)),
    var(--paper-2);
}
.turn__raw {
  white-space: pre-line;
  font-size: 0.84rem;
}
.turn__list {
  margin: 6px 0 0;
  padding-left: 1.1em;
  font-size: 0.82rem;
  color: var(--ink-3);
  display: grid;
  gap: 3px;
}
.turn__list--ask {
  color: var(--accent-ink);
}
.turn__ask {
  margin-top: 8px;
  font-size: 0.84rem;
}
.turn__bubble--typing {
  display: inline-flex;
  gap: 5px;
  padding: 14px 16px;
}
.turn__bubble--typing span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ink-3);
  animation: typing 1.2s ease-in-out infinite;
}
.turn__bubble--typing span:nth-child(2) {
  animation-delay: 0.16s;
}
.turn__bubble--typing span:nth-child(3) {
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

/* AE 初判卡 */
.rough {
  border: 1px solid var(--rule-2);
  border-radius: var(--r-md) 0 var(--r-md) 0;
  background: var(--surface);
  box-shadow: var(--shadow-s);
  overflow: hidden;
}
.rough__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-bottom: 3px double var(--rule-3);
  background: var(--paper-2);
}
.rough__badge {
  padding: 2px 8px;
  border-radius: var(--r-pill);
  background: var(--ink);
  color: var(--paper);
  font-size: 0.48rem;
}
.rough__no {
  font-size: 0.64rem;
}
.rough__state {
  margin-left: auto;
  padding: 2px 8px;
  border: 1px solid var(--accent-2);
  border-radius: var(--r-pill);
  background: var(--accent-3);
  color: var(--accent-ink);
  font-size: 0.46rem;
}
.rough__body {
  margin: 0;
  padding: 6px 12px 8px;
}
.rough__row {
  display: grid;
  grid-template-columns: 8.2em minmax(0, 1fr);
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px dotted var(--rule);
}
.rough__row:last-child {
  border-bottom: none;
}
.rough__row dt {
  font-size: 0.5rem;
  padding-top: 3px;
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-wrap: wrap;
}
.rough__row dd {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.7;
  color: var(--ink-2);
}
.rough__flag {
  font-size: 0.42rem;
  font-style: normal;
  padding: 1px 5px;
  border-radius: var(--r-pill);
  border: 1px solid var(--rule-2);
  color: var(--ink-4);
}
.rough__ok {
  color: var(--accent-ink);
}
.rough__missing {
  margin: 0;
  padding-left: 1.05em;
  font-size: 0.8rem;
  color: var(--ink-3);
  display: grid;
  gap: 2px;
}
.rough__foot {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border-top: 1px solid var(--rule);
  background: var(--paper-3);
}
.rough__hint {
  margin-left: auto;
  font-size: 0.46rem;
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
