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
import { browserSession, refreshAfterScript, withEmissionConfig, SUPPRESS_GRAPHICS } from './session'

export async function runScriptHandler(
  input: Record<string, unknown>,
  ctx: ToolExecutorContext,
): Promise<ToolResult> {
  const { script, timeoutMs } = input as { script?: string; timeoutMs?: number }
  if (!script || typeof script !== 'string') {
    return { error: 'run_script expects a "script" string containing JavaScript code.' }
  }

  // The script runs under its own CONNECTION config (every graphic category
  // off — the engine skips graphic serialization per response, the WASM's main
  // cost); withEmissionConfig restores the app's config afterwards, also when
  // the script throws. The viewport is refreshed once afterwards.
  const session = browserSession(ctx.drawingId, { suppressGraphics: true })
  const res = await withEmissionConfig(ctx.drawingId, SUPPRESS_GRAPHICS, () =>
    runScript(script, session, {
      registry: (getMethodRegistry() ?? undefined) as MethodRegistry | undefined,
      // The browser/WASM engine is much slower per call than a native worker —
      // default to 180s so one substantial script fits (the executor caps at 300s).
      timeoutMs: timeoutMs ?? 180_000,
    }),
  )

  // One pull instead of per-call graphic pushes: with the app's config restored,
  // fetchTree (GetTree) brings the full structure AND graphic into the store in
  // a single round trip. No recalc: every command already regenerated its own
  // feature, and recalc would destroy entity-injection bodies (v1.solid.*).
  // Callers that need a re-tessellation (snapshot's adaptive faceting) ask for
  // it explicitly.
  await refreshAfterScript(ctx.drawingId)

  if (!res.ok) {
    const logTail = res.logs.length ? `\nConsole output before the error:\n${res.logs.slice(-20).join('\n')}` : ''
    return { error: `${res.error}${logTail}` }
  }
  return { result: { returned: res.returned, logs: res.logs } }
}
