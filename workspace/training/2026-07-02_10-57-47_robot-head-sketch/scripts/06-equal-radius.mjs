// 06 — The clean encoding of "2×Ø5.6": ONE driving DIAMETER + EQUAL_RADIUS instead of two
// dims. A single updateDimension then re-sizes both bosses in one SOLVABLE step — no failed
// intermediate, so no stale bulge (the 04/05 bug never triggers). Verify exactness + bulges.
import { buildRobotHead, readback, compare } from './_build.mjs'
import { model, EXACT, LINE_KEYS, ARC_KEYS, CIRCLE_KEYS } from './_model.mjs'

const ALL_KEYS = [...LINE_KEYS.filter(k => k !== 'clh' && k !== 'clv'), ...ARC_KEYS, ...CIRCLE_KEYS]

export default async function (api, { snapshot, filewrite }) {
  const b = await buildRobotHead(api)

  // replace the left driving dim with an equality relation (delete BEFORE relating, else conflict)
  const del = await api.v1.sketch.deleteObject({ ids: [b.dimId.D56L] })
  const eq = await api.v1.sketch.constraint({ id: b.skId, type: 'EQUAL_RADIUS', geomIds: [b.id.bossL, b.id.bossR] })
  console.log('[06] delete D56L maxLevel:', del.maxLevel, '| EQUAL_RADIUS maxLevel:', eq.maxLevel)

  const bulgeOf = (tree, k) => (tree[b.id[k]] ?? Object.values(tree).find(n => n.id === b.id[k]))?.members?.bulge?.value ?? null
  const expBulge = (P, k) => {
    const M = model(P), g = M[k]
    const a0 = Math.atan2(g.s[1] - g.c[1], g.s[0] - g.c[0]), a1 = Math.atan2(g.e[1] - g.c[1], g.e[0] - g.c[0])
    let sweep = g.cw ? a0 - a1 : a1 - a0; while (sweep < 0) sweep += 2 * Math.PI
    return Math.tan(sweep / 4)
  }

  // ONE update drives both bosses
  const r = await api.v1.sketch.updateDimension({ id: b.dimId.D56R, value: 7 })
  const P7 = { ...EXACT, RB: 3.5 }
  const cmp7 = compare(await readback(api, b), model(P7), ['bossR', 'bossL', 'dome', 'f2R', 'f2L', 'sideR', 'sideL', 'holeR', 'holeL'])
  const bulges7 = ['bossL', 'bossR', 'dome'].map(k => ({ k, bulge: bulgeOf(r.structure.tree, k), exp: +expBulge(P7, k).toFixed(7) }))
  const fresh7 = bulges7.every(x => Math.abs(Math.abs(x.bulge) - x.exp) < 1e-4)
  console.log('[06] D56R→7 (single step): result', r.result, '| pos maxErr', cmp7.maxErr.toExponential(2), cmp7.pass ? '✓' : '❌', '| bulges', fresh7 ? '✓ all fresh' : '❌ ' + JSON.stringify(bulges7))
  await snapshot('06-boss7')

  // revert, full verify
  const r2 = await api.v1.sketch.updateDimension({ id: b.dimId.D56R, value: 5.6 })
  const cmp0 = compare(await readback(api, b), model(EXACT), ALL_KEYS)
  const bulges0 = ['bossL', 'bossR', 'dome'].map(k => ({ k, bulge: bulgeOf(r2.structure.tree, k), exp: +expBulge(EXACT, k).toFixed(7) }))
  const fresh0 = bulges0.every(x => Math.abs(Math.abs(x.bulge) - x.exp) < 1e-4)
  console.log('[06] revert 5.6: result', r2.result, '| pos maxErr', cmp0.maxErr.toExponential(2), cmp0.pass ? '✓' : '❌', '| bulges', fresh0 ? '✓ all fresh' : '❌ ' + JSON.stringify(bulges0))

  filewrite({ results: { up: r.result, down: r2.result }, cmp7: { maxErr: cmp7.maxErr, pass: cmp7.pass }, cmp0: { maxErr: cmp0.maxErr, pass: cmp0.pass }, bulges7, bulges0 }, 'equal-radius')
  return { singleStepSolved: r.result === 2, pass: cmp7.pass && cmp0.pass && fresh7 && fresh0 }
}
