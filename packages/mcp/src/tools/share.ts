// tools/share.ts — the session's company, wired into its tools.
//
// Every session can be shared (share/session.ts): the CAD app docks into it
// with a link, and whoever is in it shows what they have selected.
// attachShare() patches registerTool (like serializeTools and requireSignIn)
// so that results which show a model carry the app's link, and so that the
// first model of a session brings the app up. The tools: `view` (the link),
// `get_selection` / `set_selection` (pointing, both ways).

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { Client } from '../client.js'
import { hostName } from '../auth.js'
import { enqueue } from '../queue.js'
import { openShare, type PeerSelection, type Share } from '../share/session.js'
import type { Peer } from '../share/protocol.js'
import type { ViewerSession } from '../viewer/server.js'

/** Tools after which the model, or the engine under it, may be another one. */
const CHANGES_MODEL = new Set(['run_script', 'clear', 'load', 'restore', 'use_session'])
/** Results that show or change a model end with the link of the app. */
const OFFERS_LINK = new Set(['run_script', 'snapshot', 'load', 'restore'])

export const APP_NOTE =
  'APP: every session has a live CAD app (Buerligons) in the user\'s browser, docked into this session\'s engine. It opens by itself with the first model and shows every change as it happens; the user can work in it too — turn the model, select, measure, edit sketches and features, export. ' +
  'Results carry its link ("App: …"): give the user that link, as a clickable link on its own line, when you present a model — once, and again when they ask to see it. `view` returns the link and brings the app up. ' +
  'The user and you work on the SAME model: what they change in the app is in the tree you read next, so read it again (api.tree(), `tree`) instead of trusting ids from before their turn. ' +
  'When the user points instead of naming ("this face", "the selected edges", "here"), call `get_selection`; `set_selection` highlights something for them.'

/** How a participant is named to the agent. */
const peerLabel = (peer: Peer): string => {
  const who = peer.identity?.name || peer.inviteName || ''
  const app = peer.identity?.app
  return [app, who && who !== app ? `(${who})` : ''].filter(Boolean).join(' ') || 'a participant'
}

export async function attachShare(server: McpServer, client: Client, version: string, log?: (msg: string) => void): Promise<Share> {
  const mode = process.env.CLASSCAD_VIEWER
  const share = await openShare({
    client,
    queue: work => enqueue(server, work),
    app: mode !== 'off' && mode !== 'readonly',
    identity: () => {
      const host = server.server.getClientVersion()?.name
      return { app: 'classcad-mcp', version, kind: 'agent', ...(host ? { name: hostName(host) } : {}) }
    },
    log,
  })

  const original = (server.registerTool as (...args: any[]) => any).bind(server)
  ;(server as any).registerTool = (name: string, config: unknown, handler: (...args: any[]) => any) => {
    if (!CHANGES_MODEL.has(name) && !OFFERS_LINK.has(name)) return original(name, config, handler)
    const watched = async (...args: any[]) => {
      const result = await handler(...args)
      if (CHANGES_MODEL.has(name)) await share.touch().catch(err => log?.(`share: ${(err as Error)?.message ?? err}`))
      if (share.url && share.hosting && OFFERS_LINK.has(name) && result && !result.isError && Array.isArray(result.content)) {
        result.content.push({ type: 'text', text: `App (live, the user can work in it; opens in their browser): ${share.url}` })
      }
      return result
    }
    return original(name, config, watched)
  }

  // The company ends with the session.
  const close = client.close.bind(client)
  ;(client as { close: () => void }).close = () => {
    share.close()
    close()
  }
  return share
}

/** `view`: the app docked into this session — or, where this build has none, the read-only 3D view. */
export function registerViewTool(server: McpServer, share: Share, viewer: ViewerSession | null): void {
  const app = share.url !== null
  server.registerTool(
    'view',
    {
      title: app ? 'Open the app' : 'Open the 3D view',
      description: app
        ? 'The live CAD app of this session (Buerligons), docked into the same engine: returns its link and brings it up in the user\'s browser. The app shows every change as it happens, and the user can work in it — turn and zoom, select, measure, edit sketches and features, export STEP or STL. Call it when the user wants to see, turn or edit the model; hand them the link as a clickable link on its own line. open: false only returns the link.'
        : 'The live 3D view of this session\'s model: returns its link and brings it up in the user\'s browser. The view follows every change, turns and zooms, has light and dark, and lets the user download STEP, STL or glTF. Call it when the user wants to see or turn the model; hand them the link as a clickable link on its own line. open: false only returns the link.',
      inputSchema: {
        open: z.boolean().optional().describe('Bring it up in the browser (default true).'),
      },
    },
    async ({ open }) => {
      // A guest in an app's session: the app is the view, and the user has it open.
      if (!share.hosting) {
        const others = share.peers().map(peerLabel)
        return {
          content: [{
            type: 'text' as const,
            text: `This session belongs to an app the user already has open${others.length ? ` (${others.join(', ')})` : ''}: what you build shows up there as it happens. There is nothing else to open.`,
          }],
        }
      }
      const url = share.url ?? viewer?.url
      if (!url) return { isError: true, content: [{ type: 'text' as const, text: 'There is no view in this MCP (CLASSCAD_VIEWER=off, or its local listener could not start).' }] }
      const opened = open === false ? false : share.url ? share.open() : viewer!.open()
      const what = share.url ? 'App of this session' : '3D view of this session'
      const docked = share.url ? share.peers().length : 0
      return {
        content: [{
          type: 'text' as const,
          text:
            `${what}: ${url}\n${opened ? 'It has been opened in the user\'s browser.' : 'Give the user this link to open it.'} It follows the model live.` +
            (share.url ? ` The user can work in it; ${docked ? `${docked} already docked.` : 'nobody is docked yet.'}` : ''),
        }],
      }
    },
  )
}

