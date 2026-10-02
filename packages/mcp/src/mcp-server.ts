// mcp-server.ts — one ClassCAD MCP server instance: an engine client plus
// every tool, wired the same way whether the instance serves a stdio host
// directly or one HTTP session of the daemon. The daemon creates one of these
// per MCP session, so every Claude tab has its own engine connection,
// emission config and tool queue.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { connect, type Client, type EnginePolicy } from './client.js'
import { DEFAULT_WASM_ORIGIN, DEFAULT_WASM_VERSION, defaultWasmDir, type LocalWasmOptions } from './engine/wasm.js'
import { registerLifecycleTools } from './tools/lifecycle.js'
import { registerStateTools } from './tools/state.js'
import { DAEMON_NOTE, registerDocsTools, serverInstructions } from './tools/docs.js'
import { registerSnapshotTool } from './tools/snapshot.js'
import { registerScriptTool } from './tools/script.js'
import { serializeTools } from './queue.js'
import { registerAuthTool, requireSignIn, SIGN_IN_NOTE } from './tools/auth.js'
import { authStatus } from './auth.js'
import { attachViewer, VIEWER_NOTE } from './tools/viewer.js'
import { appNote, attachShare, registerSelectionTools, registerViewTool } from './tools/share.js'
import { appAvailable, joinedHere, listen as listenForApps, waitForPage, SESSION_PATH } from './share/server.js'
import { showFromEnv, type Show } from './share/session.js'

export const VERSION = '0.2.0'

/** True for the address sessions are joined on on this machine (share/server.ts): an app's own engine, or another agent's. */
const hostedOnThisMachine = (url: string): boolean => {
  try {
    return new URL(url).pathname.replace(/\/+$/, '') === SESSION_PATH
  } catch {
    return false
  }
}
export const DEFAULT_WS_URL = 'ws://0.0.0.0:9094/'

export type McpServerOptions = {
  /** ClassCAD worker this instance connects to (lazily, on the first tool call). */
  wsUrl: string
  /** Engine policy when nothing else decides: 'auto' (worker, else local WASM), 'drogon', 'wasm'. Default 'auto'. */
  engine?: EnginePolicy
  /** Local WASM engine settings (key, origin, …); null = not available. */
  wasm?: LocalWasmOptions | null
  /** How the session's app reaches the user (share/session.ts). Default: what this process's environment says. */
  show?: Show
  /** Where the instance reports engine decisions. */
  log?: (msg: string) => void
}

