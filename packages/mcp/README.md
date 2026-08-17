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
git clone https://github.com/awv-informatik/classcad-mcp.git
cd classcad-mcp
npm install
npm run build
```

`npm install` pulls **`@classcad/skill`**, which carries the method registry and the markdown references that power the rich `describe_method` LLM-doc tails.

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
| `session_info`    | ✓      | Connection status (incl. current session id)              |
| `use_session`     | ✓      | Reconnect to a specific `ClassCAD-Session-Id` (or back to default) |
| `clear`           | ✓      | Wipe the drawing                                          |
| `save` / `load`   | ✓      | OFB / STP / STL / JSON persistence                        |
| `tree`            | ✓      | Cached structure tree (full or refreshed)                 |
| `find`            | ✓      | Search nodes by class / name substring                    |
| `inspect`         | ✓      | Full node detail + parent chain                           |
| `call_api`        | ✓      | Generic dispatch to any `v1.<domain>.<method>` (254 known) |
| `list_methods`    | ✓      | Enumerate API endpoints (filter by domain or substring)   |
| `describe_method` | ✓      | JSDoc + LLM-oriented gotchas from classcad-skill          |
| `snapshot`        | ✓      | Inline PNG render — single composite of the requested layers |
| `bridge.list_clients`   | ✓ | Enumerate CC apps that connected an app-state bridge for the current session |
| `bridge.get_selection`  | ✓ | Read the connected app's current selection (resolved + raw triplet) |
| `bridge.set_selection`  | ✓ | Set the connected app's selection from raw `{containerId, graphicId, prodRefId}` triplets |

`snapshot` accepts `view` (`iso` default, plus `top`/`bottom`/`front`/`back`/`left`/`right`), `zoom`, `lookAt`, and `layers`. **Default `layers` = `["solid"]`** — only the 3D model. Other layers (`sketch`, `curves`, `workgeo`) are opt-in. When multiple layers are requested they are MERGED into one PNG: the 3D layers (solid, curves, workgeo) share a camera and are alpha-composited; sketches sit beneath the 3D view as a row of 2D panels.

The `bridge.*` tools require a CC app to have connected a bridge for the same `ClassCAD-Session-Id` that `use_session` is attached to. If no bridge is registered, these tools return a `"no bridge connected"` error and the rest of the MCP keeps working unchanged. See [App-state bridge](#app-state-bridge) below.

---

## Environment variables

| Variable                  | Purpose                                                                |
| ------------------------- | ---------------------------------------------------------------------- |
| `CLASSCAD_WS_URL`         | WebSocket URL of the classcad-cli worker. Default: `ws://localhost:9094/` |
| `CLASSCAD_SKILL_PATH`     | Override the path to a `classcad-skill` checkout for `describe_method`. By default the installed `@classcad/skill` package is used; falls back to JSDoc-only if unavailable. |
| `CLASSCAD_BRIDGE_LISTEN`  | URL where the MCP listens for inbound app bridge connections. Default: `ws://localhost:9096/bridge`. Set to a different port if 9096 is taken. The MCP starts up cleanly even if this listener fails to bind — bridge tools just report "no bridge connected" until it succeeds. |

### Attaching to an existing session

By default the MCP connects without a `ClassCAD-Session-Id` header, so the worker assigns a fresh session. To steer a session another client is already using (e.g. a Buerligons window with session `test-session`), call the `use_session` tool from the host:

```
use_session(sessionId="test-session")
```

Subsequent tool calls operate on that shared session. Call `use_session()` with no argument (or `sessionId=""`) to reconnect with no header. `session_info` reports the current session id.

---

## App-state bridge

The classcad MCP can read and write *client-side* state (selections, picks, soon: more) of any CC-based app — provided the app opens an outbound WebSocket back to the MCP and announces itself for the same session. This bridges the gap between server-side ClassCAD state (structure tree, geometry — already accessible via the existing tools) and *app*-side state which only the running app knows about.

### How it works

```
                                     announce + events     ┌────────────────┐
   stdio (Claude / VS Code) ─────► cc MCP ──── ws ────────►│ buerligons     │
                                  ┌──────┐    requests     │ (or any CC app)│
                                  │bridge│                 └────────────────┘
                                  │ tools│
                                  └──────┘
                                     │
                                     ▼
                       ws://localhost:9094 (existing classcad)
```

- The MCP boots a small WS listener (default `ws://localhost:9096/bridge`).
- A CC app, on startup, opens an outbound WebSocket to that URL and sends an `announce` message with its `sessionId`, `drawingId`, app name, and a list of capabilities it implements.
- The MCP keeps a registry keyed by `sessionId`. The `bridge.*` tools route requests to the app whose `sessionId` matches whatever `use_session` is currently attached to.
- If no app is connected for the current session, the bridge tools return a clean error — the rest of the MCP is unaffected.

