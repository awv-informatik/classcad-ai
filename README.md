# @awv-informatik/classcad-mcp

Model Context Protocol server for the [ClassCAD](https://classcad.io) CAD engine.

Lets MCP-capable LLM hosts (Claude Code, VS Code Copilot, etc.) drive a live ClassCAD session: create parts, run booleans, sketch, inspect the structure tree, render snapshots, and save/load OFB.

## Status

`v0.1` — under active development. Not yet on npm; install from source.

---

## Prerequisites

- **Node.js 20+**
- A **`classcad-cli worker`** running and reachable over WebSocket. Default URL is `ws://localhost:9094/`. Override per-server with the `CLASSCAD_WS_URL` env var.

## Install from source

```bash
git clone --recursive https://github.com/awv-informatik/classcad-mcp.git
cd classcad-mcp
npm install
npm run build
```

`--recursive` is important — it pulls the bundled `classcad-skill` submodule that powers the rich `describe_method` LLM-doc tails. If you forgot, run `git submodule update --init --recursive` after cloning.

The server speaks MCP over stdio:

```bash
node dist/server.js
```

Use the absolute path to `dist/server.js` in the config snippets below. On Windows, forward slashes work fine in JSON — Node accepts them.

---

## Configure your MCP host

### Claude Code (CLI)

Two options.

**Recommended — `claude mcp add` (writes to `~/.claude.json`):**

```bash
claude mcp add classcad node /abs/path/to/classcad-mcp/dist/server.js \
  --env CLASSCAD_WS_URL=ws://localhost:9094/
```

Add `--scope project` to scope the server to the current project's `.mcp.json` instead of your user config:

```bash
claude mcp add classcad node /abs/path/to/classcad-mcp/dist/server.js \
  --env CLASSCAD_WS_URL=ws://localhost:9094/ \
  --scope project
```

**Manual — JSON config:**

Edit `~/.claude.json` (user-level) or `.mcp.json` at the repo root (project-level):

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

Reload the Claude Code session (`/mcp` to verify; the classcad tools should be listed).

### VS Code — GitHub Copilot Chat (agent mode)

VS Code 1.95+ with GitHub Copilot in **agent mode** supports MCP servers. Configure via Command Palette → **MCP: Add Server**, or edit one of:

- **Workspace:** `.vscode/mcp.json` (commits with the repo)
- **User:** the file opened by **MCP: Open User Configuration**

```jsonc
{
  "servers": {
    "classcad": {
      "type": "stdio",
      "command": "node",
      "args": ["/abs/path/to/classcad-mcp/dist/server.js"],
      "env": { "CLASSCAD_WS_URL": "ws://localhost:9094/" }
    }
  }
}
```

Note the schema differences from Claude:

- Top-level key is `servers`, not `mcpServers`
- Each entry needs an explicit `"type": "stdio"`

Open Copilot Chat, switch to **Agent** mode, and the classcad tools become selectable in the tool picker.

### Cursor / Windsurf / other MCP hosts

Most other hosts accept the Claude-style `mcpServers` JSON shape. Drop the snippet from the Claude Code manual-config section into the host's MCP config file (consult the host's docs for the path).

---

## Tools

| Tool              | Status | Purpose                                                   |
| ----------------- | ------ | --------------------------------------------------------- |
| `session_info`    | ✓      | Connection status                                         |
| `clear`           | ✓      | Wipe the drawing                                          |
| `save` / `load`   | ✓      | OFB / STP / STL / JSON persistence                        |
| `tree`            | ✓      | Cached structure tree (full or refreshed)                 |
| `find`            | ✓      | Search nodes by class / name substring                    |
| `inspect`         | ✓      | Full node detail + parent chain                           |
| `call_api`        | ✓      | Generic dispatch to any `v1.<domain>.<method>` (254 known) |
| `list_methods`    | ✓      | Enumerate API endpoints (filter by domain or substring)   |
| `describe_method` | ✓      | JSDoc + LLM-oriented gotchas from classcad-skill          |
| `snapshot`        | ✓      | Inline PNG render(s) — solid / sketch / curves / workgeo  |

`snapshot` accepts `view` (`iso` default, plus `top`/`bottom`/`front`/`back`/`left`/`right`), `zoom`, `lookAt`, and `layers` to filter which content layers are emitted.

---

## Environment variables

| Variable             | Purpose                                                                |
| -------------------- | ---------------------------------------------------------------------- |
| `CLASSCAD_WS_URL`    | WebSocket URL of the classcad-cli worker. Default: `ws://localhost:9094/` |
| `CLASSCAD_SKILL_PATH` | Override the path to a `classcad-skill` checkout for `describe_method`. By default the bundled submodule is used; falls back to JSDoc-only if unavailable. |

---

## Build pipeline

`npm run build` does three things:

1. `node scripts/build-registry.mjs` — walks `@classcad/api-js` `.d.ts` files, emits `src/method-registry.json` (254 methods × name + JSDoc summary + params).
2. `tsc` — compiles `src/**/*.ts` → `dist/`.
3. `node scripts/copy-build-assets.mjs` — copies the registry JSON and `render.mjs` into `dist/`.

`npm run clean` removes `dist/`. Both scripts are cross-platform — they call into Node, not shell `cp` / `rm`.
