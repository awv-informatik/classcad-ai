// Emission profiles and the script-scoped suppression used by runScript.
//
// The engine keeps ONE emission config per CONNECTION (GetEmissionConfig /
// SetEmissionConfig; a `config` field on ordinary requests is ignored). A
// session must NOT change that config for its whole lifetime: an MCP or
// harness may sit in a session shared with an interactive app, and the
// server broadcasts what the ORIGINATOR of a command emits - a permanently
// suppressed originator would mutate the model without the app ever seeing
// structure or graphic for it. So suppression is scoped to one script run:
// read the current config, switch payloads off, run, restore exactly the
// flags that were changed (also on error), then let the caller pull once so
// siblings and caches converge.

import type { ScriptSession } from './types.js'

/**
 * Emission profile while a script runs: results only (plus messages for
 * error handling). The delivery flags are pinned to the bundled form because
 * the node sessions only read `Result` frames (no patches, no streamed/binary
 * graphics). A 100-command script costs 100 small Results.
 */
export const SUPPRESS_EMISSION: Record<string, unknown> = {
  sendStructure: false,
  sendStructure_Patch: false,
  sendStructure_Immediately: false,
  sendStructure_ImmediatelyBinary: false,
  sendGraphic_Kernel: false,
  sendGraphic_Sketch: false,
  sendGraphic_StructureObj: false,
  sendGraphic_Invisible: false,
  sendGraphic_Compressed: false,
  sendGraphic_Immediately: false,
  sendGraphic_ImmediatelyBinary: false,
  sendGraphic_Multipackage: false,
  sendMessages: true,
  sendMessages_Immediately: false,
}

/**
 * Around a graphic pull inside a suppressed script: kernel graphics only -
 * the content the renderer has always been built on.
 * Switched back to the previous value right after the GetTree.
 */
export const PULL_GRAPHIC_ON: Record<string, unknown> = { sendGraphic_Kernel: true }

/** Effective flags echoed by GetEmissionConfig/SetEmissionConfig - only checked loosely here. */
const isConfigEcho = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && typeof (v as Record<string, unknown>).sendStructure === 'boolean'

/**
 * Switches the session's connection to SUPPRESS_EMISSION and returns a
 * restore function that puts the previously effective values of exactly
 * those flags back. Sessions without getEmissionConfig/setEmissionConfig
 * (the browser session handles suppression itself), and engines that do not
 * know the commands (no config echo), get a no-op restore - the script then
 * runs with whatever the connection emits, which is slower but correct.
 */
export async function suppressEmission(session: ScriptSession): Promise<() => Promise<void>> {
  const noop = async () => {}
  if (typeof session.getEmissionConfig !== 'function' || typeof session.setEmissionConfig !== 'function') return noop
  let previous: Record<string, unknown>
  try {
    const cfg = await session.getEmissionConfig()
    if (!isConfigEcho(cfg)) return noop
    previous = cfg
    if (!isConfigEcho(await session.setEmissionConfig(SUPPRESS_EMISSION))) return noop
  } catch {
    return noop
  }
  return async () => {
    const restore: Record<string, unknown> = {}
    for (const key of Object.keys(SUPPRESS_EMISSION)) {
      if (key in previous) restore[key] = previous[key]
    }
    try {
      await session.setEmissionConfig!(restore)
    } catch {
      /* the connection is probably gone; nothing left to restore on */
    }
  }
}
