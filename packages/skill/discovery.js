// @classcad/skill/discovery — the ONE implementation of method/doc discovery,
// shared by every agent host (buerli-ai, classcad-mcp, harnesses). Dependency-
// free ESM, browser-safe (no filesystem — callers pass the data in).
//
//   import { createDiscovery } from '@classcad/skill/discovery'
//   const d = createDiscovery({ registry, bundle, extraDocs })
//   d.searchMethods({ search: 'split' })   // ranked, CAD synonyms expanded
//   d.describeMethod('box')               // fuzzy: bare names resolve
//   d.readDoc('DATA')                     // topic docs, case-insensitive
//   d.methodIndex()                       // compact one-line-per-method index

// Common CAD-operation synonyms so a keyword search surfaces the right feature
// even when the caller's word differs from the API's — e.g. "split" →
// part.slice / solid.slice (the API never uses "split" for solids).
const OP_SYNONYMS = {
  split: ['slice', 'cut', 'divide', 'section', 'bisect', 'separate'],
  slice: ['split', 'cut', 'section', 'divide'],
  cut: ['slice', 'subtract', 'split', 'remove', 'pocket', 'section'],
  section: ['slice', 'cut', 'split'],
  hole: ['bore', 'drill', 'cut', 'pocket', 'subtract'],
  bore: ['hole', 'drill'],
  subtract: ['cut', 'difference', 'boolean', 'remove'],
  difference: ['subtract', 'cut', 'boolean'],
  union: ['add', 'join', 'combine', 'fuse', 'merge', 'boolean'],
  join: ['union', 'combine', 'merge', 'fuse'],
  combine: ['union', 'join', 'merge'],
  intersect: ['intersection', 'common', 'boolean'],
  round: ['fillet', 'blend'],
  fillet: ['round', 'blend'],
  chamfer: ['bevel'],
  extrude: ['pad', 'protrusion', 'boss', 'extrusion'],
  revolve: ['revolution', 'lathe', 'revolved'],
  sweep: ['loft'],
  loft: ['sweep'],
  pattern: ['array', 'repeat'],
  array: ['pattern', 'repeat'],
  mirror: ['reflect', 'symmetry', 'pattern'],
  hollow: ['shell', 'thin', 'thinwall'],
  shell: ['hollow', 'thin'],
  move: ['translate', 'transform', 'position', 'offset'],
  rotate: ['turn', 'transform'],
  scale: ['resize', 'transform'],
  copy: ['duplicate', 'clone', 'instance'],
  measure: ['bounds', 'distance', 'length', 'volume', 'mass', 'inspect'],
  bounds: ['boundingbox', 'extent', 'size', 'measure'],
}

