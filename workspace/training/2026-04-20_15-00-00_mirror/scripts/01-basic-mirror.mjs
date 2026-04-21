export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorTest' })).result

  // Create an off-center box so mirroring is visually obvious
  const boxId = (await api.v1.part.box({
    id: partId,
    name: 'Box1',
    length: 40,
    width: 30,
    height: 50,
  })).result
  console.log('[01] boxId:', boxId)

  // Get the built-in Right work plane (YZ plane, normal=[1,0,0])
  const rightWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Right' })).result
  console.log('[01] Right WP id:', rightWp)

  await snapshot('before-mirror')

  // Mirror the box across the Right (YZ) plane
  const mirrorId = (await api.v1.part.mirror({
    id: partId,
    name: 'Mirror1',
    targets: [boxId],
    references: [rightWp],
  })).result
  console.log('[01] mirrorId:', mirrorId)

  const mirrorResp = await api.v1.part.mirror.__last_response || {}

  // Re-call to capture full response
  // Actually, let's just inspect what we got
  await snapshot('after-mirror')

  // Dump structure to see feature tree
  const structResp = await api.v1.common.recalc({})
  filewrite(structResp.structure, 'structure-after-mirror')

  return { partId, boxId, mirrorId }
}
