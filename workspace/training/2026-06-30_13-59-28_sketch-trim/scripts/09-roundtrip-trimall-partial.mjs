// 09 — trim-ALL then postTrim (empty sketch? leak?); partial trim (clean L + Auto_Coinc); mixed (untrimmed keep ids).
import { makeSketch, addSketch, line, positions, containers, vecApprox, firstError } from './_setup.mjs'

async function segTouching(api, entry, point) {
  for (const s of entry.splittedCurves) { const p = await positions(api, s.id); if (vecApprox(p.startPos, point, 1e-6) || vecApprox(p.endPos, point, 1e-6)) return s.id }
  return null
}

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)

  // A: trim ALL 4 segs then postTrim
  await line(api, skId, [0, 50, 0], [100, 50, 0]); await line(api, skId, [50, 0, 0], [50, 100, 0])
  const preA = await api.v1.sketch.preTrim({ id: skId })
  const allSegs = preA.result.flatMap(e => e.splittedCurves.map(s => s.id))
  const rAll = await api.v1.sketch.trim({ id: skId, curveIds: allSegs })
  const rPostA = await api.v1.sketch.postTrim({ id: skId })
  const geoA = (await api.v1.sketch.getGeometry({ id: skId })).result
  const leak = containers(rPostA.structure?.tree).map(c => c.name)
  const A = { trimAllMax: rAll.maxLevel, postMax: rPostA.maxLevel, postErr: firstError(rPostA), counts: { lines: geoA.lines.length, arcs: (geoA.arcs || []).length, circles: (geoA.circles || []).length, points: (geoA.points || []).length }, leak }
  console.log('[09] A trim-all max', A.trimAllMax, 'postTrim max', A.postMax, '| geometry', JSON.stringify(A.counts), '| containers', JSON.stringify(leak))

  // B: partial (2 overhangs) -> clean L + Auto_Coinc
  const skB = await addSketch(api, partId, planeId, 'B')
  const hB = await line(api, skB, [0, 50, 0], [100, 50, 0]); const vB = await line(api, skB, [50, 0, 0], [50, 100, 0])
  const preB = await api.v1.sketch.preTrim({ id: skB })
  const oh1 = await segTouching(api, preB.result.find(e => e.sourceId === hB), [0, 50, 0])
  const oh2 = await segTouching(api, preB.result.find(e => e.sourceId === vB), [50, 0, 0])
  await api.v1.sketch.trim({ id: skB, curveIds: [oh1, oh2] })
  const rPostB = await api.v1.sketch.postTrim({ id: skB })
  const geoB = (await api.v1.sketch.getGeometry({ id: skB })).result
  const autoCoinc = Object.values(rPostB.structure?.tree || {}).find(n => /Coinc/i.test(n.name || '') || n.class === 'CC_2DCoincidentConstraint')
  const B = { lines: geoB.lines.length, autoCoinc: !!autoCoinc }
  console.log('[09] B partial: survivors', geoB.lines.length, 'lines | Auto_Coinc present?', B.autoCoinc)

  // C: mixed - trim ONE overhang, untrimmed segs restore to original ids
  const skC = await addSketch(api, partId, planeId, 'C')
  const hC = await line(api, skC, [0, 50, 0], [100, 50, 0]); const vC = await line(api, skC, [50, 0, 0], [50, 100, 0])
  const preC = await api.v1.sketch.preTrim({ id: skC })
  const ohC = await segTouching(api, preC.result.find(e => e.sourceId === hC), [0, 50, 0])
  await api.v1.sketch.trim({ id: skC, curveIds: [ohC] })
  await api.v1.sketch.postTrim({ id: skC })
  const geoC = (await api.v1.sketch.getGeometry({ id: skC })).result
  const C = { vKeptOriginal: geoC.lines.includes(vC), hChurned: !geoC.lines.includes(hC) }
  console.log('[09] C mixed: untrimmed v kept original id?', C.vKeptOriginal, '| trimmed h churned?', C.hChurned)

  filewrite({ A, B, C }, '09-roundtrip')
  const checks = {
    trimAllVoid: rAll.maxLevel <= 31,
    A_postOk: A.postMax <= 31,
    A_emptyish: A.counts.lines === 0 && A.counts.arcs === 0,
    B_cleanL: B.lines === 2 && B.autoCoinc,
    C_untrimmedKeepsId: C.vKeptOriginal && C.hChurned,
  }
  console.log('[09] CHECKS', JSON.stringify(checks))
  console.log('[09]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data (A.counts/leak are findings)')
  return { checks, A_counts: A.counts, A_leak: A.leak }
}
