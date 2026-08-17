// Test: setWorkPlane error cases — invalid planeId, sketch ID as plane, part ID as plane, bogus ID
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ErrorTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId, name: 'Sk1' })).result
  console.log('[05] partId:', partId, 'skId:', skId)

  // 1. Non-existent ID
  const r1 = await api.v1.sketch.setWorkPlane({ id: skId, planeId: 99999 })
  console.log('[05] bogus planeId — maxLevel:', r1.maxLevel, 'msg:', r1.messages?.[0]?.message)

  // 2. Sketch ID as plane
  const r2 = await api.v1.sketch.setWorkPlane({ id: skId, planeId: skId })
  console.log('[05] self-ref — maxLevel:', r2.maxLevel, 'msg:', r2.messages?.[0]?.message)

  // 3. Part ID as plane
  const r3 = await api.v1.sketch.setWorkPlane({ id: skId, planeId: partId })
  console.log('[05] partId as plane — maxLevel:', r3.maxLevel, 'msg:', r3.messages?.[0]?.message)

  // 4. Missing planeId param
  const r4 = await api.v1.sketch.setWorkPlane({ id: skId })
  console.log('[05] no planeId — maxLevel:', r4.maxLevel, 'msg:', r4.messages?.[0]?.message)

  // 5. Invalid sketch ID
  const r5 = await api.v1.sketch.setWorkPlane({ id: 99999, planeId: 60 })
  console.log('[05] invalid skId — maxLevel:', r5.maxLevel, 'msg:', r5.messages?.[0]?.message)

  filewrite({
    bogus: { maxLevel: r1.maxLevel, messages: r1.messages },
    selfRef: { maxLevel: r2.maxLevel, messages: r2.messages },
    partAsPlane: { maxLevel: r3.maxLevel, messages: r3.messages },
    noPlaneId: { maxLevel: r4.maxLevel, messages: r4.messages },
    invalidSkId: { maxLevel: r5.maxLevel, messages: r5.messages },
  }, 'error-cases')

  return { partId }
}
