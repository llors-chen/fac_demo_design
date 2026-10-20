import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 滚动相关工具（首页主体已改为对话式流程，仅保留页面阅读进度）
 */

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
