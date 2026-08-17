// Test negative factor WITHOUT pre-snapshot (to isolate from recalc bug)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NegNoSnap' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Tri' })).result

  await api.v1.curve.line({ id: shapeId, startPos: [10, 0, 0], endPos: [40, 0, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [40, 0, 0], endPos: [20, 30, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [20, 30, 0], endPos: [10, 0, 0] })

  // NO snapshot before — test negative factor directly
  const r = await api.v1.curve.scaleShape({ id: shapeId, factor: -1.0 })
  console.log('[22] scaleShape -1.0 result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[22] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'neg1-no-snap-response')

  // Also try -2.0 on a fresh shape
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Tri2' })).result
  await api.v1.curve.line({ id: s2, startPos: [10, 0, 0], endPos: [40, 0, 0] })
  await api.v1.curve.line({ id: s2, startPos: [40, 0, 0], endPos: [20, 30, 0] })
  await api.v1.curve.line({ id: s2, startPos: [20, 30, 0], endPos: [10, 0, 0] })

  const r2 = await api.v1.curve.scaleShape({ id: s2, factor: -2.0 })
  console.log('[22] scaleShape -2.0 result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[22] messages -2:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'neg2-no-snap-response')

  // Also test -0.5
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'Tri3' })).result
  await api.v1.curve.line({ id: s3, startPos: [10, 0, 0], endPos: [40, 0, 0] })
  await api.v1.curve.line({ id: s3, startPos: [40, 0, 0], endPos: [20, 30, 0] })
  await api.v1.curve.line({ id: s3, startPos: [20, 30, 0], endPos: [10, 0, 0] })

  const r3 = await api.v1.curve.scaleShape({ id: s3, factor: -0.5 })
  console.log('[22] scaleShape -0.5 result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[22] messages -0.5:', JSON.stringify(r3.messages))
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'neg05-no-snap-response')

  return { partId }
}
