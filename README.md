# classcad-agent

Training harness and monorepo for the [ClassCAD](https://classcad.ch) headless CAD engine API skill. An agent systematically explores every API, runs live calls against a ClassCAD server, and annotates skill reference files with verified findings, edge cases, and working examples.

## Architecture

```
knowledge/
  classcad-skill/          # Git submodule → github.com/awv-informatik/classcad-skill
    SKILL.md               #   ClassCAD API skill (main entry point)
    references/            #   7 domain API reference files (assembly, common, curve, ...)
  classcad-cli-skill/      # Drogon WebSocket protocol skill + reference
    SKILL.md
    protocol.md
  classcad-api/            # Raw API docs from @classcad/api-js (auto-generated on install)

scripts/                   # Harness + utilities
  run.mjs                  #   Thin test runner (connect → run script → print results → clear)
  client.mjs               #   WS client (connect, configure, execute, close) — graphics-enabled
  extract.mjs              #   Data extraction (mass props, BRep, geometry, bounds, structure)
  export.mjs               #   Export helpers (STL, STEP, OFB) + STL parser
  render.mjs               #   Legacy isometric PNG renderer (from STL triangles)
  render-direct.mjs        #   Direct renderer — solids/sketches/curves from session data (no STL)
  sync-submodule.mjs       #   Postinstall: sync submodule + copy API docs

workspace/
  training/                # Date-stamped training session outputs
```

## Prerequisites

- A running ClassCAD Drogon WebSocket server (default: `ws://0.0.0.0:9094/`)
- Node.js 18+

```bash
npm install   # installs ws + sharp + @classcad/api-js, syncs submodule, copies API docs
```
