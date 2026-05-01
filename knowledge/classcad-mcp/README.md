# @awv-informatik/classcad-mcp

Model Context Protocol server for the [ClassCAD](https://classcad.io) CAD engine.

Lets MCP-capable LLM hosts (Claude Desktop, Claude Code, etc.) drive a live
ClassCAD session: create parts, run booleans, sketch, inspect the structure
tree, render snapshots, and save/load OFB.

## Status

`v0.1` — under active development. Not yet on npm.

## Prerequisites

A running `classcad-cli worker` listening on `ws://localhost:9094/`.

## Local dev

```bash
npm install
npm run build
node dist/server.js     # speaks MCP over stdio
```

## Configure in Claude Desktop / Claude Code

```json
{
  "mcpServers": {
    "classcad": {
      "command": "node",
      "args": ["/abs/path/to/classcad-mcp/dist/server.js"],
      "env": { "CLASSCAD_WS_URL": "ws://localhost:9094/" }
    }
  }
}
```

## Tools

| Tool              | Status | Purpose                                                  |
| ----------------- | ------ | -------------------------------------------------------- |
| `session_info`    | ✓      | Connection status                                        |
| `clear`           | ✓      | Wipe the drawing                                         |
| `save`/`load`     | ✓      | OFB / STP / STL / JSON persistence                       |
| `tree`            | ✓      | Cached structure tree (full or refreshed)                |
| `find`            | ✓      | Search nodes by class / name substring                   |
| `inspect`         | ✓      | Full node detail + parent chain                          |
| `call_api`        | ✓      | Generic dispatch to any `v1.<domain>.<method>` (254 known)|
| `list_methods`    | ✓      | Enumerate API endpoints (filter by domain or substring)  |
| `describe_method` | ✓      | JSDoc + LLM-oriented gotchas from classcad-skill         |
| `snapshot`        | ✓      | Inline PNG render(s) — solid / sketch / curves / workgeo |

## Build pipeline

`npm run build` does three things:

1. `node scripts/build-registry.mjs` — walks `@classcad/api-js` `.d.ts` files,
   emits `src/method-registry.json` (254 methods × name + JSDoc summary + params).
2. `tsc` — compiles `src/**/*.ts` → `dist/`.
3. `cp` the registry JSON into `dist/`.

`describe_method` looks for a checkout of `classcad-skill` at sibling paths or
via `CLASSCAD_SKILL_PATH`. If not found, it returns JSDoc-only output —
graceful degradation for the npm-published case.
