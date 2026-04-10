// Test: Update with invalid region ID (sketch ID, part ID, fake ID)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result

  // Try with sketch ID as region ID
  const r1 = await api.v1.sketch.updateSketchRegion({ regions: [{ id: skId, geomIds: rectIds }] })
  console.log('[03] sketchId as region — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[03] messages:', JSON.stringify(r1.messages))
  filewrite({ sketchIdAsRegion: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages } }, 'sketch-id-error')

  // Try with part ID as region ID
  const r2 = await api.v1.sketch.updateSketchRegion({ regions: [{ id: partId, geomIds: rectIds }] })
  console.log('[03] partId as region — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[03] messages:', JSON.stringify(r2.messages))
  filewrite({ partIdAsRegion: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages } }, 'part-id-error')

  // Try with a fake numeric ID
  const r3 = await api.v1.sketch.updateSketchRegion({ regions: [{ id: 99999, geomIds: rectIds }] })
  console.log('[03] fakeId — result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[03] messages:', JSON.stringify(r3.messages))
  filewrite({ fakeId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages } }, 'fake-id-error')

  return { partId }
}
