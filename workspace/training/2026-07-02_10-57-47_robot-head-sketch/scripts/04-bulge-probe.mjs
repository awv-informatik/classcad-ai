// 04 — Investigate the dome↔bossL notch seen in the 02-boss7 snapshot. Readback proved
// endpoints/centers/radii exact, so the suspect is the arcs' `bulge` member (what the
// renderer tessellates from): is it stale after the failed(0)→solved(2) update sequence?
import { buildRobotHead, readback } from './_build.mjs'
import { model, EXACT, ARC_KEYS } from './_model.mjs'

const sweepOf = (g) => {
  const a0 = Math.atan2(g.s[1] - g.c[1], g.s[0] - g.c[0])
  const a1 = Math.atan2(g.e[1] - g.c[1], g.e[0] - g.c[0])
  let sweep = g.cw ? a0 - a1 : a1 - a0
  while (sweep < 0) sweep += 2 * Math.PI
  return sweep
}

export default async function (api, { snapshot, filewrite }) {
  const b = await buildRobotHead(api)

  const rL = await api.v1.sketch.updateDimension({ id: b.dimId.D56L, value: 7 })
  const rR = await api.v1.sketch.updateDimension({ id: b.dimId.D56R, value: 7 })
  console.log('[04] update results — L:', rL.result, 'R:', rR.result)
  await snapshot('04-boss7')

  const M7 = model({ ...EXACT, RB: 3.5 })
  const tree = rR.structure.tree
  const rb = await readback(api, b)
  const rows = ARC_KEYS.map(k => {
    const node = tree[b.id[k]] ?? Object.values(tree).find(n => n.id === b.id[k])
    const bulge = node?.members?.bulge?.value ?? null
    const expSweep = sweepOf(M7[k])
    const expBulge = Math.tan(expSweep / 4)
    // sweep implied by SOLVED endpoints/center (minor-or-major resolved via expected)
    const g = rb[k]
    const a0 = Math.atan2(g.s[1] - g.c[1], g.s[0] - g.c[0])
    const a1 = Math.atan2(g.e[1] - g.c[1], g.e[0] - g.c[0])
    let sGeo = M7[k].cw ? a0 - a1 : a1 - a0
    while (sGeo < 0) sGeo += 2 * Math.PI
    return {
      k, bulge, absBulge: bulge == null ? null : Math.abs(bulge), expBulge: +expBulge.toFixed(7),
      sweepFromGeomDeg: +(sGeo * 180 / Math.PI).toFixed(4), expSweepDeg: +(expSweep * 180 / Math.PI).toFixed(4),
      bulgeStale: bulge != null && Math.abs(Math.abs(bulge) - expBulge) > 1e-4,
    }
  })
  console.table ? null : null
  for (const r of rows) console.log('[04]', r.k.padEnd(9), 'bulge', String(r.bulge).slice(0, 12), 'exp±', r.expBulge, 'sweep', r.sweepFromGeomDeg, 'expSweep', r.expSweepDeg, r.bulgeStale ? '❌ STALE' : '✓')

  // revert and re-check the two boss arcs + dome
  const rL2 = await api.v1.sketch.updateDimension({ id: b.dimId.D56L, value: 5.6 })
  const rR2 = await api.v1.sketch.updateDimension({ id: b.dimId.D56R, value: 5.6 })
  const M0 = model(EXACT)
  const tree2 = rR2.structure.tree
  const rows2 = ['bossL', 'bossR', 'dome', 'f2L', 'f2R'].map(k => {
    const node = tree2[b.id[k]] ?? Object.values(tree2).find(n => n.id === b.id[k])
    const bulge = node?.members?.bulge?.value ?? null
    const expBulge = Math.tan(sweepOf(M0[k]) / 4)
    return { k, bulge, expBulge: +expBulge.toFixed(7), bulgeStale: bulge != null && Math.abs(Math.abs(bulge) - expBulge) > 1e-4 }
  })
  for (const r of rows2) console.log('[04:restored]', r.k.padEnd(6), 'bulge', String(r.bulge).slice(0, 12), 'exp±', r.expBulge, r.bulgeStale ? '❌ STALE' : '✓')
  await snapshot('04-restored')

  filewrite({ updateResults: { L: rL.result, R: rR.result, L2: rL2.result, R2: rR2.result }, boss7: rows, restored: rows2 }, 'bulge-probe')
  return { stale7: rows.filter(r => r.bulgeStale).map(r => r.k), staleRestored: rows2.filter(r => r.bulgeStale).map(r => r.k) }
}
