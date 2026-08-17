// Verify mirror with numeric data — dump graphic vertices before and after
// Mirror across YZ plane (normal=[1,0,0]) at origin
// Box at [20,10,0] with size 80x40x30 should move to X-reflected position
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorVerify' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create box offset in +X, +Y
  const boxId = (await api.v1.solid.box({
    id: eifId,
    length: 80,
    width: 40,
    height: 30,
    translation: [20, 10, 0],
  })).result

  // Create a fixed reference cylinder at origin (won't be mirrored)
  const refId = (await api.v1.solid.cylinder({
    id: eifId,
    height: 60,
    diameter: 10,
  })).result

  // Dump graphic before mirror
  const rBefore = await api.v1.solid.box({ id: eifId, length: 0.001, width: 0.001, height: 0.001 })
  // Actually, we need the structure to find the bounding box.
  // Let's use the graphic from the last command that has data
  // Better: just dump structure to find body positions

  // Get the graphic data (which contains vertex positions for all bodies)
  const graphicBefore = (await api.v1.common.getAppVersion({}))
  // Actually the graphic is in every response. Let me get it from a simple call
  // The graphic data comes from every API call response. Let me just call something innocent.
  const rr = await api.v1.common.evaluateExpression({ expression: '1+1' })
  filewrite(rr.graphic, 'graphic-before')

  await snapshot('before')

  // Mirror across YZ plane
  const mirrorR = await api.v1.solid.mirror({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [1, 0, 0],
  })
  console.log('[02] mirror result:', mirrorR.result, 'maxLevel:', mirrorR.maxLevel)

  // Dump graphic after mirror
  filewrite(mirrorR.graphic, 'graphic-after')

  await snapshot('after')

  return { partId, eifId, boxId }
}
