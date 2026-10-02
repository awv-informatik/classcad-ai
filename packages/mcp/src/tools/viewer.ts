// tools/viewer.ts — the session's live 3D view, wired into its tools.
//
// Every session has a view of its own (viewer/server.ts): a link that shows
// the model in 3D and follows it. attachViewer() patches registerTool (like
// serializeTools and requireSignIn) so that after a tool that may have changed
// the model the view is told, and so that results which show a model carry
// the link. The first model of a session opens the view in the browser.

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { Client } from '../client.js'
import { hostName } from '../auth.js'
import { enqueue } from '../queue.js'
import { openViewerSession, type ViewerSession } from '../viewer/server.js'

/** Tools after which the model may be another one. */
const CHANGES_MODEL = new Set(['run_script', 'clear', 'load', 'restore', 'use_session'])
/** Results that show or change a model: the first of them ends with the link of the view. */
const OFFERS_LINK = new Set(['run_script', 'snapshot', 'load', 'restore'])

export const VIEWER_NOTE =
  '3D VIEW: every session has a live 3D view in the user\'s browser. It opens by itself with the first model and follows every change. The first result that shows a model carries its link ("3D view: …"): give the user that link once, as a clickable link on its own line, and do NOT repeat it in later answers. `view` returns the link again and brings the view up; it also offers STEP, STL and glTF downloads to the user.'

const engineLabel = (client: Client): string => {
  if (client.transport === 'wasm') return 'WebAssembly · this machine'
  try {
    return `worker · ${new URL(client.url).host}`
  } catch {
    return 'worker'
  }
}

export async function attachViewer(server: McpServer, client: Client, log?: (msg: string) => void): Promise<ViewerSession | null> {
  if (process.env.CLASSCAD_VIEWER === 'off') return null
  let viewer: ViewerSession
  try {
    viewer = await openViewerSession({
      // Read in the session's tool queue, never in the middle of a script. An
      // engine nobody used is not started for a look at an empty stage.
      load: () =>
        enqueue(server, async () => {
          if (!client.connected && !client.localEngine) return null
          const tree = (await client.getTree()) as Record<string, any>
          const graphic = (await client.getGraphic()) as { containers?: any[] } | null
          return { tree, graphic }
        }),
      exportModel: format =>
        enqueue(server, async () => {
          const args: Record<string, unknown> = { format, encoding: 'base64' }
          if (format === 'STP') args.stp = { version: 2 }
          if (format === 'STL') args.stl = { binary: true, facetingTol: 0.05, angleTol: 6 }
          const r = await client.execute<{ content?: string }>({ 'v1.common.save': [args] })
          if (!r.result?.content) throw new Error(`the engine returned no ${format} data`)
          return Buffer.from(r.result.content, 'base64')
        }),
      host: () => {
        const name = server.server.getClientVersion()?.name
        return name ? hostName(name) : undefined
      },
      engine: () => engineLabel(client),
      log,
    })
  } catch (err) {
    // No view is no reason to have no MCP.
    log?.(`3D viewer not available: ${(err as Error)?.message ?? err}`)
    return null
  }

  // The link is said once per session. Said with every result, an agent repeats it in every answer.
  let offered = false
  const original = (server.registerTool as (...args: any[]) => any).bind(server)
  ;(server as any).registerTool = (name: string, config: unknown, handler: (...args: any[]) => any) => {
    if (!CHANGES_MODEL.has(name) && !OFFERS_LINK.has(name)) return original(name, config, handler)
    const watched = async (...args: any[]) => {
      const result = await handler(...args)
      if (CHANGES_MODEL.has(name)) viewer.touch()
      if (!offered && OFFERS_LINK.has(name) && result && !result.isError && Array.isArray(result.content)) {
        offered = true
        result.content.push({ type: 'text', text: `3D view (live, opens in the user's browser): ${viewer.url}\nThis is said once: later results do not repeat the link, \`view\` returns it again.` })
      }
      return result
    }
    return original(name, config, watched)
  }

  // The view ends with its session.
  const close = client.close.bind(client)
  ;(client as { close: () => void }).close = () => {
    viewer.close()
    close()
  }
  return viewer
}

export function registerViewerTool(server: McpServer, viewer: ViewerSession | null): void {
  server.registerTool(
    'view',
    {
      title: 'Open the 3D view',
      description:
        'The live 3D view of this session\'s model: returns its link and brings it up in the user\'s browser. The view follows every change, turns and zooms, has light and dark, and lets the user download STEP, STL or glTF. Call it when the user wants to see or turn the model; hand them the link as a clickable link on its own line. open: false only returns the link.',
      inputSchema: {
        open: z.boolean().optional().describe('Bring the view up in the browser (default true).'),
      },
    },
    async ({ open }) => {
      if (!viewer) return { isError: true, content: [{ type: 'text' as const, text: 'The 3D view is not available in this MCP (CLASSCAD_VIEWER=off, or its local listener could not start).' }] }
      const opened = open === false ? false : viewer.open()
      return {
        content: [{
          type: 'text' as const,
          text: `3D view of this session: ${viewer.url}\n${opened ? 'It has been opened in the user\'s browser.' : 'Give the user this link to open it.'} It follows the model live.`,
        }],
      }
    },
  )
}
