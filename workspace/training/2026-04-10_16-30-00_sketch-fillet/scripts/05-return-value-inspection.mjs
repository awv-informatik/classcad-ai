// Inspect the 4 returned IDs from fillet using structure tree
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletIDs' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [100, 80, 0] })
  const lineIds = rect.result

  const r = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: 15 })
  const [arcId, controlPointId, startPointId, endPointId] = r.result
  console.log('[05] arcId:', arcId)
  console.log('[05] controlPointId:', controlPointId)
  console.log('[05] startPointId:', startPointId)
  console.log('[05] endPointId:', endPointId)

  // Dump the structure to understand what these IDs refer to
  filewrite(r.structure, 'fillet-structure')
  filewrite({ arcId, controlPointId, startPointId, endPointId }, 'fillet-ids')

  await snapshot('fillet-ids')

  return { partId, arcId, controlPointId, startPointId, endPointId }
}
