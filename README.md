<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/frontispiece.dark.svg">
  <img width="100%" src="docs/readme/frontispiece.light.svg" alt="Frontispiece and title page. Left: an engineering drawing of a flanged bushing — section A–A, the view from the left and the plan in first-angle projection, dimensioned, with a title block. Right: classcad·ai, or, the Art of Modelling with Agents — wherein a machine is taught to write parametric CAD models as programs, to draw what it has made, and to prove the work in numbers and in pixels. In five parts, with plates.">
</picture>

# classcad-ai

Everything that lets AI agents build and verify CAD models with
[ClassCAD](https://classcad.ch): the API knowledge, the script medium agents
write in, the renderer they check their work with, and the agent hosts — an
MCP server for Claude Code, Claude Desktop, VS Code or Cursor, and a chat panel
for [buerli](https://buerli.io) apps.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/systema.dark.svg">
  <img width="100%" src="docs/readme/systema.light.svg" alt="Plate II, the figurative system of the repository: knowledge (the skill, discovery), execution (the script, the engine), proof (the renderer, the numbers) and hosts (the MCP server, the in-app agent, the harness). Beside it a truss: each of the three hosts bears on all three foundation packages — skill, script and renderer.">
</picture>

Three ideas hold it together:

- **One way to execute.** Agents never call the API one method per turn. They
  write a JavaScript program against `api.v1.*`, `api.tree()` and
  `api.graphic()` and run it through `run_script` — the same medium in the
  browser, in the MCP and in headless Node.
- **One knowledge source.** The method registry, the docs and the search that
  serves them live in `@classcad/skill`; every host registers the identical
  discovery tools from it, so every agent sees the same thing.
- **Verification is built in.** ClassCAD reports success for several
  operations that silently did nothing, so agents prove results with numbers
  (mass properties, geometry probes) and with deterministic renders — not with
  status codes.

## The packages

### @classcad/skill — the knowledge

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/skill.dark.svg">
  <img width="100%" src="docs/readme/skill.light.svg" alt="Plate III, the skill: the API by domain as a table of contents — part 76, assembly 63, sketch 50, common 22, curve 21, solid 21, drawing2d 11; 264 methods in all — and six recipes: constrained sketching, verification, parametric parts, assembly parameters, pattern then subtract, direct modelling.">
</picture>

[`packages/skill`](packages/skill) · `@classcad/skill`

The v1 method registry, generated from the engine's JSDoc; per-method docs
with behavior verified against a live engine (gotchas, silent no-ops, working
examples); and end-to-end recipes. `SKILL.md` makes it a drop-in agent skill.
Its `discovery` module is the one implementation of method search, fuzzy
describe, the compact method index and the bulk `docs` tool that both hosts
serve:

```js
import { createDiscovery } from '@classcad/skill/discovery'
import registry from '@classcad/skill/method-registry.json' with { type: 'json' }
import bundle from '@classcad/skill/bundle.json' with { type: 'json' }

const discovery = createDiscovery({ registry, bundle })
discovery.searchMethods({ search: 'round the edges', limit: 3 })   // → v1.solid.fillet, …, v1.part.fillet
const { text } = await discovery.bulkDocs(['v1.part.fillet', 'recipes/verification'])
```

### @classcad/script — the medium

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/script.dark.svg">
  <img width="100%" src="docs/readme/script.light.svg" alt="Plate IV, the script: a script set as a literate program that creates a plate, adds an 80 by 50 by 10 box, computes its mass properties and returns { part: 4, volume: 40000 }.">
</picture>

[`packages/script`](packages/script) · `@classcad/script`

Runs model-written JavaScript against a session-abstracted `api`. State lives
in the drawing; follow-up scripts attach to the existing model through
`api.tree()`. It also owns the data contract (`DATA`, `STRUCTURE`,
`GRAPHICS`): what `tree` and `graphic` return and how to select geometry from
them.

```js
import { connectSession, runScript } from '@classcad/script/node'
import registry from '@classcad/skill/method-registry.json' with { type: 'json' }

const session = await connectSession()            // classcad-cli worker, ws://localhost:9094
const res = await runScript(`
  const part = (await api.v1.part.create({ name: 'Plate' })).result
  await api.v1.part.box({ id: part, length: 80, width: 50, height: 10 })
  const { volume } = (await api.v1.part.calculateMassProperties({ id: part })).result
  return { part, volume }
`, session, { registry })
// res.returned → { part: 4, volume: 40000 }
```

### @classcad/renderer — the eyes

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/renderer.dark.svg">
  <img width="100%" src="docs/readme/renderer.light.svg" alt="Plate V, the renderer: the six views of the flanged bushing unfolded in first-angle projection, and the ISO projection symbols for first-angle (Europe) and third-angle (the Americas).">
</picture>

[`packages/renderer`](packages/renderer) · `@classcad/renderer`

Turns the live tree and graphic into images: same data, same pixels, no GPU,
no camera state. Named and arbitrary cameras, technical drawings in first- or
third-angle projection with hidden lines dashed, capped and hatched sections,
four-view sheets, highlight by world point, probe markers, pixel diffs with
pinned framing. Portable core plus Node and browser adapters. What it draws:

![@classcad/renderer — iso, first- and third-angle drawings, line style, capped section, diff, sheet, highlight and markers, sketch overlay, annotate, x-ray](packages/renderer/docs/gallery.png)

```js
import { renderSession } from '@classcad/renderer/node'

await renderSession(session, 'plate', './out', {
  drawing: 'first-angle',
  section: { origin: [40, 25, 5], normal: [0, -1, 0] },
})   // → ./out/plate-drawing.png
```

### classcad-mcp — the envoy

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/mcp.dark.svg">
  <img width="100%" src="docs/readme/mcp.light.svg" alt="Plate VI, the MCP server: Claude Code, Claude Desktop, VS Code and Cursor each start a stdio shim; one daemon per machine holds every session and reaches three kinds of engine — a classcad-cli worker, the WASM engine in a buerligons tab, or its own local WASM engine.">
</picture>

[`packages/mcp`](packages/mcp) · `@awv-informatik/classcad-mcp`

Tools: `run_script`, `snapshot`, `docs` / `list_methods` / `describe_method`,
`tree` / `find` / `inspect`, save/load (OFB, STEP, STL), checkpoints, and
sessions — it can join a session an app already has open, or reach the WASM
engine inside a buerligons browser tab. The method index ships in the
initialize instructions, so the model knows the whole API from its first turn.
Without a reachable worker it runs the published WASM engine itself.

```bash
claude mcp add classcad --scope user \
  --env CLASSCAD_WS_URL=ws://localhost:9094/ \
  -- npx -y @awv-informatik/classcad-mcp
```

### @buerli.io/ai — the assistant

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/agent.dark.svg">
  <img width="100%" src="docs/readme/agent.light.svg" alt="Plate VII, the in-app agent: a scroll carries the request “Make a box; in the centre of the top face a hole; then fillet all the edge loops”, and a pointing hand leads to an engraving of the result.">
</picture>

[`packages/buerli-ai`](packages/buerli-ai) · `@buerli.io/ai`

The same tools as the MCP, plus browser extras: the user's selection,
checkpoints, notes, and sub-agents for fresh-eyes checks. See it in
[buerligons](https://buerligons.io):

![The buerli AI assistant panel next to a model it built](packages/buerli-ai/intro.jpg)

```tsx
import { createCadAgent, createAutoProvider, initAgentAsync } from '@buerli.io/ai'

await initAgentAsync()   // once — loads the bundled ClassCAD knowledge
const { AgentPanel } = createCadAgent({
  provider: createAutoProvider({ apiKey: API_KEY, endpoint: API_ENDPOINT }),
})

function Assistant({ drawingId }) {
  return <AgentPanel drawingId={drawingId} open />   // next to your <Canvas>
}
```

## The training agent

The repo root is also the home of **cc**, the agent that trains the skill: a
harness (`scripts/run.mjs`, built on `@classcad/script/node` and
`@classcad/renderer/node`), journals and plans in `workspace/`, and behavior
files (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, …). It runs experiments against a
live `classcad-cli` worker, proves what it finds with renders and numbers, and
writes what survives into the skill — rewritten in place, never as history.
The packages are its deliverable; the hosts are its consumers.

```bash
node scripts/run.mjs path/to/script.mjs     # script exports default (api, { snapshot }) => …
```

## Working in the repo

```bash
npm install        # links all workspaces
npm run build      # skill (registry + bundle), script, renderer, then mcp and buerli-ai
npm test           # every package's tests
```

`skill`, `script` and `renderer` are independent base packages; `mcp` and
`buerli-ai` compose all three. Inside the monorepo, consumers pick up changes
through npm workspaces without a version bump. Publishing stays per package
(each keeps its npm name and `publishConfig`); the repo root is private.

The plates in this README are typeset by
[`docs/readme/build.py`](docs/readme/build.py) — EB Garamond shaped with
HarfBuzz, drawn as outlines with fontTools, printed light and dark. Edit the
text there and run `python3 docs/readme/build.py`.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/colophon.dark.svg">
  <img width="100%" src="docs/readme/colophon.light.svg" alt="Colophon: set in EB Garamond, Georg Duffner's revival of the types of Claude Garamont and Robert Granjon shown in the Egenolff–Berner specimen of 1592; shaped by HarfBuzz and drawn as outlines. The figures show the flanged bushing the renderer draws, in first-angle projection. Each plate is printed twice, as an engraving by day and as a cyanotype by night. Finis.">
</picture>
