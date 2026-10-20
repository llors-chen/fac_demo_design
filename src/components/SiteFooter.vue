<script setup>
/**
 * 页脚（按参考图信息组织：公司 / 产品和解决方案 / 企业新闻 & 媒体 / 联系我们）
 * 全部为按钮，不做跳转。
 */
import AppIcon from './AppIcon.vue'
import { footerColumns, footerLegal } from '../data/site.js'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="wrap">
      <!-- 订阅 / 联络条 -->
      <div class="topbar">
        <div class="topbar__brand">
          <span class="topbar__mark" aria-hidden="true"><AppIcon name="gear" :size="26" /></span>
          <div>
            <p class="topbar__name">精工图谱</p>
            <p class="topbar__tag mono">Industrial Manufacturing · Design Deliverables</p>
          </div>
        </div>

        <form class="subscribe" @submit.prevent>
          <label class="subscribe__label" for="footer-mail">订阅图纸与样品动态</label>
          <div class="subscribe__row">
            <input id="footer-mail" class="subscribe__input" type="email" placeholder="your@company.com" />
            <button class="btn btn--sm btn--solid" type="submit">
              <AppIcon name="mail" :size="14" />
              订阅
            </button>
          </div>
        </form>

        <div class="topbar__contact">
          <p class="mono topbar__cl">销售与技术支持</p>
          <p class="topbar__tel">400-000-1998</p>
          <p class="mono topbar__addr">浙江省嘉兴市平湖经济技术开发区 2 号</p>
        </div>
      </div>

      <!-- 四栏链接 -->
      <nav class="cols" aria-label="页脚导航">
        <section v-for="col in footerColumns" :key="col.title" class="col">
          <h3 class="col__title">{{ col.title }}</h3>
          <ul class="col__list">
            <li v-for="link in col.links" :key="link">
              <button class="linkbtn col__link" type="button">
                {{ link }}
              </button>
            </li>
          </ul>
        </section>

        <section class="col col--social">
          <h3 class="col__title">关注我们</h3>
          <div class="socials">
            <button class="social" type="button" aria-label="企业微信">
              <AppIcon name="grid" :size="16" />
            </button>
            <button class="social" type="button" aria-label="邮件订阅">
              <AppIcon name="mail" :size="16" />
            </button>
            <button class="social" type="button" aria-label="全球站点">
              <AppIcon name="globe" :size="16" />
            </button>
            <button class="social" type="button" aria-label="图册下载">
              <AppIcon name="download" :size="16" />
            </button>
          </div>
          <p class="col__note">
            图纸库每工作日 09:00 同步一次，历史版本保留 10 年。
          </p>
        </section>
      </nav>

      <!-- 底部信息 -->
      <div class="bottom">
        <p class="bottom__copy mono">© {{ year }} 精工图谱 · 平湖工厂 ｜ 浙 ICP 备 0000000 号</p>
        <div class="bottom__links">
          <button v-for="l in footerLegal" :key="l" class="linkbtn bottom__link" type="button">
            {{ l }}
          </button>
        </div>
        <div class="bottom__lang">
          <AppIcon name="globe" :size="14" />
          <button class="linkbtn bottom__link" type="button">简体中文</button>
          <span class="bottom__sep">/</span>
          <button class="linkbtn bottom__link" type="button">English</button>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: clamp(30px, 5vw, 70px);
  padding: clamp(26px, 3.4vw, 44px) 0 22px;
  border-top: 3px double var(--rule-3);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0)), var(--paper-3);
}

/* 顶部条 */
.topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 380px) auto;
  gap: clamp(18px, 3vw, 44px);
  align-items: start;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--rule-2);
}
.topbar__brand {
  display: flex;
  align-items: center;
  gap: 14px;
}
.topbar__mark {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 1px solid var(--rule-2);
  border-radius: 0 var(--r-sm) 0 var(--r-sm);
  background: var(--surface);
  transition: color 0.3s ease, border-color 0.3s ease, transform 0.5s cubic-bezier(0.2, 0.7, 0.3, 1);
}
.topbar__brand:hover .topbar__mark {
  color: var(--accent-ink);
  border-color: var(--accent-ink);
  transform: rotate(-45deg);
}
.topbar__name {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  line-height: 1.2;
}
.topbar__tag {
  font-size: 0.56rem;
}
.subscribe__label {
  display: block;
  font-size: 0.86rem;
  margin-bottom: 7px;
  color: var(--ink-2);
}
.subscribe__row {
  display: flex;
  gap: 8px;
}
.subscribe__input {
  flex: 1;
  min-width: 0;
  padding: 7px 12px;
  border: 1px solid var(--rule);
  border-radius: var(--r-pill);
  background: var(--surface);
  font-family: var(--mono);
  font-size: 0.78rem;
  color: var(--ink);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.subscribe__input:focus {
  border-color: var(--accent-ink);
  box-shadow: 0 0 0 3px var(--accent-3);
}
.topbar__contact {
  text-align: right;
}
.topbar__cl {
  font-size: 0.56rem;
}
.topbar__tel {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}
.topbar__addr {
  font-size: 0.54rem;
}

/* 四栏 */
.cols {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)) minmax(160px, 0.9fr);
  gap: clamp(16px, 2.4vw, 34px);
  padding: 24px 0 26px;
}
.col {
  min-width: 0;
}
.col__title {
  font-size: 1.06rem;
  letter-spacing: 0.06em;
  padding-bottom: 8px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--rule-2);
}
.col__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 7px;
}
.col__link {
  font-size: 0.9rem;
  color: var(--ink-2);
  text-align: left;
}
.col--social {
  border-left: 1px solid var(--rule);
  padding-left: clamp(12px, 1.6vw, 22px);
}
.socials {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.social {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--rule-2);
  border-radius: 0 var(--r-sm) 0 var(--r-sm);
  color: var(--ink-2);
  transition: background 0.22s ease, color 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
}
.social:hover {
  background: var(--accent-3);
  border-color: var(--accent-ink);
  color: var(--accent-ink);
  transform: translateY(-2px);
}
.col__note {
  font-size: 0.76rem;
  color: var(--ink-3);
  line-height: 1.7;
}

/* 底部 */
.bottom {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid var(--rule-2);
}
.bottom__copy {
  font-size: 0.58rem;
}
.bottom__links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-left: auto;
}
.bottom__link {
  font-size: 0.8rem;
  color: var(--ink-3);
}
.bottom__lang {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--ink-3);
}
.bottom__sep {
  opacity: 0.5;
}

@media (max-width: 1080px) {
  .topbar {
    grid-template-columns: 1fr 1fr;
  }
  .topbar__contact {
    grid-column: 1 / -1;
    text-align: left;
  }
  .cols {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .col--social {
    border-left: none;
    padding-left: 0;
  }
}
@media (max-width: 620px) {
  .topbar,
  .cols {
    grid-template-columns: 1fr;
  }
  .bottom__links {
    margin-left: 0;
  }
}
</style>
