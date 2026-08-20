#!/usr/bin/env node
// ─── Local GitHub Copilot → OpenAI-compatible proxy (dev only) ────────────────
//
// Ships with @buerli.io/ai so any app that installs the package can run
// it (`npx copilot-proxy`, or a package script). The browser cannot call
// api.githubcopilot.com directly: it sends no CORS headers and wants a short-lived
// (~29 min) session token re-minted from a long-lived GitHub OAuth token. This
// proxy lives on localhost, holds the OAuth token, refreshes the session token,
// adds CORS, and forwards requests to Copilot.
//
// Usage (run from your app directory — it reads/writes ./.env.local there):
//   npx copilot-proxy auth     # one-time setup: device-flow login + scaffold ./.env.local config
//   npx copilot-proxy models   # list the models your Copilot plan exposes
//   npx copilot-proxy          # start the proxy (auto-auths + scaffolds config if missing)
//
// Token source: COPILOT_OAUTH_TOKEN, read from the process env or ./.env.local
// (a legacy ./.copilot-oauth.json is auto-migrated into ./.env.local on first run).
//
// SECURITY: COPILOT_OAUTH_TOKEN is a server-only secret. If your app bundles
// .env.local into client code (e.g. Docusaurus customFields), expose only an
// allowlist of browser-safe keys — never spread the whole file — so the token
// stays out of the browser bundle. Keep .env.local gitignored.

import http from 'node:http'
import https from 'node:https'
import dns from 'node:dns'
import net from 'node:net'
import fs from 'node:fs'
import path from 'node:path'

// All file I/O is relative to the directory you RUN the proxy from, so it picks
// up the consuming app's .env.local (not this package's location).
const CWD = process.cwd()
const ENV_FILE = path.resolve(CWD, '.env.local')
const LEGACY_TOKEN_FILE = path.resolve(CWD, '.copilot-oauth.json')

// ─── Minimal zero-dep .env.local loader (no override of already-set env) ──────
function loadEnvLocal() {
  let text
  try {
    text = fs.readFileSync(ENV_FILE, 'utf8')
  } catch {
    return
  }
  for (const raw of text.split('\n')) {
    const m = raw.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (!m || raw.trimStart().startsWith('#')) continue
    let val = m[2]
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = val
  }
}
loadEnvLocal()

// GitHub Copilot's public editor OAuth app (used by copilot.vim / copilot.lua).
// Device flow with this client yields a token accepted by copilot_internal.
const CLIENT_ID = 'Iv1.b507a08c87ecfe98'
const PORT = Number(process.env.COPILOT_PROXY_PORT || 8788)
// Set COPILOT_PROXY_DEBUG=1 to log per-request timing + token usage (incl. reasoning).
const DEBUG = !!process.env.COPILOT_PROXY_DEBUG

const COPILOT_MODELS = 'https://api.githubcopilot.com/models'
const COPILOT_BASE = 'https://api.githubcopilot.com'
const TOKEN_EXCHANGE = 'https://api.github.com/copilot_internal/v2/token'

// Headers Copilot expects from an "editor" client.
const COPILOT_HEADERS = {
  'Editor-Version': 'vscode/1.95.0',
  'Editor-Plugin-Version': 'copilot-chat/0.22.0',
  'Copilot-Integration-Id': 'vscode-chat',
  'User-Agent': 'GitHubCopilotChat/0.22.0',
}

// ─── OAuth token: env / .env.local first, legacy json auto-migrated ───────────

function loadOAuth() {
  if (process.env.COPILOT_OAUTH_TOKEN) return process.env.COPILOT_OAUTH_TOKEN
  // Back-compat: migrate a pre-existing .copilot-oauth.json into .env.local.
  try {
    const legacy = JSON.parse(fs.readFileSync(LEGACY_TOKEN_FILE, 'utf8')).oauth_token
    if (legacy) {
      console.log('Migrating token from .copilot-oauth.json → .env.local (COPILOT_OAUTH_TOKEN). You may delete the old file.')
      saveOAuth(legacy)
      return legacy
    }
  } catch {
    /* no legacy file — fine */
  }
  return ''
}

