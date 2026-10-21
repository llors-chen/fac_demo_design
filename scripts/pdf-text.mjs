/** 提取 PDF 文本（用于阅读 500413 / 500425 报表内容） */
import fs from 'node:fs'
import path from 'node:path'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

const files = process.argv.slice(2)
for (const file of files) {
  console.log('\n' + '='.repeat(70))
  console.log('FILE:', file)
  console.log('='.repeat(70))
  const data = new Uint8Array(fs.readFileSync(file))
  const doc = await getDocument({ data, useSystemFonts: true }).promise
  console.log('pages:', doc.numPages)
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    // 按 y 坐标聚合为行，尽量还原表格布局
    const rows = new Map()
    for (const item of content.items) {
      if (!item.str || !item.str.trim()) continue
      const y = Math.round(item.transform[5] / 2) * 2
      if (!rows.has(y)) rows.set(y, [])
      rows.get(y).push({ x: item.transform[4], s: item.str })
    }
    console.log(`\n--- page ${p} ---`)
    for (const y of [...rows.keys()].sort((a, b) => b - a)) {
      const line = rows
        .get(y)
        .sort((a, b) => a.x - b.x)
        .map((t) => t.s)
        .join(' | ')
      console.log(line)
    }
  }
  doc.cleanup?.()
}
