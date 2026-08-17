export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 40, width: 30, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({ id: tpl1, name: 'WCS1', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box2', length: 60, width: 20, height: 15 })
  const wcs2 = (await api.v1.part.workCSys({ id: tpl2, name: 'WCS2', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BaseInst' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'ArmInst' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO_Base', mate1: { path: [inst1], csys: wcs1 } })

  const revId = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'Rev_Test',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  console.log('[01] revolute created:', revId)

  const r = await api.v1.assembly.getRevolute({ id: asmId, name: 'Rev_Test' })
  console.log('[01] getRevolute result:', JSON.stringify(r.result))
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] result keys:', Object.keys(r.result).sort().join(', '))
  console.log('[01] mate1 keys:', Object.keys(r.result.mate1).sort().join(', '))
  console.log('[01] mate2 keys:', Object.keys(r.result.mate2).sort().join(', '))

  filewrite(r.result, 'basic-get-result')
  await snapshot('result')

  return { asmId, tpl1, tpl2, wcs1, wcs2, inst1, inst2, revId }
}
