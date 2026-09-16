# Plan: In-app LLM credentials — Copilot per-user login via Firebase relay, Anthropic/OpenAI placeholders, proxy + env tokens decommissioned

## Context

buerligons reaches GitHub Copilot today through `packages/buerli-ai/bin/copilot-proxy.mjs`: a localhost relay holding ONE developer's Copilot OAuth token from `.env.local`, with the apps gated on `AI_AGENT_*` env keys baked into the Docusaurus bundle. Verified on 2026-08-22 with real requests:

| Endpoint | Browser-callable? | Evidence |
|---|---|---|
| `api.github.com/copilot_internal/v2/token` (OAuth → ~25-min session token) | **yes** | real response `ACAO: *`; `Copilot-Integration-Id` allowed |
| `api.githubcopilot.com/models`, `/chat/completions` streaming | **yes** | 200, `text/event-stream`, `ACAO: *` |
| `api.anthropic.com/v1/messages`, `api.openai.com/v1/*` | **yes** | preflight OK |
| `github.com/login/device/code` + `/login/oauth/access_token` (device flow) | **no** | browser can send but cannot read the response |
| gh CLI token at the Copilot exchange | **no** | 403 — only tokens minted for the Copilot editor client id |

So: all model traffic goes browser → provider directly with the **user's own seat**; the only server piece is a 2-route relay for the device-flow handshake (user decision: build it now, in the existing `api` Cloud Function). Tokens rotate every ~25 min → providers need an auth *source*, not a static key. Decisions taken with the user: relay now · localStorage · panel-owned credentials (`createCadAgent({})`, app passes no provider).

Policy note for the connect dialog: each developer uses their **own** Copilot seat (no seat sharing); the editor client id / `copilot_internal` path is the same unofficial footing as copilot.lua/Zed — dev-team only, no public URLs; public rollout later uses OpenAI/Anthropic billing through the `managed` strategy below.

## Architecture

```
buerli-backend (Firebase fn `api`, project buerli)      browser (buerligons / starter)
  POST /v1/copilot/device/start ──github.com──┐         AgentPanel (managed mode)
  POST /v1/copilot/device/poll  ──github.com──┘ ◄──────  ConnectView: Copilot ▸ sign in (device flow via relay)
  POST /v1/fetch (SSRF-hardened)  ◄──────────────────── fetch_url tool (agent loop)
                                                           │            OpenAI / Anthropic ▸ paste API key
                                                           ▼
                                              credential store (localStorage buerli-ai.credentials.v1)
                                                           ▼
                                              AuthSource → provider (createAutoProvider / createAnthropicProvider)
                                                           ▼ direct, streaming
                                              api.githubcopilot.com · api.openai.com · api.anthropic.com
```

## Part 1 — buerli-ai: auth layer (`packages/buerli-ai/src/auth/`)

New files (no new dependencies; zustand is already a peer dep):

