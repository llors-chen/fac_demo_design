/**
 * 剖面线（hatch）生成器
 * 工程图里 45° 细实线剖面线的程序化生成，返回线段坐标数组，
 * 便于在 SVG 中逐条“落笔”绘制（配合描线动画）。
 */

const r1 = (n) => Math.round(n * 10) / 10

/**
 * @param {number} x 区域左上角 X
 * @param {number} y 区域左上角 Y
 * @param {number} w 区域宽
 * @param {number} h 区域高
 * @param {object} [opt]
 * @param {number} [opt.gap=14] 相邻剖面线的垂直间距
 * @param {'/'|'\\'} [opt.dir='/'] 方向：'/' 表示自左下到右上（默认），'\\' 表示自左上到右下
 */
export function hatchLines(x, y, w, h, opt = {}) {
  const { gap = 14, dir = '/' } = opt
  const step = gap * Math.SQRT2
  const out = []

  if (dir === '/') {
    // y = x + c
    for (let c = y - (x + w); c <= y + h - x; c += step) {
      const x1 = Math.max(x, y - c)
      const x2 = Math.min(x + w, y + h - c)
      if (x2 - x1 > 2) out.push({ x1: r1(x1), y1: r1(x1 + c), x2: r1(x2), y2: r1(x2 + c) })
    }
  } else {
    // y = -x + c
    for (let c = x + y; c <= x + w + y + h; c += step) {
      const x1 = Math.max(x, c - (y + h))
      const x2 = Math.min(x + w, c - y)
      if (x2 - x1 > 2) out.push({ x1: r1(x1), y1: r1(c - x1), x2: r1(x2), y2: r1(c - x2) })
    }
  }
  return out
}

/** 由若干矩形区域一次性生成剖面线（自动编号，便于做 stagger 节奏） */
export function hatchRegions(regions, opt = {}) {
  return regions.flatMap((rg) => hatchLines(rg.x, rg.y, rg.w, rg.h, { ...opt, ...rg }))
}
