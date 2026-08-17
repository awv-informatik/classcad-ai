// 08 — postTrim id semantics: (A) no-trim -> originals preserved; (B) trim one half -> trimmed line gets
// NEW id, untrimmed keeps ORIGINAL; (C) trim([]) -> survivors recreated with NEW ids.
import { makeSketch, addSketch, line, positions, vecApprox } from './_setup.mjs'

async function segTouching(api, entry, point) {
  for (const s of entry.splittedCurves) { const p = await positions(api, s.id); if (vecApprox(p.startPos, point, 1e-6) || vecApprox(p.endPos, point, 1e-6)) return s.id }
  return null
}
const crossed = async (api, sk) => ({ A: await line(api, sk, [0, 0, 0], [100, 100, 0]), B: await line(api, sk, [0, 100, 0], [100, 0, 0]) })

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)

  // A: no trim
  const a = await crossed(api, skId)
  await api.v1.sketch.preTrim({ id: skId })
  await api.v1.sketch.postTrim({ id: skId })
  const geoA = (await api.v1.sketch.getGeometry({ id: skId })).result.lines
  const A = { originals: [a.A, a.B], after: geoA, preserved: geoA.includes(a.A) && geoA.includes(a.B) }
  console.log('[08] A no-trim: originals', JSON.stringify(A.originals), 'after', JSON.stringify(geoA), 'preserved', A.preserved)

  // B: trim one half of line A
  const skB = await addSketch(api, partId, planeId, 'B')
  const b = await crossed(api, skB)
  const preB = await api.v1.sketch.preTrim({ id: skB })
  const half = await segTouching(api, preB.result.find(e => e.sourceId === b.A), [0, 0, 0])
  await api.v1.sketch.trim({ id: skB, curveIds: [half] })
  await api.v1.sketch.postTrim({ id: skB })
  const geoB = (await api.v1.sketch.getGeometry({ id: skB })).result.lines
  const B = { trimmedLine: b.A, untrimmedLine: b.B, after: geoB, untrimmedKept: geoB.includes(b.B), trimmedChurned: !geoB.includes(b.A) }
  console.log('[08] B trim-one: after', JSON.stringify(geoB), 'untrimmed', b.B, 'kept?', B.untrimmedKept, '| trimmed', b.A, 'churned?', B.trimmedChurned)

  // C: trim([]) empty
  const skC = await addSketch(api, partId, planeId, 'C')
  const c = await crossed(api, skC)
  await api.v1.sketch.preTrim({ id: skC })
  const rTrimC = await api.v1.sketch.trim({ id: skC, curveIds: [] })
  await api.v1.sketch.postTrim({ id: skC })
  const geoC = (await api.v1.sketch.getGeometry({ id: skC })).result.lines
  const C = { originals: [c.A, c.B], after: geoC, trimEmptyMax: rTrimC.maxLevel, idsChanged: !geoC.includes(c.A) && !geoC.includes(c.B) }
  console.log('[08] C trim([]): after', JSON.stringify(geoC), 'idsChanged', C.idsChanged, 'trim([]) max', rTrimC.maxLevel)

  filewrite({ A, B, C }, '08-id-semantics')
  return { A_preserved: A.preserved, B_untrimmedKept: B.untrimmedKept, B_trimmedChurned: B.trimmedChurned, C_idsChanged: C.idsChanged }
}
