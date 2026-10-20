<script setup>
/**
 * 报头 + 顶部导航条
 * 导航项仅作按钮（不跳转），点击只切换当前高亮，用于展示视觉状态。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import { navItems, navSecondary } from '../data/site.js'

const activeKey = ref(navItems[0].key)
const compact = ref(false)
const menuOpen = ref(false)

const today = computed(() => {
  const now = new Date()
  const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()]
  return `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 · 星期${week}`
})

function onScroll() {
  compact.value = window.scrollY > 140
}

function pick(item) {
  activeKey.value = item.key
  menuOpen.value = false
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <header class="masthead">
    <!-- 顶部细条 -->
    <div class="strip">
      <div class="wrap strip__in">
        <span class="mono strip__date">{{ today }}</span>
        <span class="strip__dot" aria-hidden="true"></span>
        <span class="mono strip__issue">第 001 期 · 设计成果特辑</span>
        <div class="strip__right">
          <button class="linkbtn strip__link" type="button">供应商门户</button>
          <button class="linkbtn strip__link" type="button">
            <AppIcon name="globe" :size="15" />
            中文 / EN
          </button>
          <button class="btn btn--sm" type="button">
            <AppIcon name="lock" :size="14" />
            登录图纸库
          </button>
        </div>
      </div>
    </div>

    <!-- 报头 -->
    <div class="brandbar">
      <div class="wrap brandbar__in">
        <div class="brand">
          <span class="brand__mark" aria-hidden="true">
            <AppIcon name="gear" :size="34" :stroke="1.4" />
          </span>
          <div class="brand__text">
            <h1 class="brand__name">精工图谱</h1>
            <p class="brand__tag">工业制造 · 设计成果在线图纸库</p>
          </div>
        </div>

        <div class="brand__side">
          <dl class="fact">
            <div><dt class="mono">创刊</dt><dd>1998</dd></div>
            <div><dt class="mono">厂区</dt><dd>苏州 · 常熟</dd></div>
            <div><dt class="mono">在库图纸</dt><dd>12,480</dd></div>
          </dl>
          <form class="searchbar" @submit.prevent>
            <AppIcon name="search" :size="16" />
            <input
              class="searchbar__input"
              type="search"
              placeholder="按图号 / 零件名 / 材料检索图纸"
              aria-label="检索图纸"
            />
            <button class="btn btn--sm" type="submit">检索</button>
          </form>
        </div>
      </div>
    </div>

    <!-- 导航条 -->
    <nav class="nav" :class="{ 'is-compact': compact }" aria-label="主导航">
      <div class="wrap nav__in">
        <span class="nav__mini" :class="{ 'is-on': compact }" aria-hidden="true">
          <AppIcon name="gear" :size="18" />
          精工图谱
        </span>

        <ul class="nav__list">
          <li v-for="item in navItems" :key="item.key">
            <button
              class="linkbtn nav__item"
              :class="{ 'linkbtn--active': activeKey === item.key }"
              type="button"
              :aria-pressed="activeKey === item.key"
              @click="pick(item)"
            >
              <AppIcon :name="item.icon" :size="17" />
              {{ item.label }}
            </button>
          </li>
        </ul>

        <div class="nav__extra">
          <button
            v-for="item in navSecondary"
            :key="item.key"
            class="linkbtn nav__item nav__item--sub"
            type="button"
            @click="pick(item)"
          >
            <AppIcon :name="item.icon" :size="16" />
            {{ item.label }}
          </button>
          <button class="btn btn--sm btn--solid" type="button">
            <AppIcon name="file" :size="14" />
            索取样品
          </button>
        </div>

        <button
          class="nav__toggle"
          type="button"
          :aria-expanded="menuOpen"
          aria-label="展开导航"
          @click="menuOpen = !menuOpen"
        >
          <AppIcon :name="menuOpen ? 'close' : 'menu'" :size="20" />
        </button>
      </div>

      <transition name="drawer">
        <div v-show="menuOpen" class="drawer">
          <div class="wrap drawer__in">
            <button
              v-for="item in [...navItems, ...navSecondary]"
              :key="item.key"
              class="linkbtn drawer__item"
              type="button"
              @click="pick(item)"
            >
              <AppIcon :name="item.icon" :size="18" />
              {{ item.label }}
              <AppIcon name="chevronRight" :size="16" class="drawer__chev" />
            </button>
          </div>
        </div>
      </transition>
    </nav>
  </header>
</template>

<style scoped>
.masthead {
  position: relative;
}

/* ---------- 顶部细条 ---------- */
.strip {
  border-bottom: 1px solid var(--rule);
  background: var(--paper-2);
}
.strip__in {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 38px;
  flex-wrap: wrap;
}
.strip__date,
.strip__issue {
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  color: var(--ink-3);
}
.strip__dot {
  width: 5px;
  height: 5px;
  background: var(--accent);
  border-radius: 50%;
}
.strip__right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 18px;
}
.strip__link {
  font-size: 0.82rem;
}

