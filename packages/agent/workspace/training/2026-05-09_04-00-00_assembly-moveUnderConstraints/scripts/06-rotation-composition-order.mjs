export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly with unconstrained instance at a non-origin position
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 60, width: 20, height: 10 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Wcs', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  // Place instance at (50, 0, 0) so rotation effect is clearly visible
  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Offset',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[06] COG before:', massBefore.cog)
  await snapshot('before')

  // Test A: rotation 90° CCW around Z (pivot at origin), then offset +20Y
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0, -1, 0], yDir: [1, 0, 0], zDir: [0, 0, 1] },
    offset: [0, 20, 0],
  })
  const massA = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[06] COG after rot90+offset(0,20,0):', massA.cog)
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  // Test B: offset only — same offset, no rotation
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  await api.v1.assembly.moveUnderConstraints({ id: asmId, offset: [0, 20, 0] })
  const massB = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[06] COG after offset-only(0,20,0):', massB.cog)
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  // Test C: rotation only — same rotation, no offset
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0, -1, 0], yDir: [1, 0, 0], zDir: [0, 0, 1] },
  })
  const massC = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
  console.log('[06] COG after rotation-only 90°:', massC.cog)
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  await snapshot('after-rotation-only')

  // Analysis:
  // If rotate-then-translate: COG = rotate(before) + offset
  // rotate(80,10,5) by 90°CCW around Z with pivot at origin: (x,y) -> (y,-x) => (10,-80)
  // then + offset (0,20,0): (10, -60, 5)
  // If translate-then-rotate: COG = rotate(before + offset)
  // (80, 30, 5) rotated 90°CCW: (30, -80, 5)

  filewrite({
    before: massBefore.cog,
    afterRotPlusOffset: massA.cog,
    afterOffsetOnly: massB.cog,
    afterRotOnly: massC.cog,
    analysis: 'If rotate-first: rot(COG_start) + offset. If translate-first: rot(COG_start + offset)',
  }, 'composition-order-result')

  return { inst }
}
