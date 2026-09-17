// Snapshot tests for everything an agent host gets from @classcad/skill: method resolution,
// both searches, bulk docs (paging, deferral, limits), the indexes and the prompt strings.
//
//   node test/snapshot.mjs            compare the built skill against test/snapshots/*.json
//   node test/snapshot.mjs --update   accept the current output as the new baseline
//
// Runs after every build (npm "postbuild") and in `npm test`. Any difference fails with a
// per-path diff. Intended changes (edited docs, new synonyms, ranking tweaks): review the diff,
// then run `npm run test:update` and commit the snapshots with the change.

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createDiscovery, DOCS_MAX_KEYS, DOCS_RESPONSE_BUDGET, DOCS_TOOL, DOC_ALIASES, SEARCH_SYNONYMS,
} from '../discovery.js'
import { RECIPES_POINTER, REFERENCE_IMAGE_POINTER } from '../prompts.js'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const SNAPSHOTS = join(here, 'snapshots')
const UPDATE = process.argv.includes('--update') || process.env.UPDATE_SNAPSHOTS === '1'

const registry = JSON.parse(readFileSync(join(root, 'method-registry.json'), 'utf8'))
const bundle = JSON.parse(readFileSync(join(root, 'bundle.json'), 'utf8'))
const d = createDiscovery({ registry, bundle })

// ── helpers ────────────────────────────────────────────────────────────────
const hash = text => createHash('sha1').update(String(text)).digest('hex').slice(0, 12)
const uniq = xs => [...new Set(xs)]
const names = r => (r.methods ?? []).map(m => (typeof m === 'string' ? m : m.method))
const headingsOf = text => String(text).split('\n').filter(l => /^#{1,3}\s/.test(l)).map(l => l.trim())
const words = text => String(text).replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2)
/** Content fingerprint: size, hash and outline — the text itself lives in git already. */
const fingerprint = text => ({ chars: String(text).length, sha: hash(text), headings: headingsOf(text) })

const methodKeys = Object.keys(registry).sort()
const bareNames = uniq(methodKeys.map(k => k.split('.').pop())).sort()
const { topics, overviews, recipes, guides } = d.listDocs()
const docKeys = [...topics, ...overviews, ...recipes, ...guides]
const allBundleKeys = Object.keys(bundle).sort()
const domains = uniq(Object.values(registry).map(v => v.domain)).sort()

// Multi-concept agent queries (real calls from agent runs + typical builds).
const CONCEPT_SETS = [
  ['shared parameters assembly', 'expression', 'box', 'cylinder', 'fastened constraint', 'mass properties', 'product instance', 'workplane'],
  ['sketch', 'line', 'circle', 'constraint', 'dimension', 'extrusion'],
  ['hole', 'pattern', 'fillet', 'chamfer'],
  ['assembly instance', 'product instance'],
  ['revolute joint', 'gear', 'move under constraints'],
  ['split solid', 'boolean subtraction', 'union', 'intersection'],
  ['save', 'load', 'export step'],
  ['work csys', 'work axis', 'work point', 'work plane'],
  ['part box', 'solid box'],
  ['zzzznope', 'box'],
  ['in a the', 'of'],
]
const TASK_QUERIES = [
  'shared parameters assembly', 'global dimension drives several parts', 'constrained sketch from a drawing',
  'dimensioned technical drawing', 'reproduce a reference image', 'pattern holes around an axis', 'bolt circle',
  'verify volume and bounding box', 'parametric part with expressions', 'one-shot solid without history',
  'entity injection direct modeling', 'trim sketch curves', 'fillet edges', 'assembly constraints', 'kinematic joint',
  'template vs instance', 'save and load files', 'faceting quality', 'user data on objects', 'expression syntax',
  'sprocket', 'gear teeth', 'handedness mirror', 'rollback feature order', 'split a solid',
]

// ── cases ──────────────────────────────────────────────────────────────────
function snapshotRegistry() {
  return {
    count: methodKeys.length,
    domains: Object.fromEntries(domains.map(dm => [dm, methodKeys.filter(k => registry[k].domain === dm).length])),
    methods: Object.fromEntries(methodKeys.map(k => [k, {
      summary: registry[k].summary ?? '',
      params: (registry[k].params ?? []).map(p => p.name),
    }])),
  }
}

