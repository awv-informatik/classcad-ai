export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeEqualDiam' })).result

  // bDiameter = tDiameter (should produce a cylinder-like shape)
  const r = await api.v1.part.cone({ id: partId, name: 'CylCone', bDiameter: 50, tDiameter: 50, height: 80 })
  console.log('[06] equal diameters result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'equal-diams-response')

  await snapshot('equal-diams')
  return { partId, coneId: r.result }
}
