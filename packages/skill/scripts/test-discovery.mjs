// Unit test for @classcad/skill/discovery against the real registry + bundle.
import { createDiscovery } from '../discovery.js'
import registry from '../method-registry.json' with { type: 'json' }
import bundle from '../bundle.json' with { type: 'json' }

const extraDocs = { DATA: '# DATA test doc', STRUCTURE: '# STRUCTURE test doc' }
const d = createDiscovery({ registry, bundle, extraDocs })

let pass = 0, fail = 0
const check = (label, cond) => { cond ? pass++ : fail++; console.log(cond ? ' ✓' : ' ✗', label) }

// search: synonyms
const split = d.searchMethods({ search: 'split' })
check('synonym split→slice surfaces slice methods', JSON.stringify(split.methods).includes('slice'))
const or = d.searchMethods({ search: ['delete', 'remove'], withSummaries: false })
check('OR-array search returns names only', or.count > 0 && typeof or.methods[0] === 'string')
const all = d.searchMethods({})
check('full listing covers whole registry', all.count === Object.keys(registry).length)
const dom = d.searchMethods({ domain: 'sketch', withSummaries: false })
check('domain filter', dom.count > 0 && dom.methods.every(m => m.startsWith('v1.sketch.')))
const none = d.searchMethods({ search: 'zzzznope' })
check('no-hit carries do-not-assume note', none.count === 0 && /Do NOT assume/.test(none.note))
const capped = d.searchMethods({ search: 'create', limit: 5 })
check('cap reported', capped.methods.length === 5 && /showing 5 of/.test(capped.note))

// describe: fuzzy resolution
check('exact key', d.describeMethod('v1.part.box').kind === 'method')
check('bare unique name resolves', d.describeMethod('chamfer').kind === 'method')
const amb2 = d.describeMethod('circularPattern')
check('bare name in 3 domains errors with all candidates', amb2.kind === 'error' && amb2.text.includes('v1.sketch.circularPattern'))
check('case-insensitive', d.describeMethod('V1.PART.BOX').kind === 'method')
const amb = d.describeMethod('create')
check('ambiguous bare name errors with candidates', amb.kind === 'error' && amb.text.includes('v1.part.create'))
check('per-method detailed notes composed', d.describeMethod('v1.part.chamfer').text.includes('Detailed notes'))
const typo = d.describeMethod('chamfre')
check('typo suggests', typo.kind === 'error' && typo.text.includes('chamfer'))

// docs
check('extraDocs topic served', d.describeMethod('DATA').kind === 'doc')
check('readDoc case-insensitive + .md tolerant', d.readDoc('data.md')?.text.startsWith('# DATA'))
check('bundle recipe served', d.readDoc('recipes/parametric-part') !== null)
const docs = d.listDocs()
check('listDocs groups', docs.topics.includes('DATA') && docs.recipes.length > 0 && docs.overviews.length > 0)

// resolveDoc override wins
const d2 = createDiscovery({ registry, bundle, resolveDoc: k => (k === 'SKETCHING' ? 'OVERRIDE' : null) })
check('resolveDoc override consulted first', d2.readDoc('SKETCHING').text === 'OVERRIDE')

// index
const idx = d.methodIndex()
check('index one line per method', idx.split('\n').length === Object.keys(registry).length)
check('index memoized', d.methodIndex() === idx)

// bulkDocs — the shared docs-tool implementation
const bd = await d.bulkDocs(['v1.part.box', 'DATA', 'totally-bogus-xyz'])
check('bulkDocs sections for found keys', bd.text.includes('# ═══ v1.part.box ═══') && bd.text.includes('# ═══ DATA ═══'))
check('bulkDocs found/missing split', bd.found.length === 2 && bd.missing.length === 1)
check('bulkDocs not-found section', bd.text.includes('# ═══ not found ═══') && bd.text.includes('totally-bogus-xyz'))
const bdEmpty = await d.bulkDocs([])
check('bulkDocs empty guard', bdEmpty.empty === true && bdEmpty.text.includes('Provide keys'))
const bdResolved = await d.bulkDocs(['host.special', 'v1.part.box'], async k => (k === 'host.special' ? { text: 'HOSTDOC' } : null))
check('bulkDocs host resolver wins, fallback works', bdResolved.text.includes('HOSTDOC') && bdResolved.text.includes('# ═══ v1.part.box ═══'))

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
