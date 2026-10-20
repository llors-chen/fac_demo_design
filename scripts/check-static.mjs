/**
 * 一次性校验：用零依赖 http 服务托管 dist/，确认静态产物可独立访问
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('dist')
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0])
  const file = path.join(root, urlPath === '/' ? 'index.html' : urlPath)
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end('404')
    return
  }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
})

await new Promise((r) => server.listen(0, '127.0.0.1', r))
const port = server.address().port
const base = `http://127.0.0.1:${port}/`

const html = await (await fetch(base)).text()
const refs = [...html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)].map((m) => m[1])
const results = []
for (const ref of refs) {
  const res = await fetch(base + ref.replace('./', ''))
  results.push(`${ref} -> ${res.status} (${res.headers.get('content-type')})`)
}

// 产物内是否残留外部请求
const js = fs.readFileSync(path.join(root, 'assets', fs.readdirSync(path.join(root, 'assets')).find((f) => f.endsWith('.js'))), 'utf8')
const css = fs.readFileSync(path.join(root, 'assets', fs.readdirSync(path.join(root, 'assets')).find((f) => f.endsWith('.css'))), 'utf8')
const external = [...new Set([...(js + css).matchAll(/https?:\/\/[a-z0-9.\-/]+/gi)].map((m) => m[0]))]

console.log('入口 index.html:', html.length, 'bytes, 引用资源', refs.length, '个')
console.log(results.join('\n'))
console.log('产物中的外部 URL（应仅剩 SVG 命名空间等非请求地址）：')
console.log(external.length ? external.join('\n') : '（无）')

server.closeAllConnections?.()
server.close(() => {
  process.exitCode = 0
})