// Upsert COPILOT_OAUTH_TOKEN into ./.env.local, preserving the rest of the file.
function saveOAuth(token) {
  let text = ''
  try {
    text = fs.readFileSync(ENV_FILE, 'utf8')
  } catch {
    /* file will be created */
  }
  const line = `COPILOT_OAUTH_TOKEN=${token}`
  if (/^\s*COPILOT_OAUTH_TOKEN\s*=.*$/m.test(text)) {
    text = text.replace(/^\s*COPILOT_OAUTH_TOKEN\s*=.*$/m, line)
  } else {
    if (text && !text.endsWith('\n')) text += '\n'
    text +=
      '\n# GitHub Copilot OAuth token for the proxy — SERVER-ONLY. Keep .env.local gitignored\n' +
      '# and do NOT expose this key to the browser bundle (allowlist customFields).\n' +
      line +
      '\n'
  }
  fs.writeFileSync(ENV_FILE, text)
  process.env.COPILOT_OAUTH_TOKEN = token
}

// Documented default AI-agent config, scaffolded into .env.local on first auth so a
// new checkout gets a ready-to-edit file (Copilot active; LM Studio + fallbacks
// commented). The COPILOT_OAUTH_TOKEN is appended separately by saveOAuth().
const ENV_TEMPLATE = `# Local-only AI agent config — NOT tracked (see .gitignore).
#
# ── ACTIVE: GitHub Copilot via the local proxy ──
# Start it:  npx copilot-proxy        (or your app's proxy script; first run = GitHub device-flow login)
# The real Copilot OAuth token is written below as COPILOT_OAUTH_TOKEN by "copilot-proxy auth";
# the key here is just a non-empty placeholder. The API surface (Responses vs Chat) is
# AUTO-DETECTED per model from /models (supported_endpoints), so it's no longer set here.
# AI_AGENT_MODEL is just the default selection — the footer model picker switches it live.
AI_AGENT_API_KEY=copilot-proxy
AI_AGENT_ENDPOINT=http://localhost:8788/v1/responses
AI_AGENT_MODEL=gpt-5.5
# Output cap + context-window size are AUTO-DETECTED per model from the Copilot /models
# limits (the footer model picker switches them live), so they need not be set here.
# Optional fallbacks/overrides — uncomment to force values when discovery is unavailable:
#   AI_AGENT_MAX_TOKENS=128000          # per-call output cap
#   AI_AGENT_CONTEXT_TOKENS=272000      # prompt budget (the ring denominator)
#   AI_AGENT_REASONING_EFFORT=medium    # default thinking level (model-dependent: none|low|medium|high|xhigh)

# ── Alternative: local LM Studio (OpenAI-compatible Chat Completions) ──
# Qwen via LM Studio at http://localhost:1234. Requires "Enable CORS" in LM
# Studio's Developer/Server settings so the browser can reach it. The API key is
# ignored by LM Studio — any non-empty value works. Set MAX/CONTEXT to match the
# context length the model was loaded with in LM Studio (LM Studio's /models omits
# limits, so the auto-detected values aren't available there).
# AI_AGENT_API_KEY=lm-studio
# AI_AGENT_ENDPOINT=http://localhost:1234/v1/chat/completions
# AI_AGENT_MODEL=qwen3.5-9b-uncensored-hauhaucs-aggressive
# AI_AGENT_MAX_TOKENS=8192
# AI_AGENT_CONTEXT_TOKENS=32768
`

// Write the documented config above whatever's already in .env.local (e.g. a token
// block), but only when no AI agent config exists yet — never clobber a customised one.
function scaffoldEnvConfig() {
  let text = ''
  try {
    text = fs.readFileSync(ENV_FILE, 'utf8')
  } catch {
    /* file will be created */
  }
  if (/^\s*AI_AGENT_API_KEY\s*=/m.test(text)) return false // already configured — leave it
  const sep = text && !text.startsWith('\n') ? '\n' : ''
  fs.writeFileSync(ENV_FILE, ENV_TEMPLATE + sep + text)
  console.log('✓ Wrote AI agent config to .env.local (Copilot active; LM Studio + fallbacks commented)')
  return true
}

