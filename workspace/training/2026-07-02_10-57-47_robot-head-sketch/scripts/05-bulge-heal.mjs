// 05 — Workaround probe for the stale-bulge bug (04): after reproducing the stale bossL
// bulge, does (a) common.recalc or (b) a redundant same-value updateDimension refresh it?
import { buildRobotHead } from './_build.mjs'
import { model, EXACT } from './_model.mjs'

export default async function (api, { snapshot, filewrite }) {
  const b = await buildRobotHead(api)
  const M7 = model({ ...EXACT, RB: 3.5 })
  const a0 = Math.atan2(M7.bossL.s[1], M7.bossL.s[0] + 6), a1 = Math.atan2(M7.bossL.e[1], M7.bossL.e[0] + 6)
  let sweep = a1 - a0; while (sweep < 0) sweep += 2 * Math.PI
  const expBulge = Math.tan(sweep / 4)

  const bulgeOf = tree => {
    const node = tree[b.id.bossL] ?? Object.values(tree).find(n => n.id === b.id.bossL)
    return node?.members?.bulge?.value ?? null
  }
  const stale = v => v == null || Math.abs(Math.abs(v) - expBulge) > 1e-4

  const rL = await api.v1.sketch.updateDimension({ id: b.dimId.D56L, value: 7 })
  const rR = await api.v1.sketch.updateDimension({ id: b.dimId.D56R, value: 7 })
  const s0 = bulgeOf(rR.structure.tree)
  console.log('[05] after L(0)/R(2):', rL.result, rR.result, 'bossL bulge', s0, 'exp±', +expBulge.toFixed(7), stale(s0) ? 'STALE' : 'fresh (bug did not reproduce)')

  // (a) common.recalc
  const rc = await api.v1.common.recalc({})
  const s1 = bulgeOf(rc.structure?.tree ?? {})
  console.log('[05] after common.recalc:', 'maxLevel', rc.maxLevel, 'bulge', s1, stale(s1) ? 'still STALE' : '✓ healed')

  // (b) redundant same-value re-set on the affected side
  const rAgain = await api.v1.sketch.updateDimension({ id: b.dimId.D56L, value: 7 })
  const s2 = bulgeOf(rAgain.structure.tree)
  console.log('[05] after re-set L=7:', 'result', rAgain.result, 'bulge', s2, stale(s2) ? 'still STALE' : '✓ healed')

  await snapshot('05-final')
  filewrite({ expBulge, seq: { rL: rL.result, rR: rR.result }, bulges: { afterUpdates: s0, afterRecalc: s1, afterReset: s2 } }, 'heal')
  return { reproduced: stale(s0), recalcHeals: !stale(s1), resetHeals: !stale(s2) }
}
