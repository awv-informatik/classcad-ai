export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GFO_UCT' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Position instance at specific location via transformation
  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Placed',
    transformation: [[80, 40, 25], [1, 0, 0], [0, 1, 0]],
  })).result

  // Lock with useCurrentTransform
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId,
    name: 'FO_UCT',
    mate1: { path: [inst], csys: wcs },
    useCurrentTransform: 1,
  })).result

  // Get — should show computed offsets matching the instance position
  const r = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_UCT' })).result
  console.log('[15] xOffset:', r.xOffset, '(expect ~80)')
  console.log('[15] yOffset:', r.yOffset, '(expect ~40)')
  console.log('[15] zOffset:', r.zOffset, '(expect ~25)')
  console.log('[15] xRotation:', r.xRotation)
  console.log('[15] yRotation:', r.yRotation)
  console.log('[15] zRotation:', r.zRotation)

  filewrite(r, 'uct-get')

  return { asmId }
}
