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
const d2 = createDiscovery({ registry, bundle, resolveDoc: k => (k === 'DATA' ? 'OVERRIDE' : null) })
check('resolveDoc override consulted first', d2.readDoc('DATA').text === 'OVERRIDE')

// aliases: the historical SKETCHING key redirects to the recipe
const ali = d.readDoc('SKETCHING')
check('SKETCHING alias resolves', ali !== null && ali.key === 'recipes/constrained-sketching')
check('alias via describeMethod', d.describeMethod('SKETCHING').kind === 'doc')
check('recipes group lists constrained-sketching', d.listDocs().recipes.includes('recipes/constrained-sketching'))
const a1 = d.readDoc('recipes/verify-numerically')
check('verify-numerically alias -> verification', a1 !== null && a1.key === 'recipes/verification')
const a2 = d.readDoc('recipes/drawing-reproduction')
check('drawing-reproduction alias -> verification', a2 !== null && a2.key === 'recipes/verification')

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

// bulkDocs — response budget, deferral, paging (tool output must stay under host limits)
const { DOCS_RESPONSE_BUDGET } = await import('../discovery.js')
const bigAsk = ['recipes/assembly-parameters', 'recipes/verification', 'recipes/parametric-part', 'recipes/constrained-sketching',
  'v1.part.box', 'v1.part.cylinder', 'v1.part.workCSys', 'v1.assembly.fastened', 'v1.assembly.fastenedOrigin',
  'v1.assembly.instance', 'v1.part.calculateMassProperties', 'v1.part.getGeometryIds', 'v1.part.getGeometryPositions']
const big = await d.bulkDocs(bigAsk)
check('budget: response never exceeds DOCS_RESPONSE_BUDGET', big.text.length <= DOCS_RESPONSE_BUDGET + 600)
check('budget: every key is served or deferred (nothing dropped)', big.found.length + big.deferred.length === bigAsk.length)
check('budget: deferred keys named at the top', big.deferred.length > 0 && big.text.startsWith('# ═══ response budget reached') && big.text.includes(JSON.stringify(big.deferred)))
check('budget: first requested doc served whole', big.found[0] === 'recipes/assembly-parameters')
const follow = await d.bulkDocs(big.deferred)
check('budget: follow-up call serves deferred keys', follow.found.length > 0)
const paged = await d.bulkDocs(['api/part'])
check('paging: oversized doc serves page 1 within budget', paged.text.length <= DOCS_RESPONSE_BUDGET && /page 1\/\d+/.test(paged.text) && paged.text.includes('"api/part#2"'))
const p2 = await d.bulkDocs(['api/part#2'])
check('paging: key#2 serves page 2', p2.found[0] === 'api/part#2' && /page 2\/\d+/.test(p2.text))
const pBad = await d.bulkDocs(['api/part#99'])
check('paging: out-of-range page reported', pBad.missing[0] === 'api/part#99' && pBad.text.includes('page(s)'))
const small = await d.bulkDocs(['v1.part.box', 'api/part'], null, { budget: 8000 })
check('budget option: host can lower the budget', small.found[0] === 'v1.part.box' && small.deferred[0] === 'api/part' && small.text.length <= 8000)
const dup = await d.bulkDocs(['v1.part.box', 'v1.part.box'])
check('duplicate keys served once', dup.found.length === 1)

// searchDocs — recipes and guides are findable by topic
const sd = d.searchDocs({ search: 'shared parameters across assembly parts' })
check('searchDocs finds assembly-parameters recipe first', sd.docs[0]?.key === 'recipes/assembly-parameters')
const sd2 = d.searchDocs({ search: 'rename expression binding' })
check('searchDocs finds guides (expression-workflow)', sd2.docs.some(x => x.key === 'part/expression-workflow'))
check('searchDocs excludes per-method notes and api overviews', d.searchDocs({ search: 'box' }).docs.every(x => x.key !== 'part/box' && !x.key.startsWith('api/')))
check('searchDocs empty query', d.searchDocs({ search: '' }).count === 0)
check('listDocs guides group', docs.guides.includes('part/expression-workflow') && !docs.guides.includes('part/box'))
const di = d.docIndex()
check('docIndex lists recipes and guides with titles', di.includes('recipes/assembly-parameters — ') && di.includes('assembly/generic — '))

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
