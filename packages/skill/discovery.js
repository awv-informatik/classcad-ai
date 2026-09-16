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
  expression: ['parameter', 'variable', 'formula'],
  parameter: ['expression', 'variable', 'parametric'],
  parametric: ['expression', 'parameter', 'regeneration'],
  variable: ['expression', 'parameter'],
  global: ['shared', 'parameter'],
  shared: ['global', 'parameter'],
  constraint: ['joint', 'mate', 'fastened'],
  joint: ['constraint', 'mate'],
  mate: ['constraint', 'joint'],
  assembly: ['instance', 'template', 'product'],
  bounds: ['boundingbox', 'extent', 'size', 'measure'],
}

/** Expand a query into lowercase match terms (tokens + CAD synonyms unless `synonyms: false`). */
function expandSearchTerms(search, { synonyms = true } = {}) {
  const raw = Array.isArray(search) ? search : [search]
  const out = new Set()
  for (const part of raw) {
    for (const t of String(part ?? '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)) {
      out.add(t)
      if (synonyms) for (const syn of OP_SYNONYMS[t] ?? []) out.add(syn)
    }
  }
  return [...out]
}

/** Filler words that match nearly every document — ignored by the document search. */
const DOC_SEARCH_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'by', 'is', 'are', 'be', 'how', 'do',
  'i', 'my', 'it', 'that', 'this', 'from', 'as', 'at', 'part', 'parts', 'use', 'using', 'make', 'create', 'get',
])

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
    let raw = String(name ?? '').trim().replace(/\.md$/i, '')
    if (!raw) return null
    // Renamed/moved documents keep answering to their historical keys.
    const alias = DOC_ALIASES[raw] ?? DOC_ALIASES[raw.toUpperCase()]
    if (alias) raw = alias
    const fromResolver = resolveDoc ? resolveDoc(raw) : null
    if (fromResolver) return { key: raw, text: fromResolver }
    if (docs[raw]) return { key: raw, text: docs[raw] }
    const lower = raw.toLowerCase()
    const key = Object.keys(docs).find(k => k.toLowerCase() === lower)
    return key ? { key, text: docs[key] } : null
  }

  /** A `<domain>/<method>` key that only carries a method's detailed notes. */
  function isMethodNotes(key) {
    const [domain, method, ...rest] = key.split('/')
    return rest.length === 0 && method != null && registry[`v1.${domain}.${method}`] != null
  }

  function listDocs() {
    const keys = Object.keys(docs)
    return {
      topics: keys.filter(k => !k.includes('/')).sort(),
      overviews: keys.filter(k => k.startsWith('api/')).sort(),
      recipes: keys.filter(k => k.startsWith('recipes/')).sort(),
      guides: keys.filter(k => k.includes('/') && !k.startsWith('api/') && !k.startsWith('recipes/') && !isMethodNotes(k)).sort(),
    }
  }

  /** First `# ` heading of a doc, used as its title. */
  function docTitle(text) {
    const line = String(text ?? '').split('\n').find(l => /^#\s/.test(l))
    return line ? line.replace(/^#\s+/, '').replace(/^Recipe:\s*/i, '').trim() : ''
  }

  /**
   * Split a doc into pages of at most `size` chars, cutting at the last heading
   * (then blank line, then newline) before the limit so sections stay whole.
   */
  function paginate(text, size) {
    const pages = []
    let rest = text
    while (rest.length > size) {
      const window = rest.slice(0, size)
      let cut = Math.max(window.lastIndexOf('\n## '), window.lastIndexOf('\n# '), window.lastIndexOf('\n### '))
      if (cut < size * 0.4) cut = window.lastIndexOf('\n\n')
      if (cut < size * 0.4) cut = window.lastIndexOf('\n')
      if (cut <= 0) cut = size
      pages.push(rest.slice(0, cut))
      rest = rest.slice(cut).replace(/^\n+/, '')
    }
    pages.push(rest)
    return pages
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
        const doc = lookupDoc(`${entry.domain}/${entry.method}`)
        if (entry.params?.length) {
          // Parameters the detailed notes already describe (`name` in backticks)
          // are listed by name only; the rest keep their contract text.
          const described = p => {
            const leaf = p.name.replace(/^param\.?/, '').split('.').pop().replace(/\[\]$/, '')
            return doc != null && leaf !== '' && doc.text.includes(`\`${leaf}\``)
          }
          const brief = entry.params.filter(p => p.name !== 'param' && described(p)).map(p => `\`${p.name.replace(/^param\./, '')}\``)
          const full = entry.params.filter(p => !(p.name !== 'param' && described(p)))
          parts.push('', '**Parameters**:')
          for (const p of full) parts.push(`- \`${p.name}\`: ${p.text}`)
          if (brief.length) parts.push(`- Described in the notes below: ${brief.join(', ')}`)
        }
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

    /** The readable documents, grouped: topics / api overviews / recipes / guides. */
    listDocs,

    /**
     * Search the workflow documents — recipes, topic docs and guides (not the
     * per-method notes, which searchMethods covers, and not the huge api/*
     * overviews). Ranked over key (×4), title (×3), headings (×2) and body
     * (×1 per distinct term), CAD synonyms expanded.
     * → { count, docs: [{ key, title, chars, pages, headings }], note? }
     */
    searchDocs({ search, limit = 6, budget = DOCS_RESPONSE_BUDGET } = {}) {
      // Query words count fully, their synonyms half; filler words are ignored.
      const direct = expandSearchTerms(search ?? '', { synonyms: false }).filter(t => !DOC_SEARCH_STOPWORDS.has(t))
      const synonyms = expandSearchTerms(direct).filter(t => !direct.includes(t))
      if (direct.length === 0) return { count: 0, docs: [] }
      const weighted = [...direct.map(t => [t, 1]), ...synonyms.map(t => [t, 0.5])]
      const keys = Object.keys(docs).filter(k => !k.startsWith('api/') && !isMethodNotes(k))
      const scored = keys
        .map(key => {
          const text = docs[key]
          const lowerKey = key.toLowerCase()
          const title = docTitle(text)
          const lowerTitle = title.toLowerCase()
          const headings = text.split('\n').filter(l => /^#{2,3}\s/.test(l)).map(l => l.replace(/^#+\s+/, ''))
          const lowerHeadings = headings.map(h => h.toLowerCase())
          const body = text.toLowerCase()
          let score = 0
          let covered = 0
          const hitHeadings = new Set()
          for (const [t, w] of weighted) {
            let hit = false
            if (lowerKey.includes(t)) { score += 4 * w; hit = true }
            if (lowerTitle.includes(t)) { score += 3 * w; hit = true }
            const hIdx = lowerHeadings.findIndex(h => h.includes(t))
            if (hIdx >= 0) { score += 2 * w; hit = true; if (w === 1) hitHeadings.add(headings[hIdx]) }
            if (body.includes(t)) { score += 1 * w; hit = true }
            if (hit && w === 1) covered++
          }
          score += 2 * covered // docs matching more of the query words rank higher
          if (score > 0 && key.startsWith('recipes/')) score += 3 // composed workflows first
          return { key, title, chars: text.length, pages: Math.ceil(text.length / budget), headings: [...hitHeadings].slice(0, 3), score }
        })
        .filter(e => e.score >= 3)
        .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key))
      return {
        count: scored.length,
        docs: scored.slice(0, limit).map(({ score, ...rest }) => rest),
        ...(scored.length ? { note: 'Workflow documents matching the search — fetch with docs([...keys]).' } : {}),
      }
    },

    /**
     * Compact index of the workflow documents (recipes + guides, `key — title`),
     * for system prompts / MCP instructions next to methodIndex().
     */
    docIndex() {
      const { recipes, guides } = listDocs()
      return [...recipes, ...guides].map(k => `${k} — ${docTitle(docs[k])}`).join('\n')
    },

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

    /**
     * Bulk documentation — THE single source for every host's `docs` tool
     * (buerli-ai, mcp, …). Resolves up to `DOCS_MAX_KEYS` keys and packs them
     * into ONE response of at most `budget` chars (default
     * `DOCS_RESPONSE_BUDGET`), so the result never exceeds a host's tool-output
     * limit:
     *   - docs are served whole, in request order, while they fit;
     *   - docs that don't fit are DEFERRED — listed at the top with the exact
     *     keys to request next (nothing is silently dropped or truncated);
     *   - a doc larger than the budget is split into pages at headings;
     *     `key` serves page 1, `key#2` … the rest (the page footer says so).
     * A trailing "not found" section carries per-key errors/suggestions.
     *
     * `resolveOne` (optional): async per-key resolver for hosts with extra
     * key spaces (e.g. buerli-ai's live browser namespaces). It returns
     * `{ text }` or `{ error }`; keys it does not handle can fall back to
     * this discovery's describeMethod by returning null/undefined.
     *
     * → { text, found: string[], missing: string[], deferred: string[] }
     */
    async bulkDocs(keys, resolveOne, { budget = DOCS_RESPONSE_BUDGET } = {}) {
      const list = Array.isArray(keys) ? keys.filter(k => typeof k === 'string' && k.trim() !== '') : []
      if (list.length === 0) {
        return {
          text: 'Provide keys: an array of documentation keys, e.g. ["v1.part.extrusion", "SKETCHING", "recipes/parametric-part"].',
          found: [],
          missing: [],
          deferred: [],
          empty: true,
        }
      }
      const unique = [...new Set(list.map(k => k.trim()))]
      const overLimit = unique.slice(DOCS_MAX_KEYS)
      const sections = []
      const failures = []
      const found = []
      const missing = []
      const deferred = []
      const pageSize = Math.max(Math.floor(budget * 0.9), budget - 1000) // room for the section header and page footer
      let used = 0
      for (const requested of unique.slice(0, DOCS_MAX_KEYS)) {
        const pageMatch = requested.match(/^(.*)#(\d+)$/)
        const key = pageMatch ? pageMatch[1] : requested
        const page = pageMatch ? Math.max(1, Number(pageMatch[2])) : 1
        let text = null
        let error = null
        if (resolveOne) {
          const r = await resolveOne(key)
          if (r && typeof r.text === 'string') text = r.text
          else if (r && r.error) error = r.error
        }
        if (text == null && error == null) {
          const res = this.describeMethod(key)
          if (res.kind === 'error') error = res.text
          else text = res.text
        }
        if (text == null) {
          missing.push(requested)
          failures.push(`${requested}: ${error ?? 'not found'}`)
          continue
        }
        const pages = text.length > pageSize ? paginate(text, pageSize) : [text]
        if (page > pages.length) {
          missing.push(requested)
          failures.push(`${requested}: "${key}" has ${pages.length} page(s)`)
          continue
        }
        const label = pages.length > 1 ? `${key} (page ${page}/${pages.length})` : key
        const footer = page < pages.length ? `\n\n[${key}: page ${page}/${pages.length} — continue with "${key}#${page + 1}"]` : ''
        const section = `# ═══ ${label} ═══\n\n${pages[page - 1]}${footer}`
        if (used + section.length > budget && used > 0) {
          deferred.push(requested)
          continue
        }
        sections.push(section)
        used += section.length + 2
        found.push(requested)
      }
      deferred.push(...overLimit)
      if (failures.length) sections.push(`# ═══ not found ═══\n${failures.join('\n')}`)
      const header = deferred.length
        ? `# ═══ response budget reached ═══\nServed ${found.length} of ${found.length + deferred.length} docs. NOT included yet — ` +
          `request these next in another docs call: ${JSON.stringify(deferred)}\n\n`
        : ''
      return { text: header + sections.join('\n\n'), found, missing, deferred }
    },
  }
}

/** Shared limits for the bulk docs tool (single source across hosts). */
export const DOCS_MAX_KEYS = 24
/**
 * Max chars in ONE docs response. Tool outputs above ~25k tokens are rejected
 * or spilled to a file by hosts (Claude Code's default MCP output limit). An
 * 82k-char doc response exceeded that limit; doc markdown runs ~0.3–0.36
 * tokens/char, so 64k chars (plus the ≤1k deferral header) stays below it.
 */
export const DOCS_RESPONSE_BUDGET = 64000
/** @deprecated Docs are no longer truncated; oversized docs are paged. Kept for importers. */
export const DOCS_PER_DOC_CAP = DOCS_RESPONSE_BUDGET

/**
 * The shared `docs` tool contract — name + LLM-facing description, so every
 * host advertises the SAME tool the same way. Hosts may append one sentence
 * of surface-specific context (e.g. where their method index lives).
 */
export const DOCS_TOOL = {
  name: 'docs',
  description:
    'Fetch documentation in BULK — one call, many documents. Keys can be: v1 methods ("v1.part.box" or a ' +
    'unique bare name), topic docs ("DATA", "STRUCTURE", "GRAPHICS"), recipes ' +
    '("recipes/verification" — MANDATORY in every build fetch, "recipes/constrained-sketching", ' +
    '"recipes/parametric-part", "recipes/assembly-parameters", "recipes/pattern-then-subtract", ' +
    '"recipes/direct-modeling-eif"), guides ("part/expression-workflow", "assembly/generic", …) and domain ' +
    'overviews ("api/part"). PLAN FIRST: pick every method you will need from the method index, then request ' +
    `them plus the matching recipe/guide docs in ONE call (up to ${DOCS_MAX_KEYS} keys), recipes first. ` +
    `Each response is capped at ~${Math.round(DOCS_RESPONSE_BUDGET / 1000)}k chars: docs that don't fit are ` +
    'listed at the TOP as "NOT included yet" — request exactly those keys in a follow-up call before building. ' +
    'Docs larger than one response are paged: "key" is page 1, "key#2" the next (the page footer says so). ' +
    'Unknown keys come back in a "not found" section with suggestions. Find recipes/guides by topic with the ' +
    'method search (list_methods), which also returns matching documents.',
}

/**
 * Historical → canonical doc keys. Prompts, transcripts and muscle memory keep
 * using the old names; the lookup transparently redirects them.
 */
export const DOC_ALIASES = {
  SKETCHING: 'recipes/constrained-sketching',
  'recipes/verify-numerically': 'recipes/verification',
  'recipes/drawing-reproduction': 'recipes/verification',
}

export default createDiscovery
