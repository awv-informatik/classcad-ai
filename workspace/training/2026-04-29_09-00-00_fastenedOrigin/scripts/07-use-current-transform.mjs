export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'FO_UCT' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [20, 15, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Place instance at a specific position via transformation
  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Positioned',
    transformation: [[80, 40, 25], [1, 0, 0], [0, 1, 0]],
  })).result

  await snapshot('before-uct')

  // Use useCurrentTransform=TRUE — should lock at current position
  // and reverse-compute offsets/rotations
  const r = await api.v1.assembly.fastenedOrigin({
    id: asmId,
    name: 'FO_UCT',
    mate1: { path: [inst], csys: wcs },
    useCurrentTransform: 1,
  })

  console.log('[07] useCurrentTransform result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'uct-response')

  await snapshot('after-uct')

  // Now read back the constraint to see what offsets were computed
  const get = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_UCT' })
  console.log('[07] getFastenedOrigin result:', JSON.stringify(get.result))
  filewrite(get.result, 'uct-get-result')

  return { asmId }
}
