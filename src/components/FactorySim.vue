<script setup>
/**
 * 02-00 · 车间模拟 · 产能与人力
 *
 * 4 条流水线 · 200 种库存零件 · 20 种成品 · 人员分布
 * 指标：人工延迟饱和度（vs 推荐系数）、平均成品延迟、人工成本推算、人力时间报表
 * 交互：班次切换（白班 / 夜班）、库存状态筛选、线体高亮
 */
import { computed, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import {
  RECOMMENDED_SATURATION,
  laborRows,
  lines,
  parts,
  productStatusMeta,
  products,
  shifts,
  staffing,
  statusMeta,
} from '../data/factory.js'

const shiftIndex = ref(0)
const shift = computed(() => shifts[shiftIndex.value])

/** 线体：按班次缩放饱和度与产出 */
const lineRows = computed(() =>
  lines.map((l) => {
    const saturation = Math.max(0.35, Math.min(1.15, l.saturation + shift.value.satDelta))
    return {
      ...l,
      saturation,
      output: Math.round(l.output * shift.value.outputFactor),
      delay: Math.round(l.delay * (shiftIndex.value ? 1.45 : 1) * 10) / 10,
      overload: saturation > RECOMMENDED_SATURATION + 0.06,
    }
  }),
)

/** 加权人工延迟饱和度 */
const avgSaturation = computed(() => {
  const total = lineRows.value.reduce((s, l) => s + l.staff, 0)
  return lineRows.value.reduce((s, l) => s + l.saturation * l.staff, 0) / total
})

/** 平均成品延迟（按数量加权） */
const avgProductDelay = computed(() => {
  const qty = products.reduce((s, p) => s + p.qty, 0)
  const delay = products.reduce((s, p) => s + p.delay * p.qty, 0)
  return Math.round((delay / qty) * 10) / 10
})

/** 人力时间报表：按班次缩放工时与单价 */
const labor = computed(() => {
  const rows = laborRows.map((r) => {
    const actual = Math.round(r.actual * shift.value.hourFactor)
    const standard = Math.round(r.standard * shift.value.hourFactor)
    const ot = Math.max(0, actual - standard)
    return {
      ...r,
      standard,
      actual,
      ot,
      cost: Math.round(actual * shift.value.rate),
      efficiency: standard ? Math.round((standard / actual) * 1000) / 10 : 0,
    }
  })
  const total = rows.reduce(
    (acc, r) => ({
      standard: acc.standard + r.standard,
      actual: acc.actual + r.actual,
      ot: acc.ot + r.ot,
      cost: acc.cost + r.cost,
    }),
    { standard: 0, actual: 0, ot: 0, cost: 0 },
  )
  return { rows, total, efficiency: Math.round((total.standard / total.actual) * 1000) / 10 }
})

const totalOutput = computed(() => lineRows.value.reduce((s, l) => s + l.output, 0))
const totalWip = computed(() => lineRows.value.reduce((s, l) => s + l.wip, 0))
const unitLaborCost = computed(() => Math.round((labor.value.total.cost / totalOutput.value) * 100) / 100)

/** 库存零件按状态统计 */
const partStats = computed(() => {
  const base = { ok: 0, warn: 0, short: 0, idle: 0 }
  parts.forEach((p) => (base[p.status] += 1))
  return base
})
const partAlerts = computed(() => parts.filter((p) => p.status === 'short').slice(0, 4))

const partFilter = ref('all')
const filters = [
  { key: 'all', label: '全部' },
  { key: 'short', label: '缺料' },
  { key: 'warn', label: '预警' },
  { key: 'idle', label: '呆滞' },
]
const partCellClass = (p) => [
  'pcell',
  `is-${p.status}`,
  { 'is-dim': partFilter.value !== 'all' && p.status !== partFilter.value },
]

/** 成品：按状态统计 + 平均延迟 */
const productStats = computed(() => {
  const base = { wip: 0, check: 0, stock: 0, ship: 0 }
  products.forEach((p) => (base[p.status] += 1))
  return base
})

/** 人员分布 */
const headcount = computed(() => staffing.reduce((s, x) => s + x.count, 0))
const present = computed(() => staffing.reduce((s, x) => s + x.present, 0))

const pct = (v) => Math.round(v * 100)
const satTone = (v) => (v > RECOMMENDED_SATURATION + 0.06 ? 'hot' : v >= RECOMMENDED_SATURATION ? 'warn' : 'ok')
</script>

<template>
  <section id="factory-sim" class="sim">
    <div class="wrap">
      <header class="sec-head">
        <span class="sec-head__no" aria-hidden="true">02-00</span>
        <div>
          <p class="kicker">工厂模拟 · 产能与人力</p>
          <h3 class="sec-head__title">车间 4 条流水线 · 库存与成品状态 · 人力成本推算</h3>
        </div>
        <dl class="sec-head__meta">
          <div><dt class="mono">流水线</dt><dd>{{ lines.length }} 条</dd></div>
          <div><dt class="mono">库存零件</dt><dd>{{ parts.length }} 种</dd></div>
          <div><dt class="mono">成品</dt><dd>{{ products.length }} 种</dd></div>
        </dl>
      </header>

      <p class="sec-note">
        把车间的"人—机—料"摊在一块看板上：4 条流水线的人工延迟饱和度与推荐系数对照、200 种库存零件与
        20 种成品的状态分布、人员出勤分布，以及由此推算的人工成本与人力时间报表。班次切换会同步影响产出、饱和度与成本。
      </p>

      <!-- 班次 -->
      <div class="shiftbar">
        <span class="mono shiftbar__label">班次</span>
        <div class="shifts">
          <button
            v-for="(s, i) in shifts"
            :key="s.key"
            class="shift"
            :class="{ 'is-on': shiftIndex === i }"
            type="button"
            @click="shiftIndex = i"
          >
            <b>{{ s.label }}</b>
            <em class="mono">{{ s.note }}</em>
          </button>
        </div>
        <span class="mono shiftbar__hint">人工单价 ￥{{ shift.rate }}/h · 数据每 5 分钟刷新</span>
      </div>

      <!-- KPI -->
      <div class="kpis">
        <div class="kpi">
          <span class="kpi__label mono">今日产出</span>
          <span class="kpi__value">{{ totalOutput.toLocaleString() }}<em>pcs</em></span>
          <span class="kpi__sub mono">在制 {{ totalWip }} 单</span>
        </div>
        <div class="kpi kpi--accent">
          <span class="kpi__label mono">人工延迟饱和度</span>
          <span class="kpi__value">{{ pct(avgSaturation) }}<em>%</em></span>
          <span class="kpi__sub mono">推荐系数 {{ pct(RECOMMENDED_SATURATION) }}%</span>
        </div>
        <div class="kpi" :class="{ 'kpi--alert': avgProductDelay > 8 }">
          <span class="kpi__label mono">平均成品延迟</span>
          <span class="kpi__value">{{ avgProductDelay }}<em>h</em></span>
          <span class="kpi__sub mono">目标 ≤ 8 h</span>
        </div>
        <div class="kpi">
          <span class="kpi__label mono">推荐饱和度系数</span>
          <span class="kpi__value">{{ RECOMMENDED_SATURATION.toFixed(2) }}</span>
          <span class="kpi__sub mono">按瓶颈工序反推</span>
        </div>
        <div class="kpi">
          <span class="kpi__label mono">人工成本推算</span>
          <span class="kpi__value">￥{{ labor.total.cost.toLocaleString() }}</span>
          <span class="kpi__sub mono">单件 ￥{{ unitLaborCost }}</span>
        </div>
        <div class="kpi">
          <span class="kpi__label mono">人力工时</span>
          <span class="kpi__value">{{ labor.total.actual }}<em>h</em></span>
          <span class="kpi__sub mono">加班 {{ labor.total.ot }} h</span>
        </div>
      </div>

      <!-- 4 条流水线 -->
      <div class="lines">
        <article v-for="l in lineRows" :key="l.key" class="line">
          <header class="line__head">
            <span class="line__key mono">{{ l.key }}</span>
            <div class="line__id">
              <h4 class="line__name">{{ l.name }}</h4>
              <p class="line__meta mono">
                节拍 {{ l.tact }} s/pcs · {{ l.stations }} 工位 · 瓶颈 {{ l.bottleneck }}
              </p>
            </div>
            <span class="line__state mono" :class="'is-' + satTone(l.saturation)">
              {{ l.overload ? '超载' : l.saturation >= RECOMMENDED_SATURATION ? '偏高' : '正常' }}
            </span>
          </header>

          <div class="sat">
            <div class="sat__bar">
              <span class="sat__fill" :class="'is-' + satTone(l.saturation)" :style="{ width: pct(l.saturation) + '%' }"></span>
              <span
                class="sat__mark"
                :style="{ left: pct(RECOMMENDED_SATURATION) + '%' }"
                :title="`推荐系数 ${pct(RECOMMENDED_SATURATION)}%`"
              ></span>
            </div>
            <span class="sat__num mono">{{ pct(l.saturation) }}%</span>
          </div>

          <dl class="line__stats">
            <div><dt class="mono">人工延迟</dt><dd>{{ l.delay }} h</dd></div>
            <div><dt class="mono">产出</dt><dd>{{ l.output }}</dd></div>
            <div><dt class="mono">在制</dt><dd>{{ l.wip }}</dd></div>
            <div><dt class="mono">人员</dt><dd>{{ l.staff }}</dd></div>
          </dl>
        </article>
      </div>

      <!-- 库存零件 + 成品状态 -->
      <div class="mid">
        <div class="card">
          <header class="card__head">
            <AppIcon name="grid" :size="15" />
            <h4 class="card__title">库存零件状态</h4>
            <span class="card__sub mono">{{ parts.length }} 种 · 缺料 {{ partStats.short }} · 预警 {{ partStats.warn }} · 呆滞 {{ partStats.idle }}</span>
          </header>

          <div class="legend">
            <button
              v-for="f in filters"
              :key="f.key"
              class="pill"
              :class="{ 'is-on': partFilter === f.key }"
              type="button"
              @click="partFilter = f.key"
            >
              {{ f.label }}
              <em v-if="f.key !== 'all'" class="mono">{{ partStats[f.key] }}</em>
            </button>
            <span class="legend__scale mono">网格 = {{ parts.length }} 种零件，颜色 = 库存状态</span>
          </div>

          <div class="pgrid">
            <span
              v-for="p in parts"
              :key="p.code"
              :class="partCellClass(p)"
              :title="`${p.code} ${p.name}｜库存 ${p.stock} / 安全 ${p.safety}｜${statusMeta[p.status].label}`"
            ></span>
          </div>

          <div class="pkeys">
            <span v-for="(v, k) in statusMeta" :key="k" class="pkey">
              <i class="pkey__swatch" :class="'is-' + k"></i>{{ v.label }}
            </span>
            <span class="pkeys__note mono">悬停网格查看零件号 / 库存 / 安全库存</span>
          </div>

          <div v-if="partAlerts.length" class="alerts">
            <span class="alerts__label mono">缺料告警</span>
            <ul class="alerts__list">
              <li v-for="p in partAlerts" :key="p.code">
                <b class="mono">{{ p.code }}</b>
                {{ p.name }} · 库存 {{ p.stock }} / 安全 {{ p.safety }} · {{ p.line }} 线
              </li>
            </ul>
          </div>
        </div>

        <div class="card">
          <header class="card__head">
            <AppIcon name="layers" :size="15" />
            <h4 class="card__title">成品状态</h4>
            <span class="card__sub mono">{{ products.length }} 种 · 平均延迟 {{ avgProductDelay }} h</span>
          </header>

          <ul class="plist">
            <li v-for="p in products" :key="p.code" class="prow" :class="'is-' + p.status">
              <span class="prow__code mono">{{ p.code }}</span>
              <span class="prow__name">{{ p.model }}</span>
              <span class="prow__qty mono">×{{ p.qty }}</span>
              <span class="prow__state mono">{{ productStatusMeta[p.status].label }}</span>
              <span class="prow__delay mono" :class="{ 'is-late': p.delay > 8 }">{{ p.delay }} h</span>
            </li>
          </ul>

          <div class="pkeys">
            <span v-for="(v, k) in productStatusMeta" :key="k" class="pkey">
              <i class="pkey__swatch" :class="'is-' + v.tone"></i>{{ v.label }} {{ productStats[k] }}
            </span>
          </div>
        </div>
      </div>

      <!-- 人员分布 + 人力时间报表 -->
      <div class="bottom">
        <div class="card">
          <header class="card__head">
            <AppIcon name="users" :size="15" />
            <h4 class="card__title">人员分布</h4>
            <span class="card__sub mono">在岗 {{ present }} / 编制 {{ headcount }}</span>
          </header>

          <div class="stack">
            <span
              v-for="s in staffing"
              :key="s.key"
              class="stack__seg"
              :class="'is-' + s.color"
              :style="{ width: (s.count / headcount) * 100 + '%' }"
              :title="`${s.label} ${s.count} 人`"
            ></span>
          </div>

          <ul class="staffing">
            <li v-for="s in staffing" :key="s.key" class="srow">
              <i class="srow__dot" :class="'is-' + s.color"></i>
              <span class="srow__label">{{ s.label }}</span>
              <span class="srow__count mono">{{ s.present }}/{{ s.count }}</span>
              <span class="srow__bar"><i :style="{ width: (s.present / s.count) * 100 + '%' }"></i></span>
            </li>
          </ul>

          <p class="card__foot mono">
            缺勤 {{ headcount - present }} 人 · 主要缺口在仓储与设备维护，已由 A 线支援 2 人
          </p>
        </div>

        <div class="card">
          <header class="card__head">
            <AppIcon name="file" :size="15" />
            <h4 class="card__title">人力时间报表</h4>
            <span class="card__sub mono">{{ shift.label }} · 工时 h · 成本 ￥</span>
          </header>

          <table class="ltable">
            <thead>
              <tr>
                <th>线别 / 职能</th>
                <th class="mono">标准</th>
                <th class="mono">实际</th>
                <th class="mono">加班</th>
                <th class="mono">效率</th>
                <th class="mono">人工成本</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in labor.rows" :key="r.key">
                <td>{{ r.name }}</td>
                <td class="mono">{{ r.standard }}</td>
                <td class="mono">{{ r.actual }}</td>
                <td class="mono" :class="{ 'is-ot': r.ot > 8 }">{{ r.ot }}</td>
                <td class="mono">{{ r.efficiency }}%</td>
                <td class="mono">￥{{ r.cost.toLocaleString() }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>合计</td>
                <td class="mono">{{ labor.total.standard }}</td>
                <td class="mono">{{ labor.total.actual }}</td>
                <td class="mono">{{ labor.total.ot }}</td>
                <td class="mono">{{ labor.efficiency }}%</td>
                <td class="mono">￥{{ labor.total.cost.toLocaleString() }}</td>
              </tr>
            </tfoot>
          </table>

          <p class="card__foot mono">
            单件人工成本 ￥{{ unitLaborCost }} · B 线加班 {{ labor.rows[1].ot }} h 为最大项，
            建议把 B 线 2 个工位前置到 A 线空闲时段
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sim {
  padding: clamp(30px, 4.4vw, 64px) 0 0;
}

/* 抬头 */
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

/* 班次 */
.shiftbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding: 9px 12px;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: var(--paper-2);
}
.shiftbar__label {
  font-size: 0.52rem;
}
.shifts {
  display: flex;
  gap: 6px;
}
.shift {
  display: grid;
  gap: 1px;
  padding: 5px 12px;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: var(--surface);
  text-align: left;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.shift b {
  font-size: 0.84rem;
}
.shift em {
  font-size: 0.44rem;
  font-style: normal;
  color: var(--ink-4);
}
.shift:hover {
  background: var(--accent-3);
}
.shift.is-on {
  border-color: var(--accent-2);
  background: var(--accent-3);
}
.shift.is-on b {
  color: var(--accent-ink);
}
.shiftbar__hint {
  margin-left: auto;
  font-size: 0.48rem;
}

/* KPI */
.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  margin-top: 10px;
}
.kpi {
  display: grid;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid var(--rule);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.4)),
    var(--paper-2);
}
.kpi--accent {
  border-color: var(--accent-2);
  background: var(--accent-3);
}
.kpi--alert {
  border-color: var(--ink-2);
}
.kpi__label {
  font-size: 0.48rem;
}
.kpi__value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
}
.kpi__value em {
  margin-left: 3px;
  font-size: 0.6rem;
  font-style: normal;
  font-weight: 400;
  color: var(--ink-3);
}
.kpi--accent .kpi__value {
  color: var(--accent-ink);
}
.kpi__sub {
  font-size: 0.46rem;
}

