// Clean test: single slice with plane entirely below the solid
// Box z range: -20 to 20. Plane at z=-50, normal [0,0,1]
// If positive side removed: entire box (z > -50) should be removed
// If no-intersection = no-op: box survives
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceBelow' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  console.log('[14] boxId:', boxId)

  await snapshot('before')

  const r = await api.v1.solid.slice({
    id: eifId,
    target: boxId,
    originPos: [0, 0, -50],
    normal: [0, 0, 1],
    keepBoth: false,
  })
  console.log('[14] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[14] messages:', JSON.stringify(r.messages))

  // Check all containers
  const containers = r.graphic?.containers || []
  console.log('[14] container count:', containers.length)
  for (const c of containers) {
    console.log('[14] container id:', c.id, 'owner:', c.owner, 'min:', JSON.stringify(c.properties?.min), 'max:', JSON.stringify(c.properties?.max))
  }

  await snapshot('after')

  return { partId, boxId }
}
