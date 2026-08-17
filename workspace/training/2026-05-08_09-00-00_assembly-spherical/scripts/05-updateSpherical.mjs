export default async function (api, { snapshot, filewrite }) {
  // Test updateSpherical: change yRotationLimits, rename, re-mate
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 40, width: 10, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  const tplC = (await api.v1.assembly.partTemplate({ name: 'Rod' })).result
  await api.v1.part.cylinder({ id: tplC, name: 'Cyl', height: 20, diameter: 6 })
  const wcsC = (await api.v1.part.workCSys({
    id: tplC, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Base'
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tplC, ownerId: asmId, name: 'Rod',
    transformation: [[0, 50, 0], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  // Create constraint without limits
  const sId = (await api.v1.assembly.spherical({
    id: asmId, name: 'Ball1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB }
  })).result
  console.log('[05] created:', sId)

  // State before update
  const before = (await api.v1.assembly.getSpherical({ id: asmId, name: 'Ball1' })).result
  console.log('[05] before:', JSON.stringify(before))

  // Update 1: add yRotationLimits
  const u1 = await api.v1.assembly.updateSpherical({
    id: sId,
    yRotationLimits: { max: '60deg' }
  })
  console.log('[05] update yRotLimits result:', u1.result, 'maxLevel:', u1.maxLevel)

  const after1 = (await api.v1.assembly.getSpherical({ id: asmId, name: 'Ball1' })).result
  console.log('[05] after yRotLimits:', JSON.stringify(after1))

  // Update 2: rename
  const u2 = await api.v1.assembly.updateSpherical({
    id: sId,
    name: 'BallJoint_Renamed'
  })
  console.log('[05] rename result:', u2.result, 'maxLevel:', u2.maxLevel)

  // Verify old name gone, new name works
  const gOld = await api.v1.assembly.getSpherical({ id: asmId, name: 'Ball1' })
  console.log('[05] old name lookup:', JSON.stringify(gOld.result), 'maxLevel:', gOld.maxLevel)
  const gNew = await api.v1.assembly.getSpherical({ id: asmId, name: 'BallJoint_Renamed' })
  console.log('[05] new name lookup:', JSON.stringify(gNew.result))

  // Update 3: change mate2 to inst3
  const cogBefore = (await api.v1.assembly.calculateMassProperties({ id: inst3 })).result
  console.log('[05] inst3 COG before remate:', JSON.stringify(cogBefore?.cog))

  const u3 = await api.v1.assembly.updateSpherical({
    id: sId,
    mate2: { path: [inst3], csys: wcsC }
  })
  console.log('[05] remate result:', u3.result, 'maxLevel:', u3.maxLevel)

  const cogAfter = (await api.v1.assembly.calculateMassProperties({ id: inst3 })).result
  console.log('[05] inst3 COG after remate:', JSON.stringify(cogAfter?.cog))

  // Update 4: remove yRotationLimits (pass null/VOID)
  const u4 = await api.v1.assembly.updateSpherical({
    id: sId,
    yRotationLimits: null
  })
  console.log('[05] remove limits result:', u4.result, 'maxLevel:', u4.maxLevel)

  const afterRemove = (await api.v1.assembly.getSpherical({ id: asmId, name: 'BallJoint_Renamed' })).result
  console.log('[05] after remove limits:', JSON.stringify(afterRemove))

  filewrite({
    before,
    afterLimits: after1,
    afterRename: gNew.result,
    oldNameResult: gOld.result,
    inst3CogBefore: cogBefore?.cog,
    inst3CogAfter: cogAfter?.cog,
    afterRemoveLimits: afterRemove
  }, 'updateSpherical-data')

  await snapshot('updateSpherical')
  return { asmId }
}
