// Test slicing exactly at the bottom face boundary
// Box z: -20 to 20. Plane at z=-20, normal [0,0,1]
// Is this a no-op (like z=-50) or does touching the face trigger deletion?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceFace' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  console.log('[15] boxId:', boxId)

  // Single slice at bottom face z=-20
  const r = await api.v1.solid.slice({
    id: eifId,
    target: boxId,
    originPos: [0, 0, -20],
    normal: [0, 0, 1],
    keepBoth: false,
  })
  console.log('[15] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[15] messages:', JSON.stringify(r.messages))

  const containers = r.graphic?.containers || []
  console.log('[15] container count:', containers.length)
  for (const c of containers) {
    console.log('[15] container id:', c.id, 'owner:', c.owner,
      'min:', JSON.stringify(c.properties?.min), 'max:', JSON.stringify(c.properties?.max))
  }

  await snapshot('after-bottom-face-slice')

  return { partId, boxId }
}
