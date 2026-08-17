// 08 - Error cases: wrong ID type (part ID, EI ID instead of shape ID)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ErrTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  // Wrong: pass part ID
  const r1 = await api.v1.curve.arcBy3Points({
    id: partId, startPos: [0, 0, 0], midPos: [25, 25, 0], endPos: [50, 0, 0],
  })
  console.log('[08] partId result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[08] partId msgs:', JSON.stringify(r1.messages))

  // Wrong: pass EI ID
  const r2 = await api.v1.curve.arcBy3Points({
    id: eifId, startPos: [0, 0, 0], midPos: [25, 25, 0], endPos: [50, 0, 0],
  })
  console.log('[08] eifId result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[08] eifId msgs:', JSON.stringify(r2.messages))

  filewrite({
    partIdError: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    eifIdError: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'wrong-id-responses')

  return { partId }
}