function snapshotIndexes() {
  return {
    listDocs: { topics, overviews, recipes, guides },
    docIndex: d.docIndex().split('\n'),
    methodIndex: { ...fingerprint(d.methodIndex()), lines: d.methodIndex().split('\n').length },
    bundleKeys: allBundleKeys,
    constants: { DOCS_MAX_KEYS, DOCS_RESPONSE_BUDGET, DOC_ALIASES, SEARCH_SYNONYMS },
  }
}

function snapshotPrompts() {
  return { RECIPES_POINTER, REFERENCE_IMAGE_POINTER, DOCS_TOOL }
}

function snapshotDocs() {
  // Every bundle document through readDoc and describeMethod (the docs tool path).
  const out = {}
  for (const key of allBundleKeys) {
    const doc = d.readDoc(key)
    const described = d.describeMethod(key)
    out[key] = { read: doc ? fingerprint(doc.text) : null, describe: { kind: described.kind, ...fingerprint(described.text) } }
  }
  return out
}

function snapshotDescribe() {
  // Every method, in every spelling an agent uses: full key, without v1, bare, lower case, typo.
  const resolveSummary = r => {
    const first = r.text.split('\n')[0]
    return r.kind === 'method' ? `method ${first.replace(/^# /, '')}` : `${r.kind}: ${r.kind === 'error' ? r.text.slice(0, 240) : first}`
  }
  const methods = {}
  for (const key of methodKeys) {
    const full = d.describeMethod(key)
    methods[key] = {
      full: fingerprint(full.text),
      paramsNotedByName: (full.text.match(/Described in the notes below: (.*)/) ?? [, ''])[1],
      hasNotes: full.text.includes('# Detailed notes'),
      withoutV1: resolveSummary(d.describeMethod(key.replace(/^v1\./, ''))),
      lowerCase: resolveSummary(d.describeMethod(key.toLowerCase())),
    }
  }
  const bare = Object.fromEntries(bareNames.map(n => [n, resolveSummary(d.describeMethod(n))]))
  const typos = Object.fromEntries(bareNames.filter(n => n.length > 4).map(n => [`${n.slice(0, -1)}`, resolveSummary(d.describeMethod(n.slice(0, -1)))]))
  const edge = Object.fromEntries(['', '   ', 'v1.', 'v1.part', 'part/box', 'part/box.md', 'recipes/verification.md', 'RECIPES/VERIFICATION',
    ...Object.keys(DOC_ALIASES), 'totally-unknown-xyz', 'v1.part.boxx'].map(k => [JSON.stringify(k), resolveSummary(d.describeMethod(k))]))
  return { methods, bare, typos, edge }
}

function snapshotSearchMethods() {
  const top = (search, opts = {}) => {
    const r = d.searchMethods({ search, withSummaries: false, ...opts })
    return r.groups
      ? { count: r.count, groups: r.groups.map(g => ({ search: g.search, count: g.count, methods: names(g), ...(g.note ? { note: g.note } : {}) })) }
      : { count: r.count, top: names(r), ...(r.note && r.count === 0 ? { note: r.note } : {}) }
  }
  const vocabulary = uniq([...methodKeys.flatMap(k => words(k.split('.').pop())), ...methodKeys.flatMap(k => words(registry[k].summary ?? ''))])
    .filter(w => !/^\d+$/.test(w)).sort()
  const cap = { limit: 5 }
  return {
    listing: { all: d.searchMethods({ withSummaries: false }).count, perDomain: Object.fromEntries(domains.map(dm => [dm, names(d.searchMethods({ domain: dm, withSummaries: false }))])) },
    byMethodName: Object.fromEntries(bareNames.map(n => [n, top(n, cap)])),
    bySynonymKey: Object.fromEntries(Object.keys(SEARCH_SYNONYMS).sort().map(s => [s, top(s, cap)])),
    byVocabularyWord: Object.fromEntries(vocabulary.map(w => [w, top(w, { limit: 3 })])),
    byDomainAndWord: Object.fromEntries(domains.flatMap(dm => ['create', 'update', 'delete', 'get', 'box', 'fillet', 'pattern'].map(w => [`${dm}:${w}`, top(w, { domain: dm, limit: 5 })]))),
    tasks: Object.fromEntries(TASK_QUERIES.map(q => [q, top(q, { limit: 8 })])),
    conceptSets: CONCEPT_SETS.map(set => ({ search: set, ...top(set, cap) })),
    options: {
      withSummaries: d.searchMethods({ search: 'extrusion', limit: 3 }),
      withSummariesGrouped: d.searchMethods({ search: ['assembly instance', 'product instance'], limit: 3 }),
      defaultLimitString: top('create'),
      defaultLimitArray: top(['create', 'update']),
      limit1: top('box', { limit: 1 }),
      limit300: top('part', { limit: 300 }).top?.length,
      singleEntryArray: top(['box']),
      emptyString: d.searchMethods({ search: '', withSummaries: false }).count,
      emptyArray: d.searchMethods({ search: [], withSummaries: false }).count,
      noHit: top('zzzznope'),
      stopwordsOnly: top('in a the'),
      caseInsensitive: top('FILLET EDGES', cap),
      plural: top('boxes', cap),
      camelCaseAcronym: top('work csys', cap),
      compound: top('workplane', cap),
    },
  }
}

