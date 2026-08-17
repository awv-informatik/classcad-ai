// Browser ScriptSession — adapts the buerli client (@buerli.io/classcad WASM +
// @buerli.io/core store) to the @classcad/script session contract.
//
// Guaranteed surface (identical to the MCP/harness sessions):
//   execute    — v1 commands via createApi
//   getTree    — the live structure tree from the store
//   getGraphic — the live SCG graphic containers from the store (meshes/edges/
//                vertices — scripts filter geometry themselves). The store is
//                kept in sync by the client, so no recalc is needed to READ it;
//                the recalc option is accepted but a no-op here.
// Browser-only capabilities (facade/structure/selection/…) are injected as
// optional namespaces — scripts guard them (`if (api.facade) …`) or stay
// portable by sticking to the guaranteed surface.

import { createApi, BuerliCadFacade } from '@buerli.io/classcad'
import { getDrawing } from '@buerli.io/core'
import type { ScriptSession, Task, Envelope } from '@classcad/script'
import type { DrawingID } from '@buerli.io/core'

/** Build the optional browser namespaces (facade with auto drawing id + live drawing APIs). */
function browserNamespaces(drawingId: DrawingID): Record<string, unknown> {
  const namespaces: Record<string, unknown> = {}

  const utils = (BuerliCadFacade as any)?.utils
  if (utils && typeof utils === 'object') {
    const facade: Record<string, unknown> = {}
    for (const key of Object.getOwnPropertyNames(utils)) {
      const val = utils[key]
      if (typeof val !== 'function') continue
      facade[key] = key === 'connect' ? val.bind(utils) : (...args: unknown[]) => val.call(utils, drawingId, ...args)
    }
    namespaces.facade = facade
  }

  const drawingApi = (getDrawing(drawingId) as any)?.api ?? {}
  for (const key of Object.keys(drawingApi)) {
    const val = drawingApi[key]
    if (val && typeof val === 'object' && !(key in namespaces)) namespaces[key] = val
  }
  return namespaces
}

/** Create a ScriptSession over the live buerli drawing. */
export function browserSession(drawingId: DrawingID): ScriptSession {
  return {
    env: 'browser',
    execute: async (task: Task): Promise<Envelope> => {
      const [key, args] = Object.entries(task)[0] ?? []
      const segments = (key ?? '').split('.')
      if (segments.length !== 3 || segments[0] !== 'v1') {
        throw new Error(`Browser session executes v1 tasks only (got "${key}").`)
      }
      const [, domain, method] = segments
      const fn = (createApi(drawingId) as any)?.v1?.[domain]?.[method]
      if (typeof fn !== 'function') {
        throw new Error(`v1.${domain}.${method} is not available on this client.`)
      }
      return (await fn(args?.[0] ?? {})) as Envelope
    },
    getTree: async (o?: { refresh?: boolean }) => {
      if (o?.refresh) {
        try {
          await (BuerliCadFacade as any)?.utils?.fetchTree?.(drawingId)
        } catch {
          /* store copy is still served below */
        }
      }
      return ((getDrawing(drawingId) as any)?.structure?.tree ?? {}) as import('@classcad/script').Tree
    },
    getGraphic: async () => {
      const containers = (getDrawing(drawingId) as any)?.graphic?.containers
      if (!containers) return null
      return { containers: Object.values(containers) }
    },
    namespaces: browserNamespaces(drawingId),
  }
}
