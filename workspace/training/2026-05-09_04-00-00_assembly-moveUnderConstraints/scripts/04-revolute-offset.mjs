export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly with revolute constraint
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Wcs', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Arm', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Wcs', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Base',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Ground the base
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA },
  })

  // Revolute between base and arm (Z axis rotation only)
  await api.v1.assembly.revolute({
    id: asmId, name: 'Hinge',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[04] COG before:', massBefore.cog)
  await snapshot('before')

  // Test: try to translate a revolute-constrained instance using offset (should be projected to zero)
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst2], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  const r1 = await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    offset: [100, 50, 0],
  })
  console.log('[04] offset-on-revolute result:', r1.result, 'maxLevel:', r1.maxLevel)
  const massAfterOffset = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[04] COG after offset (should be unchanged):', massAfterOffset.cog)

  // Now add rotation too — rotation should work, offset should be projected
  const r2 = await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0, -1, 0], yDir: [1, 0, 0], zDir: [0, 0, 1] },
    offset: [100, 50, 0],
  })
  const massAfterBoth = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[04] COG after rotation+offset on revolute:', massAfterBoth.cog)
  await snapshot('after-rotation-offset')

  // Clean rotation only (no offset) for comparison
  const r3 = await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0, -1, 0], yDir: [1, 0, 0], zDir: [0, 0, 1] },
  })
  const massAfterRotOnly = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[04] COG after rotation-only on revolute:', massAfterRotOnly.cog)

  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  filewrite({
    before: massBefore.cog,
    afterOffset: massAfterOffset.cog,
    afterRotPlusOffset: massAfterBoth.cog,
    afterRotOnly: massAfterRotOnly.cog,
    offsetIgnored: JSON.stringify(massAfterOffset.cog) === JSON.stringify(massBefore.cog),
    rotPlusOffsetMatchesRotOnly: JSON.stringify(massAfterBoth.cog) === JSON.stringify(massAfterRotOnly.cog),
  }, 'revolute-offset-result')

  return { inst2 }
}
