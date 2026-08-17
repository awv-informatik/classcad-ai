// 01 — build the mounting plate from ROUGH seeds; the drawing's dimensions drive the solver.
// Verify every solved junction/center against model(EXACT), then pattern the 6 bolt holes.
import { model, EXACT, ROUGH, VERIFY_KEYS } from './_model.mjs'
import { buildMountingPlate, patternBoltHoles, readback, compare } from './_build.mjs'

export default async function (api, { snapshot, filewrite }) {
  const ctx = await buildMountingPlate(api, { params: ROUGH })
  console.log('[01] maxLevels:', JSON.stringify(ctx.maxLevels))
  console.log('[01] dims:', JSON.stringify(ctx.dimId))

  // numeric proof: solved positions vs analytic EXACT model
  const rb = await readback(api, ctx)
  const cmp = compare(rb, model(EXACT), VERIFY_KEYS)
  filewrite(cmp.rows, 'compare-exact')
  console.log('[01] compare rows:', cmp.rows.length, 'maxErr:', cmp.maxErr, cmp.pass ? '✓ PASS' : '❌ FAIL')
  if (!cmp.pass) {
    for (const row of cmp.rows.filter(r => r.err > 1e-6).slice(0, 12)) console.log('   ✗', JSON.stringify(row))
  }

  // "6 отв.": circular pattern about the hub center, then verify all 6 centers
  const pat = await patternBoltHoles(api, ctx)
  console.log('[01] pattern maxLevel:', pat.maxLevel, 'copies:', JSON.stringify(pat.copies))
  const targets = model(EXACT).boltHoles.map(p => [+p[0].toFixed(9), +p[1].toFixed(9)])
  const centers = []
  for (const cid of [ctx.id.hole6, ...pat.copies]) {
    const cp = (await api.v1.sketch.getPoints({ id: cid })).result?.centerId
    const p = cp ? (await api.v1.sketch.getPositions({ id: cp })).result?.pos : null
    if (p) centers.push([p.x, p.y])
  }
  const holeErr = Math.max(...centers.map(c =>
    Math.min(...targets.map(t => Math.hypot(c[0] - t[0], c[1] - t[1])))))
  filewrite({ targets, centers, holeErr }, 'bolt-holes')
  console.log('[01] bolt holes:', centers.length, 'maxErr(nearest target):', holeErr, holeErr <= 1e-6 ? '✓' : '❌')

  await snapshot('mounting-plate')
  return { partId: ctx.partId, skId: ctx.skId, pass: cmp.pass, holeErr }
}