- `types.ts` — `ProviderId = 'copilot' | 'openai' | 'anthropic'`; `AuthSource { getAuth(opts?: {refresh?}): Promise<{headers}>; refreshable: boolean; invalidate() }`; `ConnectStrategy = {kind:'device-flow-relay', relayUrl} | {kind:'api-key', placeholder, keyHint?} | {kind:'managed', relayBase}` (managed = reserved for the public/billing phase); `ProviderDescriptor { id, label, blurb, baseUrl, defaultModel, connect, createAuthSource(secret, hooks), createProvider(auth, {model}) }`; `CredentialRecord { provider, kind:'oauth-token'|'api-key', secret, savedAt }`; `CredentialsState { version:1, active, records, model, status (runtime only) }`; `DeviceFlowStart/Poll` shapes (mirror the relay routes).
- `errors.ts` — `class AuthError extends Error { provider; status }`.
- `fetchWithAuth.ts` — spreads `(await auth.getAuth()).headers`; on 401 and `auth.refreshable` → `getAuth({refresh:true})` once and re-POST (bodies are strings); second 401 or any 403 → `AuthError`.
- `apiKeySource.ts` — `createApiKeySource(headers)` (static, `refreshable:false`).
- `copilotSession.ts` — port of `bin/copilot-proxy.mjs:219-239`: `COPILOT_EDITOR_HEADERS` = the verified set from `:69-74` (`Editor-Version: vscode/1.95.0`, `Editor-Plugin-Version: copilot-chat/0.22.0`, `Copilot-Integration-Id: vscode-chat`, `User-Agent` — note browsers other than Chrome drop `User-Agent`; verification confirms the other three suffice); `createCopilotAuthSource(oauthToken, hooks)` caches `{token, expiresAt}` in memory (never persisted), 5-min safety margin, `expires_at*1000 ?? now+25min`, exchange 401/403 → `hooks.onAuthFailure` + `AuthError`.
- `deviceFlow.ts` — browser client of the relay: `startDeviceFlow(relayUrl)` → `{userCode, verificationUri, deviceCode, interval, expiresIn}`; `pollDeviceFlow(relayUrl, deviceCode, interval, signal)` → resolves the OAuth token, honours `slow_down` (+5 s), aborts on `expires_in`.
- `registry.ts` — `PROVIDER_REGISTRY`: `copilot` (base `https://api.githubcopilot.com`, default `gpt-5.5`, `device-flow-relay`, `createAutoProvider({auth, endpoint: base, model})`), `openai` (`https://api.openai.com/v1`, `api-key` hint `/^sk-/`, `createAutoProvider`), `anthropic` (`https://api.anthropic.com/v1`, `api-key` hint `/^sk-ant-/`, `createAnthropicProvider({auth, endpoint: base+'/messages'})`). The later public phase swaps strategies to `managed` here — nothing else changes.
- `validate.ts` — `validateCredential(descriptor, secret)` = build auth + provider, `provider.getCapabilities()` (the `/models` probe; for Copilot it also exercises the token exchange); maps `AuthError`/network errors to user text; returns `caps` to seed the picker.
- `store.ts` — zustand **vanilla** store, storage key `buerli-ai.credentials.v1`, persists `{version, active, records, model}`; `hydrate()` runs from a `useEffect` (SSR-safe: `typeof window` guard + try/catch + shape validation, house pattern `classcad.ch/src/components/downloads.jsx:79-93`); actions `connect`, `setActive`, `disconnect`, `setModel`, `markReconnect`, `markOk`; `getDefaultCredentialStore()` singleton + `createCredentialStore({storageKey, storage})` for hosts/tests. localStorage because the editor opens in a new window (`editor.jsx` opener) and sessionStorage does not reliably carry across `window.open`; XSS exposure is identical on the same origin; Disconnect wipes it.
- `useActiveProvider.ts` — `useMemo` keyed on `[active, record.secret]` (NOT on model) → provider identity changes only on connect/switch/disconnect, which is exactly what the existing discovery effect (`AgentPanel.tsx:114-129`) keys on; auth hook `onAuthFailure → store.markReconnect(id)`.
- `index.ts` barrel; public exports added to `src/index.ts` (store, registry, auth sources, `validateCredential`, `AuthError`, types) so custom hosts get the same building blocks.

## Part 2 — buerli-ai: providers take an `AuthSource`

