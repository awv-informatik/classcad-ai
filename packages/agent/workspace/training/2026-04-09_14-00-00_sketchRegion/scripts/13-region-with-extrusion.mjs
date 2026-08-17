// Test: does a region ID work with extrusion?
// rectangle.md says "extrusion with a region ID fails with CCObject can not be opened"
// Verify: try both approaches — pass region ID and pass line IDs directly
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExtrusionTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [60, 40, 0] })
  const region = await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect.result })
  console.log('[13] region id:', region.result)

  // Attempt 1: extrusion with region ID as references
  const ext1 = await api.v1.part.extrusion({
    id: partId,
    references: [region.result],
    limit2: 30,
  })
  console.log('[13] extrusion with region ID — result:', ext1.result, 'maxLevel:', ext1.maxLevel)
  console.log('[13] extrusion with region ID — messages:', JSON.stringify(ext1.messages))

  filewrite({
    regionAsRef: { result: ext1.result, maxLevel: ext1.maxLevel, messages: ext1.messages },
  }, 'extrusion-with-region')

  if (ext1.maxLevel <= 31) {
    await snapshot('extrusion-from-region')
  }

  return { partId }
}
