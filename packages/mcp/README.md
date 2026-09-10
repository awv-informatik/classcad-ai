# @awv-informatik/classcad-mcp

Model Context Protocol server for the [ClassCAD](https://classcad.io) CAD engine.

Lets MCP-capable hosts (Claude Code, the Claude desktop app, VS Code Copilot, Cursor, …) drive a live ClassCAD session: build parts and assemblies through scripts, inspect the structure tree, render snapshots, save/load OFB/STEP, and dock into a session an interactive app (buerligons) already has open.

---

## How it works

```
 Claude tab 1 ── stdio ──► classcad-mcp (shim) ──┐
 Claude tab 2 ── stdio ──► classcad-mcp (shim) ──┤ HTTP (MCP Streamable HTTP, 127.0.0.1:9095)
 VS Code      ── stdio ──► classcad-mcp (shim) ──┘
                                                 ▼
                                   classcad-mcp daemon (ONE per machine)
                                     session 1 ── WebSocket ──► ClassCAD worker (classcad-cli, :9094)
                                     session 2 ── WebSocket ──► ClassCAD worker
                                     session 3 ── bridge ─────► buerligons.io tab (WASM engine in the page)
                                     bridge listener ws://127.0.0.1:9096/bridge  ◄── apps announce share tokens
```

- Every host starts the MCP as a **stdio** child process (`node dist/server.js` or `npx @awv-informatik/classcad-mcp`). That process is a thin **shim**: it looks for the daemon on `127.0.0.1:9095`, starts it if none runs, and forwards its host's JSON-RPC to it. The first tab starts the daemon, every later tab reuses it.
- The **daemon** is the actual MCP. It holds one MCP server instance **per session** (per tab: own engine connection, emission config, caches, tool queue) and the one **bridge listener** apps connect to. With no session left and no app attached to its bridge it exits by itself after `CLASSCAD_DAEMON_IDLE_MS` (60 s). Nothing to install or manage: it is part of this package (`dist/daemon.js`) and lives only while it is used.
- Why a daemon: the in-app bridge means the MCP *listens* on a port, and a port belongs to exactly one process. With one MCP process per tab, the second tab could not bind (or bound the other address family of `localhost` and got half the apps). Users who only talk to a `classcad-cli worker` (Drogon) never notice the daemon; it starts, serves the tab, and quits a minute after the last tab closes.
- The engine is a **`classcad-cli worker`** reachable over WebSocket — on your machine (`ws://localhost:9094/`), in Docker, or a hosted instance (`wss://…`). Set it with `CLASSCAD_WS_URL`; each shim passes its own value to the daemon, so different tabs may use different workers. The MCP never starts an engine itself.
- The engine connection is opened lazily on the first tool call, so an idle session never creates a stray engine session.
- Fallback: if `127.0.0.1:9095` is held by something that is not a classcad daemon, the shim serves the MCP in-process (everything works except the in-app bridge) and says so on stderr.

---

## Prerequisites

- **Node.js 20+** (`node`, `npx`)
- A running **ClassCAD worker**. Locally:

  ```bash
  classcad-cli worker            # listens on ws://localhost:9094/
  ```

  Without a worker the MCP still starts; the first tool call then fails with a connection error and works again as soon as the worker is up.

---

## Install

### From npm (recommended)

Nothing to check out or build — the host runs the package through `npx`, which downloads it on first use and caches it:

```
npx -y @awv-informatik/classcad-mcp
```

That command is what you register with your host (see below). `npx -y` skips the install prompt; the package pulls `@classcad/script`, `@classcad/renderer` (rendering via `sharp`, prebuilt binaries) and `@classcad/skill` (method registry + reference docs).

> npm 11+ prints a warning that `sharp`'s install script was not run. That is fine — `sharp` ships prebuilt binaries and loads without it.

### From source

```bash
git clone https://github.com/awv-informatik/classcad-ai.git
cd classcad-ai
npm install
npm run build          # builds skill, script, renderer, then the MCP
```

The server is then `packages/mcp/dist/server.js`; use its absolute path in the host config instead of the `npx` command.

---

## Configure your host

Every host needs the same three things: the command (`npx -y @awv-informatik/classcad-mcp` or `node /abs/path/to/dist/server.js`), the worker URL in `CLASSCAD_WS_URL`, and a restart of the host so it spawns the server.

### Claude Code (CLI, and the Code tab of the desktop app)

```bash
claude mcp add classcad --scope user \
  --env CLASSCAD_WS_URL=ws://localhost:9094/ \
  -- npx -y @awv-informatik/classcad-mcp
```

`--scope user` writes to `~/.claude.json` (all projects); `--scope project` writes `.mcp.json` in the current repo instead. Verify with `claude mcp list` — the entry should show `✔ Connected`. Tools appear in the **next** session (each session spawns its own MCP process); in a running session use `/mcp` to reconnect.

Manual equivalent in `~/.claude.json` / `.mcp.json`:

```json
{
  "mcpServers": {
    "classcad": {
      "command": "npx",
      "args": ["-y", "@awv-informatik/classcad-mcp"],
      "env": { "CLASSCAD_WS_URL": "ws://localhost:9094/" }
    }
  }
}
```

### Claude desktop app (Chat / Cowork)

The chat side of the desktop app has its **own** config and does not read `~/.claude.json`:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Add the same `mcpServers` block as above. The app is not started from a shell, so it has no `PATH`: if `npx`/`node` are not found, use absolute paths (macOS Homebrew: `/opt/homebrew/bin/npx`; `which npx` tells you). Quit and reopen the app — it spawns MCP servers only at startup. The server then shows up under Settings → Developer, and the chat renders snapshot images inline.

### VS Code — GitHub Copilot Chat (agent mode)

Command Palette → **MCP: Add Server**, or edit `.vscode/mcp.json` (workspace) / the user MCP config:

```jsonc
{
  "servers": {
    "classcad": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@awv-informatik/classcad-mcp"],
      "env": { "CLASSCAD_WS_URL": "ws://localhost:9094/" }
    }
  }
}
```

(Top-level key `servers`, and an explicit `"type": "stdio"`.) Switch Copilot Chat to **Agent** mode; the classcad tools become selectable.

### Cursor / Windsurf / other hosts

Most hosts accept the Claude-style `mcpServers` JSON. Use the block from the Claude Code section in the host's MCP config file.

---

## Environment variables

| Variable                 | Purpose                                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `CLASSCAD_WS_URL`        | WebSocket URL of the ClassCAD worker. Default `ws://localhost:9094/`. Any reachable worker works (`wss://…`).     |
| `CLASSCAD_SNAPSHOT_DIR`  | Where `snapshot` writes its PNGs. Default `<tmpdir>/classcad-snapshots`.                                          |
| `CLASSCAD_SKILL_PATH`    | Use a local `classcad-skill` checkout for docs instead of the installed `@classcad/skill` package.                |
| `CLASSCAD_BRIDGE_LISTEN` | Listener for the in-app bridge (see below). Default `ws://127.0.0.1:9096/bridge`. The daemon starts even if it cannot bind and retries every 5 s. |
| `CLASSCAD_MCP_PORT`      | Port of the daemon's HTTP endpoint on `127.0.0.1`. Default `9095`. Shim and daemon must agree (the shim passes it on when it starts the daemon). |
| `CLASSCAD_MCP_URL`       | Full daemon URL instead of `http://127.0.0.1:<port>` (rarely needed).                                             |
| `CLASSCAD_DAEMON_IDLE_MS`| How long the daemon lives without any session and without any app on the bridge before it exits. Default `60000`. |
| `CLASSCAD_MCP_LOG`       | Daemon log file. Default `<tmpdir>/classcad-mcp/daemon.log` (the shim prints the path on stderr at startup).       |

Set them in the host's MCP config `env` block; the shim passes them on to the daemon it starts. `CLASSCAD_WS_URL` is per session — the daemon receives it with every new session, so two tabs can point at different workers.

### The daemon in practice

- **Which process is which:** `classcad-mcp` shim = the process your host started (`dist/server.js`), one per tab, exits with the tab. `dist/daemon.js` = the one long-lived process; `GET http://127.0.0.1:9095/health` shows its pid, version, active session count, attached app count, bridge address and log file.
- **Multiple tabs:** each tab is one session in the same daemon. Sessions are independent (a script in tab A does not touch tab B's caches). `session_info` shows what a tab is attached to.
- **Lifetime:** the daemon exits a minute after the last session closed, unless an app still holds a bridge (a shared buerligons.io tab keeps it alive, so the next tab attaches instantly). Apps reconnect by themselves within 5 s after a daemon restart; `use_session` waits 8 s for that. A shim exits when its host closes stdin or sends SIGTERM; the daemon drops that session immediately.
- **Upgrades:** after `npm run build` (or a package update) the next shim notices the version mismatch, asks the running daemon to shut down (it does so when no session is active) and starts the new one. Tabs still connected to the old daemon keep working until they are restarted; the new build is used once *all* old tabs are gone (until then the shim prints a warning and, if the old MCP still holds the bridge port, the new daemon serves without a bridge and retries).
- **Logs:** the shim writes one line per session start/end to stderr (visible in the host's MCP log); the daemon writes to `CLASSCAD_MCP_LOG`. Run it by hand to watch: `CLASSCAD_MCP_DAEMON=1 node dist/daemon.js` (logs to stderr when `CLASSCAD_MCP_LOG` is unset).
- **Troubleshooting:** `curl http://127.0.0.1:9095/health` — no answer means no daemon (the next tool call starts one); an answer without `"bridge"` means port 9096 is held by another program (usually an old MCP process — close that tab or kill it, the daemon retries by itself); a `name` other than `classcad-mcp` means a foreign program owns 9095 (set `CLASSCAD_MCP_PORT`). `curl -X POST http://127.0.0.1:9095/shutdown` stops an idle daemon. Ports: 9094 worker (engine), 9095 daemon, 9096 bridge — all on `127.0.0.1` except the worker.

---

## Tools

| Tool                    | Purpose                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `run_script`            | **The** execution medium: JavaScript against `api.v1.*`, `api.tree()`, `api.graphic()`. State persists between scripts; follow-up scripts attach to the existing model. |
| `tree` / `find` / `inspect` | Structure tree (cached, pulled on demand), search by class/name, full node detail with parent chain |
| `snapshot`              | Render the drawing to PNG (iso/top/front/…, section cuts, four-view sheet, highlights, markers)            |
| `list_methods` / `describe_method` / `docs` | Method index, per-method reference with LLM-oriented gotchas, recipes                 |
| `save` / `load` / `clear` / `checkpoint` / `restore` | OFB / STEP / STL persistence, undo points                                     |
| `session_info` / `use_session` | Connection status (transport ws/bridge); attach to a named session, an invite link, or an in-app engine's `?bridge=` link |
| `bridge.list_clients` / `bridge.get_selection` / `bridge.set_selection` | Read/write the selection of a connected CC app (see bridge) |

`snapshot` returns the PNG as an inline image block **for the model** and writes it to `CLASSCAD_SNAPSHOT_DIR`. Claude Code and the desktop app's Code tab do not show tool-result images to the user — the tool result says so and names the saved file, so the model can hand it over (Claude Code: `SendUserFile`). The desktop app's chat renders it directly.

**Tool calls are serialized.** All tools share one engine connection and one drawing, so the server runs one tool call at a time (docs lookups excepted). A `snapshot` issued in parallel with a `run_script` waits for the script instead of rendering a half-built model. Subagents of a session use the same MCP process and therefore the same queue.

---

## Sessions: your own, or one an app already has open

By default the MCP gets a fresh session from the worker. Two ways to work on a session that already exists:

**Named session** (`ClassCAD-Session-Id` model):

```
use_session(sessionId="test-session")
```

**Invite link** (multi-client server): in buerligons open *Session Management → Create* and hand the link to the model:

```
use_session(url="https://app.example/?invite=…")     # app share link — the token is applied to CLASSCAD_WS_URL
use_session(url="wss://cad.example/?invite=…")       # or the worker URL directly
```

The MCP then joins that session as a guest; the app sees every change the model makes. `session_info` reports the current session, `use_session()` without arguments returns to a fresh one.

**In-app engines (WASM).** A buerli app that runs ClassCAD in the page (`WASMClient`, e.g. buerligons.io) has no server anyone could connect to. Its share links carry `?bridge=<token>` instead: when the app mints the token it opens an outbound WebSocket to the daemon's bridge listener (`CLASSCAD_BRIDGE_LISTEN`, default `ws://127.0.0.1:9096/bridge`) and announces it; `use_session(url)` with such a link attaches the MCP to that app, and from then on every engine command is relayed to the page (`engine.execute`) — `run_script`, `tree`, `snapshot` all work, the app's view follows, and revoking the share in the app ends the MCP session. The app must stay open, the MCP must run on the same machine as the browser (or the app must be pointed at the listener with `?mcpBridge=ws://…`), and the published WASM engine has no per-connection emission config, so scripts run without suppression there.

Same API on both sides: `client.createInvite()` / `revokeInvite()` / `peers` / `invites` and `buildShareUrl()` from `@buerli.io/classcad` work for server sessions and in-app engines alike; only the query parameter differs (`?invite=` vs `?bridge=`).

### Emission model

The engine keeps an emission config **per connection** (`GetEmissionConfig`/`SetEmissionConfig`). The MCP leaves its connection at the engine defaults, so an app sharing the session keeps receiving structure and graphic for everything the model does. While a `run_script` runs, payloads are switched off for that script only (results only — a 100-command script is 100 small replies) and restored afterwards; the MCP pulls once after every script so the app and its own caches converge. `api.tree()` / `api.graphic()` inside a script pull on demand and are cached until the next mutation.

---

## App-state bridge

The MCP can read and write *client-side* state (selection today; view, current product, hover planned) of a CC app — provided the app opens an outbound WebSocket to the MCP and announces itself for the same session. It complements the server-side state the other tools already see.

```
                                     announce + events     ┌────────────────┐
   stdio (Claude / VS Code) ─────► cc MCP ──── ws ────────►│ buerligons     │
                                  ┌──────┐    requests     │ (or any CC app)│
                                  │bridge│                 └────────────────┘
                                  │ tools│
                                  └──────┘
                                     │
                                     ▼
                       ws://localhost:9094 (the ClassCAD worker)
```

- The daemon listens on `CLASSCAD_BRIDGE_LISTEN` (default `ws://127.0.0.1:9096/bridge` — `127.0.0.1` on purpose: `localhost` may resolve to IPv6 in the browser and IPv4 in Node, and a listener binds one of them). One listener per machine, shared by all sessions; the token in the app's share link decides which session an app belongs to.
- The app connects outbound and sends an `announce` with its `sessionId`, `drawingId`, app name and capabilities; the MCP routes `bridge.*` calls to the app whose session matches the one `use_session` attached to.
- No app connected → the bridge tools return a clean "no bridge connected"; everything else works unchanged.

Wire format (see `src/bridge/protocol.ts`):

```json
{ "type": "announce", "protocolVersion": 1, "sessionId": "test-session", "drawingId": "<id>", "app": "buerligons",
  "capabilities": ["selection.read", "selection.write"], "clientId": "buerligons-abc123" }

// MCP → app                         // app → MCP
{ "type": "request", "id": 7, "method": "selection.get" }
{ "type": "response", "id": 7, "result": [{ "kind": "face", "classcadId": 460, "raw": { "containerId": 514, "graphicId": -17, "prodRefId": 319 } }] }
{ "type": "event", "channel": "selection.changed", "payload": { "items": [] } }
```

Selection entities carry resolved fields (`kind`, `position`, `normal`) and the raw `{containerId, graphicId, prodRefId}` triplet that goes straight into API calls (e.g. `v1.sketch.create({ planeId: raw.graphicId })`). Reference implementation: `packages/modeler/src/mcpBridge.ts` in the buerli monorepo (~200 lines; `?mcpBridge=off` disables it).

---

## Development

```bash
npm install                      # monorepo root
npm run build                    # skill → script → renderer → mcp (+ buerli-ai)
cd packages/mcp
npm run build                    # tsc; postbuild runs the emission + daemon contract tests against a fake worker
npm test                         # + live tests against a worker on CLASSCAD_WS_URL (skipped if none)
node dist/server.js              # the stdio shim by hand (starts/uses the daemon)
CLASSCAD_MCP_DAEMON=1 node dist/daemon.js   # the daemon in the foreground, logging to stderr
```

Source map: `src/server.ts` (stdio shim: find/start daemon, proxy, in-process fallback), `src/daemon.ts` (HTTP endpoint, sessions, bridge listener, idle exit), `src/mcp-server.ts` (the MCP server: tools wired to one engine client — what a session is), `src/client.ts` (engine client: WebSocket to a worker or bridge to an app), `src/bridge/` (listener + protocol), `src/tools/`, `src/queue.ts` (per-session tool queue). `test/daemon.mjs` is the daemon contract: two shims → one daemon with two independent sessions, idle exit, foreign-port fallback.

### Publishing

The MCP depends on three sibling packages that must be on npm first, in this order: `@classcad/skill` (its `prepublishOnly` regenerates the registry from `@classcad/api-js`), `@classcad/script`, `@classcad/renderer`, then `@awv-informatik/classcad-mcp` — each with `npm publish --access public`. A dry run: `npm pack` in each package, then install the four tarballs into an empty directory and run the server.
