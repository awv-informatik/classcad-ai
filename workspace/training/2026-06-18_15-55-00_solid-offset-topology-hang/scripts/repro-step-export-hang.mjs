// ───────────────────────────────────────────────────────────────────────────
// Minimal repro: STEP export hangs the server (100% CPU, kill -9 only) after a
// multi-tool boolean partially fails.
//
// Mechanism:
//   1. A single subtraction call with 3 tools is issued. The 1st tool cuts fine;
//      a later tool is non-manifold against the result, so the call FAILS
//      (maxLevel 51). ClassCAD has already removed the consumed tool(s), but the
//      cclass-level cleanup never runs (the call aborted), leaving dangling
//      "ghost" references to deleted solids in the model.
//   2. common.save(STP) walks the model and dereferences a ghost's freed kernel
//      pointer -> dynamic_cast fault-loops forever in SMLibExpressService.
//
// Note: solid.box is CENTERED at the origin, so the box spans x[-30,30] y[-20,20].
// Cylinders at x=45 / y=30 lie outside it -> that's what makes the multi-tool
// subtraction go non-manifold and fail partway.
// ───────────────────────────────────────────────────────────────────────────
export default async function (api, { filewrite }) {
  // 10s guard so the hang shows up as a timeout instead of wedging the harness.
  // Remove it and common.save never returns (worker pegs at 100% CPU).
  const withTimeout = (p, ms, label) =>
    Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`HUNG (${ms}ms timeout): ${label}`)), ms))])

  const part = (await api.v1.part.create({ name: 'StepExportHang' })).result
  const eif = (await api.v1.part.entityInjection({ id: part })).result

  const box = (await api.v1.solid.box({ id: eif, length: 60, width: 40, height: 30 })).result
  const c1 = (await api.v1.solid.cylinder({ id: eif, height: 50, diameter: 10, translation: [15, 15, -5] })).result
  const c2 = (await api.v1.solid.cylinder({ id: eif, height: 50, diameter: 10, translation: [45, 15, -5] })).result
  const c3 = (await api.v1.solid.cylinder({ id: eif, height: 50, diameter: 10, translation: [30, 30, -5] })).result

  // Step 1 — multi-tool subtraction that partially fails (returns maxLevel 51).
  const sub = await api.v1.solid.subtraction({ id: eif, target: box, tools: [c1, c2, c3] })
  console.log('subtraction maxLevel:', sub.maxLevel, '(expected 51 — partial/nonmanifold failure)')

  // Step 2 — export the now-inconsistent model. THIS HANGS.
  try {
    const r = await withTimeout(
      api.v1.common.save({ format: 'STP', encoding: 'base64', stp: { version: 2 } }),
      10000,
      'common.save STP',
    )
    console.log('save returned: maxLevel', r.maxLevel) // not reached on an affected build
    filewrite({ subMaxLevel: sub.maxLevel, save: { maxLevel: r.maxLevel } }, 'repro-result')
  } catch (e) {
    console.error(e.message) // -> "HUNG (10000ms timeout): common.save STP"
    filewrite({ subMaxLevel: sub.maxLevel, save: { hung: true } }, 'repro-result')
  }

  return { box, c1, c2, c3 }
}
