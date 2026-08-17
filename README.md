# classcad-ai

The ClassCAD AI monorepo — everything that makes agents build and verify CAD
models, in one place. Imported from the previous standalone repos with full
history (git subtree); the old repos remain archived references.

| Package | npm | What it is |
| --- | --- | --- |
| [`packages/skill`](packages/skill) | `@classcad/skill` (public) | The knowledge: method registry + curated per-method docs, topic guides, worked recipes. Trained and verified session by session. |
| [`packages/renderer`](packages/renderer) | `@classcad/renderer` (public) | Deterministic session renderer: solids/sketches/curves/work geometry, arbitrary cameras, section, four-view sheets, diff with frame pinning, highlight/markers, annotate, x-ray. Portable core + node/browser adapters. |
| [`packages/script`](packages/script) | `@classcad/script` (public) | The universal script medium: model-written JavaScript against a session-abstracted api (`api.v1.*`, `api.tree()`, `api.graphic()`), identical in the browser, the MCP and headless harnesses. TypeScript. |
| [`packages/mcp`](packages/mcp) | `@awv-informatik/classcad-mcp` (public) | Standalone MCP server over a ClassCAD worker (stdio) — call/tree/docs/snapshot/run_script/bridge tools, composing skill + renderer + script. |
| [`packages/buerli-ai`](packages/buerli-ai) | `@buerli.io/ai` (public) | The in-app agent panel for buerli applications: providers, agent loop, chat UI — its tools ride the shared packages. |
| [`packages/agent`](packages/agent) | private | The training agent (cc): harness, journals, memory, and the training pipeline that feeds the skill. |

Dependency direction: `skill` ← `mcp` → `renderer`/`script`; `buerli-ai` and
`agent` compose all three. Scripts written against the guaranteed api surface
run unchanged in every consumer.

## Working in the repo

```bash
npm install        # link all workspaces
npm test           # per-package tests (renderer smoke+golden, script unit, …)
npm run build      # per-package builds
```

Publishing stays per-package (each keeps its npm name and `publishConfig`);
`packages/agent` is private.
