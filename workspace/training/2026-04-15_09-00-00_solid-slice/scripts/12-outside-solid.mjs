// Test slicing when the plane is completely outside the solid
// What happens? Error? No-op? Solid deleted?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceOutside' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  console.log('[12] boxId:', boxId)

  // Case 1: Plane above the solid — z=50, normal [0,0,1]
  // Box max z = 20, so entire solid is on negative side (kept)
  const r1 = await api.v1.solid.slice({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 50],
    normal: [0, 0, 1],
    keepBoth: false,
  })
  console.log('[12] above: result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[12] above: messages:', JSON.stringify(r1.messages))

  const c1 = r1.graphic?.containers?.[0]
  if (c1) console.log('[12] above: bbox min:', JSON.stringify(c1.properties.min), 'max:', JSON.stringify(c1.properties.max))
  else console.log('[12] above: no graphic containers')

  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'above-response')

  // Case 2: Plane below the solid — z=-50, normal [0,0,1]
  // Box min z = -20, so entire solid is on positive side (removed)
  const r2 = await api.v1.solid.slice({
    id: eifId,
    target: boxId,
    originPos: [0, 0, -50],
    normal: [0, 0, 1],
    keepBoth: false,
  })
  console.log('[12] below: result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[12] below: messages:', JSON.stringify(r2.messages))

  const c2 = r2.graphic?.containers?.find(c => c.owner === boxId)
  if (c2) console.log('[12] below: bbox still exists')
  else console.log('[12] below: no container for boxId — solid may be gone')

  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'below-response')

  await snapshot('after-both-slices')

  return { partId, boxId }
}
