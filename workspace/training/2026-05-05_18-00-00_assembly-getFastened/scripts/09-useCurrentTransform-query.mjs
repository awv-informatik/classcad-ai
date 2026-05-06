export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'P' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'M', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId,
    transformation: [[75, 40, 25], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create with useCurrentTransform — should back-compute offsets
  const fId = (await api.v1.assembly.fastened({
    id: asmId, name: 'Frozen',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    useCurrentTransform: 1,
  })).result
  console.log('[09] created with useCurrentTransform, id:', fId)

  const r = await api.v1.assembly.getFastened({ id: asmId, name: 'Frozen' })
  console.log('[09] xOffset:', r.result?.xOffset)
  console.log('[09] yOffset:', r.result?.yOffset)
  console.log('[09] zOffset:', r.result?.zOffset)
  console.log('[09] expected offsets: x=75 y=40 z=25')
  filewrite(r.result, 'useCurrentTransform-result')

  return { asmId }
}
