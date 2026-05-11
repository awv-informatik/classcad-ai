// Check if get* APIs return the current DOF value after update3DConstraintValue
export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'B', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'B', length: 80, width: 15, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tplC = (await api.v1.assembly.partTemplate({ name: 'Piston' })).result
  await api.v1.part.box({ id: tplC, name: 'B', length: 20, width: 20, height: 40 })
  const wcsC = (await api.v1.part.workCSys({
    id: tplC, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm',
    transformation: [[0, 0, 15], [1, 0, 0], [0, 1, 0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tplC, ownerId: asmId, name: 'Piston',
    transformation: [[0, 50, 0], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Create revolute
  const revId = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 15,
  })).result

  // Create cylindrical
  const cylId = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'Cyl',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst3], csys: wcsC },
  })).result

  // BEFORE: get state
  const revBefore = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Rev' })).result
  console.log('[10] revolute BEFORE:', JSON.stringify(revBefore))

  const cylBefore = (await api.v1.assembly.getCylindrical({ id: asmId, name: 'Cyl' })).result
  console.log('[10] cylindrical BEFORE:', JSON.stringify(cylBefore))

  // Update DOF values
  await api.v1.assembly.update3DConstraintValue({ id: revId, name: 'Z_ROTATION', value: '45deg' })
  await api.v1.assembly.update3DConstraintValue({ id: cylId, name: 'Z_OFFSET', value: 50 })
  await api.v1.assembly.update3DConstraintValue({ id: cylId, name: 'Z_ROTATION', value: '30deg' })

  // AFTER: get state
  const revAfter = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Rev' })).result
  console.log('[10] revolute AFTER:', JSON.stringify(revAfter))

  const cylAfter = (await api.v1.assembly.getCylindrical({ id: asmId, name: 'Cyl' })).result
  console.log('[10] cylindrical AFTER:', JSON.stringify(cylAfter))

  filewrite({
    revolute: { before: revBefore, after: revAfter },
    cylindrical: { before: cylBefore, after: cylAfter },
  }, 'state-comparison')

  await snapshot('after-updates')
  return { revId, cylId }
}
