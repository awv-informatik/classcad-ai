// Test: sketch.setWorkPlane edge cases
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId, name: 'TestSk' })).result

  // Set to invalid planeId
  const r1 = await api.v1.sketch.setWorkPlane({ id: skId, planeId: 99999 })
  console.log('[17] invalid planeId result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[17] invalid planeId messages:', JSON.stringify(r1.messages))

  // Set to the sketch's own ID (nonsensical)
  const r2 = await api.v1.sketch.setWorkPlane({ id: skId, planeId: skId })
  console.log('[17] self-ref result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[17] self-ref messages:', JSON.stringify(r2.messages))

  // Set to partId (not a plane)
  const r3 = await api.v1.sketch.setWorkPlane({ id: skId, planeId: partId })
  console.log('[17] partId as plane result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[17] partId as plane messages:', JSON.stringify(r3.messages))

  filewrite({
    invalidPlane: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    selfRef: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    partAsPlane: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'setworkplane-errors')

  return { partId }
}
