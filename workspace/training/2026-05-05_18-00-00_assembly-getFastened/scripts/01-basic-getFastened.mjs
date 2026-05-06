export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 80, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'A',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'B',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const fId = (await api.v1.assembly.fastened({
    id: asmId, name: 'Joint1',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 50,
  })).result
  console.log('[01] fastened created, id:', fId)

  const r = await api.v1.assembly.getFastened({ id: asmId, name: 'Joint1' })
  console.log('[01] getFastened maxLevel:', r.maxLevel)
  filewrite(r.result, 'getFastened-result')

  console.log('[01] result.id:', r.result?.id)
  console.log('[01] result.name:', r.result?.name)
  console.log('[01] result.xOffset:', r.result?.xOffset)
  console.log('[01] result.yOffset:', r.result?.yOffset)
  console.log('[01] result.zOffset:', r.result?.zOffset)
  console.log('[01] result.xRotation:', r.result?.xRotation)
  console.log('[01] result.yRotation:', r.result?.yRotation)
  console.log('[01] result.zRotation:', r.result?.zRotation)
  console.log('[01] mate1 keys:', r.result?.mate1 ? Object.keys(r.result.mate1) : 'none')
  console.log('[01] mate2 keys:', r.result?.mate2 ? Object.keys(r.result.mate2) : 'none')
  console.log('[01] mate1:', JSON.stringify(r.result?.mate1))
  console.log('[01] mate2:', JSON.stringify(r.result?.mate2))

  await snapshot('result')
  return { fId, asmId, inst1, inst2, wcs }
}
