// Test: Are the parameter signatures identical across union, subtraction, intersection, merge?
// Each call: { id, target, tools, keepTools? }
// Expected: All 4 succeed with identical patterns, return target ID, maxLevel=31
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SigTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const results = {}

  // --- UNION ---
  const u1 = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  const u2 = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 60, translation: [50, 20, 0] })).result
  const rUnion = await api.v1.solid.union({ id: eifId, target: u1, tools: [u2] })
  results.union = { result: rUnion.result, maxLevel: rUnion.maxLevel, targetReturned: rUnion.result === u1 }
  console.log('[01] union:', rUnion.result === u1 ? '✓ target returned' : '✗', 'maxLevel:', rUnion.maxLevel)

  // --- SUBTRACTION ---
  const s1 = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  const s2 = (await api.v1.solid.cylinder({ id: eifId, diameter: 20, height: 60, translation: [40, 30, -10] })).result
  const rSub = await api.v1.solid.subtraction({ id: eifId, target: s1, tools: [s2] })
  results.subtraction = { result: rSub.result, maxLevel: rSub.maxLevel, targetReturned: rSub.result === s1 }
  console.log('[01] subtraction:', rSub.result === s1 ? '✓ target returned' : '✗', 'maxLevel:', rSub.maxLevel)

  // --- INTERSECTION ---
  const i1 = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  const i2 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 60, translation: [30, 15, -10] })).result
  const rInt = await api.v1.solid.intersection({ id: eifId, target: i1, tools: [i2] })
  results.intersection = { result: rInt.result, maxLevel: rInt.maxLevel, targetReturned: rInt.result === i1 }
  console.log('[01] intersection:', rInt.result === i1 ? '✓ target returned' : '✗', 'maxLevel:', rInt.maxLevel)

  // --- MERGE ---
  const m1 = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  const m2 = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 60, translation: [50, 20, 0] })).result
  const rMerge = await api.v1.solid.merge({ id: eifId, target: m1, tools: [m2] })
  results.merge = { result: rMerge.result, maxLevel: rMerge.maxLevel, targetReturned: rMerge.result === m1 }
  console.log('[01] merge:', rMerge.result === m1 ? '✓ target returned' : '✗', 'maxLevel:', rMerge.maxLevel)

  filewrite(results, 'signature-results')
  await snapshot('all-four-ops')
  return { partId }
}
