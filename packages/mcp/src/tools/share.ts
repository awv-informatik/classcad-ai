// tools/share.ts — the session's company, wired into its tools.
//
// Every session can be shared (share/session.ts): the CAD app docks into it
// with a link, and whoever is in it shows what they have selected.
// attachShare() patches registerTool (like serializeTools and requireSignIn)
// so that the first model of a session brings the app up — and says so, once:
// in the user's browser, or in the host's own browser pane where it has one
// (then the agent opens it; see Show in share/session.ts). The tools: `view`
// (the link), `share` (a link for everybody else, where a relay is there to
// share on), `get_selection` / `set_selection` (pointing, both ways).

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { Client } from '../client.js'
import { hostName } from '../auth.js'
import { enqueue } from '../queue.js'
import { openShare, type Offer, type PeerSelection, type Share, type Sharing, type Show } from '../share/session.js'
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

/** What the agent is told about the link for everybody else, from the first turn on. */
const SHARE_NOTE: Record<Sharing, string> = {
  ask:
    'The app\'s link works on this machine only. When the user wants somebody else to see or work on the model — another person, or themselves on another device — call `share`: it returns a link that works from anywhere. Only when they ask: that link lets everyone who has it into the session. ',
  always:
    'ONE LINK: where the share service is reachable, the app\'s link is a share link (https://…): the same link you open is the one the user can send to somebody else, or open on another device — say so ONCE, when you tell them about the app, and that everyone who has it is let into the session. A link on 127.0.0.1 instead means the share service was not reachable: then the app works on this machine only, which you need not explain. If the share link does not load in the browser or stays without the model, do not retry it: call `view` with local: true and open the link it returns — the app on this machine, which needs no service. `share` with stop: true takes the share link back. ',
  off: '',
}

/** The part of the server instructions about the app, written for the way this session's app reaches the user and for how it is shared. */
export const appNote = (show: Show, sharing: Sharing = 'off'): string =>
  'APP: every session has a live CAD app (Buerligons), docked into this session\'s engine. It shows every change as it happens, and the user can work in it too — turn the model, select, measure, edit sketches and features, export. ' +
  REACH[show] +
  'Do NOT repeat the link unasked in later answers: it is said once per session. When the user asks where the model is, wants to see it again or asks for the link, call `view`: it knows whether they still have the app open, brings it up again if not, and returns the link. ' +
  SHARE_NOTE[sharing] +
  'The user and you work on the SAME model: what they change in the app is in the tree you read next, so read it again (api.tree(), `tree`) instead of trusting ids from before their turn. ' +
  'When the user points instead of naming ("this face", "the selected edges", "here"), call `get_selection`; `set_selection` highlights something for them.'

/** How a participant is named to the agent. */
const peerLabel = (peer: Peer): string => {
  const who = peer.identity?.name || peer.inviteName || ''
  const app = peer.identity?.app
  return [app, who && who !== app ? `(${who})` : ''].filter(Boolean).join(' ') || 'a participant'
}

/** What the agent is told of a link that works from anywhere. */
const SHARED_WITH =
  'It works from anywhere, and everyone who has it is in this session like the user at the app: they see the model live and can change it. Give it to the user, on its own line, when they want to show the model to somebody else or open it on another device — and to nobody but the user. `share` with stop: true takes it back.'

/** What the agent is told when the app's link is the share link. */
const ONE_LINK =
  'This link is a share link: it works from anywhere. Give it to the user once, on its own line, and tell them that they can send it to others or open it on another device, and that everyone who has it is in this session and can change the model. ' +
  'Should it not load, or stay without the model: call `view` with local: true and open the link it returns instead (the app on this machine).'

/** What the agent is told when the share link the app was offered under stopped working. */
const FALLBACK = 'The share link this session\'s app was opened under does not work any more (the share service cannot be reached), and nobody is left in the app. This link is the app on this machine: it needs no service. '

/** What the agent is told when the app is offered: once per session (and once more, should its share link stop working). */
const offerText = (offer: Offer): string => (offer.fallback ? FALLBACK : '') + appText(offer) + (offer.shared ? `\n${ONE_LINK}` : '')