The bridge is purely **additive**: rest of the MCP keeps working with no app attached, and apps can opt in or out per page-load.

### v1 capabilities

Currently `selection.*` only — read and write. View / camera, current product, hover, etc. will follow.

| Capability         | What the app exposes |
| ------------------ | -------------------- |
| `selection.read`   | The user's current selection — kind (`face`/`edge`/`vertex`/...), `classcadId`, optional resolved `position`/`normal`, and the raw `{containerId, graphicId, prodRefId}` triplet that round-trips into ClassCAD API calls. |
| `selection.write`  | Setting the selection from raw triplets (or `classcadId`s the bridge can resolve). |

There's no Promise-based "pick" method by design — natural-flow conversation ("pick stuff in the UI, then tell me to do X") plus `bridge.get_selection` is strictly more flexible than a blocking pick API. The user keeps full control of view, multi-select, and pause-to-think; the model reads the final selection when the user signals intent.

### Implementing a bridge for your app

The wire format is a JSON envelope per message — see `src/bridge/protocol.ts` for the full type surface.

On open, the app sends:

```json
{
  "type": "announce",
  "protocolVersion": 1,
  "sessionId": "test-session",
  "drawingId": "<your drawing id>",
  "app": "buerligons",
  "capabilities": ["selection.read", "selection.write"],
  "clientId": "buerligons-abc123"
}
```

Then it handles inbound `request` messages (the MCP asking for something) and emits `event` messages (the app pushing state changes):

```json
// MCP → app
{ "type": "request", "id": 7, "method": "selection.get" }

// app → MCP (response to id 7)
{ "type": "response", "id": 7, "result": [{"kind":"face", "classcadId":460, "raw":{"containerId":514, "graphicId":-17, "prodRefId":319}}] }

// app → MCP (push, on user pick)
{ "type": "event", "channel": "selection.changed", "payload": {"items": [...]} }
```

Selection entities carry **both** resolved fields (`position`, `normal`, `kind`) and the raw triplet `{containerId, graphicId, prodRefId}`. The MCP can pass `raw.graphicId` straight into a ClassCAD API call (e.g. `v1.sketch.create({planeId: raw.graphicId})`) without needing to resolve anything client-side.

### Reference implementation: buerligons

`packages/modeler/src/mcpBridge.ts` in the buerli monorepo is a complete reference implementation in ~200 lines. It reuses two buerli APIs that already do the right thing:

- `getDrawing(id).interaction.selected` — current selection (read)
- `drawing.api.interaction.setSelected([info])` — set selection (write)

In `initBuerli.ts`, it's wired up post-`client.on('connected')`:

```ts
const mcpBridgeUrl = new URLSearchParams(window.location.search).get('mcpBridge')
                  ?? (sessionId ? 'ws://localhost:9096/bridge' : null)
if (mcpBridgeUrl && sessionId) {
  client.on('connected', () => {
    connectMcpBridge({ url: mcpBridgeUrl, drawingId: id, sessionId, app: 'buerligons' })
  })
}
```

The bridge auto-reconnects with backoff; if the MCP isn't running the WS open just fails silently and buerligons works normally. Pass `?mcpBridge=off` to disable the default.

### End-to-end usage

1. Start `classcad-cli worker` on `:9094`.
2. Start a Claude Code (or other MCP host) session — the cc MCP starts and binds the bridge listener on `:9096`.
3. Open buerligons (or any CC app with a bridge) at `?sessionId=<your-session>` — it auto-connects the bridge.
4. From the host: `use_session("<your-session>")`, then any of:
   - `bridge.list_clients` — confirm the app is registered.
   - `bridge.get_selection` — read what the user has currently selected. Combine with `call_api v1.sketch.create({planeId: result.items[0].raw.graphicId})` to act on it.
   - `bridge.set_selection [{containerId, graphicId, prodRefId}]` — highlight an entity in the app's UI (e.g. to show the user what an LLM-driven action is about to operate on).

---

## Build pipeline

`npm run build` does two things:

1. `tsc` — compiles `src/**/*.ts` → `dist/`.
2. `node scripts/copy-build-assets.mjs` — copies `render.mjs` into `dist/`.

The method registry and skill markdown come from the **`@classcad/skill`** npm dependency
(the registry is generated there from `@classcad/api-js` JSDoc): `call_api`/`list_methods`/
`describe_method` import `@classcad/skill/method-registry.json` and read
`references/<domain>/<method>.md` from the installed package. Set `CLASSCAD_SKILL_PATH`
to use a local classcad-skill checkout instead.

`npm run clean` removes `dist/`. Both scripts are cross-platform — they call into Node, not shell `cp` / `rm`.
