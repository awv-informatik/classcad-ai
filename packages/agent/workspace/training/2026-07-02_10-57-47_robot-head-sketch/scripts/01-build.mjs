// 01 — Build the robot head from ROUGH seeds, constrain + dimension, verify the solver landed
// every junction/center on the analytic exact values from the drawing's dimension scheme.
// v2: full Ø5.6 eye circles; dome/R2-fillet endpoints pinned ON them (tangent points).
import { buildRobotHead, readback, compare } from './_build.mjs'
import { model, EXACT, LINE_KEYS, ARC_KEYS, CIRCLE_KEYS } from './_model.mjs'

export default async function (api, { snapshot, filewrite }) {
  const b = await buildRobotHead(api, {
    onGeometry: () => snapshot('01-seed'), // rough skeleton before any constraint
  })
  console.log('[01] maxLevels — fix:', b.maxLevels.fix, 'rel:', b.maxLevels.rel, 'dim:', b.maxLevels.dim)
  await snapshot('01-solved')

  const rb = await readback(api, b)
  const M = model(EXACT)
  const keys = [...LINE_KEYS.filter(k => k !== 'clh' && k !== 'clv'), ...ARC_KEYS, ...CIRCLE_KEYS]
  const cmp = compare(rb, M, keys)

  // slot center mark (bare point → read directly)
  const pc = (await api.v1.sketch.getPositions({ id: b.slotCenterId })).result
  const centerGot = pc?.pos ? [pc.pos.x, pc.pos.y] : null
  const centerErr = centerGot ? Math.hypot(centerGot[0] - M.slotCenter.p[0], centerGot[1] - M.slotCenter.p[1]) : Infinity

  // drawing cross-checks derived from solved geometry
  const derived = {
    slotCenter: centerGot,                                // (0, −2.5): drawing's 3.5 above slot bottom
    slotMidY: (rb.slotTop.s[1] + rb.slotBottom.s[1]) / 2, // must equal the center mark's y
    slotHeight: rb.slotTop.s[1] - rb.slotBottom.s[1],     // 7
    domeTopY: rb.dome.c[1] + Math.hypot(rb.dome.s[0] - rb.dome.c[0], rb.dome.s[1] - rb.dome.c[1]), // 5.0257615
    eyeSpan: rb.holeR.c[0] - rb.holeL.c[0],               // 12
    // tangency proof: dome/fillet endpoints ON the Ø5.6 circles (distance to eye center = 2.8)
    domeEndOnEyeR: Math.hypot(rb.dome.s[0] - rb.bossR.c[0], rb.dome.s[1] - rb.bossR.c[1]),
    f2EndOnEyeR: Math.hypot(rb.f2R.e[0] - rb.bossR.c[0], rb.f2R.e[1] - rb.bossR.c[1]),
  }
  filewrite({ maxLevels: b.maxLevels, relIds: b.relIds, dimId: b.dimId, comparison: cmp, centerErr, derived }, 'verify')

  const pass = cmp.pass && centerErr <= 1e-6
  const bad = cmp.rows.filter(r => r.err > 1e-6)
  console.log('[01] comparison rows:', cmp.rows.length + 1, 'maxErr:', Math.max(cmp.maxErr, centerErr), pass ? '✓ ALL EXACT' : `❌ ${bad.length} off`)
  for (const r of bad.slice(0, 12)) console.log('  off:', r.key, r.what, 'got', JSON.stringify(r.got), 'want', JSON.stringify(r.want))
  console.log('[01] derived:', JSON.stringify(derived))
  return { pass, maxErr: Math.max(cmp.maxErr, centerErr), maxLevels: b.maxLevels }
}
