export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DupTypes' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })
  await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT'] })

  // Duplicate types in request
  const r = await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP', 'TOP', 'FRONT'] })
  console.log('[09] duplicate types result count:', r.result?.length, '(expected 3?)')
  console.log('[09] maxLevel:', r.maxLevel)
  filewrite(r.result, 'duplicate-types')

  return { partId }
}
