export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
    transformation: [[75, 30, 15], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create with useCurrentTransform — should freeze position
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Frozen',
    mate1: { path: [inst], csys: wcs },
    useCurrentTransform: 1,
  })).result
  console.log('[07] created with useCurrentTransform, id:', foId)

  const r = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Frozen' })).result
  console.log('[07] back-computed xOffset:', r.xOffset, '(expected 75)')
  console.log('[07] back-computed yOffset:', r.yOffset, '(expected 30)')
  console.log('[07] back-computed zOffset:', r.zOffset, '(expected 15)')
  console.log('[07] rotations:', r.xRotation, r.yRotation, r.zRotation)
  filewrite(r, 'useCurrentTransform-result')

  return {}
}