// ─── GitHub device flow ───────────────────────────────────────────────────────

async function deviceFlow() {
  const codeRes = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: new URLSearchParams({ client_id: CLIENT_ID, scope: 'read:user' }),
  })
  const dc = await codeRes.json()
  if (!dc.device_code) throw new Error('device/code failed: ' + JSON.stringify(dc))

  console.log('\n  ┌─ GitHub Copilot login ─────────────────────────────')
  console.log('  │  1. Open:  ' + dc.verification_uri)
  console.log('  │  2. Enter: ' + dc.user_code)
  console.log('  └─ Waiting for you to authorize…\n')

  const interval = (dc.interval || 5) * 1000
  const deadline = Date.now() + (dc.expires_in || 900) * 1000
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, interval))
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        device_code: dc.device_code,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    })
    const j = await res.json()
    if (j.access_token) return j.access_token
    if (j.error && j.error !== 'authorization_pending' && j.error !== 'slow_down') {
      throw new Error('device flow error: ' + j.error + ' — ' + (j.error_description || ''))
    }
  }
  throw new Error('device flow timed out — re-run and authorize faster')
}

async function ensureOAuth() {
  // Ensure a documented AI-agent config exists (idempotent — writes once, on first run).
  scaffoldEnvConfig()
  const tok = loadOAuth()
  if (tok) return tok
  console.log('No Copilot OAuth token yet — starting GitHub device-flow login…')
  const fresh = await deviceFlow()
  saveOAuth(fresh)
  console.log('✓ Saved COPILOT_OAUTH_TOKEN to .env.local (gitignored)\n')
  return fresh
}

// ─── Copilot session token cache ──────────────────────────────────────────────

let session = { token: '', expiresAt: 0 }

async function getSessionToken(oauth) {
  if (session.token && Date.now() < session.expiresAt - 5 * 60 * 1000) return session.token
  const res = await fetch(TOKEN_EXCHANGE, {
    headers: { Authorization: 'token ' + oauth, Accept: 'application/json', ...COPILOT_HEADERS },
  })
  if (!res.ok) {
    const text = await res.text()
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        `Copilot token exchange ${res.status}: ${text}\n` +
          'Your OAuth token may be invalid or lack Copilot access. Remove COPILOT_OAUTH_TOKEN from .env.local and re-run "copilot-proxy auth".',
      )
    }
    throw new Error(`Copilot token exchange failed (${res.status}): ${text}`)
  }
  const j = await res.json()
  session = { token: j.token, expiresAt: j.expires_at ? j.expires_at * 1000 : Date.now() + 25 * 60 * 1000 }
  return session.token
}

// ─── CORS ───────────────────────────────────────────────────────────────────

function setCors(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')
}

// Copilot's gpt-5.x models reject `max_tokens` and require `max_completion_tokens`.
// Translate here so the portable provider can keep emitting the standard field.
function adaptBody(buf) {
  try {
    const b = JSON.parse(buf.toString('utf8'))
    if (/^gpt-5/.test(b.model || '') && b.max_tokens != null && b.max_completion_tokens == null) {
      b.max_completion_tokens = b.max_tokens
      delete b.max_tokens
      return Buffer.from(JSON.stringify(b))
    }
  } catch {
    /* forward the original body unchanged on parse failure */
  }
  return buf
}

// ─── models command ───────────────────────────────────────────────────────────