- `provider-openai.ts`, `provider-responses.ts`, `provider.ts` (Anthropic), `provider-auto.ts`: config gains `auth?: AuthSource`, keeps `apiKey?: string` as sugar (wrapped into `createApiKeySource` with the right scheme — `Bearer` / Anthropic bundle `x-api-key` + `anthropic-version` + `anthropic-dangerous-direct-browser-access`) so the README's local-LLM examples stay valid. All header literals replaced by `fetchWithAuth`. `provider-auto.ts:49-50` passes `auth` through (no more by-value key copy); its `/models` fetch (`:58-60`) goes through `fetchWithAuth`; proxy wording at `:10-11,20,23,69` removed.
- **Migrate what the proxy absorbed** into `provider-openai.ts`: `adaptChatBody` (`copilot-proxy.mjs:252-264`: `gpt-5*` `max_tokens`→`max_completion_tokens`) before the POST, and `postChatWithRecovery` (`:714-745`: on 400 retry with `reasoning_effort` dropped / `max_tokens` swapped / both, adopt first OK, `console.warn` the recovery). Chat Completions only, as before.
- `agentLoop.ts:130-151` — in the 3-attempt transient retry: `if (e instanceof AuthError) break` (no triple re-mint; the normal `{type:'error'}` carries the message; the store was already marked via the hook).
- **Delete `provider-copilot.ts`** (+ exports `index.ts:15-16`): byte-level duplicate of the chat adapter with an unverified header set; Copilot = `createAutoProvider` + `createCopilotAuthSource`, the path verified through the proxy.

## Part 3 — buerli-ai: `fetch_url` goes through the Firebase relay (same backend, same step)

One option instead of two URLs: `createCadAgent({ relayBase? })`, default `https://buerli-backend.web.app/api/v1` — the device flow uses `${relayBase}/copilot/device/*`, web fetch uses `${relayBase}/fetch`. `relayBase: null` = no relay (custom hosts). Rename `fetchProxyUrl` → `fetchRelayUrl` internally: `types.ts:158-168` (`ToolExecutorContext`) + `AgentConfig.fetchRelayUrl?`; `agentLoop.ts:52-53` filters `fetch_url` out of the schema only when unset (hosts without a relay degrade cleanly — no wasted tokens); `:400-403` passes it to `executeTool`; `buildSystemPrompt` (`:532-536`) appends the fetch bullet only when set (bullet moves from `systemPrompt.ts:28` into an exported `FETCH_URL_PROMPT`); `executor.ts:408-435` drops `DEFAULT_FETCH_PROXY`, POSTs `{url}` to `fetchRelayUrl`, keeps the JSON contract byte-identical (`{kind:'text', finalUrl, status, contentType, title, bytes, text, images[], note?}` / `{kind:'image', finalUrl, status, mediaType, bytes, base64}` / `{error}`), replaces the "start `npx copilot-proxy`" text with "the web-fetch relay at <url> is unreachable"; `schema.ts:171,182` wording ("through the web-fetch relay"). `factory.tsx`/`AgentPanel.tsx` forward `fetchRelayUrl` into the per-send config (`AgentPanel.tsx:222`). The reference-image bookkeeping (`agentLoop.ts:409-417, :442, :568`) stays untouched — it keys on the same `kind:'image'` payload.

## Part 4 — buerli-ai: panel UX (managed mode)

`AgentPanelProps` (`AgentPanel.tsx:43-81`): `provider?` optional, plus `credentials?`, `providers?: ProviderId[]`, `relayUrl?`, `fetchRelayUrl?`. Fixed-provider mode (prop given) = today's behaviour untouched. Managed mode:

- `status 'none'` → body renders `ConnectView` (input row + footer hidden). `'reconnect'` → transcript kept, banner "Session with GitHub Copilot was rejected — Reconnect" (opens ConnectView preselected), input disabled. `'ok'` → existing UI; discovery re-runs because the provider identity changed.
- `ui/ConnectView.tsx` — three provider cards (label, blurb, "Connected" tick), house style = inline styles with `--agent-*` vars, cards reuse `pickerItemStyle` (moved with `pickerBackdropStyle`/`pickerMenuStyle` from `AgentPanel.tsx:1948-1985` into `ui/popoverStyles.ts`). Strategy forms: **device-flow-relay** → "Sign in with GitHub" → shows `user_code` big + "Open github.com/login/device" button (new tab, code copied to clipboard) + "waiting for authorization…" while polling; on token → `validateCredential` → store. Small secondary link "paste a token instead" (textarea) as the fallback when the relay is unreachable. **api-key** → `input type=password`, soft `keyHint` warning, Connect → validate → store. States `idle | starting | waiting | validating | error`. One line of policy text under Copilot: "Uses your own Copilot seat. Org policies may block third-party clients."
- `ui/AccountControl.tsx` — header pill left of `</>` (`AgentPanel.tsx:406-429`): status dot + provider label + `▾`; popover anchored downward (one style variant of `pickerMenuStyle`): one row per connected provider (switch), "Add provider…", "Disconnect <active>". The header is the drag handle; the pill is a `<button>` so the existing `closest('button')` exemption applies.
- Switching provider with a non-empty transcript → confirm + reset (histories carry provider-shaped blocks; cross-API replay would fail). `modelId` seed `store.model[active] ?? modelName ?? descriptor.defaultModel`; `setModelId` writes `store.setModel`.
- `factory.tsx:12-38` — `CreateCadAgentOptions.provider?` optional; add `credentials?`, `providers?`, `relayBase?` (default `https://buerli-backend.web.app/api/v1`, `null` disables both device flow and web fetch); all forwarded (`relayBase` → `ConnectView` device-flow URL and `fetchRelayUrl = relayBase + '/fetch'`).

## Part 5 — the relay (repo `awv-informatik/buerli-backend`, branch `master`)

Use `/Users/dev/dev/awv/buerli-backend` after `git checkout master && git pull` (the `websites/packages/shared-backend` checkout is the same tip but detached and gitignored; `fb-update` there is stale). House style = `validate/validateRoutes.ts`.

- `functions/src/copilot/copilotRoutes.ts` — `copilotRoutes(app: Router)`: `POST /copilot/device/start`, `POST /copilot/device/poll`; mounted in `index.ts` on both `usCentralRoutes` (`/v1`) and `customDomainRoutes` (`/api/v1`) like the others.
- `functions/src/copilot/copilotController.ts` — stateless port of `copilot-proxy.mjs:169-203`: `start` → POST `https://github.com/login/device/code` (`client_id: Iv1.b507a08c87ecfe98`, `scope: read:user`, `Accept: application/json`) → `{ deviceCode, userCode, verificationUri, interval, expiresIn }`; `poll` `{deviceCode}` → POST `/login/oauth/access_token` (grant `urn:ietf:params:oauth:grant-type:device_code`) → `{status:'ok', token}` | `{status:'pending'|'slow_down'}` | `{status:'error', error, description}`. No secrets, no storage, no logging of tokens (`morgan` must not log bodies — it logs request lines only; keep it that way). Node 18+ global `fetch` (functions engine is node 22 in package.json; deployed runtime is nodejs20 — either has `fetch`).
- CORS: existing middleware already allows `http://localhost:3000` + buerli.io/classcad.ch/awv-informatik.ch root domains (preflight from localhost verified 200). No change.
- Deploy: `cd functions && npm run build && firebase deploy --only functions:api --project buerli` (explicit `--project`: `.firebaserc` says `buerli-staging`, which this login cannot access). **Risk to flag**: `functions/package.json` `engines.node = "22"` while the live function runs nodejs20 — deploying will move `api` to nodejs22; acceptable per Firebase support, but it is a runtime change for the whole `api` function — do it deliberately (or pin `engines.node` to `20` first).
- Local dev alternative: `npm run serve` (emulator) → `createCadAgent({ relayBase: 'http://localhost:5001/buerli/us-central1/api/v1' })`.
- **`POST /fetch`** — `functions/src/fetch/fetchRoutes.ts` + `fetchController.ts`: a TypeScript port of the proxy's SSRF-hardened fetcher (`copilot-proxy.mjs:314-476` + route `:562-626`): `isBlockedAddress` (IPv4 0/8, 10/8, 127/8, 169.254/16 — this also covers the GCP metadata server — 172.16/12, 192.168/16, 100.64/10, 192.0/24, 198.18/15, ≥224; IPv6 ::1, ::, fc00::/7, fe80::/10, ff00::/8, ::ffff-mapped), `guardedLookup` (custom `dns.lookup` with `all:true`, every resolved address validated — defeats DNS rebinding; passed as the `lookup` option to `https.request`, so the port is 1:1), `assertFetchableUrl` (http/https only, ports 80/443 only), `safeFetch` (manual redirect loop, every hop re-validated, GET only, no cookies/credentials, 5 MB / 15 s caps, content-type allowlist: text/HTML/JSON + png/jpeg/gif/webp), `htmlToText` (entity decoding, `<img src/srcset>` + image-link harvesting → absolute, deduped `images[]`). Response contract exactly as in Part 3. Sizes fit gen1 limits (5 MB body → ≤ 6.7 MB base64 JSON < 10 MB response cap; 15 s fetch < 60 s function timeout).
  - **Abuse guard for an open fetcher**: require an `Origin` that the CORS allowlist accepts (reject others with 403) — cheap and enough for dev-team/no-public-URL; the `managed` phase upgrades this to `firebaseAuth.verifyIdToken` on `Authorization` (the `api` function already carries `req.fbAuth`), which is also the billing hook.
  - Both routes are mounted like the others (`/v1` and `/api/v1`); the `helmet`/`express.json()` middleware chain is unchanged — `express.json()` default 100 kB body limit is ample for `{url}`.

