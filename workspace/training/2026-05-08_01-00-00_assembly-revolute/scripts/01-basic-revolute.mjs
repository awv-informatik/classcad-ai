export default async function (api, { snapshot, filewrite }) {
  // Assembly with two templates: a base plate and a hinged arm
  const asmId = (await api.v1.assembly.create({})).result
  console.log('[01] asmId:', asmId)

  // Template A: base plate 60x40x10
  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  const boxA = (await api.v1.part.box({ id: tplA, name: 'BoxA', length: 60, width: 40, height: 10 })).result
  // WCS at the hinge point — top-center-right edge
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'HingeA', origin: [60, 20, 10], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  console.log('[01] tplA:', tplA, 'wcsA:', wcsA)

  // Template B: arm 80x20x8
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  const boxB = (await api.v1.part.box({ id: tplB, name: 'BoxB', length: 80, width: 20, height: 8 })).result
  // WCS at the hinge end of the arm — left-center-bottom
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'HingeB', origin: [0, 10, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  console.log('[01] tplB:', tplB, 'wcsB:', wcsB)

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance 1: base at origin
  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'BaseInst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Instance 2: arm offset so we can see it move
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'ArmInst',
    transformation: [[100, 80, 50], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[01] inst1:', inst1, 'inst2:', inst2)

  await snapshot('before-revolute')

  // Measure COG before
  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[01] COG before:', JSON.stringify(massBefore?.centerOfGravity))

  // Create revolute constraint
  const r = await api.v1.assembly.revolute({
    id: asmId,
    name: 'Hinge1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })
  console.log('[01] revolute result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'revolute-response')

  await snapshot('after-revolute')

  // Measure COG after
  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[01] COG after:', JSON.stringify(massAfter?.centerOfGravity))

  filewrite({ massBefore, massAfter }, 'mass-comparison')

  // Read back constraint state
  const getR = await api.v1.assembly.getRevolute({ id: asmId, name: 'Hinge1' })
  console.log('[01] getRevolute result:', JSON.stringify(getR.result))
  filewrite(getR.result, 'getRevolute-state')

  return { asmId, tplA, tplB, inst1, inst2, wcsA, wcsB, revoluteId: r.result }
}
