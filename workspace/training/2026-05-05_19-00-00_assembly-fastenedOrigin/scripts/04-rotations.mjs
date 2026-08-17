export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Rot',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Apply fastenedOrigin with 90° rotation around Z
  const foR = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Rot',
    mate1: { path: [inst], csys: wcs },
    zRotation: '90deg',
  })
  console.log('[04] fastenedOrigin result:', foR.result, 'maxLevel:', foR.maxLevel)

  // With 90° Z rotation at origin, the box should be rotated:
  // Original box corners: [0,0,0] → [40,30,20]. After 90° Z, x→y, y→-x
  // So COG [20,15,10] → [-15,20,10] (rotated by 90° CCW around Z)
  const mass = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[04] COG:', JSON.stringify(mass?.cog))
  filewrite(mass, 'mass-90deg-z')

  await snapshot('rotation-90z')

  // Also test radians
  const asmId2 = (await api.v1.assembly.create({})).result
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block2' })).result
  await api.v1.part.box({ id: tpl2, name: 'B2', length: 40, width: 30, height: 20 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Mate2', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId2 })

  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId2, name: 'Rot2',
  })).result

  // 90° = π/2 radians
  const foR2 = await api.v1.assembly.fastenedOrigin({
    id: asmId2, name: 'FO_Rad',
    mate1: { path: [inst2], csys: wcs2 },
    zRotation: Math.PI / 2,
  })
  console.log('[04] radians result:', foR2.result, 'maxLevel:', foR2.maxLevel)

  const mass2 = (await api.v1.assembly.calculateMassProperties({ id: asmId2 })).result
  console.log('[04] COG radians:', JSON.stringify(mass2?.cog))
  filewrite(mass2, 'mass-pi2-z')

  return { foId: foR.result }
}
