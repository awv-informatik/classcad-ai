export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl, name: 'MateOrigin', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl, name: 'MateCenter', origin: [20, 15, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const wcs3 = (await api.v1.part.workCSys({
    id: tpl, name: 'MateRotated', origin: [0, 0, 0],
    xDirection: [0, 1, 0], yDirection: [-1, 0, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Two instances for COG
  const instRef = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Ref',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Ref',
    mate1: { path: [instRef], csys: wcs1 },
    xOffset: 100,
  })

  const instTarget = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Target',
  })).result

  // Create with wcs1
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Target',
    mate1: { path: [instTarget], csys: wcs1 },
    xOffset: 0, yOffset: 60,
  })).result

  const cogWcs1 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result?.cog
  console.log('[08] COG wcs1:', JSON.stringify(cogWcs1))

  // Update to wcs2 (center of box)
  await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { csys: wcs2 } })
  const cogWcs2 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result?.cog
  console.log('[08] COG wcs2:', JSON.stringify(cogWcs2))

  // Update to wcs3 (rotated axes)
  await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { csys: wcs3 } })
  const cogWcs3 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result?.cog
  console.log('[08] COG wcs3:', JSON.stringify(cogWcs3))

  // Verify state shows updated csys
  const state = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Target' })).result
  console.log('[08] final csys:', state?.mate1?.csys, '(wcs3 id:', wcs3, ')')

  filewrite({
    wcs1, wcs2, wcs3,
    cogWcs1, cogWcs2, cogWcs3,
    csysChanged: state?.mate1?.csys === wcs3,
    finalState: state,
  }, 'csys-update')

  return { foId }
}
