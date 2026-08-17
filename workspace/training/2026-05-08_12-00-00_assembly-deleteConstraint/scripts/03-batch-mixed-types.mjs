export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Template A — base
  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'B', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Template B — arm
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'B', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm1',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm2',
    transformation: [[0, 60, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Ground inst1
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA },
  })).result

  // Fasten inst2
  const fastId = (await api.v1.assembly.fastened({
    id: asmId, name: 'FastJoint',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    xOffset: 80,
  })).result

  // Revolute on inst3
  const revId = (await api.v1.assembly.revolute({
    id: asmId, name: 'RevJoint',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst3], csys: wcsB },
    zOffset: 15,
  })).result

  console.log('[03] foId:', foId, 'fastId:', fastId, 'revId:', revId)

  await snapshot('before-batch-delete')

  // Batch delete: fastened + revolute in a single call
  const delR = await api.v1.assembly.deleteConstraint({ ids: [fastId, revId] })
  console.log('[03] batch delete result:', delR.result, 'maxLevel:', delR.maxLevel)
  filewrite({ result: delR.result, messages: delR.messages, maxLevel: delR.maxLevel }, 'batch-delete-response')

  await snapshot('after-batch-delete')

  // Verify both constraints are gone
  const getF = await api.v1.assembly.getFastened({ id: asmId, name: 'FastJoint' })
  const getR = await api.v1.assembly.getRevolute({ id: asmId, name: 'RevJoint' })
  console.log('[03] getFastened after:', getF.result, 'maxLevel:', getF.maxLevel)
  console.log('[03] getRevolute after:', getR.result, 'maxLevel:', getR.maxLevel)

  // Verify grounding still intact
  const getFo = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'Ground' })
  console.log('[03] getFastenedOrigin after:', getFo.result ? 'exists' : 'null', 'maxLevel:', getFo.maxLevel)

  return { asmId }
}
