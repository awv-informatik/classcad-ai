// queue.ts — one tool call at a time.
//
// Every MCP tool of this server shares ONE engine connection and ONE
// drawing. The MCP SDK dispatches tool calls concurrently, and hosts do issue
// them in parallel (Claude Code sends independent tool calls of one turn at
// once; subagents spawned by a session talk to the SAME server process and
// therefore the same drawing). Without serialization a `snapshot` issued next
// to a `run_script` renders whatever the drawing looked like when its GetTree
// happened to run - possibly before the script created anything - and two
// scripts interleave their commands on one connection.
//
// So tool executions are queued: each call starts after the previous one
// settled (resolved OR rejected - a failed call never blocks the queue).
// Pure lookups that never touch the engine (docs, method index) are exempt
// and keep answering immediately.
//
// Subagents: they share this process and this queue with their parent. A
// parent's tool call issued while a subagent runs a long script simply waits
// for it - it would have to anyway, since both act on the same drawing. No
// tool waits on ANOTHER tool's completion inside its own handler, so the
// queue cannot deadlock. Separate Claude sessions run separate MCP processes
// and are unaffected.

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

/** Tools that only read package data (no engine access) and stay unqueued. */
const busyChecks = new WeakMap<McpServer, () => boolean>()
export function setDrawingBusy(server: McpServer, check: () => boolean): void { busyChecks.set(server, check) }

export const UNQUEUED_TOOLS = new Set(['list_methods', 'describe_method', 'docs', 'session_info'])

/**
 * Patches `server.registerTool` so every handler registered afterwards runs
 * through the shared queue (except the tools in `exclude`). Call it once,
 * before the first registerTool call.
 */
export function serializeTools(server: McpServer, exclude: Set<string> = UNQUEUED_TOOLS): void {
  // The tail of the chain: resolves when the most recently queued call settled.
  let tail: Promise<unknown> = Promise.resolve()
  const original = (server.registerTool as (...args: any[]) => any).bind(server)
  ;(server as any).registerTool = (name: string, config: unknown, handler: (...args: any[]) => any) => {
    if (exclude.has(name)) return original(name, config, handler)
    const queued = (...args: any[]) => {
      const run = tail.then(() => busyChecks.get(server)?.()
        ? { isError: true, content: [{ type: 'text', text: 'Session busy: timed-out work is unresolved. Wait before changing or inspecting the drawing.' }] }
        : handler(...args))
      // Whatever happens to this call, the next one may start afterwards.
      tail = run.then(
        () => undefined,
        () => undefined,
      )
      return run
    }
    return original(name, config, queued)
  }
}
