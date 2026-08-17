// 10 — un-confound the gen* attribution: scripts 01/02/04 all ALSO carried the left-fillet
// mis-wiring (fixed in 05). This is exactly script 07 (fixed model, eqCross) but with the
// auto-constraint generation back ON. PASS → the wreck was (partly) the mis-wiring;
// FAIL → auto-dupes alone break the exactly-seeded dense build.
import { model, EXACT, ROUGH, VERIFY_KEYS } from './_model.mjs'
import { buildMountingPlate, readback, compare } from './_build.mjs'

export default async function (api, { filewrite }) {
  const ctx = await buildMountingPlate(api, { params: ROUGH, eqCross: true }) // gen defaults ON
  console.log('[10] maxLevels:', JSON.stringify(ctx.maxLevels))
  for (const [k, msgs] of Object.entries(ctx.msgs)) {
    for (const m of msgs ?? []) if (m.level >= 41) console.log(`[10] ${k}: L${m.level} ${m.message.slice(0, 100)}`)
  }
  const rb = await readback(api, ctx)
  const cmp = compare(rb, model(EXACT), VERIFY_KEYS)
  filewrite(cmp.rows, 'compare-exact')
  console.log('[10] maxErr:', cmp.maxErr, cmp.pass ? '✓ PASS — autos tolerated with correct wiring' : '❌ FAIL — auto-dupes break it regardless')
  if (!cmp.pass) for (const r of cmp.rows.filter(r => r.err > 1e-6).slice(0, 8)) console.log('   ✗', JSON.stringify(r))
  return { partId: ctx.partId, pass: cmp.pass }
}
