export default async function (api, { snapshot, filewrite }) {
  // Create assembly with two part templates with different geometry
  const asmId = (await api.v1.assembly.create({})).result
  console.log('[01] asmId:', asmId)

  // Template A: box 40x30x20
  const tplA = (await api.v1.assembly.partTemplate({ name: 'PlateA' })).result
  const boxA = (await api.v1.part.box({ id: tplA, name: 'BoxA', length: 40, width: 30, height: 20 })).result
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'MateA', origin: [40, 15, 10], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  console.log('[01] tplA:', tplA, 'boxA:', boxA, 'wcsA:', wcsA)

  // Template B: box 60x20x25
  const tplB = (await api.v1.assembly.partTemplate({ name: 'PlateB' })).result
  const boxB = (await api.v1.part.box({ id: tplB, name: 'BoxB', length: 60, width: 20, height: 25 })).result
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'MateB', origin: [0, 10, 12.5], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  console.log('[01] tplB:', tplB, 'boxB:', boxB, 'wcsB:', wcsB)

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create two instances at different positions
  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Inst1',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Inst2',
    transformation: [[100, 50, 30], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[01] inst1:', inst1, 'inst2:', inst2)

  // Snapshot BEFORE fastened
  await snapshot('before-fastened')

  // Measure COG before
  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[01] COG before:', JSON.stringify(massBefore?.centerOfGravity))

  // Create fastened constraint: align inst2's MateB to inst1's MateA
  const r = await api.v1.assembly.fastened({
    id: asmId,
    name: 'F1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })
  console.log('[01] fastened result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'fastened-response')

  // Snapshot AFTER fastened
  await snapshot('after-fastened')

  // Measure COG after
  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[01] COG after:', JSON.stringify(massAfter?.centerOfGravity))

  filewrite({ massBefore, massAfter }, 'mass-comparison')

  return { asmId, tplA, tplB, inst1, inst2, wcsA, wcsB, fastenedId: r.result }
}
