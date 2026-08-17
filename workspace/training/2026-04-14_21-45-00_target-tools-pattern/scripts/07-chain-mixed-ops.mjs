// Test: Chain different boolean types on the same target ID
// union → subtraction → intersection → merge, all on the same target
// Verifies that target ID remains stable across mixed operations
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ChainMixed' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Base target
  const target = (await api.v1.solid.box({ id: eifId, length: 100, width: 80, height: 60 })).result
  console.log('[07] target ID:', target)

  // 1. Union — add a box on top
  const addBox = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 30, translation: [30, 20, 60] })).result
  const r1 = await api.v1.solid.union({ id: eifId, target, tools: [addBox] })
  console.log('[07] after union: result=', r1.result, 'same target=', r1.result === target, 'maxLevel=', r1.maxLevel)

  // 2. Subtraction — cut a cylinder hole
  const hole = (await api.v1.solid.cylinder({ id: eifId, diameter: 20, height: 100, translation: [50, 40, -10] })).result
  const r2 = await api.v1.solid.subtraction({ id: eifId, target, tools: [hole] })
  console.log('[07] after sub: result=', r2.result, 'same target=', r2.result === target, 'maxLevel=', r2.maxLevel)

  // 3. Intersection — clip to a sphere
  const sphere = (await api.v1.solid.sphere({ id: eifId, diameter: 120, translation: [50, 40, 30] })).result
  const r3 = await api.v1.solid.intersection({ id: eifId, target, tools: [sphere] })
  console.log('[07] after intersection: result=', r3.result, 'same target=', r3.result === target, 'maxLevel=', r3.maxLevel)

  // 4. Merge — add another box (not union — just merge)
  const mergeBox = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30, translation: [80, 60, 0] })).result
  const r4 = await api.v1.solid.merge({ id: eifId, target, tools: [mergeBox] })
  console.log('[07] after merge: result=', r4.result, 'same target=', r4.result === target, 'maxLevel=', r4.maxLevel)

  filewrite({
    targetId: target,
    union: { result: r1.result, sameTarget: r1.result === target },
    subtraction: { result: r2.result, sameTarget: r2.result === target },
    intersection: { result: r3.result, sameTarget: r3.result === target },
    merge: { result: r4.result, sameTarget: r4.result === target }
  }, 'chain-results')

  await snapshot('chain-final')
  return { partId }
}