async function listModels() {
  const oauth = await ensureOAuth()
  const tok = await getSessionToken(oauth)
  const r = await fetch(COPILOT_MODELS, { headers: { Authorization: 'Bearer ' + tok, ...COPILOT_HEADERS } })
  const j = await r.json()
  const rows = (j.data || j.models || [])
    .map(m => ({ id: m.id || m.name, vendor: m.vendor || (m.id || '').split('/')[0] }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
  for (const m of rows) console.log(m.id)
}

// ─── proxy server ───────────────────────────────────────────────────────────

async function serve() {
  const oauth = await ensureOAuth()
  // Probe the exchange once so a BAD TOKEN still fails fast (401/403 = actionable),
  // but survive transient gateway trouble (5xx "Unicorn" pages during GitHub
  // outages) — the per-request path retries the exchange lazily, so starting
  // anyway means the proxy begins serving the moment Copilot recovers.
  try {
    await getSessionToken(oauth)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (/exchange (401|403)/.test(msg)) throw err
    console.warn(`[proxy] startup token exchange failed (transient?) — serving anyway; will retry per request. ${msg.slice(0, 160)}`)
  }


// ─── Safe URL fetch (POST /v1/fetch) ──────────────────────────────────────────
//
// The browser cannot fetch arbitrary sites (CORS); this local process can — which
// makes the endpoint an SSRF hole unless bounded. A local fetcher can reach what
// the page cannot: the ClassCAD worker on :9094, LAN devices, cloud metadata at
// 169.254.169.254. Hence: http/https only, ports 80/443 only, every resolved
// ADDRESS checked (not just the hostname — that is what defeats DNS rebinding,
// since a name may resolve public once and private on the next lookup), every
// redirect hop re-checked, no credentials out, no cookies either way, hard size
// and time caps, GET only.

const FETCH_MAX_BYTES = 5 * 1024 * 1024
const FETCH_TIMEOUT_MS = 15000
const FETCH_MAX_REDIRECTS = 5
const FETCH_PORTS = new Set([80, 443])
const FETCH_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'])
const FETCH_TEXT_TYPES = /^(text\/|application\/(json|xml|xhtml\+xml|rss\+xml|javascript))/

/** True for any address an outside caller must never be able to reach through us. */
function isBlockedAddress(ip) {
  const v = net.isIP(ip)
  if (!v) return true
  if (v === 4) {
    const p = ip.split('.').map(Number)
    if (p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true
    const [a, b] = p
    if (a === 0 || a === 10 || a === 127) return true            // this-host, private, loopback
    if (a === 169 && b === 254) return true                       // link-local incl. cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true              // private
    if (a === 192 && b === 168) return true                       // private
    if (a === 100 && b >= 64 && b <= 127) return true             // CGNAT
    if (a === 192 && b === 0) return true                         // IETF protocol assignments
    if (a === 198 && (b === 18 || b === 19)) return true          // benchmarking
    if (a >= 224) return true                                     // multicast + reserved + broadcast
    return false
  }
  const ip6 = ip.toLowerCase().split('%')[0]
  if (ip6 === '::1' || ip6 === '::') return true
  const mapped = ip6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return isBlockedAddress(mapped[1])
  const head = ip6.split(':')[0]
  if (/^f[cd]/.test(head)) return true                            // unique local fc00::/7
  if (/^fe[89ab]/.test(head)) return true                         // link-local fe80::/10
  if (/^ff/.test(head)) return true                               // multicast
  return false
}

/** dns.lookup wrapper that refuses to hand a blocked address to the socket. */
function guardedLookup(hostname, options, callback) {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err)
    const list = Array.isArray(addresses) ? addresses : [addresses]
    const ok = list.filter(a => !isBlockedAddress(a.address))
    if (!ok.length) {
      return callback(Object.assign(new Error(`blocked address for ${hostname} (private/loopback/link-local)`), { code: 'EBLOCKED' }))
    }
    if (options && options.all) return callback(null, ok)
    callback(null, ok[0].address, ok[0].family)
  })
}

function assertFetchableUrl(u) {
  let url
  try { url = new URL(u) } catch { throw new Error('not a valid URL') }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('only http/https URLs are allowed')
  const port = url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80
  if (!FETCH_PORTS.has(port)) throw new Error('only ports 80 and 443 are allowed')
  if (net.isIP(url.hostname) && isBlockedAddress(url.hostname)) throw new Error('blocked address (private/loopback/link-local)')
  return url
}

/** One hop. Resolves { status, headers, body, location }. */
function fetchOnce(url) {
  return new Promise((resolve, reject) => {
    const mod = url.protocol === 'https:' ? https : http
    const req = mod.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'GET',
        lookup: guardedLookup,
        // Deliberately minimal and anonymous: no Authorization, no Cookie, no
        // local headers. The target must learn nothing about this machine.
        headers: {
          'user-agent': 'buerli-ai-fetch/1.0 (+local dev proxy)',
          accept: 'text/html,application/xhtml+xml,text/plain,application/json,image/*;q=0.8,*/*;q=0.5',
          'accept-language': 'en,de;q=0.8',
        },
      },
      res => {
        const chunks = []
        let size = 0
        res.on('data', c => {
          size += c.length
          if (size > FETCH_MAX_BYTES) { req.destroy(new Error('response exceeds 5 MB cap')); return }
          chunks.push(c)
        })
        res.on('end', () => resolve({ status: res.statusCode || 0, headers: res.headers, body: Buffer.concat(chunks) }))
      },
    )
    req.setTimeout(FETCH_TIMEOUT_MS, () => req.destroy(new Error('timed out after 15s')))
    req.on('error', reject)
    req.end()
  })
}

