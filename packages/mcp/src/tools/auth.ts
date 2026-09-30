// tools/auth.ts — the sign-in gate and the `login` tool.
//
// requireSignIn() patches registerTool (like serializeTools) so every tool
// registered afterwards first checks the machine's sign-in. Not signed in,
// the call starts a sign-in and answers with its link instead of running;
// the agent shows the link and calls `login`, which returns the moment the
// browser hands the sign-in back.

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { authStatus, beginLogin, logout, pendingLogin, waitForLogin } from '../auth.js'

/** Tools that work without a sign-in: the sign-in itself, status, and the public docs. */
export const OPEN_TOOLS = new Set(['login', 'session_info', 'list_methods', 'describe_method', 'docs'])

/** How long one `login` call waits (under Codex's 60 s default tool timeout). */
const WAIT_MS = 50_000

export const SIGN_IN_NOTE =
  'SIGN-IN: the ClassCAD MCP needs a free classcad.ch account, once per machine. When a tool answers "Sign-in required", show the user the link it gives (as a clickable link, on its own line), then call `login` — it waits and returns as soon as they have signed in; then repeat the call. Docs tools work without a sign-in.'

const clientName = (server: McpServer) => server.server.getClientVersion()?.name

function linkText(url: string): string {
  return (
    'Sign-in required: the ClassCAD MCP works with a free classcad.ch account (Google, GitHub or email; one click if they already have one).\n\n' +
    `Show the user this link, as a clickable link on its own line, and ask them to sign in:\n\n${url}\n\n` +
    'Then call the `login` tool: it waits and returns as soon as the sign-in has arrived. After that, repeat the call that needed it.'
  )
}

/** Wraps every tool registered after this call, except OPEN_TOOLS, in the sign-in check. */
export function requireSignIn(server: McpServer, open: Set<string> = OPEN_TOOLS): void {
  const original = (server.registerTool as (...args: any[]) => any).bind(server)
  ;(server as any).registerTool = (name: string, config: unknown, handler: (...args: any[]) => any) => {
    if (open.has(name)) return original(name, config, handler)
    const gated = async (...args: any[]) => {
      const status = await authStatus()
      if (status.signedIn) return handler(...args)
      const { url } = await beginLogin(clientName(server))
      return { isError: true, content: [{ type: 'text', text: (status.reason === 'not signed in' ? '' : `(${status.reason}.) `) + linkText(url) }] }
    }
    return original(name, config, gated)
  }
}

export function registerAuthTool(server: McpServer): void {
  server.registerTool(
    'login',
    {
      title: 'Sign in to ClassCAD',
      description:
        'Sign this machine in to ClassCAD (a free classcad.ch account; Google, GitHub or email). Not signed in: the first call returns a link — show it to the user as a clickable link — and the next call WAITS (up to ~50 s per call) until they have signed in in the browser, then returns their account. Call again while it reports "still waiting". Already signed in: returns the account at once. logout: true signs the machine out.',
      inputSchema: {
        logout: z.boolean().optional().describe('Sign this machine out instead.'),
      },
    },
    async ({ logout: out }) => {
      const text = (t: string) => ({ content: [{ type: 'text' as const, text: t }] })
      if (out) return text(logout() ? 'Signed out. The next ClassCAD call asks for a new sign-in.' : 'Was not signed in.')
      const status = await authStatus()
      if (status.signedIn) return text(`Signed in as ${status.account.email ?? status.account.name ?? status.account.uid}.`)
      const waiting = pendingLogin()
      if (!waiting) return text(linkText((await beginLogin(clientName(server))).url))
      const account = await waitForLogin(WAIT_MS)
      if (account) return text(`Signed in as ${account.email ?? account.name ?? account.uid}. Repeat the call that needed it.`)
      const still = pendingLogin()
      if (!still) return text(linkText((await beginLogin(clientName(server))).url))
      return text(`Still waiting for the user to sign in at:\n\n${still.url}\n\nCall \`login\` again to keep waiting.`)
    },
  )
}
