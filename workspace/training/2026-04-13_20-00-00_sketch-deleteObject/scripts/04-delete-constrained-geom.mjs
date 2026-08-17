// Test: deleting geometry that has constraints on it — are constraints auto-deleted?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DelConstrainedGeom' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line and add a constraint to it
  const line = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const constr = (await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [line] })).result
  const dim = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [line] })).result
  console.log('[04] line:', line, 'constr:', constr, 'dim:', dim)

  // Dump structure before delete
  const before = await api.v1.part.create.__raw__ ? null : null // not available
  // Just get the sketch's state via getGeometry
  const geomBefore = await api.v1.sketch.getGeometry({ id: skId })
  filewrite(geomBefore.result, 'geom-before')

  // Delete the line — what happens to its constraint and dimension?
  const r = await api.v1.sketch.deleteObject({ ids: [line] })
  console.log('[04] delete line result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'delete-line-response')

  // Try to check if constraint/dim still exist by deleting them
  const r2 = await api.v1.sketch.deleteObject({ ids: [constr] })
  console.log('[04] delete constraint after line deleted:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'delete-orphan-constraint')

  const r3 = await api.v1.sketch.deleteObject({ ids: [dim] })
  console.log('[04] delete dimension after line deleted:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'delete-orphan-dimension')

  // Get geometry after — should be empty
  const geomAfter = await api.v1.sketch.getGeometry({ id: skId })
  filewrite(geomAfter.result, 'geom-after')

  return { partId }
}
