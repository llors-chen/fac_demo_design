<script setup>
/**
 * 新建工单
 *
 * 一张工单可挂多个客户；这里创建工单并可同时录入第一个客户。
 * 工单号自动生成（WO-YYYYMMDD-NNN）。
 */
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { nextOrderId } from './store.js'

const props = defineProps({
  orders: { type: Array, required: true },
})
const emit = defineEmits(['create', 'cancel'])

const form = ref({
  title: '',
  owner: '销售 · 陈工',
  priority: '中',
  note: '',
  withCustomer: true,
  customer: {
    customer: '',
    contact: '',
    product: '',
    qty: 'EAU 50 pcs',
    due: '样件 8 周',
    note: '',
  },
})

const previewId = computed(() => nextOrderId(props.orders))
const canSubmit = computed(
  () => form.value.title.trim() && (!form.value.withCustomer || form.value.customer.customer.trim()),
)

function submit() {
  if (!canSubmit.value) return
  emit('create', {
    title: form.value.title.trim(),
    owner: form.value.owner,
    priority: form.value.priority,
    note: form.value.note.trim(),
    customer: form.value.withCustomer
      ? {
          customer: form.value.customer.customer.trim(),
          contact: form.value.customer.contact.trim(),
          product: form.value.customer.product.trim() || '待定',
          qty: form.value.customer.qty.trim() || '待定',
          due: form.value.customer.due.trim() || '待定',
          note: form.value.customer.note.trim() || '客户首次提出需求',
        }
      : null,
  })
}
</script>

<template>
  <div class="nf">
    <section class="pane">
      <header class="pane__head">
        <AppIcon name="plus" :size="15" />
        <h3 class="pane__title">新建工单</h3>
        <span class="pane__sub mono">工单号 {{ previewId }}（自动生成）</span>
      </header>

      <div class="grid">
        <label class="field field--wide">
          <span class="field__label mono">工单标题 <em>*</em></span>
          <input v-model="form.title" class="field__input" placeholder="例：越野机器人转向推杆 · CANopen 定制项目" />
        </label>
        <label class="field">
          <span class="field__label mono">负责人</span>
          <input v-model="form.owner" class="field__input" />
        </label>
        <label class="field">
          <span class="field__label mono">优先级</span>
          <select v-model="form.priority" class="field__input">
            <option>高</option>
            <option>中</option>
            <option>低</option>
          </select>
        </label>
        <label class="field field--wide">
          <span class="field__label mono">备注</span>
          <input v-model="form.note" class="field__input" placeholder="例：同批项目下有三个需求方" />
        </label>
      </div>

      <label class="switch">
        <input v-model="form.withCustomer" type="checkbox" />
        <span>同时录入第一个客户（推荐，工单必须至少有一个客户）</span>
      </label>

      <div v-if="form.withCustomer" class="sub">
        <span class="sub__label mono">首个客户</span>
        <div class="grid">
          <label class="field field--wide">
            <span class="field__label mono">客户名称 <em>*</em></span>
            <input v-model="form.customer.customer" class="field__input" placeholder="例：越野机器人客户（王工）" />
          </label>
          <label class="field">
            <span class="field__label mono">联系人</span>
            <input v-model="form.customer.contact" class="field__input" placeholder="例：王工 · 138****2210" />
          </label>
          <label class="field">
            <span class="field__label mono">产品 / 型号</span>
            <input v-model="form.customer.product" class="field__input" placeholder="例：CAHB-22-D2E · CANopen 定制" />
          </label>
          <label class="field">
            <span class="field__label mono">数量</span>
            <input v-model="form.customer.qty" class="field__input" />
          </label>
          <label class="field">
            <span class="field__label mono">交期</span>
            <input v-model="form.customer.due" class="field__input" />
          </label>
          <label class="field field--wide">
            <span class="field__label mono">需求摘要</span>
            <input v-model="form.customer.note" class="field__input" placeholder="例：48 V · 3,500 N · 行程 50 · CANopen" />
          </label>
        </div>
      </div>

      <footer class="acts">
        <p class="acts__note mono">
          创建后会生成工单 {{ previewId }}，客户进入 S1 需求接收与建档（含 R01 需求版本）。
        </p>
        <div class="acts__right">
          <button class="btn btn--sm" type="button" @click="emit('cancel')">取消</button>
          <button class="btn btn--sm btn--solid" type="button" :disabled="!canSubmit" @click="submit">
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
.switch {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 14px 0 4px;
  font-size: 0.78rem;
  color: var(--ink-2);
}
.sub {
  margin-top: 10px;
  padding: 11px 12px 12px;
  border: 1px solid var(--accent-2);
  border-radius: var(--r-sm);
  background: var(--accent-3);
}
.sub__label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.56rem;
  color: var(--accent-ink);
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
