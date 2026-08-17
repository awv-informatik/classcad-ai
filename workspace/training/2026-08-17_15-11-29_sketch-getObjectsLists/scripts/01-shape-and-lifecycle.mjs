/**
 * 01 — getObjectsLists: result shape, id semantics, lifecycle.
 * Questions:
 *  a) exact result shape on an OPEN sketch with all entity kinds
 *  b) does it still work AFTER the sketch is consumed by a feature?
 *  c) what do the ids refer to (tree classes)? constraints vs dimensions vs display dims
 *  d) wrong-id behavior (part id, bogus id)
 */
export default async function (api, { filewrite }) {
  const out = {}
  const partId = (await api.v1.part.create({ name: 'GOL' })).result
  const t0 = await api.tree({ refresh: true })
  const top = Object.values(t0).find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const sk = (await api.v1.sketch.create({ id: partId, planeId: top.id, name: 'S' })).result

  // one of each: point, line, circle, arc, construction circle, constraint, dimension
  const p = (await api.v1.sketch.point({ id: sk, pos: [40, 0, 0] })).result
  const l = (await api.v1.sketch.line({ id: sk, startPos: [0, 20, 0], endPos: [30, 20, 0] })).result
  const c = (await api.v1.sketch.circle({ id: sk, centerPos: [0, 0, 0], radius: 10 })).result
  const a = (await api.v1.sketch.arcBy3Points({ id: sk, startPos: [50, 0, 0], midPos: [55, 5, 0], endPos: [60, 0, 0] })).result
  const cc = (await api.v1.sketch.circle({ id: sk, centerPos: [0, 0, 0], radius: 22, isConstruction: true })).result
  await api.v1.sketch.constraint({ id: sk, type: 'HORIZONTAL', geomIds: [l] })
  const dim = await api.v1.sketch.dimension({ id: sk, type: 'DIAMETER', geomIds: [c], value: 24 })

  // a) open-sketch shape
  const open = await api.v1.sketch.getObjectsLists({ id: sk })
  out.open = { maxLevel: open.maxLevel, result: open.result }
  console.log('[01a] open sketch:', JSON.stringify(open.result))

  // c) map every returned id to its tree class
  const t = await api.tree({ refresh: true })
  const classOf = id => t[String(id)] ? `${t[String(id)].class}:${t[String(id)].name}` : 'NOT-IN-TREE'
  const mapped = {}
  for (const [k, v] of Object.entries(open.result ?? {})) mapped[k] = (v ?? []).map(id => `${id}=${classOf(id)}`)
  out.mapped = mapped
  console.log('[01c] id classes:', JSON.stringify(mapped, null, 1))
  // dimension entity vs display entity
  console.log('[01c] dimension() returned:', JSON.stringify(dim.result), '— in lists.dimensions?', JSON.stringify(open.result?.dimensions))

  // b) after consumption
  const ex = await api.v1.part.extrusion({ id: partId, references: [c], type: 'CUSTOM', limit1: 0, limit2: 10 })
  const after = await api.v1.sketch.getObjectsLists({ id: sk })
  out.after = { exLevel: ex.maxLevel, maxLevel: after.maxLevel, same: JSON.stringify(after.result) === JSON.stringify(open.result) }
  console.log('[01b] after extrusion: maxLevel', after.maxLevel, 'result unchanged:', out.after.same)

  // d) wrong ids
  const wrongPart = await api.v1.sketch.getObjectsLists({ id: partId })
  const bogus = await api.v1.sketch.getObjectsLists({ id: 999999 })
  out.wrong = {
    partId: { maxLevel: wrongPart.maxLevel, result: wrongPart.result, msg: wrongPart.messages?.[0]?.message },
    bogus: { maxLevel: bogus.maxLevel, result: bogus.result, msg: bogus.messages?.[0]?.message },
  }
  console.log('[01d] part id →', wrongPart.maxLevel, JSON.stringify(wrongPart.result), wrongPart.messages?.[0]?.message)
  console.log('[01d] bogus id →', bogus.maxLevel, JSON.stringify(bogus.result), bogus.messages?.[0]?.message)

  filewrite(JSON.stringify(out, null, 1), 'gol-findings.json')
  return out
}
