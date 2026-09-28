// run_script — execute model-written JavaScript against the CAD session.
//
// Powered by @classcad/script — the SAME script medium as the ClassCAD MCP and
// headless Node. Scripts that use the guaranteed surface (api.v1.*,
// api.tree(), api.graphic(), api.env) run unchanged in all of them; the
// browser additionally injects buerli's facade/structure/selection namespaces
// (see ./session.ts).
//
// Trust boundary: the script runs with exactly the capabilities the model
// already has through call_api — it adds compute, not reach. Global shadowing
// in the executor is defense-in-depth, not a security sandbox.

import { runScript, isSessionBusy } from '@classcad/script'
import type { MethodRegistry } from '@classcad/script'
import type { ToolDiag, ToolExecutorContext, ToolResult } from '../types'
import { getMethodRegistry } from './registry'
import { browserSession, refreshAfterScript, withEmissionConfig, SUPPRESS_GRAPHICS } from './session'
import { ELIDED_SCRIPT_MARKER } from '../context/render'

export async function runScriptHandler(
  input: Record<string, unknown>,
  ctx: ToolExecutorContext,
): Promise<ToolResult> {
  const { script, timeoutMs } = input as { script?: string; timeoutMs?: number }
  if (!script || typeof script !== 'string') {
    return { error: 'run_script expects a "script" string containing JavaScript code.' }
  }
  // Old script sources are elided from the context to save room; the placeholder is
  // not a script. Refuse it clearly instead of "succeeding" with a comment.
  if (script.trimStart().startsWith(ELIDED_SCRIPT_MARKER)) {
    return { error: 'That is a placeholder for a script whose source was removed from context, not a script. Write the script again.' }
  }

  // The script runs under its own CONNECTION config (every graphic category
  // off — the engine skips graphic serialization per response, the WASM's main
  // cost); withEmissionConfig restores the app's config afterwards, also when
  // the script throws. The viewport is refreshed once afterwards.
  const session = browserSession(ctx.drawingId, { suppressGraphics: true })
  session.withRunScope = run => withEmissionConfig(ctx.drawingId, SUPPRESS_GRAPHICS, run)
  // Which engine operations the script ran — host-side only (ToolResult.diag): it
  // tells the context manager whether the drawing changed and feeds the step digest.
  const ops: NonNullable<ToolDiag['ops']> = []
  const res = await runScript(script, session, {
      strict: true,
      onOperation: (event) => {
        if (event.phase === 'end') ops.push({ method: event.method, failed: (event.maxLevel ?? 0) >= 51 })
        else if (event.phase === 'error') ops.push({ method: event.method, failed: true })
      },
      registry: (getMethodRegistry() ?? undefined) as MethodRegistry | undefined,
      // The browser/WASM engine is much slower per call than a native worker —
      // default to 180s so one substantial script fits (the executor caps at 300s).
      timeoutMs: timeoutMs ?? 180_000,
    })

  // One pull instead of per-call graphic pushes: with the app's config restored,
  // fetchTree (GetTree) brings the full structure AND graphic into the store in
  // a single round trip. No recalc: every command already regenerated its own
  // feature, and recalc would destroy entity-injection bodies (v1.solid.*).
  // Callers that need a re-tessellation (snapshot's adaptive faceting) ask for
  // it explicitly.
  if (!isSessionBusy(session)) await refreshAfterScript(ctx.drawingId)

  const diag: ToolDiag = { ops, pending: (res as { pending?: boolean }).pending === true, durationMs: (res as { durationMs?: number }).durationMs }
  if (!res.ok) {
    const logTail = res.logs.length ? `\nConsole output before the error:\n${res.logs.slice(-20).join('\n')}` : ''
    return { error: `${res.error}${logTail}`, diag }
  }
  return { result: { returned: res.returned, logs: res.logs }, diag }
}
