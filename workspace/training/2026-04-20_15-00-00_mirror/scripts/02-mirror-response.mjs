export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorResp' })).result

  // Create a box offset from origin so mirroring is clear
  const boxId = (await api.v1.part.box({
    id: partId,
    name: 'Box1',
    length: 40,
    width: 30,
    height: 50,
  })).result

  const topWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  console.log('[02] Top WP id:', topWp)

  // Mirror across Top (XY plane at z=0)
  const mirrorResp = await api.v1.part.mirror({
    id: partId,
    name: 'MirrorTop',
    targets: [boxId],
    references: [topWp],
  })
  console.log('[02] mirrorId:', mirrorResp.result)
  console.log('[02] maxLevel:', mirrorResp.maxLevel)
  console.log('[02] messages:', JSON.stringify(mirrorResp.messages))
  filewrite({ result: mirrorResp.result, messages: mirrorResp.messages, maxLevel: mirrorResp.maxLevel }, 'mirror-response')

  await snapshot('mirror-across-top')

  return { partId, boxId, mirrorId: mirrorResp.result }
}
