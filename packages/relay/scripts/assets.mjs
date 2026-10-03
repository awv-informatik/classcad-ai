// Puts the app guests open into public/, where wrangler takes the relay's static files from.
//
//   node scripts/assets.mjs
//
// The app is the build @classcad/mcp carries (packages/mcp/app, built by its
// scripts/build-app.mjs; APP_DIR names another one): Buerligons in its `mcp`
// mode, which reaches ClassCAD on the address it was loaded from — here, the
// relay's /session. The same build serves the user on 127.0.0.1 and a guest
// here, so the two always fit the MCP that hosts their session.
//
// _headers says what the MCP's own listener says with every answer
// (share/server.ts): no sniffing, no referrer (the link carries the invite),
// and a page that loads and reaches nothing but its own address.

import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const app = resolve(process.env.APP_DIR ?? join(root, '..', 'mcp', 'app'))
// OUT_DIR: another place than public/ (the tests serve a stand-in from one of their own).
const out = resolve(process.env.OUT_DIR ?? join(root, 'public'))

if (!existsSync(join(app, 'index.html'))) {
  console.error(`assets: no app build at ${app} (npm run build:app -w @classcad/mcp builds it; APP_DIR names another one)`)
  process.exit(1)
}

rmSync(out, { recursive: true, force: true })
cpSync(app, out, { recursive: true })
// Not for a web host: what was built from which sources.
rmSync(join(out, 'SOURCE.txt'), { force: true })

const csp = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval' blob:",
  "worker-src 'self' blob:",
  // Styles are set from scripts (styled-components, antd).
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // 'self' covers the WebSocket to this address (wss://<relay>/session).
  "connect-src 'self' data: blob:",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ')

writeFileSync(
  join(out, '_headers'),
  [
    '/*',
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: no-referrer',
    '/',
    '  Cache-Control: no-store',
    `  Content-Security-Policy: ${csp}`,
    // Built files carry a hash in their name: they never change.
    '/assets/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
  ].join('\n'),
)

const source = existsSync(join(app, 'SOURCE.txt')) ? readFileSync(join(app, 'SOURCE.txt'), 'utf8').split('\n').filter(Boolean).join(', ') : 'unknown build'
console.log(`app → ${out} (${source})`)
