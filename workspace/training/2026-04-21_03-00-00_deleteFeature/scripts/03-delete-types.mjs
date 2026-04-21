export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a work plane
  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'MyPlane', origin: [0, 0, 50], normal: [0, 0, 1] })).result
  console.log('[03] workPlaneId:', wpId)

  // Create a work axis
  const waId = (await api.v1.part.workAxis({ id: partId, name: 'MyAxis', origin: [0, 0, 0], direction: [1, 0, 0] })).result
  console.log('[03] workAxisId:', waId)

  // Create a sketch
  const skId = (await api.v1.sketch.create({ id: partId })).result
  console.log('[03] sketchId:', skId)

  // Create a feature (box)
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  console.log('[03] boxId:', boxId)

  // Delete work plane
  const r1 = await api.v1.part.deleteFeature({ ids: [wpId] })
  console.log('[03] delete workPlane — result:', r1.result, 'maxLevel:', r1.maxLevel, 'messages:', JSON.stringify(r1.messages))

  // Delete work axis
  const r2 = await api.v1.part.deleteFeature({ ids: [waId] })
  console.log('[03] delete workAxis — result:', r2.result, 'maxLevel:', r2.maxLevel, 'messages:', JSON.stringify(r2.messages))

  // Delete sketch
  const r3 = await api.v1.part.deleteFeature({ ids: [skId] })
  console.log('[03] delete sketch — result:', r3.result, 'maxLevel:', r3.maxLevel, 'messages:', JSON.stringify(r3.messages))

  // Delete feature
  const r4 = await api.v1.part.deleteFeature({ ids: [boxId] })
  console.log('[03] delete box — result:', r4.result, 'maxLevel:', r4.maxLevel, 'messages:', JSON.stringify(r4.messages))

  filewrite({
    workPlane: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    workAxis: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    sketch: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    box: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'delete-types-response')

  return { partId }
}
