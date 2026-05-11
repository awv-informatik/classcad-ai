export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly with one part template + two instances at known positions
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 30, width: 20, height: 15 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance at origin
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'AtOrigin',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Instance offset at X=60
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'AtX60',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await snapshot('before')

  // Measure COG before transform using assembly-level mass properties
  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[01] massBefore COG:', massBefore?.centerOfGravity)

  // Apply relative translation: move inst1 by [40, 20, 10]
  const r = await api.v1.assembly.transformInstance({
    id: inst1,
    transformation: [
      [1, 0, 0, 40],
      [0, 1, 0, 20],
      [0, 0, 1, 10],
      [0, 0, 0, 1],
    ],
  })
  console.log('[01] transformInstance result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[01] messages:', JSON.stringify(r.messages))

  await snapshot('after-translate-inst1')

  // Measure COG after
  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[01] massAfter COG:', massAfter?.centerOfGravity)

  filewrite({
    inst1, inst2,
    transformResult: { result: r.result, maxLevel: r.maxLevel, messages: r.messages },
    massBefore: massBefore?.centerOfGravity,
    massAfter: massAfter?.centerOfGravity,
  }, 'results')

  return { asmId, tplId, inst1, inst2 }
}