/* ---------- 报头 ---------- */
.brandbar {
  border-bottom: 3px double var(--rule-3);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0));
}
.brandbar__in {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding-top: clamp(18px, 2.6vw, 34px);
  padding-bottom: clamp(14px, 2vw, 24px);
  flex-wrap: wrap;
}
.brand {
  display: flex;
  align-items: center;
  gap: 16px;
}
.brand__mark {
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  border: 1px solid var(--rule-2);
  color: var(--ink);
  background: var(--paper);
  box-shadow: var(--shadow-s);
  transition: color 0.3s ease, border-color 0.3s ease, transform 0.5s cubic-bezier(0.2, 0.7, 0.3, 1);
}
.brand:hover .brand__mark {
  color: var(--accent-ink);
  border-color: var(--accent-ink);
  transform: rotate(45deg);
}
.brand__name {
  font-size: clamp(1.9rem, 3.6vw, 3rem);
  letter-spacing: 0.22em;
  line-height: 1.05;
}
.brand__tag {
  margin-top: 6px;
  font-size: 0.86rem;
  letter-spacing: 0.16em;
  color: var(--ink-3);
}
.brand__side {
  display: flex;
  align-items: flex-end;
  gap: 28px;
  flex-wrap: wrap;
}
.fact {
  display: flex;
  gap: 22px;
  margin: 0;
}
.fact div {
  border-left: 1px solid var(--rule);
  padding-left: 12px;
}
.fact dt {
  font-size: 0.6rem;
}
.fact dd {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.searchbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 6px 6px 12px;
  border: 1px solid var(--rule-2);
  background: var(--paper);
  min-width: min(360px, 74vw);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}
.searchbar:focus-within {
  border-color: var(--accent-ink);
  box-shadow: 0 0 0 3px var(--accent-3);
}
.searchbar__input {
  flex: 1;
  min-width: 0;
  border: none;
  background: none;
  font-family: var(--serif);
  font-size: 0.92rem;
  color: var(--ink);
  outline: none;
}
.searchbar__input::placeholder {
  color: var(--ink-4);
}

/* ---------- 导航条 ---------- */
.nav {
  position: sticky;
  top: 0;
  z-index: 60;
  background: var(--paper);
  border-bottom: 1px solid var(--rule-2);
  transition: box-shadow 0.3s ease, background 0.3s ease;
}
.nav::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  background: var(--rule);
}
.nav.is-compact {
  box-shadow: 0 14px 30px -26px rgba(22, 19, 14, 0.75);
  background: color-mix(in srgb, var(--paper) 88%, #fff);
  backdrop-filter: blur(6px);
}
.nav__in {
  display: flex;
  align-items: center;
  gap: 20px;
  min-height: var(--nav-h);
}
.nav__mini {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 0;
  overflow: hidden;
  white-space: nowrap;
  font-weight: 700;
  letter-spacing: 0.2em;
  opacity: 0;
  transition: max-width 0.45s cubic-bezier(0.2, 0.7, 0.3, 1), opacity 0.3s ease;
}
.nav__mini.is-on {
  max-width: 220px;
  opacity: 1;
  padding-right: 16px;
  border-right: 1px solid var(--rule);
}
.nav__list {
  display: flex;
  align-items: center;
  gap: clamp(10px, 1.8vw, 26px);
  margin: 0;
  padding: 0;
  list-style: none;
}
.nav__item {
  font-size: 1rem;
  letter-spacing: 0.04em;
}
.nav__extra {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 18px;
}
.nav__item--sub {
  font-size: 0.86rem;
  color: var(--ink-3);
}
.nav__toggle {
  display: none;
  margin-left: auto;
  padding: 8px;
  border: 1px solid var(--rule-2);
}

/* 移动端抽屉 */
.drawer {
  border-top: 1px solid var(--rule);
  background: var(--paper-2);
}
.drawer__in {
  display: grid;
  gap: 2px;
  padding-top: 8px;
  padding-bottom: 14px;
}
.drawer__item {
  justify-content: flex-start;
  padding: 11px 4px;
  border-bottom: 1px dashed var(--rule);
  font-size: 1rem;
}
.drawer__chev {
  margin-left: auto;
  color: var(--ink-4);
}
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.22s ease, transform 0.28s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 1080px) {
  .brand__side {
    width: 100%;
    justify-content: space-between;
  }
}
@media (max-width: 980px) {
  .nav__list,
  .nav__extra {
    display: none;
  }
  .nav__toggle {
    display: inline-flex;
  }
  .fact {
    display: none;
  }
}
</style>