/** Follow redirects manually so every hop is re-validated. */
async function safeFetch(rawUrl) {
  let url = assertFetchableUrl(rawUrl)
  for (let hop = 0; hop <= FETCH_MAX_REDIRECTS; hop++) {
    const r = await fetchOnce(url)
    const loc = r.headers.location
    if (r.status >= 300 && r.status < 400 && loc) {
      url = assertFetchableUrl(new URL(loc, url).toString())
      continue
    }
    return { ...r, finalUrl: url.toString() }
  }
  throw new Error('too many redirects')
}

/** Decode the entities a real page actually contains (German text is full of them). */
const NAMED_ENTITIES = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", szlig: 'ß',
  auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü',
  eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç', deg: '°', euro: '€',
  hellip: '…', ndash: '–', mdash: '—', laquo: '«', raquo: '»',
  bdquo: '„', ldquo: '“', rdquo: '”', sbquo: '‚', lsquo: '‘', rsquo: '’',
  times: '×', divide: '÷', plusmn: '±', micro: 'µ', middot: '·', bull: '•',
  copy: '©', reg: '®', trade: '™', frac12: '½', frac14: '¼', sup2: '²', sup3: '³',
}
function decodeEntities(str) {
  return str
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+\d*);/gi, (m, name) => (name in NAMED_ENTITIES ? NAMED_ENTITIES[name] : m))
}

/**
 * HTML → readable text + the images the page shows. The model needs prose, not
 * markup — but on a page like a drawing exercise the PICTURES are the payload,
 * and stripping tags throws their URLs away. So they come back as an absolute,
 * deduped list the agent can fetch in a second call.
 */
