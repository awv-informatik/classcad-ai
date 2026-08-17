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
  await getSessionToken(oauth) // fail fast if the token is bad

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
            }
          } catch {}
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
