// Error case: pass invalid/wrong type IDs to sketchRegion
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvalidTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Pass part ID as geomId (wrong type)
  const r1 = await api.v1.sketch.sketchRegion({ id: skId, geomIds: [partId] })
  console.log('[15] partId as geom — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[15] messages:', JSON.stringify(r1.messages))

  // Pass sketch ID as geomId (also wrong)
  const r2 = await api.v1.sketch.sketchRegion({ id: skId, geomIds: [skId] })
  console.log('[15] skId as geom — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[15] messages:', JSON.stringify(r2.messages))

  // Pass a completely fake ID
  const r3 = await api.v1.sketch.sketchRegion({ id: skId, geomIds: [99999] })
  console.log('[15] fake id — result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[15] messages:', JSON.stringify(r3.messages))

  filewrite({
    partAsGeom: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    sketchAsGeom: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    fakeId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'invalid-ids')

  return { partId }
}
