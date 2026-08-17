// Verify that copy preserves mesh topology by comparing vertex counts
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MeshVerify' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create a box
  const boxR = await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })
  const boxId = boxR.result
  const origVerts = boxR.graphic?.meshes?.[0]?.vertices?.length || 'N/A'
  console.log('[12] original box vertices data length:', origVerts)
  filewrite(boxR.graphic, 'graphic-original')

  // Copy it
  const copyR = await api.v1.solid.copy({ id: eifId, target: boxId, translation: [80, 0, 0] })
  const copyId = copyR.result
  const copyVerts = copyR.graphic?.meshes?.[0]?.vertices?.length || 'N/A'
  console.log('[12] copy vertices data length:', copyVerts)
  filewrite(copyR.graphic, 'graphic-after-copy')

  // Also create a sphere and copy it for non-box comparison
  const sphR = await api.v1.solid.sphere({ id: eifId, radius: 20, translation: [0, 80, 0] })
  const sphId = sphR.result
  filewrite(sphR.graphic, 'graphic-sphere-original')

  const sphCopyR = await api.v1.solid.copy({ id: eifId, target: sphId, translation: [80, 80, 0] })
  filewrite(sphCopyR.graphic, 'graphic-sphere-copy')

  console.log('[12] sphere original id:', sphId, 'copy id:', sphCopyR.result)

  await snapshot('all-with-copies')
  return { partId, eifId }
}
