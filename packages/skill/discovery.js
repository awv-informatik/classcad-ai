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
  hole: ['bore', 'drill', 'cut', 'pocket', 'subtract', 'boolean', 'cylinder'],
  drill: ['hole', 'bore', 'subtract', 'boolean', 'cylinder'],
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
  tag: ['userdata', 'user', 'data', 'label', 'attribute'],
  label: ['userdata', 'user', 'data', 'tag', 'attribute'],
  attribute: ['userdata', 'user', 'data', 'tag', 'label'],
  metadata: ['userdata', 'user', 'data', 'tag', 'attribute'],
  export: ['save', 'write', 'format'],
  import: ['load', 'read'],
  step: ['stp', 'save', 'export'],
  stp: ['step', 'save', 'export'],
  stl: ['save', 'export', 'mesh'],
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

/** Filler words that match inside nearly every method name or summary — ignored by the method search. */
const METHOD_SEARCH_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'by', 'is', 'are', 'be', 'how', 'do',
  'i', 'my', 'it', 'that', 'this', 'from', 'as', 'at', 'into', 'onto', 'via', 'through',
])

/** Filler words that match nearly every document — ignored by the document search. */
const DOC_SEARCH_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'by', 'is', 'are', 'be', 'how', 'do',
  'i', 'my', 'it', 'that', 'this', 'from', 'as', 'at', 'part', 'parts', 'use', 'using', 'make', 'create', 'get',
])

