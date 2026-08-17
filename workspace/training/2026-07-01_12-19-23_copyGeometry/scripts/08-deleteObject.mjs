// 08 — characterize sketch.deleteObject. Verify: cascade (geometry delete removes its constraints/dimensions),
// delete-constraint-only keeps geometry, child-point handling, ATOMICITY when the batch mixes valid+invalid ids,
// and the error cases (empty / invalid / double / null).
import { makeSketch, addSketch, line, positions } from './_setup.mjs'

const sum = (r, label) => ({ label, result: r?.result ?? null, maxLevel: r?.maxLevel, msgs: (r?.messages || []).map(m => ({ level: m.level, code: m.code, message: m.message })) })
const geo = async (api, id) => { const g = (await api.v1.sketch.getGeometry({ id })).result; return { lines: g.lines.length, circles: (g.circles || []).length, arcs: (g.arcs || []).length, points: (g.points || []).length } }
const census = tree => { const c = {}; for (const n of Object.values(tree || {})) { const cls = n.class || ''; if (/^CC_(Line|Circle|Arc|Point)$/.test(cls) || /Constraint|Distance|Dimension|RadialFeature/i.test(cls)) c[cls] = (c[cls] || 0) + 1 } return c }

export default async function (api, { filewrite }) {
  const out = {}
  const { partId, skId: sk1, planeId } = await makeSketch(api, { name: 'DeleteObj' })

  // ---- Group 1: CASCADE. line a + line b joined, PERPENDICULAR(a,b), HORIZONTAL_DISTANCE on a. Delete a. ----
  const a = await line(api, sk1, [0, 0, 0], [30, 0, 0])
  const b = await line(api, sk1, [30, 0, 0], [30, 20, 0])
  await api.v1.sketch.constraint([{ id: sk1, type: 'PERPENDICULAR', geomIds: [a, b] }])
  const dimResp = await api.v1.sketch.dimension({ id: sk1, type: 'HORIZONTAL_DISTANCE', geomIds: [a], value: 30 })
  out.cascadeBefore = { census: census(dimResp?.structure?.tree), geo: await geo(api, sk1) }
  const rDelA = await api.v1.sketch.deleteObject({ ids: [a] })
  out.cascadeDelete = { ...sum(rDelA, 'delete line a'), hasStructure: !!rDelA?.structure }
  out.cascadeAfter = { census: census(rDelA?.structure?.tree), geo: await geo(api, sk1) }

  // ---- Group 2: delete-CONSTRAINT-only keeps geometry. capture the constraint id. ----
  const sk2 = await addSketch(api, partId, planeId, 'S2')
  const c2 = await line(api, sk2, [0, 0, 0], [40, 0, 0])
  const d2 = await line(api, sk2, [0, 0, 0], [0, 40, 0])
  const cResp = await api.v1.sketch.constraint([{ id: sk2, type: 'PERPENDICULAR', geomIds: [c2, d2] }])
  out.constraintResult = cResp?.result
  const constrId = Array.isArray(cResp?.result) ? cResp.result[0] : cResp?.result
  const g2before = await geo(api, sk2)
  const rDelC = await api.v1.sketch.deleteObject({ ids: [constrId] })
  out.deleteConstraintOnly = { ...sum(rDelC, 'delete perpendicular constraint'), g2before, g2after: await geo(api, sk2) }

  // ---- Group 3: child points. single lone line -> delete -> are its 2 endpoints removed? ----
  const sk3 = await addSketch(api, partId, planeId, 'S3')
  const g = await line(api, sk3, [5, 5, 0], [25, 5, 0])
  const p3before = await geo(api, sk3)
  await api.v1.sketch.deleteObject({ ids: [g] })
  out.childPoints = { p3before, p3after: await geo(api, sk3), note: 'points 2->? after deleting the only line' }

  // ---- Group 4: ATOMICITY. [validE, 999999, validF] -> are E and F both deleted? ----
  const sk4 = await addSketch(api, partId, planeId, 'S4')
  const e = await line(api, sk4, [0, 0, 0], [10, 0, 0])
  const f = await line(api, sk4, [0, 5, 0], [10, 5, 0])
  const g4before = await geo(api, sk4)
  const rMix = await api.v1.sketch.deleteObject({ ids: [e, 999999, f] })
  out.atomicity = { ...sum(rMix, 'delete [validE, 999999, validF]'), g4before, g4after: await geo(api, sk4), note: 'lines 2->? tells whether valid ids still processed when one is invalid' }

  // ---- Group 5: error edge cases ----
  const sk5 = await addSketch(api, partId, planeId, 'S5')
  const h = await line(api, sk5, [0, 0, 0], [10, 0, 0])
  out.empty = sum(await api.v1.sketch.deleteObject({ ids: [] }), 'empty ids')
  out.invalid = sum(await api.v1.sketch.deleteObject({ ids: [999999] }), 'invalid id')
  await api.v1.sketch.deleteObject({ ids: [h] })
  out.doubleDelete = sum(await api.v1.sketch.deleteObject({ ids: [h] }), 'double-delete h')
  out.nullId = sum(await api.v1.sketch.deleteObject({ ids: [null] }), 'null id')

  filewrite(out, '08-deleteObject')
  console.log('[08] cascade BEFORE', JSON.stringify(out.cascadeBefore))
  console.log('[08] cascade AFTER ', JSON.stringify(out.cascadeAfter), 'del:', JSON.stringify(out.cascadeDelete.msgs))
  console.log('[08] deleteConstraintOnly', JSON.stringify({ result: out.constraintResult, g2before: out.deleteConstraintOnly.g2before, g2after: out.deleteConstraintOnly.g2after, msgs: out.deleteConstraintOnly.msgs }))
  console.log('[08] childPoints', JSON.stringify(out.childPoints))
  console.log('[08] atomicity', JSON.stringify({ g4before: out.atomicity.g4before, g4after: out.atomicity.g4after, max: out.atomicity.maxLevel, msgs: out.atomicity.msgs }))
  console.log('[08] empty', out.empty.maxLevel, '| invalid', JSON.stringify(out.invalid.msgs), '| double', JSON.stringify(out.doubleDelete.msgs), '| null', JSON.stringify(out.nullId.msgs))
  return { ok: true }
}
