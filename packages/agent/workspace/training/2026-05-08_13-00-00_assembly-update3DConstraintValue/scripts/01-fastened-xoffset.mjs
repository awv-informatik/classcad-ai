// Test update3DConstraintValue with X_OFFSET on a fastened constraint
export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'BoxA' })).result
  await api.v1.part.box({ id: tplA, name: 'B', length: 40, width: 30, height: 20 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'BoxB' })).result
  await api.v1.part.box({ id: tplB, name: 'B', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'A' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'B',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  // Ground inst1
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA },
  })

  // Fasten inst2 to inst1 with initial xOffset=50
  const fId = (await api.v1.assembly.fastened({
    id: asmId, name: 'Joint',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    xOffset: 50,
  })).result
  console.log('[01] fastened ID:', fId)

  // Measure initial position
  const mp1 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[01] BEFORE COG:', mp1.cog)

  await snapshot('before')

  // Update X_OFFSET via update3DConstraintValue
  const r = await api.v1.assembly.update3DConstraintValue({
    id: fId, name: 'X_OFFSET', value: 100,
  })
  console.log('[01] update3DConstraintValue result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-response')

  // Measure after
  const mp2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[01] AFTER COG:', mp2.cog)

  filewrite({ before: mp1.cog, after: mp2.cog }, 'cog-comparison')

  await snapshot('after')

  // Also verify via getFastened
  const state = (await api.v1.assembly.getFastened({ id: asmId, name: 'Joint' })).result
  console.log('[01] getFastened xOffset:', state.xOffset)
  filewrite(state, 'fastened-state')

  return { fId }
}
