<script setup>
/**
 * 新建客户
 *
 * 在指定工单下新增一个客户（需求方）；新客户进入 S1 需求接收与建档，并自动生成 R01 需求版本。
 */
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'

const props = defineProps({
  order: { type: Object, required: true },
})
const emit = defineEmits(['create', 'cancel'])

const form = ref({
  customer: '',
  contact: '',
  product: '',
  qty: 'EAU 50 pcs',
  due: '样件 8 周',
  priority: props.order.priority || '中',
  owner: props.order.owner || '销售 · 陈工',
  note: '',
})

const nextIndex = computed(() => (props.order.customers?.length || 0) + 1)
const previewId = computed(() => `${props.order.id}-C${nextIndex.value}`)
const canSubmit = computed(() => !!form.value.customer.trim())

function submit() {
  if (!canSubmit.value) return
  emit('create', {
    customer: form.value.customer.trim(),
    contact: form.value.contact.trim(),
    product: form.value.product.trim() || '待定',
    qty: form.value.qty.trim() || '待定',
    due: form.value.due.trim() || '待定',
    priority: form.value.priority,
    owner: form.value.owner,
    note: form.value.note.trim() || '客户首次提出需求',
  })
}
</script>

<template>
  <div class="nc">
    <section class="pane">
      <header class="pane__head">
        <AppIcon name="users" :size="15" />
        <h3 class="pane__title">在工单下新建客户</h3>
        <span class="pane__sub mono">{{ order.id }} · {{ order.title }}</span>
      </header>

      <div class="grid">
        <label class="field field--wide">
          <span class="field__label mono">客户名称 <em>*</em></span>
          <input v-model="form.customer" class="field__input" placeholder="例：华东物流装备（刘工）" />
        </label>
        <label class="field">
          <span class="field__label mono">联系人</span>
          <input v-model="form.contact" class="field__input" placeholder="例：刘工 · 139****7788" />
        </label>
        <label class="field">
          <span class="field__label mono">产品 / 型号</span>
          <input v-model="form.product" class="field__input" placeholder="例：CAHB-20-B3E · IP69K 增强" />
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
          <span class="field__label mono">需求摘要</span>
          <input v-model="form.note" class="field__input" placeholder="例：24 V · IP69K · EAU 120 pcs" />
        </label>
      </div>

      <footer class="acts">
        <p class="acts__note mono">
          创建后客户编号 {{ previewId }}，流程从 S1 需求接收与建档开始（自动生成 R01 需求版本）。
        </p>
        <div class="acts__right">
          <button class="btn btn--sm" type="button" @click="emit('cancel')">取消</button>
          <button class="btn btn--sm btn--solid" type="button" :disabled="!canSubmit" @click="submit">
            <AppIcon name="check" :size="13" />
            创建客户
          </button>
        </div>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.nc {
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
  color: var(--ink-4);
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
