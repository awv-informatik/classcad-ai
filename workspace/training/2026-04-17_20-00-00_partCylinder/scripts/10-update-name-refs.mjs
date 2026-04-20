export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylNameRef' })).result

  const wcsId = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [80, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Create at origin
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'OrigName', diameter: 60, height: 80 })).result
  await api.v1.part.box({ id: partId, name: 'RefBox', length: 30, width: 30, height: 30 })
  await snapshot('before-move')

  // Update: rename + move to WCS
  await api.v1.part.openFeature({ id: cylId })
  const r = await api.v1.part.updateCylinder({ id: cylId, name: 'RenamedCyl', references: [wcsId] })
  console.log('[10] rename+move result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'rename-move')
  await api.v1.part.closeFeature({ id: cylId })
  await snapshot('after-move')

  // Remove references (back to origin)
  await api.v1.part.openFeature({ id: cylId })
  const r2 = await api.v1.part.updateCylinder({ id: cylId, references: [] })
  console.log('[10] remove-ref result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'remove-ref')
  await api.v1.part.closeFeature({ id: cylId })
  await snapshot('after-remove-ref')

  return { partId, cylId }
}
