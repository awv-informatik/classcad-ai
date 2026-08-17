// Slice a box at its midpoint to clearly bisect it
// Box is centered at origin: X[-40,40] Y[-30,30] Z[-20,20]
// Slice at z=0 should cut it in half vertically
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceMid' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create box 80x60x40 (centered at origin)
  const boxR = await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })
  const boxId = boxR.result
  console.log('[07] boxId:', boxId)

  // Extract bounding box before
  const cBefore = boxR.graphic?.containers?.[0]
  if (cBefore) {
    console.log('[07] BEFORE min:', JSON.stringify(cBefore.properties.min))
    console.log('[07] BEFORE max:', JSON.stringify(cBefore.properties.max))
    console.log('[07] BEFORE vert count:', cBefore.meshes?.reduce((n, m) => n + (m.vertices?.length || 0) / 3, 0))
  }

  // Slice at z=0, normal [0,0,1] → remove everything below z=0
  // Should keep top half: z=0 to z=20
  const sliceR = await api.v1.solid.slice({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [0, 0, 1],
    keepBoth: false,
  })
  console.log('[07] slice result:', sliceR.result, 'maxLevel:', sliceR.maxLevel)

  // Extract bounding box after
  const cAfter = sliceR.graphic?.containers?.[0]
  if (cAfter) {
    console.log('[07] AFTER min:', JSON.stringify(cAfter.properties.min))
    console.log('[07] AFTER max:', JSON.stringify(cAfter.properties.max))
    console.log('[07] AFTER vert count:', cAfter.meshes?.reduce((n, m) => n + (m.vertices?.length || 0) / 3, 0))
  }

  // Save comparison
  filewrite({
    before: { min: cBefore?.properties?.min, max: cBefore?.properties?.max },
    after: { min: cAfter?.properties?.min, max: cAfter?.properties?.max },
  }, 'bbox-comparison')

  // Also add a reference cylinder to make visual comparison meaningful
  await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 10, translation: [60, 0, 0] })
  await snapshot('after-midslice-with-ref')

  return { partId, boxId }
}
