export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SingularTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result

  // Test 1: Zero matrix (singular)
  const r1 = await api.v1.common.transformObjectWithMatrix({
    id: boxId,
    matrix: [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[09] zero matrix - result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages && r1.messages.length > 0) {
    console.log('[09] zero matrix messages:', JSON.stringify(r1.messages))
  }
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'zero-matrix-response')

  // Test 2: Projection matrix (rank-deficient — projects onto XY plane)
  const r2 = await api.v1.common.transformObjectWithMatrix({
    id: boxId,
    matrix: [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[09] projection matrix - result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages && r2.messages.length > 0) {
    console.log('[09] projection messages:', JSON.stringify(r2.messages))
  }
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'projection-matrix-response')

  // Test 3: Wrong bottom row [0,0,0,0] instead of [0,0,0,1]
  const r3 = await api.v1.common.transformObjectWithMatrix({
    id: boxId,
    matrix: [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ],
  })
  console.log('[09] bad bottom row - result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages && r3.messages.length > 0) {
    console.log('[09] bad bottom row messages:', JSON.stringify(r3.messages))
  }
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'bad-bottom-row-response')

  return { partId, eifId, boxId }
}
