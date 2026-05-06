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
    transformation: [[75, 40, 15], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create fastened with some initial offset
  const fId = (await api.v1.assembly.fastened({
    id: asmId, name: 'F1',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 50, yOffset: 20,
  })).result

  const m1 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[06] COG after creation (xOffset=50, yOffset=20):', JSON.stringify(m1.cog))
  // inst2 at (50, 20, 0), COG = (90, 35, 10). Combined: x=(40+90)/2=65, y=(15+35)/2=25

  // Now update with useCurrentTransform=1 (TRUE)
  // This should recompute offsets from current position without moving anything
  const r1 = await api.v1.assembly.updateFastened({ id: fId, useCurrentTransform: 1 })
  console.log('[06] update useCurrentTransform=1:', r1.result, 'maxLevel:', r1.maxLevel)

  const m2 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[06] COG after useCurrentTransform:', JSON.stringify(m2.cog))
  // Should be unchanged — same position

  // Check what offsets were computed
  const state1 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[06] offsets after useCurrentTransform: x=', state1.xOffset, 'y=', state1.yOffset, 'z=', state1.zOffset)
  // These should still be 50 and 20 since the instance is AT the constraint position
  filewrite(state1, 'state-after-useCurrentTransform')

  // Now manually move inst2 via transformInstance, then update with useCurrentTransform
  // First, update the constraint to put inst2 at (120, 60, 30)
  const r2 = await api.v1.assembly.updateFastened({ id: fId, xOffset: 120, yOffset: 60, zOffset: 30 })
  console.log('[06] update to (120, 60, 30):', r2.result, 'maxLevel:', r2.maxLevel)

  const m3 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[06] COG after offset (120,60,30):', JSON.stringify(m3.cog))
  // inst2 at (120,60,30), COG = (160, 75, 40). Combined: x=(40+160)/2=100, y=(15+75)/2=45, z=(10+40)/2=25

  // Now use useCurrentTransform=1 to lock current position
  const r3 = await api.v1.assembly.updateFastened({ id: fId, useCurrentTransform: 1 })
  console.log('[06] useCurrentTransform again:', r3.result, 'maxLevel:', r3.maxLevel)

  const state2 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[06] offsets re-computed: x=', state2.xOffset, 'y=', state2.yOffset, 'z=', state2.zOffset)
  // Should be (120, 60, 30) since that's where inst2 already is
  filewrite(state2, 'state-after-second-useCurrentTransform')

  const m4 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[06] COG unchanged after re-lock:', JSON.stringify(m4.cog))

  return { fId }
}
