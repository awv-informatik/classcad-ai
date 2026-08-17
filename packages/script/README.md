# @classcad/script

The universal script medium for ClassCAD agents: execute model-written
JavaScript against a **session-abstracted API** — identical in the browser
([buerli](https://buerli.io) apps), in the ClassCAD MCP, and in headless
Node harnesses/CI. CAD construction is mostly computation; this package lets
an agent write a real program (variables, `Math`, loops, geometry filtering)
instead of dictating one API call per model turn.

```js
import { connectSession, buildScriptApi, runScript } from '@classcad/script/node'

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
// res → { ok: true, returned: { partId: 4, shellPoint: [20, 0, 10] }, logs: ['shell found: true'] }
```

## The portability contract

Scripts see an `api` object with a **guaranteed surface** that exists in every
environment, plus **optional capabilities** a client may inject:

| Surface | Availability | What it is |
| --- | --- | --- |
| `api.v1.<domain>.<method>(params)` | guaranteed | ClassCAD command, await-able, → `{ result, maxLevel, messages, … }`. With a registry, typos **throw immediately with suggestions** (`"v1.part.bxo" — Did you mean: box?`). |
| `api.tree({ refresh? })` | guaranteed | the structure tree (id → node): find parts, features, sketches by class/name |
| `api.graphic({ recalc? })` | guaranteed | the graphic payload (containers with face meshes, edges, vertices): scripts find and **filter geometry themselves** |
| `api.env` | guaranteed | `'node'` \| `'browser'` |
| `api.facade` / `api.structure` / `api.selection` / … | optional | client capabilities injected via `session.namespaces` (buerli browser apps have them; WS sessions don't). Guard with `if (api.facade) …` |

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

`(code: string, session: ScriptSession, opts?: RunScriptOptions) => Promise<RunScriptResult>`

Executes `code` as an **async function body** (use `await` directly,
`return <small value>` for the result). Captured `console.log/info/warn/error`
(alias `log(...)`) come back alongside the return value. **Never throws** —
syntax errors, runtime errors and timeouts return
`{ ok: false, error, logs }` with the log tail preserved (printf debugging
survives failure).

Environment globals are shadowed in BOTH flavors (`window`, `fetch`,
`process`, `require`, …): scripts drive the CAD API, nothing else. This is
defense-in-depth against accidental use, not a security sandbox — the CAD API
itself is the capability boundary.

| `RunScriptOptions` | Default | Description |
| --- | --- | --- |
| `registry` | — | the v1 method registry (`@classcad/skill/method-registry.json`). With it, `api.v1` is validated (typos throw with suggestions); without it, a permissive proxy routes any name and the engine reports unknown commands. |
| `timeoutMs` | `60000` | timeout for awaited work (max 300000). A run-away sync loop cannot be interrupted — scripts must terminate. |
| `maxLogEntries` / `maxLogChars` | `300` / `16000` | console capture caps |
| `maxResultChars` | `24000` | JSON cap on the returned value — truncation is explicit, never silent |

**`RunScriptResult`:** `{ ok: boolean, returned?, logs: string[], error? }`.

### `buildScriptApi(session, opts?)`

`(session: ScriptSession, opts?: { registry? }) => api`

Builds the `api` object described above for any session — use it directly
when you host scripts yourself (the harness does exactly this and hands `api`
to training scripts).

### `ScriptSession` — the abstraction that makes scripts universal

Implement this to plug in a new environment:

| Member | Description |
| --- | --- |
| `env` | `'node'` \| `'browser'` |
| `execute(task)` | run one command in harness-task form: `execute({ 'v1.part.box': [{ id, length }] }) → Envelope`. API errors live in the envelope (`maxLevel`/`messages`), not in rejections. |
| `getTree(opts?)` | current structure tree; `{ refresh: true }` forces a server round-trip where applicable |
| `getGraphic(opts?)` | current graphic payload or `null`; honor `{ recalc: false }` |
| `namespaces?` | optional capabilities to surface on `api` (core keys `v1/tree/graphic/env` cannot be overridden) |
| `close?()` | teardown |

Shipped implementations: **`connectSession`** below (Node/WS);
`@buerli.io/ai` provides the browser session over the buerli store.

### `connectSession(url?, opts?)` — Node only (`@classcad/script/node`)

`(url = 'ws://0.0.0.0:9094/', opts?: { graphics?, debug?, namespaces? }) => Promise<NodeSession>`

Connects to a ClassCAD worker (classcad-cli) and returns a session that
additionally satisfies the `@classcad/renderer` node-client contract
(`request`, `getLastGraphic`, `getStructure`) — **one connection serves
scripts and renders**:

```js
import { connectSession, buildScriptApi } from '@classcad/script/node'
import { renderSession } from '@classcad/renderer/node'

const session = await connectSession()
const api = buildScriptApi(session, { registry })
// … drive the model via api …
await renderSession(session, 'check', './out', { sheet: true })
session.close()
```

Details it handles for you: the mandatory `Configuration` handshake, response
correlation with timeouts, INFO-message filtering, structure snapshots riding
every `Result`, and curve-container accumulation (the server pushes graphic
data only for the first curve per shape).

## Consumers in this monorepo

| Consumer | How it uses this package |
| --- | --- |
| `@buerli.io/ai` (browser panel) | `run_script` tool = `runScript` over its browser session; buerli namespaces injected as optional capabilities |
| `classcad-mcp` (MCP server) | `run_script` tool over its WS client |
| the training harness (`scripts/run.mjs`) | training scripts receive `buildScriptApi(session)` + a renderer-backed `snapshot()` |
