// 04 — discriminator: full build with EXACT seeds (zero motion needed anywhere; every
// constraint and dimension is already satisfied at creation). EQ constraints applied one by
// one to pinpoint any structural trigger of the CalcBulges failure.
//   still 51 → the constraint GRAPH is the problem (independent of solve motion)
//   all 31   → the failure is motion-scale; fix = staged dimension driving
import { model, EXACT, VERIFY_KEYS } from './_model.mjs'
import { buildMountingPlate, readback, compare } from './_build.mjs'

export default async function (api, { filewrite }) {
  const ctx = await buildMountingPlate(api, { params: EXACT, eqIndividual: true })
  console.log('[04] maxLevels:', JSON.stringify(ctx.maxLevels))
  for (const [k, msgs] of Object.entries(ctx.msgs)) {
    for (const m of msgs ?? []) if (m.level >= 41) console.log(`[04] ${k}: L${m.level} ${m.message.slice(0, 120)}`)
  }
  const rb = await readback(api, ctx)
  const cmp = compare(rb, model(EXACT), VERIFY_KEYS)
  filewrite(cmp.rows, 'compare-exact')
  console.log('[04] maxErr:', cmp.maxErr, cmp.pass ? '✓ PASS (motion-scale problem)' : '❌ FAIL (structural problem)')
  if (!cmp.pass) for (const r of cmp.rows.filter(r => r.err > 1e-6).slice(0, 8)) console.log('   ✗', JSON.stringify(r))
  return { partId: ctx.partId, pass: cmp.pass }
}
