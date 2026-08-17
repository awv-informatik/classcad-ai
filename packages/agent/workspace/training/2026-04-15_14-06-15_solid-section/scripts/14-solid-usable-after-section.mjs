// 14 — Verify solid is still usable after section (boolean it, slice it, etc.)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SectionThenUse' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  // Section at z=0
  const sectionId = (await api.v1.solid.section({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [0, 0, 1],
  })).result
  console.log('[14] sectionId:', sectionId)

  await snapshot('after-section')

  // Now try to use the box for further operations — slice it
  const sliceR = await api.v1.solid.slice({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [0, 0, 1],
    keepBoth: false,
  })
  console.log('[14] slice result:', sliceR.result, 'maxLevel:', sliceR.maxLevel)

  await snapshot('after-slice')

  // Check graphic — should show half-box + section curves
  const containers = sliceR.graphic?.containers || []
  for (const c of containers) {
    const vertCount = c.vertices ? c.vertices.length / 3 : 0
    const edgeCount = c.edges ? c.edges.length : 0
    console.log(`[14] container id=${c.id} type=${c.type} verts=${vertCount} edges=${edgeCount}`)
  }

  return { partId, eifId, boxId, sectionId }
}
