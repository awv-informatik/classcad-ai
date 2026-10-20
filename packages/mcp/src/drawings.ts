// drawings.ts — one MCP connection, many drawings.
//
// A host may send many conversations through ONE connection: the Claude
// desktop chat app and Cowork start one process per configured server and
// pass every conversation's tool calls through it (Cursor and VS Code run one
// per window), and nothing in a request says which conversation it comes
// from. One drawing per connection is then one drawing for all of them, and
// one conversation's clear or load is another one's lost model.
//
// So the drawing is named in the call itself. Every tool that works on a
// model takes `drawing`: "new" opens one and the answer names its id, and the
// conversation passes that id from then on. Each drawing is a complete MCP
// session of its own (createMcpServer: its engine, tool queue, checkpoints and
// app link), linked to the router in memory. The ids are random and only the
// conversation that opened a drawing is told its id, so no other one reaches
// it. A call without a drawing, or with one this connection does not know,
// changes nothing.

import { randomBytes } from 'node:crypto'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { CallToolRequestSchema, ListToolsRequestSchema, type CallToolResult, type Tool } from '@modelcontextprotocol/sdk/types.js'
import { createMcpServer, VERSION, type McpServerOptions } from './mcp-server.js'
import type { Client } from './client.js'

/** Tools of the machine, not of a model: docs, sign-in, account. They take no drawing. */
export const MACHINE_TOOLS = new Set(['docs', 'list_methods', 'describe_method', 'login', 'account'])
/** Tools that answer for the MCP as a whole when no drawing is named. */
const DRAWING_OPTIONAL = new Set(['session_info'])

/** The `drawing` value that opens a new drawing. */
export const NEW_DRAWING = 'new'
/** How long the router waits for one call of a drawing: the host gives up first, and cancels. */
const CALL_TIMEOUT_MS = 60 * 60_000
/**
 * A local engine costs hundreds of MB (the first ~850, every further one
 * ~350). A drawing nobody asked anything for this long gives its engine up
 * (Client.suspend: the drawing waits as OFB, the next call brings it back
 * under the same ids), and at most this many stay awake per connection, the
 * least recently used going first.
 */
const IDLE_MS = Number(process.env.CLASSCAD_DRAWING_IDLE_MS) || 10 * 60_000
const AWAKE_MAX = Number(process.env.CLASSCAD_DRAWINGS_AWAKE) || 3

export const DRAWING_PARAM =
  'The drawing this call works on. "new" opens a new, empty drawing, and the answer names its id; from then on pass that id ' +
  '(e.g. "d-k3v9q2xa") in every call of this conversation about that model. A drawing belongs to the conversation that opened it: ' +
  'no other conversation can see or change it.'

export const DRAWINGS_NOTE =
  'DRAWINGS: every tool that works on a model takes `drawing`. The first call of a model passes "new"; its answer names the drawing\'s id ("d-…"). ' +
  'Pass that id in every further call of this conversation about that model: run_script, tree, snapshot, save, view and all the others. ' +
  'A drawing belongs to the conversation that opened it: no other conversation reaches it, and none can reach yours. ' +
  'A second, unrelated model is a second drawing ("new" again). A subagent works on your model only with its id: hand it over in the task. ' +
  'Drawings live as long as this MCP; to keep a model beyond that, save it (OFB keeps its features).'

const opened = (id: string) =>
  `Drawing "${id}" is new and belongs to this conversation. Pass drawing: "${id}" in every further call about this model; "new" again only for another, separate model (it starts empty).`
const unknown = (named: string) =>
  `No drawing "${named}" here; nothing was done. Pass the id an earlier answer of this conversation named. ` +
  'Drawings end with the MCP (the app restarted, or the MCP did), and one opened in another conversation is out of reach. "new" opens a new, empty drawing.'
const missing = (tool: string) =>
  `\`${tool}\` works on a drawing: pass drawing: "<id>" with the id an earlier answer of this conversation named, or "new" for a new, empty one. Nothing was done.`

const refuse = (text: string): CallToolResult => ({ isError: true, content: [{ type: 'text', text }] })
/** 8 characters of base 32: ids nobody guesses or makes up by chance. */
const newId = () => `d-${[...randomBytes(8)].map(b => 'abcdefghijkmnpqrstuvwxyz23456789'[b & 31]).join('')}`

/** One linked MCP session: the drawing's (or the machine tools'). */
type Linked = {
  client: McpClient
  engine: Client
  close: () => Promise<void>
  /** Calls under way. */
  busy: number
  /** A suspend under way: calls wait for it. */
  settling: Promise<unknown> | null
}

export type Router = {
  /** The server the host's transport connects to. */
  server: Server
  /** Ends every drawing of this connection. */
  close: () => Promise<void>
  /** Drawings open on this connection. */
  readonly drawings: number
  /** Of those, the ones with a local engine running. */
  readonly awake: number
}

