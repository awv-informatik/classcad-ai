# @classcad/script

The universal script medium for ClassCAD agents: execute model-written
JavaScript against a **session-abstracted API** — identical in the browser
([buerli](https://buerli.io) apps), in the ClassCAD MCP, and in headless Node
harnesses/CI. CAD construction is mostly computation; this package lets an
agent write a real program (variables, `Math`, loops, geometry filtering)
instead of dictating one API call per model turn.

## Install & entry points

```bash
npm install @classcad/script
```

The package has two entry points — the split exists because the WS session
needs Node (`ws`, `node:crypto`), while everything else must also run in a
browser bundle:

| Entry point | Environment | Exports |
| --- | --- | --- |
| `@classcad/script` | browser + Node | [`runScript`](#runscriptcode-session-opts), [`buildScriptApi`](#buildscriptapisession-opts), all types ([`ScriptSession`](#scriptsession), `RunScriptOptions`, `RunScriptResult`, …) |
| `@classcad/script/node` | Node only | everything above **plus** [`connectSession`](#connectsessionurl-opts--node-only) (the WebSocket session for a classcad-cli worker) |
| `@classcad/script/docs` | browser + Node | `docs` — the [data contract](#the-data-contract-docs) documents as markdown strings (`docs.DATA`, `docs.STRUCTURE`, `docs.GRAPHICS`) |

In the browser you import from `@classcad/script` and provide your own session
(buerli-ai does this over the `@buerli.io/classcad` WASM client); in Node you
import from `@classcad/script/node` and get the WS session included.

## Quick start (Node, against a classcad-cli worker)

```js
import { connectSession, runScript } from '@classcad/script/node'
// The method registry makes api.v1 typo-safe. It ships with @classcad/skill:
import registry from '@classcad/skill/method-registry.json' with { type: 'json' }

const session = await connectSession()            // ws://0.0.0.0:9094/

const res = await runScript(`
  const partId = (await api.v1.part.create({ name: 'Demo' })).result
  await api.v1.part.cylinder({ id: partId, diameter: 40, height: 20 })

  // find the shell face by filtering REAL geometry: every vertex at radius 20
  const g = await api.graphic()
  const shell = g.containers.flatMap(c => c.meshes ?? []).find(m => {
    for (let i = 0; i < m.vertices.length; i += 3) {
      if (Math.abs(Math.hypot(m.vertices[i], m.vertices[i + 1]) - 20) > 0.01) return false
    }
    return m.vertices.length > 0
  })
  console.log('shell found:', !!shell)
  return { partId, shellPoint: [20, 0, 10] }   // hand faces onward as world POINTS
`, session, { registry })

// res → { ok: true, returned: { partId: 4, shellPoint: [20, 0, 10] },
//         logs: ['shell found: true'] }
session.close()
```

## What a script sees

Scripts run as an **async function body**: `await` directly, `return` a small
value, `console.log(...)` (alias `log(...)`) is captured and returned. The
`api` object has a **guaranteed surface** that exists in every environment,
plus **optional capabilities** a client may inject:

| Surface | Availability | What it does |
| --- | --- | --- |
| `api.v1.<domain>.<method>(params)` | guaranteed | one ClassCAD command, → `{ result, maxLevel, messages, … }`. With a registry, unknown names **throw immediately with suggestions** (`"v1.part.bxo" — Did you mean: box?`) instead of failing downstream. |
| `api.tree({ refresh? })` | guaranteed | the structure tree (id → node): find parts, features, sketches by `class`/`name` |
| `api.graphic({ recalc? })` | guaranteed | the graphic payload (containers with face meshes, edges, vertices): scripts locate and **filter geometry themselves** |
| `api.env` | guaranteed | `'node'` \| `'browser'` |
| `api.facade` / `api.structure` / `api.selection` / … | optional | client capabilities injected via [`session.namespaces`](#scriptsession) (buerli browser apps have them; WS sessions don't). Guard with `if (api.facade) …` |

**A script that sticks to the guaranteed surface runs unchanged everywhere.**

Two rules worth teaching every agent:

- **Face/edge ids are payload-local.** Re-tessellation reassigns mesh/edge ids
  between graphic frames. To hand a face to another tool (e.g. a renderer
  highlight), return a **world point on it**, not its id.
- **`recalc` destroys entity-injection bodies.** Pass
  `api.graphic({ recalc: false })` in `solid.*`/EIF direct-modeling sessions.

---

## API

### `runScript(code, session, opts?)`

```ts
runScript(code: string, session: ScriptSession, opts?: RunScriptOptions): Promise<RunScriptResult>
```

Compiles `code` as an async function body, builds the `api` object for
`session` (via [`buildScriptApi`](#buildscriptapisession-opts)), executes with
console capture and a timeout, and returns the outcome. **Never throws** —
syntax errors, runtime errors and timeouts come back as
`{ ok: false, error, logs }` with the captured logs preserved (printf
debugging survives failure).

Environment globals are shadowed in BOTH flavors (`window`, `document`,
`fetch`, `process`, `require`, …): scripts drive the CAD API, nothing else.
This is defense-in-depth against accidental use, not a security sandbox — the
CAD API itself is the capability boundary.

**`RunScriptOptions`:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `registry` | MethodRegistry | — | the v1 method registry — import it from `@classcad/skill/method-registry.json` (or pass the one your app already loaded). With it, `api.v1` is generated and validated: typos throw with suggestions. Without it, `api.v1` is a permissive proxy — any name routes to the engine, which then reports unknown commands. |
| `timeoutMs` | number | `60000` | timeout for **awaited** work (max 300000). A runaway synchronous loop cannot be interrupted — scripts must terminate. |
| `maxLogEntries` | number | `300` | captured console entries cap |
| `maxLogChars` | number | `16000` | captured console characters cap |
| `maxResultChars` | number | `24000` | JSON cap on the returned value — truncation is explicit (a marker says what happened), never silent |

**`RunScriptResult`:**

| Field | Type | Description |
| --- | --- | --- |
| `ok` | boolean | whether the script completed |
| `returned` | unknown | the script's return value (JSON-capped), when `ok` |
| `logs` | string[] | captured console output — present on success AND failure |
| `error` | string | syntax/runtime/timeout message, when not `ok` |

### `buildScriptApi(session, opts?)`

```ts
buildScriptApi(session: ScriptSession, opts?: { registry?: MethodRegistry }): api
```

Builds the [`api` object](#what-a-script-sees) for a session **without**
executing anything — use it when you host script-like code yourself. The
training harness does exactly this: it hands `buildScriptApi(session, { registry })`
to training scripts as their `api` argument.

- With `opts.registry`: `api.v1` contains exactly the registry's domains and
  methods; unknown domain or method access throws immediately with
  edit-distance suggestions.
- Without: `api.v1` is a permissive proxy (any `v1.<domain>.<method>` routes
  to `session.execute`).
- `session.namespaces` entries appear on `api` as-is — core keys
  (`v1`/`tree`/`graphic`/`env`) cannot be overridden.

### `connectSession(url?, opts?)` — Node only

```ts
connectSession(url = 'ws://0.0.0.0:9094/', opts?: NodeSessionOptions): Promise<NodeSession>
```

Connects to a ClassCAD worker (classcad-cli) over WebSocket and returns a
ready [`ScriptSession`](#scriptsession). It handles the protocol details for
you: the mandatory `Configuration` handshake, request/response correlation
with timeouts, INFO-message filtering, structure snapshots (they ride along on
every `Result` frame), and curve-container accumulation (the server pushes
graphic data only for the first curve per shape).

**`NodeSessionOptions`:** `graphics` (default `true` — server-side graphic
push), `debug` (default `false` — disables all timeouts), `namespaces`
(extra capabilities to expose on the script api).

**`NodeSession`** extends `ScriptSession` with `request(command, extra?)`
(raw protocol commands like `GetTree`), `getLastGraphic()`, `getStructure()`
and `close()`. It deliberately **also satisfies the `@classcad/renderer`
node-client contract**, so one connection serves scripts and renders:

```js
import { connectSession, buildScriptApi } from '@classcad/script/node'
import { renderSession } from '@classcad/renderer/node'
import registry from '@classcad/skill/method-registry.json' with { type: 'json' }

const session = await connectSession()
const api = buildScriptApi(session, { registry })
const partId = (await api.v1.part.create({ name: 'Part' })).result
await api.v1.part.cylinder({ id: partId, diameter: 40, height: 20 })
await renderSession(session, 'check', './out', { sheet: true })   // same connection
session.close()
```

### `ScriptSession`

The abstraction that makes scripts universal — implement it to plug in a new
environment:

```ts
interface ScriptSession {
  env: 'node' | 'browser'
  execute(task: Task): Promise<Envelope>
  getTree(opts?: { refresh?: boolean }): Promise<Tree>
  getGraphic(opts?: { recalc?: boolean }): Promise<Graphic | null>
  namespaces?: Record<string, unknown>
  close?(): void | Promise<void>
}
```

| Member | Contract |
| --- | --- |
| `execute(task)` | run one command in harness-task form: `execute({ 'v1.part.box': [{ id, length }] })` → the envelope `{ result, maxLevel, messages, … }`. API errors live **in the envelope** (`maxLevel ≥ 51`), not in promise rejections. |
| `getTree(opts?)` | the current structure tree (id → node). `{ refresh: true }` forces a server round-trip where the environment caches. |
| `getGraphic(opts?)` | the current graphic payload (`{ containers }`) or `null`. Must honor `{ recalc: false }` (direct-modeling sessions). |
| `namespaces` | optional capabilities surfaced on `api` (e.g. buerli's `facade`/`structure`/`selection`) |

Shipped implementations: [`connectSession`](#connectsessionurl-opts--node-only)
(Node/WS, this package) and the browser session in `@buerli.io/ai` (over the
buerli store + WASM client).

## The data contract (docs/)

What scripts get back from `api.tree()` and `api.graphic()` is a contract of
this package, documented in [docs/](docs/):

| Document | Content |
| --- | --- |
| [docs/DATA.md](docs/DATA.md) | The distilled day-to-day contract: node/graphic shapes, which ids are stable vs payload-local, verified selection idioms |
| [docs/STRUCTURE.md](docs/STRUCTURE.md) | The model tree in depth: part anatomy, features & history, sketches, assemblies (instances, transforms), traversal snippets |
| [docs/GRAPHICS.md](docs/GRAPHICS.md) | The graphic payload in depth: containers, meshes, edges, materials |

Agent hosts serve them to their models under the same names — buerli-ai via
`read_doc("DATA")`, the ClassCAD MCP via `describe_method("DATA")` — by
importing them from `@classcad/script/docs` (markdown strings, bundler-safe,
no filesystem access needed).

## Consumers in this monorepo

| Consumer | How it uses this package |
| --- | --- |
| `@buerli.io/ai` (browser panel) | `run_script` tool = `runScript` over its browser session; buerli namespaces injected as optional capabilities |
| `classcad-mcp` (MCP server) | `run_script` tool over its WS client |
| the training harness (`scripts/run.mjs`) | training scripts receive `buildScriptApi(session, { registry })` as their `api` |
