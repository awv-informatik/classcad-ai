<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/frontispiece.dark.svg">
  <img width="100%" src="docs/readme/frontispiece.light.svg" alt="Frontispiece and title page. Left: an engineering drawing of a flanged bushing — section A–A, the view from the left and the plan in first-angle projection, dimensioned, with a title block. Right: classcad·ai, or, the Art of Modelling with Agents — wherein a machine is taught to write parametric CAD models as programs, to draw what it has made, and to prove the work in numbers and in pixels. In five parts, with plates.">
</picture>

Everything that lets AI agents build and verify CAD models with
[ClassCAD](https://classcad.ch), and the hosts they work in: an MCP server for
Claude Code, Claude Desktop, VS Code or Cursor, and a chat panel for
[buerli](https://buerli.io) apps.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/systema.dark.svg">
  <img width="100%" src="docs/readme/systema.light.svg" alt="Plate II, the figurative system of the repository: knowledge (the skill, discovery), execution (the script, the engine), proof (the renderer, the numbers) and hosts (the MCP server, the in-app agent, the harness). Beside it a truss: each of the three hosts bears on all three foundation packages — skill, script and renderer.">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/skill.dark.svg">
  <img width="100%" src="docs/readme/skill.light.svg" alt="Plate III, the skill: the API by domain as a table of contents — part 76, assembly 63, sketch 50, common 22, curve 21, solid 21, drawing2d 11; 264 methods in all — and six recipes: constrained sketching, verification, parametric parts, assembly parameters, pattern then subtract, direct modelling.">
</picture>

[`packages/skill`](packages/skill) · `@classcad/skill`

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/script.dark.svg">
  <img width="100%" src="docs/readme/script.light.svg" alt="Plate IV, the script: a script set as a literate program that creates a plate, adds an 80 by 50 by 10 box, computes its mass properties and returns { part: 4, volume: 40000 }.">
</picture>

[`packages/script`](packages/script) · `@classcad/script`

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/renderer.dark.svg">
  <img width="100%" src="docs/readme/renderer.light.svg" alt="Plate V, the renderer: the six views of the flanged bushing unfolded in first-angle projection, and the ISO projection symbols for first-angle (Europe) and third-angle (the Americas).">
</picture>

[`packages/renderer`](packages/renderer) · `@classcad/renderer`

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/mcp.dark.svg">
  <img width="100%" src="docs/readme/mcp.light.svg" alt="Plate VI, the MCP server: Claude Code, Claude Desktop, VS Code and Cursor each start a stdio shim; one daemon per machine holds every session and reaches three kinds of engine — a classcad-cli worker, the WASM engine in a buerligons tab, or its own local WASM engine.">
</picture>

[`packages/mcp`](packages/mcp) · `@awv-informatik/classcad-mcp`

```bash
claude mcp add classcad --scope user \
  --env CLASSCAD_WS_URL=ws://localhost:9094/ \
  -- npx -y @awv-informatik/classcad-mcp
```

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/agent.dark.svg">
  <img width="100%" src="docs/readme/agent.light.svg" alt="Plate VII, the in-app agent: a scroll carries the request “Make a box; in the centre of the top face a hole; then fillet all the edge loops”, and a pointing hand leads to an engraving of the result.">
</picture>

[`packages/buerli-ai`](packages/buerli-ai) · `@buerli.io/ai`

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

## Working in the repo

```bash
npm install                     # links all workspaces
npm run build                   # skill, script, renderer, then mcp and buerli-ai
npm test                        # every package's tests
node scripts/run.mjs script.mjs # the training harness: one script against a live worker
python3 docs/readme/build.py    # typesets these plates
```

The root is also home to **cc**, the agent that trains the skill against a
live engine (`AGENTS.md`, `workspace/`).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/colophon.dark.svg">
  <img width="100%" src="docs/readme/colophon.light.svg" alt="Colophon: set in EB Garamond, Georg Duffner's revival of the types of Claude Garamont and Robert Granjon shown in the Egenolff–Berner specimen of 1592; shaped by HarfBuzz and drawn as outlines. The figures show the flanged bushing the renderer draws, in first-angle projection. Each plate is printed twice, as an engraving by day and as a cyanotype by night. Finis.">
</picture>
