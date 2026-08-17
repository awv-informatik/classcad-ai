export default async function (api, { snapshot, filewrite }) {
  // Setup
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 80, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Inst1' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst2',
    transformation: [[150, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create fastened with xOffset=100 (no rotation)
  const fId = (await api.v1.assembly.fastened({
    id: asmId, name: 'F1',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 100,
  })).result
  console.log('[03] fastened created:', fId)

  // COG with no rotation: inst1 COG (40,15,10), inst2 COG (140,15,10)
  const m1 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] COG no rotation:', JSON.stringify(m1.cog))
  // Expected: x=(40+140)/2=90

  // Update: add zRotation = pi/2 (90° CCW around Z)
  const r1 = await api.v1.assembly.updateFastened({ id: fId, zRotation: Math.PI / 2 })
  console.log('[03] update zRotation=pi/2:', r1.result, 'maxLevel:', r1.maxLevel)

  const m2 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] COG after zRotation=pi/2:', JSON.stringify(m2.cog))
  // 90° CCW rotation of box local COG (40,15,10): (-15,40,10)
  // Then add xOffset=100: (-15+100, 40, 10) = (85, 40, 10)
  // Combined: x=(40+85)/2=62.5, y=(15+40)/2=27.5
  await snapshot('after-zrot-pi2')

  // Update: change rotation to 45deg string
  const r2 = await api.v1.assembly.updateFastened({ id: fId, zRotation: '45deg' })
  console.log('[03] update zRotation=45deg:', r2.result, 'maxLevel:', r2.maxLevel)

  const m3 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] COG after zRotation=45deg:', JSON.stringify(m3.cog))
  // 45° CCW rotation: cos45=0.707, sin45=0.707
  // rotated COG: (40*0.707 - 15*0.707, 40*0.707 + 15*0.707, 10) = (17.68, 38.89, 10)
  // + xOffset=100: (117.68, 38.89, 10)
  // Combined: x=(40+117.68)/2≈78.84

  // Verify state
  const state = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[03] final state: xOffset=', state.xOffset, 'zRotation=', state.zRotation)
  filewrite(state, 'state-after-rotation')

  // Update: zero out rotation
  const r3 = await api.v1.assembly.updateFastened({ id: fId, zRotation: 0 })
  console.log('[03] update zRotation=0:', r3.result, 'maxLevel:', r3.maxLevel)

  const m4 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] COG after zeroing rotation:', JSON.stringify(m4.cog))
  // Should be back to (90, 15, 10)

  return { fId }
}
