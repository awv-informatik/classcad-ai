// 09 — verify the CopyObjects fix: copyGeometry with doCopyConstraints TRUE/default should now RETURN the ids
// (was null before the fix). false is the control (always returned ids).
import { makeSketch, line } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api, { name: 'VerifyFix' })
  const l = await line(api, skId, [0, 0, 0], [40, 0, 0])
  const rDefault = await api.v1.sketch.copyGeometry({ id: skId, geomIds: [l], translation: [0, 20, 0] })                       // default true
  const rTrue = await api.v1.sketch.copyGeometry({ id: skId, geomIds: [l], translation: [0, 40, 0], doCopyConstraints: true })  // explicit true
  const rFalse = await api.v1.sketch.copyGeometry({ id: skId, geomIds: [l], translation: [0, 60, 0], doCopyConstraints: false }) // control
  const shape = r => Array.isArray(r?.result) ? `id[${r.result.length}]` : (r?.result == null ? 'null/VOID' : typeof r.result)
  const out = {
    default: { result: rDefault?.result ?? null, type: shape(rDefault) },
    true: { result: rTrue?.result ?? null, type: shape(rTrue) },
    false: { result: rFalse?.result ?? null, type: shape(rFalse) },
  }
  filewrite(out, '09-verify-fix')
  console.log('[09] default(true) ->', out.default.type, JSON.stringify(out.default.result))
  console.log('[09] explicit true ->', out.true.type, JSON.stringify(out.true.result))
  console.log('[09] false (ctrl)  ->', out.false.type, JSON.stringify(out.false.result))
  const fixed = Array.isArray(out.default.result) && Array.isArray(out.true.result)
  console.log('[09]', fixed ? 'FIXED — true now returns ids' : 'NOT fixed — true still null')
  return out
}
