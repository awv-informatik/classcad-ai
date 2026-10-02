// tools/share.ts — the session's company, wired into its tools.
//
// Every session can be shared (share/session.ts): the CAD app docks into it
// with a link, and whoever is in it shows what they have selected.
// attachShare() patches registerTool (like serializeTools and requireSignIn)
// so that the first model of a session brings the app up — and says so, once:
// in the user's browser, or in the host's own browser pane where it has one
// (then the agent opens it; see Show in share/session.ts). The tools: `view`
// (the link), `get_selection` / `set_selection` (pointing, both ways).

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { Client } from '../client.js'
import { hostName } from '../auth.js'
import { enqueue } from '../queue.js'
import { openShare, type Offer, type PeerSelection, type Share, type Show } from '../share/session.js'
import type { Peer } from '../share/protocol.js'
import type { ViewerSession } from '../viewer/server.js'

/** Tools after which the model, or the engine under it, may be another one. */
const CHANGES_MODEL = new Set(['run_script', 'clear', 'load', 'restore', 'use_session'])

/** Where an agent opens a page itself. Named for the host that has one, so the agent knows which tool is meant. */
const OWN_PANE = 'your own browser pane, beside the conversation — in the Claude desktop app with `preview_start`, the Browser pane tool, and its `url` set to this link'

/** How the app reaches the user, as the agent is told from the first turn on: it depends on the host (Show in share/session.ts). */
const REACH: Record<Show, string> = {
  host:
    'SHOWING IT IS YOUR JOB HERE: your host has a browser pane of its own, and the app belongs there — not in the user\'s other browser. The result of the first script that makes a model ends with "App: <link>". Open that link in your browser pane right then, before your next step: in the Claude desktop app with `preview_start`, the Browser pane tool, and its `url` set to the link. Open it ONCE — the pane stays live and follows every change, so never open or reload it after later scripts. Then tell the user in a few words that the model is in the browser pane; the link need not be in your answer. Only if you have no browser pane tool: call `view` with open: true, which opens the user\'s default browser, and say so. ',
  browser:
    'With the first model it opens by itself in the user\'s default browser, where there is one: the result of that script ends with "App: <link>" and says whether it did. Tell the user ONCE that the app is there, with the link on its own line. ',
  off: 'The result of the first script that makes a model ends with "App: <link>": give the user that link ONCE, on its own line. ',
}

/** The part of the server instructions about the app, written for the way this session's app reaches the user. */
export const appNote = (show: Show): string =>
  'APP: every session has a live CAD app (Buerligons), docked into this session\'s engine. It shows every change as it happens, and the user can work in it too — turn the model, select, measure, edit sketches and features, export. ' +
  REACH[show] +
  'Do NOT repeat the link unasked in later answers: it is said once per session. When the user asks where the model is, wants to see it again or asks for the link, call `view`: it knows whether they still have the app open, brings it up again if not, and returns the link. ' +
  'The user and you work on the SAME model: what they change in the app is in the tree you read next, so read it again (api.tree(), `tree`) instead of trusting ids from before their turn. ' +
  'When the user points instead of naming ("this face", "the selected edges", "here"), call `get_selection`; `set_selection` highlights something for them.'

/** How a participant is named to the agent. */
const peerLabel = (peer: Peer): string => {
  const who = peer.identity?.name || peer.inviteName || ''
  const app = peer.identity?.app
  return [app, who && who !== app ? `(${who})` : ''].filter(Boolean).join(' ') || 'a participant'
}

/** What the agent is told when the app is offered: once per session. */
const offerText = (offer: Offer): string => {
  if (offer.how === 'host')
    return (
      `App: ${offer.url}\n` +
      `This session's CAD app shows this model live, and the user can work in it — but the user does not see it yet. Open this link now, before your next step, in ${OWN_PANE}. ` +
      'Once is enough: the pane follows every change by itself. Then tell the user in a few words that the model is in the browser pane. ' +
      'No browser pane tool? Call `view` with open: true instead: it opens the user\'s default browser. This is said once: later results do not repeat the link.'
    )
  if (offer.how === 'opened')
    return (
      `App: ${offer.url}\n` +
      'This session\'s CAD app has just been opened in the user\'s browser, with this model in it; it shows every change live, and the user can work in it. ' +
      'Tell the user so once, with the link on its own line. This is said once: later results do not repeat the link, `view` returns it again.'
    )
  return (
    `App: ${offer.url}\n` +
    'This session\'s CAD app shows this model live, and the user can work in it. Tell the user once that they can open the model there, with this link on its own line. This is said once: later results do not repeat it, `view` returns it again.'
  )
}

