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
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create with "deg" string rotation
  const fId = (await api.v1.assembly.fastened({
    id: asmId, name: 'RotDeg',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 80,
    zRotation: '90deg',
  })).result
  console.log('[03] created with zRotation="90deg", id:', fId)

  const r = await api.v1.assembly.getFastened({ id: asmId, name: 'RotDeg' })
  console.log('[03] getFastened zRotation:', r.result?.zRotation)
  console.log('[03] getFastened zRotation type:', typeof r.result?.zRotation)
  console.log('[03] expected radians for 90deg:', Math.PI / 2)
  console.log('[03] match:', Math.abs(r.result?.zRotation - Math.PI / 2) < 0.001)
  filewrite(r.result, 'rotation-deg-result')

  // Also create one with radian rotation
  const inst3 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId,
    transformation: [[0, 80, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const fId2 = (await api.v1.assembly.fastened({
    id: asmId, name: 'RotRad',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst3], csys: wcs },
    xOffset: 80,
    zRotation: 1.5708,
  })).result
  console.log('[03] created with zRotation=1.5708, id:', fId2)

  const r2 = await api.v1.assembly.getFastened({ id: asmId, name: 'RotRad' })
  console.log('[03] getFastened zRotation (radian input):', r2.result?.zRotation)
  filewrite(r2.result, 'rotation-rad-result')

  return { asmId }
}
