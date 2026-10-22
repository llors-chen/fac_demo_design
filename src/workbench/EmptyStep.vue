<script setup>
/**
 * 空白模板步骤
 *
 * 工单初始为空白：只展示该步骤要填的结构（字段名，无值）。
 * 左侧「一键填写」按钮：点击后填入数据（AI 代填），随后自动走向下一步。
 */
import { computed } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { stepOutline } from './data.js'

const props = defineProps({
  view: { type: String, required: true }, // sales | ae | rd | final
  order: { type: Object, required: true },
  step: { type: Object, default: () => ({}) }, // 当前标准步骤（S1–S5）
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['fill'])

const outline = computed(() => stepOutline[props.view] || { title: '空白模板', sections: [] })
const nextStep = computed(() => props.step?.next || null)
</script>

<template>
  <div class="blank">
    <!-- 空白模板 -->
    <section class="pane">
      <header class="pane__head">
        <AppIcon name="file" :size="15" />
        <h3 class="pane__title">{{ outline.title }}</h3>
        <span class="pane__sub mono">{{ order.id }} · 未填写</span>
      </header>

      <p class="pane__hint">{{ outline.hint }}</p>

      <div class="sections">
        <section v-for="s in outline.sections" :key="s.name" class="sec">
          <header class="sec__head">
            <h4 class="sec__name">{{ s.name }}</h4>
            <span class="sec__state mono">空</span>
          </header>
          <ul class="sec__fields">
            <li v-for="f in s.fields" :key="f" class="fld">
              <span class="fld__label mono">{{ f }}</span>
              <span class="fld__value"></span>
            </li>
          </ul>
        </section>
      </div>
    </section>

    <!-- 左侧动作区 -->
    <aside class="side">
      <div class="fillbox">
        <span class="fillbox__label mono">本步骤操作</span>
        <button class="fill" type="button" :disabled="busy" @click="emit('fill')">
          <AppIcon name="sparkle" :size="15" />
          {{ busy ? '正在填写…' : '一键填写' }}
        </button>
        <p class="fillbox__note">
          由 AI 依据客户原话、附件与平台标准自动填入本步骤；填写完成后自动流转到下一步。
        </p>
        <p v-if="nextStep" class="fillbox__next mono">
          下一步 → {{ nextStep.code }} {{ nextStep.name }}
        </p>
      </div>

      <div class="tips">
        <span class="tips__label mono">本步骤会产出</span>
        <ul class="tips__list">
          <li v-for="s in outline.sections" :key="s.name">{{ s.name }}（{{ s.fields.length }} 项）</li>
        </ul>
      </div>

      <p class="side__note mono">也可以直接在左侧步骤列表里点「⚡ 一键填写」。</p>
    </aside>
  </div>
</template>

<style scoped>
.blank {
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
.pane__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 9px;
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
  color: var(--warn);
}
.pane__hint {
  margin: 10px 0 12px;
  font-size: 0.8rem;
  color: var(--ink-3);
}
.sections {
  display: grid;
  gap: 10px;
}
.sec {
  border: 1px dashed var(--rule-2);
  border-radius: var(--r-sm);
  background: var(--paper);
}
.sec__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-bottom: 1px dashed var(--rule);
}
.sec__name {
  font-size: 0.82rem;
  color: var(--ink-2);
}
.sec__state {
  margin-left: auto;
  font-size: 0.52rem;
  padding: 1px 7px;
  border-radius: var(--r-pill);
  border: 1px solid var(--rule-2);
  color: var(--ink-4);
}
.sec__fields {
  margin: 0;
  padding: 6px 10px 9px;
  list-style: none;
  display: grid;
  gap: 5px;
}
.fld {
  display: grid;
  grid-template-columns: 13em minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}
.fld__label {
  font-size: 0.58rem;
  color: var(--ink-4);
}
.fld__value {
  height: 22px;
  border-radius: var(--r-xs);
  background: repeating-linear-gradient(
    90deg,
    var(--paper-3) 0 26px,
    transparent 26px 30px
  );
  opacity: 0.7;
}

/* 左侧动作区 */
.side {
  position: sticky;
  top: 74px;
  display: grid;
  gap: 10px;
}
.fillbox,
.tips {
  border: 1px solid var(--rule-2);
  border-radius: var(--r-md);
  background: var(--surface);
  padding: 11px 12px 12px;
}
.fillbox__label,
.tips__label {
  font-size: 0.56rem;
  color: var(--ink-4);
}
.fill {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: var(--r-sm);
  background: var(--accent);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 700;
  transition: filter 0.18s ease, transform 0.18s ease;
}
.fill:hover:not(:disabled) {
  filter: brightness(1.06);
  transform: translateY(-1px);
}
.fill:disabled {
  opacity: 0.6;
}
.fillbox__note {
  margin: 8px 0 0;
  font-size: 0.72rem;
  line-height: 1.65;
  color: var(--ink-3);
}
.fillbox__next {
  margin: 6px 0 0;
  font-size: 0.56rem;
  color: var(--accent-ink);
}
.tips__list {
  margin: 6px 0 0;
  padding-left: 1.05em;
  font-size: 0.74rem;
  line-height: 1.7;
  color: var(--ink-2);
}
.side__note {
  font-size: 0.56rem;
  line-height: 1.6;
  color: var(--ink-4);
}

@media (max-width: 1180px) {
  .blank {
    grid-template-columns: 1fr;
  }
  .side {
    position: static;
  }
}
@media (max-width: 760px) {
  .fld {
    grid-template-columns: 1fr;
    gap: 3px;
  }
}
</style>
