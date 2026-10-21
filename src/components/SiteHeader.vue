<script setup>
/**
 * 报头（工具版）
 *
 * 官网风格的吸顶导航条（工厂信息 / 品牌介绍 / 样品解决方案 / 职业 / 公司）已注释隐藏，
 * 只保留：顶部细条（日期 / 演示标识）+ 报头（流程演示 + 检索）。
 */
import { computed, ref } from 'vue'
import AppIcon from './AppIcon.vue'

/* 主题切换：演示（印刷纸感）/ 工具（企业内部工具） */
const theme = ref(document.documentElement.getAttribute('data-theme') === 'tool' ? 'tool' : 'paper')

function setTheme(next) {
  theme.value = next
  if (next === 'tool') document.documentElement.setAttribute('data-theme', 'tool')
  else document.documentElement.removeAttribute('data-theme')
  try {
    localStorage.setItem('dsh-theme', next)
  } catch (e) {
    /* 忽略隐私模式下的写入失败 */
  }
}

const today = computed(() => {
  const now = new Date()
  const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()]
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${mm}-${dd} · 星期${week}`
})
</script>

<template>
  <header class="masthead">
    <!-- 顶部细条 -->
    <div class="strip">
      <div class="wrap strip__in">
        <span class="mono strip__date">{{ today }}</span>
        <span class="strip__dot" aria-hidden="true"></span>
        <span class="mono strip__issue">销售—研发协同流程 · 需求到报价 Demo</span>
        <div class="strip__right">
          <span class="mono strip__tag">内部演示环境</span>

          <!-- 主题切换 -->
          <div class="theme" role="group" aria-label="界面主题">
            <button
              class="theme__btn"
              :class="{ 'is-on': theme === 'paper' }"
              type="button"
              @click="setTheme('paper')"
            >
              演示
            </button>
            <button
              class="theme__btn"
              :class="{ 'is-on': theme === 'tool' }"
              type="button"
              @click="setTheme('tool')"
            >
              工具
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 报头 -->
    <div class="brandbar">
      <div class="wrap brandbar__in">
        <div class="brand">
          <span class="brand__mark" aria-hidden="true">
            <AppIcon name="gear" :size="30" :stroke="1.4" />
          </span>
          <div class="brand__text">
            <h1 class="brand__name">流程演示</h1>
            <p class="brand__tag">平湖工厂 · 需求 → 报表 → 图纸/BOM → 车间 → 报价</p>
          </div>
        </div>

        <div class="brand__side">
          <form class="searchbar" @submit.prevent>
            <AppIcon name="search" :size="16" />
            <input
              class="searchbar__input"
              type="search"
              placeholder="按 iCRM / 图号 / 客户检索"
              aria-label="检索"
            />
            <button class="btn btn--sm" type="submit">检索</button>
          </form>
        </div>
      </div>
    </div>

    <!--
      导航条（已按需求注释隐藏，需要时取消注释即可）
      <nav class="nav">… 工厂信息 / 品牌介绍 / 样品解决方案 / 职业 / 公司 …</nav>
    -->
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
  min-height: 36px;
  flex-wrap: wrap;
}
.strip__date,
.strip__issue {
  font-size: 0.66rem;
  letter-spacing: 0.12em;
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
  gap: 14px;
}
.theme {
  display: inline-flex;
  padding: 2px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-pill);
  background: var(--paper);
}
.theme__btn {
  padding: 2px 10px;
  border-radius: var(--r-pill);
  font-size: 0.66rem;
  font-family: var(--serif);
  color: var(--ink-3);
  transition: background 0.18s ease, color 0.18s ease;
}
.theme__btn:hover {
  color: var(--accent-ink);
}
.theme__btn.is-on {
  background: var(--ink);
  color: var(--paper);
}
.strip__tag {
  font-size: 0.58rem;
  padding: 2px 8px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-pill);
  color: var(--ink-3);
}

/* ---------- 报头 ---------- */
.brandbar {
  border-bottom: 3px double var(--rule-3);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0));
}
.brandbar__in {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  padding-top: clamp(14px, 1.8vw, 22px);
  padding-bottom: clamp(12px, 1.6vw, 18px);
  flex-wrap: wrap;
}
.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}
.brand__mark {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border: 1px solid var(--rule-2);
  border-radius: 0 var(--r-md) 0 var(--r-md);
  color: var(--ink);
  background: var(--surface);
  box-shadow: var(--shadow-s);
  transition: color 0.3s ease, border-color 0.3s ease, transform 0.5s cubic-bezier(0.2, 0.7, 0.3, 1);
}
.brand:hover .brand__mark {
  color: var(--accent-ink);
  border-color: var(--accent-ink);
  transform: rotate(45deg);
}
.brand__name {
  font-size: clamp(1.5rem, 2.4vw, 2.1rem);
  letter-spacing: 0.2em;
  line-height: 1.05;
}
.brand__tag {
  margin-top: 5px;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  color: var(--ink-3);
}
.brand__side {
  display: flex;
  align-items: center;
  gap: 16px;
}
.searchbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 5px 5px 12px;
  border: 1px solid var(--rule);
  border-radius: var(--r-md);
  background: var(--surface);
  min-width: min(340px, 70vw);
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
  font-size: 0.9rem;
  color: var(--ink);
  outline: none;
}
.searchbar__input::placeholder {
  color: var(--ink-4);
}

@media (max-width: 760px) {
  .brand__side {
    width: 100%;
  }
  .searchbar {
    min-width: 0;
    width: 100%;
  }
}

/* 手机（iPhone 13 Pro 390px） */
@media (max-width: 480px) {
  .brandbar__in {
    gap: 12px;
    padding-top: 12px;
    padding-bottom: 12px;
  }
  .brand {
    gap: 10px;
  }
  .brand__mark {
    width: 40px;
    height: 40px;
  }
  .brand__name {
    font-size: 1.35rem;
    letter-spacing: 0.12em;
  }
  .brand__tag {
    font-size: 0.7rem;
    line-height: 1.5;
  }
  .strip__right {
    width: 100%;
    justify-content: space-between;
  }
  .theme__btn {
    padding: 2px 9px;
    font-size: 0.72rem;
  }
}
</style>