/** Builds a connected-ready MCP server: the engine client plus all tools. Nothing is opened yet. */
export async function createMcpServer(opts: McpServerOptions): Promise<{ server: McpServer; client: Client }> {
  // Build the client without opening the WS. The first tool call that needs
  // the worker will open it — either use_session (with a named session) or
  // any geometry tool (with no session header). This keeps the MCP passive
  // at startup so it never creates a stray ephemeral session.
  const client = await connect(opts.wsUrl, { graphics: true, engine: opts.engine, wasm: opts.wasm, log: opts.log })
  // What the session shows the user: the app docked into it, where this build
  // carries the app; the read-only 3D view otherwise.
  const viewMode = process.env.CLASSCAD_VIEWER
  const withApp = (appAvailable() || !!process.env.CLASSCAD_APP_URL) && viewMode !== 'off' && viewMode !== 'readonly'
  // How the app reaches the user: the agent is told from the first turn on, and again with the first model.
  const show = opts.show ?? showFromEnv()

  const server = new McpServer(
    {
      name: 'classcad',
      version: VERSION,
    },
    // The initialize-handshake instructions carry the full v1 method index —
    // hosts surface them to the agent, so it knows every method from turn one.
    { instructions: `${SIGN_IN_NOTE}\n\n${withApp ? appNote(show) : VIEWER_NOTE}\n\n${serverInstructions()}` },
  )

  // One tool call at a time: every tool below shares this client's single
  // engine connection and drawing (see queue.ts for the reasoning, incl.
  // subagents). Must run before the first registerTool.
  serializeTools(server)
  // Every tool but the sign-in, status and docs needs a signed-in machine.
  // Registered after the queue patch, so the check runs before queueing.
  requireSignIn(server)
  registerAuthTool(server)
  // The session's company: the app docked into it, whoever else is in it, and
  // what they have selected. Patched in last, so it sits innermost: it hears
  // of a change inside the queue, after the tool that made it.
  const share = await attachShare(server, client, VERSION, show, opts.log)
  const viewer = share.url ? null : await attachViewer(server, client, opts.log)
  registerViewTool(server, share, viewer)
  registerSelectionTools(server, client, share)

  server.registerTool(
    'session_info',
    {
      title: 'Session info',
      description: 'Return ClassCAD MCP session status: the link of the app docked into this session (app) or of the read-only 3D view (viewer), who else is in the session (peers), sign-in (auth), transport (ws = ClassCAD worker, wasm = the MCP\'s own local engine), engine policy, whether a local WASM engine is available, WS URL, current session id, the invite this session joined with (shareToken), connection state, package version. ' + DAEMON_NOTE,
      inputSchema: {},
    },
    async () => {
      const local = client.localEngine
      const auth = await authStatus()
      const info = {
        app: share.url,
        viewer: viewer?.url ?? null,
        peers: share.peers().map(p => ({ app: p.identity?.app ?? null, name: p.identity?.name ?? p.inviteName ?? null, kind: p.identity?.kind ?? null, role: p.role ?? null })),
        auth: auth.signedIn ? { signedIn: true, email: auth.account.email, ...(auth.offline ? { offline: true } : {}) } : { signedIn: false, reason: auth.reason },
        transport: client.transport,
        enginePolicy: client.engine,
        wsUrl: client.transport === 'ws' ? client.url : null,
        sessionId: client.sessionId,
        shareToken: client.shareToken,
        connected: client.connected,
        wasm: {
          available: client.wasmAvailable,
          running: local !== null,
          version: local?.version ?? opts.wasm?.version ?? DEFAULT_WASM_VERSION,
          origin: local?.origin ?? opts.wasm?.origin ?? DEFAULT_WASM_ORIGIN,
          dir: local?.dir ?? opts.wasm?.dir ?? defaultWasmDir(opts.wasm?.version ?? DEFAULT_WASM_VERSION),
          memoryMB: local?.memoryMB ?? null,
        },
        version: VERSION,
      }
      return { content: [{ type: 'text', text: JSON.stringify(info) }] }
    },
  )

  server.registerTool(
    'use_session',
    {
      title: 'Switch session',
      description:
        'Call this BEFORE any other classcad tool when the user names a session or hands you a session/token URL — the MCP opens its engine link lazily, so the first tool call decides which session is used. Modes: (1) sessionId — attaches to a named ClassCAD session (ClassCAD-Session-Id header) on the configured worker; empty/omitted = fresh worker-assigned session. (2) url — a ws(s):// URL from a multi-client server, typically carrying an invite token (wss://host/?invite=…); connected VERBATIM. (3) an http(s):// APP SHARE LINK from a buerli app\'s Session Management (…?invite=…): the MCP joins the app\'s session as a guest, wherever its engine runs — on a ClassCAD server (the token is applied to the configured worker URL) or in the app\'s own page (WASM; the app must stay open, on this machine). Without a url the MCP runs its own session — and the user\'s app docks into THAT with the link `view` returns. (4) engine — WHICH ENGINE runs that own session: "drogon" = the configured ClassCAD worker (server), "wasm" = the MCP\'s OWN local engine (the published WASM build hosted in this process, no server and no browser needed; requires a configured key), "auto" (default) = the worker if reachable, otherwise the local engine. Use "drogon" when the user says to connect to their (Drogon/ClassCAD) server, "wasm" when they say WASM/local/offline; a token or URL always decides by itself. Reconnecting clears cached structure/graphic state — the next tool call repopulates it.',
      inputSchema: {
        sessionId: z.string().optional()
          .describe('Target session id (named-session model, worker only). Empty string or omitted = no header (worker-assigned session).'),
        url: z.string().optional()
          .describe('ws(s):// URL to connect to VERBATIM — e.g. a multi-client token/invite URL (wss://host/?invite=…). An http(s):// app share link with ?invite= is accepted too: the invite token is extracted and applied to the configured worker URL. Takes precedence over sessionId.'),
        engine: z.enum(['auto', 'drogon', 'wasm']).optional()
          .describe('Engine for the MCP\'s own session when no url is given: auto (worker, else local WASM), drogon (the ClassCAD worker only), wasm (the local engine only). Sticks for the session until changed.'),
      },
    },
    async ({ sessionId, url, engine }) => {
      const target = sessionId && sessionId.length > 0 ? sessionId : null
      try {
        let wsUrl = url && url.length > 0 ? url : null
        let joined = false
        // App share links (http/https) point at the WEB APP, not the CAD
        // server — carry over only the invite token onto the worker base URL.
        if (wsUrl && /^https?:\/\//i.test(wsUrl)) {
          const params = new URL(wsUrl).searchParams
          // Links of apps that run the engine in their own page (older buerli builds): there is no session to join.
          if (params.get('bridge')) {
            throw new Error(
              'This link is of an app that runs ClassCAD in its own page; such an engine cannot be joined. ' +
              'Work the other way round: build in this MCP session and let the user open its app with `view` — it docks into this session.',
            )
          }
          const invite = params.get('invite')
          if (!invite) {
            throw new Error(
              `"${wsUrl}" is an http(s) app link without an ?invite= token. ` +
              'Pass the ws(s):// URL of the ClassCAD server (optionally with ?invite=…), or an app share link that carries ?invite=.',
            )
          }
          // Whose session the invite is for, the link does not say. An app that
          // runs the engine in its own page offers its invites on this machine's
          // listener, and so does every MCP session; any other invite is a
          // ClassCAD server's.
          const local = async () => `ws://127.0.0.1:${(await listenForApps()).port}${SESSION_PATH}/?invite=${encodeURIComponent(invite)}`
          if (joinedHere(invite)) wsUrl = await local()
          else {
            const base = client.baseUrl.replace(/\/+$/, '')
            try {
              await client.reconnectUrl(`${base}/?invite=${encodeURIComponent(invite)}`)
              wsUrl = null
              joined = true
            } catch (err) {
              // Not the server's: a page may be about to offer it (it finds a restarted MCP within seconds).
              if (!(await waitForPage(invite, 8_000))) {
                throw new Error(
                  `Nobody shares a session under this invite: the ClassCAD server at ${base} refused it (${err instanceof Error ? err.message : err}), ` +
                    'and no app on this machine offers it. Is the app still open, and is the invite still there in its session panel?',
                )
              }
              wsUrl = await local()
            }
          }
        }
        if (joined) {
          /* already in the server's session */
        } else if (wsUrl) await client.reconnectUrl(wsUrl)
        else await client.reconnect(target, engine)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
          isError: true,
          content: [{ type: 'text', text: JSON.stringify({ ok: false, error: msg }) }],
        }
      }
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            ok: true,
            transport: client.transport,
            engine: client.transport === 'wasm' ? 'wasm (local, in this process)' : hostedOnThisMachine(client.url) ? 'the engine of the app that shared the session (it must stay open)' : 'drogon (ClassCAD worker)',
            sessionId: client.sessionId,
            wsUrl: client.transport === 'ws' ? client.url : null,
          }),
        }],
      }
    },
  )

  registerLifecycleTools(server, client)
  registerStateTools(server, client)
  registerDocsTools(server)
  registerSnapshotTool(server, client)
  registerScriptTool(server, client)

  return { server, client }
}