/** Expand a query into lowercase match terms (tokens + CAD synonyms). */
function expandSearchTerms(search) {
  const raw = Array.isArray(search) ? search : [search]
  const out = new Set()
  for (const part of raw) {
    for (const t of String(part ?? '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)) {
      out.add(t)
      for (const syn of OP_SYNONYMS[t] ?? []) out.add(syn)
    }
  }
  return [...out]
}

/** First sentence of a summary, collapsed and capped, for compact listings. */
function brief(summary) {
  const s = String(summary ?? '').replace(/\s+/g, ' ').trim()
  const dot = s.indexOf('. ')
  const f = dot > 0 && dot < 90 ? s.slice(0, dot + 1) : s
  return f.length > 90 ? f.slice(0, 88).trimEnd() + '…' : f
}

function editDistanceAtMost(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1
  const dp = Array.from({ length: a.length + 1 }, (_, i) => i)
  for (let j = 1; j <= b.length; j++) {
    let prev = dp[0]
    dp[0] = j
    for (let i = 1; i <= a.length; i++) {
      const tmp = dp[i]
      dp[i] = Math.min(dp[i] + 1, dp[i - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[a.length]
}

/**
 * Create a discovery instance over the skill data.
 *
 * @param {object} opts
 * @param {Record<string, {domain: string, method: string, summary?: string, params?: {name: string, text: string}[]}>} opts.registry
 *   The v1 method registry (`@classcad/skill/method-registry.json`).
 * @param {Record<string, string>} [opts.bundle]
 *   The skill doc bundle (`@classcad/skill/bundle.json`): topic docs, `api/<domain>`
 *   overviews, `recipes/<name>`, per-method docs (`<domain>/<method>`).
 * @param {Record<string, string>} [opts.extraDocs]
 *   Additional docs merged UNDER the bundle (e.g. `@classcad/script/docs` — DATA,
 *   STRUCTURE, GRAPHICS).
 * @param {(key: string) => string | null} [opts.resolveDoc]
 *   Optional override consulted FIRST for any doc key ("part/box", "SKETCHING",
 *   "recipes/x") — lets Node hosts serve live files from disk during development.
 */
export function createDiscovery({ registry = {}, bundle = {}, extraDocs = {}, resolveDoc } = {}) {
  const docs = { ...extraDocs, ...bundle }
  let indexCache = null

  function lookupDoc(name) {
    const raw = String(name ?? '').trim().replace(/\.md$/i, '')
    if (!raw) return null
    const fromResolver = resolveDoc ? resolveDoc(raw) : null
    if (fromResolver) return { key: raw, text: fromResolver }
    if (docs[raw]) return { key: raw, text: docs[raw] }
    const lower = raw.toLowerCase()
    const key = Object.keys(docs).find(k => k.toLowerCase() === lower)
    return key ? { key, text: docs[key] } : null
  }

  function listDocs() {
    const keys = Object.keys(docs)
    return {
      topics: keys.filter(k => !k.includes('/')).sort(),
      overviews: keys.filter(k => k.startsWith('api/')).sort(),
      recipes: keys.filter(k => k.startsWith('recipes/')).sort(),
    }
  }

  /** Resolve a method name: exact key → case-insensitive → bare name (unique across domains). */
  function resolveMethod(name) {
    const raw = String(name ?? '').trim()
    if (registry[raw]) return { key: raw, entry: registry[raw] }
    const lower = raw.toLowerCase()
    const exact = Object.keys(registry).find(k => k.toLowerCase() === lower)
    if (exact) return { key: exact, entry: registry[exact] }
    const bare = Object.entries(registry).filter(
      ([k, v]) => k.toLowerCase().endsWith(`.${lower}`) || String(v.method).toLowerCase() === lower,
    )
    if (bare.length === 1) return { key: bare[0][0], entry: bare[0][1] }
    if (bare.length > 1) return { ambiguous: bare.map(([k]) => k) }
    return null
  }

  return {
    /**
     * Search/list v1 methods. No `search` → the full listing. With `search`
     * (string or string[], OR semantics): CAD-synonym-expanded, ranked over
     * name (×2) + summary (×1), capped at `limit` (default 25) with the total
     * reported. `withSummaries: false` returns names only (token-cheap).
     */
    searchMethods({ domain, search, withSummaries = true, limit = 25 } = {}) {
      let entries = Object.entries(registry)
      if (domain) entries = entries.filter(([, v]) => v.domain === domain)
      const shape = ([name, v]) => (withSummaries ? { method: name, summary: brief(v.summary) } : name)

      if (search == null || (Array.isArray(search) ? search.length === 0 : String(search).trim() === '')) {
        return { count: entries.length, methods: entries.sort(([a], [b]) => a.localeCompare(b)).map(shape) }
      }

      const terms = expandSearchTerms(search)
      const scored = entries
        .map(([name, v]) => {
          const n = name.toLowerCase()
          const s = String(v.summary ?? '').toLowerCase()
          let score = 0
          for (const t of terms) {
            if (n.includes(t)) score += 2
            if (s.includes(t)) score += 1
          }
          return { name, v, score }
        })
        .filter(e => e.score > 0)
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))

      if (scored.length === 0) {
        return {
          count: 0,
          methods: [],
          note:
            `No method matched (synonyms tried). Do NOT assume the operation doesn't exist — ` +
            `browse a domain instead (domains: ${[...new Set(Object.values(registry).map(v => v.domain))].sort().join(', ')}).`,
        }
      }
      return {
        count: scored.length,
        methods: scored.slice(0, limit).map(({ name, v }) => shape([name, v])),
        note:
          `Ranked by relevance (name + summary matches, CAD synonyms expanded)` +
          (scored.length > limit ? `; showing ${limit} of ${scored.length}` : '') +
          `. Use describeMethod for exact params.`,
      }
    },

    /**
     * Describe one method (fuzzy: "v1.part.box", "part.box" or bare "box") or
     * serve a whole document ("DATA", "SKETCHING", "recipes/…", "api/part").
     * → { kind: 'method'|'doc', text } or { kind: 'error', text }.
     */
    describeMethod(name) {
      const resolved = resolveMethod(name)
      if (resolved?.ambiguous) {
        return { kind: 'error', text: `"${name}" is ambiguous: ${resolved.ambiguous.join(', ')}. Use the full name.` }
      }
      if (resolved) {
        const { key, entry } = resolved
        const parts = [`# ${key}`, '', `**Summary**: ${entry.summary ?? ''}`]
        if (entry.params?.length) {
          parts.push('', '**Parameters**:')
          for (const p of entry.params) parts.push(`- \`${p.name}\`: ${p.text}`)
        }
        const doc = lookupDoc(`${entry.domain}/${entry.method}`)
        if (doc) parts.push('', '---', '', '# Detailed notes', '', doc.text)
        else parts.push('', '_No detailed notes for this method yet — JSDoc summary only._')
        return { kind: 'method', text: parts.join('\n') }
      }
      const doc = lookupDoc(name)
      if (doc) return { kind: 'doc', text: doc.text }
      // Suggestions: close method names, then available topics.
      const lower = String(name ?? '').toLowerCase()
      const close = Object.keys(registry)
        .filter(k => editDistanceAtMost(k.split('.').pop().toLowerCase(), lower, 2) <= 2)
        .slice(0, 5)
      const { topics } = listDocs()
      return {
        kind: 'error',
        text:
          `Unknown method or document "${name}".` +
          (close.length ? ` Did you mean: ${close.join(', ')}?` : '') +
          ` Topic docs: ${topics.join(', ')}. Recipes/overviews: use listDocs.`,
      }
    },

    /** Read a whole document by key (case-insensitive, tolerates ".md"). → { key, text } or null. */
    readDoc(name) {
      return lookupDoc(name)
    },

    /** The readable documents, grouped: topics / api overviews / recipes. */
    listDocs,

    /**
     * Compact one-line-per-method index of the whole v1 surface
     * (`name: brief summary`), memoized. ~4.6k tokens for 264 methods — small
     * enough to put in a system prompt or MCP server instructions so agents
     * know every method from turn one.
     */
    methodIndex() {
      if (indexCache) return indexCache
      indexCache = Object.keys(registry)
        .sort()
        .map(k => `${k}: ${brief(registry[k].summary)}`)
        .join('\n')
      return indexCache
    },
  }
}

export default createDiscovery
