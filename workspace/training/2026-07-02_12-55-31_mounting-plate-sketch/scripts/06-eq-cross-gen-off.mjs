// 06 — un-confound the script-04 finding: cross-side EQUAL_RADIUS between the four r=3
// fillet arcs, but now WITHOUT auto-constraints (04 ran with gen* ON). If this passes, the
// one-R3-dim + EQUAL_RADIUS×3 encoding is fine and 04's failure was an auto-dupe interaction.
import { model, EXACT, ROUGH, VERIFY_KEYS } from './_model.mjs'
import { buildMountingPlate, readback, compare } from './_build.mjs'

export default async function (api, { filewrite }) {
  const ctx = await buildMountingPlate(api, {
    params: ROUGH,
    gen: { genIncidence: false, genTangency: false, genVertAndHoriz: false },
    eqCross: true,
    eqIndividual: true,
  })
  console.log('[06] maxLevels:', JSON.stringify(ctx.maxLevels))
  for (const [k, msgs] of Object.entries(ctx.msgs)) {
    for (const m of msgs ?? []) if (m.level >= 41) console.log(`[06] ${k}: L${m.level} ${m.message.slice(0, 110)}`)
  }
  const rb = await readback(api, ctx)
  const cmp = compare(rb, model(EXACT), VERIFY_KEYS)
  filewrite(cmp.rows, 'compare-exact')
  console.log('[06] maxErr:', cmp.maxErr, cmp.pass ? '✓ PASS — 04 finding was auto-dupe confounded' : '❌ FAIL — cross-side EQUAL_RADIUS broken regardless of gen*')
  if (!cmp.pass) for (const r of cmp.rows.filter(r => r.err > 1e-6).slice(0, 8)) console.log('   ✗', JSON.stringify(r))
  return { partId: ctx.partId, pass: cmp.pass }
}
