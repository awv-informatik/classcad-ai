export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeInverted' })).result

  // tDiameter > bDiameter (inverted cone — wider at top)
  const r = await api.v1.part.cone({ id: partId, name: 'Inverted', bDiameter: 20, tDiameter: 60, height: 80 })
  console.log('[07] inverted result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'inverted-response')

  await snapshot('inverted')
  return { partId, coneId: r.result }
}
