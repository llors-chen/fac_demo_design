/**
 * v-reveal 指令：元素进入视口时浮现
 * 用法：<div v-reveal>…</div> 或 <div v-reveal="120">（延迟 120ms）
 */
let observer = null

function ensureObserver() {
  if (observer || typeof IntersectionObserver === 'undefined') return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target
        const delay = Number(el.dataset.revealDelay || 0)
        window.setTimeout(() => el.classList.add('is-in'), delay)
        observer.unobserve(el)
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
  )
  return observer
}

export const revealDirective = {
  mounted(el, binding) {
    el.classList.add('reveal')
    const delay = binding.value
    if (delay) el.dataset.revealDelay = String(delay)

    const io = ensureObserver()
    if (!io) {
      el.classList.add('is-in')
      return
    }
    // 首屏元素立即显示，避免闪烁
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.9) {
      window.setTimeout(() => el.classList.add('is-in'), delay ? Number(delay) : 0)
      return
    }
    io.observe(el)
  },
  unmounted(el) {
    observer?.unobserve(el)
  },
}
