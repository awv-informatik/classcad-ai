// 05 - Edge case: coincident points (start==mid, start==end, all equal)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CoincidentArc' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Arcs' })).result

  // Case A: start == mid
  const rA = await api.v1.curve.arcBy3Points({
    id: shapeId,
    startPos: [0, 0, 0],
    midPos: [0, 0, 0],
    endPos: [50, 0, 0],
  })
  console.log('[05A] start==mid result:', rA.result, 'maxLevel:', rA.maxLevel)
  console.log('[05A] messages:', JSON.stringify(rA.messages))

  // Case B: start == end
  const rB = await api.v1.curve.arcBy3Points({
    id: shapeId,
    startPos: [0, 0, 0],
    midPos: [25, 25, 0],
    endPos: [0, 0, 0],
  })
  console.log('[05B] start==end result:', rB.result, 'maxLevel:', rB.maxLevel)
  console.log('[05B] messages:', JSON.stringify(rB.messages))

  // Case C: all three equal
  const rC = await api.v1.curve.arcBy3Points({
    id: shapeId,
    startPos: [10, 10, 0],
    midPos: [10, 10, 0],
    endPos: [10, 10, 0],
  })
  console.log('[05C] all-equal result:', rC.result, 'maxLevel:', rC.maxLevel)
  console.log('[05C] messages:', JSON.stringify(rC.messages))

  filewrite({
    caseA: { result: rA.result, maxLevel: rA.maxLevel, messages: rA.messages },
    caseB: { result: rB.result, maxLevel: rB.maxLevel, messages: rB.messages },
    caseC: { result: rC.result, maxLevel: rC.maxLevel, messages: rC.messages },
  }, 'coincident-responses')

  await snapshot('coincident')
  return { partId }
}
