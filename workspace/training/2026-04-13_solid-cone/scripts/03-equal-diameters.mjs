// Equal diameters — bDiameter == tDiameter (should produce cylinder-like shape)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EqualDiam' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const r = await api.v1.solid.cone({ id: eifId, height: 100, bDiameter: 50, tDiameter: 50 })
  console.log('[03] equal diameters result:', r.result, 'maxLevel:', r.maxLevel)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'equal-diam-response')

  await snapshot('equal-diameters')
  return { partId, eifId, coneId: r.result }
}