export function registerSelectionTools(server: McpServer, client: Client, share: Share): void {
  /** What the others have selected, with the tree's word on each object. */
  const describe = async (selections: PeerSelection[]) => {
    let tree: Record<string, any> = {}
    try {
      tree = (await client.getTree()) as Record<string, any>
    } catch {
      /* the ids alone still say what was picked */
    }
    return selections.map(s => ({
      who: peerLabel(s.peer),
      total: s.total,
      ...(s.total > s.items.length ? { shown: s.items.length } : {}),
      items: s.items.map(item => {
        const node = tree[String(item.objectId)]
        return node ? { ...item, object: { class: node.class, name: node.name } } : item
      }),
    }))
  }
  const nobody = () => ({
    isError: true,
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        ok: false,
        error: 'Nobody is docked into this session.',
        hint: share.url
          ? 'Call `view` to bring the app up for the user, let them select, then ask again.'
          : 'An app shares its selection once it is in the same session: join the app\'s session with use_session and its invite link.',
      }),
    }],
  })

  server.registerTool(
    'get_selection',
    {
      title: 'What the user selected',
      description:
        'What the user has selected in the app docked into this session: faces, edges and vertices of a body, or objects of the model tree (sketch entities, dimensions, features). Call it when the user points at something instead of naming it ("this face", "the selected edges", "here"). ' +
        'Each item has `kind` (face | edge | vertex | object) and `objectId` — the tree object: the picked object itself, or the solid a picked face, edge or vertex belongs to (`object` names its class). Geometry also has `graphicId`, the id API calls take for that face, edge or vertex (e.g. v1.sketch.create({ planeId })), its `type` (plane, cylinder, line, arc, …), `containerId` and `prodRefId`. ' +
        'Geometry ids describe the model as it is now: a feature that rebuilds the body gives its faces and edges new ids. Read the selection right before you use it.',
      inputSchema: {},
    },
    async () => {
      if (!share.peers().length) return nobody()
      const selections = await describe(share.selections())
      if (!selections.length) return { content: [{ type: 'text', text: JSON.stringify({ ok: true, count: 0, selections: [], note: 'Somebody is docked, but shares no selection.' }) }] }
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, count: selections.reduce((n, s) => n + s.total, 0), selections }) }] }
    },
  )

  server.registerTool(
    'set_selection',
    {
      title: 'Select something for the user',
      description:
        'Selects things in the app docked into this session, so the user sees what you mean: faces, edges or vertices by their `graphicId` (from getGeometryIds, pick results or get_selection), tree objects by their `objectId`. The app highlights them. Returns what is selected there afterwards. ' +
        'Geometry ids must be current ones (see get_selection); pass `prodRefId` from a previous get_selection when the part is an instance in an assembly. An empty `items` clears the selection.',
      inputSchema: {
        items: z
          .array(
            z.object({
              graphicId: z.number().optional().describe('A face, edge or vertex: its element id.'),
              objectId: z.number().optional().describe('A tree object (sketch entity, dimension, feature) — or, with graphicId, the solid that owns the element.'),
              containerId: z.number().optional().describe('The body\'s graphic container, when known (the app finds it otherwise).'),
              prodRefId: z.number().optional().describe('The assembly instance, when the part is one (from get_selection).'),
            }),
          )
          .describe('What to select.'),
        replace: z.boolean().optional().describe('Replace the current selection (default) or add to it (false).'),
      },
    },
    async ({ items, replace }) => {
      if (!share.peers().length) return nobody()
      const selections = await describe(await share.select(items, replace !== false))
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, requested: items.length, selections }) }] }
    },
  )
}