## Part 6 — decommission

- **buerli-ai**: delete `bin/copilot-proxy.mjs` and the `bin/` dir; `package.json` — remove `bin`, `files` entry `bin`, scripts `proxy`, `proxy:auth`, `proxy:models`; `.gitignore:8` (`.copilot-oauth.json`); `package-lock.json` regenerates; `/Users/dev/dev/awv/classcad-ai/.claude/launch.json` — remove the `copilot-proxy` configuration.
- **websites**: `buerligons.io/src/components/editor.jsx:7-44` → `const agent = createCadAgent({ reasoningEffort: 'medium' }); initAgentAsync()`, render gate `drawingId ? … : null` (keep `ENV.CLASSCAD_WASM_KEY`); `starter.buerli.io/src/Launcher.jsx:10-39, :92` same (`showAgent = AGENT_EXAMPLES.has(active) && !!drawingId`); both `src/config.js` drop `AI_AGENT_*`; both `docusaurus.config.js` drop the six `AI_AGENT_*` keys from `PUBLIC_ENV_KEYS` + the COPILOT comment (`buerligons.io:11-14`), keep the `.env.local` dotenv line (still `CLASSCAD_WASM_KEY`); both `package.json` drop `copilot`, `copilot:auth`, `copilot:models`; both `.gitignore:89-90` drop the stale comment + `.copilot-oauth.json`.
- By hand (untracked, never printed): remove `AI_AGENT_*` and `COPILOT_OAUTH_TOKEN` from `.env.local` in buerligons.io, starter.buerli.io and buerli-ai.
- Docs: `buerli-ai/README.md` — delete §"The local proxy" (261-276); rewrite §`POST /v1/fetch` (278-299) as "Web fetch relay (optional)" spec; tool-table row 125 ("only when `fetchRelayUrl` is configured"); production note 163-172 → dev-team mode (own credential, localStorage) vs public (`managed` relay + billing); provider table drops `createCopilotProvider`; new short "Connect a model" + "Auth sources" sections. `buerligons.io/README.md:17-35` → `.env.local` needs only `CLASSCAD_WASM_KEY`; "AI → Connect → GitHub Copilot → sign in". `classcad.ch/docs/api-usage/ai-integration.mdx:208-211` → point at the new section (anchor is already dead). Leave `workspace/` journals/reviews as history.

