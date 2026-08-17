// 07 — the canonical mounting-plate build: rough seeds, gen* OFF, fully explicit constraint
// set, one driving dim per drawing annotation (R3 ties all four fillets via EQUAL_RADIUS),
// 6-hole circular pattern. Verifies vs model(EXACT), confirms ZERO Auto_* constraints exist,
// and snapshots the finished sketch.
import { model, EXACT, ROUGH, VERIFY_KEYS } from './_model.mjs'
import { buildMountingPlate, patternBoltHoles, readback, compare } from './_build.mjs'

export default async function (api, { snapshot, filewrite }) {
  const ctx = await buildMountingPlate(api, {
    params: ROUGH,
    gen: { genIncidence: false, genTangency: false, genVertAndHoriz: false },
    eqCross: true,
  })
  console.log('[07] maxLevels:', JSON.stringify(ctx.maxLevels))

  const rb = await readback(api, ctx)
  const cmp = compare(rb, model(EXACT), VERIFY_KEYS)
  filewrite(cmp.rows, 'compare-exact')
  console.log('[07] compare rows:', cmp.rows.length, 'maxErr:', cmp.maxErr, cmp.pass ? '✓ PASS' : '❌ FAIL')

  const pat = await patternBoltHoles(api, ctx)
  const targets = model(EXACT).boltHoles
  const centers = []
  for (const cid of [ctx.id.hole6, ...pat.copies]) {
    const cp = (await api.v1.sketch.getPoints({ id: cid })).result?.centerId
    const p = cp ? (await api.v1.sketch.getPositions({ id: cp })).result?.pos : null
    if (p) centers.push([p.x, p.y])
  }
  const holeErr = Math.max(...centers.map(c =>
    Math.min(...targets.map(t => Math.hypot(c[0] - t[0], c[1] - t[1])))))
  console.log('[07] bolt holes:', centers.length, 'maxErr:', holeErr, holeErr <= 1e-6 ? '✓' : '❌')

  // confirm the no-autos regime: not a single Auto_* constraint in the sketch
  const tree = (await api.v1.sketch.getGeometry({ id: ctx.skId })).structure?.tree ?? {}
  const autos = Object.values(tree).filter(n => typeof n.name === 'string' && n.name.startsWith('Auto_'))
  console.log('[07] Auto_* constraints:', autos.length, autos.length === 0 ? '✓ none' : '❌ present')

  filewrite({ maxLevels: ctx.maxLevels, maxErr: cmp.maxErr, holeErr, autoCount: autos.length, dimId: ctx.dimId }, 'summary')
  await snapshot('mounting-plate-final')
  return { partId: ctx.partId, pass: cmp.pass && holeErr <= 1e-6 && autos.length === 0 }
}
