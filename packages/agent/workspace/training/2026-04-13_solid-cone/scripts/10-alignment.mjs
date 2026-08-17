// Alignment check — where is the cone positioned relative to origin?
// Dump graphic data to verify center position and extent
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AlignmentCheck' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create cone with known dimensions
  const r = await api.v1.solid.cone({ id: eifId, height: 100, bDiameter: 60, tDiameter: 20 })
  console.log('[10] cone result:', r.result, 'maxLevel:', r.maxLevel)

  // Dump graphic data to inspect vertex positions (bounding box)
  filewrite(r.graphic, 'alignment-graphic')

  // Also dump structure to see if position data is in there
  filewrite(r.structure, 'alignment-structure')

  await snapshot('alignment')
  return { partId, eifId, coneId: r.result }
}
