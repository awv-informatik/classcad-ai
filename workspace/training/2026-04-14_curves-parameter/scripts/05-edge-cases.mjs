// Test edge cases: empty array, wrong ID types (part ID, EIF ID, solid ID)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeCaseTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create a solid to have a solid ID to test with
  const boxId = (await api.v1.solid.box({ id: eifId, length: 20, width: 20, height: 20 })).result
  console.log('[05] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  // Test A: empty array
  const resultA = await api.v1.solid.extrusion({
    id: eifId,
    direction: [0, 0, 30],
    curves: [],
  })
  console.log('[05A] empty array result:', resultA.result, 'maxLevel:', resultA.maxLevel)
  if (resultA.messages?.length) {
    console.log('[05A] messages:', JSON.stringify(resultA.messages.map(m => m.message)))
  }

  // Test B: part ID as curves
  const resultB = await api.v1.solid.extrusion({
    id: eifId,
    direction: [0, 0, 30],
    curves: partId,
  })
  console.log('[05B] part ID as curves result:', resultB.result, 'maxLevel:', resultB.maxLevel)
  if (resultB.messages?.length) {
    console.log('[05B] messages:', JSON.stringify(resultB.messages.map(m => m.message)))
  }

  // Test C: EIF ID as curves
  const resultC = await api.v1.solid.extrusion({
    id: eifId,
    direction: [0, 0, 30],
    curves: eifId,
  })
  console.log('[05C] EIF ID as curves result:', resultC.result, 'maxLevel:', resultC.maxLevel)
  if (resultC.messages?.length) {
    console.log('[05C] messages:', JSON.stringify(resultC.messages.map(m => m.message)))
  }

  // Test D: solid ID as curves
  const resultD = await api.v1.solid.extrusion({
    id: eifId,
    direction: [0, 0, 30],
    curves: boxId,
  })
  console.log('[05D] solid ID as curves result:', resultD.result, 'maxLevel:', resultD.maxLevel)
  if (resultD.messages?.length) {
    console.log('[05D] messages:', JSON.stringify(resultD.messages.map(m => m.message)))
  }

  filewrite({
    testA: { curves: '[]', result: resultA.result, maxLevel: resultA.maxLevel, messages: resultA.messages },
    testB: { curves: 'partId', result: resultB.result, maxLevel: resultB.maxLevel, messages: resultB.messages },
    testC: { curves: 'eifId', result: resultC.result, maxLevel: resultC.maxLevel, messages: resultC.messages },
    testD: { curves: 'boxId', result: resultD.result, maxLevel: resultD.maxLevel, messages: resultD.messages },
  }, 'edge-cases')

  return { partId }
}
