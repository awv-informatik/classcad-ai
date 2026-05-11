export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly with revolute-constrained instance
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

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA },
  })
  await api.v1.assembly.revolute({
    id: asmId, name: 'Hinge',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })

  const massOriginal = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[01] original COG:', massOriginal.cog)
  await snapshot('original')

  // Test 1: Use moveUnderConstraints to rotate 45°
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst2], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0.707, -0.707, 0], yDir: [0.707, 0.707, 0], zDir: [0, 0, 1] },
  })
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })

  const massAfterMuc = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[01] COG after MUC 45°:', massAfterMuc.cog)
  await snapshot('after-muc-45')

  // Test 2: Now try transformInstance (ignores constraints) — apply 45° additional rotation
  const cos45 = Math.cos(Math.PI / 4)
  const sin45 = Math.sin(Math.PI / 4)
  await api.v1.assembly.transformInstance({
    id: asmId,
    instanceIds: [inst2],
    matrix: [
      [cos45, -sin45, 0, 0],
      [sin45, cos45, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })
  const massAfterTI = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[01] COG after transformInstance 45°:', massAfterTI.cog)
  await snapshot('after-transformInstance')

  // Test 3: Try MUC again — does the constraint still work after transformInstance?
  await api.v1.assembly.startMovingUnderConstraints({
    id: asmId, instanceIds: [inst2], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
  })
  // Try identity move to see if it snaps back or stays
  await api.v1.assembly.moveUnderConstraints({ id: asmId })
  const massAfterMucIdentity = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[01] COG after MUC identity (post-TI):', massAfterMucIdentity.cog)

  // Now try rotating 90°
  await api.v1.assembly.moveUnderConstraints({
    id: asmId,
    rotation: { xDir: [0, -1, 0], yDir: [1, 0, 0], zDir: [0, 0, 1] },
  })
  const massAfterMuc90 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[01] COG after MUC 90° (post-TI):', massAfterMuc90.cog)
  await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
  await snapshot('after-muc-90-post-ti')

  filewrite({
    original: massOriginal.cog,
    afterMuc45: massAfterMuc.cog,
    afterTransformInstance: massAfterTI.cog,
    afterMucIdentityPostTI: massAfterMucIdentity.cog,
    afterMuc90PostTI: massAfterMuc90.cog,
  }, 'workflow-vs-ti')

  return { inst2 }
}
