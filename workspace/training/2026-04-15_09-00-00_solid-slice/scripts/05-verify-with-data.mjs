// Verify slice geometry change numerically using graphic data
// Compare vertex counts and bounding box before/after
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceVerify' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create box 80x60x40
  const boxCreate = await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })
  const boxId = boxCreate.result
  console.log('[05] boxId:', boxId)

  // Dump graphic data before slice
  const graphicBefore = boxCreate.graphic
  if (graphicBefore) {
    // Extract vertex positions to compute bounding box
    const meshes = graphicBefore.meshes || []
    let allVerts = []
    for (const mesh of meshes) {
      if (mesh.position) allVerts.push(...mesh.position)
    }
    const vertCount = allVerts.length / 3
    const xs = [], ys = [], zs = []
    for (let i = 0; i < allVerts.length; i += 3) {
      xs.push(allVerts[i])
      ys.push(allVerts[i + 1])
      zs.push(allVerts[i + 2])
    }
    const bbox = {
      x: [Math.min(...xs), Math.max(...xs)],
      y: [Math.min(...ys), Math.max(...ys)],
      z: [Math.min(...zs), Math.max(...zs)],
    }
    console.log('[05] BEFORE vertCount:', vertCount, 'bbox:', JSON.stringify(bbox))
    filewrite({ vertCount, bbox, meshCount: meshes.length }, 'graphic-before')
  } else {
    console.log('[05] BEFORE: no graphic data in create response')
    // Try getting graphic via a dummy call
    const probe = await api.v1.common.getAppVersion({})
    if (probe.graphic) {
      filewrite(probe.graphic, 'graphic-before-probe')
      console.log('[05] BEFORE graphic from probe: meshes count:', probe.graphic.meshes?.length)
    }
  }

  // Slice at z=20, normal [0,0,1], keepBoth: false
  const sliceR = await api.v1.solid.slice({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 20],
    normal: [0, 0, 1],
    keepBoth: false,
  })
  console.log('[05] slice result:', sliceR.result, 'maxLevel:', sliceR.maxLevel)

  // Dump graphic data after slice
  const graphicAfter = sliceR.graphic
  if (graphicAfter) {
    const meshes = graphicAfter.meshes || []
    let allVerts = []
    for (const mesh of meshes) {
      if (mesh.position) allVerts.push(...mesh.position)
    }
    const vertCount = allVerts.length / 3
    const xs = [], ys = [], zs = []
    for (let i = 0; i < allVerts.length; i += 3) {
      xs.push(allVerts[i])
      ys.push(allVerts[i + 1])
      zs.push(allVerts[i + 2])
    }
    const bbox = {
      x: [Math.min(...xs), Math.max(...xs)],
      y: [Math.min(...ys), Math.max(...ys)],
      z: [Math.min(...zs), Math.max(...zs)],
    }
    console.log('[05] AFTER vertCount:', vertCount, 'bbox:', JSON.stringify(bbox))
    filewrite({ vertCount, bbox, meshCount: meshes.length }, 'graphic-after')
  } else {
    console.log('[05] AFTER: no graphic data in slice response')
  }

  await snapshot('after-slice')

  return { partId, boxId }
}
