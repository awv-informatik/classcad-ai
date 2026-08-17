export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GearEdge' })).result

  const mkTemplate = async (name) => {
    const tpl = (await api.v1.assembly.partTemplate({ name })).result
    await api.v1.part.cylinder({ id: tpl, name: 'Cyl', height: 10, diameter: 20 })
    const wcs = (await api.v1.part.workCSys({
      id: tpl, name: 'Axis', origin: [0, 0, 5],
      xDirection: [1, 0, 0], yDirection: [0, 1, 0],
    })).result
    return { tpl, wcs }
  }

  const t1 = await mkTemplate('A')
  const t2 = await mkTemplate('B')
  const t3 = await mkTemplate('C')

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: t1.tpl, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: t2.tpl, ownerId: asmId, name: 'I2', transformation: [[25, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: t3.tpl, ownerId: asmId, name: 'I3', transformation: [[-25, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: t1.wcs } })
  const rev1 = (await api.v1.assembly.revolute({ id: asmId, name: 'Rev1', mate1: { path: [inst1], csys: t1.wcs }, mate2: { path: [inst2], csys: t2.wcs } })).result
  const rev2 = (await api.v1.assembly.revolute({ id: asmId, name: 'Rev2', mate1: { path: [inst1], csys: t1.wcs }, mate2: { path: [inst3], csys: t3.wcs } })).result

  const results = {}

  // Test 1: negative ratio
  const g1 = await api.v1.assembly.gear({ id: asmId, name: 'NegRatio', constr1Id: rev1, constr2Id: rev2, ratio: -1 })
  console.log('[03] negative ratio:', g1.result, 'maxLevel:', g1.maxLevel)
  results.negativeRatio = { result: g1.result, messages: g1.messages, maxLevel: g1.maxLevel }

  // Test 2: ratio = 0
  const g2 = await api.v1.assembly.gear({ id: asmId, name: 'ZeroRatio', constr1Id: rev1, constr2Id: rev2, ratio: 0 })
  console.log('[03] zero ratio:', g2.result, 'maxLevel:', g2.maxLevel)
  results.zeroRatio = { result: g2.result, messages: g2.messages, maxLevel: g2.maxLevel }

  // Test 3: very large ratio
  const g3 = await api.v1.assembly.gear({ id: asmId, name: 'BigRatio', constr1Id: rev1, constr2Id: rev2, ratio: 100 })
  console.log('[03] large ratio:', g3.result, 'maxLevel:', g3.maxLevel)
  results.largeRatio = { result: g3.result, messages: g3.messages, maxLevel: g3.maxLevel }

  // Test 4: same constraint for both
  const g4 = await api.v1.assembly.gear({ id: asmId, name: 'SameTwice', constr1Id: rev1, constr2Id: rev1 })
  console.log('[03] same constr:', g4.result, 'maxLevel:', g4.maxLevel)
  results.sameConstraint = { result: g4.result, messages: g4.messages, maxLevel: g4.maxLevel }

  // Test 5: invalid constraint ID
  const g5 = await api.v1.assembly.gear({ id: asmId, name: 'BadId', constr1Id: 999999, constr2Id: rev2 })
  console.log('[03] invalid id:', g5.result, 'maxLevel:', g5.maxLevel)
  results.invalidId = { result: g5.result, messages: g5.messages, maxLevel: g5.maxLevel }

  // Test 6: missing constr1Id
  const g6 = await api.v1.assembly.gear({ id: asmId, name: 'NoConstr1', constr2Id: rev2 })
  console.log('[03] missing constr1Id:', g6.result, 'maxLevel:', g6.maxLevel)
  results.missingConstr1 = { result: g6.result, messages: g6.messages, maxLevel: g6.maxLevel }

  // Test 7: using fastenedOrigin constraint (0 DOF, no rotation) as constr
  const fo = (await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO2', mate1: { path: [inst2], csys: t2.wcs } })).result
  const g7 = await api.v1.assembly.gear({ id: asmId, name: 'WithFO', constr1Id: fo, constr2Id: rev2 })
  console.log('[03] with fastenedOrigin:', g7.result, 'maxLevel:', g7.maxLevel)
  results.withFastenedOrigin = { result: g7.result, messages: g7.messages, maxLevel: g7.maxLevel }

  filewrite(results, 'edge-cases')
  return results
}
