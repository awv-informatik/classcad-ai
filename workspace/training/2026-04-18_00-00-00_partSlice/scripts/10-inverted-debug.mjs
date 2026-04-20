export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceInvDbg' })).result

  // Box fully in positive z: z=0 to z=60
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box', length: 60, width: 40, height: 60 })).result

  // Plane at z=30
  const wpId = (await api.v1.part.workPlane({
    id: partId,
    name: 'Mid',
    origin: [0, 0, 30],
    normal: [0, 0, 1],
    xDirection: [1, 0, 0],
  })).result

  // inverted=1 → keep -Z side
  const sliceR = await api.v1.part.slice({
    id: partId,
    targets: [{ id: boxId }],
    reference: wpId,
    inverted: 1,
  })
  console.log('[10] sliceId:', sliceR.result, 'maxLevel:', sliceR.maxLevel)

  // Dump the full structure tree to see what features exist
  filewrite(sliceR.structure, 'structure-after')

  // Check graphic containers
  const gContainers = sliceR.graphic?.containers || []
  console.log('[10] graphic containers:', gContainers.length)
  gContainers.forEach((c, i) => {
    const meshes = c.meshes || []
    const totalVerts = meshes.reduce((s, m) => s + (m.vertices?.length || 0) / 3, 0)
    console.log('[10]   container', i, 'id:', c.id, 'meshes:', meshes.length, 'verts:', totalVerts)
  })

  // Also try saving to STEP to check if geometry exists
  const saveR = await api.v1.common.save({ format: 'STP', encoding: 'base64' })
  console.log('[10] STEP save maxLevel:', saveR.maxLevel, 'has content:', !!saveR.result?.content)

  await snapshot('inverted-debug')

  return { sliceId: sliceR.result }
}