## Step order

1. Auth layer (Part 1) → `npm run typecheck` in `packages/buerli-ai`.
2. Providers + `fetchWithAuth` + adaptBody/400-recovery + AuthError short-circuit + delete `provider-copilot.ts` (Part 2) → typecheck.
3. `fetch_url` gating (Part 3) → typecheck.
4. `ui/popoverStyles.ts`, `ConnectView`, `AccountControl`, panel managed mode, `factory.tsx` (Part 4) → typecheck + build.
5. Relay routes in buerli-backend — device flow + `/fetch` port (Part 5), `npm run build`, emulator smoke, deploy `--project buerli`, commit on `master`.
6. Decommission + app reductions + docs (Part 6); `.env.local` cleanup by hand.
7. Verification (below).

## Verification

1. `cd packages/buerli-ai && npm run typecheck && npm run build` clean; `dist` has no `provider-copilot`.
2. Grep gate: `grep -rnE "8788|copilot-proxy|AI_AGENT_|COPILOT_OAUTH|fetchProxyUrl|provider-copilot"` over `classcad-ai/packages/buerli-ai/{src,README.md,package.json}` and `websites/packages/{buerligons.io,starter.buerli.io}/{src,package.json,docusaurus.config.js,README.md}` → no hits.
3. Relay: `curl -X POST https://buerli-backend.web.app/api/v1/copilot/device/start` → JSON with `userCode`; preflight with `Origin: http://localhost:3000` → 200 + `ACAO`; `firebase functions:log --project buerli` shows no token values.
4. Docusaurus (`.claude/launch.json` "buerligons") with `AI_AGENT_*` gone from `.env.local`: editor → **AI** → ConnectView; one `yarn build` proves SSR safety (no `window`/`localStorage` at import).
5. Copilot round trip: Sign in with GitHub → code shown → authorize on github.com → panel validates (`/v2/token` then `/models`) → pickers populate → send "create a 50×30×20 box" → live thinking ticker streams; DevTools Network: `api.github.com/copilot_internal/v2/token`, then `api.githubcopilot.com/responses` or `/chat/completions` with `text/event-stream`, editor headers present, nothing to localhost.
6. Rotation: (a) temporarily set the safety margin to 30 min → each send re-mints (a `/v2/token` before each chat); (b) DevTools response override → 401 on the chat URL → exactly one re-mint, then the AuthError banner + Reconnect; remove override, reconnect works; (c) idle >26 min → next send silent re-mint.
7. Reload → still connected (localStorage); Disconnect → ConnectView, key gone from `localStorage['buerli-ai.credentials.v1']`.
8. OpenAI + Anthropic: paste key → `/models` validates → short prompt answers (Anthropic non-streaming, OpenAI streams); wrong key → inline error, nothing stored; switch provider with transcript → confirm + reset.
9. `fetch_url` via the relay: ask the agent to read `https://www.lehrerfreund.de/technik/1s/zeichenuebung-maulschluessel/4350` → the tool call hits `buerli-backend.web.app/api/v1/fetch`, returns ~10 k chars of text + 13 image URLs (the reference page from the spanner run); then fetch one of its PNG URLs → `kind:'image'` arrives and is registered as a reference image. SSRF gate: `curl -X POST …/api/v1/fetch -H 'Origin: http://localhost:3000' -d '{"url":"http://169.254.169.254/"}'` → 400 refused; same with `http://localhost:9094/`, an `http://…:8080` port, and a hostname that resolves to a private address; a request without an allowlisted `Origin` → 403. With `relayBase: null` the tool is absent from `tools[]` and from the system prompt.
10. 400-recovery: Copilot + a Gemini model + a reasoning level → request succeeds, console `chat 400 recovered … dropped reasoning_effort`.
11. starter dev server: pipes example shows the AI button; credentials are shared via the same origin.
