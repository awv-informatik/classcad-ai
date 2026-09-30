# @awv-informatik/classcad-mcp

Model Context Protocol server for the [ClassCAD](https://classcad.ch) CAD engine. Self-contained: it runs the ClassCAD engine itself (WASM), so there is no server to set up.

Lets MCP-capable hosts (Claude Code, the Claude desktop app, VS Code Copilot, Cursor, …) drive a live ClassCAD session: build parts and assemblies through scripts, inspect the structure tree, render snapshots, export STEP/STL, load OFB/STEP, and dock into a session an interactive app (buerligons) already has open.

---

## How it works

```
 Claude tab 1 ── stdio ──► classcad-mcp (shim) ──┐
 Claude tab 2 ── stdio ──► classcad-mcp (shim) ──┤ HTTP (MCP Streamable HTTP, 127.0.0.1:9097)
 VS Code      ── stdio ──► classcad-mcp (shim) ──┘
                                                 ▼
                                   classcad-mcp daemon (ONE per machine)
                                     session 1 ── worker thread ──► ClassCAD WASM (the MCP's own engine)
                                     session 2 ── WebSocket ─────► ClassCAD worker (classcad-cli, optional)
                                     session 3 ── bridge ────────► buerligons.io tab (WASM engine in the page)
                                     bridge listener ws://127.0.0.1:9096/bridge  ◄── apps announce share tokens
```

- **Self-contained.** The MCP brings its own engine: the published ClassCAD WASM build, run in a worker thread of the daemon. No server and no key to configure (a six-month engine key is built in); one sign-in with a free classcad.ch account. On first use it downloads the release assets (~60 MB) once and caches them.
- Every host starts the MCP as a **stdio** child process (`node /abs/path/to/dist/server.js`). That process is a thin **shim**: it looks for the daemon on `127.0.0.1:9097`, starts it if none runs, and forwards its host's JSON-RPC to it. The first tab starts the daemon, every later tab reuses it.
- The **daemon** is the actual MCP. It holds one MCP server instance **per session** (per tab: own engine, emission config, caches, tool queue) and the one **bridge listener** apps connect to. With no session left and no app attached to its bridge it exits by itself after `CLASSCAD_DAEMON_IDLE_MS` (60 s). Nothing to install or manage: it is part of this package (`dist/daemon.js`) and lives only while it is used.
- Why a daemon: the in-app bridge means the MCP *listens* on a port, and a port belongs to exactly one process. With one MCP process per tab, the second tab could not bind (or bound the other address family of `localhost` and got half the apps).
- **Optional engines.** If a `classcad-cli worker` is reachable (`CLASSCAD_WS_URL`, default `ws://localhost:9094/`), the default policy `auto` uses it instead of the local engine — for multi-client sessions and `?invite=` sharing with apps. The MCP can also attach to an engine running inside a buerli app's browser tab. See [Engines](#engines-worker-in-app-bridge-local-wasm).
- The engine is started lazily on the first tool call, so an idle session costs nothing.
- Fallback: if `127.0.0.1:9097` is held by something that is not a classcad daemon, the shim serves the MCP in-process (everything works except the in-app bridge) and says so on stderr.

---

## Prerequisites

- **Node.js 20+** and **git**
- Internet access on first use (the WASM assets come from awvstatic.com; afterwards it works offline)

- A free **classcad.ch account**, signed in once per machine (Google, GitHub or email). The MCP asks for it by itself on first use; see [Sign-in](#sign-in).

Nothing else: no ClassCAD server, no key.

---

## Install

The packages are not on npm yet, so the MCP is built from source (a minute or two):

```bash
git clone https://github.com/awv-informatik/classcad-ai.git
cd classcad-ai
npm install
npm run build          # builds skill, script, renderer, then the MCP
```

The server is `packages/mcp/dist/server.js`. Hosts need its **absolute** path — print it from the repo root with:

```bash
echo "$PWD/packages/mcp/dist/server.js"
```

To update later: `git pull && npm install && npm run build` in the checkout; the next session picks up the new build by itself (see [Upgrades](#the-daemon-in-practice)).

> Once published, `npx -y @awv-informatik/classcad-mcp` will replace `node /abs/path/to/dist/server.js` in every config below. `npm install` may warn that `sharp`'s install script was not run; that is fine, `sharp` ships prebuilt binaries.

---

## Configure your host

Every host needs the same two things: the command `node /abs/path/to/classcad-ai/packages/mcp/dist/server.js`, and a restart (or a new session) so it spawns the server. No environment variables are required.

### Claude Code (CLI, and the Code tab of the desktop app)

From the repo root:

```bash
claude mcp add classcad --scope user -- node "$PWD/packages/mcp/dist/server.js"
```

`--scope user` writes to `~/.claude.json` (all projects); `--scope project` writes `.mcp.json` in the current repo instead. Verify with `claude mcp list` — the entry should show `✔ Connected`. Tools appear in the **next** session (each session spawns its own MCP process); in a running session use `/mcp` to reconnect.

Manual equivalent in `~/.claude.json` / `.mcp.json`:

```json
{
  "mcpServers": {
    "classcad": {
      "command": "node",
      "args": ["/abs/path/to/classcad-ai/packages/mcp/dist/server.js"]
    }
  }
}
```

### Claude desktop app (Chat / Cowork)

The chat side of the desktop app has its **own** config and does not read `~/.claude.json`:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Add the same `mcpServers` block as above. The app is not started from a shell, so it has no `PATH`: use the absolute path of `node` as `command` (`which node` tells you; macOS Homebrew: `/opt/homebrew/bin/node`). Quit and reopen the app — it spawns MCP servers only at startup. The server then shows up under Settings → Developer, and the chat renders snapshot images inline.

### Codex

`~/.codex/config.toml`:

```toml
[mcp_servers.classcad]
command = "node"
args = ["/abs/path/to/classcad-ai/packages/mcp/dist/server.js"]
```

### VS Code — GitHub Copilot Chat (agent mode)

Command Palette → **MCP: Add Server**, or edit `.vscode/mcp.json` (workspace) / the user MCP config:

```jsonc
{
  "servers": {
    "classcad": {
      "type": "stdio",
      "command": "node",
      "args": ["/abs/path/to/classcad-ai/packages/mcp/dist/server.js"]
    }
  }
}
```

(Top-level key `servers`, and an explicit `"type": "stdio"`.) Switch Copilot Chat to **Agent** mode; the classcad tools become selectable.

### Cursor

`~/.cursor/mcp.json` (all projects) or `.cursor/mcp.json` (one project): the `mcpServers` block from the Claude Code section.

### OpenCode

`opencode.json`:

```json
{
  "mcp": {
    "classcad": { "type": "local", "command": ["node", "/abs/path/to/classcad-ai/packages/mcp/dist/server.js"] }
  }
}
```

### Other hosts

Most hosts accept the Claude-style `mcpServers` JSON.

### First test

In a new session, ask the agent to *make a box*. The first time, it shows a sign-in link: open it, sign in, and the agent carries on by itself. It should then call `run_script` and answer with a volume; `session_info` shows `"transport": "wasm"` (or `"ws"` when a worker is running). The very first call takes a little longer while the WASM assets download.

---

## Sign-in

The MCP works for signed-in classcad.ch accounts, once per machine. Nothing to prepare: the first engine tool call on a machine that is not signed in answers with a link instead of running.

1. The agent shows the link: `https://classcad.ch/connect?port=…&state=…`. Behind it, the MCP listens on `127.0.0.1:<port>` for this one sign-in (15 minutes).
2. The user opens it and signs in or creates an account (Google, GitHub or email). Already signed in on classcad.ch, it is one "Continue" click.
3. The page hands the sign-in back to `http://127.0.0.1:<port>/callback` (the token rides in the URL fragment, which no server sees). The MCP confirms it with Firebase and stores it in `~/.classcad-mcp/auth.json`.
4. Meanwhile the agent waits in the `login` tool, which returns the moment the sign-in arrives; the browser tab says to go back to the agent.

Every later session on the machine is signed in. The MCP re-checks the account with Firebase at most once an hour; a revoked or disabled account signs the machine out, and without network the last check counts for 14 days. `session_info` shows the account. The docs tools (`list_methods`, `describe_method`, `docs`) work without a sign-in.

From a terminal, the same flow and more (`node dist/server.js <command>` in a checkout):

- `classcad-mcp login` prints the link and waits until it is used
- `classcad-mcp whoami` shows the sign-in
- `classcad-mcp logout` signs the machine out (or the `login` tool with `logout: true`)

---

## Environment variables

| Variable                 | Purpose                                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `CLASSCAD_WS_URL`        | WebSocket URL of an optional ClassCAD worker. Default `ws://localhost:9094/`; unreachable → the local WASM engine. Any reachable worker works (`wss://…`). |
| `CLASSCAD_SNAPSHOT_DIR`  | Where `snapshot` writes its PNGs when the call passes no `outDir`. Default `<tmpdir>/classcad-snapshots`.        |
| `CLASSCAD_SKILL_PATH`    | Use a local `classcad-skill` checkout for docs instead of the installed `@classcad/skill` package.                |
| `CLASSCAD_BRIDGE_LISTEN` | Listener for the in-app bridge (see below). Default `ws://127.0.0.1:9096/bridge`. The daemon starts even if it cannot bind and retries every 5 s. |
| `CLASSCAD_MCP_PORT`      | Port of the daemon's HTTP endpoint on `127.0.0.1`. Default `9097`. Shim and daemon must agree (the shim passes it on when it starts the daemon). |
| `CLASSCAD_MCP_URL`       | Full daemon URL instead of `http://127.0.0.1:<port>` (rarely needed).                                             |
| `CLASSCAD_DAEMON_IDLE_MS`| How long the daemon lives without any session and without any app on the bridge before it exits. Default `60000`. |
| `CLASSCAD_MCP_LOG`       | Daemon log file. Default `<tmpdir>/classcad-mcp/daemon.log` (the shim prints the path on stderr at startup).       |
| `CLASSCAD_ENGINE`        | Engine policy when no token/URL decides: `auto` (default: the worker, else the local WASM engine), `drogon` (worker only), `wasm` (local engine only). |
| `CLASSCAD_AUTH_URL`      | The sign-in page. Default `https://classcad.ch/connect` (the dev site: `http://localhost:9090/connect`).          |
| `CLASSCAD_AUTH_FILE`     | Where the sign-in is stored. Default `~/.classcad-mcp/auth.json`.                                                 |
| `CLASSCAD_WASM_KEY`      | A ClassCAD key (classcad.ch/user) for the local WASM engine. Optional: a key valid until 2027-03-30 is built in.   |
| `CLASSCAD_WASM_ORIGIN`   | Origin the local engine believes it runs on; must be in the key's allowed origins. Default `http://localhost:3000`. |
| `CLASSCAD_WASM_VERSION`  | ClassCAD release to host. Default `21.2.0` (what the buerli apps load).                                            |
| `CLASSCAD_WASM_DIR`      | Where the release assets are cached. Default `~/.classcad-mcp/wasm/<version>`.                                     |
| `CLASSCAD_WASM_URL`      | Download base override. Default `https://awvstatic.com/classcad/download/release/<version>/wasm`.                  |

None is required. Set them in the host's MCP config `env` block; the shim passes them on to the daemon it starts. `CLASSCAD_WS_URL` is per session — the daemon receives it with every new session, so two tabs can point at different workers.

### The daemon in practice

- **Which process is which:** `classcad-mcp` shim = the process your host started (`dist/server.js`), one per tab, exits with the tab. `dist/daemon.js` = the one long-lived process; `GET http://127.0.0.1:9097/health` shows its pid, version, active session count, attached app count, bridge address and log file.
- **Multiple tabs:** each tab is one session in the same daemon. Sessions are independent (a script in tab A does not touch tab B's caches). `session_info` shows what a tab is attached to.
- **Lifetime:** the daemon exits a minute after the last session closed, unless an app still holds a bridge (a shared buerligons.io tab keeps it alive, so the next tab attaches instantly). Apps reconnect by themselves within 5 s after a daemon restart; `use_session` waits 8 s for that. A shim exits when its host closes stdin or sends SIGTERM; the daemon drops that session immediately.
- **Upgrades:** after `npm run build` (or a package update) the next shim notices the version or build-stamp mismatch (`/health` reports both; the stamp is taken when the daemon starts and covers `dist/daemon.js` plus the `@classcad/renderer` and `@classcad/script` builds). An idle old daemon is shut down and replaced. A busy one (other tabs) is told to *drain* — it takes no new sessions and exits when its last tab closes — and the new tab runs the current build **in-process** meanwhile (worker and local WASM work, only the in-app bridge is unavailable in that tab until the old daemon is gone). Old tabs keep their old code until they are restarted.
- **Logs:** the shim writes one line per session start/end to stderr (visible in the host's MCP log); the daemon writes to `CLASSCAD_MCP_LOG`. Run it by hand to watch: `CLASSCAD_MCP_DAEMON=1 node dist/daemon.js` (logs to stderr when `CLASSCAD_MCP_LOG` is unset).
- **Troubleshooting:** `curl http://127.0.0.1:9097/health` — no answer means no daemon (the next tool call starts one); an answer without `"bridge"` means port 9096 is held by another program (usually an old MCP process — close that tab or kill it, the daemon retries by itself); a `name` other than `classcad-mcp` means a foreign program owns 9095 (set `CLASSCAD_MCP_PORT`). `classcad-mcp stop` stops an idle daemon (see below). Ports: 9094 worker (ws), 9095 worker (wss), 9096 bridge, 9097 daemon — all on `127.0.0.1` except the worker.
- **Stopping / restarting:** the package binary doubles as a small CLI (`node dist/server.js <command>` in a checkout):
  - `classcad-mcp status` — the running daemon's `/health` (pid, build, sessions, apps, log file).
  - `classcad-mcp stop` — stops the daemon when no session is active; refuses (exit 1) otherwise.
  - `classcad-mcp stop --force` — SIGTERM (SIGKILL after 5 s) regardless of sessions, e.g. to load a rebuilt renderer right away. Every connected tab loses its drawing; its shim reconnects on the next tool call — it starts a fresh daemon and replays the host's `initialize`, so the host does not need a restart.
- **Security:** the daemon binds `127.0.0.1` and refuses (403) every request that carries an `Origin` header or a `Host` other than `127.0.0.1` / `localhost` / `[::1]` — web pages cannot drive it, not even via DNS rebinding. The bridge WebSocket (9096) is meant for browser apps and is protected by share tokens instead.

---

## Tools

| Tool                    | Purpose                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `run_script`            | **The** execution medium: JavaScript against `api.v1.*`, `api.tree()`, `api.graphic()`. State persists between scripts; follow-up scripts attach to the existing model. |
| `tree` / `find` / `inspect` | Structure tree (cached, pulled on demand), search by class/name, full node detail with parent chain |
| `snapshot`              | Render the drawing to PNG (iso/top/front/…, section cuts, four-view sheet, technical drawing with hidden lines, highlights, markers) |
| `list_methods` / `describe_method` / `docs` | Method index, per-method reference with LLM-oriented gotchas, recipes                 |
| `save` / `load` / `clear` / `checkpoint` / `restore` | STEP / STL export, loading OFB / STEP / STL, undo points. OFB export is not available in this release (`save`, and `common.save` / `assembly.exportNode` in scripts, refuse it); checkpoints still use it internally, in memory only. |
| `login`                 | Sign the machine in (returns the link, then waits for it to be used) or out |
| `session_info` / `use_session` | Connection status (transport ws/bridge); attach to a named session, an invite link, or an in-app engine's `?bridge=` link |
| `bridge.list_clients` / `bridge.get_selection` / `bridge.set_selection` | Read/write the selection of a connected CC app (see bridge) |

`snapshot` returns the PNG as an inline image block **for the model** and writes it to `CLASSCAD_SNAPSHOT_DIR`. Claude Code and the desktop app's Code tab do not show tool-result images to the user — the tool result says so and names the saved file, so the model can hand it over (Claude Code: `SendUserFile`). The desktop app's chat renders it directly. Claude Code only previews sent files that live in the session's own folders (scratchpad or project) — anything else arrives as a grey placeholder card — so the tool tells the model to pass `outDir` = its scratchpad.

**Tool calls are serialized.** All tools share one engine connection and one drawing, so the server runs one tool call at a time (docs lookups excepted). A `snapshot` issued in parallel with a `run_script` waits for the script instead of rendering a half-built model. Subagents of a session use the same MCP process and therefore the same queue.

---

## Engines: worker, in-app bridge, local WASM

The MCP can run its commands on three kinds of engine. A token or URL always decides by itself; without one the **engine policy** decides.

| Engine | What it is | How the MCP gets there |
| --- | --- | --- |
| **Worker (Drogon)** | A `classcad-cli worker` — a server on your machine, in Docker or hosted. Multi-client sessions, sharing with apps via `?invite=` links. | `CLASSCAD_WS_URL`, `use_session(sessionId)`, `use_session(url)` with a `ws(s)://` or `?invite=` link. |
| **In-app bridge** | The engine inside a buerli app's browser tab (WASM in the page, e.g. buerligons.io). | `use_session(url)` with the app's `?bridge=` share link. |
| **Local WASM** | The published ClassCAD WASM build, hosted by the MCP itself in a worker thread of the daemon. No server, no browser, works offline once the assets are cached. | Nothing to configure (a six-month key is built in); the policy (`auto`/`wasm`) or `use_session(engine="wasm")`. |

**Policy.** `CLASSCAD_ENGINE` (default `auto`) and the `engine` argument of `use_session`:

- `auto` — the worker if it is reachable, otherwise the local engine. "Connect the MCP and make a box" needs nothing else: with a worker running it is used, without one the MCP models on its own engine and says so in `session_info` (`transport: "wasm"`).
- `drogon` — the worker only. "Connect the MCP to my Drogon/ClassCAD server." No fallback; a dead worker is reported as such.
- `wasm` — the local engine only. "Connect the MCP to WASM / work locally / offline."

The choice sticks for the session until `use_session` changes it; a `?bridge=` or `?invite=` link overrides it for as long as that session is used. The fallback only fires when the worker is *unreachable* (refused, timeout) — errors after a successful connect are never papered over — and never for an explicitly named session id.

**What the local engine needs.**

- **A key.** ClassCAD keys are bound to *allowed origins* (managed on classcad.ch/user). The engine's license check compares the origin it runs on with those. A Node process has no origin, so the MCP presents itself as `CLASSCAD_WASM_ORIGIN` (default `http://localhost:3000`). A **six-month key** (wasm, allowed origin `http://localhost:3000`, valid until 2027-03-30) is built in, so nothing needs configuring. The engine refuses an expired key, so a release with a renewed key has to ship before that date (`buerli-backend/functions/scripts/appkey.mjs` issues one); `CLASSCAD_WASM_KEY` swaps in your own key (set `CLASSCAD_WASM_ORIGIN` to match if it allows another origin).
- **The release assets** (~60 MB: glue, main module, three side modules, class file, filter config). Downloaded once from awvstatic.com into `CLASSCAD_WASM_DIR` on first use — the first tool call that needs the engine takes a moment longer and the daemon log shows the progress. Afterwards the engine starts in about a second per session (~130 MB heap each; one engine per session, ended with the session).
- **Node ≥ 20** for `worker_threads` and `fetch` — the same requirement as the rest of the package.

**What is different on the local engine.** It is the same engine as in the browser apps: one drawing, no multi-client sessions, no `?invite=` sharing, and no per-connection emission config (`run_script` runs without payload suppression — fine for the sizes an MCP session handles). `snapshot`, `tree`, `find`, `inspect`, `save`/`load`, `checkpoint`/`restore` all work. Nothing the MCP does on its own engine is visible to any app.

**When the local engine fails.** Engine errors come back like on the worker (`maxLevel` 51 plus messages, so `run_script` throws), including the ones the WASM engine reports only in its nested `result` or as a separate ErrorMessage frame; a Result with neither a value nor a level is an error, never an empty success. An engine that crashes, traps mid-command or does not answer within the request timeout is retired: that command fails with the reason, and the next one starts a new engine with an **empty drawing** (checkpoints stay valid — `restore` loads them into the new engine). `use_session(engine="wasm"|"auto")` health-checks a running engine and replaces it if it does not answer; a healthy one is kept together with its drawing (`clear` empties it).

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

Source map: `src/server.ts` (stdio shim: find/start daemon, proxy, in-process fallback), `src/daemon.ts` (HTTP endpoint, sessions, bridge listener, idle exit), `src/mcp-server.ts` (the MCP server: tools wired to one engine client — what a session is), `src/client.ts` (engine client: WebSocket to a worker or bridge to an app), `src/bridge/` (listener + protocol), `src/engine/wasm.ts` + `wasm-worker.ts` (the local WASM engine: asset download, worker thread, origin/XHR shims), `src/tools/`, `src/queue.ts` (per-session tool queue). `test/daemon.mjs` is the daemon contract: two shims → one daemon with two independent sessions, idle exit, foreign-port fallback. `test/wasm-live.mjs` (part of `npm test`; downloads the assets on first run) covers the local engine: policy `wasm`, `auto` fallback with a dead worker, `drogon` without fallback, switching with `use_session`, engine errors surfacing through `run_script`, and replacing a crashed, hung or wedged engine.

### Publishing

The MCP depends on three sibling packages that must be on npm first, in this order: `@classcad/skill` (its `prepublishOnly` regenerates the registry from `@classcad/api-js`), `@classcad/script`, `@classcad/renderer`, then `@awv-informatik/classcad-mcp` — each with `npm publish --access public`. A dry run: `npm pack` in each package, then install the four tarballs into an empty directory and run the server.

## Build failure and cancellation behavior

`run_script` rejects engine errors and reports progress when the caller supplies
an MCP progress token. The request's cancellation signal stops subsequent CAD
calls; an already-running native operation can still complete. While such work
is unresolved, drawing tools return a busy error; documentation and session
information remain available. No automatic retry or rollback is performed.
A transport timeout requires reconnecting and checking the drawing before
retrying a mutation.

Snapshots default to **no regeneration**, return capture metadata, and report
refresh errors. Set `recalc:true` explicitly when rebuilding geometry is intended;
use `quality:'fine'` with it for adaptive refinement. Keep regeneration disabled
for injected bodies. The shared `api.inspect` helpers are documented in
`packages/script/README.md`.
