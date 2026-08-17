# classcad-ai

The ClassCAD AI monorepo — everything that makes agents build and verify CAD
models, in one place: the knowledge, the script medium, the renderer, and the
agent hosts that compose them.

## The big picture

```
        KNOWLEDGE                                 HOSTS (agents live here)
┌──────────────────────────┐          ┌────────────────────────────────────────┐
│ @classcad/skill          │          │ buerli-ai   in-app panel (browser)     │
│  method-registry.json ───┼──┐       │  run_script · snapshot · docs(bulk) ·  │
│  bundle.json (docs) ─────┼──┤       │  list_methods · tree/find/             │
│  discovery (search/      │  ├──────▶│  inspect · selection · checkpoint ·    │
│   describe/index) ───────┼──┘       │  notes · delegate                      │
│                          │          │                                        │
│ @classcad/script/docs    │          │ mcp         stdio server (any host)    │
│  DATA · STRUCTURE ·      ├─────────▶│  run_script · snapshot · docs(bulk) ·  │
│  GRAPHICS (the data      │          │  list_methods · tree/find/inspect ·    │
│  contract)               │          │  sessions · bridge                     │
└──────────────────────────┘          │                                        │
                                      │ root agent  training harness (node)    │
        EXECUTION & PROOF             │  scripts/run.mjs → api + snapshot      │
┌──────────────────────────┐          └───────────────┬────────────────────────┘
│ @classcad/script         │                          │
│  runScript · buildScript-│◀─────── every host executes model-written
│  Api · connectSession    │         JavaScript through the SAME medium
│         │                │
│         ▼                │          ┌────────────────────────────────────────┐
│  ClassCAD engine         │          │ @classcad/renderer                     │
│  (classcad-cli worker /  │─────────▶│  deterministic images: views, sheets,  │
│   buerli WASM client)    │  tree +  │  section, highlight, diff, annotate —  │
└──────────────────────────┘  graphic │  the agent's eyes for verification     │
                                      └────────────────────────────────────────┘
```

Three ideas hold this together:

1. **One execution path.** `run_script` is the only way agents execute API
   calls — even a single chamfer is a three-line script. Scripts are
   JavaScript against a session-abstracted `api` (`api.v1.*`, `api.tree()`,
   `api.graphic()`); state persists in the drawing, follow-up scripts ATTACH
   to the existing model via `api.tree()` (tree ids are stable — never
   `part.create` twice). Scripts written against the guaranteed surface run
   unchanged in the browser, the MCP and headless harnesses.

2. **One knowledge source, served identically everywhere.**
   - The **v1 registry** (264 methods, generated from the engine's JSDoc) and
     the **doc bundle** (SKILL.md + references + recipes) live in
     `@classcad/skill`.
   - The **data contract** — what `api.tree()`/`api.graphic()` return and how
     to select geometry from it — lives with the medium that owns it:
     [`packages/script/docs`](packages/script/docs) (`DATA` distilled;
     `STRUCTURE` and `GRAPHICS` in depth), importable as markdown strings via
     `@classcad/script/docs` (browser-safe, no filesystem).
   - **`@classcad/skill/discovery`** is the single implementation of method
     search (CAD-synonym-expanded, ranked over name + summary), fuzzy
     describe (bare names resolve, ambiguity lists candidates, typos get
     suggestions), doc serving, the compact **method index**, and the
     **`docs` bulk tool itself** (`bulkDocs` + the shared `DOCS_TOOL`
     contract: key caps, per-doc caps, `# ═══ key ═══` sections, not-found
     reporting). Both hosts register the identical tool from this one source —
     buerli-ai injects the index into its system prompt and adds its live
     browser namespaces via a resolver hook, the MCP ships the index in its
     initialize `instructions` — so every agent knows the full method surface
     from turn one and fetches all documentation in ONE round.

3. **Verification is built in.** The deterministic renderer turns the live
   tree + graphic into images (named/arbitrary cameras, four-view sheets,
   section, highlight-by-world-point, pixel diff with pinned framing) — the
   same `snapshot` everywhere. Numeric proof comes from the engine
   (`calculateMassProperties`, geometry probes); several ClassCAD failure
   modes report success while changing nothing, so agents are trained to
   verify with numbers and pixels, not status codes.

## Packages

| Package | npm | What it is |
| --- | --- | --- |
| [`packages/skill`](packages/skill) | `@classcad/skill` | The knowledge: v1 method registry, curated per-method docs, topic guides (SKETCHING, …), worked recipes — plus the shared `discovery` module (search, describe, method index, the `docs` bulk tool). Trained and verified session by session. |
| [`packages/script`](packages/script) | `@classcad/script` | The universal script medium: `runScript`, `buildScriptApi`, the Node WS session (`connectSession`) — and the data contract in [`docs/`](packages/script/docs) (`DATA`, `STRUCTURE`, `GRAPHICS`), exported as `@classcad/script/docs`. |
| [`packages/renderer`](packages/renderer) | `@classcad/renderer` | Deterministic session renderer: solids/sketches/curves/work geometry, arbitrary cameras, section, four-view sheets, diff with frame pinning, highlight/markers, annotate, x-ray. Portable core + node/browser adapters. |
| [`packages/mcp`](packages/mcp) | `@awv-informatik/classcad-mcp` | Standalone MCP server over a ClassCAD worker (stdio): `run_script`, `snapshot`, discovery tools, tree/find/inspect, named sessions, viewer bridge. Serves the method index via initialize instructions. |
| [`packages/buerli-ai`](packages/buerli-ai) | `@buerli.io/ai` | The in-app agent panel for buerli applications: providers, agent loop, chat UI. Same tools riding the same shared packages, plus browser extras (selection, checkpoints, notes, delegate). |

Dependency direction: `skill` and `script` are the base; `renderer` consumes
script types; `mcp`, `buerli-ai` and the root harness compose all of them.

## How the knowledge flows

```
engine JSDoc ─────────────────────build──▶ method-registry.json ─┐
SKILL.md + references + recipes ──build──▶ bundle.json ──────────┼─▶ @classcad/skill/discovery
packages/script/docs/*.md ────────build──▶ @classcad/script/docs ┘         │
                                                        ┌──────────────────┤
                                                 system prompt index   initialize
                                                 + docs([...])         instructions
                                                 (buerli-ai)           + docs([...])
                                                                       (mcp)
```

`npm run build` in `packages/skill` regenerates registry + bundle;
`npm run build` in `packages/script` re-embeds the docs. Inside the monorepo,
consumers pick everything up through npm workspaces (symlinks — no version
bump needed); external consumers get the same artifacts via the published
packages (`prepublishOnly` rebuilds them).

## The training agent

The **training agent (cc)** lives at the repo ROOT — harness (`scripts/run.mjs`,
built on `@classcad/script/node` + `@classcad/renderer/node`), journals and
plans (`workspace/`), behavior MDs (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, …). It
trains against a live `classcad-cli` worker, verifies empirically (renders,
mass properties, geometry probes), and writes what survives into the skill —
in place, no history narratives. The packages are its deliverable; the other
hosts are its consumers.

## Working in the repo

```bash
npm install        # link all workspaces
npm test           # per-package tests (script unit, skill discovery, renderer smoke+golden, …)
npm run build      # per-package builds (registry/bundle/docs regenerate here)
```

Publishing stays per-package (each keeps its npm name and `publishConfig`);
the repo root (agent + workspaces) is private.
