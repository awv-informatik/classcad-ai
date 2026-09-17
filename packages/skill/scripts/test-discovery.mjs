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
check('array search, names only: grouped string names', or.count > 0 && or.groups.every(g => typeof g.methods[0] === 'string'))
const all = d.searchMethods({})
check('full listing covers whole registry', all.count === Object.keys(registry).length)
const dom = d.searchMethods({ domain: 'sketch', withSummaries: false })
check('domain filter', dom.count > 0 && dom.methods.every(m => m.startsWith('v1.sketch.')))
const none = d.searchMethods({ search: 'zzzznope' })
check('no-hit carries do-not-assume note', none.count === 0 && /Do NOT assume/.test(none.note))
const capped = d.searchMethods({ search: 'create', limit: 5 })
check('cap reported', capped.methods.length === 5 && /showing 5 of/.test(capped.note))
// grouped search: one ranked group per array entry
const grouped = d.searchMethods({ search: ['assembly', 'box', 'mass properties', 'shared parameters assembly'], limit: 5 })
check('array of 2+ entries returns one group per entry', grouped.groups?.length === 4 && !grouped.methods)
check('broad entry does not crowd out others', grouped.groups[1].methods.some(m => m.method === 'v1.part.box'))
check('per-group cap', grouped.groups.every(g => g.methods.length <= 5))
check('exact method name ranks first', d.searchMethods({ search: ['box', 'cylinder'] }).groups.every((g, i) => g.methods[0].method === ['v1.part.box', 'v1.part.cylinder'][i]))
const overlap = d.searchMethods({ search: ['assembly instance', 'product instance'] })
check('repeat marked seeAbove', overlap.groups[1].methods.some(m => m.seeAbove === 'assembly instance' && !m.summary))
check('workflow-like entry gets a docs note', /workflow/.test(grouped.groups[3].note) && !/workflow/.test(grouped.groups[2].note ?? '') && !/workflow/.test(grouped.groups[0].note ?? ''))
check('filler words ignored', d.searchMethods({ search: 'rotate in a' }).count < d.searchMethods({ search: 'in a' }).count + 50 && d.searchMethods({ search: 'in a' }).count === 0)
check('domain word matches the domain, not every name', d.searchMethods({ search: ['part box', 'x'] }).groups[0].methods[0].method === 'v1.part.box')
check('single-entry array keeps flat list', Array.isArray(d.searchMethods({ search: ['box'] }).methods))
// BM25: whole words, camelCase split, plurals folded, rare words weigh more
const names = (q, n = 5) => d.searchMethods({ search: q, limit: n, withSummaries: false }).methods
check('whole-word match: no substring noise for "hole"', !names('hole', 20).includes('v1.common.recalc') && names('hole', 20).includes('v1.solid.subtraction'))
check('camelCase acronym stays whole ("work csys" → workCSys)', names('work csys')[0] === 'v1.part.workCSys')
check('compound word matches camelCase name ("workplane")', names('workplane').includes('v1.part.workPlane'))
check('plurals fold ("boxes" → part.box)', names('boxes').includes('v1.part.box'))
check('terse summary does not outrank the part feature', names('box')[0] === 'v1.part.box')
check('synonym-only matches still found ("round edges" → fillet)', names('round edges').some(m => m.endsWith('.fillet')))
check('rare word decides ("fastened constraint" → assembly.fastened first)', names('fastened constraint')[0] === 'v1.assembly.fastened')
// words agents use that the API never does (from agent runs)
check('"tag label attribute" → setUserData', names('tag label attribute')[0] === 'v1.common.setUserData')
check('"export step" → common.save (via notes + synonyms)', names('export step')[0] === 'v1.common.save')
check('"hole" surfaces the boolean subtraction', names('hole').includes('v1.part.boolean') && names('hole').includes('v1.solid.subtraction'))
const hint = d.searchMethods({ search: ['bore hole', 'box'] }).groups[0].note
check('workflow-like group names the best document', /recipes\/pattern-then-subtract/.test(hint))
check('"through" is a filler word ("through hole" → subtraction first)', names('through hole')[0] === 'v1.solid.subtraction')
const inPart = d.searchMethods({ domain: 'part', search: ['export', 'box'] }).groups
check('weak group under a domain filter says so', /in the part domain \(try without `domain`\)/.test(inPart[0].note) && !inPart[1].note)

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