/** Words of a method name or summary: camelCase and non-alphanumerics split, lowercased ("linkWithExpression" → link, with, expression). */
function splitWords(text) {
  return String(text ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // workCSys → work csys (acronym runs stay whole)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/** Minimal plural folding so "parameters"/"parameter", "boxes"/"box", "properties"/"property" match. */
function stem(word) {
  if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y'
  if (word.length > 4 && /(x|ch|sh|ss)es$/.test(word)) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

/**
 * The searchable part of a method's skill notes: the intro paragraph, the headings and the short
 * code terms in backticks (parameter names and values such as `format`, `'STP'`). Code terms that
 * name other methods or files (`part.boolean`, `userData.md`) are skipped — they point elsewhere.
 */
function notesKeywords(text) {
  if (!text) return ''
  const lines = String(text).split('\n')
  const intro = []
  for (const line of lines.slice(1)) {
    if (/^#/.test(line)) break
    intro.push(line)
  }
  const headings = lines.filter(l => /^#{2,3}\s/.test(l)).map(l => l.replace(/^#+\s+/, ''))
  const code = (String(text).match(/`[^`\n]{1,30}`/g) ?? [])
    .map(c => c.slice(1, -1))
    .filter(c => !/[./]/.test(c.replace(/^['"]|['"]$/g, '')))
  return [intro.join(' ').replace(/`[^`]*`/g, ' '), ...headings, ...new Set(code)].join(' ')
}

/**
 * BM25F over three fields of each method: name (weight 2), summary (weight 1) and the method's skill
 * notes keywords (weight 0.3 — catches what the generated summary never says, e.g. common.save writes
 * STEP). Field counts are length-normalized per field, combined, then saturated once (k1), and scaled by
 * how rare the word is (idf). Summaries get weak length normalization so a terse text
 * ("Creates a box") does not outrank a longer one; notes are fully length-normalized. Words match whole, after camelCase split and plural folding.
 */
function buildMethodBM25(registry, notesFor = () => null) {
  const K1 = 1.2
  const B_NAME = 0.75
  const B_SUMMARY = 0.3
  const B_NOTES = 0.75
  const docs = new Map()
  const df = new Map()
  let nameLenSum = 0
  let sumLenSum = 0
  let notesLenSum = 0
  for (const [key, v] of Object.entries(registry)) {
    const bare = String(v.method ?? key.split('.').pop())
    const nameWords = splitWords(bare).map(stem)
    const sumWords = splitWords(v.summary).map(stem)
    const notesWords = splitWords(notesKeywords(notesFor(key, v))).map(stem)
    const tf = words => words.reduce((m, w) => m.set(w, (m.get(w) ?? 0) + 1), new Map())
    const doc = {
      name: tf(nameWords), nameLen: nameWords.length,
      sum: tf(sumWords), sumLen: sumWords.length,
      notes: tf(notesWords), notesLen: notesWords.length,
      joined: bare.toLowerCase(),
    }
    for (const w of new Set([...nameWords, ...sumWords, ...notesWords])) df.set(w, (df.get(w) ?? 0) + 1)
    nameLenSum += doc.nameLen
    sumLenSum += doc.sumLen
    notesLenSum += doc.notesLen
    docs.set(key, doc)
  }
  const n = docs.size || 1
  const avgName = nameLenSum / n || 1
  const avgSum = sumLenSum / n || 1
  const avgNotes = notesLenSum / n || 1
  const idf = word => Math.log(1 + (n - (df.get(word) ?? 0) + 0.5) / ((df.get(word) ?? 0) + 0.5))
  const norm = (tf, len, avg, b) => (tf ? tf / (1 - b + (b * len) / avg) : 0)
  return {
    /** → { score, inName, inSummary } for one (already stemmed) word against one method. */
    score(key, word) {
      const d = docs.get(key)
      if (!d) return { score: 0, inName: false, inSummary: false }
      const inName = d.name.has(word)
      const inSummary = d.sum.has(word)
      const tf =
        2 * norm(d.name.get(word), d.nameLen, avgName, B_NAME) +
        norm(d.sum.get(word), d.sumLen, avgSum, B_SUMMARY) +
        0.3 * norm(d.notes.get(word), d.notesLen, avgNotes, B_NOTES)
      let score = tf ? (idf(word) * tf * (K1 + 1)) / (tf + K1) : 0
      // Compound words written as one ("workplane" → workPlane): whole-name substring, weighted like one name hit.
      let joinedHit = false
      if (!inName && word.length >= 4 && d.joined.includes(word)) {
        score += Math.log(1 + n / 2) * 0.8
        joinedHit = true
      }
      return { score, inName: inName || joinedHit, inSummary, notesOnly: score > 0 && !inName && !joinedHit && !inSummary }
    },
  }
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
  const bm25 = buildMethodBM25(registry, (key, v) => docs[`${v.domain}/${v.method ?? key.split('.').pop()}`])
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
     * Search/list v1 methods. No `search` → the full listing.
     * `search` as a string → one ranked list, capped at `limit` (default 25).
     * `search` as an array of 2+ entries → one group per entry (one concept each),
     * every group ranked on its own and capped at `limit` per group (default 8),
     * so a broad concept cannot crowd the others out. A method already listed in
     * an earlier group is marked `seeAbove` instead of repeating its summary.
     * Ranking: BM25F over method name (×2) and summary (×1) — whole words after
     * camelCase split and plural folding, rare words weigh more. CAD synonyms count
     * half; an entry matching only part of the query keeps that share of its score;
     * an exact method name ranks first. `withSummaries: false` returns names only.
     */
    searchMethods({ domain, search, withSummaries = true, limit } = {}) {
      let entries = Object.entries(registry)
      if (domain) entries = entries.filter(([, v]) => v.domain === domain)
      const shape = ([name, v]) => (withSummaries ? { method: name, summary: brief(v.summary) } : name)

      const queries = (Array.isArray(search) ? search : [search]).map(q => String(q ?? '').trim()).filter(Boolean)
      if (queries.length === 0) {
        return { count: entries.length, methods: entries.sort(([a], [b]) => a.localeCompare(b)).map(shape) }
      }

      const noHitNote =
        `No method matched (synonyms tried). Do NOT assume the operation doesn't exist — ` +
        `browse a domain instead (domains: ${[...new Set(Object.values(registry).map(v => v.domain))].sort().join(', ')}).`

      // Rank all entries against one query. `strong` = a top hit has a query word in its name AND matches every
      // query word (name or summary) — otherwise the entry is probably a workflow, not a method.
      const rank = query => {
        const stems = words => [...new Set(words.map(stem))]
        const words = expandSearchTerms(query, { synonyms: false }).filter(t => !METHOD_SEARCH_STOPWORDS.has(t))
        const direct = stems(words)
        // [word, weight, index of the query word it stands for]; synonyms count half
        const weighted = direct.map((t, i) => [t, 1, i])
        words.forEach((word, i) => {
          for (const syn of stems(expandSearchTerms(word)))
            if (!direct.includes(syn) && !weighted.some(([t, , o]) => t === syn && o === i)) weighted.push([syn, 0.5, direct.indexOf(stem(word))])
        })
        const hits = entries
          .map(([name, v]) => {
            const bare = String(v.method ?? name.split('.').pop()).toLowerCase()
            const domainWord = String(v.domain).toLowerCase()
            let score = 0
            const hitDirect = new Set()
            const hitSynonym = new Set()
            let nameHit = false
            let nameOrSummaryHit = false
            for (const [t, w, origin] of weighted) {
              if (w === 1 && t === domainWord) { hitDirect.add(origin); nameHit = true; continue } // "part box": the domain word is matched by the domain
              const s = bm25.score(name, t)
              if (s.score <= 0) continue
              if (!s.notesOnly) nameOrSummaryHit = true
              score += w * s.score
              if (w === 1) {
                hitDirect.add(origin)
                if (s.inName) nameHit = true
              } else hitSynonym.add(origin)
            }
            // a query word counts as covered when it matched itself (1) or only a synonym (0.5)
            const covered = hitDirect.size + [...hitSynonym].filter(o => !hitDirect.has(o)).length * 0.5
            // Notes only refine: they mention many words in passing, so a method also needs a name or summary match.
            if (!nameOrSummaryHit) score = 0
            if (score > 0) {
              score *= covered / direct.length // soft AND: matching half of the query words keeps half the score
              if (direct.includes(domainWord)) score += 1 // "part box" → part.box before solid.box
              if (direct.includes(stem(bare))) score += 3 // exact method name ("box" → part.box before updateBox)
              score = Math.round(score * 4) / 4 // near-ties (summary length only) fall through to the name order below
            }
            return { name, v, score, full: nameHit && hitDirect.size === direct.length }
          })
          .filter(e => e.score > 0)
          .sort((a, b) => b.score - a.score || a.name.length - b.name.length || a.name.localeCompare(b.name))
        return { hits, strong: hits.slice(0, 8).some(h => h.full) }
      }

      // One query → one flat list (unchanged contract).
      if (queries.length === 1) {
        const cap = limit ?? 25
        const { hits } = rank(queries[0])
        if (hits.length === 0) return { count: 0, methods: [], note: noHitNote }
        return {
          count: hits.length,
          methods: hits.slice(0, cap).map(({ name, v }) => shape([name, v])),
          note:
            `Ranked by relevance (BM25 over name + summary, CAD synonyms expanded)` +
            (hits.length > cap ? `; showing ${cap} of ${hits.length}` : '') +
            `. Use describeMethod for exact params.`,
        }
      }

      // Several queries → one group per query.
      const cap = limit ?? 8
      const listed = new Map() // method → first query it was listed under
      const unique = new Set()
      const groups = queries.map(query => {
        const { hits, strong } = rank(query)
        for (const h of hits) unique.add(h.name)
        const methods = hits.slice(0, cap).map(({ name, v }) => {
          if (listed.has(name)) return withSummaries ? { method: name, seeAbove: listed.get(name) } : name
          listed.set(name, query)
          return shape([name, v])
        })
        const group = { search: query, count: hits.length, methods }
        // For workflow-like entries, name the best-matching document instead of a generic pointer.
        const bestDoc = hits.length === 0 || !strong ? this?.searchDocs?.({ search: query, limit: 1 })?.docs?.[0]?.key : undefined
        const seeDoc = bestDoc ? `see \`${bestDoc}\`` : 'check `docs`'
        const inDomain = domain ? ` in the ${domain} domain (try without \`domain\`)` : ''
        if (hits.length === 0) group.note = `No method matched${inDomain} — likely a workflow or a different word: ${seeDoc}.`
        else if (!strong) group.note = `No method covers all of these words${inDomain} — likely a workflow, not a single method: ${seeDoc}.`
        else if (hits.length > cap) group.note = `showing ${cap} of ${hits.length}`
        return group
      })
      return {
        count: unique.size,
        groups,
        note:
          `One group per search entry, each ranked on its own (BM25 over name + summary, CAD synonyms expanded), ` +
          `top ${cap} per group. \`seeAbove\` = already listed under that entry. Use describeMethod for exact params.` +
          (unique.size === 0 ? ' ' + noHitNote : ''),
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
 * Max chars in ONE docs response. Hosts reject tool outputs above their limit or spill them to a
 * file the agent then has to read back in chunks. Claude Code keeps a 49,950-char result inline and
 * spills a 54,972-char one (its cap is 50,000 chars), so 48k plus the ≤1k deferral header stays
 * inline; whatever does not fit is deferred to the next call.
 */
export const DOCS_RESPONSE_BUDGET = 48000
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

/** The CAD synonym table behind both searches (read-only; exported for tests and tooling). */
export const SEARCH_SYNONYMS = OP_SYNONYMS

export default createDiscovery
