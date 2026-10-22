<script setup>
/**
 * S3 · 产品匹配与图纸 / BOM（研发）
 *
 * 独立页面：产品目录匹配结果 + 图纸状态 + BOM 生成与上载 M3。
 * 完成后进入 S4 产能与人力评估。
 */
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { rdMatch } from './data.js'

const props = defineProps({
  order: { type: Object, required: true },
  active: { type: Boolean, default: true },
  step: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['fill'])

const picked = ref(rdMatch.groups[0].products[0].name)
const m3 = ref(false)
const logs = ref([])

const bomWeight = computed(
  () => Math.round(rdMatch.bom.reduce((s, r) => s + r.unit * r.qty, 0) * 100) / 100,
)
const pickedProduct = computed(
  () => rdMatch.groups.flatMap((g) => g.products).find((p) => p.name === picked.value) || {},
)
const dwgCount = computed(() => rdMatch.groups.flatMap((g) => g.products).filter((p) => p.dwg).length)

function upload() {
  m3.value = true
  logs.value = [
    { time: nowTime(), text: 'BOM 已生成 · ' + rdMatch.bom.length + ' 行' },
    { time: nowTime(), text: '已上载 M3 · 单据 BOM-20261021-021' },
    { time: nowTime(), text: '已向浏览器插件派发 M3_BOM_IMPORT，等待回执' },
  ]
}
const nowTime = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <div class="s3">
    <section class="pane">
      <header class="pane__head">
        <AppIcon name="gear" :size="15" />
        <h3 class="pane__title">S3 产品匹配与图纸 / BOM · {{ order.product }}</h3>
        <span class="pane__sub mono">
          命中 {{ rdMatch.groups.length }} 个大分类 · {{ dwgCount }} 个有图纸
        </span>
      </header>

      <!-- 匹配结果 -->
      <div v-for="g in rdMatch.groups" :key="g.name" class="grp">
        <header class="grp__head">
          <h4 class="grp__name">{{ g.name }}</h4>
          <span class="grp__en mono">{{ g.en }}</span>
          <span class="grp__match mono">最高匹配 {{ g.match }}%</span>
        </header>
        <ul class="prods">
          <li v-for="p in g.products" :key="p.name" class="prod" :class="{ 'is-on': picked === p.name }">
            <button class="prod__pick" type="button" :disabled="!active" @click="picked = p.name">
              <span class="prod__name">{{ p.name }}</span>
              <span class="prod__spec mono">{{ p.spec }}</span>
            </button>
            <span class="prod__code mono">{{ p.code }}</span>
            <span class="prod__tag mono">{{ p.stock }}</span>
            <span class="prod__tag mono">{{ p.lead }}</span>
            <span class="prod__match mono" :class="{ 'is-best': p.match >= 94 }">{{ p.match }}%</span>
            <span v-if="p.dwg" class="prod__dwg mono">
              <AppIcon name="ruler" :size="12" />
              图纸
            </span>
            <span v-else class="prod__dwg mono is-none">无图纸</span>
          </li>
        </ul>
      </div>

      <!-- BOM -->
      <div class="bom">
        <header class="bom__head">
          <h4 class="bom__title">BOM · {{ picked }}</h4>
          <span class="bom__meta mono">
            {{ rdMatch.bom.length }} 行 · 合计 ￥{{ bomWeight }} ·
            {{ pickedProduct.code }}
          </span>
          <button class="btn btn--sm btn--solid" type="button" :disabled="!active || m3" @click="upload">
            <AppIcon name="download" :size="13" />
            {{ m3 ? '已上载 M3' : '生成并上载 M3' }}
          </button>
        </header>
        <table class="btable">
          <thead>
            <tr>
              <th>序号</th>
              <th>物料编码</th>
              <th>名称</th>
              <th>数量</th>
              <th>单价</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rdMatch.bom" :key="r.seq">
              <td class="mono">{{ r.seq }}</td>
              <td class="mono">{{ r.code }}</td>
              <td>{{ r.name }}</td>
              <td class="mono">{{ r.qty }}</td>
              <td class="mono">￥{{ r.unit.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 上载回执 -->
      <div v-if="logs.length" class="m3log">
        <span class="m3log__label mono">上载回执</span>
        <ul class="m3log__list">
          <li v-for="(l, i) in logs" :key="i">
            <span class="mono">{{ l.time }}</span>
            {{ l.text }}
          </li>
        </ul>
      </div>

      <footer class="acts">
        <p class="acts__note mono">
          本步骤产出：匹配基型 + 图纸版本 + BOM 单据。完成后进入 S4 产能与人力评估。
        </p>
        <button class="btn btn--sm btn--solid" type="button" :disabled="!active || !m3" @click="emit('fill')">
          <AppIcon name="arrowRight" :size="13" />
          确认匹配 · 进入 S4
        </button>
      </footer>
      <p v-if="!active" class="pane__lock mono">当前不在 S3 步骤，仅供查看</p>
    </section>
  </div>
</template>

<style scoped>
.s3 {
  margin-top: 12px;
}
.pane {
  border: 1px solid var(--rule-2);
  border-radius: var(--r-md);
  background: var(--surface);
  padding: 12px 14px 14px;
}
.pane__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-bottom: 9px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--rule);
  color: var(--ink-3);
}
.pane__title {
  font-size: 0.96rem;
  color: var(--ink);
}
.pane__sub {
  margin-left: auto;
  font-size: 0.58rem;
}
.pane__lock {
  margin-top: 8px;
  font-size: 0.6rem;
  color: var(--warn);
}
.grp {
  border: 1px solid var(--rule);
  border-radius: var(--r-sm);
  overflow: hidden;
  margin-bottom: 10px;
}
.grp__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background: var(--paper-3);
  border-bottom: 1px solid var(--rule);
}
.grp__name {
  font-size: 0.86rem;
}
.grp__en {
  font-size: 0.56rem;
  color: var(--ink-4);
}
.grp__match {
  margin-left: auto;
  font-size: 0.56rem;
  color: var(--accent-ink);
}
.prods {
  margin: 0;
  padding: 0;
  list-style: none;
}
.prod {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 6.4em 3.4em 3.6em 2.6em 4.2em;
  gap: 6px;
  align-items: center;
  padding: 7px 10px;
  border-bottom: 1px dotted var(--rule);
  font-size: 0.76rem;
}
.prod:last-child {
  border-bottom: none;
}
.prod.is-on {
  background: var(--accent-3);
}
.prod__pick {
  display: grid;
  gap: 1px;
  text-align: left;
  min-width: 0;
}
.prod__name {
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--ink);
}
.prod.is-on .prod__name {
  color: var(--accent-ink);
}
.prod__spec {
  font-size: 0.58rem;
  color: var(--ink-4);
}
.prod__code,
.prod__tag,
.prod__match,
.prod__dwg {
  font-size: 0.58rem;
  color: var(--ink-3);
}
.prod__match.is-best {
  color: var(--ok);
  font-weight: 700;
}
.prod__dwg {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--info);
}
.prod__dwg.is-none {
  color: var(--ink-4);
}
.bom {
  border: 1px solid var(--rule);
  border-radius: var(--r-sm);
  overflow: hidden;
}
.bom__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 10px;
  background: var(--paper-3);
  border-bottom: 1px solid var(--rule);
}
.bom__title {
  font-size: 0.86rem;
}
.bom__meta {
  font-size: 0.56rem;
  color: var(--ink-4);
}
.bom__head .btn {
  margin-left: auto;
}
.btable {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.74rem;
}
.btable th {
  text-align: left;
  font-weight: 400;
  font-size: 0.56rem;
  color: var(--ink-4);
  padding: 6px 10px;
  border-bottom: 1px solid var(--rule);
}
.btable td {
  padding: 6px 10px;
  border-bottom: 1px dotted var(--rule);
}
.m3log {
  margin-top: 10px;
  padding: 9px 10px;
  border: 1px solid var(--accent-2);
  border-radius: var(--r-sm);
  background: var(--accent-3);
}
.m3log__label {
  font-size: 0.56rem;
  color: var(--accent-ink);
}
.m3log__list {
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 4px;
  font-size: 0.72rem;
  color: var(--ink-2);
}
.acts {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--rule);
}
.acts__note {
  font-size: 0.62rem;
  color: var(--ink-4);
}
@media (max-width: 760px) {
  .prod {
    grid-template-columns: minmax(0, 1fr) auto;
    row-gap: 2px;
  }
  .btable {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
}
</style>
