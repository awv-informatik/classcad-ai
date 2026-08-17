export default async function (api, { snapshot, filewrite }) {
  // Test: xRotation, yRotation, zRotation, and "deg" string syntax
  const asmId = (await api.v1.assembly.create({})).result

  // Asymmetric box 80x30x20 for easy rotation detection
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 80, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'O', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  console.log('[07] tpl:', tpl, 'wcs:', wcs)

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Inst1 at origin (reference), inst2 far away
  const inst1 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Ref',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Rotated',
    transformation: [[150, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Test 1: zRotation = 90 degrees (pi/2 radians)
  const r1 = await api.v1.assembly.fastened({
    id: asmId, name: 'F_Rot90',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    zRotation: Math.PI / 2,
    xOffset: 100,  // offset to separate them visually
  })
  console.log('[07] zRotation pi/2:', r1.result, 'maxLevel:', r1.maxLevel)

  await api.v1.common.recalc({})
  await snapshot('z-rot-90')

  const mass1 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[07] COG with zRot 90°:', JSON.stringify(mass1?.cog))
  // Box COG local = (40, 15, 10)
  // 90° CCW rotation around Z: (x,y,z) -> (-y, x, z): (40,15,10) -> (-15, 40, 10)
  // inst2 at offset (100,0,0) + rotated COG (-15,40,10) = (85, 40, 10)
  // inst1 COG = (40, 15, 10)
  // combined x = (40+85)/2 = 62.5, y = (15+40)/2 = 27.5, z = 10

  filewrite(mass1, 'mass-zrot90')

  return { r1: r1.result }
}
