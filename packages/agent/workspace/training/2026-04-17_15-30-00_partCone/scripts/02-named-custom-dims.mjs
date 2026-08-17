export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeCustom' })).result
  const r = await api.v1.part.cone({
    id: partId,
    name: 'MyCone',
    bDiameter: 80,
    tDiameter: 20,
    height: 120,
  })

  console.log('[02] cone result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'cone-custom-response')

  await snapshot('custom')
  return { partId, coneId: r.result }
}
