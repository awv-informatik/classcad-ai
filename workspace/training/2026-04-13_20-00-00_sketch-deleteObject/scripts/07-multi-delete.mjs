// Test: deleting multiple objects in a single call (mixed types: geometry + constraint)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiDelete' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create geometry
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 30, 0], endPos: [50, 30, 0] })).result
  const circ = (await api.v1.sketch.circle({ id: skId, centerPos: [80, 15, 0], radius: 10 })).result

  // Create a constraint on line2
  const constr = (await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [line2] })).result

  console.log('[07] line1:', line1, 'line2:', line2, 'circ:', circ, 'constr:', constr)

  await snapshot('before-multi-delete')

  // Delete line1, circ, and constr all at once
  const r = await api.v1.sketch.deleteObject({ ids: [line1, circ, constr] })
  console.log('[07] multi-delete result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'multi-delete-response')

  await snapshot('after-multi-delete')

  // Verify only line2 remains
  const geomAfter = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[07] geometry after multi-delete:', JSON.stringify(geomAfter.result))
  filewrite(geomAfter.result, 'geom-after-multi-delete')

  return { partId }
}
