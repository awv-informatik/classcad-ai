// Edge case: bulges array shorter or longer than points array
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BulgeMismatch' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Test 1: fewer bulges than points
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'FewerBulges' })).result
  const r1 = await api.v1.curve.polyline2d({
    id: s1,
    points: [
      [0, 0, 0],
      [30, 0, 0],
      [30, 20, 0],
      [0, 20, 0],
    ],
    bulges: [0, 0.5], // only 2 bulges for 4 points
    close: true,
  })
  console.log('[08a] fewer bulges result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[08a] messages:', JSON.stringify(r1.messages))

  // Test 2: more bulges than points
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'MoreBulges' })).result
  const r2 = await api.v1.curve.polyline2d({
    id: s2,
    points: [
      [0, 0, 0],
      [30, 0, 0],
    ],
    bulges: [0, 0, 0.5, 1], // 4 bulges for 2 points
  })
  console.log('[08b] more bulges result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[08b] messages:', JSON.stringify(r2.messages))

  filewrite(
    {
      fewerBulges: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
      moreBulges: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
    },
    'bulge-mismatch-response',
  )

  return { partId }
}