function htmlToText(html, baseUrl) {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]

  const images = []
  const seen = new Set()
  const push = raw => {
    if (!raw || raw.startsWith('data:')) return
    let abs
    try { abs = new URL(raw, baseUrl).toString() } catch { return }
    if (!/^https?:/.test(abs) || seen.has(abs)) return
    seen.add(abs)
    if (images.length < 25) images.push(abs)
  }
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0]
    const src = (tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i) || [])[1]
    const alt = (tag.match(/\balt\s*=\s*["']([^"']*)["']/i) || [])[1]
    // Prefer the largest candidate a srcset offers, else the plain src.
    const srcset = (tag.match(/\bsrcset\s*=\s*["']([^"']+)["']/i) || [])[1]
    if (srcset) {
      const best = srcset.split(',').map(x => x.trim().split(/\s+/)[0]).filter(Boolean).pop()
      push(best)
    }
    push(src)
    void alt
  }
  // Direct links to image files count too (thumbnails often link the full size).
  for (const m of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+\.(?:png|jpe?g|gif|webp|svg))(?:\?[^"']*)?["']/gi)) push(m[1])

  const text = decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<\/(p|div|li|tr|h[1-6]|section|article|br)>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim()

  return { title: title ? decodeEntities(title).trim() : undefined, text, images }
}


  const server = http.createServer((req, res) => {
    const origin = req.headers.origin
    setCors(res, origin)

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }
    if (req.method === 'GET' && req.url === '/healthz') {
      res.writeHead(200)
      res.end('ok')
      return
    }

    // Safe single-shot fetch. NOT a browser: one GET, no link following, no
    // sessions, no cookies — see the guardrails above. Must be handled BEFORE the
    // generic forwarder, which would otherwise proxy /fetch to Copilot.
    if (req.method === 'POST' && /^\/(v1\/)?fetch$/.test(req.url)) {
      const inChunks = []
      req.on('data', c => inChunks.push(c))
      req.on('end', async () => {
        const fail = (code, message) => {
          res.writeHead(code, { 'content-type': 'application/json' })
          res.end(JSON.stringify({ error: message }))
        }
        let target
        try {
          target = JSON.parse(Buffer.concat(inChunks).toString('utf8') || '{}').url
        } catch { return fail(400, 'body must be JSON: { "url": "https://…" }') }
        if (!target || typeof target !== 'string') return fail(400, 'missing "url"')
        try {
          const r = await safeFetch(target)
          const ctype = String(r.headers['content-type'] || '').split(';')[0].trim().toLowerCase()
          if (r.status >= 400) return fail(502, `upstream responded ${r.status}`)
          if (FETCH_IMAGE_TYPES.has(ctype)) {
            res.writeHead(200, { 'content-type': 'application/json' })
            return res.end(JSON.stringify({
              kind: 'image', finalUrl: r.finalUrl, status: r.status,
              mediaType: ctype === 'image/jpg' ? 'image/jpeg' : ctype,
              bytes: r.body.length, base64: r.body.toString('base64'),
            }))
          }
          if (FETCH_TEXT_TYPES.test(ctype)) {
            const raw = r.body.toString('utf8')
            const isHtml = /html/.test(ctype)
            const { title, text, images } = isHtml ? htmlToText(raw, r.finalUrl) : { title: undefined, text: raw, images: [] }
            res.writeHead(200, { 'content-type': 'application/json' })
            return res.end(JSON.stringify({
              kind: 'text', finalUrl: r.finalUrl, status: r.status, contentType: ctype,
              title, bytes: r.body.length, text, images,
              // Honest about the ceiling: a JS-rendered page yields a shell here.
              note: isHtml && text.length < 200
                ? 'Very little text — this page probably renders its content with JavaScript, which a plain fetch cannot execute. Try a direct resource URL (image, raw file, API/JSON endpoint) or ask the user to paste the content.'
                : undefined,
            }))
          }
          return fail(415, `unsupported content-type "${ctype || 'unknown'}" — only text/HTML/JSON and png/jpeg/gif/webp are returned`)
        } catch (e) {
          return fail(400, e?.message || String(e))
        }
      })
      return
    }

    // Generic authenticated forwarder: /v1/<path> (or /<path>) → Copilot.
    // Covers /chat/completions, /responses, /models uniformly so both the
    // Chat Completions and Responses API tracks work through one proxy.
    const upstreamPath = req.url.replace(/^\/v1(?=\/)/, '') || '/'
    const target = COPILOT_BASE + upstreamPath
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', async () => {
      try {
        const tok = await getSessionToken(oauth)
        let body
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          body = Buffer.concat(chunks)
          if (upstreamPath === '/chat/completions') body = adaptBody(body)
        }
        // Per-request timing + token usage, only when COPILOT_PROXY_DEBUG is set.
        let reqMeta = ''
        if (DEBUG && body) {
          try {
            const rb = JSON.parse(body.toString('utf8'))
            reqMeta = ` model=${rb.model} maxOut=${rb.max_output_tokens ?? rb.max_completion_tokens ?? rb.max_tokens ?? '-'} effort=${rb.reasoning_effort ?? rb.reasoning?.effort ?? 'default'} reqKB=${Math.round(body.length / 1024)}`
          } catch {}
        }
        const reqHeaders = { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json', ...COPILOT_HEADERS }
        const t0 = Date.now()
        let upstream = await fetch(target, { method: req.method, headers: reqHeaders, body })

        // SSE PASS-THROUGH: successful event streams are piped chunk-by-chunk so
        // the client sees tokens LIVE (buffering here made the panel's thinking
        // ticker impossible — the whole stream arrived in one lump at the end).
        // The bytes are teed into a buffer for the same debug summary as before.
        const upstreamCT = upstream.headers.get('content-type') || ''
        if (upstream.ok && upstreamCT.includes('text/event-stream') && upstream.body) {
          res.writeHead(upstream.status, {
            'Content-Type': upstreamCT,
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
          })
          let streamed = ''
          try {
            for await (const chunk of upstream.body) {
              res.write(chunk)
              if (DEBUG) streamed += Buffer.from(chunk).toString('utf8')
            }
          } catch (err) {
            console.error(`[proxy] upstream stream broke after ${Date.now() - t0}ms: ${err instanceof Error ? err.message : err}`)
          } finally {
            res.end()
          }
          if (DEBUG) {
            const lines = streamed.split('\n').filter(l => l.startsWith('data:'))
            const sawDone = lines.some(l => l.slice(5).trim() === '[DONE]')
            let finish = '-'
            let lastComplete = true
            for (const l of lines) {
              const p = l.slice(5).trim()
              if (p === '[DONE]') continue
              try {
                const j = JSON.parse(p)
                const f = j.choices?.[0]?.finish_reason
                if (f) finish = f
              } catch { lastComplete = false }
            }
            let shape = ` sse=${Math.round(streamed.length / 1024)}KB events=${lines.length} done=${sawDone} finish=${finish} cleanTail=${lastComplete} STREAMED`
            if (!sawDone || !lastComplete) {
              try {
                const fs = await import('node:fs')
                const dump = `/tmp/copilot-proxy-truncated-${Date.now()}.sse`
                fs.writeFileSync(dump, streamed)
                shape += ` dumped=${dump}`
              } catch {}
            }
            console.log(`[proxy] ${upstreamPath} ${upstream.status} ${Date.now() - t0}ms${reqMeta}${shape}`)
          }
          return
        }

        let text = await upstream.text()

        // Copilot 400s when a model rejects a field its /models entry implied it supports —
        // seen with Gemini chat + OpenAI's `reasoning_effort`, and reasoning models that want
        // `max_completion_tokens` instead of `max_tokens`. Retry per known-incompatible field
        // and adopt the first variant that succeeds, so the panel needn't know each quirk.
        if (!upstream.ok && upstream.status === 400 && upstreamPath === '/chat/completions') {
          let rb
          try { rb = JSON.parse(body.toString('utf8')) } catch {}
          const variants = []
          if (rb && rb.reasoning_effort != null) {
            const v = { ...rb }; delete v.reasoning_effort
            variants.push(['dropped reasoning_effort', v])
          }
          if (rb && rb.max_tokens != null && rb.max_completion_tokens == null) {
            const v = { ...rb, max_completion_tokens: rb.max_tokens }; delete v.max_tokens
            variants.push(['max_tokens→max_completion_tokens', v])
            if (rb.reasoning_effort != null) {
              const v2 = { ...v }; delete v2.reasoning_effort
              variants.push(['both', v2])
            }
          }
          for (const [note, v] of variants) {
            const r = await fetch(target, { method: req.method, headers: reqHeaders, body: Buffer.from(JSON.stringify(v)) })
            const tx = await r.text()
            if (r.ok) {
              console.error(`[copilot 400 recovered for ${rb.model}: ${note}]`)
              upstream = r
              text = tx
              break
            }
          }
        }
        if (DEBUG) {
          let usage = ''
          let shape = ''
          try {
            const j = JSON.parse(text)
            const u = j.usage || {}
            const inTok = u.input_tokens ?? u.prompt_tokens
            const outTok = u.output_tokens ?? u.completion_tokens
            const reason = u.output_tokens_details?.reasoning_tokens ?? u.completion_tokens_details?.reasoning_tokens
            if (inTok != null || outTok != null) usage = ` in=${inTok} out=${outTok} reasoning=${reason ?? '-'}`
            // Responses API turn-shape: WHY did the round end, and what did it emit?
            // status=incomplete + reason max_output_tokens = truncation (the model was
            // cut off, possibly before its tool call) — the key signal for dying turns.
            if (j.object === 'response' || Array.isArray(j.output)) {
              const items = (j.output ?? []).map(o => o.type).join(',')
              shape = ` status=${j.status ?? '-'}${j.incomplete_details ? ` incomplete=${j.incomplete_details.reason}` : ''} output=[${items}]`
            } else if (Array.isArray(j.choices)) {
              // Chat Completions shape: finish_reason is THE signal (stop | length | tool_calls).
              const c = j.choices[0] ?? {}
              const toolCalls = Array.isArray(c.message?.tool_calls) ? c.message.tool_calls.length : 0
              const textLen = typeof c.message?.content === 'string' ? c.message.content.length : 0
              shape = ` finish=${c.finish_reason ?? '-'} tool_calls=${toolCalls} textChars=${textLen}`
            }
          } catch {}
          // Streamed (SSE) bodies don't JSON.parse — summarize them instead:
          // total size, whether the stream ended cleanly ([DONE]), the last
          // finish_reason seen, and whether the final data line is complete
          // JSON (a cut mid-line means upstream truncated the stream).
          if (!shape && text.trimStart().startsWith('data:')) {
            const lines = text.split('\n').filter(l => l.startsWith('data:'))
            const sawDone = lines.some(l => l.slice(5).trim() === '[DONE]')
            let finish = '-'
            let lastComplete = true
            for (const l of lines) {
              const p = l.slice(5).trim()
              if (p === '[DONE]') continue
              try {
                const j = JSON.parse(p)
                const f = j.choices?.[0]?.finish_reason
                if (f) finish = f
              } catch { lastComplete = false }
            }
            shape = ` sse=${Math.round(text.length / 1024)}KB events=${lines.length} done=${sawDone} finish=${finish} cleanTail=${lastComplete}`
            if (!sawDone || !lastComplete) {
              try {
                const fs = await import('node:fs')
                const dump = `/tmp/copilot-proxy-truncated-${Date.now()}.sse`
                fs.writeFileSync(dump, text)
                shape += ` dumped=${dump}`
              } catch {}
            }
          }
          console.log(`[proxy] ${upstreamPath} ${upstream.status} ${Date.now() - t0}ms${reqMeta}${usage}${shape}`)
        }
        if (!upstream.ok) {
          // On an error, show what WE sent (the fields most likely to be rejected) plus the
          // full upstream message — Copilot often returns a bare "Bad Request" otherwise.
          let sent = ''
          try {
            const rb = JSON.parse((body || Buffer.from('{}')).toString('utf8'))
            sent =
              ` | sent: model=${rb.model} max_tokens=${rb.max_tokens ?? '-'}` +
              ` max_completion_tokens=${rb.max_completion_tokens ?? '-'} reasoning_effort=${rb.reasoning_effort ?? '-'}` +
              ` tools=${Array.isArray(rb.tools) ? rb.tools.length : '-'} msgs=${Array.isArray(rb.messages) ? rb.messages.length : '-'}`
          } catch {}
          console.error(`[copilot ${upstream.status} ${upstreamPath}]${sent}\n  resp: ${text.slice(0, 800)}`)
        }
        res.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') || 'application/json' })
        res.end(text)
      } catch (e) {
        res.writeHead(502, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: String((e && e.message) || e) }))
      }
    })
  })

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Copilot proxy listening on http://localhost:${PORT}`)
    console.log(`  /v1/chat/completions  →  ${COPILOT_BASE}/chat/completions`)
    console.log(`  /v1/responses         →  ${COPILOT_BASE}/responses`)
  })
}

// ─── main ─────────────────────────────────────────────────────────────────────

const cmd = process.argv[2]
const run = cmd === 'auth' ? ensureOAuth().then(() => {}) : cmd === 'models' ? listModels() : serve()
run.catch(e => {
  console.error('\n' + ((e && e.message) || e) + '\n')
  process.exit(1)
})
