// run_script — execute model-written JavaScript against the CAD session.
//
// Powered by @classcad/script — the SAME script medium as the ClassCAD MCP and
// the training harness. Scripts that use the guaranteed surface (api.v1.*,
// api.tree(), api.graphic(), api.env) run unchanged in all of them; the
// browser additionally injects buerli's facade/structure/selection namespaces
// (see ./session.ts).
//
// Trust boundary: the script runs with exactly the capabilities the model
// already has through call_api — it adds compute, not reach. Global shadowing
// in the executor is defense-in-depth, not a security sandbox.

import { runScript } from '@classcad/script'
import type { MethodRegistry } from '@classcad/script'
import type { ToolExecutorContext, ToolResult } from '../types'
import { getMethodRegistry } from './registry'
import { browserSession } from './session'

export async function runScriptHandler(
  input: Record<string, unknown>,
  ctx: ToolExecutorContext,
): Promise<ToolResult> {
  const { script, timeoutMs } = input as { script?: string; timeoutMs?: number }
  if (!script || typeof script !== 'string') {
    return { error: 'run_script expects a "script" string containing JavaScript code.' }
  }

  const res = await runScript(script, browserSession(ctx.drawingId), {
    registry: (getMethodRegistry() ?? undefined) as MethodRegistry | undefined,
    timeoutMs,
  })

  if (!res.ok) {
    const logTail = res.logs.length ? `\nConsole output before the error:\n${res.logs.slice(-20).join('\n')}` : ''
    return { error: `${res.error}${logTail}` }
  }
  return { result: { returned: res.returned, logs: res.logs } }
}