function snapshotSearchDocs() {
  const run = (search, opts = {}) => {
    const r = d.searchDocs({ search, ...opts })
    return { count: r.count, docs: r.docs.map(x => `${x.key} [${x.headings.join(' | ')}]`) }
  }
  const titled = [...recipes, ...guides].map(k => [k, (d.readDoc(k).text.split('\n').find(l => /^#\s/.test(l)) ?? '').replace(/^#\s+/, '')])
  return {
    tasks: Object.fromEntries(TASK_QUERIES.map(q => [q, run(q)])),
    byDocTitle: Object.fromEntries(titled.map(([k, title]) => [k, run(title, { limit: 3 })])),
    byDocKeyName: Object.fromEntries([...recipes, ...guides].map(k => [k, run(k.split('/').pop().replace(/[-_]/g, ' '), { limit: 3 })])),
    bySynonymKey: Object.fromEntries(Object.keys(SEARCH_SYNONYMS).sort().map(s => [s, run(s, { limit: 3 })])),
    arrays: CONCEPT_SETS.map(set => ({ search: set, ...run(set) })),
    options: { empty: run(''), stopwordsOnly: run('how do i make a part'), limit1: run('assembly', { limit: 1 }), limit20: run('assembly', { limit: 20 }) },
  }
}

async function snapshotBulkDocs() {
  const summarize = r => ({
    found: r.found, missing: r.missing, deferred: r.deferred, ...(r.empty ? { empty: true } : {}),
    chars: r.text.length, sha: hash(r.text),
    sections: r.text.split('\n').filter(l => l.startsWith('# ═══')),
    footers: r.text.split('\n').filter(l => /^\[.*page \d+\/\d+/.test(l)),
    underBudget: r.text.length <= DOCS_RESPONSE_BUDGET,
  })
  // Every document alone (page 1, and every further page of paged docs), at the default budget.
  const perKey = {}
  for (const key of [...docKeys, ...methodKeys]) {
    const first = await d.bulkDocs([key])
    perKey[key] = summarize(first)
    const pages = Number((first.text.match(/page 1\/(\d+)/) ?? [, 1])[1])
    for (let p = 2; p <= pages; p++) perKey[`${key}#${p}`] = summarize(await d.bulkDocs([`${key}#${p}`]))
  }
  const big = [...recipes, ...overviews]
  return {
    perKey,
    combos: {
      empty: summarize(await d.bulkDocs([])),
      notArray: summarize(await d.bulkDocs('v1.part.box')),
      blanks: summarize(await d.bulkDocs(['', '  '])),
      duplicates: summarize(await d.bulkDocs(['v1.part.box', 'v1.part.box', ' v1.part.box '])),
      missingMixed: summarize(await d.bulkDocs(['v1.part.box', 'nope-xyz', 'v1.part.boxx', 'recipes/verification#99'])),
      ambiguousBare: summarize(await d.bulkDocs(['circularPattern'])),
      aliases: summarize(await d.bulkDocs(Object.keys(DOC_ALIASES))),
      allRecipes: summarize(await d.bulkDocs(recipes)),
      recipesAndOverviews: summarize(await d.bulkDocs(big)),
      overMaxKeys: summarize(await d.bulkDocs(methodKeys.slice(0, DOCS_MAX_KEYS + 6))),
      pageZeroAndNegative: summarize(await d.bulkDocs(['api/part#0', 'api/part#-1'])),
    },
    budgets: Object.fromEntries(await Promise.all([1500, 8000, 20000].map(async b => [b, summarize(await d.bulkDocs(['recipes/verification', 'v1.part.box', 'api/part'], undefined, { budget: b }))]))),
    resolver: summarize(await d.bulkDocs(['DATA', 'v1.part.box', 'LIVE'], async k => (k === 'DATA' ? { text: '# DATA\nhost doc' } : k === 'LIVE' ? { error: 'host says no' } : null))),
  }
}
// ── run ────────────────────────────────────────────────────────────────────
async function buildAll() {
  return {
    'registry.json': snapshotRegistry(),
    'indexes.json': snapshotIndexes(),
    'prompts.json': snapshotPrompts(),
    'docs.json': snapshotDocs(),
    'describe.json': snapshotDescribe(),
    'search-methods.json': snapshotSearchMethods(),
    'search-docs.json': snapshotSearchDocs(),
    'bulk-docs.json': await snapshotBulkDocs(),
  }
}

/** Flatten to path → JSON value for a readable per-path diff. */
function flatten(value, path = '', out = new Map()) {
  if (value && typeof value === 'object') {
    const entries = Array.isArray(value) ? value.map((v, i) => [i, v]) : Object.entries(value)
    if (entries.length === 0) out.set(path, JSON.stringify(value))
    for (const [k, v] of entries) flatten(v, path ? `${path}${Array.isArray(value) ? `[${k}]` : `.${k}`}` : String(k), out)
  } else out.set(path, JSON.stringify(value))
  return out
}

function diff(expected, actual) {
  const a = flatten(expected)
  const b = flatten(actual)
  const lines = []
  for (const [p, v] of a) {
    if (!b.has(p)) lines.push(`  - ${p}: ${v}`)
    else if (b.get(p) !== v) lines.push(`  ~ ${p}: ${v}  →  ${b.get(p)}`)
  }
  for (const [p, v] of b) if (!a.has(p)) lines.push(`  + ${p}: ${v}`)
  return lines
}

const snapshots = await buildAll()
mkdirSync(SNAPSHOTS, { recursive: true })
const serialize = v => JSON.stringify(v, null, 2) + '\n'
let failed = 0
let changedFiles = 0
const MAX_LINES = 60

for (const [file, value] of Object.entries(snapshots)) {
  const path = join(SNAPSHOTS, file)
  const actual = JSON.parse(serialize(value))
  if (UPDATE) {
    const before = existsSync(path) ? readFileSync(path, 'utf8') : null
    const after = serialize(value)
    if (before !== after) {
      writeFileSync(path, after)
      changedFiles++
      console.log(` ✎ ${file} ${before == null ? '(new)' : 'updated'}`)
    } else console.log(` ✓ ${file} unchanged`)
    continue
  }
  if (!existsSync(path)) {
    failed++
    console.log(` ✗ ${file}: no baseline — run \`npm run test:update\` to create it`)
    continue
  }
  const expected = JSON.parse(readFileSync(path, 'utf8'))
  const lines = diff(expected, actual)
  if (lines.length === 0) {
    console.log(` ✓ ${file}`)
    continue
  }
  failed++
  console.log(` ✗ ${file}: ${lines.length} difference(s)`)
  for (const l of lines.slice(0, MAX_LINES)) console.log(l)
  if (lines.length > MAX_LINES) console.log(`  … ${lines.length - MAX_LINES} more`)
}

if (UPDATE) {
  // Drop baselines for cases that no longer exist.
  for (const f of readdirSync(SNAPSHOTS)) if (f.endsWith('.json') && !(f in snapshots)) { unlinkSync(join(SNAPSHOTS, f)); console.log(` ✎ ${f} removed`) }
  console.log(`\nSnapshots written (${changedFiles} changed). Review the git diff of test/snapshots and commit it with your change.`)
  process.exit(0)
}
if (failed) {
  console.log(`\n${failed} snapshot file(s) differ from the baseline.`)
  console.log('If the change is intended (edited docs, new synonym, ranking tweak): `npm run test:update`, review the diff, commit.')
  process.exit(1)
}
console.log('\nAll snapshots match.')
