import { createDrawable, createTimeline } from 'animejs'
import { onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'

/**
 * 图纸“落笔”动画（anime.js v4）
 *
 * 约定：图纸 SVG 内的元素通过属性声明参与动画
 *   data-draw  data-stage="1..5"   → 描线（stroke-dashoffset 生长）
 *   data-fade  data-stage="1..5"   → 淡入（虚线、文字、标注等，避免与 dasharray 冲突）
 *
 * 时间轴总长固定为 1000（相对单位），按阶段分配时间窗口，
 * 滚动进度直接 seek 时间轴 → 实现“滚到哪、画到哪”的钉住式交互。
 */

const TOTAL = 1000

/** 各阶段占用的时间窗口（占整条时间轴的比例） */
const STAGE_WINDOW = {
  1: [0.0, 0.14], // 图框 / 中心线 / 基准
  2: [0.1, 0.46], // 主要轮廓
  3: [0.4, 0.58], // 剖面线
  4: [0.54, 0.78], // 尺寸标注
  5: [0.72, 1.0], // 引出标注 / 明细 / 标题栏
}

const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

export function useDrawingAnimation(rootRef, progressRef, options = {}) {
  const drive = options.drive // 可选 Ref<boolean>：为 false 时不跟随滚动（窄屏改用自动播放）
  const playing = ref(false)
  const animated = ref(false) // 是否成功建立动画（关闭动效时为 false）
  let timeline = null
  let stopWatch = null

  function addDrawGroup(list, isDraw) {
    const byStage = new Map()
    for (const el of list) {
      const stage = el.dataset.stage || '1'
      if (!byStage.has(stage)) byStage.set(stage, [])
      byStage.get(stage).push(el)
    }

    for (const [stage, els] of byStage) {
      const [a, b] = STAGE_WINDOW[stage] || STAGE_WINDOW['1']
      const start = a * TOTAL
      const span = Math.max((b - a) * TOTAL, 40)
      const step = els.length > 1 ? (span * 0.72) / (els.length - 1) : 0
      const duration = Math.max(span * 0.34, 60)

      els.forEach((el, i) => {
        const at = start + i * step
        if (isDraw) {
          let drawable
          try {
            ;[drawable] = createDrawable(el)
          } catch {
            drawable = null
          }
          if (!drawable) return
          timeline.add(drawable, { draw: ['0 0', '0 1'], duration, ease: 'inOutQuad' }, at)
        } else {
          timeline.add(el, { opacity: [0, 1], duration: Math.max(duration * 0.8, 90) }, at)
        }
      })
    }
  }

  function build() {
    const root = unref(rootRef)
    if (!root) return
    const draws = Array.from(root.querySelectorAll('[data-draw]'))
    const fades = Array.from(root.querySelectorAll('[data-fade]'))
    if (!draws.length && !fades.length) return

    timeline = createTimeline({
      autoplay: false,
      defaults: { ease: 'inOutQuad' },
      onComplete: () => {
        playing.value = false
      },
    })
    addDrawGroup(draws, true)
    addDrawGroup(fades, false)
    timeline.progress = 0
    animated.value = true
  }

  function apply(rawProgress) {
    if (!timeline || playing.value) return
    timeline.progress = easeInOutQuad(Math.min(1, Math.max(0, rawProgress)))
  }

  /** 自动演示：从头播放一遍（滚动进度此时让位） */
  function toggleAuto() {
    if (!timeline) return
    if (playing.value) {
      timeline.pause()
      playing.value = false
      apply(unref(progressRef) ?? 1)
    } else {
      timeline.restart()
      timeline.play()
      playing.value = true
    }
  }

  /** 进入视口后播放一次（窄屏 / 无滚动钉住时使用） */
  function playOnce() {
    if (!timeline || playing.value) return
    timeline.restart()
    timeline.play()
    playing.value = true
  }

  onMounted(() => {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      animated.value = false
      return
    }
    build()
    stopWatch = watch(
      progressRef,
      (p) => {
        if (drive && unref(drive) === false) return
        apply(p)
      },
      { immediate: true },
    )
  })

  onBeforeUnmount(() => {
    stopWatch?.()
    timeline?.revert()
    timeline = null
  })

  return { animated, playing, toggleAuto, playOnce, apply }
}
