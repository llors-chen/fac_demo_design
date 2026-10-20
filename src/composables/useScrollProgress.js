import { onBeforeUnmount, onMounted, ref, unref } from 'vue'

/**
 * 滚动进度：用于“钉住 + 描线”的滚动交互
 *
 * 结构约定：
 *   <section ref="sectionEl" class="pin-section">      // 高个子容器（如 200vh）
 *     <div ref="pinEl" class="pin-body">…</div>        // position: sticky 的部分
 *   </section>
 *
 * 进度定义：钉住元素顶部到达 offset 时为 0，
 * 容器滚动到剩余行程结束时为 1。
 *
 * @param {import('vue').Ref<HTMLElement|null>} sectionRef 高个子容器
 * @param {import('vue').Ref<HTMLElement|null>} [pinRef] 钉住元素（用于扣除其高度）
 * @param {{ offset?: number }} [options] offset：钉住位置距视口顶部的距离
 */
export function useScrollProgress(sectionRef, pinRef, options = {}) {
  const progress = ref(0)
  const inView = ref(false)
  let ticking = false
  let raf = 0

  function measure() {
    ticking = false
    const section = unref(sectionRef)
    if (!section) return

    const rect = section.getBoundingClientRect()
    const pinH = unref(pinRef)?.offsetHeight || Math.round(window.innerHeight * 0.8)
    const offset = options.offset ?? 70
    const travel = Math.max(rect.height - pinH, 1)

    const raw = (offset - rect.top) / travel
    progress.value = Math.min(1, Math.max(0, raw))
    inView.value = rect.bottom > offset * 0.4 && rect.top < window.innerHeight
  }

  function onScroll() {
    if (ticking) return
    ticking = true
    raf = window.requestAnimationFrame(measure)
  }

  onMounted(() => {
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
  })

  onBeforeUnmount(() => {
    window.cancelAnimationFrame(raf)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
  })

  return { progress, inView, measure }
}

/** 页面整体阅读进度（0~1） */
export function usePageProgress() {
  const value = ref(0)
  let ticking = false

  function update() {
    ticking = false
    const doc = document.documentElement
    const max = doc.scrollHeight - window.innerHeight
    value.value = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
  }
  function onScroll() {
    if (ticking) return
    ticking = true
    window.requestAnimationFrame(update)
  }

  onMounted(() => {
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
  })

  return value
}

export const clamp01 = (n) => Math.min(1, Math.max(0, n))
