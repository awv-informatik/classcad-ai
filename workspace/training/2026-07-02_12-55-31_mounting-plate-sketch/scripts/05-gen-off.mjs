// 05 — full ROUGH build with ALL auto-constraint generation OFF. The isolation probes (03)
// were stable and used individual creators (no auto-generation); the failing full builds used
// the geometry batch with gen* ON, duplicating every explicit constraint (seeds are exactly
// tangent/coincident). Hypothesis: the ~50 auto-duplicates make DoSolve diverge at scale.
import { model, EXACT, ROUGH, VERIFY_KEYS } from './_model.mjs'
import { buildMountingPlate, patternBoltHoles, readback, compare } from './_build.mjs'

export default async function (api, { snapshot, filewrite }) {
  const ctx = await buildMountingPlate(api, {
    params: ROUGH,
    gen: { genIncidence: false, genTangency: false, genVertAndHoriz: false },
  })
  console.log('[05] maxLevels:', JSON.stringify(ctx.maxLevels))
  for (const [k, msgs] of Object.entries(ctx.msgs)) {
    for (const m of msgs ?? []) if (m.level >= 41) console.log(`[05] ${k}: L${m.level} ${m.message.slice(0, 110)}`)
  }
  const rb = await readback(api, ctx)
  const cmp = compare(rb, model(EXACT), VERIFY_KEYS)
  filewrite(cmp.rows, 'compare-exact')
  console.log('[05] maxErr:', cmp.maxErr, cmp.pass ? '✓ PASS' : '❌ FAIL')
  if (!cmp.pass) for (const r of cmp.rows.filter(r => r.err > 1e-6).slice(0, 10)) console.log('   ✗', JSON.stringify(r))

  const pat = await patternBoltHoles(api, ctx)
  console.log('[05] pattern maxLevel:', pat.maxLevel, 'copies:', pat.copies.length)
  await snapshot('mounting-plate')
  return { partId: ctx.partId, pass: cmp.pass }
}
