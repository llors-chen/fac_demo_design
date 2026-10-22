<script setup>
/**
 * 新建工单
 *
 * 在指定客户下新建一张工单；工单号自动生成（WO-YYYYMMDD-NNN）。
 * 新工单进入 S1 需求接收与建档，并自动生成 R01 需求版本。
 */
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { nextOrderId } from './store.js'

const props = defineProps({
  customer: { type: Object, required: true },
  customers: { type: Array, required: true },
})
const emit = defineEmits(['create', 'cancel'])

const form = ref({
  title: '',
  product: '',
  qty: 'EAU 50 pcs',
  due: '样件 8 周',
  priority: props.customer.priority || '中',
  owner: props.customer.owner || '销售 · 陈工',
  note: '',
})

const previewId = computed(() => nextOrderId(props.customers))
const canSubmit = computed(() => !!form.value.title.trim())
</script>

<template>
  <div class="nf">
    <section class="pane">
      <header class="pane__head">
        <AppIcon name="plus" :size="15" />
        <h3 class="pane__title">新建工单</h3>
        <span class="pane__sub mono">工单号 {{ previewId }}（自动生成）</span>
      </header>

      <p class="belong mono">
        所属客户：<b>{{ customer.customer }}</b> · {{ customer.contact }} · 当前
        {{ customer.orders.length }} 张工单
      </p>

      <div class="grid">
        <label class="field field--wide">
          <span class="field__label mono">工单标题 <em>*</em></span>
          <input v-model="form.title" class="field__input" placeholder="例：转向推杆 · CANopen 定制" />
        </label>
        <label class="field">
          <span class="field__label mono">产品 / 型号</span>
          <input v-model="form.product" class="field__input" placeholder="例：CAHB-22-D2E · CANopen 定制" />
        </label>
        <label class="field">
          <span class="field__label mono">数量</span>
          <input v-model="form.qty" class="field__input" />
        </label>
        <label class="field">
          <span class="field__label mono">交期</span>
          <input v-model="form.due" class="field__input" />
        </label>
        <label class="field">
          <span class="field__label mono">优先级</span>
          <select v-model="form.priority" class="field__input">
            <option>高</option>
            <option>中</option>
            <option>低</option>
          </select>
        </label>
        <label class="field">
          <span class="field__label mono">跟进人</span>
          <input v-model="form.owner" class="field__input" />
        </label>
        <label class="field field--wide">
          <span class="field__label mono">需求摘要 / 备注</span>
          <input v-model="form.note" class="field__input" placeholder="例：48 V · 3,500 N · 行程 50 · CANopen" />
        </label>
      </div>

      <footer class="acts">
        <p class="acts__note mono">
          创建后生成工单 {{ previewId }}，进入 S1 需求接收与建档（含 R01 需求版本）。
        </p>
        <div class="acts__right">
          <button class="btn btn--sm" type="button" @click="emit('cancel')">取消</button>
          <button class="btn btn--sm btn--solid" type="button" :disabled="!canSubmit" @click="emit('create', form)">
            <AppIcon name="check" :size="13" />
            创建工单
          </button>
        </div>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.nf {
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
  margin-bottom: 12px;
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
  color: var(--accent-ink);
}
.belong {
  margin: 0 0 12px;
  padding: 8px 10px;
  border: 1px solid var(--accent-2);
  border-radius: var(--r-sm);
  background: var(--accent-3);
  font-size: 0.7rem;
  color: var(--ink-2);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}
.field {
  display: grid;
  gap: 4px;
}
.field--wide {
  grid-column: 1 / -1;
}
.field__label {
  font-size: 0.56rem;
  color: var(--ink-4);
}
.field__label em {
  font-style: normal;
  color: var(--danger);
}
.field__input {
  padding: 7px 9px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-xs);
  background: var(--paper);
  font-family: inherit;
  font-size: 0.8rem;
  color: var(--ink);
  outline: none;
}
.field__input:focus {
  border-color: var(--accent);
  background: var(--surface);
  box-shadow: 0 0 0 3px var(--accent-3);
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
  font-size: 0.6rem;
  color: var(--ink-4);
}
.acts__right {
  display: flex;
  gap: 6px;
}
</style>