const appText = (offer: Offer): string => {
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
export async function attachShare(server: McpServer, client: Client, version: string, show: Show, sharing: Sharing, log?: (msg: string) => void): Promise<Share> {
  const mode = process.env.CLASSCAD_VIEWER
  const share = await openShare({
    client,
    queue: work => enqueue(server, work),
    app: mode !== 'off' && mode !== 'readonly',
    show,
    sharing,
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
      // Where every session is shared, the relay is asked while the tool runs: its link is there when the model is.
      share.warm()
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
        ? 'The live CAD app of this session (Buerligons), docked into the same engine: returns its link and says how to bring it up. Where the session is shared from the start the link is its share link (it works from anywhere); local: true returns the link that works on this machine only instead — for when the share link does not load. The app shows every change as it happens, and the user can work in it — turn and zoom, select, measure, edit sketches and features, export STEP or STL. Call it when the user asks to see, turn or edit the model, or asks for the link. If the user already has it open, nothing is opened. Otherwise it is opened in the user\'s default browser — or, when your host has a browser pane of its own, you are told to open the link there. open: false only returns the link; open: true opens the user\'s default browser whatever the host.'
        : 'The live 3D view of this session\'s model: returns its link and brings it up in the user\'s browser. The view follows every change, turns and zooms, has light and dark, and lets the user download STEP, STL or glTF. Call it when the user wants to see or turn the model; hand them the link as a clickable link on its own line. open: false only returns the link.',
      inputSchema: {
        open: z.boolean().optional().describe('true: open the user\'s default browser now. false: only return the link. Default: bring it up where it belongs, unless the user already has it open.'),
        local: z.boolean().optional().describe('Return the link of the app on this machine (127.0.0.1), which needs no share service: use it when the share link does not load.'),
      },
    },
    async ({ open, local }) => {
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
      const url = (local ? share.url : share.appUrl) ?? share.url ?? viewer?.url
      if (!url) return { isError: true, content: [{ type: 'text' as const, text: 'There is no view in this MCP (CLASSCAD_VIEWER=off, or its local listener could not start).' }] }
      if (!share.url) {
        const opened = open === false ? false : viewer!.open()
        return { content: [{ type: 'text' as const, text: `3D view of this session: ${url}\n${opened ? 'It has been opened in the user\'s browser.' : 'Give the user this link to open it.'} It follows the model live.` }] }
      }
      // An app that is docked is an app somebody has open: one more tab would be one more guest, not a better look.
      // (Asked for the link of this machine, the one they have does not work for them.)
      const docked = local ? 0 : share.docked()
      // The link is in this answer: the first model need not offer it again.
      share.offered(url)
      let state: string
      if (open === true) state = share.open(url) ? 'It has been opened in the user\'s default browser.' : 'There is no browser to open here: give the user this link.'
      else if (open === false) state = 'Nothing was opened: give the user this link.'
      else if (docked > 0) state = 'The user already has it open: nothing was opened.'
      else if (share.show === 'host') state = `The user does not see it yet: open this link now in ${OWN_PANE}. No browser pane tool? Call \`view\` with open: true: it opens the user's default browser.`
      else if (share.show === 'browser' && share.open(url)) state = 'It has been opened in the user\'s default browser.'
      else state = 'Give the user this link to open it.'
      // Which link it is: the one that works from anywhere, the one of this machine, or both where they differ.
      const isShared = url === share.sharedUrl
      const reach = isShared
        ? ' This link is the session\'s share link: it works from anywhere, and everyone who has it is in the session.'
        : share.sharedUrl
          ? `\nShared with others at: ${share.sharedUrl}`
          : share.sharing === 'always'
            ? ' This link works on this machine only: the session is not shared right now (`share` shares it).'
            : ''
      return { content: [{ type: 'text' as const, text: `App of this session: ${url}\n${state} It shows the model live, and the user can work in it.${reach}` }] }
    },
  )
}

/** `share`: a link to this session that works beyond this machine, and taking it back. */
export function registerShareTool(server: McpServer, share: Share): void {
  if (share.sharing === 'off') return
  server.registerTool(
    'share',
    {
      title: 'Share the session',
      description:
        'A link to this session\'s app that works from ANYWHERE: for another person, or for the user on another device (the link `view` returns works on this machine only). Whoever opens it is in this session like the user at the app — they see the model live as you build it, and can turn, select and edit it. ' +
        'Call it when the user asks to share, send or show the model to somebody, or to open it somewhere else. Not on your own: the link lets EVERYONE who has it into the session, so it is a secret between the user and whom they send it to — hand it to the user, as a clickable link on its own line, and put it nowhere else. ' +
        'The session stays on this machine; guests reach it through the ClassCAD share relay, which passes the data on and keeps none of it. The link works until the session ends or sharing is stopped. When the share service cannot be reached, nothing fails: you are told so, the app keeps working on this machine, and the session is shared as soon as the service is back. stop: true takes it back: it stops working and whoever joined with it is disconnected. Sharing again afterwards gives a new link.',
      inputSchema: {
        stop: z.boolean().optional().describe('Stop sharing: the link stops working and its guests are disconnected.'),
      },
    },
    async ({ stop }) => {
      const text = (t: string, isError = false) => ({ ...(isError ? { isError: true } : {}), content: [{ type: 'text' as const, text: t }] })
      if (stop) {
        const stopped = share.unpublish()
        if (!stopped) return text('The session was not shared.')
        const gone = stopped.kicked ? `, and ${stopped.kicked} app${stopped.kicked === 1 ? ' that was open under it was' : 's that were open under it were'} disconnected` : ''
        // Where the share link is the app's link, the user had the app open under it too.
        const after = share.sharing === 'always' ? ' The user\'s own app was one of them if it was open under that link: call `view` for the link of the app on this machine.' : ' The user\'s own app stays docked.'
        return text(`The session is not shared any more: the link stopped working${gone}.${after}`)
      }
      try {
        const known = share.sharedUrl !== null
        const link = await share.publish()
        if (link.live) return text(`Share link: ${link.url}\n${known ? (share.sharing === 'always' ? 'This is the link the app is open under: one link for the user and for everybody else. ' : 'The session is shared already: this is its link. ') : ''}${SHARED_WITH}`)
        // No relay is not an error: the session works, on this machine, and is shared as soon as the relay takes it.
        return text(
          `The session is not shared right now: the share service does not take it (${link.problem}). Nothing is wrong with the session itself` +
            (share.url ? ` — its app works on this machine: ${share.url}` : '') +
            '. It is offered again by itself until that works: call `share` again in a moment for the link.',
        )
      } catch (err) {
        return text((err as Error)?.message ?? String(err), true)
      }
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
        'A selection keeps the ids it was made with: after a feature rebuilds the body, its `containerId` and `objectId` name the old, consumed body (faces and edges the feature did not touch keep their `graphicId`; a recalc renumbers them all). Read the selection right before you use it.',
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
              containerId: z.number().optional().describe('The body\'s current graphic container (the part\'s `solids`). Pass it after a rebuild: without it the app takes the first container holding the graphicId, which can be the old, consumed body\'s.'),
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
