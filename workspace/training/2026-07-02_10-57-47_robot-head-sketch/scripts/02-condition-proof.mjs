// 02 — Conditioning proof: the sketch is a conditioned model, not a coordinate dump.
// Re-dimension boss Ø5.6→7 (dome + R2 fillets + tangents must re-solve), revert; widen the
// slot 3→4, revert. Every state is verified against the SAME analytic model with the
// changed parameter — the payoff of the parametric _model.mjs.
import { buildRobotHead, readback, compare } from './_build.mjs'
import { model, EXACT, LINE_KEYS, ARC_KEYS, CIRCLE_KEYS } from './_model.mjs'

const ALL_KEYS = [...LINE_KEYS.filter(k => k !== 'clh' && k !== 'clv'), ...ARC_KEYS, ...CIRCLE_KEYS]

export default async function (api, { snapshot, filewrite }) {
  const b = await buildRobotHead(api)
  // updateDimension: SINGLE calls only — the batch/array form returns result:null (no error)
  const upd = async (names, value) => {
    const out = []
    for (const n of names) {
      const r = await api.v1.sketch.updateDimension({ id: b.dimId[n], value })
      out.push(`${n}=${r.result}(max${r.maxLevel})`)
    }
    return out.join(' ')
  }

  const states = []
  const verify = async (label, params, keys = ALL_KEYS) => {
    const cmp = compare(await readback(api, b), model(params), keys)
    states.push({ label, maxErr: cmp.maxErr, pass: cmp.pass, rows: cmp.rows.filter(r => r.err > 1e-6) })
    console.log(`[02] ${label}: maxErr ${cmp.maxErr.toExponential(2)} ${cmp.pass ? '✓' : '❌'}`)
    return cmp
  }

  // 1) boss Ø 5.6 → 7: dome center, dome↔boss tangents, R2 fillets all move
  const r1 = await upd(['D56L', 'D56R'], 7)
  console.log('[02] updateDimension D56→7 result:', JSON.stringify(r1))
  await verify('boss Ø7', { ...EXACT, RB: 3.5 }, ['bossR', 'bossL', 'dome', 'f2R', 'f2L', 'sideR', 'sideL', 'holeR', 'holeL'])
  await snapshot('02-boss7')

  // 2) revert
  await upd(['D56L', 'D56R'], 5.6)
  await verify('revert Ø5.6', EXACT)

  // 3) slot width 3 → 4: slot lines to ±2, corner centers to ±1
  const r3 = await upd(['W3'], 4)
  console.log('[02] updateDimension W3→4 result:', JSON.stringify(r3))
  await verify('slot w4', { ...EXACT, SW: 2 }, ['slotTR', 'slotTop', 'slotTL', 'slotLeft', 'slotBL', 'slotBottom', 'slotBR', 'slotRight'])
  await snapshot('02-slot4')

  // 4) revert + full final check
  await upd(['W3'], 3)
  const final = await verify('revert w3 (full)', EXACT)
  await snapshot('02-restored')

  filewrite({ states }, 'condition-proof')
  return { pass: states.every(s => s.pass), finalMaxErr: final.maxErr }
}
