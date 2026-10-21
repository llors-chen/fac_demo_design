<script setup>
/**
 * 流程时间记录（工具版头屏）
 *
 * 官网风格的左侧导语、右侧数据栏、厂区快讯滚动条已注释隐藏，
 * 只保留横向时间轴：5 个环节，点按跳到对应区块。
 */
import AppIcon from './AppIcon.vue'
import { processLog } from '../data/site.js'

function goto(anchor) {
  document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const total = processLog.length
const doneCount = processLog.filter((s) => s.status !== '进行中').length
</script>

<template>
  <section class="flow" aria-labelledby="flow-heading">
    <div class="wrap">
      <!-- 标题行 -->
      <div class="flow__head">
        <div>
          <p class="kicker">流程时间记录 · Process log</p>
          <h2 id="flow-heading" class="flow__title">流程演示</h2>
        </div>
        <div class="flow__meta">
          <span class="mono">{{ total }} 个环节</span>
          <span class="flow__dot"></span>
          <span class="mono">{{ doneCount }} 个已完成</span>
          <span class="flow__dot"></span>
          <span class="mono">2026-10-21</span>
        </div>
      </div>

      <!-- 横向时间轴 -->
      <ol class="hflow">
        <li v-for="(s, i) in processLog" :key="s.no" class="hstep">
          <button class="hstep__btn" type="button" @click="goto(s.anchor)">
            <span class="hstep__top">
              <span class="hstep__no mono">{{ s.no }}</span>
              <span class="hstep__state mono" :class="{ 'is-doing': s.status === '进行中' }">
                {{ s.status }}
              </span>
            </span>

            <span class="hstep__title">{{ s.title }}</span>

            <span class="hstep__times">
              <span v-for="t in s.times" :key="t.time" class="hstep__time">
                <em class="mono">{{ t.time }}</em>
                {{ t.label }}
              </span>
            </span>

            <span class="hstep__note">{{ s.note }}</span>

            <span class="hstep__meta mono">{{ s.meta }}</span>
          </button>

          <span v-if="i < total - 1" class="hstep__link" aria-hidden="true">
            <AppIcon name="chevronRight" :size="16" />
          </span>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.flow {
  padding: clamp(22px, 3vw, 40px) 0 clamp(6px, 1vw, 12px);
}

/* 标题行 */
.flow__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 10px;
  border-bottom: 3px double var(--rule-3);
}
.flow__title {
  margin-top: 4px;
  font-size: clamp(1.25rem, 2.2vw, 1.85rem);
  letter-spacing: 0.02em;
  line-height: 1.35;
}
.flow__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.58rem;
  color: var(--ink-3);
  padding-bottom: 4px;
}
.flow__dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);
}

/* 横向时间轴 */
.hflow {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0;
  margin: clamp(14px, 2vw, 22px) 0 0;
  padding: 0;
  list-style: none;
}
.hstep {
  position: relative;
  display: flex;
  min-width: 0;
  padding-right: 18px;
}
.hstep__btn {
  position: relative;
  display: grid;
  gap: 6px;
  width: 100%;
  padding: 12px 14px 14px;
  border: 1px solid var(--rule);
  border-radius: 0 var(--r-md) 0 var(--r-md);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.5)),
    var(--paper-2);
  text-align: left;
  transition: border-color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease,
    background 0.22s ease;
}
/* 顶部一条与时间轴的连接线 */
.hstep__btn::before {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  top: -1px;
  height: 2px;
  background: var(--ink);
  opacity: 0.85;
}
.hstep__btn:hover {
  transform: translateY(-2px);
  border-color: var(--accent-2);
  background: var(--accent-3);
  box-shadow: var(--shadow-s);
}
.hstep__btn:hover::before {
  background: var(--accent-ink);
}
.hstep__top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hstep__no {
  display: grid;
  place-items: center;
  min-width: 30px;
  height: 22px;
  padding: 0 7px;
  border-radius: var(--r-xs);
  background: var(--ink);
  color: var(--paper);
  font-size: 0.56rem;
}
.hstep__state {
  margin-left: auto;
  font-size: 0.44rem;
  padding: 1px 7px;
  border: 1px solid var(--rule-2);
  border-radius: var(--r-pill);
  color: var(--ink-3);
  white-space: nowrap;
}
.hstep__state.is-doing {
  border-color: var(--accent-2);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.hstep__title {
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.4;
  color: var(--ink);
}
.hstep__times {
  display: grid;
  gap: 3px;
  margin: 2px 0 0;
}
.hstep__time {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--ink-2);
  line-height: 1.45;
}
.hstep__time em {
  font-style: normal;
  flex: none;
  font-size: 0.52rem;
  padding: 0 5px;
  border-radius: var(--r-pill);
  background: var(--accent-3);
  color: var(--accent-ink);
}
.hstep__note {
  font-size: 0.7rem;
  line-height: 1.6;
  color: var(--ink-3);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.hstep__meta {
  font-size: 0.46rem;
  color: var(--ink-4);
}
.hstep__link {
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-3);
}

@media (max-width: 1180px) {
  .hflow {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  .hstep {
    padding-right: 0;
  }
  .hstep__link {
    display: none;
  }
}
@media (max-width: 760px) {
  .hflow {
    grid-template-columns: 1fr;
  }
  .hstep__btn::before {
    left: 0;
    right: 0;
  }
}
</style>