/* 流水线 */
.lines {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  gap: 8px;
  margin-top: 10px;
}
.line {
  padding: 10px 12px;
  border: 1px solid var(--rule);
  border-radius: var(--r-md) 0 var(--r-md) 0;
  background: var(--surface);
}
.line__head {
  display: flex;
  align-items: center;
  gap: 9px;
}
.line__key {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  flex: none;
  border-radius: 0 var(--r-xs) 0 var(--r-xs);
  background: var(--ink);
  color: var(--paper);
  font-size: 0.74rem;
}
.line__id {
  min-width: 0;
  flex: 1;
}
.line__name {
  font-size: 0.9rem;
  letter-spacing: 0.02em;
}
.line__meta {
  font-size: 0.44rem;
}
.line__state {
  font-size: 0.46rem;
  padding: 2px 7px;
  border-radius: var(--r-pill);
  border: 1px solid var(--rule-2);
  color: var(--ink-3);
  white-space: nowrap;
}
.line__state.is-ok {
  border-color: var(--accent-2);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.line__state.is-warn {
  border-color: var(--rule-2);
  background: var(--paper-3);
  color: var(--ink-2);
}
.line__state.is-hot {
  border-color: var(--ink);
  background: var(--ink);
  color: var(--paper);
}

.sat {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}
.sat__bar {
  position: relative;
  flex: 1;
  height: 8px;
  border-radius: var(--r-pill);
  background: var(--paper-3);
  overflow: visible;
}
.sat__fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: var(--r-pill);
  background: var(--accent);
  transition: width 0.35s ease;
}
.sat__fill.is-warn {
  background: var(--ink-3);
}
.sat__fill.is-hot {
  background: var(--ink);
}
.sat__mark {
  position: absolute;
  top: -4px;
  width: 2px;
  height: 16px;
  background: var(--accent-ink);
  opacity: 0.7;
}
.sat__mark::after {
  content: '';
  position: absolute;
  top: -3px;
  left: -2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-ink);
}
.sat__num {
  font-size: 0.7rem;
  min-width: 3em;
  text-align: right;
  color: var(--ink-2);
}

