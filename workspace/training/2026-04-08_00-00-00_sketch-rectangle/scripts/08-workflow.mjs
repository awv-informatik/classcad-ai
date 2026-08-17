// 08 — realistic workflow: rectangle → sketchRegion → extrusion
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Workflow' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create rectangle
  const rect = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [60, 40, 0],
  })
  console.log('[08] rect IDs:', rect.result)

  // Create sketch region — pass the line IDs
  const region = await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect.result })
  console.log('[08] region result:', region.result, 'maxLevel:', region.maxLevel)

  // Extrude using the region ID — references takes an array
  if (region.result) {
    const ext = await api.v1.part.extrusion({
      id: partId,
      references: [region.result],
      limit2: 30,
    })
    console.log('[08] extrusion result:', ext.result, 'maxLevel:', ext.maxLevel)
    if (ext.messages?.length) console.log('[08] extrusion messages:', JSON.stringify(ext.messages))
    await snapshot('extruded')
  }

  // Also try extrusion with line IDs directly (no region)
  const skId2 = (await api.v1.sketch.create({ id: partId })).result
  const rect2 = await api.v1.sketch.rectangle({
    id: skId2,
    startPos: [80, 0, 0],
    endPos: [120, 30, 0],
  })
  console.log('[08] rect2 IDs:', rect2.result)

  const ext2 = await api.v1.part.extrusion({
    id: partId,
    references: rect2.result,
    limit2: 20,
  })
  console.log('[08] extrusion from lines result:', ext2.result, 'maxLevel:', ext2.maxLevel)
  if (ext2.messages?.length) console.log('[08] extrusion from lines messages:', JSON.stringify(ext2.messages))

  await snapshot('both-extruded')
  return { partId }
}
