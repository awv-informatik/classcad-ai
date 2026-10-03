# @classcad/mcp

Model Context Protocol server for the [ClassCAD](https://classcad.ch) CAD engine. Self-contained: it runs the ClassCAD engine itself (WASM), so there is no server to set up.

Lets MCP-capable hosts (Claude Code, the Claude desktop app, VS Code Copilot, Cursor, …) drive a live ClassCAD session: build parts and assemblies through scripts, inspect the structure tree, render snapshots, save and load STEP, STL and OFB.

The session is shared. The CAD app, [Buerligons](https://buerligons.io), docks into it: the user turns, selects and edits the same model the agent builds. Its link can be sent to a colleague or opened on another device (through the share relay), and the agent can also join the session of an app the user already has open.

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
                                     session 3 ── WebSocket ─────► a session an app shares (by invite)
                                     127.0.0.1:9098  ◄── the app, docked into a session · apps that host a session of their own
                                     wss, dialled out ──► share relay (Cloudflare) ◄── the app on any other machine, by share link
```

- **Self-contained.** The MCP brings its own engine: the published ClassCAD WASM build, run in a worker thread of the daemon. No server and no key to configure (a six-month engine key is built in); one sign-in with a free classcad.ch account. On first use it downloads the release assets (about 16 MB) once and caches them.
- Every host starts the MCP as a **stdio** child process (`npx -y @classcad/mcp@latest`). That process is a thin **shim**: it looks for the daemon on `127.0.0.1:9097`, starts it if none runs, and forwards its host's JSON-RPC to it. The first tab starts the daemon, every later tab reuses it.
- The **daemon** is the actual MCP. It holds one MCP server instance **per session** (per tab: own engine, caches, tool queue, invites) and the one **listener sessions are joined on** (`127.0.0.1:9098`): the app docks into the MCP's sessions there, and apps that run the engine in their own page offer their sessions there. With no session left and no such app waiting it exits by itself after `CLASSCAD_DAEMON_IDLE_MS` (60 s). Nothing to install or manage: it is part of this package (`dist/daemon.js`) and lives only while it is used.
- Why a daemon: the MCP *listens* on a port, and a port belongs to exactly one process. With one daemon, every session's app link has the same address, and an app that looks for the MCP finds it.
- **Shared with the user.** Every session has a live CAD app, docked into the same engine: see [The app](#the-app). The session protocol is the one a ClassCAD server speaks, so any buerli app joins the same way: see [Sharing](#sharing-one-session-several-participants).
- **Shared beyond the machine.** A session is also offered on the share relay ([`packages/relay`](../relay), a Cloudflare Worker), so the app's link works on any machine. The MCP dials out to it; nothing on the machine listens for the outside. See [Somebody elsewhere joins](#somebody-elsewhere-joins).
- **Optional engines.** If a `classcad-cli worker` is reachable (`CLASSCAD_WS_URL`, default `ws://localhost:9094/`), the default policy `auto` uses it instead of the local engine. See [Engines](#engines-worker-or-local-wasm).
- The engine is started lazily on the first tool call, so an idle session costs nothing.
- Fallback: if `127.0.0.1:9097` is held by something that is not a classcad daemon, the shim serves the MCP in-process (with a listener of its own, on a free port if `9098` is taken) and says so on stderr.

---

## Prerequisites

- **Node.js 20+** (`node`, `npx`)
- Internet access on first use (the package comes from npm, the engine from awvstatic.com; afterwards it works offline)
- A free **classcad.ch account**, signed in once per machine (Google, GitHub or email). The MCP asks for it by itself on first use; see [Sign-in](#sign-in).

Nothing else: no ClassCAD server, no key.

---

## Install

There is nothing to clone or build. Every host starts the server with one command:

```bash
npx -y @classcad/mcp@latest
```

`@latest` makes `npx` fetch the newest release instead of reusing a cached one; `-y` skips the install prompt. `npx` may warn that `sharp`'s install script was not run; that is fine, `sharp` ships prebuilt binaries.

**Windows (native, not WSL):** hosts cannot start `npx` directly. Use `cmd` as the command with the arguments `/c npx -y @classcad/mcp@latest`, e.g. `claude mcp add classcad --scope user -- cmd /c npx -y @classcad/mcp@latest`, or `"command": "cmd", "args": ["/c", "npx", "-y", "@classcad/mcp@latest"]` in JSON configs. (The Claude Code plugin below needs no such change.)

From source, only where npm is not reachable: `git clone https://github.com/awv-informatik/classcad-ai.git && cd classcad-ai && npm install && npm run build`, then use `node /abs/path/to/classcad-ai/packages/mcp/dist/server.js` in place of the `npx` command (`echo "$PWD/packages/mcp/dist/server.js"` prints the path).

---

## Configure your host

Every host needs the command above and a new session (or a restart), so it spawns the server. No environment variables are required.

### Claude Code (CLI, and the Code tab of the desktop app)

The plugin brings the MCP server and a ClassCAD skill, on macOS, Linux and Windows alike:

```bash
claude plugin marketplace add awv-informatik/classcad-ai
claude plugin install classcad@classcad
```

Or the MCP server alone (one of the two, not both):

```bash
claude mcp add classcad --scope user -- npx -y @classcad/mcp@latest
```

`--scope user` writes to `~/.claude.json` (all projects); `--scope project` writes `.mcp.json` in the current repo instead. Verify with `claude mcp list` — the entry should show `✔ Connected`. Tools appear in the **next** session (each session spawns its own MCP process); in a running session use `/mcp` to reconnect.

Manual equivalent in `~/.claude.json` / `.mcp.json`:

```json
{
  "mcpServers": {
    "classcad": { "command": "npx", "args": ["-y", "@classcad/mcp@latest"] }
  }
}
```

### Claude desktop app (Chat / Cowork)

The chat side of the desktop app has its **own** config and does not read `~/.claude.json`:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Add the same `mcpServers` block as above. The app is not started from a shell, so it has no `PATH`: if it cannot start `npx`, use its absolute path as `command` (`which npx` tells you; macOS Homebrew: `/opt/homebrew/bin/npx`), and if it then cannot find `node`, add `"env": { "PATH": "<the folder that holds node>:/usr/bin:/bin" }`. Quit and reopen the app — it spawns MCP servers only at startup. The server then shows up under Settings → Developer, and the chat renders snapshot images inline.

### Codex

`~/.codex/config.toml`:

```toml
[mcp_servers.classcad]
command = "npx"
args = ["-y", "@classcad/mcp@latest"]
```

### VS Code — GitHub Copilot Chat (agent mode)

Command Palette → **MCP: Add Server**, or edit `.vscode/mcp.json` (workspace) / the user MCP config:

```jsonc
{
  "servers": {
    "classcad": { "type": "stdio", "command": "npx", "args": ["-y", "@classcad/mcp@latest"] }
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
    "classcad": { "type": "local", "command": ["npx", "-y", "@classcad/mcp@latest"] }
  }
}
```

### Other hosts

Most hosts accept the Claude-style `mcpServers` JSON.

### First test

In a new session, ask the agent to *make a box*. The first time, it shows a sign-in link: open it, sign in, and the agent carries on by itself. It should then call `run_script` and answer with a volume, and the app comes up with the box (in the desktop app's Browser pane, or in your browser); `session_info` shows `"transport": "wasm"` (or `"ws"` when a worker is running). The very first call takes a little longer while the WASM assets download.

---

## The app

Every session has a live CAD app: [Buerligons](https://buerligons.io), the buerli CAD app, docked into the session's own engine. The package carries a build of it and serves it itself, so there is nothing to install and it works offline.

- **It comes up with the first model** of a session and shows every change the agent makes as it happens. Where it comes up is the host's: in the **Claude desktop app** (Code tab) it is the app's own Browser pane, beside the conversation — the agent opens it there; everywhere else the MCP opens the user's default browser. The result of the script that makes the first model ends with the link (`App: …`), once per session: agents do not carry it into every answer. `session_info` names it, and `view` returns it and brings the app up again (unless the user already has it open: one tab per session is enough).
- **The user works in it too.** Turn and zoom, measure, select; edit a feature's values, draw and constrain a sketch, add or delete features, start over or open a file. It is the same model: what the user changes is in the tree the agent reads next, and what the agent builds appears in the app at once. A command from the app waits for a running script to finish, so the two never interleave inside one.
- **Pointing.** What the user has selected in the app, the agent reads with `get_selection` ("fillet *this* edge"); with `set_selection` the agent highlights something for the user.
- **Files.** The app's File menu saves the model as OFB (ClassCAD's own format, with the features), STEP or STL, and opens such files into the session.
- **One link per session, and it travels.** The link carries an invite to exactly one session, so several sessions (tabs, hosts) work side by side, each with its own app. By default it is a **share link**, `https://<relay>/?invite=…`: the same link works for a colleague, or on the user's tablet (see [Somebody elsewhere joins](#somebody-elsewhere-joins)). While the relay does not hold the session, or with `CLASSCAD_SHARE=ask` or `off`, it is the link on this machine, `http://127.0.0.1:9098/?invite=…`. When a session ends, or moves to another engine, the app says so and offers to join again.
- **Where the model is.** The session and its engine stay on the user's machine. The MCP serves the app on `127.0.0.1:9098` (`CLASSCAD_VIEWER_PORT`; another free port when that one is taken) and answers only requests that name it as their host: opened from there, nothing of the model leaves the machine. Opened under the share link, the app's frames pass through the relay, which keeps none of them. The invite is the key to the session, so the link is a secret: whoever has the share link is in.

`CLASSCAD_VIEWER_OPEN` says where the app comes up: `browser` (the user's default browser), `host` (the agent opens it in its host's own browser pane — for any host that has one) or `0` (nowhere: the agent hands the link over). Unset, it is `host` in the Claude desktop app and `browser` everywhere else. `CLASSCAD_APP_URL` names an app that is hosted elsewhere instead of the one in this package: the link becomes `<url>?invite=…`, and the app has to join that invite on `ws://127.0.0.1:9098/session` (a Buerligons built for the engine in its page does). A page from a public site reaches `127.0.0.1` only if the browser lets it: see [the limit](#what-the-browser-has-to-allow) below. `CLASSCAD_VIEWER=readonly` shows the read-only 3D view instead of the app (a page that only turns and exports the model; a build of this package without the app has it too), `CLASSCAD_VIEWER=off` shows nothing.

---

## Sign-in

The MCP works for signed-in classcad.ch accounts, once per machine. An installing agent signs in as its last step (`login`, or `classcad-mcp login` in a terminal); otherwise the first engine tool call on a machine that is not signed in starts the sign-in instead of running.

1. The sign-in page opens in the user's browser by itself (`open` / `xdg-open` / `start`; not on a remote shell without a display, nor with `CLASSCAD_AUTH_NO_BROWSER=1`), and the agent shows the same link as a fallback: `https://classcad.ch/connect?port=…&state=…`. Behind it, the MCP listens on `127.0.0.1:<port>` for this one sign-in (15 minutes).
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
| `CLASSCAD_SKILL_PATH`    | Read the docs live from a skill directory (`packages/skill` of a checkout) instead of the bundle in the installed `@classcad/skill`: edits show without a rebuild. |
| `CLASSCAD_MCP_PORT`      | Port of the daemon's HTTP endpoint on `127.0.0.1`. Default `9097`. Shim and daemon must agree (the shim passes it on when it starts the daemon). |
| `CLASSCAD_MCP_URL`       | Full daemon URL instead of `http://127.0.0.1:<port>` (rarely needed).                                             |
| `CLASSCAD_DAEMON_IDLE_MS`| How long the daemon lives without any session, and without any app that offers a session of its own, before it exits. Default `60000`. |
| `CLASSCAD_MCP_LOG`       | Daemon log file. Default `<tmpdir>/classcad-mcp/daemon.log` (the shim prints the path on stderr at startup).       |
| `CLASSCAD_ENGINE`        | Engine policy when no token/URL decides: `auto` (default: the worker, else the local WASM engine), `drogon` (worker only), `wasm` (local engine only). |
| `CLASSCAD_VIEWER`        | What a session shows the user. Default: the app. `readonly`: the read-only 3D view. `off`: nothing.               |
| `CLASSCAD_VIEWER_PORT`   | Port of the listener sessions are joined on, on `127.0.0.1`. Default `9098`; a free port is taken when it is in use (`0`: always a free one). Apps that host their own session look for the MCP on `9098`. |
| `CLASSCAD_VIEWER_OPEN`   | Where the app comes up with the first model: `browser` (the user's default browser), `host` (the agent opens it in its host's own browser pane), `0` (nowhere; the link is handed over). Default: `host` in the Claude desktop app's Code tab, `browser` elsewhere. Per session. |
| `CLASSCAD_APP_URL`       | The app to dock into sessions, when it is hosted elsewhere (e.g. `https://buerligons.io/`); the link becomes `<url>?invite=…`. Default: the app in this package. |
| `CLASSCAD_RELAY_URL`     | The share relay sessions are shared on (`https://…`; [`packages/relay`](../relay)). `off`: sessions are never shared. Default: `https://classcad-share.it-5ca.workers.dev` (`DEFAULT_RELAY_URL` in `src/share/relay.ts`). |
| `CLASSCAD_SHARE`         | When a session gets a link that works beyond its machine: `always` (default — from its first model on, and the app comes up under that link), `ask` (when the user asks for it, the `share` tool; the app's own link stays on `127.0.0.1`), `off` (never). |
| `CLASSCAD_AUTH_URL`      | The sign-in page. Default `https://classcad.ch/connect` (the dev site: `http://localhost:9090/connect`).          |
| `CLASSCAD_AUTH_FILE`     | Where the sign-in is stored. Default `~/.classcad-mcp/auth.json`.                                                 |
| `CLASSCAD_AUTH_NO_BROWSER` | `1`: the sign-in page is not opened in a browser; the agent shows its link (also so when `CI` is set).          |
| `CLASSCAD_WASM_KEY`      | A ClassCAD key (classcad.ch/user) for the local WASM engine. Optional: a key valid until 2027-03-30 is built in.   |
| `CLASSCAD_WASM_ORIGIN`   | Origin the local engine believes it runs on; must be in the key's allowed origins. Default `http://localhost:3000`. |
| `CLASSCAD_WASM_VERSION`  | ClassCAD release to host. Default `21.2.0` (what the buerli apps load).                                            |
| `CLASSCAD_WASM_DIR`      | Where the release assets are cached. Default `~/.classcad-mcp/wasm/<version>`.                                     |
| `CLASSCAD_WASM_URL`      | Download base override. Default `https://awvstatic.com/classcad/download/release/<version>/wasm`.                  |

None is required. Set them in the host's MCP config `env` block; the shim passes them on to the daemon it starts. `CLASSCAD_WS_URL`, `CLASSCAD_ENGINE` and `CLASSCAD_VIEWER_OPEN` are per session — the daemon receives them with every new session, so two tabs can point at different workers, and a tab in the Claude desktop app shows its app in the pane while a terminal's opens the browser.

### The daemon in practice

- **Which process is which:** `classcad-mcp` shim = the process your host started (`dist/server.js`), one per tab, exits with the tab. `dist/daemon.js` = the one long-lived process; `GET http://127.0.0.1:9097/health` shows its pid, version, active session count, the number of apps in a session (`apps`), the address sessions are joined on (`join`) and the log file.
- **Multiple tabs:** each tab is one session in the same daemon. Sessions are independent (a script in tab A does not touch tab B's caches). `session_info` shows what a tab is attached to.
- **Lifetime:** the daemon exits a minute after the last session closed, unless an app still offers a session of its own (a buerli app with the engine in its page keeps it alive, so the next tab joins it instantly). Such apps find a restarted daemon by themselves within 5 s; `use_session` waits 8 s for that. A shim exits when its host closes stdin or sends SIGTERM; the daemon drops that session immediately, and the app docked into it says that the session is over.
- **Upgrades:** after `npm run build` (or a package update) the next shim notices the version or build-stamp mismatch (`/health` reports both; the stamp is taken when the daemon starts and covers `dist/daemon.js` plus the `@classcad/renderer` and `@classcad/script` builds). An idle old daemon is shut down and replaced. A busy one (other tabs) is told to *drain* — it takes no new sessions and exits when its last tab closes — and the new tab runs the current build **in-process** meanwhile (with a listener of its own for its app, on a free port). Old tabs keep their old code until they are restarted.
- **Logs:** the shim writes one line per session start/end to stderr (visible in the host's MCP log); the daemon writes to `CLASSCAD_MCP_LOG`. Run it by hand to watch: `CLASSCAD_MCP_DAEMON=1 node dist/daemon.js` (logs to stderr when `CLASSCAD_MCP_LOG` is unset).
- **Troubleshooting:** `curl http://127.0.0.1:9097/health` — no answer means no daemon (the next tool call starts one); a `join` address on another port than 9098 means that port is held by another program (usually an MCP process of an older build — close that tab): app links still work, but apps that host their own session will not find the MCP; a `name` other than `classcad-mcp` means a foreign program owns 9097 (set `CLASSCAD_MCP_PORT`). `classcad-mcp stop` stops an idle daemon (see below). Ports: 9094 worker (ws), 9095 worker (wss), 9097 daemon, 9098 the app and the sessions — all on `127.0.0.1` except the worker. The share relay is reached by an outgoing WebSocket (443); `session_info` shows under `shared` whether it holds the session.
- **Stopping / restarting:** the package binary doubles as a small CLI (`node dist/server.js <command>` in a checkout):
  - `classcad-mcp status` — the running daemon's `/health` (pid, build, sessions, apps, log file).
  - `classcad-mcp stop` — stops the daemon when no session is active; refuses (exit 1) otherwise.
  - `classcad-mcp stop --force` — SIGTERM (SIGKILL after 5 s) regardless of sessions, e.g. to load a rebuilt renderer right away. Every connected tab loses its drawing; its shim reconnects on the next tool call — it starts a fresh daemon and replays the host's `initialize`, so the host does not need a restart.
- **Security:** the daemon binds `127.0.0.1` and refuses (403) every request that carries an `Origin` header or a `Host` other than `127.0.0.1` / `localhost` / `[::1]` — web pages cannot drive it, not even via DNS rebinding. The listener on 9098 is meant for browser apps: it answers only requests that name it as their host, and a session is joined only with its invite (a 122-bit random token) on a signed-in machine. Sharing a session beyond the machine opens no port: the MCP dials out to the relay, which takes the offer only with the machine's sign-in and lets in whoever has that session's share invite — an invite of its own, which the listener does not take and `share` takes back.

---

## Tools

| Tool                    | Purpose                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `run_script`            | **The** execution medium: JavaScript against `api.v1.*`, `api.tree()`, `api.graphic()`. State persists between scripts; follow-up scripts attach to the existing model. |
| `tree` / `find` / `inspect` | Structure tree (cached, pulled on demand), search by class/name, full node detail with parent chain |
| `snapshot`              | Render the drawing to PNG (iso/top/front/…, section cuts, four-view sheet, technical drawing with hidden lines, highlights, markers) |
| `list_methods` / `describe_method` / `docs` | Method index, per-method reference with LLM-oriented gotchas, recipes                 |
| `view`                  | The session's app: returns its link and brings it up (the host's browser pane, or the user's browser), unless the user already has it open. `local: true`: the link on this machine, for when the share link does not load |
| `share`                 | The link to the session's app that works from anywhere, for somebody on another machine; `stop: true` takes it back |
| `get_selection` / `set_selection` | What the user has selected in the app (faces, edges, vertices, tree objects), with the ids API calls take; and selecting something there to point it out |
| `save` / `load` / `clear` / `checkpoint` / `restore` | `save` writes STEP, STL, GLB or OFB to a `path` on disk (or returns base64); with `analytic` a STEP gets planes, cylinders and cones as such instead of B-spline surfaces. `load` reads OFB / STEP / STL from a `path` on disk (or from base64 content). `checkpoint` / `restore` are undo points, kept in the MCP's memory. |
| `login`                 | Sign the machine in (returns the link, then waits for it to be used) or out |
| `session_info` / `use_session` | Status (engine, the app's link, the share link under `shared`, who else is in the session, sign-in); switch engine, or join the session of an app with its invite link |

`snapshot` returns the PNG as an inline image block **for the model** and writes it to `CLASSCAD_SNAPSHOT_DIR`. Claude Code and the desktop app's Code tab do not show tool-result images to the user — the tool result says so and names the saved file, so the model can hand it over (Claude Code: `SendUserFile`). The desktop app's chat renders it directly. Claude Code only previews sent files that live in the session's own folders (scratchpad or project) — anything else arrives as a grey placeholder card — so the tool tells the model to pass `outDir` = its scratchpad.

**Tool calls are serialized.** All tools share one engine connection and one drawing, so the server runs one tool call at a time (docs lookups excepted). A `snapshot` issued in parallel with a `run_script` waits for the script instead of rendering a half-built model. Subagents of a session use the same MCP process and therefore the same queue.

---

## Engines: worker, or local WASM

The MCP runs its own sessions on one of two engines; the **engine policy** decides which. (Joining the session of an app is not a choice of engine: the engine is the app's, see [Sharing](#sharing-one-session-several-participants).)

| Engine | What it is | How the MCP gets there |
| --- | --- | --- |
| **Local WASM** | The published ClassCAD WASM build, hosted by the MCP itself in a worker thread of the daemon. No server, no browser, works offline once the assets are cached. | Nothing to configure (a six-month key is built in); the policy (`auto`/`wasm`) or `use_session(engine="wasm")`. |
| **Worker (Drogon)** | A `classcad-cli worker` — a server on your machine, in Docker or hosted. | `CLASSCAD_WS_URL`, the policy (`auto`/`drogon`), `use_session(sessionId)`. |

**Policy.** `CLASSCAD_ENGINE` (default `auto`) and the `engine` argument of `use_session`:

- `auto` — the worker if it is reachable, otherwise the local engine. "Connect the MCP and make a box" needs nothing else: with a worker running it is used, without one the MCP models on its own engine and says so in `session_info` (`transport: "wasm"`).
- `drogon` — the worker only. "Connect the MCP to my Drogon/ClassCAD server." No fallback; a dead worker is reported as such.
- `wasm` — the local engine only. "Connect the MCP to WASM / work locally / offline."

The choice sticks for the session until `use_session` changes it; an invite link overrides it for as long as that session is used. The fallback only fires when the worker is *unreachable* (refused, timeout) — errors after a successful connect are never papered over — and never for an explicitly named session id. A session that moves to another engine starts with that engine's (empty) drawing; an app docked into it is told and joins again with the same link.

**What the local engine needs.**

- **A key.** ClassCAD keys are bound to *allowed origins* (managed on classcad.ch/user). The engine's license check compares the origin it runs on with those. A Node process has no origin, so the MCP presents itself as `CLASSCAD_WASM_ORIGIN` (default `http://localhost:3000`). A **six-month key** (wasm, allowed origin `http://localhost:3000`, valid until 2027-03-30) is built in, so nothing needs configuring. The engine refuses an expired key, so a release with a renewed key has to ship before that date (`buerli-backend/functions/scripts/appkey.mjs` issues one); `CLASSCAD_WASM_KEY` swaps in your own key (set `CLASSCAD_WASM_ORIGIN` to match if it allows another origin).
- **The release assets** (about 16 MB: glue, main module, three side modules, class file, filter config). Downloaded once from awvstatic.com into `CLASSCAD_WASM_DIR` on first use — the first tool call that needs the engine takes a moment longer and the daemon log shows the progress. Afterwards the engine starts in about a second per session (~130 MB heap each; one engine per session, ended with the session).
- **Node ≥ 20** for `worker_threads` and `fetch` — the same requirement as the rest of the package.

**What is different on the local engine.** It is the same engine as in the browser apps: one drawing, and no per-connection emission config (`run_script` runs without payload suppression — fine for the sizes an MCP session handles). `snapshot`, `tree`, `find`, `inspect`, `save`/`load`, `checkpoint`/`restore` all work. The session layer a server has around its engine (invites, guests, presence) the MCP provides itself: see [Sharing](#sharing-one-session-several-participants).

**When the local engine fails.** Engine errors come back like on the worker (`maxLevel` 51 plus messages, so `run_script` throws), including the ones the WASM engine reports only in its nested `result` or as a separate ErrorMessage frame; a Result with neither a value nor a level is an error, never an empty success. An engine that crashes, traps mid-command or does not answer within the request timeout is retired: that command fails with the reason, and the next one starts a new engine with an **empty drawing** (checkpoints stay valid — `restore` loads them into the new engine). `use_session(engine="wasm"|"auto")` health-checks a running engine and replaces it if it does not answer; a healthy one is kept together with its drawing (`clear` empties it).

---

## Sharing: one session, several participants

A session can have more than one participant: the agent, the user at an app, a colleague on another machine, another agent. They share **one engine and one model**; every change of one is sent to the others as it happens. The protocol is the session sharing of a ClassCAD server (invites, guests, presence, every command's frames fanned out; `SessionSharing.md` in the ClassCAD sources specifies it, `WSClient` of `@buerli.io/classcad` is the client). Who owns the session depends on where the engine runs, and the MCP takes part in all three:

| The engine runs … | The session is hosted by | The others join |
| --- | --- | --- |
| in the MCP (local WASM) | the MCP: `src/share/hub.ts` is the session layer of a server for its own engine | with the session's invite on `ws://127.0.0.1:9098/session/?invite=…` — the app's link does that |
| on a ClassCAD worker | the server | with a server invite on the worker's URL; an MCP session's app is passed through to it, so its link is the same |
| in the page of an app (`WASMClient`) | the app (`session/host.ts` in `@buerli.io/classcad`) | where the MCP introduces them: the page offers its invite on `ws://127.0.0.1:9098/session/?host=…`, guests join with `?invite=…`, and the listener joins the two |

A colleague, or the user on another device, joins a session the MCP hosts through the share relay: see [Somebody elsewhere joins](#somebody-elsewhere-joins).

### The agent hosts, the user joins

The default: every session's app docks into it (see [The app](#the-app)); `view` returns the link.

### Somebody elsewhere joins

A link on `127.0.0.1` is good on the user's machine and nowhere else. So a session is offered on the **share relay** as well, and where the relay holds it, the app comes up under that link instead — one link (`App: https://<relay>/?invite=…`), which the user opens and can send to a colleague or open on a tablet:

```
view()               → the app's link: the share link, or the one on 127.0.0.1 while the relay does not hold the session
view(local=true)     → the link on 127.0.0.1, whatever the relay does
share()              → the share link again
share(stop=true)     → the share link stops working, whoever has the app open under it is disconnected
```

**It cannot break the session.** The relay is asked while the first script runs. One that has turned the offer down by the time the model is there is not waited for; one that has not answered gets 6 s more. Either way the first model then comes with the link on `127.0.0.1` — no error. Should the relay go away later and take the user's app with it, the next result offers the app again, on this machine; and an agent that sees the share link not loading calls `view` with `local: true`. The offer itself is made again in the background until the relay takes it. `CLASSCAD_SHARE=ask` keeps the app on `127.0.0.1` and shares a session only when the user asks (`share` then returns a second link), `off` never.

Whoever opens the share link gets the same app, docked into the same session: they see the model as the agent builds it, and can turn, select and edit it. The session stays where it is. The MCP offers it on the **share relay** ([`packages/relay`](../relay), a Cloudflare Worker) the way a page offers a session of its own on the listener — a standing connection that says "this invite is mine", and one more connection per guest — only that it dials out to do so (`src/share/relay.ts`). Nothing listens for the outside, and nothing but Node is needed on the machine; it works behind NAT and firewalls.

- **An invite of its own.** The share link carries another invite than the link on `127.0.0.1`, and the listener there does not take it. Taking it back (`share` with `stop`) disconnects everyone who came in with it — the user too, if their app is open under it; the link on `127.0.0.1` is untouched. Sharing again gives a new one.
- **The user's app goes through the relay too** when it is open under the share link: every frame makes the round trip to Cloudflare. `CLASSCAD_SHARE=ask` keeps it on the machine.
- **Whoever has the link is in**, like the user at the app (the `view` role is advisory, see `src/share/protocol.ts`). The agent hands it to the user only.
- **What the relay sees.** It takes an offer only from a signed-in machine (the Firebase ID token of the sign-in, checked against Google's keys), passes the frames between host and guest, and keeps none. It also serves the app to the guest — the build this package carries, deployed with the relay.
- **When the connection drops** (a sleeping laptop, another network) the MCP offers the invite again by itself, and the link keeps working. `session_info` shows the link under `shared` (null while the relay does not hold it), and the guests among `peers`.
- **Limits.** 16 guests per session; one frame is at most 32 MiB (Cloudflare's limit — a very large model's complete graphic may not fit).

`CLASSCAD_RELAY_URL` names another relay than the built-in one; `off` leaves sessions on their machine: no `share` tool, and the agent is not told of any.

### The user hosts, the agent joins

In the app open *Sessions → Create* and hand the link to the agent:

```
use_session(url="https://app.example/?invite=…")     # the link of the app, wherever its engine runs
use_session(url="wss://cad.example/?invite=…")       # or a server's URL directly
```

The MCP joins that session as a guest and works in the app's model; the app shows every change. Whose engine it is, the link does not say: an invite that an app on this machine offers is joined here, any other is applied to the worker (`CLASSCAD_WS_URL`). An app with the engine in its page must stay open, and must run on this machine. `session_info` reports the session and who is in it; `use_session()` without arguments returns to a session of the agent's own. A second agent joins the first one's session the same way, with the link `view` gave the first.

**Named session** (`ClassCAD-Session-Id` model, worker only): `use_session(sessionId="test-session")`.

### What the browser has to allow

The app in this package is served from `127.0.0.1` and joins its session on the same address: nothing to allow. An app that is served from somewhere else and has to reach this machine's listener (`ws://127.0.0.1:9098/session`) is a different case: a page with the engine in it that offers its session, a second page that joins such a session, or an app named by `CLASSCAD_APP_URL`. Browsers treat a public page that connects to `127.0.0.1` as local network access: Chromium-based browsers ask the user for permission (or deny it where nobody can be asked, as in an embedded browser pane), and without it the page never finds the MCP. An app served from `localhost` (a dev server) is not affected, and neither is an app whose session runs on a ClassCAD server.

### What participants see of each other

Besides the model, participants publish a little about themselves, as *presence* — small frames a session relays to everyone in it and keeps for those who join later. The buerli packages define the channels (`session/selection.ts`, `session/identity.ts` in `@buerli.io/classcad`; `session/sessionClient.ts` in `@buerli.io/react-cad`), the MCP speaks them (`src/share/protocol.ts`), and they work the same in all three kinds of session:

| Channel | Who | What |
| --- | --- | --- |
| `client` | everyone | Who the participant is: `{ app, version, name, kind: 'app' \| 'agent' }`. `session_info` lists the others. |
| `selection` | apps | What is selected, whenever it changes: `{ items: [{ kind, objectId, prodRefId, containerId, graphicId, type, name }], total }`. `get_selection` reads it. |
| `select` | the agent | A request to select `items` (by `graphicId` or `objectId`); `set_selection` sends it and reports what the app has selected afterwards. |
| `config` | the host | What a session offers its guests, for a host that offers less than everything: `{ saveFormats: ['STP', 'STL'] }`. Apps hide what is not offered. The MCP's own sessions keep nothing back and publish none. |
| `view`, `cursor` | apps | The cameras and pointers the apps show of each other. |

A selected face, edge or vertex carries its `graphicId`: the id API calls take for it (e.g. `v1.sketch.create({ planeId })`), valid for the model as it is now. An app shares its selection by calling `syncSelection(client)`.

### Emission model

On a worker the engine keeps an emission config **per connection** (`GetEmissionConfig`/`SetEmissionConfig`). The MCP leaves its connection at the engine defaults, so an app sharing the session keeps receiving structure and graphic for everything the model does. While a `run_script` runs, payloads are switched off for that script only (results only — a 100-command script is 100 small replies) and restored afterwards; the MCP pulls once after every script so the app and its own caches converge. `api.tree()` / `api.graphic()` inside a script pull on demand and are cached until the next mutation.

The local engine always generates everything a command changed. A session the MCP hosts therefore sends every participant every change as it happens, each in the form its own connection asked for (streamed frames for an app, results only for an agent's script); nobody's emission config starves the others.

---

## Development

```bash
npm install                      # monorepo root
npm run build                    # skill → script → renderer → mcp (+ buerli-ai)
cd packages/mcp
npm run build:app                # the app: Buerligons, built from ../buerli-modeler/packages/buerligons (BUERLIGONS_DIR) → app/
npm run build                    # tsc, app/ → dist/app/; postbuild runs the contract tests (emission, daemon, sign-in, sharing, the relay)
npm test                         # + the live tests: the local WASM engine, and a worker on CLASSCAD_WS_URL if one runs
node dist/server.js              # the stdio shim by hand (starts/uses the daemon)
CLASSCAD_MCP_DAEMON=1 node dist/daemon.js   # the daemon in the foreground, logging to stderr
CLASSCAD_SHARE_DEBUG=1 …                    # … with every command a docked app sends: how long it waited, how long it ran
npm run dev -w @classcad/relay              # the share relay on http://127.0.0.1:8787, with the app build:app made (no Cloudflare account needed) …
CLASSCAD_RELAY_URL=http://127.0.0.1:8787 …  # … and sessions shared on it
npm test -w @classcad/relay                 # the relay's contract, in wrangler's local runtime
```

The tests open no browser (`CLASSCAD_VIEWER_NO_BROWSER=1`, `CLASSCAD_AUTH_NO_BROWSER=1`) and sign in against a stand-in (`test/fake-auth.mjs`: `CLASSCAD_AUTH_TOKEN_URL`, `CLASSCAD_AUTH_PROJECT`, `CLASSCAD_AUTH_API_KEY`).

Source map: `src/server.ts` (stdio shim: find/start daemon, proxy, in-process fallback), `src/daemon.ts` (HTTP endpoint, sessions, idle exit), `src/mcp-server.ts` (the MCP server: tools wired to one engine client — what a session is), `src/client.ts` (engine client: WebSocket to a worker, or the local engine), `src/share/` (sharing: `hub.ts` the session layer for the local engine, `server.ts` the listener for the app and for sessions, `relay.ts` the session offered on the share relay, `session.ts` who is there, what they point at and the links, `protocol.ts`), `src/engine/wasm.ts` + `wasm-worker.ts` (the local WASM engine: asset download, worker thread, origin/XHR shims), `src/tools/`, `src/queue.ts` (per-session tool queue). `test/daemon.mjs` is the daemon contract: two shims → one daemon with two independent sessions, idle exit, foreign-port fallback. `test/share.mjs` is the sharing contract, without an engine: a guest is served like a server serves it (streamed and bundled), presence, what only a host may do, a page-hosted session joined through the listener, and a session offered on the relay (the listener stands in for it; `packages/relay` tests the relay itself). `test/wasm-live.mjs` (part of `npm test`; downloads the assets on first run) covers the local engine: policy `wasm`, `auto` fallback with a dead worker, `drogon` without fallback, switching with `use_session`, engine errors surfacing through `run_script`, replacing a crashed, hung or wedged engine, and sharing: an app docked into the MCP's engine (changes and selection both ways) and a second agent joining the first one's session.

### Publishing

Releases run in GitHub Actions ([release.yml](../../.github/workflows/release.yml)), without tokens or 2FA prompts:

0. The app has to be in `packages/mcp/app/` when the release is built: `npm run build:app` builds the current Buerligons into it (`app/SOURCE.txt` names what it was built from). The workflow cannot build it (it has no checkout of the buerli repositories), and `release-check` stops a release that would go out without the app.
1. Bump the MCP's version everywhere it is named: `package.json`, `VERSION` in `src/mcp-server.ts`, `server.json` (`version` and `packages[0].version`), and the Claude plugin (`plugins/classcad/.claude-plugin/plugin.json` and `PACKAGE` in `plugins/classcad/launch.mjs`). The plugin is installed from this repository's `master` and runs the package version it pins: its README and its skill describe that version, so what a release changes for the user goes into them with this step, not before. Bump `@classcad/skill`, `script` or `renderer` too if they changed.
2. `node scripts/release-check.mjs mcp-vX.Y.Z` (from the repo root) checks that the versions agree and lists what is new on npm.
3. Commit, push, then `git tag mcp-vX.Y.Z && git push origin mcp-vX.Y.Z`.

The workflow builds and tests the tag, publishes every `@classcad` package whose version is not on npm yet (skill, script, renderer, mcp, in that order) through npm's trusted publishing with provenance, and publishes `server.json` to the official MCP Registry as `io.github.awv-informatik/classcad` (logged in by the workflow's GitHub OIDC identity).

One-time setup, per package on npmjs.com: Settings → Trusted publishing → GitHub Actions, organization `awv-informatik`, repository `classcad-ai`, workflow `release.yml`.

A patch to a released line is made on its release branch (`release/mcp-0.2` for 0.2.x), tagged there and merged into `master` afterwards; `master` is pushed only once npm has the version, since the plugin installed from it pins that version.

The share relay is not part of a release: it is deployed on its own (`npm run deploy -w @classcad/relay`, see [its README](../relay)), and serves guests the app this package carries. Deploy it again after a release that changes the app.

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
