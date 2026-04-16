// Test slicing exactly at a face of the solid
// Box goes from z=-20 to z=20. Slice at z=20 with normal [0,0,1]
// The entire solid is on the negative side. Does this do nothing or remove all?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceAtFace' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  console.log('[13] boxId:', boxId)

  // Slice at top face z=20
  const r1 = await api.v1.solid.slice({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 20],
    normal: [0, 0, 1],
    keepBoth: false,
  })
  console.log('[13] top face: result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[13] top face: messages:', JSON.stringify(r1.messages))

  const c1 = r1.graphic?.containers?.[0]
  if (c1) {
    console.log('[13] top face: bbox min:', JSON.stringify(c1.properties.min), 'max:', JSON.stringify(c1.properties.max))
  }
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel,
    bbox: c1 ? { min: c1.properties.min, max: c1.properties.max } : null }, 'at-top-face')

  // Slice at bottom face z=-20
  const r2 = await api.v1.solid.slice({
    id: eifId,
    target: boxId,
    originPos: [0, 0, -20],
    normal: [0, 0, 1],
    keepBoth: false,
  })
  console.log('[13] bottom face: result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[13] bottom face: messages:', JSON.stringify(r2.messages))

  const c2 = r2.graphic?.containers?.[0]
  if (c2) {
    console.log('[13] bottom face: bbox min:', JSON.stringify(c2.properties.min), 'max:', JSON.stringify(c2.properties.max))
  }
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel,
    bbox: c2 ? { min: c2.properties.min, max: c2.properties.max } : null }, 'at-bottom-face')

  await snapshot('after-face-slices')

  return { partId, boxId }
}
