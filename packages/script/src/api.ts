// buildScriptApi — the `api` object handed to scripts.
//
// Guaranteed surface (identical in every environment):
//   api.v1.<domain>.<method>(params)  → Envelope { result, maxLevel, messages }
//   api.tree({ refresh? })            → structure tree (id → node)
//   api.graphic({ recalc? })          → { containers } with meshes/edges — scripts
//                                       can find and filter geometry themselves
//   api.env                           → 'node' | 'browser'
// Optional (client capability, injected via session.namespaces):
//   api.facade / api.structure / api.selection / …

import type { BuildApiOptions, Envelope, MethodRegistry, ScriptSession, Task } from './types.js'

const CORE_KEYS = new Set(['v1', 'tree', 'graphic', 'env'])

// Bounded edit distance (≤ max) — enough to catch typos like bxo→box.
function editDistanceAtMost(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false
  const dp = Array.from({ length: a.length + 1 }, (_, i) => i)
  for (let j = 1; j <= b.length; j++) {
    let prev = dp[0]
    dp[0] = j
    for (let i = 1; i <= a.length; i++) {
      const cur = dp[i]
      dp[i] = Math.min(dp[i] + 1, dp[i - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = cur
    }
  }
  return dp[a.length] <= max
}

function suggest(registry: MethodRegistry, domain: string, name: string): string {
  const needle = name.toLowerCase()
  const hits = Object.values(registry)
    .filter(e => e.domain === domain)
    .map(e => e.method)
    .filter(m => {
      const cand = m.toLowerCase()
      return cand.includes(needle) || needle.includes(cand) || editDistanceAtMost(cand, needle, 2)
    })
    .slice(0, 3)
  return hits.length ? ` Did you mean: ${hits.join(', ')}?` : ''
}

/** Build `api.v1` from the method registry — typos fail fast with suggestions. */
function v1FromRegistry(session: ScriptSession, registry: MethodRegistry): Record<string, unknown> {
  const domains: Record<string, Record<string, (params?: Record<string, unknown>) => Promise<Envelope>>> = {}
  for (const [full, entry] of Object.entries(registry)) {
    if (!full.startsWith('v1.')) continue
    const { domain, method } = entry
    domains[domain] ??= {}
    domains[domain][method] = (params?: Record<string, unknown>) =>
      session.execute({ [`v1.${domain}.${method}`]: [params ?? {}] } as Task)
  }
  // Wrap each domain so an unknown method name throws immediately (with
  // suggestions) instead of surfacing later as "undefined is not a function".
  const wrapped: Record<string, unknown> = {}
  for (const [domain, methods] of Object.entries(domains)) {
    wrapped[domain] = new Proxy(methods, {
      get(target, prop) {
        if (typeof prop !== 'string' || prop in target || prop === 'then' || prop === 'toJSON') {
          return (target as Record<string | symbol, unknown>)[prop]
        }
        throw new Error(`Unknown method "v1.${domain}.${String(prop)}".${suggest(registry, domain, prop)}`)
      },
    })
  }
  return new Proxy(wrapped, {
    get(target, prop) {
      if (typeof prop !== 'string' || prop in target || prop === 'then' || prop === 'toJSON') {
        return (target as Record<string | symbol, unknown>)[prop]
      }
      throw new Error(
        `Unknown v1 domain "${String(prop)}". Domains: ${Object.keys(wrapped).sort().join(', ')}.`,
      )
    },
  })
}

/** Permissive fallback without a registry — any `v1.<domain>.<method>` routes to execute. */
function v1Permissive(session: ScriptSession): Record<string, unknown> {
  return new Proxy(
    {},
    {
      get(_t, domain) {
        if (typeof domain !== 'string' || domain === 'then' || domain === 'toJSON') return undefined
        return new Proxy(
          {},
          {
            get(_t2, method) {
              if (typeof method !== 'string' || method === 'then' || method === 'toJSON') return undefined
              return (params?: Record<string, unknown>) =>
                session.execute({ [`v1.${domain}.${method}`]: [params ?? {}] } as Task)
            },
          },
        )
      },
    },
  )
}

/**
 * Build the script-facing `api` object for a session. Scripts that use only
 * the guaranteed surface (`v1`/`tree`/`graphic`/`env`) run unchanged in the
 * browser, the MCP, the harness and CI.
 */
export function buildScriptApi(session: ScriptSession, opts: BuildApiOptions = {}): Record<string, unknown> {
  const api: Record<string, unknown> = {
    v1: opts.registry ? v1FromRegistry(session, opts.registry) : v1Permissive(session),
    tree: (o?: { refresh?: boolean }) => session.getTree(o),
    graphic: (o?: { recalc?: boolean }) => session.getGraphic(o),
    env: session.env,
  }
  // Injected client capabilities (facade/structure/selection/…). Core keys win.
  for (const [key, value] of Object.entries(session.namespaces ?? {})) {
    if (!CORE_KEYS.has(key) && value != null) api[key] = value
  }
  return api
}
