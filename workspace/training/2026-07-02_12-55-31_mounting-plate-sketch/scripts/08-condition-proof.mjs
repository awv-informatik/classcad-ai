// 08 — conditioning proof: the sketch is a MODEL, not a coordinate dump. Re-dimension
// R98→90 and the 30°→25° after the build; every blend, notch, edge and fillet must re-solve
// to the analytically recomputed layout (model with RP=90, TH=25) — nothing is re-seeded.
import { model, EXACT, ROUGH, VERIFY_KEYS } from './_model.mjs'
import { buildMountingPlate, readback, compare } from './_build.mjs'

export default async function (api, { snapshot, filewrite }) {
  const ctx = await buildMountingPlate(api, {
    params: ROUGH,
    gen: { genIncidence: false, genTangency: false, genVertAndHoriz: false },
    eqCross: true,
  })
  const rb0 = await readback(api, ctx)
  const cmp0 = compare(rb0, model(EXACT), VERIFY_KEYS)
  console.log('[08] baseline maxErr:', cmp0.maxErr, cmp0.pass ? '✓' : '❌')

  const u1 = await api.v1.sketch.updateDimension({ id: ctx.dimId.R98, value: 90 })
  console.log('[08] R98 → 90: result', u1.result, 'maxLevel', u1.maxLevel)
  const u2 = await api.v1.sketch.updateDimension({ id: ctx.dimId.A30, value: '25deg' })
  console.log('[08] A30 → 25°: result', u2.result, 'maxLevel', u2.maxLevel)

  const M2 = model({ ...EXACT, RP: 90, TH: 25 })
  const rb = await readback(api, ctx)
  const cmp = compare(rb, M2, VERIFY_KEYS)
  filewrite(cmp.rows, 'compare-conditioned')
  console.log('[08] re-solved maxErr vs model(RP=90,TH=25):', cmp.maxErr, cmp.pass ? '✓ CONDITIONED' : '❌ FAIL')
  if (!cmp.pass) for (const r of cmp.rows.filter(r => r.err > 1e-6).slice(0, 10)) console.log('   ✗', JSON.stringify(r))

  await snapshot('mounting-plate-conditioned')
  return { partId: ctx.partId, pass: cmp.pass, solved: [u1.result, u2.result] }
}
