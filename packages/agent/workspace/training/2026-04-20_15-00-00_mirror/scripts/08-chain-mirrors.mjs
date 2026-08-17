export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorChain' })).result

  // Create a box offset in +X and +Y
  const wcs = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [20, 20, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1', length: 30, width: 20, height: 40, references: [wcs],
  })).result

  const rightWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Right' })).result
  const frontWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result

  // First mirror across Right (YZ plane)
  const mirror1 = (await api.v1.part.mirror({
    id: partId, name: 'MirrorX',
    targets: [boxId],
    references: [rightWp],
  })).result
  console.log('[08] mirror1:', mirror1)

  await snapshot('after-first-mirror')

  // Second mirror: mirror the first mirror feature across Front (XZ plane)
  const mirror2 = (await api.v1.part.mirror({
    id: partId, name: 'MirrorY',
    targets: [mirror1],
    references: [frontWp],
  })
  )
  console.log('[08] mirror2:', mirror2.result, 'maxLevel:', mirror2.maxLevel)
  if (mirror2.messages?.length) console.log('[08] messages:', JSON.stringify(mirror2.messages))

  await snapshot('after-chain-mirror')

  return { partId, boxId, mirror1, mirror2: mirror2.result }
}