.line__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin: 10px 0 0;
  padding-top: 8px;
  border-top: 1px dotted var(--rule);
}
.line__stats dt {
  font-size: 0.42rem;
}
.line__stats dd {
  margin: 1px 0 0;
  font-size: 0.84rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* 通用卡片 */
.mid,
.bottom {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 10px;
  margin-top: 10px;
  align-items: start;
}
.card {
  padding: 10px 12px 12px;
  border: 1px solid var(--rule);
  border-radius: var(--r-md) 0 var(--r-md) 0;
  background: var(--surface);
  min-width: 0;
}
.card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-bottom: 8px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--rule);
  color: var(--ink-3);
}
.card__title {
  font-size: 0.94rem;
  letter-spacing: 0.04em;
  color: var(--ink);
}
.card__sub {
  margin-left: auto;
  font-size: 0.48rem;
}
.card__foot {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--rule);
  font-size: 0.5rem;
  line-height: 1.7;
  color: var(--ink-3);
}

/* 零件网格 */
.legend {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 9px;
}
.pill {
  padding: 3px 9px;
  border: 1px solid var(--rule);
  border-radius: var(--r-pill);
  font-size: 0.68rem;
  color: var(--ink-3);
  background: var(--surface);
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.pill em {
  font-size: 0.44rem;
  font-style: normal;
  margin-left: 3px;
  color: var(--ink-4);
}
.pill:hover {
  background: var(--accent-3);
  color: var(--accent-ink);
}
.pill.is-on {
  border-color: var(--accent-2);
  background: var(--accent-3);
  color: var(--accent-ink);
  font-weight: 700;
}
.legend__scale {
  margin-left: auto;
  font-size: 0.46rem;
}

.pgrid {
  display: grid;
  grid-template-columns: repeat(20, minmax(0, 1fr));
  gap: 3px;
}
.pcell {
  display: block;
  aspect-ratio: 1;
  border-radius: 2px;
  background: var(--accent);
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.pcell.is-warn {
  background: var(--ink-3);
}
.pcell.is-short {
  background: var(--ink);
}
.pcell.is-idle {
  background: var(--paper-4);
}
.pcell.is-dim {
  opacity: 0.18;
}
.pcell:hover {
  transform: scale(1.35);
  outline: 1px solid var(--ink);
  outline-offset: 1px;
}

.pkeys {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 9px;
}
.pkey {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.62rem;
  color: var(--ink-3);
}
.pkey__swatch {
  width: 9px;
  height: 9px;
  border-radius: 2px;
  background: var(--accent);
}
.pkey__swatch.is-warn {
  background: var(--ink-3);
}
.pkey__swatch.is-short {
  background: var(--ink);
}
.pkey__swatch.is-idle {
  background: var(--paper-4);
}
.pkeys__note {
  margin-left: auto;
  font-size: 0.44rem;
}

.alerts {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 10px;
  padding: 8px 10px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-sm) 0 var(--r-sm) 0;
  background: var(--paper-2);
}
.alerts__label {
  font-size: 0.48rem;
  color: var(--ink-2);
  padding-top: 2px;
  white-space: nowrap;
}
.alerts__list {
  margin: 0;
  padding-left: 1.05em;
  font-size: 0.72rem;
  line-height: 1.65;
  color: var(--ink-2);
}

/* 成品 */
.plist {
  display: grid;
  gap: 3px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.prow {
  display: grid;
  grid-template-columns: 4.6em minmax(0, 1fr) 3.4em 3.4em 3.2em;
  gap: 6px;
  align-items: center;
  padding: 5px 7px;
  border-bottom: 1px dotted var(--rule);
  border-radius: var(--r-xs) 0 var(--r-xs) 0;
  font-size: 0.74rem;
  transition: background 0.18s ease;
}
.prow:hover {
  background: var(--accent-3);
}
.prow__code {
  font-size: 0.5rem;
  color: var(--ink-3);
}
.prow__name {
  color: var(--ink);
  font-size: 0.76rem;
}
.prow__qty {
  font-size: 0.54rem;
  color: var(--ink-3);
  text-align: right;
}
.prow__state {
  font-size: 0.44rem;
  text-align: center;
  padding: 1px 0;
  border-radius: var(--r-pill);
  border: 1px solid var(--rule-2);
  color: var(--ink-3);
}
.prow.is-stock .prow__state {
  border-color: var(--accent-2);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.prow.is-ship .prow__state {
  border-color: var(--ink-2);
  background: var(--paper-3);
  color: var(--ink-2);
}
.prow__delay {
  font-size: 0.5rem;
  text-align: right;
  color: var(--ink-4);
}
.prow__delay.is-late {
  color: var(--ink);
  font-weight: 700;
}

/* 人员 */
.stack {
  display: flex;
  height: 12px;
  border-radius: var(--r-pill);
  overflow: hidden;
  background: var(--paper-3);
}
.stack__seg {
  height: 100%;
}
.stack__seg.is-accent {
  background: var(--accent);
}
.stack__seg.is-ink {
  background: var(--ink);
}
.stack__seg.is-mid {
  background: var(--ink-3);
}
.stack__seg.is-pale {
  background: var(--paper-4);
}
.staffing {
  display: grid;
  gap: 5px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}
.srow {
  display: grid;
  grid-template-columns: 9px minmax(0, 1fr) auto 76px;
  gap: 8px;
  align-items: center;
  font-size: 0.74rem;
}
.srow__dot {
  width: 9px;
  height: 9px;
  border-radius: 2px;
  background: var(--accent);
}
.srow__dot.is-ink {
  background: var(--ink);
}
.srow__dot.is-mid {
  background: var(--ink-3);
}
.srow__dot.is-pale {
  background: var(--paper-4);
}
.srow__label {
  color: var(--ink-2);
}
.srow__count {
  font-size: 0.56rem;
  color: var(--ink-3);
}
.srow__bar {
  position: relative;
  height: 5px;
  border-radius: var(--r-pill);
  background: var(--paper-3);
  overflow: hidden;
}
.srow__bar i {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--ink-3);
  border-radius: var(--r-pill);
}

/* 报表 */
.ltable {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.74rem;
}
.ltable th {
  text-align: left;
  font-weight: 400;
  font-size: 0.46rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
  padding: 5px 6px;
  border-bottom: 1px solid var(--rule-2);
}
.ltable td {
  padding: 6px;
  border-bottom: 1px dotted var(--rule);
  white-space: nowrap;
}
.ltable td:not(:first-child) {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.ltable td.is-ot {
  font-weight: 700;
  color: var(--ink);
}
.ltable tfoot td {
  border-bottom: none;
  border-top: 3px double var(--rule-3);
  font-weight: 700;
  padding-top: 7px;
  color: var(--accent-ink);
}

@media (max-width: 1080px) {
  .mid,
  .bottom {
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
@media (max-width: 640px) {
  .pgrid {
    grid-template-columns: repeat(10, minmax(0, 1fr));
  }
}
</style>
