// Test copyGeometry with constraints — default doCopyConstraints=TRUE
// Create a constrained rectangle (4 lines + constraints), copy it, check if constraints come along
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyConstraints' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a rectangle — this produces lines + auto-constraints
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [40, 30, 0] })
  console.log('[04] rectangle result:', rect.result, 'maxLevel:', rect.maxLevel)
  filewrite({ result: rect.result, messages: rect.messages }, 'rect-response')

  // Get the geometry IDs from the rectangle
  const rectLines = rect.result
  console.log('[04] rectangle line IDs:', rectLines)

  await snapshot('before')

  // Copy with default doCopyConstraints (TRUE)
  const r = await api.v1.sketch.copyGeometry({
    id: skId,
    geomIds: rectLines,
    translation: [60, 0, 0]
  })
  console.log('[04] copyGeometry result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'copy-response')

  await snapshot('after')

  // Dump structure to see constraints on original and copied geometry
  filewrite(r.structure, 'structure-after')

  return { partId }
}