/**
 * Opens the session's sharing and wires it into the tools registered after it:
 * a tool that may have changed the model offers the app with the first model
 * (once), and the sharing ends when the engine client is closed.
 */
export async function attachShare(server: McpServer, client: Client, version: string, show: Show, log?: (msg: string) => void): Promise<Share> {
  const mode = process.env.CLASSCAD_VIEWER
  const share = await openShare({
    client,
    queue: work => enqueue(server, work),
    app: mode !== 'off' && mode !== 'readonly',
    show,
    identity: () => {
      const host = server.server.getClientVersion()?.name
      return { app: 'classcad-mcp', version, kind: 'agent', ...(host ? { name: hostName(host) } : {}) }
    },
    log,
  })

  const original = (server.registerTool as (...args: any[]) => any).bind(server)
  ;(server as any).registerTool = (name: string, config: unknown, handler: (...args: any[]) => any) => {
    if (!CHANGES_MODEL.has(name)) return original(name, config, handler)
    const watched = async (...args: any[]) => {
      const result = await handler(...args)
      // With the first model the app is offered, once. (Also where the script failed halfway: what it made is there to look at.)
      const offer = await share.touch().catch(err => (log?.(`share: ${(err as Error)?.message ?? err}`), null))
      if (offer && result && Array.isArray(result.content)) result.content.push({ type: 'text', text: offerText(offer) })
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
        ? 'The live CAD app of this session (Buerligons), docked into the same engine: returns its link and says how to bring it up. The app shows every change as it happens, and the user can work in it — turn and zoom, select, measure, edit sketches and features, export STEP or STL. Call it when the user asks to see, turn or edit the model, or asks for the link. If the user already has it open, nothing is opened. Otherwise it is opened in the user\'s default browser — or, when your host has a browser pane of its own, you are told to open the link there. open: false only returns the link; open: true opens the user\'s default browser whatever the host.'
        : 'The live 3D view of this session\'s model: returns its link and brings it up in the user\'s browser. The view follows every change, turns and zooms, has light and dark, and lets the user download STEP, STL or glTF. Call it when the user wants to see or turn the model; hand them the link as a clickable link on its own line. open: false only returns the link.',
      inputSchema: {
        open: z.boolean().optional().describe('true: open the user\'s default browser now. false: only return the link. Default: bring it up where it belongs, unless the user already has it open.'),
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
      if (!share.url) {
        const opened = open === false ? false : viewer!.open()
        return { content: [{ type: 'text' as const, text: `3D view of this session: ${url}\n${opened ? 'It has been opened in the user\'s browser.' : 'Give the user this link to open it.'} It follows the model live.` }] }
      }
      // An app that is docked is an app somebody has open: one more tab would be one more guest, not a better look.
      const docked = share.docked()
      // The link is in this answer: the first model need not offer it again.
      share.offered()
      let state: string
      if (open === true) state = share.open() ? 'It has been opened in the user\'s default browser.' : 'There is no browser to open here: give the user this link.'
      else if (open === false) state = 'Nothing was opened: give the user this link.'
      else if (docked > 0) state = 'The user already has it open: nothing was opened.'
      else if (share.show === 'host') state = `The user does not see it yet: open this link now in ${OWN_PANE}. No browser pane tool? Call \`view\` with open: true: it opens the user's default browser.`
      else if (share.show === 'browser' && share.open()) state = 'It has been opened in the user\'s default browser.'
      else state = 'Give the user this link to open it.'
      return { content: [{ type: 'text' as const, text: `App of this session: ${url}\n${state} It shows the model live, and the user can work in it.` }] }
    },
  )
}

/** `get_selection` / `set_selection`: pointing between the user at an app and the agent, both ways. */
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
