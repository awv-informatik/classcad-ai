// Wrong ID type — pass part ID instead of shape ID
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InterpWrongId' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Pass EI ID instead of shape ID
  const r1 = await api.v1.curve.interpolationCurve({
    id: eifId,
    points: [[0, 0, 0], [10, 10, 0], [20, 0, 0]],
  })
  console.log('[08] eifId result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[08] eifId msgs:', JSON.stringify(r1.messages))

  // Pass part ID instead of shape ID
  const r2 = await api.v1.curve.interpolationCurve({
    id: partId,
    points: [[0, 0, 0], [10, 10, 0], [20, 0, 0]],
  })
  console.log('[08] partId result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[08] partId msgs:', JSON.stringify(r2.messages))

  filewrite({ eif: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, part: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel } }, '08-wrong-id')

  return { partId }
}
