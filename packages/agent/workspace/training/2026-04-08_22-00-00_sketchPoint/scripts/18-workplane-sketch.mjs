// Test sketch.point on a non-XY work plane (e.g., YZ plane)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PlaneTest' })).result

  // Create a work plane on YZ (normal along X)
  const wpId = (await api.v1.part.workPlane({
    id: partId,
    normal: [1, 0, 0],
    position: [0, 0, 0],
  })).result
  console.log('[18] workPlane id:', wpId)

  // Create sketch on that plane
  const skId = (await api.v1.sketch.create({ id: partId, planeId: wpId })).result
  console.log('[18] sketch id:', skId)

  // Create a point — what coordinate space? Does Z still need to be 0?
  const r1 = await api.v1.sketch.point({ id: skId, pos: [30, 20, 0] })
  console.log('[18] point (30,20,0) on YZ plane — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[18] messages:', JSON.stringify(r1.messages))

  if (r1.result) {
    const pos = await api.v1.sketch.getPositions({ id: r1.result })
    console.log('[18] stored pos:', JSON.stringify(pos.result))
    filewrite({ input: [30, 20, 0], stored: pos.result, plane: 'YZ' }, 'yz-plane-point')
  }

  await snapshot('point-on-yz-plane')
  return { partId, skId }
}
