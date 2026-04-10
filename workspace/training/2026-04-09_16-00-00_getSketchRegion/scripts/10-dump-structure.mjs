// Dump the raw structure tree to understand region naming
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rect1 = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [30, 20, 0] })).result
  const rect2 = (await api.v1.sketch.rectangle({ id: skId, startPos: [40, 0, 0], endPos: [70, 20, 0] })).result
  const rect3 = (await api.v1.sketch.rectangle({ id: skId, startPos: [80, 0, 0], endPos: [110, 20, 0] })).result

  const r1 = await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect1, name: 'Left' })
  const r2 = await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect2, name: 'Center' })
  const r3 = await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect3, name: 'Right' })

  console.log('[10] region IDs:', r1.result, r2.result, r3.result)

  // Dump the full structure from the last call
  filewrite(r3.structure, 'structure')

  // Also try setObjectName approach — rename reg3 to see if that helps
  const renameR = await api.v1.common.setObjectName({ id: r3.result, name: 'Right' })
  console.log('[10] rename result:', renameR.result, 'maxLevel:', renameR.maxLevel)

  // Now try lookup again
  const lookup = await api.v1.sketch.getSketchRegion({ id: skId, name: 'Right' })
  console.log('[10] lookup Right after rename:', lookup.result, 'match:', lookup.result === r3.result)

  return { partId }
}
