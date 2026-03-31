export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Errors' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Err' })).result

  // Wrong ID type: pass part ID instead of shape ID
  const r1 = await api.v1.curve.line({ id: partId, startPos: [0, 0, 0], endPos: [10, 0, 0] })
  console.log('[06] partId as id:', r1.maxLevel, JSON.stringify(r1.messages))

  // Wrong ID type: pass EI ID
  const r2 = await api.v1.curve.line({ id: eifId, startPos: [0, 0, 0], endPos: [10, 0, 0] })
  console.log('[06] eifId as id:', r2.maxLevel, JSON.stringify(r2.messages))

  // Missing startPos
  const r3 = await api.v1.curve.line({ id: shapeId, endPos: [10, 0, 0] })
  console.log('[06] missing startPos:', r3.maxLevel, JSON.stringify(r3.messages))

  // Missing endPos
  const r4 = await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0] })
  console.log('[06] missing endPos:', r4.maxLevel, JSON.stringify(r4.messages))

  // Missing id
  const r5 = await api.v1.curve.line({ startPos: [0, 0, 0], endPos: [10, 0, 0] })
  console.log('[06] missing id:', r5.maxLevel, JSON.stringify(r5.messages))

  // Non-existent ID
  const r6 = await api.v1.curve.line({ id: 99999, startPos: [0, 0, 0], endPos: [10, 0, 0] })
  console.log('[06] bad id:', r6.maxLevel, JSON.stringify(r6.messages))

  filewrite({
    partIdAsId: { maxLevel: r1.maxLevel, messages: r1.messages },
    eifIdAsId: { maxLevel: r2.maxLevel, messages: r2.messages },
    missingStartPos: { maxLevel: r3.maxLevel, messages: r3.messages },
    missingEndPos: { maxLevel: r4.maxLevel, messages: r4.messages },
    missingId: { maxLevel: r5.maxLevel, messages: r5.messages },
    badId: { maxLevel: r6.maxLevel, messages: r6.messages },
  }, 'error-cases')

  return { partId }
}