/** The MCP for one host connection: the machine tools, and the drawings its conversations open. */
export async function createRouter(opts: McpServerOptions): Promise<Router> {
  const log = opts.log ?? (() => {})
  // The machine tools, the tool list and the instructions come from a session that never opens a drawing.
  const lobby = await createMcpServer(opts)
  const server = new Server(
    { name: 'classcad', version: VERSION },
    { capabilities: { tools: {} }, instructions: `${DRAWINGS_NOTE}\n\n${lobby.instructions}` },
  )
  const drawings = new Map<string, Linked>()
  let closed = false

  // Linked once the host said who it is: the sessions answer as for the host itself (getClientVersion).
  const link = async (session: Awaited<ReturnType<typeof createMcpServer>>): Promise<Linked> => {
    const [forClient, forServer] = InMemoryTransport.createLinkedPair()
    await session.server.connect(forServer)
    const client = new McpClient(server.getClientVersion() ?? { name: 'classcad-router', version: VERSION })
    await client.connect(forClient)
    return {
      client,
      engine: session.client,
      close: async () => {
        await client.close().catch(() => {})
        session.client.close()
      },
      busy: 0,
      settling: null,
    }
  }

  const isAwake = (d: Linked) => d.engine.transport === 'wasm' && d.engine.localEngine !== null
  const sleep = (id: string, d: Linked, why: string) => {
    if (d.busy > 0 || d.settling || !isAwake(d)) return
    d.settling = d.engine
      .suspend()
      .then(done => done && log(`drawing ${id} put to sleep (${why})`), err => log(`drawing ${id} stays awake: ${err instanceof Error ? err.message : err}`))
      .finally(() => (d.settling = null))
  }
  /** Too many engines awake: the least recently used idle ones sleep. */
  const settle = () => {
    const awake = [...drawings].filter(([, d]) => isAwake(d)).sort(([, a], [, b]) => a.engine.lastUse - b.engine.lastUse)
    for (const [id, d] of awake.slice(0, Math.max(0, awake.length - AWAKE_MAX))) sleep(id, d, `more than ${AWAKE_MAX} awake`)
  }
  const sweep = setInterval(() => {
    const now = Date.now()
    for (const [id, d] of drawings) if (now - d.engine.lastUse > IDLE_MS) sleep(id, d, `idle ${Math.round((now - d.engine.lastUse) / 60_000)} min`)
  }, Math.min(60_000, Math.max(1000, IDLE_MS / 4))).unref()
  let machine: Promise<Linked> | null = null
  const machineTools = () => (machine ??= link(lobby))

  const open = async (): Promise<{ id: string; linked: Linked }> => {
    if (closed) throw new Error('the MCP session is closing')
    let id = newId()
    while (drawings.has(id)) id = newId()
    const linked = await link(await createMcpServer({ ...opts, drawing: id, log: msg => log(`[${id}] ${msg}`) }))
    drawings.set(id, linked)
    log(`drawing ${id} opened; ${drawings.size} on this connection`)
    return { id, linked }
  }

  const forward = async (linked: Linked, name: string, args: Record<string, unknown>, extra: any): Promise<CallToolResult> => {
    const token = extra?._meta?.progressToken
    linked.busy++
    try {
      await linked.settling
      return (await linked.client.callTool({ name, arguments: args }, undefined, {
        signal: extra?.signal,
        timeout: CALL_TIMEOUT_MS,
        ...(token !== undefined
          ? { onprogress: (p: Record<string, unknown>) => void extra.sendNotification({ method: 'notifications/progress', params: { ...p, progressToken: token } }).catch(() => {}) }
          : {}),
      })) as CallToolResult
    } finally {
      linked.busy--
      settle()
    }
  }

  let tools: Tool[] | null = null
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    tools ??= (await (await machineTools()).client.listTools()).tools.map(tool => {
      if (MACHINE_TOOLS.has(tool.name)) return tool
      const schema = tool.inputSchema
      const required = DRAWING_OPTIONAL.has(tool.name) ? schema.required : ['drawing', ...(schema.required ?? [])]
      return {
        ...tool,
        inputSchema: {
          ...schema,
          // First, so it is the first thing a call names.
          properties: { drawing: { type: 'string', description: DRAWING_PARAM }, ...(schema.properties ?? {}) },
          ...(required?.length ? { required } : {}),
        },
      }
    })
    return { tools }
  })

  server.setRequestHandler(CallToolRequestSchema, async (req, extra) => {
    const { name, arguments: given = {} } = req.params
    if (MACHINE_TOOLS.has(name)) return forward(await machineTools(), name, given, extra)
    const { drawing: named, ...args } = given as Record<string, unknown>
    if (named === undefined || named === null || named === '') {
      return DRAWING_OPTIONAL.has(name) ? forward(await machineTools(), name, args, extra) : refuse(missing(name))
    }
    if (typeof named !== 'string') return refuse(missing(name))
    const id = named.trim()
    if (id.toLowerCase() === NEW_DRAWING) {
      const d = await open()
      const res = await forward(d.linked, name, args, extra)
      // After the tool's own answer, which readers take from the first block.
      return { ...res, content: [...(res.content ?? []), { type: 'text', text: opened(d.id) }] }
    }
    const linked = drawings.get(id)
    return linked ? forward(linked, name, args, extra) : refuse(unknown(id))
  })

  return {
    server,
    close: async () => {
      if (closed) return
      closed = true
      clearInterval(sweep)
      const all = [...drawings.values()]
      drawings.clear()
      await Promise.all([...all.map(d => d.close()), machine ? machine.then(m => m.close(), () => {}) : lobby.client.close()])
    },
    get drawings() {
      return drawings.size
    },
    get awake() {
      return [...drawings.values()].filter(isAwake).length
    },
  }
}
